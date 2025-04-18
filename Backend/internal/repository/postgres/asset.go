package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/sampatti/internal/model"
)

type AssetRepository struct {
	db *sqlx.DB
}

func NewAssetRepository(db *sqlx.DB) *AssetRepository {
	return &AssetRepository{db: db}
}

func (r *AssetRepository) Create(ctx context.Context, asset *model.Asset) error {
	query := `
		INSERT INTO assets (
			id, user_id, asset_name, asset_type, institution, account_number,
			purchase_date, purchase_price, quantity, total_investment,
			current_value, last_updated, maturity_date, expected_value,
			return_rate, risk_score, liquidity_score, notes, tags,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18, $19, $20, $21
		)
	`

	asset.ID = uuid.New()
	asset.CreatedAt = time.Now()
	asset.UpdatedAt = time.Now()
	asset.LastUpdated = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		query,
		asset.ID,
		asset.UserID,
		asset.AssetName,
		asset.AssetType,
		asset.Institution,
		asset.AccountNumber,
		asset.PurchaseDate,
		asset.PurchasePrice,
		asset.Quantity,
		asset.TotalInvestment,
		asset.CurrentValue,
		asset.LastUpdated,
		asset.MaturityDate,
		asset.ExpectedValue,
		asset.ReturnRate,
		asset.RiskScore,
		asset.LiquidityScore,
		asset.Notes,
		pq.Array(asset.Tags),
		asset.CreatedAt,
		asset.UpdatedAt,
	)

	if err != nil {
		return err
	}

	// Add to asset history
	historyQuery := `
		INSERT INTO asset_history (
			id, asset_id, date, value, action, notes, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err = r.db.ExecContext(
		ctx,
		historyQuery,
		uuid.New(),
		asset.ID,
		time.Now(),
		asset.CurrentValue,
		"Purchase",
		"Initial purchase",
		time.Now(),
	)

	return err
}

func (r *AssetRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Asset, error) {
	var asset model.Asset
	query := `
		SELECT 
			id, user_id, asset_name, asset_type, institution, account_number,
			purchase_date, purchase_price, quantity, total_investment,
			current_value, last_updated, maturity_date, expected_value,
			return_rate, risk_score, liquidity_score, notes, tags,
			created_at, updated_at
		FROM assets 
		WHERE id = $1
	`

	err := r.db.GetContext(ctx, &asset, query, id)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

func (r *AssetRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Asset, error) {
	var assets []model.Asset
	query := `
		SELECT 
			id, user_id, asset_name, asset_type, institution, account_number,
			purchase_date, purchase_price, quantity, total_investment,
			current_value, last_updated, maturity_date, expected_value,
			return_rate, risk_score, liquidity_score, notes, tags,
			created_at, updated_at
		FROM assets 
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	err := r.db.SelectContext(ctx, &assets, query, userID)
	if err != nil {
		return nil, err
	}

	return assets, nil
}

func (r *AssetRepository) GetByType(ctx context.Context, userID uuid.UUID, assetType string) ([]model.Asset, error) {
	var assets []model.Asset
	query := `
		SELECT 
			id, user_id, asset_name, asset_type, institution, account_number,
			purchase_date, purchase_price, quantity, total_investment,
			current_value, last_updated, maturity_date, expected_value,
			return_rate, risk_score, liquidity_score, notes, tags,
			created_at, updated_at
		FROM assets 
		WHERE user_id = $1 AND asset_type = $2
		ORDER BY created_at DESC
	`

	err := r.db.SelectContext(ctx, &assets, query, userID, assetType)
	if err != nil {
		return nil, err
	}

	return assets, nil
}

func (r *AssetRepository) Update(ctx context.Context, asset *model.Asset) error {
	query := `
		UPDATE assets SET
			asset_name = $1,
			asset_type = $2,
			institution = $3,
			account_number = $4,
			purchase_date = $5,
			purchase_price = $6,
			quantity = $7,
			total_investment = $8,
			current_value = $9,
			last_updated = $10,
			maturity_date = $11,
			expected_value = $12,
			return_rate = $13,
			risk_score = $14,
			liquidity_score = $15,
			notes = $16,
			tags = $17,
			updated_at = $18
		WHERE id = $19
	`

	asset.UpdatedAt = time.Now()
	asset.LastUpdated = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		query,
		asset.AssetName,
		asset.AssetType,
		asset.Institution,
		asset.AccountNumber,
		asset.PurchaseDate,
		asset.PurchasePrice,
		asset.Quantity,
		asset.TotalInvestment,
		asset.CurrentValue,
		asset.LastUpdated,
		asset.MaturityDate,
		asset.ExpectedValue,
		asset.ReturnRate,
		asset.RiskScore,
		asset.LiquidityScore,
		asset.Notes,
		pq.Array(asset.Tags),
		asset.UpdatedAt,
		asset.ID,
	)

	if err != nil {
		return err
	}

	// Add to asset history
	historyQuery := `
		INSERT INTO asset_history (
			id, asset_id, date, value, action, notes, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err = r.db.ExecContext(
		ctx,
		historyQuery,
		uuid.New(),
		asset.ID,
		time.Now(),
		asset.CurrentValue,
		"Update",
		"Asset updated",
		time.Now(),
	)

	return err
}

func (r *AssetRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM assets WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *AssetRepository) GetAssetHistory(ctx context.Context, assetID uuid.UUID) ([]model.AssetHistory, error) {
	var history []model.AssetHistory
	query := `
		SELECT id, asset_id, date, value, action, notes, created_at
		FROM asset_history
		WHERE asset_id = $1
		ORDER BY date DESC
	`

	err := r.db.SelectContext(ctx, &history, query, assetID)
	if err != nil {
		return nil, err
	}

	return history, nil
}

func (r *AssetRepository) UpdateValue(ctx context.Context, id uuid.UUID, value float64, notes string) error {
	query := `
		UPDATE assets SET
			current_value = $1,
			last_updated = $2,
			updated_at = $3
		WHERE id = $4
	`

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, value, now, now, id)
	if err != nil {
		return err
	}

	// Add to asset history
	historyQuery := `
		INSERT INTO asset_history (
			id, asset_id, date, value, action, notes, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err = r.db.ExecContext(
		ctx,
		historyQuery,
		uuid.New(),
		id,
		now,
		value,
		"ValueUpdate",
		notes,
		now,
	)

	return err
}
