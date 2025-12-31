-- Allow authenticated users to join a kitchen if there's a valid invite for it
-- They can only add themselves (user_id must match auth.uid())
create policy "User can join kitchen via invite"
  on kitchen_members for insert
  to authenticated
  with check (
    -- Can only add yourself
    user_id = (select auth.uid())
    -- And there must be a valid invite for this kitchen
    and exists (
      select 1 from invite_links
      where invite_links.kitchen_id = kitchen_members.kitchen_id
      and invite_links.revoked = false
      and invite_links.expires_at > now()
      and invite_links.use_count < invite_links.max_uses
    )
  );

-- Allow authenticated users to update invite link use_count when joining
create policy "User can increment invite use count"
  on invite_links for update
  to authenticated
  using (
    -- Only allow updating non-revoked, non-expired invites with remaining uses
    revoked = false
    and expires_at > now()
    and use_count < max_uses
  )
  with check (
    -- Only allow incrementing use_count by 1
    use_count = (select use_count from invite_links il where il.id = invite_links.id) + 1
  );
