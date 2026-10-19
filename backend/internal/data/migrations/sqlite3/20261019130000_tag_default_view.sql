-- +goose Up
-- +goose no transaction
PRAGMA foreign_keys=OFF;

ALTER TABLE tags ADD COLUMN default_view_id uuid
    REFERENCES entity_views(id) ON DELETE SET NULL;

PRAGMA foreign_keys=ON;
