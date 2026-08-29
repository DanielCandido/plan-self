package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// User holds the schema definition for the User entity.
type User struct {
	ent.Schema
}

// Fields of the User.
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("email").Unique().NotEmpty(),
		field.String("name").NotEmpty(),
		field.String("passwordHash"),
		field.Enum("status").Values("ACTIVE", "BLOCKED").Default("ACTIVE"),
		field.Enum("role").Values("OWNER", "ADMIN", "MANAGER", "MEMBER", "GUEST").Default("MEMBER"),
		field.String("avatarUrl"),
		field.String("onlineStatus").Default("offline"),
		field.Time("createdAt").Default(time.Now()),
		field.Time("updatedAt").Default(time.Now()).UpdateDefault(time.Now()),
	}
}

// Edges of the User.
func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("Organization", Organization.Type),
	}
}
