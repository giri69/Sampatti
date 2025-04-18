package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/types"
)

type AlertHandler struct {
	alertService *service.AlertService
}

func NewAlertHandler(alertService *service.AlertService) *AlertHandler {
	return &AlertHandler{alertService: alertService}
}

// GetAll returns all alerts for the authenticated user
func (h *AlertHandler) GetAll(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Check if including read alerts
	includeReadStr := c.DefaultQuery("include_read", "false")
	includeRead, _ := strconv.ParseBool(includeReadStr)

	alerts, err := h.alertService.GetByUserID(c.Request.Context(), userID, includeRead)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch alerts", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alerts)
}

// MarkAsRead marks an alert as read
func (h *AlertHandler) MarkAsRead(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	alertID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert ID"})
		return
	}

	if err := h.alertService.MarkAsRead(c.Request.Context(), alertID, userID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrAlertNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert marked as read"})
}
