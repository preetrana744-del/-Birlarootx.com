import test from 'node:test';
import assert from 'node:assert/strict';
import {createProductSyncHandler, SYNC_CONTEXT_QUERY, SYNC_PRICE_MUTATION} from '../../supabase/functions/_shared/product-sync-handler.mjs';

const userId='11111111-1111-4111-8111-111111111111';
const productId='gid://shopify/Product/10360561336618';
const variantId='gid://shopify/ProductVariant/52947179405610';
const env={
 SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-key',
 SUPABASE_SERVICE_ROLE_KEY:'server-service-key',SHOPIFY_ADMIN_ACCESS_TOKEN:'server-admin-token',
 ROOTX_SHOPIFY_PRODUCT_SYNC_ENABLED:'true'
};
function setup(options={}) {
 const calls=[];
 let productReads=0;
 const fetcher=async(url,init={})=>{
  calls.push({url,init});
  if(url.endsWith('/auth/v1/user')) return Response.json(options.badAuth?{}:{id:userId,email_confirmed_at:'2026-10-14T00:00:00Z'},{status:options.badAuth?401:200});
  if(url.includes('/rest/v1/rootx_admin_users?')) return Response.json(options.customer?[]:[{user_id:userId}]);
  if(url.includes('/rest/v1/rootx_products?')) {
   productReads++;
   return Response.json([{slug:'carbs-slayer',price:options.dbChanged && productReads>1?'2599.00':'2499.00',image_url:'https://birlarootx.com/carbs-slayer.jpg'}]);
  }
  if(url.includes('/rest/v1/rootx_shopify_variants?')) return Response.json([{product_id:productId,variant_id:variantId}]);
  if(url==='https://vbvfdy-ed.myshopify.com/admin/api/2026-10/graphql.json') {
   const operation=JSON.parse(init.body);
   if(operation.query===SYNC_CONTEXT_QUERY) return Response.json({data:{shop:{myshopifyDomain:options.wrongShop?'other.myshopify.com':'vbvfdy-ed.myshopify.com',currencyCode:options.foreign?'USD':'INR'},productVariant:{id:variantId,price:options.same?'2499.00':'2500.00',product:{id:options.wrongMapping?'gid://shopify/Product/9':productId}}}});
   if(operation.query===SYNC_PRICE_MUTATION) return Response.json({data:{productVariantsBulkUpdate:{productVariants:[{id:variantId,price:'2499.00'}],userErrors:options.shopifyError?[{message:'secret diagnostic that must not be sent'}]:[]}}});
  }
  throw new Error('Unexpected request '+url);
 };
 return {calls,handler:createProductSyncHandler({...env,...options.env},fetcher)};
}
const req=(body={slug:'carbs-slayer'},auth=true)=>new Request('https://example.supabase.co/functions/v1/rootx-shopify-product-sync',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer real.jwt.token'}:{})},body:JSON.stringify(body)});
const writes=calls=>calls.filter(c=>c.url.includes('/admin/api/') && JSON.parse(c.init.body).query===SYNC_PRICE_MUTATION);

test('requires actual JWT auth and server admin membership before Shopify access',async()=>{
 let s=setup();
 assert.equal((await s.handler(req(undefined,false))).status,401);
 assert.equal(s.calls.length,0);
 s=setup({badAuth:true});
 assert.equal((await s.handler(req())).status,401);
 assert.equal(s.calls.length,1);
 s=setup({customer:true});
 assert.equal((await s.handler(req())).status,403);
 assert.equal(s.calls.filter(c=>c.url.includes('/admin/api/')).length,0);
});
test('disabled helper does no Shopify work',async()=>{
 const s=setup({env:{ROOTX_SHOPIFY_PRODUCT_SYNC_ENABLED:'false'}});
 assert.equal((await s.handler(req())).status,503);
 assert.equal(s.calls.filter(c=>c.url.includes('/admin/api/')).length,0);
});
test('accepts only slug and ignores no client price/image/IDs',async()=>{
 const s=setup();
 assert.equal((await s.handler(req({slug:'carbs-slayer',price:1}))).status,400);
 assert.equal((await s.handler(req({slug:'carbs-slayer&select=*'}))).status,400);
 assert.equal(s.calls.filter(c=>c.url.includes('/admin/api/')).length,0);
});
test('syncs only server-owned mapped variant price and retains all other fields',async()=>{
 const s=setup();
 const response=await s.handler(req());
 assert.equal(response.status,200);
 const body=await response.json();
 assert.deepEqual(body.synced_fields,['price']);
 assert.equal(body.images,'unchanged');
 assert.equal(body.price,'2499.00');
 const write=writes(s.calls);
 assert.equal(write.length,1);
 assert.deepEqual(JSON.parse(write[0].init.body).variables,{productId,variants:[{id:variantId,price:'2499.00'}]});
 assert.equal(write[0].init.headers['X-Shopify-Access-Token'],'server-admin-token');
 assert.equal(JSON.stringify(body).includes('server-'),false);
 assert.equal(s.calls.some(c=>c.url.startsWith('https://birlarootx.com/')),false);
});
test('unchanged price performs no mutation and reports scope accurately',async()=>{
 const s=setup({same:true});
 const response=await s.handler(req());
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.changed,false);
 assert.equal(body.images,'unchanged');
 assert.equal(writes(s.calls).length,0);
});
test('rejects wrong store, currency and product relationship before mutation',async()=>{
 for(const option of [{wrongShop:true},{foreign:true},{wrongMapping:true}]){
  const s=setup(option);
  assert.equal((await s.handler(req())).status,409);
  assert.equal(writes(s.calls).length,0);
 }
});
test('detects Supabase edit during request and requests another sync',async()=>{
 const s=setup({dbChanged:true});
 assert.equal((await s.handler(req())).status,409);
});
test('Shopify errors are not reported as synced or leaked',async()=>{
 const s=setup({shopifyError:true});
 const response=await s.handler(req());
 assert.equal(response.status,503);
 assert.equal((await response.text()).includes('secret diagnostic'),false);
});

