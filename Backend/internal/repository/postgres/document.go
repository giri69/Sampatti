package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/sampatti/internal/model"
)

type DocumentRepository struct {
	db *sqlx.DB
}

func NewDocumentRepository(db *sqlx.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

func (r *DocumentRepository) Create(ctx context.Context, doc *model.Document) error {
	query := `
		INSERT INTO documents (
			id, user_id, asset_id, document_type, title, description,
			filename, file_size, mime_type, storage_key, upload_date,
			tags, is_encrypted, accessible_to_nominees
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		)
	`

	doc.ID = uuid.New()
	doc.UploadDate = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		query,
		doc.ID,
		doc.UserID,
		doc.AssetID,
		doc.DocumentType,
		doc.Title,
		doc.Description,
		doc.Filename,
		doc.FileSize,
		doc.MimeType,
		doc.StorageKey,
		doc.UploadDate,
		pq.Array(doc.Tags),
		doc.IsEncrypted,
		doc.AccessibleToNominees,
	)

	return err
}

func (r *DocumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Document, error) {
	var doc model.Document
	query := `
		SELECT id, user_id, asset_id, document_type, title, description,
			filename, file_size, mime_type, storage_key, upload_date,
			tags, is_encrypted, accessible_to_nominees
		FROM documents
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &doc, query, id)
	if err != nil {
		return nil, err
	}

	return &doc, nil
}

func (r *DocumentRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Document, error) {
	var docs []model.Document
	query := `
		SELECT id, user_id, asset_id, document_type, title, description,
			filename, file_size, mime_type, storage_key, upload_date,
			tags, is_encrypted, accessible_to_nominees
		FROM documents
		WHERE user_id = $1
		ORDER BY upload_date DESC
	`

	err := r.db.SelectContext(ctx, &docs, query, userID)
	if err != nil {
		return nil, err
	}

	return docs, nil
}

func (r *DocumentRepository) GetByAssetID(ctx context.Context, assetID uuid.UUID) ([]model.Document, error) {
	var docs []model.Document
	query := `
		SELECT id, user_id, asset_id, document_type, title, description,
			filename, file_size, mime_type, storage_key, upload_date,
			tags, is_encrypted, accessible_to_nominees
		FROM documents
		WHERE asset_id = $1
		ORDER BY upload_date DESC
	`

	err := r.db.SelectContext(ctx, &docs, query, assetID)
	if err != nil {
		return nil, err
	}

	return docs, nil
}

func (r *DocumentRepository) Update(ctx context.Context, doc *model.Document) error {
	query := `
		UPDATE documents SET
			document_type = $1,
			title = $2,
			description = $3,
			tags = $4,
			is_encrypted = $5,
			accessible_to_nominees = $6
		WHERE id = $7
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		doc.DocumentType,
		doc.Title,
		doc.Description,
		pq.Array(doc.Tags),
		doc.IsEncrypted,
		doc.AccessibleToNominees,
		doc.ID,
	)

	return err
}

func (r *DocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM documents WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *DocumentRepository) UpdateNomineeAccess(ctx context.Context, docID uuid.UUID, nomineeIDs []uuid.UUID) error {
	// First, remove all current access
	deleteQuery := `DELETE FROM document_nominee_access WHERE document_id = $1`
	_, err := r.db.ExecContext(ctx, deleteQuery, docID)
	if err != nil {
		return err
	}

	// Then add new access
	insertQuery := `
		INSERT INTO document_nominee_access (document_id, nominee_id)
		VALUES ($1, $2)
	`

	for _, nomineeID := range nomineeIDs {
		_, err := r.db.ExecContext(ctx, insertQuery, docID, nomineeID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *DocumentRepository) GetNomineeDocuments(ctx context.Context, nomineeID uuid.UUID) ([]model.Document, error) {
	var docs []model.Document
	query := `
		SELECT d.id, d.user_id, d.asset_id, d.document_type, d.title, 
               d.description, d.filename, d.file_size, d.mime_type, 
               d.storage_key, d.upload_date, d.tags, d.is_encrypted, 
               d.accessible_to_nominees
		FROM documents d
		JOIN document_nominee_access dna ON d.id = dna.document_id
		WHERE dna.nominee_id = $1 AND d.accessible_to_nominees = true
		ORDER BY d.upload_date DESC
	`

	err := r.db.SelectContext(ctx, &docs, query, nomineeID)
	if err != nil {
		return nil, err
	}

	return docs, nil
}
