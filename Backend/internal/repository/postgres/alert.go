package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/sampatti/internal/model"
)

type AlertRepository struct {
	db *sqlx.DB
}

func NewAlertRepository(db *sqlx.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

func (r *AlertRepository) Create(ctx context.Context, alert *model.Alert) error {
	query := `
		INSERT INTO alerts (
			id, user_id, asset_id, alert_type, severity, message,
			created_at, expires_at, is_read, action_required
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
	`

	alert.ID = uuid.New()
	alert.CreatedAt = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		query,
		alert.ID,
		alert.UserID,
		alert.AssetID,
		alert.AlertType,
		alert.Severity,
		alert.Message,
		alert.CreatedAt,
		alert.ExpiresAt,
		alert.IsRead,
		alert.ActionRequired,
	)

	if err != nil {
		return err
	}

	// If there are actions, create them
	if len(alert.Actions) > 0 {
		for _, action := range alert.Actions {
			err = r.AddAction(ctx, alert.ID, &action)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *AlertRepository) AddAction(ctx context.Context, alertID uuid.UUID, action *model.AlertAction) error {
	query := `
		INSERT INTO alert_actions (
			id, alert_id, action_type, description, completed
		) VALUES (
			$1, $2, $3, $4, $5
		)
	`

	action.ID = uuid.New()
	action.AlertID = alertID

	_, err := r.db.ExecContext(
		ctx,
		query,
		action.ID,
		action.AlertID,
		action.ActionType,
		action.Description,
		action.Completed,
	)

	return err
}

func (r *AlertRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Alert, error) {
	var alert model.Alert
	query := `
		SELECT id, user_id, asset_id, alert_type, severity, message,
			created_at, expires_at, is_read, action_required
		FROM alerts
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &alert, query, id)
	if err != nil {
		return nil, err
	}

	// Get actions for this alert
	actionsQuery := `
		SELECT id, alert_id, action_type, description, completed
		FROM alert_actions
		WHERE alert_id = $1
	`

	var actions []model.AlertAction
	err = r.db.SelectContext(ctx, &actions, actionsQuery, id)
	if err != nil {
		return nil, err
	}

	alert.Actions = actions
	return &alert, nil
}

func (r *AlertRepository) GetByUserID(ctx context.Context, userID uuid.UUID, includeRead bool) ([]model.Alert, error) {
	var alerts []model.Alert
	var query string

	if includeRead {
		query = `
			SELECT id, user_id, asset_id, alert_type, severity, message,
				created_at, expires_at, is_read, action_required
			FROM alerts
			WHERE user_id = $1
			ORDER BY created_at DESC
		`
	} else {
		query = `
			SELECT id, user_id, asset_id, alert_type, severity, message,
				created_at, expires_at, is_read, action_required
			FROM alerts
			WHERE user_id = $1 AND is_read = false
			ORDER BY created_at DESC
		`
	}

	err := r.db.SelectContext(ctx, &alerts, query, userID)
	if err != nil {
		return nil, err
	}

	// Get actions for all alerts
	for i := range alerts {
		actionsQuery := `
			SELECT id, alert_id, action_type, description, completed
			FROM alert_actions
			WHERE alert_id = $1
		`

		var actions []model.AlertAction
		err = r.db.SelectContext(ctx, &actions, actionsQuery, alerts[i].ID)
		if err != nil {
			return nil, err
		}

		alerts[i].Actions = actions
	}

	return alerts, nil
}

func (r *AlertRepository) GetByAssetID(ctx context.Context, assetID uuid.UUID) ([]model.Alert, error) {
	var alerts []model.Alert
	query := `
		SELECT id, user_id, asset_id, alert_type, severity, message,
			created_at, expires_at, is_read, action_required
		FROM alerts
		WHERE asset_id = $1
		ORDER BY created_at DESC
	`

	err := r.db.SelectContext(ctx, &alerts, query, assetID)
	if err != nil {
		return nil, err
	}

	// Get actions for all alerts
	for i := range alerts {
		actionsQuery := `
			SELECT id, alert_id, action_type, description, completed
			FROM alert_actions
			WHERE alert_id = $1
		`

		var actions []model.AlertAction
		err = r.db.SelectContext(ctx, &actions, actionsQuery, alerts[i].ID)
		if err != nil {
			return nil, err
		}

		alerts[i].Actions = actions
	}

	return alerts, nil
}

func (r *AlertRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE alerts SET
			is_read = true
		WHERE id = $1
	`

	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *AlertRepository) CompleteAction(ctx context.Context, actionID uuid.UUID) error {
	query := `
		UPDATE alert_actions SET
			completed = true
		WHERE id = $1
	`

	_, err := r.db.ExecContext(ctx, query, actionID)
	return err
}

func (r *AlertRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// First delete all actions
	actionsQuery := `DELETE FROM alert_actions WHERE alert_id = $1`
	_, err := r.db.ExecContext(ctx, actionsQuery, id)
	if err != nil {
		return err
	}

	// Then delete the alert
	alertQuery := `DELETE FROM alerts WHERE id = $1`
	_, err = r.db.ExecContext(ctx, alertQuery, id)
	return err
}
