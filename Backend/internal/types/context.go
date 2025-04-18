// internal/types/context.go
package types

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ContextKey defines keys used in context
type ContextKey string

const (
	// UserIDKey is the key for user ID in context
	UserIDKey ContextKey = "userID"
	// IsNomineeKey is the key for nominee status in context
	IsNomineeKey ContextKey = "isNominee"
	// AccessTypeKey is the key for access type in context
	AccessTypeKey ContextKey = "accessType"
	// AccessLevelKey is the key for access level in context
	AccessLevelKey ContextKey = "accessLevel"
)

// ExtractUserID extracts user ID from context values map
func ExtractUserID(values map[string]interface{}) (uuid.UUID, bool) {
	userID, exists := values[string(UserIDKey)]
	if !exists {
		return uuid.UUID{}, false
	}

	id, ok := userID.(uuid.UUID)
	return id, ok
}

// ExtractUserIDFromGin extracts user ID from gin context
func ExtractUserIDFromGin(c *gin.Context) (uuid.UUID, bool) {
	userID, exists := c.Get(string(UserIDKey))
	if !exists {
		return uuid.UUID{}, false
	}

	id, ok := userID.(uuid.UUID)
	return id, ok
}
