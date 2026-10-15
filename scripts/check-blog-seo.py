"""Validate journal metadata, schema, crawl paths and in-page navigation."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://birlarootx.com/'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='a' and 'href' in a:self.links.append(a['href'])
urls={n.text for n in ET.parse(ROOT/'sitemap.xml').iter() if n.tag.endswith('}loc')}
titles=set();pages=sorted((ROOT/'blog').glob('*.html'))
assert pages,'Journal pages missing'
for p in pages:
 s=p.read_text();title=re.search('<title>(.*?)</title>',s)[1]
 assert title not in titles,f'{p.name}: duplicate title'
 titles.add(title)
 assert len(re.findall(r'<h1\b',s))==1,p.name
 assert re.search(r'<meta name="description" content="[^"]+"',s),p.name
 expected=BASE+p.relative_to(ROOT).as_posix().removesuffix('index.html')
 assert f'rel="canonical" href="{expected}"' in s,p.name
 assert expected in urls,p.name
 assert 'noindex' not in s.lower(),p.name
 blocks=re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S)
 assert blocks,p.name
 for b in blocks:
  data=json.loads(b)
  for n in data.get('@graph',[]):
   if n.get('@type')=='BlogPosting':
    assert n['headline'] and n['datePublished'] and n['author'] and n['mainEntityOfPage']==expected,p.name
 page=Page();page.feed(s)
 for link in page.links:
  u=urlsplit(link)
  if u.scheme not in ('','https','http') or (u.netloc and u.netloc!='birlarootx.com'):continue
  target=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.path:target=p
  if target.is_dir():target=target/'index.html'
  assert target.exists(),(p.name,link)
  if target==p and u.fragment:assert unquote(u.fragment) in page.ids,(p.name,link)
print(f'PASS: {len(pages)} journal pages; metadata, JSON-LD, sitemap and links valid.')
