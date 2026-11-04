#!/usr/bin/env python3
"""Dependency-light Grifflist release smoke checks. Run: python3 qa-smoke-test.py"""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json, re, subprocess, sys
ROOT = Path(__file__).resolve().parent
issues = []
class Audit(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.refs=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        for key in ('src','href'):
            v=a.get(key,'')
            if v and not v.startswith(('http:','https:','mailto:','tel:','data:','#','javascript:')):
                self.refs.append(v.split('#',1)[0].split('?',1)[0])
html_files=sorted(ROOT.glob('*.html'))
for file in html_files:
    audit=Audit(); audit.feed(file.read_text(encoding='utf-8'))
    for duplicate in (x for x,n in Counter(audit.ids).items() if n>1):
        issues.append(f'{file.name}: duplicate id #{duplicate}')
    for ref in audit.refs:
        if ref and not (ROOT/ref).exists(): issues.append(f'{file.name}: missing local asset/page {ref}')
# Assert the time-sensitive gig and payment disclosures remain explicit.
home_html=(ROOT/'index.html').read_text(encoding='utf-8')
watch_html=(ROOT/'watch-live.html').read_text(encoding='utf-8')
for required in ('Hunter’s Ale House', 'datetime="2026-11-06"', 'Send a tip', 'Ko-fi (Apple Pay / Google Pay if enabled)', 'eligible Stripe connection'):
    if required not in home_html:
        issues.append(f'index.html: missing gig/payment acceptance text: {required}')
for required in ('Send a tip', 'eligible Stripe connection'):
    if required not in watch_html:
        issues.append(f'watch-live.html: missing payment disclosure: {required}')

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

js_files=sorted(ROOT.glob('*.js'))
for file in js_files:
    result=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
    if result.returncode: issues.append(f'{file.name}: JavaScript syntax error: {result.stderr.strip()}')
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
match=re.search(r'const CORE\s*=\s*\[(.*?)\];',sw,re.S)
if not match:
    issues.append('sw.js: could not find CORE precache list')
else:
    assets=re.findall(r"'([^']+)'",match.group(1))
    private_paths={
        'admin.html','admin.js','admin-features.js',
        'analytics.html','analytics-dashboard.js','analytics-tracker.js',
        'request-archive.html','request-archive.js','supabase-config.js'
    }
    for asset in assets:
        local=asset.split('#',1)[0].split('?',1)[0].removeprefix('./')
        if not local or not (ROOT/local).exists():
            issues.append(f'sw.js: missing precache asset {asset}')
        if local in private_paths:
            issues.append(f'sw.js: private asset must not be precached: {asset}')
    for required in (
        "const CACHE = 'grifflist-livekit-offline-v40'",
        'function isPrivatePath',
        'function isApiPath',
        'PUBLIC_NAVIGATION_PATHS',
        'cache.match(request)',
        "new URL('./offline.html', self.registration.scope)",
    ):
        if required not in sw:
            issues.append(f'sw.js: missing offline/privacy safeguard: {required}')
    if 'ignoreSearch: true' in sw or 'ignoreSearch:true' in sw:
        issues.append('sw.js: cache matching must preserve versioned query strings')
    if "isPrivatePath(url.pathname) || isApiPath(url.pathname)" not in sw:
        issues.append('sw.js: private/API requests must bypass cache handling')

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
print('PASS: no duplicate IDs, missing local references, JS syntax errors, invalid PWA manifest, missing precache assets, private-cache leaks, CSS parse errors, or image decode failures detected.')
