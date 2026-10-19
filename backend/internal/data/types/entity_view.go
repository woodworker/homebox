package types

// Kinds of entity views.
const (
	EntityViewKindTable = "table"
)

// Kinds of table view columns.
const (
	TableViewColumnBuiltin = "builtin"
	TableViewColumnField   = "field"
)

// TableViewConfig holds the settings of a view with kind "table".
type TableViewConfig struct {
	Columns []TableViewColumn `json:"columns" validate:"required,min=1,max=50,dive"`
	Sort    *TableViewSort    `json:"sort"    extensions:"x-nullable"`
}

// TableViewColumn is one column of a table view. Kind "builtin" refers to a
// regular entity property by its JSON name (e.g. "quantity"); kind "field"
// refers to a custom field by name, since custom fields are named freely per
// entity rather than defined centrally.
type TableViewColumn struct {
	Kind string `json:"kind" validate:"required,oneof=builtin field"`
	Key  string `json:"key"  validate:"required,max=255"`
}

// TableViewSort is the default sort order of a table view.
type TableViewSort struct {
	Kind      string `json:"kind"      validate:"required,oneof=builtin field"`
	Key       string `json:"key"       validate:"required,max=255"`
	Direction string `json:"direction" validate:"required,oneof=asc desc"`
}
