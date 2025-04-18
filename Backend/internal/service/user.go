package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
)

var (
	ErrUserNotFound = errors.New("user not found")
)

type UserService struct {
	userRepo *postgres.UserRepository
}

func NewUserService(userRepo *postgres.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// GetByID retrieves a user by ID
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// Update updates a user's profile information
func (s *UserService) Update(ctx context.Context, user *model.User) error {
	// Verify user exists
	existingUser, err := s.userRepo.GetByID(ctx, user.ID)
	if err != nil {
		return ErrUserNotFound
	}

	// Preserve sensitive fields
	user.Email = existingUser.Email // Email can't be changed
	user.PasswordHash = existingUser.PasswordHash
	user.CreatedAt = existingUser.CreatedAt
	user.LastLogin = existingUser.LastLogin

	return s.userRepo.Update(ctx, user)
}

// UpdateSettings updates a user's settings
func (s *UserService) UpdateSettings(ctx context.Context, id uuid.UUID, notifications bool, defaultCurrency string, twoFactorEnabled bool) error {
	// Verify user exists
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return ErrUserNotFound
	}

	// Update settings
	user.Notifications = notifications
	user.DefaultCurrency = defaultCurrency
	user.TwoFactorEnabled = twoFactorEnabled

	return s.userRepo.Update(ctx, user)
}
