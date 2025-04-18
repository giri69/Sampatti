package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sampatti/internal/api"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/service"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// GetProfile returns the authenticated user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userService.GetByID(c.Request.Context(), userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrUserNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	// Don't expose sensitive information
	user.PasswordHash = ""

	c.JSON(http.StatusOK, user)
}

// UpdateProfile updates the authenticated user's profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var request struct {
		Name        string     `json:"name" binding:"required"`
		PhoneNumber string     `json:"phone_number"`
		DateOfBirth *time.Time `json:"date_of_birth"`
		KYCVerified bool       `json:"kyc_verified"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	user := &model.User{
		ID:          userID,
		Name:        request.Name,
		PhoneNumber: request.PhoneNumber,
		DateOfBirth: request.DateOfBirth,
		KYCVerified: request.KYCVerified,
	}

	if err := h.userService.Update(c.Request.Context(), user); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrUserNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "profile updated successfully"})
}

// UpdateSettings updates the authenticated user's settings
func (h *UserHandler) UpdateSettings(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var request struct {
		Notifications    bool   `json:"notifications"`
		DefaultCurrency  string `json:"default_currency"`
		TwoFactorEnabled bool   `json:"two_factor_enabled"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Validate currency
	if request.DefaultCurrency == "" {
		request.DefaultCurrency = "INR" // Default to INR
	}

	err := h.userService.UpdateSettings(
		c.Request.Context(),
		userID,
		request.Notifications,
		request.DefaultCurrency,
		request.TwoFactorEnabled,
	)

	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrUserNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "settings updated successfully"})
}
