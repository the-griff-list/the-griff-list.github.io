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
js_files=sorted(ROOT.glob('*.js'))
for file in js_files:
    result=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
    if result.returncode: issues.append(f'{file.name}: JavaScript syntax error: {result.stderr.strip()}')
manifest=ROOT/'manifest.webmanifest'
try: json.loads(manifest.read_text(encoding='utf-8'))
except Exception as e: issues.append(f'manifest.webmanifest: invalid JSON ({e})')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
match=re.search(r'const CORE=\[(.*?)\];',sw,re.S)
if not match: issues.append('sw.js: could not find CORE precache list')
else:
    assets=re.findall(r"'([^']+)'",match.group(1))
    for asset in assets:
        if not (ROOT/asset.removeprefix('./')).exists(): issues.append(f'sw.js: missing precache asset {asset}')
try:
    import tinycss2
    parsed=tinycss2.parse_stylesheet((ROOT/'styles.css').read_text(encoding='utf-8'),skip_whitespace=True,skip_comments=True)
    for token in parsed:
        if token.type=='error': issues.append(f'styles.css: parse error {token}')
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
print('PASS: no duplicate IDs, missing local references, JS syntax errors, invalid manifest, missing precache assets, CSS parse errors, or image decode failures detected.')
