package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
)

var (
	ErrNomineeNotFound = errors.New("nominee not found")
	ErrNomineeExists   = errors.New("nominee already exists with this email")
)

type NomineeService struct {
	nomineeRepo *postgres.NomineeRepository
	authService *AuthService
}

func NewNomineeService(nomineeRepo *postgres.NomineeRepository, authService *AuthService) *NomineeService {
	return &NomineeService{
		nomineeRepo: nomineeRepo,
		authService: authService,
	}
}

// Create adds a new nominee
func (s *NomineeService) Create(ctx context.Context, nominee *model.Nominee) error {
	// Check if nominee already exists with this email
	existingNominee, err := s.nomineeRepo.GetByEmail(ctx, nominee.Email)
	if err == nil && existingNominee != nil && existingNominee.UserID == nominee.UserID {
		return ErrNomineeExists
	}

	// Create nominee
	return s.nomineeRepo.Create(ctx, nominee)
}

// GetByID retrieves a nominee by ID
func (s *NomineeService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.Nominee, error) {
	nominee, err := s.nomineeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNomineeNotFound
	}

	// Verify ownership
	if nominee.UserID != userID {
		return nil, ErrUnauthorized
	}

	return nominee, nil
}

// GetByUserID retrieves all nominees for a user
func (s *NomineeService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Nominee, error) {
	return s.nomineeRepo.GetByUserID(ctx, userID)
}

// Update updates a nominee's information
func (s *NomineeService) Update(ctx context.Context, nominee *model.Nominee, userID uuid.UUID) error {
	// Verify nominee exists and user owns it
	existingNominee, err := s.nomineeRepo.GetByID(ctx, nominee.ID)
	if err != nil {
		return ErrNomineeNotFound
	}

	if existingNominee.UserID != userID {
		return ErrUnauthorized
	}

	// Preserve user ID and other sensitive fields
	nominee.UserID = existingNominee.UserID
	nominee.Status = existingNominee.Status
	nominee.EmergencyAccessCode = existingNominee.EmergencyAccessCode
	nominee.LastAccessDate = existingNominee.LastAccessDate

	return s.nomineeRepo.Update(ctx, nominee)
}

// Delete removes a nominee
func (s *NomineeService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	// Verify nominee exists and user owns it
	nominee, err := s.nomineeRepo.GetByID(ctx, id)
	if err != nil {
		return ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return ErrUnauthorized
	}

	return s.nomineeRepo.Delete(ctx, id)
}

// SendInvitation generates and sends an invitation to a nominee
func (s *NomineeService) SendInvitation(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) (string, error) {
	// Verify nominee exists and user owns it
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return "", ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return "", ErrUnauthorized
	}

	// Generate emergency access code
	accessCode, err := s.authService.GenerateNomineeInvite(ctx, nomineeID)
	if err != nil {
		return "", fmt.Errorf("failed to generate invitation: %w", err)
	}

	// Update nominee status
	if err := s.nomineeRepo.UpdateStatus(ctx, nomineeID, "Pending"); err != nil {
		return "", fmt.Errorf("failed to update nominee status: %w", err)
	}

	// In a real implementation, this would send an email to the nominee
	// For now, we'll just return the access code
	return accessCode, nil
}

// ActivateNominee activates a nominee after they have accepted the invitation
func (s *NomineeService) ActivateNominee(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) error {
	// Verify nominee exists and user owns it
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return ErrUnauthorized
	}

	return s.nomineeRepo.UpdateStatus(ctx, nomineeID, "Active")
}

// RevokeNominee revokes a nominee's access
func (s *NomineeService) RevokeNominee(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) error {
	// Verify nominee exists and user owns it
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return ErrUnauthorized
	}

	return s.nomineeRepo.UpdateStatus(ctx, nomineeID, "Revoked")
}

// GetAccessLogs retrieves access logs for a user's nominees
func (s *NomineeService) GetAccessLogs(ctx context.Context, userID uuid.UUID) ([]model.NomineeAccessLog, []model.Nominee, error) {
	// Get all nominees for this user
	nominees, err := s.nomineeRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	// Collect all access logs
	allLogs := make([]model.NomineeAccessLog, 0)
	for _, nominee := range nominees {
		logs, err := s.nomineeRepo.GetAccessLogs(ctx, nominee.ID)
		if err != nil {
			return nil, nil, err
		}
		allLogs = append(allLogs, logs...)
	}

	return allLogs, nominees, nil
}
