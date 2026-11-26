-- Checks for 004_owner_program.sql. Paste into the Supabase SQL editor AFTER running the
-- migration. Everything happens in one transaction that is rolled back: no rows are left.
-- Success = notice 'ALL OWNER PROGRAM CHECKS PASSED'. A failure stops at the first assert.

begin;

-- Test user ids, readable from any role (settings need no table privileges).
select set_config('t.admin', gen_random_uuid()::text, true),
       set_config('t.a', gen_random_uuid()::text, true),
       set_config('t.b', gen_random_uuid()::text, true),
       set_config('t.p', gen_random_uuid()::text, true),
       set_config('t.r', gen_random_uuid()::text, true);

create function pg_temp.uid(name text) returns uuid language sql as $$
  select current_setting('t.' || name)::uuid
$$;

-- Impersonate a logged-in user (as the API does) or an anonymous visitor.
create function pg_temp.as_user(name text) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', pg_temp.uid(name), 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function pg_temp.as_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
end $$;


grant execute on function pg_temp.uid(text), pg_temp.as_user(text), pg_temp.as_anon() to anon, authenticated;

-- Seed: admin, owners A and B, player P, each with a Discord identity.
insert into auth.users (id, email, raw_user_meta_data)
select pg_temp.uid(n), n || '@check.invalid', '{}'::jsonb from unnest(array['admin', 'a', 'b', 'p', 'r']) n;

insert into auth.identities (user_id, provider_id, provider, identity_data)
select pg_temp.uid(n), 'discord-' || n, 'discord', jsonb_build_object('full_name', 'Name ' || n)
from unnest(array['admin', 'a', 'b', 'p', 'r']) n;

insert into public.user_roles (user_id, role) values (pg_temp.uid('admin'), 'admin');
insert into public.user_roles (user_id, role, owner_status, discord_id, discord_username)
values (pg_temp.uid('a'), 'owner', 'active', 'discord-a', 'Name a'),
       (pg_temp.uid('b'), 'owner', 'active', 'discord-b', 'Name b');

-- 1. Application insert: discord_id is not user-writable; trigger fills it from identities.
do $$
declare ok boolean := false; r record;
begin
  perform pg_temp.as_user('p');
  begin
    insert into public.owner_applications (discord_id, server_name, server_address, edition, server_about,
      play_styles, player_base_size, community_size, running_since, discord_link, why_join)
    values ('spoofed', 'S', 'play.p.net', 'java', 'about', array['survival'], '<10', '<10',
      date '2024-01-01', 'https://discord.gg/abc', 'why');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 1a: supplying discord_id must be denied';

  insert into public.owner_applications (server_name, server_address, edition, server_about,
    play_styles, player_base_size, community_size, running_since, discord_link, why_join)
  values ('P Server', 'play.p.net', 'java', 'about', array['survival'], '<10', '<10',
    date '2024-01-01', 'https://discord.gg/abc', 'why')
  returning * into r;
  assert r.user_id = pg_temp.uid('p'), 'case 1b: user_id';
  assert r.discord_id = 'discord-p', 'case 1b: discord_id from identity';
  assert r.discord_username = 'Name p', 'case 1b: discord_username from identity';
  perform set_config('t.app', r.id::text, true);
end $$;

-- 2. Second pending application -> unique violation.
do $$
declare ok boolean := false;
begin
  perform pg_temp.as_user('p');
  begin
    insert into public.owner_applications (server_name, server_address, edition, server_about,
      play_styles, player_base_size, community_size, running_since, discord_link, why_join)
    values ('P2', 'play2.p.net', 'java', 'about', array['survival'], '<10', '<10',
      date '2024-01-01', 'https://discord.gg/abc', 'why');
  exception when unique_violation then ok := true;
  end;
  assert ok, 'case 2: second pending application must fail';
end $$;

-- 3. Approve -> P is an active owner with Discord details; approving again -> not_pending.
do $$
declare msg text; r record;
begin
  perform pg_temp.as_user('admin');
  perform public.approve_application(pg_temp.uid('app'));
  select * into r from public.user_roles where user_id = pg_temp.uid('p');
  assert r.role = 'owner' and r.owner_status = 'active', 'case 3: P is active owner';
  assert r.discord_id = 'discord-p' and r.discord_username = 'Name p', 'case 3: P discord details';
  assert exists (select 1 from public.audit_log where action = 'application_approve'
    and actor_id = pg_temp.uid('admin')), 'case 3: application_approve audit row';
  begin
    perform public.approve_application(pg_temp.uid('app'));
  exception when others then msg := sqlerrm;
  end;
  assert msg = 'not_pending', 'case 3: second approve -> not_pending, got ' || coalesce(msg, 'no error');
end $$;

-- 4. Cap: A inserts 5 servers, the 6th fails with server_limit. B adds one.
do $$
declare msg text; sid uuid;
begin
  perform pg_temp.as_user('a');
  for i in 1..5 loop
    insert into public.servers (name, address, edition, play_styles)
    values ('A' || i, 'a' || i || '.example.net', 'java', array['survival']) returning id into sid;
    perform set_config('t.a' || i, sid::text, true);
  end loop;
  begin
    insert into public.servers (name, address, edition, play_styles)
    values ('A6', 'a6.example.net', 'java', array['survival']);
  exception when others then msg := sqlerrm;
  end;
  assert msg = 'server_limit', 'case 4: 6th server -> server_limit, got ' || coalesce(msg, 'no error');
  assert (select owner_id from public.servers where id = pg_temp.uid('a1')) = pg_temp.uid('a'),
    'case 4: owner_id defaults to caller';

  perform pg_temp.as_user('b');
  insert into public.servers (name, address, edition, play_styles)
  values ('B1', 'b1.example.net', 'bedrock', array['pvp']) returning id into sid;
  perform set_config('t.b1', sid::text, true);
end $$;

-- 5. Column protection and ownership.
do $$
declare ok boolean; n int;
begin
  perform pg_temp.as_user('a');
  ok := false;
  begin
    update public.servers set is_hidden = false where id = pg_temp.uid('a1');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 5: is_hidden not writable';
  ok := false;
  begin
    update public.servers set owner_id = pg_temp.uid('b') where id = pg_temp.uid('a1');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 5: owner_id not writable';
  update public.servers set name = 'stolen' where id = pg_temp.uid('b1');
  get diagnostics n = row_count;
  assert n = 0, 'case 5: cannot update another owner''s server';
end $$;

-- 6. Edits are audited, one row per changed column; address changes are flagged.
do $$
declare r record;
begin
  perform pg_temp.as_user('a');
  update public.servers set address = 'a1-new.example.net' where id = pg_temp.uid('a1');
  perform pg_temp.as_user('admin');
  select * into strict r from public.audit_log where server_id = pg_temp.uid('a1') and action = 'server_update';
  assert r.field = 'address' and r.is_flagged and r.actor_id = pg_temp.uid('a'), 'case 6: address audit row';
  assert r.old_value = 'a1.example.net' and r.new_value = 'a1-new.example.net', 'case 6: address values';

  perform pg_temp.as_user('a');
  update public.servers set name = 'A1 renamed' where id = pg_temp.uid('a1');
  perform pg_temp.as_user('admin');
  select * into strict r from public.audit_log
  where server_id = pg_temp.uid('a1') and action = 'server_update' and field = 'name';
  assert not r.is_flagged, 'case 6: name change not flagged';
  assert exists (select 1 from public.audit_log where server_id = pg_temp.uid('a1') and action = 'server_create'),
    'case 6: server_create audit row';
end $$;

-- 7. Suspension hides A's servers publicly and blocks A's writes; reinstating restores them.
do $$
declare ok boolean := false; n int;
begin
  perform pg_temp.as_user('a');
  delete from public.servers where id = pg_temp.uid('a5');  -- below the cap, so the insert below hits RLS
  get diagnostics n = row_count;
  assert n = 1, 'case 7: owner deletes own server';

  perform pg_temp.as_user('admin');
  assert exists (select 1 from public.audit_log where action = 'server_delete' and server_name = 'A5'),
    'case 7: server_delete audit row';
  perform public.set_owner_status(pg_temp.uid('a'), 'suspended');
  assert exists (select 1 from public.audit_log where action = 'owner_suspend'
    and actor_id = pg_temp.uid('admin')), 'case 7: owner_suspend audit row';

  perform pg_temp.as_anon();
  assert not exists (select 1 from public.servers where owner_id = pg_temp.uid('a')),
    'case 7: suspended owner''s servers hidden from anon';
  assert exists (select 1 from public.servers where id = pg_temp.uid('b1')), 'case 7: B still public';

  perform pg_temp.as_user('a');
  assert (select count(*) from public.servers where owner_id = pg_temp.uid('a')) = 4,
    'case 7: suspended owner still sees own servers';
  begin
    insert into public.servers (name, address, edition, play_styles)
    values ('A7', 'a7.example.net', 'java', array['survival']);
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 7: suspended owner cannot insert';
  update public.servers set name = 'x' where id = pg_temp.uid('a1');
  get diagnostics n = row_count;
  assert n = 0, 'case 7: suspended owner cannot update';

  perform pg_temp.as_user('admin');
  perform public.set_owner_status(pg_temp.uid('a'), 'active');
  assert exists (select 1 from public.audit_log where action = 'owner_reinstate'), 'case 7: owner_reinstate';
  perform pg_temp.as_anon();
  assert (select count(*) from public.servers where owner_id = pg_temp.uid('a')) = 4,
    'case 7: reinstated owner''s servers public again';
end $$;

-- 8. One announcement per address, even across delete + re-add; only the owner may claim.
do $$
declare msg text; sid uuid;
begin
  perform pg_temp.as_user('a');
  assert public.claim_announcement(pg_temp.uid('a2')), 'case 8: first claim true';
  assert not public.claim_announcement(pg_temp.uid('a2')), 'case 8: second claim false';
  delete from public.servers where id = pg_temp.uid('a2');
  insert into public.servers (name, address, edition, play_styles)
  values ('A2 again', 'a2.example.net', 'java', array['survival']) returning id into sid;
  assert not public.claim_announcement(sid), 'case 8: re-added address not re-announced';
  perform public.record_announcement_error(sid, 'webhook 500');

  perform pg_temp.as_user('b');
  begin
    perform public.claim_announcement(sid);
  exception when others then msg := sqlerrm;
  end;
  assert msg = 'forbidden', 'case 8: other owner claim -> forbidden, got ' || coalesce(msg, 'no error');
  msg := null;
  begin
    perform public.record_announcement_error(sid, 'x');
  exception when others then msg := sqlerrm;
  end;
  assert msg = 'forbidden', 'case 8: other owner record error -> forbidden';

  perform pg_temp.as_user('admin');
  assert exists (select 1 from public.audit_log where action = 'announce_failed' and server_id = sid
    and new_value = 'webhook 500'), 'case 8: announce_failed audit row';
end $$;

-- 9. Admin RPCs refuse non-admins; players can't read the audit log. Then the happy paths.
do $$
declare msg text; n int; aid uuid;
begin
  perform pg_temp.as_user('b');
  begin perform public.approve_application(pg_temp.uid('app')); exception when others then msg := sqlerrm; end;
  assert msg = 'forbidden', 'case 9: approve_application';
  msg := null;
  begin perform public.reject_application(pg_temp.uid('app'), 'no'); exception when others then msg := sqlerrm; end;
  assert msg = 'forbidden', 'case 9: reject_application';
  msg := null;
  begin perform public.set_server_hidden(pg_temp.uid('b1'), true, 'x'); exception when others then msg := sqlerrm; end;
  assert msg = 'forbidden', 'case 9: set_server_hidden';
  msg := null;
  begin perform public.set_owner_status(pg_temp.uid('b'), 'active'); exception when others then msg := sqlerrm; end;
  assert msg = 'forbidden', 'case 9: set_owner_status';
  msg := null;
  begin perform public.mark_audit_reviewed(array[gen_random_uuid()]); exception when others then msg := sqlerrm; end;
  assert msg = 'forbidden', 'case 9: mark_audit_reviewed';

  perform pg_temp.as_user('r');
  select count(*) into n from public.audit_log;
  assert n = 0, 'case 9: no-role user reads no audit rows';

  -- Admin: hide (reason required) / unhide, reject, not_owner, mark reviewed.
  perform pg_temp.as_user('admin');
  msg := null;
  begin perform public.set_server_hidden(pg_temp.uid('b1'), true, null); exception when others then msg := sqlerrm; end;
  assert msg = 'reason_required', 'case 9: hiding needs a reason, got ' || coalesce(msg, 'no error');
  perform public.set_server_hidden(pg_temp.uid('b1'), true, 'spam');
  assert (select is_hidden and hidden_reason = 'spam' from public.servers where id = pg_temp.uid('b1')),
    'case 9: hidden with reason';
  assert exists (select 1 from public.audit_log where action = 'server_hide' and server_id = pg_temp.uid('b1')),
    'case 9: server_hide audit row';
  perform pg_temp.as_anon();
  assert not exists (select 1 from public.servers where id = pg_temp.uid('b1')), 'case 9: hidden not public';
  perform pg_temp.as_user('b');
  update public.servers set name = 'B1 edited' where id = pg_temp.uid('b1');
  assert (select is_hidden from public.servers where id = pg_temp.uid('b1')), 'case 9: edit keeps hidden';
  perform pg_temp.as_user('admin');
  perform public.set_server_hidden(pg_temp.uid('b1'), false, null);
  assert (select not is_hidden and hidden_reason is null from public.servers where id = pg_temp.uid('b1')),
    'case 9: unhide clears reason';

  msg := null;
  begin perform public.set_owner_status(pg_temp.uid('p'), 'suspended'); exception when others then msg := sqlerrm; end;
  assert msg is null, 'case 9: P is an owner now (approved in case 3)';
  msg := null;
  begin perform public.set_owner_status(pg_temp.uid('admin'), 'suspended'); exception when others then msg := sqlerrm; end;
  assert msg = 'not_owner', 'case 9: set_owner_status on non-owner -> not_owner, got ' || coalesce(msg, 'no error');

  -- Reject: a fresh application from a fifth user.
  reset role;
  perform set_config('t.q', gen_random_uuid()::text, true);
  insert into auth.users (id, email, raw_user_meta_data) values (pg_temp.uid('q'), 'q@check.invalid', '{}');
  insert into auth.identities (user_id, provider_id, provider, identity_data)
  values (pg_temp.uid('q'), 'discord-q', 'discord', '{"custom_claims": {"global_name": "Global Q"}, "full_name": "q"}');
  perform pg_temp.as_user('q');
  insert into public.owner_applications (server_name, server_address, edition, server_about,
    play_styles, player_base_size, community_size, running_since, discord_link, why_join)
  values ('Q', 'play.q.net', 'both', 'about', array['creative'], '10-50', '<10',
    date '2023-05-01', 'https://discord.com/invite/q1', 'why')
  returning id into aid;
  assert (select discord_username from public.owner_applications where id = aid) = 'Global Q',
    'case 9: global_name wins';
  perform pg_temp.as_user('admin');
  perform public.reject_application(aid, 'Too small');
  assert (select status = 'rejected' and reject_reason = 'Too small' and reviewed_by = pg_temp.uid('admin')
    from public.owner_applications where id = aid), 'case 9: rejected';
  assert exists (select 1 from public.audit_log where action = 'application_reject' and new_value = 'Too small'),
    'case 9: application_reject audit row';
  msg := null;
  begin perform public.reject_application(aid, 'again'); exception when others then msg := sqlerrm; end;
  assert msg = 'not_pending', 'case 9: reject twice -> not_pending';

  perform public.mark_audit_reviewed(array(select id from public.audit_log where is_flagged));
  assert not exists (select 1 from public.audit_log where is_flagged and not reviewed), 'case 9: marked reviewed';

  -- A user with no Discord identity can't apply.
  reset role;
  perform set_config('t.n', gen_random_uuid()::text, true);
  insert into auth.users (id, email, raw_user_meta_data) values (pg_temp.uid('n'), 'n@check.invalid', '{}');
  perform pg_temp.as_user('n');
  msg := null;
  begin
    insert into public.owner_applications (server_name, server_address, edition, server_about,
      play_styles, player_base_size, community_size, running_since, discord_link, why_join)
    values ('N', 'play.n.net', 'java', 'about', array['pvp'], '<10', '<10',
      date '2023-05-01', 'https://discord.gg/n', 'why');
  exception when others then msg := sqlerrm;
  end;
  assert msg = 'no_discord_identity', 'case 9: no identity -> no_discord_identity, got ' || coalesce(msg, 'no error');
end $$;

-- 10. Direct writes that would bypass the RPCs/triggers are denied (anti-goal guard),
--     and whitespace-only required text is rejected.
do $$
declare ok boolean;
begin
  perform pg_temp.as_user('r');
  ok := false;
  begin
    insert into public.user_roles (user_id, role) values (pg_temp.uid('r'), 'admin');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 10: no-role user cannot insert user_roles';
  ok := false;
  begin
    insert into public.audit_log (action) values ('server_create');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 10: user cannot insert audit_log';
  ok := false;
  begin
    insert into public.owner_applications (status, server_name, server_address, edition, server_about,
      play_styles, player_base_size, community_size, running_since, discord_link, why_join)
    values ('approved', 'R', 'play.r.net', 'java', 'about', array['pvp'], '<10', '<10',
      date '2023-05-01', 'https://discord.gg/r', 'why');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 10: user cannot insert an approved application';

  perform pg_temp.as_user('a');
  ok := false;
  begin
    update public.user_roles set owner_status = 'active' where user_id = pg_temp.uid('a');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 10: owner cannot update own owner_status';
  ok := false;
  begin
    update public.servers set hidden_reason = 'x' where id = pg_temp.uid('a1');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'case 10: owner cannot set hidden_reason';
  ok := false;
  begin
    insert into public.servers (name, address, edition, play_styles)
    values ('   ', 'blank.example.net', 'java', array['survival']);
  exception when check_violation then ok := true;
  end;
  assert ok, 'case 10: whitespace-only name rejected';
end $$;

reset role;
do $$ begin raise notice 'ALL OWNER PROGRAM CHECKS PASSED'; end $$;

rollback;
