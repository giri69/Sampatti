package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/types" // Changed from api to types
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
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

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var request struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	accessToken, refreshToken, err := h.authService.Login(c.Request.Context(), request.Email, request.Password)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidCredentials) {
			status = http.StatusUnauthorized
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
	})
}

// RefreshToken handles refreshing an access token
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
	userID, ok := types.ExtractUserIDFromGin(c) // Updated to use types package
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
	// For brevity, this is a simplified implementation
	var request struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// In a real implementation, this would send an email to the nominee
	c.JSON(http.StatusOK, gin.H{"message": "if your email exists in our system, you will receive password reset instructions"})
}

// ResetPassword completes the password reset process
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	// For brevity, this is a simplified implementation
	var request struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// In a real implementation, this would validate the token and update the password
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

	accessToken, err := h.authService.NomineeEmergencyAccess(
		c.Request.Context(),
		request.Email,
		request.EmergencyAccessCode,
	)

	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidCredentials) {
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
