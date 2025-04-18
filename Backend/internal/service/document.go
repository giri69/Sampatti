package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
)

var (
	ErrDocumentNotFound    = errors.New("document not found")
	ErrDocumentTooLarge    = errors.New("document size exceeds limit")
	ErrInvalidDocumentType = errors.New("invalid document type")
)

const (
	// 10MB max file size
	MaxFileSize = 10 * 1024 * 1024
)

// Valid document types
var ValidDocumentTypes = map[string]bool{
	"Certificate": true,
	"Statement":   true,
	"KYC":         true,
	"Will":        true,
	"Insurance":   true,
	"Agreement":   true,
	"Receipt":     true,
	"Other":       true,
}

type DocumentService struct {
	documentRepo   *postgres.DocumentRepository
	storageService *StorageService
}

func NewDocumentService(documentRepo *postgres.DocumentRepository, storageService *StorageService) *DocumentService {
	return &DocumentService{
		documentRepo:   documentRepo,
		storageService: storageService,
	}
}

// Upload handles file upload and document creation
func (s *DocumentService) Upload(
	ctx context.Context,
	userID uuid.UUID,
	assetID *uuid.UUID,
	fileData []byte,
	fileName string,
	fileSize int64,
	mimeType string,
	documentType string,
	title string,
	description string,
	tags []string,
	isEncrypted bool,
	accessibleToNominees bool,
) (*model.Document, error) {
	// Validate file size
	if fileSize > MaxFileSize {
		return nil, ErrDocumentTooLarge
	}

	// Validate document type
	if !ValidDocumentTypes[documentType] {
		return nil, ErrInvalidDocumentType
	}

	// Upload file to R2
	storageKey, err := s.storageService.Upload(ctx, fileData, fileName, mimeType, isEncrypted)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Create document record
	doc := &model.Document{
		UserID:               userID,
		AssetID:              assetID,
		DocumentType:         documentType,
		Title:                title,
		Description:          description,
		Filename:             fileName,
		FileSize:             fileSize,
		MimeType:             mimeType,
		StorageKey:           storageKey,
		UploadDate:           time.Now(),
		Tags:                 tags,
		IsEncrypted:          isEncrypted,
		AccessibleToNominees: accessibleToNominees,
	}

	if err := s.documentRepo.Create(ctx, doc); err != nil {
		// Try to clean up the file if document creation fails
		_ = s.storageService.Delete(ctx, storageKey)
		return nil, fmt.Errorf("failed to create document record: %w", err)
	}

	return doc, nil
}

// GetByID retrieves a document by ID
func (s *DocumentService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.Document, error) {
	doc, err := s.documentRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrDocumentNotFound
	}

	// Verify ownership
	if doc.UserID != userID {
		return nil, ErrUnauthorized
	}

	return doc, nil
}

// GetByUserID retrieves all documents for a user
func (s *DocumentService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Document, error) {
	return s.documentRepo.GetByUserID(ctx, userID)
}

// GetByAssetID retrieves all documents for an asset
func (s *DocumentService) GetByAssetID(ctx context.Context, assetID uuid.UUID, userID uuid.UUID) ([]model.Document, error) {
	docs, err := s.documentRepo.GetByAssetID(ctx, assetID)
	if err != nil {
		return nil, err
	}

	// Filter by user ID for security
	filteredDocs := make([]model.Document, 0)
	for _, doc := range docs {
		if doc.UserID == userID {
			filteredDocs = append(filteredDocs, doc)
		}
	}

	return filteredDocs, nil
}

// Download retrieves the file content for a document
func (s *DocumentService) Download(ctx context.Context, id uuid.UUID, userID uuid.UUID) ([]byte, string, string, error) {
	doc, err := s.documentRepo.GetByID(ctx, id)
	if err != nil {
		return nil, "", "", ErrDocumentNotFound
	}

	// Verify ownership
	if doc.UserID != userID {
		return nil, "", "", ErrUnauthorized
	}

	// Download file from R2
	fileData, err := s.storageService.Download(ctx, doc.StorageKey)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to download file: %w", err)
	}

	return fileData, doc.Filename, doc.MimeType, nil
}

// GetDownloadURL generates a pre-signed URL for direct file download
func (s *DocumentService) GetDownloadURL(ctx context.Context, id uuid.UUID, userID uuid.UUID) (string, string, error) {
	doc, err := s.documentRepo.GetByID(ctx, id)
	if err != nil {
		return "", "", ErrDocumentNotFound
	}

	// Verify ownership
	if doc.UserID != userID {
		return "", "", ErrUnauthorized
	}

	// Generate pre-signed URL (valid for 15 minutes)
	url, err := s.storageService.GetSignedURL(ctx, doc.StorageKey, 15*time.Minute)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate download URL: %w", err)
	}

	return url, doc.Filename, nil
}

// Update updates document metadata
func (s *DocumentService) Update(
	ctx context.Context,
	id uuid.UUID,
	userID uuid.UUID,
	documentType string,
	title string,
	description string,
	tags []string,
	isEncrypted bool,
	accessibleToNominees bool,
) error {
	// Verify document exists and user owns it
	doc, err := s.documentRepo.GetByID(ctx, id)
	if err != nil {
		return ErrDocumentNotFound
	}

	if doc.UserID != userID {
		return ErrUnauthorized
	}

	// Validate document type
	if !ValidDocumentTypes[documentType] {
		return ErrInvalidDocumentType
	}

	// Update document
	doc.DocumentType = documentType
	doc.Title = title
	doc.Description = description
	doc.Tags = tags
	doc.IsEncrypted = isEncrypted
	doc.AccessibleToNominees = accessibleToNominees

	return s.documentRepo.Update(ctx, doc)
}

// Delete removes a document and its file
func (s *DocumentService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// Verify document exists and user owns it
	doc, err := s.documentRepo.GetByID(ctx, id)
	if err != nil {
		return ErrDocumentNotFound
	}

	if doc.UserID != userID {
		return ErrUnauthorized
	}

	// Delete file from R2
	err = s.storageService.Delete(ctx, doc.StorageKey)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	// Delete document record
	return s.documentRepo.Delete(ctx, id)
}

// UpdateNomineeAccess updates which nominees can access a document
func (s *DocumentService) UpdateNomineeAccess(ctx context.Context, docID uuid.UUID, userID uuid.UUID, nomineeIDs []uuid.UUID) error {
	// Verify document exists and user owns it
	doc, err := s.documentRepo.GetByID(ctx, docID)
	if err != nil {
		return ErrDocumentNotFound
	}

	if doc.UserID != userID {
		return ErrUnauthorized
	}

	// Update nominee access
	return s.documentRepo.UpdateNomineeAccess(ctx, docID, nomineeIDs)
}

// GetNomineeDocuments retrieves documents a nominee has access to
func (s *DocumentService) GetNomineeDocuments(ctx context.Context, nomineeID uuid.UUID) ([]model.Document, error) {
	return s.documentRepo.GetNomineeDocuments(ctx, nomineeID)
}
