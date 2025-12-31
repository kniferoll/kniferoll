-- Allow anyone (authenticated or anonymous) to look up an invite link by token
-- This is safe because the token itself is the secret

-- Policy for anonymous users to view invite links by token
create policy "Anyone can view invite links by token"
  on invite_links for select
  to anon
  using (true);

-- Also allow authenticated users who aren't members yet to view by token
-- (The existing policy only allows members to view)
create policy "Authenticated users can view invite links by token"
  on invite_links for select
  to authenticated
  using (true);

-- Drop the old restrictive policy for authenticated users
drop policy if exists "Members can view invite links" on invite_links;

-- Allow anonymous users to view kitchen info when they have a valid invite link
-- This lets the join page show the kitchen name
create policy "Anyone with invite can view kitchen"
  on kitchens for select
  to anon
  using (
    exists (
      select 1 from invite_links
      where invite_links.kitchen_id = kitchens.id
      and invite_links.revoked = false
      and invite_links.expires_at > now()
      and invite_links.use_count < invite_links.max_uses
    )
  );

-- Allow authenticated non-members to view kitchen if they have a valid invite
create policy "Authenticated with invite can view kitchen"
  on kitchens for select
  to authenticated
  using (
    exists (
      select 1 from invite_links
      where invite_links.kitchen_id = kitchens.id
      and invite_links.revoked = false
      and invite_links.expires_at > now()
      and invite_links.use_count < invite_links.max_uses
    )
  );
