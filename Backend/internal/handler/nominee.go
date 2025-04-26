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

	c.JSON(http.StatusCreated, nominee)
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
		"code":    accessCode,
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
	nomineeID, ok := types.ExtractUserIDFromGin(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	nominee, err := h.userService.GetByID(c.Request.Context(), nomineeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user details"})
		return
	}

	userIDParam := c.Param("userID")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var request struct {
		AccessCode string `json:"access_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	isValid, nomineeInfo, err := h.nomineeService.VerifyAccessCode(
		c.Request.Context(),
		nominee.Email,
		userID,
		request.AccessCode,
	)

	if err != nil || !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid access code"})
		return
	}

	token, err := h.authService.GenerateNomineeToken(nomineeInfo.ID, userID, nomineeInfo.AccessLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Access granted",
		"access_token": token,
		"access_level": nomineeInfo.AccessLevel,
	})
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

	accessLevel, _ := c.Get(string(types.AccessLevelKey))

	if accessLevel.(string) == "Full" {
		assets, _ := h.assetService.GetByUserID(c.Request.Context(), userID)
		documents, _ := h.documentService.GetByUserID(c.Request.Context(), userID)

		c.JSON(http.StatusOK, gin.H{
			"assets":    assets,
			"documents": documents,
		})
	} else if accessLevel.(string) == "Limited" {
		assets, _ := h.assetService.GetByUserID(c.Request.Context(), userID)
		c.JSON(http.StatusOK, gin.H{
			"assets": assets,
		})
	} else {
		documents, _ := h.documentService.GetNomineeDocuments(c.Request.Context(), userID)
		c.JSON(http.StatusOK, gin.H{
			"documents": documents,
		})
	}
}
