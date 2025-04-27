package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sampatti/internal/model"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/types"
)

type NomineeHandler struct {
	nomineeService  *service.NomineeService
	userService     *service.UserService
	assetService    *service.AssetService
	documentService *service.DocumentService
	authService     *service.AuthService
}

func NewNomineeHandler(
	nomineeService *service.NomineeService,
	userService *service.UserService,
	assetService *service.AssetService,
	documentService *service.DocumentService,
	authService *service.AuthService,
) *NomineeHandler {
	return &NomineeHandler{
		nomineeService:  nomineeService,
		userService:     userService,
		assetService:    assetService,
		documentService: documentService,
		authService:     authService,
	}
}

// Create handles creating a new nominee
func (h *NomineeHandler) Create(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
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

	// Generate an emergency access code for the nominee
	accessCode, err := h.authService.GenerateNomineeInvite(c.Request.Context(), nominee.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access code"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"nominee": gin.H{
			"id":           nominee.ID,
			"name":         nominee.Name,
			"email":        nominee.Email,
			"access_level": nominee.AccessLevel,
			"status":       nominee.Status,
		},
		"code":    accessCode,
		"message": "Store this emergency access code securely and share it with your nominee. This code will not be shown again.",
	})
}

func (h *NomineeHandler) GetByID(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
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

func (h *NomineeHandler) GetAll(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
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

func (h *NomineeHandler) Update(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
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

	if request.AccessLevel != "Full" && request.AccessLevel != "Limited" && request.AccessLevel != "DocumentsOnly" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid access level, must be 'Full', 'Limited', or 'DocumentsOnly'"})
		return
	}

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
		Email:        existingNominee.Email,
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

func (h *NomineeHandler) Delete(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
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

func (h *NomineeHandler) SendInvitation(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
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

	// Get nominee to validate ownership
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

	// Generate access code
	accessCode, err := h.authService.GenerateNomineeInvite(c.Request.Context(), nomineeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate invitation code"})
		return
	}

	// Update nominee status to active immediately
	if err := h.nomineeService.ActivateNominee(c.Request.Context(), nomineeID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to activate nominee"})
		return
	}

	// Return the code directly to be shared with the nominee
	c.JSON(http.StatusOK, gin.H{
		"message":       "Access code generated successfully",
		"code":          accessCode,
		"nominee_email": nominee.Email,
		"nominee_name":  nominee.Name,
		"instructions":  "Share this code with your nominee. They can use it along with their email to access your investment information in case of emergency.",
	})
}

func (h *NomineeHandler) GetAccessLogs(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	logs, nominees, err := h.nomineeService.GetAccessLogs(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch access logs", "details": err.Error()})
		return
	}

	nomineeMap := make(map[string]string)
	for _, nominee := range nominees {
		nomineeMap[nominee.ID.String()] = nominee.Name
	}

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

func (h *NomineeHandler) GetUsersForNominee(c *gin.Context) {
	userID, ok := types.ExtractUserIDFromGin(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userService.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user details"})
		return
	}

	users, err := h.nomineeService.GetUsersForNominee(c.Request.Context(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *NomineeHandler) AccessUserData(c *gin.Context) {
	var request struct {
		Email      string `json:"email" binding:"required,email"`
		AccessCode string `json:"access_code" binding:"required"`
		UserID     string `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	userID, err := uuid.Parse(request.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// Verify the nominee's access
	isValid, nomineeInfo, err := h.nomineeService.VerifyAccessCode(
		c.Request.Context(),
		request.Email,
		userID,
		request.AccessCode,
	)

	if err != nil || !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid access code"})
		return
	}

	// Generate access token for further API usage
	token, err := h.authService.GenerateNomineeToken(nomineeInfo.ID, userID, nomineeInfo.AccessLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	// Log the access
	accessLog := &model.NomineeAccessLog{
		NomineeID:  nomineeInfo.ID,
		Date:       time.Now(),
		Action:     "Emergency Data Access",
		IPAddress:  c.ClientIP(),
		DeviceInfo: c.Request.UserAgent(),
	}

	if err := h.nomineeService.LogNomineeAccess(c.Request.Context(), accessLog); err != nil {
		// Just log the error but don't fail the authentication
		// Log statement would go here in production code
	}

	// Get user data
	user, err := h.userService.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Collect data based on access level
	var assets []model.Asset
	var documents []model.Document

	if nomineeInfo.AccessLevel == "Full" || nomineeInfo.AccessLevel == "Limited" {
		assets, _ = h.assetService.GetByUserID(c.Request.Context(), userID)
	}

	if nomineeInfo.AccessLevel == "Full" || nomineeInfo.AccessLevel == "Limited" {
		documents, _ = h.documentService.GetByUserID(c.Request.Context(), userID)
	} else {
		documents, _ = h.documentService.GetNomineeDocuments(c.Request.Context(), nomineeInfo.ID)
	}

	// Return the data
	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
		"access_level": nomineeInfo.AccessLevel,
		"assets":       assets,
		"documents":    documents,
	})
}

// LogNomineeAccess is a helper method to log nominee access activities
func (h *NomineeHandler) LogNomineeAccess(c *gin.Context) {
	nomineeID, ok := types.ExtractUserIDFromGin(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var request struct {
		Action string `json:"action" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	accessLog := &model.NomineeAccessLog{
		NomineeID:  nomineeID,
		Date:       time.Now(),
		Action:     request.Action,
		IPAddress:  c.ClientIP(),
		DeviceInfo: c.Request.UserAgent(),
	}

	if err := h.nomineeService.LogNomineeAccess(c.Request.Context(), accessLog); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to log access"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "access logged successfully"})
}

func (h *NomineeHandler) GetUserData(c *gin.Context) {
	isNominee, exists := c.Get(string(types.IsNomineeKey))
	if !exists || !isNominee.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"error": "requires nominee access"})
		return
	}

	userIDParam := c.Param("userID")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	nomineeID, _ := types.ExtractUserIDFromGin(c)
	accessLevel, _ := c.Get(string(types.AccessLevelKey))

	// Get the user for basic info
	user, err := h.userService.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Log the access attempt
	accessLog := &model.NomineeAccessLog{
		NomineeID:  nomineeID,
		Date:       time.Now(),
		Action:     "Viewed User Data",
		IPAddress:  c.ClientIP(),
		DeviceInfo: c.Request.UserAgent(),
	}

	if err := h.nomineeService.LogNomineeAccess(c.Request.Context(), accessLog); err != nil {
		// Just log the error but don't fail the request
		// Production code would have a logger here
	}

	// Collect data based on access level
	var assets []model.Asset
	var documents []model.Document

	if accessLevel.(string) == "Full" {
		assets, _ = h.assetService.GetByUserID(c.Request.Context(), userID)
		documents, _ = h.documentService.GetByUserID(c.Request.Context(), userID)

		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":    user.ID,
				"name":  user.Name,
				"email": user.Email,
			},
			"access_level": accessLevel,
			"assets":       assets,
			"documents":    documents,
		})
	} else if accessLevel.(string) == "Limited" {
		assets, _ = h.assetService.GetByUserID(c.Request.Context(), userID)

		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":    user.ID,
				"name":  user.Name,
				"email": user.Email,
			},
			"access_level": accessLevel,
			"assets":       assets,
		})
	} else {
		documents, _ = h.documentService.GetNomineeDocuments(c.Request.Context(), nomineeID)

		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":    user.ID,
				"name":  user.Name,
				"email": user.Email,
			},
			"access_level": accessLevel,
			"documents":    documents,
		})
	}
}
