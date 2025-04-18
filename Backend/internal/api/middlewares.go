package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sampatti/internal/types"
	"github.com/sampatti/internal/util"
)

type AuthMiddleware struct {
	jwtUtil *util.JWTUtil
}

func NewAuthMiddleware(jwtUtil *util.JWTUtil) *AuthMiddleware {
	return &AuthMiddleware{jwtUtil: jwtUtil}
}

func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		// Extract token from header
		tokenString, err := m.jwtUtil.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "message": err.Error()})
			c.Abort()
			return
		}

		// Validate token
		claims, err := m.jwtUtil.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "message": "invalid token"})
			c.Abort()
			return
		}

		// Set user ID and access info in context
		c.Set(string(types.UserIDKey), claims.UserID)
		c.Set(string(types.IsNomineeKey), claims.IsNominee)
		c.Set(string(types.AccessTypeKey), claims.AccessType)
		c.Set(string(types.AccessLevelKey), claims.AccessLevel)

		c.Next()
	}
}

// RequireUserAccess ensures only regular users (not nominees) can access a route
func (m *AuthMiddleware) RequireUserAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		isNominee, exists := c.Get(string(types.IsNomineeKey))
		if !exists || isNominee.(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "requires user access"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireFullAccess ensures only users with full access (not limited nominees) can access a route
func (m *AuthMiddleware) RequireFullAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		isNominee, exists := c.Get(string(types.IsNomineeKey))
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "access information missing"})
			c.Abort()
			return
		}

		if isNominee.(bool) {
			accessLevel, _ := c.Get(string(types.AccessLevelKey))
			if accessLevel.(string) != "Full" {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": "requires full access"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
