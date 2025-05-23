package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sampatti/internal/config"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
	"github.com/sampatti/internal/util"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrInvalidToken       = errors.New("invalid token")
	ErrExpiredToken       = errors.New("token expired")
)

type AuthService struct {
	userRepo     *postgres.UserRepository
	nomineeRepo  *postgres.NomineeRepository
	cfg          *config.JWTConfig
	passwordUtil *util.PasswordUtil
}

func NewAuthService(
	userRepo *postgres.UserRepository,
	nomineeRepo *postgres.NomineeRepository,
	cfg *config.JWTConfig,
	passwordUtil *util.PasswordUtil,
) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		nomineeRepo:  nomineeRepo,
		cfg:          cfg,
		passwordUtil: passwordUtil,
	}
}

func (s *AuthService) RegisterUser(ctx context.Context, user *model.User, password string) error {
	// Check if user already exists
	existingUser, err := s.userRepo.GetByEmail(ctx, user.Email)
	if err == nil && existingUser != nil {
		return ErrUserAlreadyExists
	}

	// Validate password length
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}

	// Hash the password
	passwordHash, err := s.passwordUtil.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.PasswordHash = passwordHash
	return s.userRepo.Create(ctx, user)
}

// Login authenticates a user and returns access and refresh tokens
func (s *AuthService) Login(ctx context.Context, email, password string) (string, string, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return "", "", ErrInvalidCredentials
	}

	// Verify password
	if !s.passwordUtil.CheckPasswordHash(password, user.PasswordHash) {
		return "", "", ErrInvalidCredentials
	}

	// Update last login time
	if err := s.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		return "", "", fmt.Errorf("failed to update last login: %w", err)
	}

	// Generate tokens
	accessToken, err := s.generateAccessToken(user.ID)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// RefreshToken generates a new access token from a refresh token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	// Parse refresh token
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.cfg.RefreshSecret), nil
	})

	if err != nil {
		return "", ErrInvalidToken
	}

	if !token.Valid {
		return "", ErrInvalidToken
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", ErrInvalidToken
	}

	// Check if token is expired
	expiration, ok := claims["exp"].(float64)
	if !ok {
		return "", ErrInvalidToken
	}

	if time.Unix(int64(expiration), 0).Before(time.Now()) {
		return "", ErrExpiredToken
	}

	// Extract user ID
	userIDStr, ok := claims["sub"].(string)
	if !ok {
		return "", ErrInvalidToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return "", ErrInvalidToken
	}

	// Check if user exists
	_, err = s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", ErrInvalidToken
	}

	// Generate new access token
	accessToken, err := s.generateAccessToken(userID)
	if err != nil {
		return "", fmt.Errorf("failed to generate access token: %w", err)
	}

	return accessToken, nil
}

// ChangePassword changes a user's password
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify old password
	if !s.passwordUtil.CheckPasswordHash(oldPassword, user.PasswordHash) {
		return ErrInvalidCredentials
	}

	// Hash new password
	passwordHash, err := s.passwordUtil.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return s.userRepo.UpdatePassword(ctx, userID, passwordHash)
}

// NomineeEmergencyAccess handles the emergency access process for nominees
func (s *AuthService) NomineeEmergencyAccess(ctx context.Context, email, emergencyAccessCode string) (string, error) {
	// Log for debugging
	fmt.Printf("Attempting emergency access for email: %s with code: %s\n", email, emergencyAccessCode)

	// Get the nominee by email
	nominee, err := s.nomineeRepo.GetByEmail(ctx, email)
	if err != nil {
		fmt.Printf("Nominee not found for email %s: %v\n", email, err)
		return "", ErrInvalidCredentials
	}

	// Log for debugging
	fmt.Printf("Found nominee: %s, stored code hash: %s\n", nominee.ID, nominee.EmergencyAccessCode)

	// Check if the nominee has an emergency access code set
	if nominee.EmergencyAccessCode == "" {
		fmt.Printf("Nominee %s has no emergency access code set\n", nominee.ID)
		return "", errors.New("no emergency access code has been set for this nominee")
	}

	// Verify the emergency access code
	if !s.passwordUtil.CheckPasswordHash(emergencyAccessCode, nominee.EmergencyAccessCode) {
		fmt.Printf("Invalid access code for nominee %s\n", nominee.ID)
		return "", ErrInvalidCredentials
	}

	fmt.Printf("Access code verification successful for nominee %s\n", nominee.ID)

	// If access is successful, update nominee status to Active if currently Pending
	if nominee.Status == "Pending" {
		if err := s.nomineeRepo.UpdateStatus(ctx, nominee.ID, "Active"); err != nil {
			// Just log the error but don't fail the authentication
			fmt.Printf("Warning: Failed to activate nominee: %v\n", err)
		} else {
			fmt.Printf("Updated nominee %s status to Active\n", nominee.ID)
		}
	}

	// Generate JWT token for nominee
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":          nominee.ID.String(),
		"user_id":      nominee.UserID.String(),
		"access_type":  "nominee",
		"access_level": nominee.AccessLevel,
		"exp":          time.Now().Add(time.Hour * 24).Unix(), // 24-hour access
		"iat":          time.Now().Unix(),
	})

	// Sign the token
	tokenString, err := token.SignedString([]byte(s.cfg.Secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	// Log the nominee access
	accessLog := &model.NomineeAccessLog{
		NomineeID: nominee.ID,
		Date:      time.Now(),
		Action:    "Emergency Access",
	}

	if err := s.nomineeRepo.LogAccess(ctx, accessLog); err != nil {
		// Just log the error but don't fail the authentication
		fmt.Printf("Warning: Failed to log nominee access: %v\n", err)
	}

	return tokenString, nil
}

// GenerateNomineeInvite creates an emergency access code for a nominee
func (s *AuthService) GenerateNomineeInvite(ctx context.Context, nomineeID uuid.UUID) (string, error) {
	// Generate a random access code (8 characters is easy to remember but secure enough for this purpose)
	rawCode := util.GenerateRandomString(8)
	fmt.Printf("Generated access code for nominee %s: %s\n", nomineeID, rawCode)

	// Hash the code for storage
	hashedCode, err := s.passwordUtil.HashPassword(rawCode)
	if err != nil {
		return "", fmt.Errorf("failed to hash access code: %w", err)
	}

	// Log for debugging
	fmt.Printf("Hashed access code for nominee %s: %s\n", nomineeID, hashedCode)

	// Update the nominee directly with just the emergency access code
	// This avoids issues with partial updates of other nominee fields
	if err := s.nomineeRepo.UpdateEmergencyAccessCode(ctx, nomineeID, hashedCode); err != nil {
		return "", fmt.Errorf("failed to save access code: %w", err)
	}

	return rawCode, nil
}

// Private methods

func (s *AuthService) generateAccessToken(userID uuid.UUID) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(time.Minute * time.Duration(s.cfg.ExpiryMinutes)).Unix(),
		"iat": time.Now().Unix(),
	})

	return token.SignedString([]byte(s.cfg.Secret))
}

func (s *AuthService) generateRefreshToken(userID uuid.UUID) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(time.Minute * time.Duration(s.cfg.RefreshExpiry)).Unix(),
		"iat": time.Now().Unix(),
	})

	return token.SignedString([]byte(s.cfg.RefreshSecret))
}

func (s *AuthService) GenerateNomineeToken(nomineeID, userID uuid.UUID, accessLevel string) (string, error) {
	// Create JWT token for nominee access
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":          nomineeID.String(),
		"user_id":      userID.String(),
		"access_type":  "nominee",
		"access_level": accessLevel,
		"exp":          time.Now().Add(time.Hour * 24).Unix(), // 24-hour access
		"iat":          time.Now().Unix(),
	})

	// Sign the token
	tokenString, err := token.SignedString([]byte(s.cfg.Secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// VerifyNomineeCode verifies if an access code matches the stored hash
func (s *AuthService) VerifyNomineeCode(accessCode, storedHash string) bool {
	return s.passwordUtil.CheckPasswordHash(accessCode, storedHash)
}
