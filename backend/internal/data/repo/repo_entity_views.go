package repo

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sysadminsmedia/homebox/backend/internal/data/ent"
	"github.com/sysadminsmedia/homebox/backend/internal/data/ent/entityview"
	"github.com/sysadminsmedia/homebox/backend/internal/data/types"
	"github.com/sysadminsmedia/homebox/backend/internal/sys/validate"
)

type EntityViewRepository struct {
	db *ent.Client
}

// tableViewBuiltinColumns are the entity properties a table view may show
// as "builtin" columns, keyed by their JSON name on EntitySummary.
var tableViewBuiltinColumns = map[string]bool{
	"assetId":       true,
	"name":          true,
	"quantity":      true,
	"insured":       true,
	"purchasePrice": true,
	"location":      true,
	"archived":      true,
	"createdAt":     true,
	"updatedAt":     true,
}

type (
	EntityViewCreate struct {
		Name  string                 `json:"name"  validate:"required,min=1,max=255"`
		Kind  string                 `json:"kind"  validate:"required,oneof=table"`
		Table *types.TableViewConfig `json:"table" extensions:"x-nullable"`
	}

	EntityViewUpdate struct {
		ID    uuid.UUID              `json:"id"`
		Name  string                 `json:"name"  validate:"required,min=1,max=255"`
		Kind  string                 `json:"kind"  validate:"required,oneof=table"`
		Table *types.TableViewConfig `json:"table" extensions:"x-nullable"`
	}

	EntityViewOut struct {
		ID        uuid.UUID              `json:"id"`
		CreatedAt time.Time              `json:"createdAt"`
		UpdatedAt time.Time              `json:"updatedAt"`
		Name      string                 `json:"name"`
		Kind      string                 `json:"kind"`
		Table     *types.TableViewConfig `json:"table,omitempty" extensions:"x-nullable,x-omitempty"`
	}
)

func (c EntityViewCreate) Validate() error {
	return validateViewConfig(c.Kind, c.Table)
}

func (u EntityViewUpdate) Validate() error {
	return validateViewConfig(u.Kind, u.Table)
}

// validateViewConfig checks what struct tags can't: a view carries the
// config of its kind, builtin keys must be known properties and a column may
// only appear once.
func validateViewConfig(kind string, table *types.TableViewConfig) error {
	if table == nil {
		return validate.NewFieldErrors(validate.NewFieldError("table", "required for kind "+kind))
	}

	var errs validate.FieldErrors
	seen := make(map[types.TableViewColumn]bool, len(table.Columns))
	for i, c := range table.Columns {
		if c.Kind == types.TableViewColumnBuiltin && !tableViewBuiltinColumns[c.Key] {
			errs = append(errs, validate.NewFieldError(fmt.Sprintf("table.columns[%d].key", i), "unknown builtin column "+c.Key))
		}
		if seen[c] {
			errs = append(errs, validate.NewFieldError(fmt.Sprintf("table.columns[%d]", i), "duplicate column "+c.Key))
		}
		seen[c] = true
	}
	if s := table.Sort; s != nil && s.Kind == types.TableViewColumnBuiltin && !tableViewBuiltinColumns[s.Key] {
		errs = append(errs, validate.NewFieldError("table.sort.key", "unknown builtin column "+s.Key))
	}
	if len(errs) > 0 {
		return errs
	}
	return nil
}

func mapEntityViewOut(v *ent.EntityView) EntityViewOut {
	return EntityViewOut{
		ID:        v.ID,
		CreatedAt: v.CreatedAt,
		UpdatedAt: v.UpdatedAt,
		Name:      v.Name,
		Kind:      v.Kind.String(),
		Table:     v.TableConfig,
	}
}

var (
	mapEntityViewOutErr  = mapTErrFunc(mapEntityViewOut)
	mapEntityViewsOutErr = mapTEachErrFunc(mapEntityViewOut)
)

func (r *EntityViewRepository) GetAll(ctx context.Context, gid uuid.UUID) ([]EntityViewOut, error) {
	return mapEntityViewsOutErr(r.db.EntityView.Query().
		Where(entityview.GroupID(gid)).
		Order(ent.Asc(entityview.FieldName)).
		All(ctx))
}

func (r *EntityViewRepository) GetOne(ctx context.Context, gid, id uuid.UUID) (EntityViewOut, error) {
	return mapEntityViewOutErr(r.db.EntityView.Query().
		Where(entityview.ID(id), entityview.GroupID(gid)).
		Only(ctx))
}

func (r *EntityViewRepository) Create(ctx context.Context, gid uuid.UUID, data EntityViewCreate) (EntityViewOut, error) {
	q := r.db.EntityView.Create().
		SetGroupID(gid).
		SetName(data.Name).
		SetKind(entityview.Kind(data.Kind))
	if data.Table != nil {
		q.SetTableConfig(data.Table)
	}

	return mapEntityViewOutErr(q.Save(ctx))
}

func (r *EntityViewRepository) Update(ctx context.Context, gid uuid.UUID, data EntityViewUpdate) (EntityViewOut, error) {
	q := r.db.EntityView.Update().
		Where(entityview.ID(data.ID), entityview.GroupID(gid)).
		SetName(data.Name).
		SetKind(entityview.Kind(data.Kind))
	if data.Table != nil {
		q.SetTableConfig(data.Table)
	} else {
		q.ClearTableConfig()
	}

	n, err := q.Save(ctx)
	if err != nil {
		return EntityViewOut{}, err
	}
	if n == 0 {
		return EntityViewOut{}, &ent.NotFoundError{}
	}

	return r.GetOne(ctx, gid, data.ID)
}

func (r *EntityViewRepository) Delete(ctx context.Context, gid, id uuid.UUID) error {
	n, err := r.db.EntityView.Delete().
		Where(entityview.ID(id), entityview.GroupID(gid)).
		Exec(ctx)
	if err != nil {
		return err
	}
	if n == 0 {
		return &ent.NotFoundError{}
	}
	return nil
}
