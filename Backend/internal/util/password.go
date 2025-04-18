package util

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type PasswordUtil struct {
	cost int
}

func NewPasswordUtil(cost int) *PasswordUtil {
	if cost < bcrypt.MinCost {
		cost = bcrypt.DefaultCost
	}
	return &PasswordUtil{cost: cost}
}

func (u *PasswordUtil) HashPassword(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(password), u.cost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(bytes), nil
}

func (u *PasswordUtil) CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateRandomString creates a secure random string of specified length
func GenerateRandomString(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		// In production, we'd handle this error differently,
		// but for simplicity we'll just panic
		panic(fmt.Errorf("failed to generate random bytes: %w", err))
	}
	return base64.URLEncoding.EncodeToString(b)[:length]
}
