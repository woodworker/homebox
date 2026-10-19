-- +goose Up
-- Create "entity_views" table
CREATE TABLE IF NOT EXISTS "entity_views" (
    "id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "name" character varying(255) NOT NULL,
    "kind" character varying NOT NULL
        CHECK ("kind" IN ('table')),
    "table_config" jsonb NULL,
    "group_id" uuid NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "entity_views_groups_entity_views" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "entityview_group_id" to table: "entity_views"
CREATE INDEX IF NOT EXISTS "entityview_group_id" ON "entity_views" ("group_id");
