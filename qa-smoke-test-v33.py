from pathlib import Path
from html.parser import HTMLParser
import re, json
ROOT=Path(__file__).resolve().parent
class P(HTMLParser):
 def __init__(self): super().__init__(); self.ids=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if 'id' in d:self.ids.append(d['id'])
errors=[]
for f in ROOT.glob('*.html'):
 p=P(); p.feed(f.read_text(errors='ignore'))
 dup=sorted({x for x in p.ids if p.ids.count(x)>1})
 if dup: errors.append(f'{f.name}: duplicate ids {dup}')
for f in ROOT.glob('*.js'):
 pass
idx=(ROOT/'index.html').read_text()
assert 'whats-new-reopen' not in idx, 'footer reopen button still present'
assert 'whats-new-dialog' in idx and 'whats-new-done' in idx
js=(ROOT/'whats-new.js').read_text()
for term in ['Griffy-Doo','RELEASE_WINDOW','halloween','grifflist:entered']:
 if term not in js: errors.append(f'missing seasonal/automatic behavior: {term}')
if errors: raise SystemExit('FAILED\n'+'\n'.join(errors))
print("PASS: HTML duplicate-ID checks and v33 What's New assertions")
