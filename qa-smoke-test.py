#!/usr/bin/env python3
"""Dependency-light Grifflist release smoke checks. Run: python3 qa-smoke-test.py"""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json, re, subprocess, sys, unicodedata
ROOT = Path(__file__).resolve().parent
issues = []
class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.refs = []
        self.skip_links = []
        self.main_targets = []
        self.has_main_navigation = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a' and 'skip-link' in a.get('class', '').split():
            self.skip_links.append(a.get('href', ''))
        if tag == 'main':
            self.main_targets.append((a.get('id'), a.get('tabindex')))
        if tag == 'nav' and a.get('aria-label', '').strip().lower() == 'main navigation':
            self.has_main_navigation = True
        for key in ('src', 'href'):
            v = a.get(key, '')
            if v and not v.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:', '#', 'javascript:')):
                self.refs.append(v.split('#', 1)[0].split('?', 1)[0])
html_files=sorted(ROOT.glob('*.html'))
for file in html_files:
    audit=Audit(); audit.feed(file.read_text(encoding='utf-8'))
    for duplicate in (x for x,n in Counter(audit.ids).items() if n>1):
        issues.append(f'{file.name}: duplicate id #{duplicate}')
    for ref in audit.refs:
        if ref and not (ROOT/ref).exists(): issues.append(f'{file.name}: missing local asset/page {ref}')
    if audit.has_main_navigation:
        if len(audit.skip_links) != 1:
            issues.append(f'{file.name}: pages with main navigation must expose exactly one skip link')
        elif len(audit.main_targets) != 1:
            issues.append(f'{file.name}: skip link requires exactly one main landmark')
        else:
            main_id, main_tabindex = audit.main_targets[0]
            if audit.skip_links[0] != f'#{main_id}':
                issues.append(f'{file.name}: skip link must target the main landmark')
            if main_tabindex != '-1':
                issues.append(f'{file.name}: main landmark must accept programmatic focus from the skip link')
# Assert the time-sensitive gig and payment disclosures remain explicit.
home_html=(ROOT/'index.html').read_text(encoding='utf-8')
home_h1 = re.findall(r'<h1([^>]*)>(.*?)</h1>', home_html, re.I | re.S)
if len(home_h1) != 1:
    issues.append(f'index.html: expected exactly one primary h1, found {len(home_h1)}')
else:
    h1_attrs, h1_content = home_h1[0]
    if 'visually-hidden' not in h1_attrs:
        issues.append('index.html: primary h1 must use the existing visually-hidden utility to preserve the established hero design')
    h1_text = " ".join(re.sub(r'<[^>]+>', '', h1_content).split())
    if h1_text != 'The Grifflist — Live Repertoire and Song Requests':
        issues.append('index.html: primary h1 must identify The Grifflist live repertoire and song requests')
admin_html=(ROOT/'admin.html').read_text(encoding='utf-8')
if len(re.findall(r'<main\b', admin_html, re.I)) != 1:
    issues.append('admin.html: private dashboard must expose exactly one main landmark')
if not re.search(r'\.request-card \.request-actions button\{[^}]*min-height:48px!important', admin_html, re.I):
    issues.append('admin.html: request action buttons must retain accessible 48px minimum tap targets')
watch_html=(ROOT/'watch-live.html').read_text(encoding='utf-8')
recording_safety_src='recording-safety.js?v=rights-gate-1'
live_show_src='live-show.js?v=grifflist-v31'
if recording_safety_src not in watch_html or live_show_src not in watch_html:
    issues.append('watch-live.html: bounded recording safety module and versioned viewer script must both be loaded')
elif watch_html.index(recording_safety_src) > watch_html.index(live_show_src):
    issues.append('watch-live.html: recording safety module must load before live-show.js')
if '32 MiB' not in watch_html or 'permission' not in watch_html.lower():
    issues.append('watch-live.html: recording size and rights disclosure must remain visible')
if 'Recording is disabled until the owner confirms' not in watch_html:
    issues.append('watch-live.html: recording must remain visibly disabled pending owner rights approval')
if not re.search(r'<select id="recording-mode"[^>]*\bdisabled\b', watch_html):
    issues.append('watch-live.html: recording mode must be disabled before permission approval')
recording_safety_source=(ROOT/'recording-safety.js').read_text(encoding='utf-8')
if 'const RECORDING_RIGHTS_APPROVED = false;' not in recording_safety_source:
    issues.append('recording-safety.js: rights approval must default to false')
live_show_source=(ROOT/'live-show.js').read_text(encoding='utf-8')
sw_source=(ROOT/'sw.js').read_text(encoding='utf-8')
if "const CACHE = 'grifflist-livekit-offline-v64';" not in sw_source:
    issues.append('sw.js: public homepage update must use a new cache generation')
if 'recordingSafety.canAppendChunk(recordingBytes,e.data.size)' not in live_show_source:
    issues.append('live-show.js: recording chunks must pass the bounded memory guard')
if 'if(e.data&&e.data.size)recordingChunks.push(e.data);' in live_show_source:
    issues.append('live-show.js: unbounded recording chunk accumulation must not return')
if 'recordingRightsApproved=recordingSafety?.RECORDING_RIGHTS_APPROVED===true' not in live_show_source:
    issues.append('live-show.js: recording rights gate must come from the explicit owner-approved flag')
if 'if(!recordingRightsApproved)' not in live_show_source:
    issues.append('live-show.js: recording start handler must fail closed without rights approval')
if 'recordingRightsApproved&&Boolean(window.MediaRecorder)' not in live_show_source:
    issues.append('live-show.js: recording controls must remain disabled without rights approval')

def next_show_schedule_errors(section_html, now=None):
    """Validate a no-booking state, one TBA date, or complete dated show schedules."""
    time_matches = list(re.finditer(
        r'<time\b[^>]*\bdatetime="([^"]+)"[^>]*>(.*?)</time>',
        section_html,
        re.S,
    ))
    times = [(match.group(1), match.group(2)) for match in time_matches]
    if not times:
        visible_text = re.sub(r'<[^>]+>', ' ', section_html).lower()
        errors = []
        if 'no upcoming performance date is currently confirmed' not in visible_text:
            errors.append('UPCOMING SHOWS without a confirmed booking must say no performance date is currently confirmed')
        if not re.search(r"""href=["']#catalog["']""", section_html):
            errors.append('UPCOMING SHOWS without a confirmed booking must retain the song-catalogue CTA')
        if 'browse songs' not in visible_text:
            errors.append('UPCOMING SHOWS without a confirmed booking must retain the visible catalogue action')
        if re.search(r"Hunter[’']s Ale House|November 10|December 3|December 17", visible_text, re.I):
            errors.append('UPCOMING SHOWS without a confirmed booking must not retain an expired or unconfirmed event')
        return errors

    zone = ZoneInfo('America/Halifax')
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)

    if len(times) == 1:
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', times[0][0]):
            return ['NEXT SHOW date must use a date-only ISO value (YYYY-MM-DD)']
        try:
            show_date = datetime.fromisoformat(times[0][0]).date()
        except ValueError as error:
            return [f'NEXT SHOW contains an invalid date: {error}']
        date_label = re.sub(r'<[^>]+>', '', times[0][1]).strip()
        expected_date_label = f'{show_date:%A, %B} {show_date.day}, {show_date.year}'
        errors = []
        if date_label != expected_date_label:
            errors.append(f'NEXT SHOW date label must match its Halifax-local date ({expected_date_label})')
        if show_date < current.astimezone(zone).date():
            errors.append('NEXT SHOW date has expired; update the homepage to the next confirmed booking')
        visible_text = re.sub(r'<[^>]+>', ' ', section_html).lower()
        if 'time to be confirmed' not in visible_text and 'time tba' not in visible_text:
            errors.append('NEXT SHOW without start/end times must explicitly say the performance time is to be confirmed')
        return errors

    if len(times) % 3 != 0:
        return [f'NEXT SHOW must contain complete date/start/end groups; found {len(times)} time elements']

    errors = []
    previous_start = None
    seen_dates = set()

    def display_time(value):
        hour = value.hour % 12 or 12
        suffix = 'a.m.' if value.hour < 12 else 'p.m.'
        return f'{hour}:{value.minute:02d} {suffix}'

    for group_index in range(0, len(times), 3):
        date_value, start_value, end_value = times[group_index:group_index + 3]
        group_number = group_index // 3 + 1
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date_value[0]):
            errors.append(f'NEXT SHOW group {group_number}: date must use YYYY-MM-DD')
            continue
        try:
            show_date = datetime.fromisoformat(date_value[0]).date()
            start = datetime.fromisoformat(start_value[0])
            end = datetime.fromisoformat(end_value[0])
        except ValueError as error:
            errors.append(f'NEXT SHOW group {group_number}: invalid ISO date/time: {error}')
            continue

        date_label = re.sub(r'<[^>]+>', '', date_value[1]).strip()
        expected_date_label = f'{show_date:%A, %B} {show_date.day}, {show_date.year}'
        if date_label != expected_date_label:
            errors.append(f'NEXT SHOW group {group_number}: date label must match {expected_date_label}')
        if show_date in seen_dates:
            errors.append(f'NEXT SHOW group {group_number}: duplicate show date {show_date}')
        seen_dates.add(show_date)

        if start.tzinfo is None or end.tzinfo is None:
            errors.append(f'NEXT SHOW group {group_number}: start/end timestamps require explicit UTC offsets')
            continue

        local_start = start.astimezone(zone)
        local_end = end.astimezone(zone)
        if local_start.date() != show_date:
            errors.append(f'NEXT SHOW group {group_number}: date must match the Halifax-local start date')
        if start.utcoffset() != local_start.utcoffset() or end.utcoffset() != local_end.utcoffset():
            errors.append(f'NEXT SHOW group {group_number}: timestamp uses the wrong America/Halifax UTC offset')
        if end <= start:
            errors.append(f'NEXT SHOW group {group_number}: end time must be later than start time')
        if previous_start is not None and start <= previous_start:
            errors.append(f'NEXT SHOW group {group_number}: confirmed shows must be listed chronologically')
        previous_start = start

        start_label = re.sub(r'<[^>]+>', '', start_value[1]).strip()
        end_label = re.sub(r'<[^>]+>', '', end_value[1]).strip()
        if start_label != display_time(local_start):
            errors.append(f'NEXT SHOW group {group_number}: displayed start must match {display_time(local_start)}')
        if end_label != display_time(local_end):
            errors.append(f'NEXT SHOW group {group_number}: displayed end must match {display_time(local_end)}')
        if end.astimezone(timezone.utc) <= current.astimezone(timezone.utc):
            errors.append(f'NEXT SHOW group {group_number}: schedule has expired')

    atlantic_labels = len(re.findall(r'</time>\s*Atlantic\b', section_html, re.I))
    expected_labels = len(times) // 3
    for group_number, end_index in enumerate(range(2, len(time_matches), 3), start=1):
        end_match = time_matches[end_index]
        if not re.match(r'\s*Atlantic\b', section_html[end_match.end():], re.I):
            errors.append(
                f'NEXT SHOW group {group_number}: end time must be followed by the Atlantic timezone label'
            )
    if atlantic_labels != expected_labels:
        errors.append(
            f'Each complete NEXT SHOW range must be labelled Atlantic; found {atlantic_labels}/{expected_labels}'
        )
    return errors

# Regression fixtures: the Atlantic label must follow each show's end time,
# not merely any earlier <time> element in the same schedule group.
_schedule_fixture_now = datetime(2026, 11, 12, tzinfo=timezone.utc)
_schedule_valid_fixture = (
    '<time datetime="2026-12-03">Thursday, December 3, 2026</time> '
    '<time datetime="2026-12-03T22:00:00-04:00">10:00 p.m.</time>–'
    '<time datetime="2026-12-04T01:30:00-04:00">1:30 a.m.</time> Atlantic '
    '<time datetime="2026-12-17">Thursday, December 17, 2026</time> '
    '<time datetime="2026-12-17T22:00:00-04:00">10:00 p.m.</time>–'
    '<time datetime="2026-12-18T01:30:00-04:00">1:30 a.m.</time> Atlantic'
)
if next_show_schedule_errors(_schedule_valid_fixture, _schedule_fixture_now):
    issues.append('qa-smoke-test.py: valid two-show Atlantic schedule fixture was rejected')
_schedule_misplaced_label_fixture = (
    '<time datetime="2026-12-03">Thursday, December 3, 2026</time> Atlantic '
    '<time datetime="2026-12-03T22:00:00-04:00">10:00 p.m.</time>–'
    '<time datetime="2026-12-04T01:30:00-04:00">1:30 a.m.</time> '
    '<time datetime="2026-12-17">Thursday, December 17, 2026</time> '
    '<time datetime="2026-12-17T22:00:00-04:00">10:00 p.m.</time>–'
    '<time datetime="2026-12-18T01:30:00-04:00">1:30 a.m.</time> Atlantic'
)
_misplaced_label_errors = next_show_schedule_errors(
    _schedule_misplaced_label_fixture, _schedule_fixture_now
)
if not any('group 1: end time must be followed by the Atlantic timezone label' in error
           for error in _misplaced_label_errors):
    issues.append('qa-smoke-test.py: Atlantic label after a date must not satisfy the end-of-range timezone disclosure')

next_show = re.search(
    r'<section class="next-show-section"[^>]*>(.*?)</section>',
    home_html,
    re.S,
)
if not next_show:
    issues.append('index.html: NEXT SHOW section is missing')
else:
    for error in next_show_schedule_errors(next_show.group(1)):
        issues.append(f'index.html: {error}')

for required in (
    '<p class="eyebrow">UPCOMING SHOWS</p>',
    'BROWSE SONGS ↗',
    'Send a tip',
    'CHECK LIVE STATUS ↗',
    'Ko-fi (Apple Pay / Google Pay if enabled)',
    'eligible Stripe connection',
):
    if required not in home_html:
        issues.append(f'index.html: missing next-show/payment acceptance text: {required}')

if next_show:
    next_show_html = next_show.group(1)
    has_machine_readable_show = bool(re.search(r'<time\b[^>]*\bdatetime="', next_show_html))
    if has_machine_readable_show:
        visible_schedule_text = " ".join(re.sub(r'<[^>]+>', ' ', next_show_html).split())
        for required in (
            'Hunter’s Ale House — Thursday, December 3, 2026',
            'Hunter’s Ale House — Thursday, December 17, 2026',
            'The Levee with Travis — Friday, January 1, 2027',
        ):
            if required not in visible_schedule_text:
                issues.append(f'index.html: confirmed upcoming-show schedule is missing: {required}')
        for required_datetime in (
            'datetime="2026-12-03"',
            'datetime="2026-12-03T22:00:00-04:00"',
            'datetime="2026-12-04T01:30:00-04:00"',
            'datetime="2026-12-17"',
            'datetime="2026-12-17T22:00:00-04:00"',
            'datetime="2026-12-18T01:30:00-04:00"',
            'datetime="2027-01-01"',
            'datetime="2027-01-01T12:00:00-04:00"',
            'datetime="2027-01-01T15:00:00-04:00"',
        ):
            if required_datetime not in next_show_html:
                issues.append(f'index.html: confirmed upcoming-show schedule is missing machine-readable value: {required_datetime}')
        for forbidden in (
            'Next date to be announced',
            'No upcoming performance date is currently confirmed.',
        ):
            if forbidden in next_show_html:
                issues.append(f'index.html: confirmed upcoming-show schedule still contains stale no-booking text: {forbidden}')
    else:
        for required in (
            'Next date to be announced',
            'No upcoming performance date is currently confirmed.',
        ):
            if required not in next_show_html:
                issues.append(f'index.html: no-booking state is missing: {required}')

if re.search(r'<p class="eyebrow">(?:LATEST SHOW|UP NEXT)</p>', home_html):
    issues.append('index.html: confirmed upcoming performance must use the NEXT SHOW label')
for required in ('Send a tip', 'eligible Stripe connection'):
    if required not in watch_html:
        issues.append(f'watch-live.html: missing payment disclosure: {required}')

# Disabled payment methods must not remain reachable through stale JavaScript.
script = (ROOT / 'script.js').read_text(encoding='utf-8')
for required in (
    'const availablePriorityPaymentMethods = new Set(["kofi", "paypal"]);',
    'availablePriorityPaymentMethods.has(paymentMethod)',
    'availablePriorityPaymentMethods.has(method)',
    'That payment method is unavailable. Choose Ko-fi or PayPal.',
):
    if required not in script:
        issues.append(f'script.js: missing fail-closed priority-payment guard: {required}')
for forbidden in (
    'etransfer:document.querySelector(".payment-etransfer")',
    'Copy the e-transfer email below',
):
    if forbidden in script:
        issues.append(f'script.js: stale disabled e-transfer route remains: {forbidden}')

# Keep the public song catalogue free of duplicate title/artist pairs.
# The catalogue is a static JavaScript object array; fail closed if its
# reviewed title/artist shape changes so this guard cannot silently skip entries.
catalog_match = re.search(r"const songs\s*=\s*\[(.*?)\n\];", script, re.S)
if not catalog_match:
    issues.append('script.js: could not locate the static songs catalogue')
else:
    catalog_source = catalog_match.group(1)
    declared_entries = len(re.findall(r"(?m)^\s*\{\s*title\s*:", catalog_source))
    parsed_entries = re.findall(
        r'\{\s*title:\s*"((?:\\.|[^"\\])*)"\s*,\s*artist:\s*"((?:\\.|[^"\\])*)"',
        catalog_source,
    )
    if len(parsed_entries) != declared_entries:
        issues.append(
            f'script.js: could not parse every song entry ({len(parsed_entries)}/{declared_entries})'
        )
    seen_songs = {}
    for index, (title_literal, artist_literal) in enumerate(parsed_entries, start=1):
        try:
            title = json.loads('"' + title_literal + '"')
            artist = json.loads('"' + artist_literal + '"')
        except json.JSONDecodeError:
            issues.append(f'script.js: song entry #{index} has a non-JSON-compatible title/artist escape')
            continue
        normalized = tuple(
            unicodedata.normalize("NFKC", value).strip().casefold()
            for value in (title, artist)
        )
        if not all(normalized):
            issues.append(f'script.js: song entry #{index} has an empty title or artist')
            continue
        if normalized in seen_songs:
            issues.append(
                f"script.js: duplicate song '{title}' by '{artist}' "
                f"(first matching entry #{seen_songs[normalized]})"
            )
        else:
            seen_songs[normalized] = index
    # Preserve the recent main-branch repertoire additions used by the live request catalogue.
    required_songs = (
        ("Smells Like Teen Spirit", "Nirvana"),
        ("Plush", "Stone Temple Pilots"),
        ("I Just Died in Your Arms Tonight", "Cutting Crew"),
    )
    for title, artist in required_songs:
        normalized = tuple(
            unicodedata.normalize("NFKC", value).strip().casefold()
            for value in (title, artist)
        )
        if normalized not in seen_songs:
            issues.append(f"script.js: required catalogue song '{title}' by '{artist}' is missing")

    if declared_entries == 0:
        issues.append('script.js: song catalogue contains no entries')

# Request retry idempotency depends on the reviewed unique-token index and
# token-status RPC being present in the migration shipped with this source.
request_migration = ROOT/'grifflist-combined-reviewed-migration.sql'
if not request_migration.is_file():
    issues.append('request idempotency: reviewed Supabase migration is missing')
else:
    migration_sql = request_migration.read_text(encoding='utf-8')
    for required in (
        'create unique index if not exists song_requests_tracking_token_unique',
        'create or replace function public.get_my_request_status(p_tracking_token uuid)',
        'grant execute on function public.get_my_request_status(uuid) to anon, authenticated',
    ):
        if required not in migration_sql:
            issues.append(f'request idempotency: migration is missing required SQL contract: {required}')

# SECURITY DEFINER archive trigger: pin an empty search_path and keep relation names qualified.
archive_migration = ROOT/'request-archive-migration.sql'
archive_hardening = ROOT/'request-archive-search-path-hardening.sql'
if not archive_migration.is_file():
    issues.append('request archive: migration is missing')
else:
    archive_sql = archive_migration.read_text(encoding='utf-8')
    archive_function = re.search(
        r'create or replace function public\.archive_song_request\(\)(.*?)\$\$;',
        archive_sql,
        re.I | re.S,
    )
    if not archive_function:
        issues.append('request archive: SECURITY DEFINER trigger function is missing')
    else:
        function_sql = archive_function.group(1).lower()
        if 'security definer' not in function_sql or "set search_path = ''" not in function_sql:
            issues.append('request archive: SECURITY DEFINER trigger must use an empty search_path')
        if 'revoke execute on function public.archive_song_request() from public, anon, authenticated, service_role;' not in archive_sql.lower():
            issues.append('request archive: SECURITY DEFINER trigger must revoke EXECUTE from PUBLIC and Supabase API roles')
        revoke_position = archive_sql.lower().find(
            'revoke execute on function public.archive_song_request() from public, anon, authenticated, service_role;'
        )
        trigger_position = archive_sql.lower().find('create trigger song_requests_archive_insert')
        if revoke_position <= archive_function.end() or trigger_position <= revoke_position:
            issues.append('request archive: EXECUTE revocation must follow function creation and precede trigger creation')
        if not re.search(r'insert\s+into\s+public\.request_archive', function_sql):
            issues.append('request archive: trigger must schema-qualify the archive table')
if not archive_hardening.is_file():
    issues.append('request archive: follow-up search_path hardening migration is missing')
else:
    hardening_sql = archive_hardening.read_text(encoding='utf-8').lower()
    if "alter function public.archive_song_request()\n  set search_path = '';" not in hardening_sql:
        issues.append('request archive: existing-installation search_path hardening is missing')
    if 'revoke execute on function public.archive_song_request() from public, anon, authenticated, service_role;' not in hardening_sql:
        issues.append('request archive: existing-installation EXECUTE revocation for PUBLIC and Supabase API roles is missing')
    alter_position = hardening_sql.find('alter function public.archive_song_request()')
    revoke_position = hardening_sql.find(
        'revoke execute on function public.archive_song_request() from public, anon, authenticated, service_role;'
    )
    commit_position = hardening_sql.find('commit;')
    if not (0 <= alter_position < revoke_position < commit_position):
        issues.append('request archive: existing-installation hardening statements are out of order')

js_files=sorted(ROOT.glob('*.js'))
for file in js_files:
    result=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
    if result.returncode: issues.append(f'{file.name}: JavaScript syntax error: {result.stderr.strip()}')
# Execute the service-worker policy helpers against adversarial URL/header cases.
service_worker_test = ROOT/'qa-service-worker-test.js'
if not service_worker_test.is_file():
    issues.append('sw.js: executable cache-policy regression suite is missing')
else:
    try:
        result=subprocess.run(
            ['node', str(service_worker_test)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        if result.returncode:
            details=' '.join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
            issues.append(f'sw.js: runtime cache-policy tests failed: {details}')
        elif result.stdout.strip():
            print(result.stdout.strip())
    except OSError as e:
        issues.append(f'sw.js: could not execute runtime cache-policy tests ({e})')

# Exercise the real service-worker install/activate/fetch handlers with mocked
# CacheStorage and network responses, not only the policy helper functions.
service_worker_lifecycle_test = ROOT/'qa-service-worker-lifecycle-test.js'
if not service_worker_lifecycle_test.is_file():
    issues.append('sw.js: service-worker lifecycle regression suite is missing')
else:
    try:
        result=subprocess.run(
            ['node', str(service_worker_lifecycle_test)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        if result.returncode:
            details=' '.join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
            issues.append(f'sw.js: lifecycle regression tests failed: {details}')
        elif result.stdout.strip():
            print(result.stdout.strip())
    except OSError as e:
        issues.append(f'sw.js: could not execute lifecycle regression tests ({e})')

manifest=ROOT/'manifest.webmanifest'
manifest_data=None
try:
    manifest_data=json.loads(manifest.read_text(encoding='utf-8'))
    if manifest_data.get('display')!='standalone':
        issues.append('manifest.webmanifest: display must remain standalone')
    if manifest_data.get('start_url')!='./index.html' or manifest_data.get('scope')!='./':
        issues.append('manifest.webmanifest: start_url/scope changed unexpectedly')
    for icon in manifest_data.get('icons',[]):
        src=str(icon.get('src','')).split('#',1)[0].split('?',1)[0]
        local=src.removeprefix('./')
        if not local or not (ROOT/local).exists():
            issues.append(f'manifest.webmanifest: missing local icon {src}')
except Exception as e:
    issues.append(f'manifest.webmanifest: invalid JSON ({e})')

sw=(ROOT/'sw.js').read_text(encoding='utf-8')
# Keep the pre-gig deployment checklist synchronized with the actual cache
# generation so stale-shell acceptance steps cannot silently survive a bump.
checklist_path=ROOT/'.github/PRE-GIG-CHECKLIST.md'
if not checklist_path.is_file():
    issues.append('pre-gig checklist: cache-version acceptance document is missing')
else:
    checklist_text=checklist_path.read_text(encoding='utf-8')
    if ('RIHG homepage lists Griff & Guest at 11:00 p.m.' not in checklist_text or
            'Hunter’s Ale House category calendar also lists Griff & Guest at 11:00 p.m.' not in checklist_text or
            'user-confirmed 10:00 p.m. performance set' not in checklist_text):
        issues.append('pre-gig checklist: official venue time-source discrepancy must remain explicit')
    cache_version=re.search(r"const CACHE\s*=\s*'([^']+)-v([0-9]+)'",sw)
    if not cache_version:
        issues.append('sw.js: could not determine the offline cache generation')
    else:
        cache_name=cache_version.group(1)+'-v'+cache_version.group(2)
        prior_version=int(cache_version.group(2))-1
        expected_cache_line=f'- [ ] For a future owner-approved release, verify development cache generation `{cache_name}` and confirm v{prior_version} is retired only after successful activation.'
        if expected_cache_line not in checklist_text:
            issues.append('pre-gig checklist: current and prior service-worker cache versions must match sw.js')
match=re.search(r'const CORE\s*=\s*\[(.*?)\];',sw,re.S)
if not match:
    issues.append('sw.js: could not find CORE precache list')
else:
    assets=re.findall(r"'([^']+)'",match.group(1))
    if "'./roadmap.html'" not in match.group(1):
        issues.append('sw.js: public Tour Roadmap must be included in the offline CORE precache')
    private_paths={
        'admin.html','admin.js','admin-features.js',
        'analytics.html','analytics-dashboard.js','analytics-tracker.js',
        'request-archive.html','request-archive.js','supabase-config.js'
    }
    for asset in assets:
        local=asset.split('#',1)[0].split('?',1)[0].removeprefix('./')
        asset_path=ROOT/local if local else ROOT
        if not asset_path.exists():
            issues.append(f'sw.js: missing precache asset {asset}')
        if local in private_paths:
            issues.append(f'sw.js: private asset must not be precached: {asset}')
    for required in (
        "'/roadmap.html'",
        "./styles.css?v=grifflist-tour-roadmap-1",
        'const CORE_URLS = new Set(',
        'function isCacheableRequest(request, url)',
        "request.headers.has('Range')",
        'response.status === 200',
        'function isCacheableResponseForRequest(request, response)',
        "request.credentials === 'omit'",
        "credentials: 'omit'",
        'CORE_URLS.has(url.href)',
        "url.search === ''",
        'if (!isCacheableRequest(request, url)) return;',
        "'./script.js?v=grifflist-v28'",
        "'./site-interactions.js?v=grifflist-v39'",
        "'./live-show.js?v=grifflist-v31'",
        "'./recording-safety.js?v=rights-gate-1'",
        'function canonicalPathCandidates(pathname)',
        'function normalizePathCandidate(pathname)',
        "segment === '..'",
        "if (segment === '..') return null;",
        'decodeURIComponent(current)',
        'function isPrivatePath',
        'function isApiPath',
        'function isSafePublicCacheResponse(response, requestUrl, origin)',
        'isSafePublicCacheResponse(response, request.url, self.location.origin)',
        'path === prefix.slice(0, -1) || path.includes(prefix)',
        "request.headers.has('Authorization')",
        "!vary.includes('cookie')",
        "!vary.includes('authorization')",
        "!vary.includes('*')",
        'const hasZeroFreshness',
        'const hasLegacyNoCache',
        "'must-revalidate'",
        "'proxy-revalidate'",
        'PUBLIC_NAVIGATION_PATHS',
        'cache.match(request)',
        "new URL('./offline.html', self.registration.scope)",
        "'/rest/v1/'",
        "'/auth/'",
        "'/functions/v1/'",
        "'/storage/v1/'",
        "'/graphql/v1/'",
        "'/realtime/v1/'",
        "'/api/'",
    ):
        if required not in sw:
            issues.append(f'sw.js: missing offline/privacy safeguard: {required}')
    if 'CORE_PATHS.has(url.pathname)' in sw:
        issues.append('sw.js: query-bearing cache eligibility must use exact pinned URLs, not path-only matching')
    if 'cache.addAll(' in sw:
        issues.append('sw.js: offline shell install must apply the same cache policy as runtime fetches')
    if sw.count('isSafePublicCacheResponse(response, request.url, self.location.origin)') != 2:
        issues.append('sw.js: install and runtime must both reject redirected/private/API cache responses')
    if ('if (!isCacheableResponseForRequest(request, response) ||' not in sw or
            'if (isCacheableResponseForRequest(request, response) &&' not in sw):
        issues.append('sw.js: install and runtime must both reject credentialed response caching')
    if 'ignoreSearch: true' in sw or 'ignoreSearch:true' in sw:
        issues.append('sw.js: cache matching must preserve versioned query strings')
    if sw.count("const candidates = canonicalPathCandidates(pathname);") != 2:
        issues.append('sw.js: both private and API path checks must use canonical decoded-path candidates')
    if "if (candidates === null) return true;" not in sw:
        issues.append('sw.js: malformed or excessively encoded paths must fail closed')
    if "isPrivatePath(url.pathname) || isApiPath(url.pathname)" not in sw:
        issues.append('sw.js: private/API requests must bypass cache handling')

    # Keep the complete private/admin asset denylist explicit. Prefix checks
    # cover whole admin/analytics/archive sections, while exact paths such as
    # supabase-config.js must never disappear from the cache boundary.
    private_start = sw.find("const PRIVATE_PATHS = new Set([")
    private_end = sw.find("]);", private_start) if private_start >= 0 else -1
    required_private_paths = {
        '/admin.html', '/admin.js', '/admin-features.js',
        '/analytics.html', '/analytics-dashboard.js', '/analytics-tracker.js',
        '/request-archive.html', '/request-archive.js', '/supabase-config.js',
    }
    if private_start < 0 or private_end < 0:
        issues.append('sw.js: explicit PRIVATE_PATHS denylist is missing')
    else:
        private_block = sw[private_start:private_end]
        configured_private_paths = set(re.findall(r"'(/[^']+)'", private_block))
        for private_path in sorted(required_private_paths - configured_private_paths):
            issues.append(f'sw.js: private cache denylist is missing {private_path}')
    if 'PRIVATE_PATHS.has(path)' not in sw:
        issues.append('sw.js: private-path checks must consult the explicit PRIVATE_PATHS denylist')
    if "path.startsWith('/supabase-config.js')" not in sw:
        issues.append('sw.js: Supabase config suffix and descendant aliases must remain private')

    # Old offline generations can retain resources after a worker update.
    # Require activation to delete prior Grifflist generations but preserve
    # the current cache before claiming clients.
    retirement_start = sw.find('async function retireObsoleteCaches(keys)')
    activation_start = sw.find("self.addEventListener('activate', event => {")
    activation_end = sw.find("self.addEventListener('fetch', event => {", activation_start)
    if retirement_start < 0 or activation_start < 0 or activation_end < 0 or retirement_start > activation_start:
        issues.append('sw.js: sequential cache-retirement helper or activation handler is missing')
    else:
        retirement = sw[retirement_start:activation_start]
        for required in (
            "key.startsWith('grifflist-livekit-offline-')",
            'key !== CACHE',
            'currentGeneration',
            'previousLivekit',
            'for (const key of olderCaches)',
            'await caches.delete(key)',
            'await caches.delete(previousCache)',
        ):
            if required not in retirement:
                issues.append(f'sw.js: cache retirement must preserve the previous generation until older cleanup succeeds: {required}')

        activation = sw[activation_start:activation_end]
        for required in (
            'caches.keys()',
            '.then(retireObsoleteCaches)',
            'self.clients.claim()',
        ):
            if required not in activation:
                issues.append(f'sw.js: activation must complete cache retirement before claiming clients: {required}')

# Keep the public quality workflow on a standard, no-compute-charge runner.
# The owner-only actor checks and same-repository PR guard remain mandatory.
workflow_path = ROOT / '.github/workflows/site-quality.yml'
if workflow_path.is_file():
    workflow = workflow_path.read_text(encoding='utf-8')
    required_workflow_controls = {
        'standard public runner': 'runs-on: ubuntu-latest',
        'owner actor restriction': "github.actor == 'the-griff-list'",
        'triggering actor restriction': "github.triggering_actor == 'the-griff-list'",
        'same-repository PR restriction': 'github.event.pull_request.head.repo.full_name == github.repository',
        'read-only repository token': 'permissions:\n  contents: read',
        'checkout credential persistence disabled': 'persist-credentials: false',
    }
    for control, text in required_workflow_controls.items():
        if text not in workflow:
            issues.append(f'site-quality workflow: missing {control}')
    if 'runs-on: [self-hosted' in workflow or 'runs-on: ubuntu-latest-16core' in workflow:
        issues.append('site-quality workflow: do not use a self-hosted or larger billed runner for this public static/browser suite')

registration=ROOT/'site-interactions.js'
if not registration.is_file() or "navigator.serviceWorker.register('./sw.js')" not in registration.read_text(encoding='utf-8'):
    issues.append('PWA: public site no longer registers sw.js')

try:
    import tinycss2
    for css_file in sorted(ROOT.glob('*.css')):
        parsed=tinycss2.parse_stylesheet(css_file.read_text(encoding='utf-8'),skip_whitespace=True,skip_comments=True)
        for token in parsed:
            if token.type=='error': issues.append(f'{css_file.name}: parse error {token}')
except ImportError:
    print('NOTE: tinycss2 unavailable; stylesheet parser check skipped.')
try:
    from PIL import Image
    for file in list(ROOT.glob('*.png'))+list(ROOT.glob('*.jpg'))+list(ROOT.glob('*.jpeg'))+list(ROOT.glob('*.webp')):
        try:
            with Image.open(file) as im: im.verify()
        except Exception as e: issues.append(f'{file.name}: image decode failure ({e})')
except ImportError:
    print('NOTE: Pillow unavailable; image decode check skipped.')
print(f'HTML pages checked: {len(html_files)}')
print(f'JavaScript files checked: {len(js_files)}')
print(f'Service-worker precache entries checked: {len(re.findall(r"\'[^\']+\'", match.group(1)))}' if match else 'Service-worker precache entries checked: 0')
if issues:
    print(f'FAIL: {len(issues)} issue(s)')
    for issue in issues: print(' -',issue)
    sys.exit(1)
print('PASS: no duplicate IDs or song entries, missing local references, JS syntax errors, invalid PWA manifest, missing precache assets, private-cache leaks, CSS parse errors, or image decode failures detected.')
