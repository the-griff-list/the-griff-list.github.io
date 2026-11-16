#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const setup = fs.readFileSync(path.join(__dirname, 'supabase-setup.sql'), 'utf8');
const migration = fs.readFileSync(path.join(__dirname, 'grifflist-combined-reviewed-migration.sql'), 'utf8');
const cutover = fs.readFileSync(path.join(__dirname, 'request-submission-gateway-cutover.sql'), 'utf8');

const tableRevoke = 'revoke insert on table public.song_requests from public, anon, authenticated;';
const sensitiveRevoke = 'revoke insert (id, status, created_at) on table public.song_requests from public, anon, authenticated;';
const columnGrant = 'grant insert (requester_name, song_title, artist_name, note, tracking_token)\\n  on table public.song_requests to anon, authenticated;';

function hasBroadPublicInsertGrant(source) {
  const statements = source
    .replace(/--.*$/gm, '')
    .split(';')
    .map(statement => statement.trim())
    .filter(Boolean);

  return statements.some(statement => {
    const match = statement.match(
      /^grant\\s+(.+?)\\s+on\\s+(?:table\\s+)?public\\.song_requests\\s+to\\s+(.+)$/i
    );
    if (!match) return false;

    const privileges = match[1].trim();
    const roles = match[2].split(',').map(role => role.trim().toLowerCase());
    const columnScopedInsert = /^insert\\s*\\(/i.test(privileges);
    const grantsInsert = /^all(?:\\s+privileges)?$/i.test(privileges) ||
      (/(^|,)\\s*insert\\b/i.test(privileges) && !columnScopedInsert);
    const grantsToPublicRole = roles.some(role =>
      ['public', 'anon', 'authenticated'].includes(role)
    );

    return grantsInsert && grantsToPublicRole;
  });
}

for (const [name, source] of [['bootstrap', setup], ['reviewed migration', migration]]) {
  const sql = source.toLowerCase();
  assert.ok(sql.includes(tableRevoke), name + ': broad INSERT privileges are revoked');
  assert.ok(sql.includes(sensitiveRevoke), name + ': id/status/timestamp INSERT privileges are revoked');
  assert.ok(sql.includes(columnGrant), name + ': only request content and tracking token are insertable');
  assert.equal(hasBroadPublicInsertGrant(source), false, name + ': no table-wide INSERT/ALL grant may be restored');
}

assert.equal(hasBroadPublicInsertGrant('GRANT INSERT ON TABLE public.song_requests TO anon;'), true);
assert.equal(hasBroadPublicInsertGrant('GRANT SELECT, INSERT ON public.song_requests TO authenticated;'), true);
assert.equal(hasBroadPublicInsertGrant('GRANT ALL PRIVILEGES ON TABLE public.song_requests TO PUBLIC;'), true);
assert.equal(hasBroadPublicInsertGrant('GRANT INSERT (requester_name) ON TABLE public.song_requests TO anon;'), false);

// The staged gateway cutover must revoke column-level grants as well as the
// table-level grant. PostgreSQL keeps column grants when only table INSERT is
// revoked, so the migration also verifies the effective privilege for every
// column and aborts atomically if anon/authenticated can still insert anything.
const cutoverSql = cutover.toLowerCase();
assert.ok(cutoverSql.includes(tableRevoke), 'cutover: table-level INSERT is revoked');
assert.match(
  cutoverSql,
  /revoke insert \\(%s\\) on table public\\.song_requests from public, anon, authenticated/,
  'cutover: all column-level INSERT grants are revoked dynamically',
);
assert.ok(cutoverSql.includes('from pg_catalog.pg_attribute'), 'cutover: all real table columns are enumerated');
assert.ok(cutoverSql.includes("pg_catalog.has_column_privilege('anon'"), 'cutover: anon effective column privileges are checked');
assert.ok(cutoverSql.includes("pg_catalog.has_column_privilege('authenticated'"), 'cutover: authenticated effective column privileges are checked');
assert.ok(
  cutoverSql.indexOf('revoke insert (%s)') < cutoverSql.indexOf('pg_catalog.has_column_privilege'),
  'cutover: privilege postcondition runs after revocation',
);
assert.ok(
  cutoverSql.includes('cutover blocked: direct insert remains for anon/authenticated'),
  'cutover: residual direct INSERT aborts the transaction',
);
assert.ok(cutoverSql.trimEnd().endsWith('commit;'), 'cutover: revocation and verification are transactional');

const bootstrapSql = setup.toLowerCase();
const migrationSql = migration.toLowerCase();
assert.ok(bootstrapSql.includes('create policy "anyone can submit a song request"'));
assert.ok(bootstrapSql.includes("status = 'new'"));
assert.ok(bootstrapSql.includes('add column if not exists tracking_token uuid'));
assert.ok(bootstrapSql.includes('create unique index if not exists song_requests_tracking_token_unique'));
assert.ok(migrationSql.includes('create or replace function public.get_my_request_status(p_tracking_token uuid)'));
assert.ok(migrationSql.includes('security definer'));
assert.ok(migrationSql.includes("set search_path = ''"));

console.log('PASS column-scoped public INSERT grants in bootstrap and upgrade migration');
console.log('PASS broad INSERT/ALL grants to public roles are rejected');
console.log('PASS id, status and created_at remain database/admin controlled');
console.log('PASS gateway cutover revokes table and every column-level INSERT grant');
console.log('PASS gateway cutover verifies effective anon/authenticated privileges and aborts on bypass');
console.log('PASS RLS, tracking-token uniqueness and token-based status lookup remain present');
