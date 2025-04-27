package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
	"github.com/sampatti/internal/util"
)

var (
	ErrNomineeNotFound = errors.New("nominee not found")
	ErrNomineeExists   = errors.New("nominee already exists with this email")
)

type NomineeService struct {
	nomineeRepo  *postgres.NomineeRepository
	userRepo     *postgres.UserRepository
	passwordUtil *util.PasswordUtil
	authService  *AuthService
}

func NewNomineeService(
	nomineeRepo *postgres.NomineeRepository,
	userRepo *postgres.UserRepository,
	authService *AuthService,
) *NomineeService {
	return &NomineeService{
		nomineeRepo:  nomineeRepo,
		userRepo:     userRepo,
		passwordUtil: util.NewPasswordUtil(10),
		authService:  authService,
	}
}

func (s *NomineeService) Create(ctx context.Context, nominee *model.Nominee) error {
	existingNominee, err := s.nomineeRepo.GetByEmailAndUserID(ctx, nominee.Email, nominee.UserID)
	if err == nil && existingNominee != nil {
		return ErrNomineeExists
	}

	accessCode := util.GenerateRandomString(8)
	hashedCode, err := s.passwordUtil.HashPassword(accessCode)
	if err != nil {
		return fmt.Errorf("failed to hash access code: %w", err)
	}

	nominee.EmergencyAccessCode = hashedCode
	nominee.Status = "Pending"

	if err := s.nomineeRepo.Create(ctx, nominee); err != nil {
		return err
	}

	nominee.EmergencyAccessCode = accessCode
	return nil
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
	nominee.Email = existingNominee.Email
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

func (s *NomineeService) GenerateNewAccessCode(ctx context.Context, nomineeID uuid.UUID, userID uuid.UUID) (string, error) {
	nominee, err := s.nomineeRepo.GetByID(ctx, nomineeID)
	if err != nil {
		return "", ErrNomineeNotFound
	}

	if nominee.UserID != userID {
		return "", ErrUnauthorized
	}

	accessCode := util.GenerateRandomString(8)
	hashedCode, err := s.passwordUtil.HashPassword(accessCode)
	if err != nil {
		return "", fmt.Errorf("failed to hash access code: %w", err)
	}

	if err := s.nomineeRepo.UpdateEmergencyAccessCode(ctx, nomineeID, hashedCode); err != nil {
		return "", fmt.Errorf("failed to update access code: %w", err)
	}

	if err := s.ActivateNominee(ctx, nomineeID, userID); err != nil {
		fmt.Printf("Warning: Failed to activate nominee: %v\n", err)
	}

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
			continue
		}
		allLogs = append(allLogs, logs...)
	}

	return allLogs, nominees, nil
}

func (s *NomineeService) VerifyAccessCode(ctx context.Context, email string, userID uuid.UUID, accessCode string) (bool, *model.Nominee, error) {
	nominee, err := s.nomineeRepo.GetByEmailAndUserID(ctx, email, userID)
	if err != nil {
		return false, nil, ErrNomineeNotFound
	}

	if nominee.EmergencyAccessCode == "" {
		return false, nil, errors.New("no emergency access code has been set")
	}

	if !s.passwordUtil.CheckPasswordHash(accessCode, nominee.EmergencyAccessCode) {
		return false, nil, errors.New("invalid access code")
	}

	log := &model.NomineeAccessLog{
		NomineeID: nominee.ID,
		Date:      time.Now(),
		Action:    "Verified emergency access code",
	}

	if err := s.nomineeRepo.LogAccess(ctx, log); err != nil {
		fmt.Printf("Warning: Failed to log nominee access: %v\n", err)
	}

	if nominee.Status == "Pending" {
		if err := s.nomineeRepo.UpdateStatus(ctx, nominee.ID, "Active"); err != nil {
			fmt.Printf("Warning: Failed to activate nominee: %v\n", err)
		} else {
			nominee.Status = "Active"
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
		user.PasswordHash = ""
		users = append(users, *user)
	}

	return users, nil
}

func (s *NomineeService) LogNomineeAccess(ctx context.Context, log *model.NomineeAccessLog) error {
	if log.Date.IsZero() {
		log.Date = time.Now()
	}

	return s.nomineeRepo.LogAccess(ctx, log)
}

func (s *NomineeService) VerifyNomineeAccess(ctx context.Context, email, accessCode string) (*model.Nominee, *model.User, error) {
	nominee, err := s.nomineeRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, nil, ErrNomineeNotFound
	}

	if nominee.EmergencyAccessCode == "" {
		return nil, nil, errors.New("no emergency access code has been set")
	}

	if !s.passwordUtil.CheckPasswordHash(accessCode, nominee.EmergencyAccessCode) {
		return nil, nil, errors.New("invalid access code")
	}

	user, err := s.userRepo.GetByID(ctx, nominee.UserID)
	if err != nil {
		return nil, nil, err
	}

	log := &model.NomineeAccessLog{
		NomineeID: nominee.ID,
		Date:      time.Now(),
		Action:    "Emergency Access Verification",
	}

	if err := s.nomineeRepo.LogAccess(ctx, log); err != nil {
		fmt.Printf("Warning: Failed to log nominee access: %v\n", err)
	}

	if nominee.Status == "Pending" {
		if err := s.nomineeRepo.UpdateStatus(ctx, nominee.ID, "Active"); err != nil {
			fmt.Printf("Warning: Failed to activate nominee: %v\n", err)
		} else {
			nominee.Status = "Active"
		}
	}

	return nominee, user, nil
}
