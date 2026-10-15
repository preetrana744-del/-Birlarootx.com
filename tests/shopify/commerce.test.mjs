import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {cartItems,verifyPrices,verifyCreatedCart,normalizeOrder,sha256,verifySignature,safeCheckoutUrl,SHOP} from '../../supabase/functions/_shared/commerce.mjs';
import {createCheckoutHandler} from '../../supabase/functions/_shared/checkout-handler.mjs';
import {createWebhookHandler} from '../../supabase/functions/_shared/webhook-handler.mjs';
globalThis.crypto ||= webcrypto;
const uid='11111111-1111-4111-8111-111111111111', rid='22222222-2222-4222-8222-222222222222';
const proof='a'.repeat(64);
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',SHOPIFY_STOREFRONT_PUBLIC_TOKEN:'test-storefront',SHOPIFY_WEBHOOK_SECRET:'test-webhook',ROOTX_SHOPIFY_CHECKOUT_ENABLED:'true',ROOTX_SHOPIFY_SYNC_READY:'true'};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const body={items:[{slug:'carbs-slayer',quantity:2}],client_request_id:rid};
const post=()=>new Request('https://example.supabase.co/functions/v1/rootx-shopify-checkout',{method:'POST',headers:{Authorization:'Bearer valid.jwt.token',Origin:'https://birlarootx.com'},body:JSON.stringify(body)});
function fixture({badPrice=false,prior=null,anonymous=false}={}) {
  const calls=[];let saved;
  const fetcher=async(url,opts={})=>{
    calls.push({url,opts});
    if(url.endsWith('/auth/v1/user'))return reply({id:uid,email:'fixture@example.invalid',email_confirmed_at:'2026-01-01',is_anonymous:anonymous});
    if(url.includes('rootx_products?'))return reply([{slug:'carbs-slayer',price:2499,active:true}]);
    if(url.includes('rootx_shopify_variants?'))return reply([{slug:'carbs-slayer',variant_id:'123'}]);
    if(url.includes('/graphql.json')){
      const b=JSON.parse(opts.body);
      if(b.query.startsWith('query'))return reply({data:{nodes:[{id:'gid://shopify/ProductVariant/123',availableForSale:true,price:{amount:badPrice?'100':'2499',currencyCode:'INR'}}]}});
      return reply({data:{cartCreate:{cart:{id:'gid://shopify/Cart/testcart?key=testonly',checkoutUrl:'https://'+SHOP+'/checkouts/testonly',lines:{nodes:[{quantity:2,merchandise:{id:'gid://shopify/ProductVariant/123',price:{amount:'2499',currencyCode:'INR'}}}]}},userErrors:[],warnings:[]}}});
    }
    if(url.endsWith('rpc/rootx_reserve_shopify_checkout')){saved=JSON.parse(opts.body).payload;return reply({created:true,checkout:saved});}
    if(opts.method==='PATCH')return reply([{id:saved.id,...JSON.parse(opts.body)}]);
    if(url.includes('client_request_id=eq.'))return reply(prior?[prior]:[]);
    if(url.includes('created_at=gte.'))return reply([]);
    throw Error('Unexpected fixture request');
  };
  return {fetcher,calls,get saved(){return saved;}};
}
test('cart rejects invalid quantities and aggregates duplicate products',()=>{
  assert.deepEqual(cartItems([{slug:'carbs',quantity:2},{slug:'carbs',quantity:3}]),[{slug:'carbs',quantity:5}]);
  for(const n of [0,-1,1.5,100,'2'])assert.throws(()=>cartItems([{slug:'carbs',quantity:n}]));
  assert.throws(()=>cartItems([{slug:'carbs',quantity:99},{slug:'carbs',quantity:1}]));
});
test('price and availability checks fail before cart creation',()=>{
  const item=[{slug:'carbs',quantity:1}],p=[{slug:'carbs',active:true,price:100}],m=[{slug:'carbs',variant_id:'123'}];
  assert.throws(()=>verifyPrices(item,p,m,[{id:'gid://shopify/ProductVariant/123',availableForSale:true,price:{amount:'1',currencyCode:'INR'}}]));
  assert.throws(()=>verifyPrices(item,p,m,[]));
  assert.throws(()=>verifyCreatedCart({id:'x',checkoutUrl:'https://evil.invalid',lines:{nodes:[]}},[]));
  assert.equal(safeCheckoutUrl('https://'+SHOP+'.evil.invalid/checkouts'),false);
  assert.throws(()=>verifyCreatedCart({id:'x',checkoutUrl:'https://'+SHOP+'/checkout',lines:{nodes:[{quantity:1,merchandise:{id:'gid://shopify/ProductVariant/123',price:{amount:'999999',currencyCode:'USD'}}}]}},[{variant_id:'123',quantity:1}],[{id:'gid://shopify/ProductVariant/123',price:{amount:'2499',currencyCode:'INR'}}]));
});
test('readiness fails closed without every activation prerequisite',async()=>{
  const handler=createCheckoutHandler({...env,ROOTX_SHOPIFY_CHECKOUT_ENABLED:''},()=>{throw Error('No network expected')});
  const response=await handler(new Request('https://example.invalid'));
  assert.deepEqual(await response.json(),{enabled:false});
  assert.equal((await handler(new Request('https://example.invalid',{method:'POST'}))).status,401);
});
test('checkout verifies identity/prices, stores only proof hash, and returns only safe URL',async()=>{
  const f=fixture(),response=await createCheckoutHandler(env,f.fetcher)(post());
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{checkout_url:'https://'+SHOP+'/checkouts/testonly'});
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://birlarootx.com');
  assert.equal(f.saved.user_id,uid);assert.match(f.saved.link_token_hash,/^[a-f0-9]{64}$/);
  const shopCall=f.calls.find(c=>c.opts.body&&JSON.parse(c.opts.body).query?.startsWith('mutation'));
  const raw=JSON.parse(shopCall.opts.body).variables.input.attributes[0].value;
  assert.equal(f.saved.link_token_hash,await sha256(raw));assert.equal(JSON.stringify(f.saved).includes(raw),false);
  assert.equal(shopCall.opts.headers.Authorization,undefined);
});
test('mismatched price and anonymous identity never allocate a cart',async()=>{
  for(const options of [{badPrice:true},{anonymous:true}]){
    const f=fixture(options),response=await createCheckoutHandler(env,f.fetcher)(post());
    assert.ok([401,409].includes(response.status));
    assert.equal(f.calls.some(c=>c.opts.body&&JSON.parse(c.opts.body).query?.startsWith('mutation')),false);
    assert.equal(f.saved,undefined);
  }
});
test('repeat checkout reuses matching saved cart; consumed checkout requires new id',async()=>{
  const prior={items:[{variant_id:'123',quantity:2}],checkout_url:'https://'+SHOP+'/checkouts/existing',expires_at:'2099-01-01T00:00:00Z'};
  let f=fixture({prior}),response=await createCheckoutHandler(env,f.fetcher)(post());
  assert.equal(response.status,200);assert.equal(f.saved,undefined);
  f=fixture({prior:{...prior,consumed_order_id:'999'}});response=await createCheckoutHandler(env,f.fetcher)(post());
  assert.equal(response.status,409);assert.equal((await response.json()).code,'CHECKOUT_EXPIRED');
});
const order={id:123,name:'#1001',cart_token:'testcart',note_attributes:[{name:'rootx_checkout',value:proof}],updated_at:'2026-10-15T10:00:00Z',financial_status:'paid',currency:'INR',subtotal_price:'4998',total_price:'5048',shipping_address:{name:'Test Customer',phone:'+919999999999',address1:'TEST ADDRESS',city:'TEST CITY',zip:'000000',country:'India'},line_items:[{variant_id:123,quantity:2,name:'Carbs Slayer',price:'2499'}],fulfillments:[{status:'success',tracking_company:'TEST',tracking_number:'TEST-TRACK',updated_at:'2026-10-15T09:00:00Z'}]};
async function signature(text){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.SHOPIFY_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(text)))));}
test('webhook HMAC covers exact raw bytes',async()=>{
  const text=JSON.stringify(order),sig=await signature(text);
  assert.equal(await verifySignature(new TextEncoder().encode(text),sig,env.SHOPIFY_WEBHOOK_SECRET),true);
  assert.equal(await verifySignature(new TextEncoder().encode(text+' '),sig,env.SHOPIFY_WEBHOOK_SECRET),false);
  assert.equal(await verifySignature(new TextEncoder().encode(text),'bad',env.SHOPIFY_WEBHOOK_SECRET),false);
});
test('unlinked orders are ignored and shipping/amounts normalized without email association',()=>{
  assert.equal(normalizeOrder({...order,note_attributes:[]},rid),null);
  const normalized=normalizeOrder(order,rid);assert.equal(normalized.shipping_phone,'+919999999999');assert.equal(normalized.total,5048);assert.equal(normalized.email,undefined);assert.equal(normalized.customer_id,undefined);
  assert.equal(normalizeOrder({...order,shipping_address:{...order.shipping_address,phone:null}},rid).shipping_phone,'');
  assert.throws(()=>normalizeOrder({...order,shipping_address:{}},rid));
});
test('webhook rejects wrong store/signature and acknowledges only committed RPC',async()=>{
  const text=JSON.stringify(order),sig=await signature(text);let call;
  const make=(extra={})=>new Request('https://example.invalid',{method:'POST',body:text,headers:{'X-Shopify-Shop-Domain':SHOP,'X-Shopify-Hmac-Sha256':sig,'X-Shopify-Topic':'orders/paid','X-Shopify-Event-Id':rid,...extra}});
  const handler=createWebhookHandler(env,async(url,opts)=>{call=JSON.parse(opts.body);return reply({created:true});});
  assert.equal((await handler(make({'X-Shopify-Shop-Domain':'wrong.myshopify.com'}))).status,401);assert.equal(call,undefined);
  assert.equal((await handler(make({'X-Shopify-Hmac-Sha256':'bad'}))).status,401);assert.equal(call,undefined);
  assert.equal((await handler(make())).status,200);assert.equal(call.payload.proof,undefined);assert.equal(call.payload.token_hash,await sha256(proof));
  const fail=createWebhookHandler(env,async()=>reply({},500));assert.equal((await fail(make())).status,503);
});
