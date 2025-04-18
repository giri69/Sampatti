package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/types" // Changed from api to types
)

type DocumentHandler struct {
	documentService *service.DocumentService
}

func NewDocumentHandler(documentService *service.DocumentService) *DocumentHandler {
	return &DocumentHandler{documentService: documentService}
}

// Upload handles document upload
func (h *DocumentHandler) Upload(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Parse form data
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form data", "details": err.Error()})
		return
	}

	// Get file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required", "details": err.Error()})
		return
	}
	defer file.Close()

	// Read file data
	fileData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file", "details": err.Error()})
		return
	}

	// Parse other form fields
	documentType := c.PostForm("document_type")
	title := c.PostForm("title")
	description := c.PostForm("description")
	tagsStr := c.PostForm("tags")
	isEncryptedStr := c.PostForm("is_encrypted")
	accessibleToNomineesStr := c.PostForm("accessible_to_nominees")
	assetIDStr := c.PostForm("asset_id")

	// Parse tags
	var tags []string
	if tagsStr != "" {
		tags = strings.Split(tagsStr, ",")
		for i, tag := range tags {
			tags[i] = strings.TrimSpace(tag)
		}
	}

	// Parse boolean values
	isEncrypted, _ := strconv.ParseBool(isEncryptedStr)
	accessibleToNominees, _ := strconv.ParseBool(accessibleToNomineesStr)

	// Parse asset ID if provided
	var assetID *uuid.UUID
	if assetIDStr != "" {
		id, err := uuid.Parse(assetIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID", "details": err.Error()})
			return
		}
		assetID = &id
	}

	// Upload document
	doc, err := h.documentService.Upload(
		c.Request.Context(),
		userID,
		assetID,
		fileData,
		header.Filename,
		header.Size,
		header.Header.Get("Content-Type"),
		documentType,
		title,
		description,
		tags,
		isEncrypted,
		accessibleToNominees,
	)

	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrDocumentTooLarge) || errors.Is(err, service.ErrInvalidDocumentType) {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, doc)
}

// GetByID returns a specific document by ID
func (h *DocumentHandler) GetByID(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	docID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	doc, err := h.documentService.GetByID(c.Request.Context(), docID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrDocumentNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, doc)
}

// GetAll returns all documents for the authenticated user
func (h *DocumentHandler) GetAll(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	docs, err := h.documentService.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch documents", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, docs)
}

// Download returns the document file for download
func (h *DocumentHandler) Download(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	docID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	fileData, fileName, mimeType, err := h.documentService.Download(c.Request.Context(), docID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrDocumentNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, mimeType, fileData)
}

// Update handles updating document metadata
func (h *DocumentHandler) Update(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	docID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	var request struct {
		DocumentType         string   `json:"document_type" binding:"required"`
		Title                string   `json:"title" binding:"required"`
		Description          string   `json:"description"`
		Tags                 []string `json:"tags"`
		IsEncrypted          bool     `json:"is_encrypted"`
		AccessibleToNominees bool     `json:"accessible_to_nominees"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	err = h.documentService.Update(
		c.Request.Context(),
		docID,
		userID,
		request.DocumentType,
		request.Title,
		request.Description,
		request.Tags,
		request.IsEncrypted,
		request.AccessibleToNominees,
	)

	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrDocumentNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		} else if errors.Is(err, service.ErrInvalidDocumentType) {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "document updated successfully"})
}

// Delete handles deleting a document
func (h *DocumentHandler) Delete(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	docID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	if err := h.documentService.Delete(c.Request.Context(), docID, userID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrDocumentNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "document deleted successfully"})
}

// UpdateNomineeAccess updates which nominees can access a document
func (h *DocumentHandler) UpdateNomineeAccess(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	docID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid document ID"})
		return
	}

	var request struct {
		NomineeIDs []string `json:"nominee_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Parse nominee IDs
	nomineeIDs := make([]uuid.UUID, 0, len(request.NomineeIDs))
	for _, idStr := range request.NomineeIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid nominee ID", "details": err.Error()})
			return
		}
		nomineeIDs = append(nomineeIDs, id)
	}

	if err := h.documentService.UpdateNomineeAccess(c.Request.Context(), docID, userID, nomineeIDs); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrDocumentNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "nominee access updated successfully"})
}
