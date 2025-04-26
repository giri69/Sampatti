package api

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sampatti/internal/config"
	"github.com/sampatti/internal/handler"
	"github.com/sampatti/internal/repository/postgres"
	"github.com/sampatti/internal/service"
	"github.com/sampatti/internal/util"
)

func convertR2Config(cfg *config.R2Config) *service.R2Config {
	return &service.R2Config{
		AccountID:       cfg.AccountID,
		AccessKeyID:     cfg.AccessKeyID,
		AccessKeySecret: cfg.AccessKeySecret,
		BucketName:      cfg.BucketName,
	}
}

func (s *Server) setupRoutes() {
	userRepo := postgres.NewUserRepository(s.db)
	assetRepo := postgres.NewAssetRepository(s.db)
	nomineeRepo := postgres.NewNomineeRepository(s.db)
	documentRepo := postgres.NewDocumentRepository(s.db)
	alertRepo := postgres.NewAlertRepository(s.db)

	passwordUtil := util.NewPasswordUtil(10)
	jwtUtil := util.NewJWTUtil(s.cfg.JWT.Secret)

	storageService, err := service.NewStorageService(convertR2Config(&s.cfg.R2))
	if err != nil {
		panic(err)
	}

	authService := service.NewAuthService(userRepo, nomineeRepo, &s.cfg.JWT, passwordUtil)
	userService := service.NewUserService(userRepo)
	assetService := service.NewAssetService(assetRepo)
	nomineeService := service.NewNomineeService(nomineeRepo, userRepo, authService)
	documentService := service.NewDocumentService(documentRepo, storageService)
	alertService := service.NewAlertService(alertRepo)

	authHandler := handler.NewAuthHandler(authService, s.db)
	userHandler := handler.NewUserHandler(userService)
	assetHandler := handler.NewAssetHandler(assetService)
	nomineeHandler := handler.NewNomineeHandler(
		nomineeService,
		userService,
		assetService,
		documentService,
		authService,
	)
	documentHandler := handler.NewDocumentHandler(documentService)
	alertHandler := handler.NewAlertHandler(alertService)

	authMiddleware := NewAuthMiddleware(jwtUtil)

	s.router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	v1 := s.router.Group("/api/v1")

	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "timestamp": time.Now().Unix()})
	})

	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh-token", authHandler.RefreshToken)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/reset-password", authHandler.ResetPassword)
		auth.POST("/emergency-access", authHandler.EmergencyAccess)
	}

	api := v1.Group("")
	api.Use(authMiddleware.Authenticate())

	users := api.Group("/users")
	{
		users.GET("/profile", userHandler.GetProfile)
		users.PUT("/profile", userHandler.UpdateProfile)
		users.PATCH("/settings", userHandler.UpdateSettings)
		users.POST("/change-password", authHandler.ChangePassword)
	}

	assets := api.Group("/assets")
	{
		assets.GET("", assetHandler.GetAll)
		assets.POST("", assetHandler.Create)
		assets.GET("/:id", assetHandler.GetByID)
		assets.PUT("/:id", assetHandler.Update)
		assets.DELETE("/:id", assetHandler.Delete)
		assets.PATCH("/:id/value", assetHandler.UpdateValue)
		assets.GET("/types/:type", assetHandler.GetByType)
		assets.GET("/summary", assetHandler.GetSummary)
		assets.GET("/:id/history", assetHandler.GetHistory)
	}

	nominees := api.Group("/nominees")
	{
		nominees.GET("", nomineeHandler.GetAll)
		nominees.POST("", nomineeHandler.Create)
		nominees.GET("/:id", nomineeHandler.GetByID)
		nominees.PUT("/:id", nomineeHandler.Update)
		nominees.DELETE("/:id", nomineeHandler.Delete)
		nominees.POST("/:id/send-invitation", nomineeHandler.SendInvitation)
		nominees.GET("/access-log", nomineeHandler.GetAccessLogs)
	}

	nomineeAccess := api.Group("/nominee-access")
	{
		nomineeAccess.GET("/users", nomineeHandler.GetUsersForNominee)
		nomineeAccess.POST("/access/:userID", nomineeHandler.AccessUserData)
		nomineeAccess.GET("/data/:userID", nomineeHandler.GetUserData)
	}

	documents := api.Group("/documents")
	{
		documents.GET("", documentHandler.GetAll)
		documents.POST("", documentHandler.Upload)
		documents.GET("/:id", documentHandler.GetByID)
		documents.GET("/:id/download", documentHandler.Download)
		documents.PUT("/:id", documentHandler.Update)
		documents.DELETE("/:id", documentHandler.Delete)
		documents.PATCH("/:id/nominee-access", documentHandler.UpdateNomineeAccess)
	}

	alerts := api.Group("/alerts")
	{
		alerts.GET("", alertHandler.GetAll)
		alerts.PATCH("/:id/read", alertHandler.MarkAsRead)
	}
}
