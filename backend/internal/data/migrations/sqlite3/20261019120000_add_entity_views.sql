-- +goose Up
create table if not exists entity_views
(
    id           uuid     not null
        primary key,
    created_at   datetime not null,
    updated_at   datetime not null,
    name         text     not null,
    kind         text     not null
        check (kind in ('table')),
    table_config json,
    group_id     uuid     not null
        constraint entity_views_groups_entity_views
            references groups
            on delete cascade
);

create index if not exists entityview_group_id
    on entity_views (group_id);
