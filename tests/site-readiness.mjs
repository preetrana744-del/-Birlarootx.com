import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../account-helpers.js',import.meta.url),'utf8'),context);
const {tracking,saveProduct}=context.window.ROOTX_ACCOUNT_HELPERS;
let count=0;const check=(x,label)=>{assert(x,label);console.log('PASS '+label);count++;};
check(tracking('Blue Dart','ABC').url==='https://www.bluedart.com/tracking','Official Blue Dart tracker');
check(tracking('DELHIVERY','ABC').url==='https://www.delhivery.com/tracking','Official Delhivery tracker');
check(!tracking('https://attacker.invalid','ABC'),'Unknown courier has no invented link');
check(!tracking('Blue Dart',''),'Missing reference has no tracker');
check(!tracking('Blue Dart<script>','ABC'),'Untrusted courier is not interpreted as a URL');
function fixture({error=null,data=[{slug:'carbs-slayer'}],throws=false,cleanupError=false,uploadError=false}={}){
 const calls=[];const bucket={upload:async p=>{calls.push(['upload',p]);return{error:uploadError?{}:null};},getPublicUrl:p=>({data:{publicUrl:'https://example.invalid/'+p}}),remove:async paths=>{calls.push(['remove',...paths]);return{error:cleanupError?{}:null};}};
 const db={storage:{from:()=>bucket},from:()=>({update:patch=>{calls.push(['update',patch]);return{eq:()=>({select:async()=>{if(throws)throw Error();return{data,error};}})};}})};
 return{db,calls};
}
const args={slug:'carbs-slayer',price:2499,file:{type:'image/webp',size:100},uuid:()=>'controlled-id'};
let f=fixture();await saveProduct(f.db,args);check(f.calls.filter(c=>c[0]==='remove').length===0,'Successful save retains new image');
f=fixture({error:{code:'42501'},data:null});await assert.rejects(()=>saveProduct(f.db,args),/unused photo was removed/);check(f.calls.some(c=>c[0]==='remove'&&c[1]==='carbs-slayer/controlled-id.webp'),'Definite denied save removes only its new upload');
f=fixture({data:[]});await assert.rejects(()=>saveProduct(f.db,args),/not saved/);check(f.calls.some(c=>c[0]==='remove'),'Zero-row denied save cleans new upload');
for(const config of [{error:{message:'network error'},data:null},{throws:true}]){f=fixture(config);await assert.rejects(()=>saveProduct(f.db,args),/uncertain|could not be confirmed/);check(!f.calls.some(c=>c[0]==='remove'),'Uncertain save retains possibly referenced image');}
f=fixture({error:{code:'42501'},data:null,cleanupError:true});await assert.rejects(()=>saveProduct(f.db,args),/could not be removed/);check(true,'Cleanup failure requires admin review');
f=fixture({uploadError:true});await assert.rejects(()=>saveProduct(f.db,args),/upload failed/);check(!f.calls.some(c=>c[0]==='update'),'Failed upload never updates product');
f=fixture();await assert.rejects(()=>saveProduct(f.db,{...args,file:{type:'image/svg+xml',size:100}}),/JPG, PNG or WebP/);check(f.calls.length===0,'Disallowed image rejected before upload');
await assert.rejects(()=>saveProduct(f.db,{...args,slug:'../other'}),/valid product/);check(true,'Unsafe image path rejected');
console.log(count+' readiness checks passed.');

const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert(home.includes('id="products-title"'),'Health probe identifies the actual homepage section');
