#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const setup = fs.readFileSync(path.join(__dirname, 'supabase-setup.sql'), 'utf8').toLowerCase();
const migration = fs.readFileSync(path.join(__dirname, 'grifflist-combined-reviewed-migration.sql'), 'utf8').toLowerCase();

const tableRevoke = 'revoke insert on table public.song_requests from public, anon, authenticated;';
const sensitiveRevoke = 'revoke insert (id, status, created_at) on table public.song_requests from public, anon, authenticated;';
const columnGrant = 'grant insert (requester_name, song_title, artist_name, note, tracking_token)\n  on table public.song_requests to anon, authenticated;';
const broadGrant = 'grant insert on table public.song_requests to anon, authenticated;';

for (const [name, sql] of [['bootstrap', setup], ['reviewed migration', migration]]) {
  assert.ok(sql.includes(tableRevoke), name + ': broad INSERT privileges are revoked');
  assert.ok(sql.includes(sensitiveRevoke), name + ': id/status/timestamp INSERT privileges are revoked');
  assert.ok(sql.includes(columnGrant), name + ': only request content and tracking token are insertable');
  assert.ok(!sql.includes(broadGrant), name + ': table-wide INSERT grant is not restored');
}

assert.ok(setup.includes('create policy "anyone can submit a song request"'));
assert.ok(setup.includes("status = 'new'"));
assert.ok(setup.includes('add column if not exists tracking_token uuid'));
assert.ok(setup.includes('create unique index if not exists song_requests_tracking_token_unique'));
assert.ok(migration.includes('create or replace function public.get_my_request_status(p_tracking_token uuid)'));
assert.ok(migration.includes('security definer'));
assert.ok(migration.includes("set search_path = ''"));

console.log('PASS column-scoped public INSERT grants in bootstrap and upgrade migration');
console.log('PASS id, status and created_at remain database/admin controlled');
console.log('PASS RLS, tracking-token uniqueness and token-based status lookup remain present');
