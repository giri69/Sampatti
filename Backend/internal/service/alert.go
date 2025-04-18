package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres" // Add this import
)

var (
	ErrAlertNotFound = errors.New("alert not found")
	// ErrUnauthorized is already declared elsewhere, removing duplicate declaration
)

type AlertService struct {
	alertRepo *postgres.AlertRepository
}

func NewAlertService(alertRepo *postgres.AlertRepository) *AlertService {
	return &AlertService{alertRepo: alertRepo}
}

// Create creates a new alert
func (s *AlertService) Create(ctx context.Context, alert *model.Alert) error {
	return s.alertRepo.Create(ctx, alert)
}

// GetByID retrieves an alert by ID
func (s *AlertService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.Alert, error) {
	alert, err := s.alertRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAlertNotFound
	}

	// Verify ownership
	if alert.UserID != userID {
		return nil, ErrUnauthorized
	}

	return alert, nil
}

// GetByUserID retrieves all alerts for a user
func (s *AlertService) GetByUserID(ctx context.Context, userID uuid.UUID, includeRead bool) ([]model.Alert, error) {
	return s.alertRepo.GetByUserID(ctx, userID, includeRead)
}

// MarkAsRead marks an alert as read
func (s *AlertService) MarkAsRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// Verify alert exists and user owns it
	alert, err := s.alertRepo.GetByID(ctx, id)
	if err != nil {
		return ErrAlertNotFound
	}

	if alert.UserID != userID {
		return ErrUnauthorized
	}

	return s.alertRepo.MarkAsRead(ctx, id)
}

// Delete removes an alert
func (s *AlertService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// Verify alert exists and user owns it
	alert, err := s.alertRepo.GetByID(ctx, id)
	if err != nil {
		return ErrAlertNotFound
	}

	if alert.UserID != userID {
		return ErrUnauthorized
	}

	return s.alertRepo.Delete(ctx, id)
}

// CreateSystemAlerts generates system alerts based on asset conditions
func (s *AlertService) CreateSystemAlerts(ctx context.Context, userID uuid.UUID, assets []model.Asset) error {
	now := time.Now()
	thirtyDaysFromNow := now.AddDate(0, 0, 30)

	// Check for upcoming maturities
	for _, asset := range assets {
		if asset.MaturityDate != nil && asset.MaturityDate.After(now) && asset.MaturityDate.Before(thirtyDaysFromNow) {
			// Create maturity alert
			alert := &model.Alert{
				UserID:         userID,
				AssetID:        &asset.ID,
				AlertType:      "Maturity",
				Severity:       "Medium",
				Message:        "Your " + asset.AssetName + " will mature on " + asset.MaturityDate.Format("Jan 2, 2006"),
				CreatedAt:      now,
				ExpiresAt:      asset.MaturityDate,
				IsRead:         false,
				ActionRequired: true,
			}

			if err := s.alertRepo.Create(ctx, alert); err != nil {
				return err
			}
		}

		// Check for significant value changes (±10%)
		if asset.TotalInvestment > 0 {
			changePercent := ((asset.CurrentValue - asset.TotalInvestment) / asset.TotalInvestment) * 100

			if changePercent >= 10 || changePercent <= -10 {
				severity := "Low"
				message := "Your " + asset.AssetName

				if changePercent >= 10 {
					message += " has increased by " + formatPercent(changePercent) + " in value"
				} else {
					message += " has decreased by " + formatPercent(changePercent*-1) + " in value"
					severity = "Medium"

					if changePercent <= -20 {
						severity = "High"
					}
				}

				alert := &model.Alert{
					UserID:         userID,
					AssetID:        &asset.ID,
					AlertType:      "PriceChange",
					Severity:       severity,
					Message:        message,
					CreatedAt:      now,
					ExpiresAt:      &thirtyDaysFromNow,
					IsRead:         false,
					ActionRequired: false,
				}

				if err := s.alertRepo.Create(ctx, alert); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// Helper to format percent with 2 decimal places
func formatPercent(value float64) string {
	return fmt.Sprintf("%.2f%%", value)
}
