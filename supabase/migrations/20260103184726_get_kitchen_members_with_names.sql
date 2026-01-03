-- Create a function to get kitchen members with their display names
-- This safely exposes limited user metadata for kitchen members

create or replace function get_kitchen_members_with_names(p_kitchen_id uuid)
returns table (
  id uuid,
  kitchen_id uuid,
  user_id uuid,
  role public.member_role,
  can_invite boolean,
  joined_at timestamptz,
  display_name text,
  email text,
  is_anonymous boolean
)
language sql
security definer
stable
as $$
  select
    km.id,
    km.kitchen_id,
    km.user_id,
    km.role,
    km.can_invite,
    km.joined_at,
    coalesce(
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'display_name'
    ) as display_name,
    au.email,
    coalesce(au.is_anonymous, false) as is_anonymous
  from kitchen_members km
  join auth.users au on au.id = km.user_id
  where km.kitchen_id = p_kitchen_id
  -- Only allow access if the caller is a member of this kitchen
  and exists (
    select 1 from kitchen_members
    where kitchen_id = p_kitchen_id
    and user_id = auth.uid()
  )
  order by
    case km.role
      when 'owner' then 1
      when 'admin' then 2
      else 3
    end,
    km.joined_at;
$$;

-- Grant execute to authenticated users
grant execute on function get_kitchen_members_with_names(uuid) to authenticated;
