package api

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/sampatti/internal/config"
)

type Server struct {
	router     *gin.Engine
	httpServer *http.Server
	cfg        *config.Config
	db         *sqlx.DB
}

func NewServer(cfg *config.Config, db *sqlx.DB) *Server {
	router := gin.Default()

	server := &Server{
		router: router,
		cfg:    cfg,
		db:     db,
	}

	server.setupRoutes()

	server.httpServer = &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	return server
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
