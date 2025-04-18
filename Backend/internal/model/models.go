package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	Name             string     `json:"name" db:"name"`
	Email            string     `json:"email" db:"email"`
	PhoneNumber      string     `json:"phone_number" db:"phone_number"`
	PasswordHash     string     `json:"-" db:"password_hash"`
	DateOfBirth      *time.Time `json:"date_of_birth" db:"date_of_birth"`
	KYCVerified      bool       `json:"kyc_verified" db:"kyc_verified"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
	LastLogin        *time.Time `json:"last_login" db:"last_login"`
	Notifications    bool       `json:"notifications" db:"notifications"`
	DefaultCurrency  string     `json:"default_currency" db:"default_currency"`
	TwoFactorEnabled bool       `json:"two_factor_enabled" db:"two_factor_enabled"`
}

type Asset struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	UserID          uuid.UUID  `json:"user_id" db:"user_id"`
	AssetName       string     `json:"asset_name" db:"asset_name"`
	AssetType       string     `json:"asset_type" db:"asset_type"`
	Institution     string     `json:"institution" db:"institution"`
	AccountNumber   string     `json:"account_number" db:"account_number"`
	PurchaseDate    *time.Time `json:"purchase_date" db:"purchase_date"`
	PurchasePrice   float64    `json:"purchase_price" db:"purchase_price"`
	Quantity        float64    `json:"quantity" db:"quantity"`
	TotalInvestment float64    `json:"total_investment" db:"total_investment"`
	CurrentValue    float64    `json:"current_value" db:"current_value"`
	LastUpdated     time.Time  `json:"last_updated" db:"last_updated"`
	MaturityDate    *time.Time `json:"maturity_date" db:"maturity_date"`
	ExpectedValue   float64    `json:"expected_value" db:"expected_value"`
	ReturnRate      float64    `json:"return_rate" db:"return_rate"`
	RiskScore       int        `json:"risk_score" db:"risk_score"`
	LiquidityScore  int        `json:"liquidity_score" db:"liquidity_score"`
	Notes           string     `json:"notes" db:"notes"`
	Tags            []string   `json:"tags" db:"tags"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

type AssetHistory struct {
	ID        uuid.UUID `json:"id" db:"id"`
	AssetID   uuid.UUID `json:"asset_id" db:"asset_id"`
	Date      time.Time `json:"date" db:"date"`
	Value     float64   `json:"value" db:"value"`
	Action    string    `json:"action" db:"action"`
	Notes     string    `json:"notes" db:"notes"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Nominee struct {
	ID                  uuid.UUID  `json:"id" db:"id"`
	UserID              uuid.UUID  `json:"user_id" db:"user_id"`
	Name                string     `json:"name" db:"name"`
	Email               string     `json:"email" db:"email"`
	PhoneNumber         string     `json:"phone_number" db:"phone_number"`
	Relationship        string     `json:"relationship" db:"relationship"`
	AccessLevel         string     `json:"access_level" db:"access_level"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
	Status              string     `json:"status" db:"status"`
	EmergencyAccessCode string     `json:"-" db:"emergency_access_code"`
	LastAccessDate      *time.Time `json:"last_access_date" db:"last_access_date"`
}

type NomineeAccessLog struct {
	ID         uuid.UUID `json:"id" db:"id"`
	NomineeID  uuid.UUID `json:"nominee_id" db:"nominee_id"`
	Date       time.Time `json:"date" db:"date"`
	Action     string    `json:"action" db:"action"`
	IPAddress  string    `json:"ip_address" db:"ip_address"`
	DeviceInfo string    `json:"device_info" db:"device_info"`
}

type Document struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               uuid.UUID  `json:"user_id" db:"user_id"`
	AssetID              *uuid.UUID `json:"asset_id" db:"asset_id"`
	DocumentType         string     `json:"document_type" db:"document_type"`
	Title                string     `json:"title" db:"title"`
	Description          string     `json:"description" db:"description"`
	Filename             string     `json:"filename" db:"filename"`
	FileSize             int64      `json:"file_size" db:"file_size"`
	MimeType             string     `json:"mime_type" db:"mime_type"`
	StorageKey           string     `json:"storage_key" db:"storage_key"`
	UploadDate           time.Time  `json:"upload_date" db:"upload_date"`
	Tags                 []string   `json:"tags" db:"tags"`
	IsEncrypted          bool       `json:"is_encrypted" db:"is_encrypted"`
	AccessibleToNominees bool       `json:"accessible_to_nominees" db:"accessible_to_nominees"`
}

type Alert struct {
	ID             uuid.UUID     `json:"id" db:"id"`
	UserID         uuid.UUID     `json:"user_id" db:"user_id"`
	AssetID        *uuid.UUID    `json:"asset_id" db:"asset_id"`
	AlertType      string        `json:"alert_type" db:"alert_type"`
	Severity       string        `json:"severity" db:"severity"`
	Message        string        `json:"message" db:"message"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	ExpiresAt      *time.Time    `json:"expires_at" db:"expires_at"`
	IsRead         bool          `json:"is_read" db:"is_read"`
	ActionRequired bool          `json:"action_required" db:"action_required"`
	Actions        []AlertAction `json:"actions" db:"-"` // Added this field
}

type AlertAction struct {
	ID          uuid.UUID `json:"id" db:"id"`
	AlertID     uuid.UUID `json:"alert_id" db:"alert_id"`
	ActionType  string    `json:"action_type" db:"action_type"`
	Description string    `json:"description" db:"description"`
	Completed   bool      `json:"completed" db:"completed"`
}
