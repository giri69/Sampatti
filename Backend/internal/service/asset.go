package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
)

var (
	ErrAssetNotFound = errors.New("asset not found")
	ErrUnauthorized  = errors.New("unauthorized access")
)

type AssetService struct {
	assetRepo *postgres.AssetRepository
}

func NewAssetService(assetRepo *postgres.AssetRepository) *AssetService {
	return &AssetService{assetRepo: assetRepo}
}

func (s *AssetService) Create(ctx context.Context, asset *model.Asset) error {
	return s.assetRepo.Create(ctx, asset)
}

func (s *AssetService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.Asset, error) {
	asset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAssetNotFound
	}

	// Check if user has access to this asset
	if asset.UserID != userID {
		return nil, ErrUnauthorized
	}

	return asset, nil
}

func (s *AssetService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Asset, error) {
	return s.assetRepo.GetByUserID(ctx, userID)
}

func (s *AssetService) GetByType(ctx context.Context, userID uuid.UUID, assetType string) ([]model.Asset, error) {
	return s.assetRepo.GetByType(ctx, userID, assetType)
}

func (s *AssetService) Update(ctx context.Context, asset *model.Asset, userID uuid.UUID) error {
	// Check if asset exists and belongs to user
	existingAsset, err := s.assetRepo.GetByID(ctx, asset.ID)
	if err != nil {
		return ErrAssetNotFound
	}

	if existingAsset.UserID != userID {
		return ErrUnauthorized
	}

	// Preserve user ID to prevent unauthorized changes
	asset.UserID = existingAsset.UserID

	return s.assetRepo.Update(ctx, asset)
}

func (s *AssetService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// Check if asset exists and belongs to user
	existingAsset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return ErrAssetNotFound
	}

	if existingAsset.UserID != userID {
		return ErrUnauthorized
	}

	return s.assetRepo.Delete(ctx, id)
}

func (s *AssetService) UpdateValue(ctx context.Context, id uuid.UUID, userID uuid.UUID, value float64, notes string) error {
	// Check if asset exists and belongs to user
	existingAsset, err := s.assetRepo.GetByID(ctx, id)
	if err != nil {
		return ErrAssetNotFound
	}

	if existingAsset.UserID != userID {
		return ErrUnauthorized
	}

	return s.assetRepo.UpdateValue(ctx, id, value, notes)
}

func (s *AssetService) GetHistory(ctx context.Context, assetID uuid.UUID, userID uuid.UUID) ([]model.AssetHistory, error) {
	// Check if asset exists and belongs to user
	existingAsset, err := s.assetRepo.GetByID(ctx, assetID)
	if err != nil {
		return nil, ErrAssetNotFound
	}

	if existingAsset.UserID != userID {
		return nil, ErrUnauthorized
	}

	return s.assetRepo.GetAssetHistory(ctx, assetID)
}

// GetSummary returns a summary of all assets for a user
func (s *AssetService) GetSummary(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	assets, err := s.assetRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	totalValue := 0.0
	totalInvestment := 0.0
	assetsByType := make(map[string]float64)
	totalReturn := 0.0
	avgRiskScore := 0.0
	assetCount := 0

	// Assets that will mature in the next 30 days
	upcomingMaturities := make([]model.Asset, 0)
	thirtyDaysFromNow := time.Now().AddDate(0, 0, 30)

	for _, asset := range assets {
		totalValue += asset.CurrentValue
		totalInvestment += asset.TotalInvestment
		assetsByType[asset.AssetType] += asset.CurrentValue

		// Calculate returns
		if asset.TotalInvestment > 0 {
			assetReturn := ((asset.CurrentValue - asset.TotalInvestment) / asset.TotalInvestment) * 100
			totalReturn += assetReturn
		}

		// Sum risk scores
		avgRiskScore += float64(asset.RiskScore)
		assetCount++

		// Check for upcoming maturities
		if asset.MaturityDate != nil && asset.MaturityDate.Before(thirtyDaysFromNow) && asset.MaturityDate.After(time.Now()) {
			upcomingMaturities = append(upcomingMaturities, asset)
		}
	}

	// Calculate average risk score
	if assetCount > 0 {
		avgRiskScore = avgRiskScore / float64(assetCount)
		totalReturn = totalReturn / float64(assetCount)
	}

	return map[string]interface{}{
		"total_value":         totalValue,
		"total_investment":    totalInvestment,
		"assets_by_type":      assetsByType,
		"asset_count":         assetCount,
		"average_return":      totalReturn,
		"average_risk_score":  avgRiskScore,
		"upcoming_maturities": upcomingMaturities,
		"last_updated":        time.Now(),
	}, nil
}
