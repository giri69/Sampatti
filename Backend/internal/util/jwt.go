package util

import (
	"errors"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrNoAuthHeader      = errors.New("authorization header not found")
	ErrInvalidAuthFormat = errors.New("authorization header format must be Bearer {token}")
	ErrInvalidToken      = errors.New("invalid token")
)

type JWTUtil struct {
	secret string
}

type TokenClaims struct {
	UserID      uuid.UUID
	IsNominee   bool
	AccessType  string
	AccessLevel string // Used for nominees
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

func (u *JWTUtil) ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(u.secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ErrInvalidToken
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
	}

	// If it's a nominee token, set appropriate fields
	if accessType, ok := claims["access_type"].(string); ok && accessType == "nominee" {
		tokenClaims.IsNominee = true
		tokenClaims.AccessType = "nominee"

		if userIDStr, ok := claims["user_id"].(string); ok {
			if userID, err := uuid.Parse(userIDStr); err == nil {
				tokenClaims.UserID = userID
			}
		}

		if accessLevel, ok := claims["access_level"].(string); ok {
			tokenClaims.AccessLevel = accessLevel
		}
	}

	return tokenClaims, nil
}
