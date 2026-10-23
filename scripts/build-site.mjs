import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=path.join(root,'_site');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'public-files.json'),'utf8'));
if(new Set(manifest).size!==manifest.length)throw Error('Duplicate public entry');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
for(const entry of manifest){
 if(!/^(?:[a-zA-Z0-9_-]+\.(?:html|css|js|jpg|png|svg|txt|xml|webmanifest)|CNAME|(?:assets|blog|policies)\/[a-zA-Z0-9_./-]+\.(?:html|css|jpg|png|svg))$/.test(entry)||entry.split('/').some(p=>p==='..'||p.startsWith('.')))throw Error('Unsafe public entry: '+entry);
 const source=path.join(root,entry);if(!fs.lstatSync(source).isFile()||fs.lstatSync(source).isSymbolicLink())throw Error('Public entry must be a regular file: '+entry);
 const dest=path.join(output,entry);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);
}
const js=fs.readFileSync(path.join(root,'script.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(js.slice(0,js.indexOf('const labelShared'))+'globalThis.catalogue=Object.entries(products).map(([key,product])=>({...product,key}));',context);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template=fs.readFileSync(path.join(root,'product.html'),'utf8');
for(const product of context.catalogue){
 const url='https://birlarootx.com/products/'+product.slug+'/';
 // Live catalogue data remains authoritative for selling price and stock.
 const description=product.name+' by Birla RootX. '+product.summary+'. View ingredients, directions and label details; check current price and availability on the page.';
 const image='https://birlarootx.com'+product.image;
 let html=template.replace('<head>','<head>\n    <base href="/">').replace('data-product-page>','data-product-page data-product-slug="'+escape(product.slug)+'">');
 html=html.replace(/<title>[^<]*<\/title>/,'<title>'+escape(product.name)+' | Birla RootX</title>');
 const meta={description,'og:title':product.name+' | Birla RootX','og:description':description,'og:url':url,'og:image':image,'twitter:title':product.name+' | Birla RootX','twitter:description':description,'twitter:image':image};
 for(const [name,value] of Object.entries(meta))html=html.replace(new RegExp('(<meta (?:name|property)="'+name+'" content=")[^"]*("[^>]*>)'),(_,a,b)=>a+escape(value)+b);
 html=html.replace('</head>','<link rel="canonical" href="'+url+'"></head>');
 html=html.replace(/href="#([^"]+)"/g,(_,fragment)=>'href="'+url+'#'+fragment+'"');
 const schema={'@context':'https://schema.org','@type':'Product',name:product.name,url,image:[image],description:product.summary,category:product.category,brand:{'@type':'Brand',name:'Birla RootX'}};
 html=html.replace(/(<script id="product-structured-data" type="application\/ld\+json">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(schema).replace(/</g,'\\u003c')+b);
 html=html.replace(/(<h1 id="detail-title" data-detail-name>)[^<]*(<\/h1>)/,(_,a,b)=>a+escape(product.name)+b).replace(/(<p class="detail-summary" data-detail-summary>)[^<]*(<\/p>)/,(_,a,b)=>a+escape(product.summary)+b);
 html=html.replaceAll('/assets/brand-deck/carbs-slayer.jpg',product.image).replaceAll('Carbs Slayer',escape(product.name)).replaceAll('data-product="carbs"','data-product="'+product.key+'"');
 html=html.replace(/(data-(?:detail|sticky)-add)([^>]*?)(>)/g,'$1 disabled$2$3');
 html=html.replace(/(<(?:span|strong) data-detail-price>)[^<]*(<\/\w+>)/g,'$1—$2').replace(/(<b data-label-mrp>)[^<]*(<\/b>)/,'$1See pack label$2');
 const dest=path.join(output,'products',product.slug,'index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);
}
console.log('Built '+manifest.length+' public files and '+context.catalogue.length+' product preview pages.');

// Version the shared typography stylesheet in every published HTML page.
function refreshTypographyVersion(dir) {
 for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  const target=path.join(dir,entry.name);
  if(entry.isDirectory())refreshTypographyVersion(target);
  else if(entry.name.endsWith('.html')){
   const html=fs.readFileSync(target,'utf8');
   fs.writeFileSync(target,html.replaceAll('customer-info.css?v=20261022','customer-info.css?v=original-colours-20261024'));
  }
 }
}
refreshTypographyVersion(output);
