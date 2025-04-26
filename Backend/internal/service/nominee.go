package service

import (
	"context"
	"errors"
	"fmt"
	"time"

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
	userRepo    *postgres.UserRepository
	authService *AuthService
}

func NewNomineeService(
	nomineeRepo *postgres.NomineeRepository,
	userRepo *postgres.UserRepository,
	authService *AuthService,
) *NomineeService {
	return &NomineeService{
		nomineeRepo: nomineeRepo,
		userRepo:    userRepo,
		authService: authService,
	}
}

func (s *NomineeService) Create(ctx context.Context, nominee *model.Nominee) error {
	existingNominee, err := s.nomineeRepo.GetByEmail(ctx, nominee.Email)
	if err == nil && existingNominee != nil && existingNominee.UserID == nominee.UserID {
		return ErrNomineeExists
	}

	return s.nomineeRepo.Create(ctx, nominee)
}

func (s *NomineeService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.Nominee, error) {
	nominee, err := s.nomineeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return nil, ErrUnauthorized
	}

	return nominee, nil
}

func (s *NomineeService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]model.Nominee, error) {
	return s.nomineeRepo.GetByUserID(ctx, userID)
}

func (s *NomineeService) Update(ctx context.Context, nominee *model.Nominee, userID uuid.UUID) error {
	existingNominee, err := s.nomineeRepo.GetByID(ctx, nominee.ID)
	if err != nil {
		return ErrNomineeNotFound
	}

	if existingNominee.UserID != userID {
		return ErrUnauthorized
	}

	nominee.UserID = existingNominee.UserID
	nominee.Status = existingNominee.Status
	nominee.EmergencyAccessCode = existingNominee.EmergencyAccessCode
	nominee.LastAccessDate = existingNominee.LastAccessDate

	return s.nomineeRepo.Update(ctx, nominee)
}

func (s *NomineeService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	nominee, err := s.nomineeRepo.GetByID(ctx, id)
	if err != nil {
		return ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return ErrUnauthorized
	}

	return s.nomineeRepo.Delete(ctx, id)
}

func (s *NomineeService) SendInvitation(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) (string, error) {
	// Verify nominee belongs to the user
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return "", ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return "", ErrUnauthorized
	}

	// Generate access code using the auth service
	// This now properly handles updating the nominee record with the access code
	accessCode, err := s.authService.GenerateNomineeInvite(ctx, nomineeID)
	if err != nil {
		return "", fmt.Errorf("failed to generate invitation: %w", err)
	}

	fmt.Printf("Successfully generated access code for nominee %s: %s\n", nomineeID, accessCode)
	return accessCode, nil
}

func (s *NomineeService) ActivateNominee(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) error {
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return ErrUnauthorized
	}

	return s.nomineeRepo.UpdateStatus(ctx, nomineeID, "Active")
}

func (s *NomineeService) RevokeNominee(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) error {
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return ErrUnauthorized
	}

	return s.nomineeRepo.UpdateStatus(ctx, nomineeID, "Revoked")
}

func (s *NomineeService) GetAccessLogs(ctx context.Context, userID uuid.UUID) ([]model.NomineeAccessLog, []model.Nominee, error) {
	nominees, err := s.nomineeRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

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

func (s *NomineeService) VerifyAccessCode(ctx context.Context, nomineeEmail string, userID uuid.UUID, accessCode string) (bool, *model.Nominee, error) {
	// Get nominee by email and user ID
	nominee, err := s.nomineeRepo.GetByEmailAndUserID(ctx, nomineeEmail, userID)
	if err != nil {
		fmt.Printf("Nominee not found for email %s and user %s: %v\n", nomineeEmail, userID, err)
		return false, nil, ErrNomineeNotFound
	}

	// Check if the nominee has an emergency access code set
	if nominee.EmergencyAccessCode == "" {
		fmt.Printf("Nominee %s has no emergency access code set\n", nominee.ID)
		return false, nil, errors.New("no emergency access code has been set for this nominee")
	}

	// Verify the emergency access code
	isValid := s.authService.VerifyNomineeCode(accessCode, nominee.EmergencyAccessCode)
	if !isValid {
		fmt.Printf("Invalid access code for nominee %s\n", nominee.ID)
		return false, nil, errors.New("invalid access code")
	}

	fmt.Printf("Access code verification successful for nominee %s\n", nominee.ID)

	// Create access log
	log := &model.NomineeAccessLog{
		NomineeID: nominee.ID,
		Date:      time.Now(),
		Action:    "Verified emergency access code",
	}

	// Log the access
	if err := s.nomineeRepo.LogAccess(ctx, log); err != nil {
		// Just log the error but don't fail the verification
		fmt.Printf("Warning: Failed to log nominee access: %v\n", err)
	}

	// If nominee was pending, activate them
	if nominee.Status == "Pending" {
		if err := s.nomineeRepo.UpdateStatus(ctx, nominee.ID, "Active"); err != nil {
			// Just log the error but don't fail the verification
			fmt.Printf("Warning: Failed to activate nominee: %v\n", err)
		} else {
			nominee.Status = "Active" // Update the returned nominee object
			fmt.Printf("Updated nominee %s status to Active\n", nominee.ID)
		}
	}

	return true, nominee, nil
}

func (s *NomineeService) GetUsersForNominee(ctx context.Context, nomineeEmail string) ([]model.User, error) {
	nominees, err := s.nomineeRepo.GetByNomineeEmail(ctx, nomineeEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to get nominees: %w", err)
	}

	users := make([]model.User, 0, len(nominees))
	for _, nominee := range nominees {
		user, err := s.userRepo.GetByID(ctx, nominee.UserID)
		if err != nil {
			continue
		}
		// Remove sensitive data
		user.PasswordHash = ""
		users = append(users, *user)
	}

	return users, nil
}
