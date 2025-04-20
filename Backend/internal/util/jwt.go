package util

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrNoAuthHeader      = errors.New("authorization header not found")
	ErrInvalidAuthFormat = errors.New("authorization header format must be Bearer {token}")
	ErrInvalidToken      = errors.New("invalid token")
	ErrExpiredToken      = errors.New("token has expired")
)

type JWTUtil struct {
	secret string
}

type TokenClaims struct {
	UserID      uuid.UUID
	IsNominee   bool
	AccessType  string
	AccessLevel string // Used for nominees
	ExpiresAt   time.Time
}

func NewJWTUtil(secret string) *JWTUtil {
	return &JWTUtil{secret: secret}
}

func (u *JWTUtil) ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", ErrNoAuthHeader
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", ErrInvalidAuthFormat
	}

	return parts[1], nil
}

func (u *JWTUtil) GenerateToken(userID uuid.UUID, isNominee bool, accessType, accessLevel string) (string, error) {
	// Set the expiration time to 24 hours from now
	expiresAt := time.Now().Add(24 * time.Hour)

	claims := jwt.MapClaims{
		"sub": userID.String(),
		"exp": expiresAt.Unix(),
		"iat": time.Now().Unix(),
	}

	if isNominee {
		claims["access_type"] = "nominee"
		claims["access_level"] = accessLevel
	} else {
		claims["access_type"] = "user"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(u.secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

func (u *JWTUtil) ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(u.secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	// Check expiration time
	exp, ok := claims["exp"].(float64)
	if !ok {
		return nil, ErrInvalidToken
	}

	expirationTime := time.Unix(int64(exp), 0)
	if time.Now().After(expirationTime) {
		return nil, ErrExpiredToken
	}

	// Extract user ID
	userIDStr, ok := claims["sub"].(string)
	if !ok {
		return nil, ErrInvalidToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Check if token is for nominee access
	tokenClaims := &TokenClaims{
		UserID:     userID,
		IsNominee:  false,
		AccessType: "user",
		ExpiresAt:  expirationTime,
	}

	// If it's a nominee token, set appropriate fields
	if accessType, ok := claims["access_type"].(string); ok && accessType == "nominee" {
		tokenClaims.IsNominee = true
		tokenClaims.AccessType = "nominee"

		if accessLevel, ok := claims["access_level"].(string); ok {
			tokenClaims.AccessLevel = accessLevel
		}
	}

	return tokenClaims, nil
}

// RefreshToken generates a new token with a reset 24-hour validity period
// Only valid tokens can be refreshed
func (u *JWTUtil) RefreshToken(tokenString string) (string, error) {
	claims, err := u.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	// Generate new token with the same claims but extended validity
	return u.GenerateToken(claims.UserID, claims.IsNominee, claims.AccessType, claims.AccessLevel)
}
