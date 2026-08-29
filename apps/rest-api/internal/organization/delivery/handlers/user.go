package handlers

import "github.com/gofiber/fiber/v2"

func GetOrganizations(c *fiber.Ctx) error {

	return c.JSON([]string{
		"Daniel",
		"Maria",
	})

}
