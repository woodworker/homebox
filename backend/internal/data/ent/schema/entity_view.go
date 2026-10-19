package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"

	"github.com/sysadminsmedia/homebox/backend/internal/data/ent/schema/mixins"
	"github.com/sysadminsmedia/homebox/backend/internal/data/types"
)

// EntityView is a saved, named way of presenting a list of entities, shared by a
// group. Kind selects the presentation; each kind keeps its settings in its
// own config field (only "table" exists so far).
type EntityView struct {
	ent.Schema
}

func (EntityView) Mixin() []ent.Mixin {
	return []ent.Mixin{
		mixins.BaseMixin{},
		GroupMixin{
			ref:   "entity_views",
			field: "group_id",
		},
	}
}

// Fields of the EntityView.
func (EntityView) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").
			MaxLen(255).
			NotEmpty(),
		field.Enum("kind").
			Values(types.EntityViewKindTable),
		field.JSON("table_config", &types.TableViewConfig{}).
			Optional().
			Comment("Settings for kind=table"),
	}
}

func (EntityView) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("group_id"),
	}
}
