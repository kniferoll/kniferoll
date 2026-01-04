-- Add is_hidden column to kitchen_shifts table
-- Hidden shifts are not deleted but excluded from active use

alter table kitchen_shifts
add column is_hidden boolean not null default false;

-- Create index for efficient filtering of visible shifts
create index idx_kitchen_shifts_hidden on kitchen_shifts(kitchen_id, is_hidden);
