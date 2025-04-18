package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sampatti/internal/api"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/service"
)

type NomineeHandler struct {
	nomineeService *service.NomineeService
}

func NewNomineeHandler(nomineeService *service.NomineeService) *NomineeHandler {
	return &NomineeHandler{nomineeService: nomineeService}
}

// Create handles adding a new nominee
func (h *NomineeHandler) Create(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var request struct {
		Name         string `json:"name" binding:"required"`
		Email        string `json:"email" binding:"required,email"`
		PhoneNumber  string `json:"phone_number"`
		Relationship string `json:"relationship"`
		AccessLevel  string `json:"access_level" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Validate access level
	if request.AccessLevel != "Full" && request.AccessLevel != "Limited" && request.AccessLevel != "DocumentsOnly" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid access level, must be 'Full', 'Limited', or 'DocumentsOnly'"})
		return
	}

	nominee := &model.Nominee{
		UserID:       userID,
		Name:         request.Name,
		Email:        request.Email,
		PhoneNumber:  request.PhoneNumber,
		Relationship: request.Relationship,
		AccessLevel:  request.AccessLevel,
		Status:       "Pending",
	}

	if err := h.nomineeService.Create(c.Request.Context(), nominee); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrNomineeExists) {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, nominee)
}

// GetByID returns a specific nominee by ID
func (h *NomineeHandler) GetByID(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	nomineeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid nominee ID"})
		return
	}

	nominee, err := h.nomineeService.GetByID(c.Request.Context(), nomineeID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrNomineeNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nominee)
}

// GetAll returns all nominees for the authenticated user
func (h *NomineeHandler) GetAll(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	nominees, err := h.nomineeService.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch nominees", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nominees)
}

// Update handles updating a nominee's information
func (h *NomineeHandler) Update(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	nomineeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid nominee ID"})
		return
	}

	var request struct {
		Name         string `json:"name" binding:"required"`
		PhoneNumber  string `json:"phone_number"`
		Relationship string `json:"relationship"`
		AccessLevel  string `json:"access_level" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Validate access level
	if request.AccessLevel != "Full" && request.AccessLevel != "Limited" && request.AccessLevel != "DocumentsOnly" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid access level, must be 'Full', 'Limited', or 'DocumentsOnly'"})
		return
	}

	// Get existing nominee to preserve email
	existingNominee, err := h.nomineeService.GetByID(c.Request.Context(), nomineeID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrNomineeNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	nominee := &model.Nominee{
		ID:           nomineeID,
		UserID:       userID,
		Name:         request.Name,
		Email:        existingNominee.Email, // Preserve email
		PhoneNumber:  request.PhoneNumber,
		Relationship: request.Relationship,
		AccessLevel:  request.AccessLevel,
	}

	if err := h.nomineeService.Update(c.Request.Context(), nominee, userID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrNomineeNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nominee)
}

// Delete handles removing a nominee
func (h *NomineeHandler) Delete(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	nomineeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid nominee ID"})
		return
	}

	if err := h.nomineeService.Delete(c.Request.Context(), nomineeID, userID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrNomineeNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "nominee deleted successfully"})
}

// SendInvitation handles generating and sending an invitation to a nominee
func (h *NomineeHandler) SendInvitation(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	nomineeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid nominee ID"})
		return
	}

	accessCode, err := h.nomineeService.SendInvitation(c.Request.Context(), nomineeID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrNomineeNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "invitation sent successfully",
		"code":    accessCode, // In a production app, this would only be sent via email
	})
}

// GetAccessLogs returns access logs for all nominees
func (h *NomineeHandler) GetAccessLogs(c *gin.Context) {
	userID, ok := api.ExtractUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	logs, nominees, err := h.nomineeService.GetAccessLogs(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch access logs", "details": err.Error()})
		return
	}

	// Create a map of nominee IDs to names for reference
	nomineeMap := make(map[string]string)
	for _, nominee := range nominees {
		nomineeMap[nominee.ID.String()] = nominee.Name
	}

	// Augment logs with nominee names
	type EnhancedLog struct {
		model.NomineeAccessLog
		NomineeName string `json:"nominee_name"`
	}

	enhancedLogs := make([]EnhancedLog, 0, len(logs))
	for _, log := range logs {
		name, ok := nomineeMap[log.NomineeID.String()]
		if !ok {
			name = "Unknown"
		}

		enhancedLogs = append(enhancedLogs, EnhancedLog{
			NomineeAccessLog: log,
			NomineeName:      name,
		})
	}

	c.JSON(http.StatusOK, enhancedLogs)
}
