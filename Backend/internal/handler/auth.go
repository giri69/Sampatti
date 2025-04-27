package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/repository/postgres"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/types"
)

type AuthHandler struct {
	authService    *service.AuthService
	nomineeService *service.NomineeService
	db             *sqlx.DB
}

func NewAuthHandler(authService *service.AuthService, db *sqlx.DB) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		db:          db,
	}
}

// Set the nominee service after creation
func (h *AuthHandler) SetNomineeService(nomineeService *service.NomineeService) {
	h.nomineeService = nomineeService
}

// Register handles new user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var request struct {
		Name        string     `json:"name" binding:"required"`
		Email       string     `json:"email" binding:"required,email"`
		PhoneNumber string     `json:"phone_number"`
		Password    string     `json:"password" binding:"required,min=8"`
		DateOfBirth *time.Time `json:"date_of_birth"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		detailedError := err.Error()
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": detailedError})
		return
	}

	user := &model.User{
		Name:        request.Name,
		Email:       request.Email,
		PhoneNumber: request.PhoneNumber,
		DateOfBirth: request.DateOfBirth,
	}

	err := h.authService.RegisterUser(c.Request.Context(), user, request.Password)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrUserAlreadyExists) {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var request struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Authenticate user and get tokens
	accessToken, refreshToken, err := h.authService.Login(c.Request.Context(), request.Email, request.Password)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidCredentials) {
			status = http.StatusUnauthorized
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	// Fetch user profile after successful authentication
	userRepo := postgres.NewUserRepository(h.db)
	user, err := userRepo.GetByEmail(c.Request.Context(), request.Email)
	if err != nil {
		// Still return tokens even if user fetch fails
		c.JSON(http.StatusOK, gin.H{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"token_type":    "Bearer",
		})
		return
	}

	// Sanitize user data for response (remove sensitive fields)
	userData := gin.H{
		"id":           user.ID,
		"name":         user.Name,
		"email":        user.Email,
		"phone_number": user.PhoneNumber,
		"created_at":   user.CreatedAt,
	}

	// Return tokens and user data
	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
		"user":          userData,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var request struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	accessToken, err := h.authService.RefreshToken(c.Request.Context(), request.RefreshToken)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidToken) || errors.Is(err, service.ErrExpiredToken) {
			status = http.StatusUnauthorized
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"token_type":   "Bearer",
	})
}

// ChangePassword handles password changes
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var request struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	err := h.authService.ChangePassword(c.Request.Context(), userID, request.OldPassword, request.NewPassword)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidCredentials) {
			status = http.StatusUnauthorized
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password changed successfully"})
}

// ForgotPassword initiates the password reset process
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var request struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "if your email exists in our system, you will receive password reset instructions"})
}

// ResetPassword completes the password reset process
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var request struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min:8"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password has been reset successfully"})
}

// EmergencyAccess handles nominee emergency access
func (h *AuthHandler) EmergencyAccess(c *gin.Context) {
	var request struct {
		Email               string `json:"email" binding:"required,email"`
		EmergencyAccessCode string `json:"emergency_access_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Verify the nominee's access
	nominee, user, err := h.nomineeService.VerifyNomineeAccess(
		c.Request.Context(),
		request.Email,
		request.EmergencyAccessCode,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Check nominee status
	if nominee.Status != "Active" && nominee.Status != "Pending" {
		c.JSON(http.StatusForbidden, gin.H{"error": "nominee access is not active"})
		return
	}

	// Generate access token for API usage
	token, err := h.authService.GenerateNomineeToken(nominee.ID, user.ID, nominee.AccessLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	// Sanitize user data
	userData := map[string]interface{}{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
	}

	// Collect data based on access level
	response := gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"user":         userData,
		"access_level": nominee.AccessLevel,
		"user_id":      user.ID,
	}

	// For DocumentsOnly access, no need to include assets data
	// The frontend will fetch documents only based on the access_level

	c.JSON(http.StatusOK, response)
}
