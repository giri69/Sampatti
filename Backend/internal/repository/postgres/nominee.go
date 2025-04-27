package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/sampatti/internal/model"
)

type NomineeRepository struct {
	db *sqlx.DB
}

func NewNomineeRepository(db *sqlx.DB) *NomineeRepository {
	return &NomineeRepository{db: db}
}

func (r *NomineeRepository) Create(ctx context.Context, nominee *model.Nominee) error {
	query := `
		INSERT INTO nominees (
			id, user_id, name, email, phone_number, relationship,
			access_level, created_at, updated_at, status,
			emergency_access_code
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
	`

	nominee.ID = uuid.New()
	nominee.CreatedAt = time.Now()
	nominee.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		query,
		nominee.ID,
		nominee.UserID,
		nominee.Name,
		nominee.Email,
		nominee.PhoneNumber,
		nominee.Relationship,
		nominee.AccessLevel,
		nominee.CreatedAt,
		nominee.UpdatedAt,
		nominee.Status,
		nominee.EmergencyAccessCode,
	)

	return err
}

func (r *NomineeRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Nominee, error) {
	var nominee model.Nominee
	query := `
		SELECT id, user_id, name, email, phone_number, relationship,
			access_level, created_at, updated_at, status,
			emergency_access_code, last_access_date
		FROM nominees
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &nominee, query, id)
	if err != nil {
		return nil, err
	}

	return &nominee, nil
}

func (r *NomineeRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Nominee, error) {
	var nominees []model.Nominee
	query := `
		SELECT id, user_id, name, email, phone_number, relationship,
			access_level, created_at, updated_at, status,
			emergency_access_code, last_access_date
		FROM nominees
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	err := r.db.SelectContext(ctx, &nominees, query, userID)
	if err != nil {
		return nil, err
	}

	return nominees, nil
}

func (r *NomineeRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE nominees SET
			status = $1,
			updated_at = $2
		WHERE id = $3
	`

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, status, now, id)

	return err
}

func (r *NomineeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM nominees WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *NomineeRepository) GetAccessLogs(ctx context.Context, nomineeID uuid.UUID) ([]model.NomineeAccessLog, error) {
	var logs []model.NomineeAccessLog
	query := `
		SELECT id, nominee_id, date, action, ip_address, device_info
		FROM nominee_access_logs
		WHERE nominee_id = $1
		ORDER BY date DESC
	`

	err := r.db.SelectContext(ctx, &logs, query, nomineeID)
	if err != nil {
		return nil, err
	}

	return logs, nil
}

// Get nominees by nominee email
func (r *NomineeRepository) GetByNomineeEmail(ctx context.Context, email string) ([]model.Nominee, error) {
	var nominees []model.Nominee
	query := `
		SELECT id, user_id, name, email, phone_number, relationship,
			access_level, created_at, updated_at, status,
			emergency_access_code, last_access_date
		FROM nominees
		WHERE email = $1
	`

	err := r.db.SelectContext(ctx, &nominees, query, email)
	if err != nil {
		return nil, err
	}

	return nominees, nil
}

func (r *NomineeRepository) GetByEmailAndUserID(ctx context.Context, email string, userID uuid.UUID) (*model.Nominee, error) {
	var nominee model.Nominee
	query := `
		SELECT id, user_id, name, email, phone_number, relationship,
			access_level, created_at, updated_at, status,
			emergency_access_code, last_access_date
		FROM nominees
		WHERE email = $1 AND user_id = $2
	`

	err := r.db.GetContext(ctx, &nominee, query, email, userID)
	if err != nil {
		return nil, err
	}

	return &nominee, nil
}

// Update method
func (r *NomineeRepository) Update(ctx context.Context, nominee *model.Nominee) error {
	query := `
		UPDATE nominees SET
			name = $1,
			phone_number = $2,
			relationship = $3,
			access_level = $4,
			updated_at = $5,
			status = $6,
			emergency_access_code = $7
		WHERE id = $8
	`

	nominee.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		query,
		nominee.Name,
		nominee.PhoneNumber,
		nominee.Relationship,
		nominee.AccessLevel,
		nominee.UpdatedAt,
		nominee.Status,
		nominee.EmergencyAccessCode,
		nominee.ID,
	)

	return err
}

// UpdateEmergencyAccessCode - Method for updating just the emergency code
func (r *NomineeRepository) UpdateEmergencyAccessCode(ctx context.Context, nomineeID uuid.UUID, code string) error {
	query := `
		UPDATE nominees SET
			emergency_access_code = $1,
			updated_at = $2,
			status = 'Pending'
		WHERE id = $3
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, code, now, nomineeID)
	if err != nil {
		return fmt.Errorf("failed to update emergency access code: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("no rows affected when updating access code for nominee %s", nomineeID)
	}

	return nil
}

func (r *NomineeRepository) GetByEmail(ctx context.Context, email string) (*model.Nominee, error) {
	var nominee model.Nominee
	query := `
		SELECT id, user_id, name, email, phone_number, relationship,
			access_level, created_at, updated_at, status,
			emergency_access_code, last_access_date
		FROM nominees
		WHERE email = $1
		LIMIT 1
	`

	err := r.db.GetContext(ctx, &nominee, query, email)
	if err != nil {
		return nil, err
	}

	return &nominee, nil
}

func (r *NomineeRepository) LogAccess(ctx context.Context, log *model.NomineeAccessLog) error {
	query := `
		INSERT INTO nominee_access_logs (
			id, nominee_id, date, action, ip_address, device_info
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
	`

	log.ID = uuid.New()
	if log.Date.IsZero() {
		log.Date = time.Now()
	}

	_, err := r.db.ExecContext(
		ctx,
		query,
		log.ID,
		log.NomineeID,
		log.Date,
		log.Action,
		log.IPAddress,
		log.DeviceInfo,
	)

	if err != nil {
		return err
	}

	// Update last access date
	updateQuery := `
		UPDATE nominees SET
			last_access_date = $1
		WHERE id = $2
	`

	_, err = r.db.ExecContext(
		ctx,
		updateQuery,
		log.Date,
		log.NomineeID,
	)

	return err
}
