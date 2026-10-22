import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=new URL('../_site/',import.meta.url),base='https://birlarootx.com/';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(root.pathname);let refs=0;
for(const file of files){
 const relative=path.relative(root.pathname,file);
 assert(!/(^|\/)(?:supabase|tests|docs|scripts|\.github)(\/|$)|\.(?:sql|md|toml|yml)$/.test(relative),'Internal artifact published: '+relative);
 if(!file.endsWith('.html'))continue;
 const html=fs.readFileSync(file,'utf8');
 const page=new URL(relative,base),resolution=/<base href="\/">/.test(html)?new URL(base):page;
 for(const m of html.matchAll(/(?:href|src)=["']([^"']+)/g)){
  const raw=m[1].replaceAll('&amp;','&');if(/^(?:mailto:|tel:|data:)/.test(raw))continue;
  const url=new URL(raw,resolution);if(url.origin!==new URL(base).origin)continue;
  let target=decodeURIComponent(url.pathname.slice(1));if(!target||target.endsWith('/'))target+='index.html';
  assert(fs.existsSync(path.join(root.pathname,target)),relative+' links to missing '+target);refs++;
 }
}
for(const slug of ['carbs-slayer','jacked-pre-workout','spilan-test','epic-burn-pro','growth-factor']){
 const html=fs.readFileSync(new URL('products/'+slug+'/index.html',root),'utf8');
 assert(html.includes('data-product-slug="'+slug+'"'));
 assert(html.includes('href="'+base+'products/'+slug+'/#main"'),'Product skip link stays on its own page');
 assert(html.includes('content="'+base+'products/'+slug+'/"'));
 assert(html.includes('href="'+base+'products/'+slug+'/"'));
 const json=JSON.parse(html.match(/id="product-structured-data"[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(json.url,base+'products/'+slug+'/');assert(!json.offers,'Do not invent stock or a stale price');
 assert(html.includes('og:image" content="'+base+'assets/brand-deck/'+slug+'.jpg'));
}
console.log('Public artifact checked: '+files.length+' files, '+refs+' local references, 5 initial-HTML product previews; internal sources excluded.');
