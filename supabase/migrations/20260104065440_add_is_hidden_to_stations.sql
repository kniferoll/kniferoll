-- Add is_hidden column to stations table
-- This allows stations to be hidden instead of deleted, preserving all prep items and history

alter table stations add column is_hidden boolean not null default false;

-- Index for efficient filtering of hidden stations
create index idx_stations_hidden on stations(kitchen_id, is_hidden);
