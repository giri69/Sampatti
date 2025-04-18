package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/types"
)

type AssetHandler struct {
	assetService *service.AssetService
}

func NewAssetHandler(assetService *service.AssetService) *AssetHandler {
	return &AssetHandler{assetService: assetService}
}

// Create handles the creation of a new asset
func (h *AssetHandler) Create(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var asset model.Asset
	if err := c.ShouldBindJSON(&asset); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Set the user ID from the authenticated user
	asset.UserID = userID

	if err := h.assetService.Create(c.Request.Context(), &asset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create asset", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, asset)
}

// GetByID returns a specific asset by ID
func (h *AssetHandler) GetByID(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	assetID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID"})
		return
	}

	asset, err := h.assetService.GetByID(c.Request.Context(), assetID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrAssetNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, asset)
}

// GetAll returns all assets for the authenticated user
func (h *AssetHandler) GetAll(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	assets, err := h.assetService.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch assets", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assets)
}

// GetByType returns assets of a specific type for the authenticated user
func (h *AssetHandler) GetByType(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	assetType := c.Param("type")
	if assetType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "asset type is required"})
		return
	}

	assets, err := h.assetService.GetByType(c.Request.Context(), userID, assetType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch assets", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assets)
}

// Update handles updating an existing asset
func (h *AssetHandler) Update(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	assetID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID"})
		return
	}

	var asset model.Asset
	if err := c.ShouldBindJSON(&asset); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Ensure the asset ID matches the URL parameter
	asset.ID = assetID

	if err := h.assetService.Update(c.Request.Context(), &asset, userID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrAssetNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, asset)
}

// Delete handles deleting an asset
func (h *AssetHandler) Delete(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	assetID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID"})
		return
	}

	if err := h.assetService.Delete(c.Request.Context(), assetID, userID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrAssetNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "asset deleted successfully"})
}

// UpdateValue handles updating just the current value of an asset
func (h *AssetHandler) UpdateValue(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	assetID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID"})
		return
	}

	var request struct {
		Value float64 `json:"value" binding:"required"`
		Notes string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	if err := h.assetService.UpdateValue(c.Request.Context(), assetID, userID, request.Value, request.Notes); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrAssetNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "asset value updated successfully"})
}

// GetSummary returns a summary of all assets for the authenticated user
func (h *AssetHandler) GetSummary(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	summary, err := h.assetService.GetSummary(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate summary", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetHistory returns the value history for a specific asset
func (h *AssetHandler) GetHistory(c *gin.Context) {
	userID, ok := types.ExtractUserID(c.Keys)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idParam := c.Param("id")
	assetID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid asset ID"})
		return
	}

	history, err := h.assetService.GetHistory(c.Request.Context(), assetID, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrAssetNotFound) {
			status = http.StatusNotFound
		} else if errors.Is(err, service.ErrUnauthorized) {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}
