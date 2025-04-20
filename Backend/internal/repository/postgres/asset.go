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

type AssetDB struct {
	ID              uuid.UUID      `db:"id"`
	UserID          uuid.UUID      `db:"user_id"`
	AssetName       string         `db:"asset_name"`
	AssetType       string         `db:"asset_type"`
	Institution     string         `db:"institution"`
	AccountNumber   string         `db:"account_number"`
	PurchaseDate    *time.Time     `db:"purchase_date"`
	PurchasePrice   float64        `db:"purchase_price"`
	Quantity        float64        `db:"quantity"`
	TotalInvestment float64        `db:"total_investment"`
	CurrentValue    float64        `db:"current_value"`
	LastUpdated     time.Time      `db:"last_updated"`
	MaturityDate    *time.Time     `db:"maturity_date"`
	ExpectedValue   float64        `db:"expected_value"`
	ReturnRate      float64        `db:"return_rate"`
	RiskScore       int            `db:"risk_score"`
	LiquidityScore  int            `db:"liquidity_score"`
	Notes           string         `db:"notes"`
	Tags            pq.StringArray `db:"tags"`
	CreatedAt       time.Time      `db:"created_at"`
	UpdatedAt       time.Time      `db:"updated_at"`
}

func toAssetModel(dbAsset AssetDB) model.Asset {
	return model.Asset{
		ID:              dbAsset.ID,
		UserID:          dbAsset.UserID,
		AssetName:       dbAsset.AssetName,
		AssetType:       dbAsset.AssetType,
		Institution:     dbAsset.Institution,
		AccountNumber:   dbAsset.AccountNumber,
		PurchaseDate:    dbAsset.PurchaseDate,
		PurchasePrice:   dbAsset.PurchasePrice,
		Quantity:        dbAsset.Quantity,
		TotalInvestment: dbAsset.TotalInvestment,
		CurrentValue:    dbAsset.CurrentValue,
		LastUpdated:     dbAsset.LastUpdated,
		MaturityDate:    dbAsset.MaturityDate,
		ExpectedValue:   dbAsset.ExpectedValue,
		ReturnRate:      dbAsset.ReturnRate,
		RiskScore:       dbAsset.RiskScore,
		LiquidityScore:  dbAsset.LiquidityScore,
		Notes:           dbAsset.Notes,
		Tags:            []string(dbAsset.Tags),
		CreatedAt:       dbAsset.CreatedAt,
		UpdatedAt:       dbAsset.UpdatedAt,
	}
}

func toAssetDBModel(asset model.Asset) AssetDB {
	return AssetDB{
		ID:              asset.ID,
		UserID:          asset.UserID,
		AssetName:       asset.AssetName,
		AssetType:       asset.AssetType,
		Institution:     asset.Institution,
		AccountNumber:   asset.AccountNumber,
		PurchaseDate:    asset.PurchaseDate,
		PurchasePrice:   asset.PurchasePrice,
		Quantity:        asset.Quantity,
		TotalInvestment: asset.TotalInvestment,
		CurrentValue:    asset.CurrentValue,
		LastUpdated:     asset.LastUpdated,
		MaturityDate:    asset.MaturityDate,
		ExpectedValue:   asset.ExpectedValue,
		ReturnRate:      asset.ReturnRate,
		RiskScore:       asset.RiskScore,
		LiquidityScore:  asset.LiquidityScore,
		Notes:           asset.Notes,
		Tags:            pq.StringArray(asset.Tags),
		CreatedAt:       asset.CreatedAt,
		UpdatedAt:       asset.UpdatedAt,
	}
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

	dbAsset := toAssetDBModel(*asset)

	_, err := r.db.ExecContext(
		ctx,
		query,
		dbAsset.ID,
		dbAsset.UserID,
		dbAsset.AssetName,
		dbAsset.AssetType,
		dbAsset.Institution,
		dbAsset.AccountNumber,
		dbAsset.PurchaseDate,
		dbAsset.PurchasePrice,
		dbAsset.Quantity,
		dbAsset.TotalInvestment,
		dbAsset.CurrentValue,
		dbAsset.LastUpdated,
		dbAsset.MaturityDate,
		dbAsset.ExpectedValue,
		dbAsset.ReturnRate,
		dbAsset.RiskScore,
		dbAsset.LiquidityScore,
		dbAsset.Notes,
		dbAsset.Tags,
		dbAsset.CreatedAt,
		dbAsset.UpdatedAt,
	)

	if err != nil {
		return err
	}

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
	var dbAsset AssetDB
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

	err := r.db.GetContext(ctx, &dbAsset, query, id)
	if err != nil {
		return nil, err
	}

	asset := toAssetModel(dbAsset)
	return &asset, nil
}

func (r *AssetRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Asset, error) {
	var dbAssets []AssetDB
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

	err := r.db.SelectContext(ctx, &dbAssets, query, userID)
	if err != nil {
		return nil, err
	}

	assets := make([]model.Asset, len(dbAssets))
	for i, dbAsset := range dbAssets {
		assets[i] = toAssetModel(dbAsset)
	}

	return assets, nil
}

func (r *AssetRepository) GetByType(ctx context.Context, userID uuid.UUID, assetType string) ([]model.Asset, error) {
	var dbAssets []AssetDB
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

	err := r.db.SelectContext(ctx, &dbAssets, query, userID, assetType)
	if err != nil {
		return nil, err
	}

	assets := make([]model.Asset, len(dbAssets))
	for i, dbAsset := range dbAssets {
		assets[i] = toAssetModel(dbAsset)
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
	dbAsset := toAssetDBModel(*asset)

	_, err := r.db.ExecContext(
		ctx,
		query,
		dbAsset.AssetName,
		dbAsset.AssetType,
		dbAsset.Institution,
		dbAsset.AccountNumber,
		dbAsset.PurchaseDate,
		dbAsset.PurchasePrice,
		dbAsset.Quantity,
		dbAsset.TotalInvestment,
		dbAsset.CurrentValue,
		dbAsset.LastUpdated,
		dbAsset.MaturityDate,
		dbAsset.ExpectedValue,
		dbAsset.ReturnRate,
		dbAsset.RiskScore,
		dbAsset.LiquidityScore,
		dbAsset.Notes,
		dbAsset.Tags,
		dbAsset.UpdatedAt,
		dbAsset.ID,
	)

	if err != nil {
		return err
	}

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
