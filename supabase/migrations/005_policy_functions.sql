-- Add security definer helpers and rewire kitchens policies to avoid recursion

-- Helpers
create or replace function is_kitchen_member(kitchen_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from kitchen_members
    where kitchen_members.kitchen_id = $1
    and kitchen_members.user_id = auth.uid()
  );
$$;

create or replace function is_kitchen_owner(kitchen_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from kitchens
    where kitchens.id = $1
    and kitchens.owner_id = auth.uid()
  );
$$;

-- Rewire kitchens policies
DROP POLICY IF EXISTS "Members can view kitchen" ON kitchens;
DROP POLICY IF EXISTS "Owner can update kitchen" ON kitchens;
DROP POLICY IF EXISTS "Owner can delete kitchen" ON kitchens;

create policy "Members can view kitchen"
  on kitchens for select
  using (
    is_kitchen_member(kitchens.id)
  );

create policy "Owner can update kitchen"
  on kitchens for update
  using (
    is_kitchen_owner(kitchens.id)
  );

create policy "Owner can delete kitchen"
  on kitchens for delete
  using (
    is_kitchen_owner(kitchens.id)
  );
