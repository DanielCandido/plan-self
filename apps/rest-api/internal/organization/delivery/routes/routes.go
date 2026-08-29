package routes

import (
	"plan-self-api/internal/organization/delivery/handlers"

	"github.com/gofiber/fiber/v2"
)

func Register(app *fiber.App) {
	api := app.Group("/api/organizations")

	api.Get("/", handlers.GetOrganizations)
}
