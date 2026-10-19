package repo

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/sysadminsmedia/homebox/backend/internal/data/ent"
	"github.com/sysadminsmedia/homebox/backend/internal/data/types"
	"github.com/sysadminsmedia/homebox/backend/internal/sys/validate"
)

const testFieldColor = "Color"

func tableView(name string, columns ...types.TableViewColumn) EntityViewCreate {
	return EntityViewCreate{
		Name:  name,
		Kind:  types.EntityViewKindTable,
		Table: &types.TableViewConfig{Columns: columns},
	}
}

func TestEntityViewRepository_CRUD(t *testing.T) {
	ctx := context.Background()

	created, err := tRepos.EntityViews.Create(ctx, tGroup.ID, tableView("Filament",
		types.TableViewColumn{Kind: types.TableViewColumnBuiltin, Key: "name"},
		types.TableViewColumn{Kind: types.TableViewColumnField, Key: testFieldColor},
	))
	require.NoError(t, err)
	t.Cleanup(func() { _ = tRepos.EntityViews.Delete(ctx, tGroup.ID, created.ID) })
	assert.Equal(t, "Filament", created.Name)
	assert.Equal(t, types.EntityViewKindTable, created.Kind)
	require.NotNil(t, created.Table)
	assert.Nil(t, created.Table.Sort)

	sort := &types.TableViewSort{Kind: types.TableViewColumnField, Key: testFieldColor, Direction: "asc"}
	columns := []types.TableViewColumn{
		{Kind: types.TableViewColumnField, Key: testFieldColor},
		{Kind: types.TableViewColumnBuiltin, Key: "quantity"},
	}
	updated, err := tRepos.EntityViews.Update(ctx, tGroup.ID, EntityViewUpdate{
		ID:    created.ID,
		Name:  "Filament (all)",
		Kind:  types.EntityViewKindTable,
		Table: &types.TableViewConfig{Columns: columns, Sort: sort},
	})
	require.NoError(t, err)
	assert.Equal(t, "Filament (all)", updated.Name)
	assert.Equal(t, &types.TableViewConfig{Columns: columns, Sort: sort}, updated.Table)

	all, err := tRepos.EntityViews.GetAll(ctx, tGroup.ID)
	require.NoError(t, err)
	assert.Contains(t, all, updated)

	require.NoError(t, tRepos.EntityViews.Delete(ctx, tGroup.ID, created.ID))
	_, err = tRepos.EntityViews.GetOne(ctx, tGroup.ID, created.ID)
	assert.True(t, ent.IsNotFound(err))
}

func TestEntityViewRepository_OtherGroupNotFound(t *testing.T) {
	ctx := context.Background()

	v, err := tRepos.EntityViews.Create(ctx, tGroup.ID, tableView("mine",
		types.TableViewColumn{Kind: types.TableViewColumnBuiltin, Key: "name"},
	))
	require.NoError(t, err)
	t.Cleanup(func() { _ = tRepos.EntityViews.Delete(ctx, tGroup.ID, v.ID) })

	other := uuid.New()

	_, err = tRepos.EntityViews.GetOne(ctx, other, v.ID)
	assert.True(t, ent.IsNotFound(err))

	_, err = tRepos.EntityViews.Update(ctx, other, EntityViewUpdate{ID: v.ID, Name: "stolen", Kind: v.Kind, Table: v.Table})
	assert.True(t, ent.IsNotFound(err))

	err = tRepos.EntityViews.Delete(ctx, other, v.ID)
	assert.True(t, ent.IsNotFound(err))

	got, err := tRepos.EntityViews.GetOne(ctx, tGroup.ID, v.ID)
	require.NoError(t, err)
	assert.Equal(t, "mine", got.Name)
}

func TestEntityViewCreate_Validate(t *testing.T) {
	builtin := func(key string) types.TableViewColumn {
		return types.TableViewColumn{Kind: types.TableViewColumnBuiltin, Key: key}
	}
	field := func(key string) types.TableViewColumn {
		return types.TableViewColumn{Kind: types.TableViewColumnField, Key: key}
	}

	tests := []struct {
		name    string
		table   *types.TableViewConfig
		wantErr bool
	}{
		{
			name:  "builtin and field columns",
			table: &types.TableViewConfig{Columns: []types.TableViewColumn{builtin("location"), field("anything goes")}},
		},
		{
			name:    "table view without table config",
			wantErr: true,
		},
		{
			name:    "unknown builtin column",
			table:   &types.TableViewConfig{Columns: []types.TableViewColumn{builtin("secret")}},
			wantErr: true,
		},
		{
			name:    "duplicate column",
			table:   &types.TableViewConfig{Columns: []types.TableViewColumn{field(testFieldColor), field(testFieldColor)}},
			wantErr: true,
		},
		{
			name:  "field and builtin may share a key",
			table: &types.TableViewConfig{Columns: []types.TableViewColumn{field("name"), builtin("name")}},
		},
		{
			name: "unknown builtin sort",
			table: &types.TableViewConfig{
				Columns: []types.TableViewColumn{builtin("name")},
				Sort:    &types.TableViewSort{Kind: types.TableViewColumnBuiltin, Key: "secret", Direction: "asc"},
			},
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := EntityViewCreate{Name: "v", Kind: types.EntityViewKindTable, Table: tc.table}.Validate()
			if tc.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}

	t.Run("unknown kind is rejected by struct validation", func(t *testing.T) {
		err := validate.Check(EntityViewCreate{Name: "v", Kind: "card"})
		assert.Error(t, err)
	})
}
