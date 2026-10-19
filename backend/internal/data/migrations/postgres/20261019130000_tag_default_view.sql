-- +goose Up
ALTER TABLE "tags"
    ADD COLUMN "default_view_id" uuid NULL
        CONSTRAINT "tags_entity_views_default_view"
            REFERENCES "entity_views" ("id") ON DELETE SET NULL;
