import {SHOP, API_VERSION, UUID, VARIANTS_QUERY, CART_MUTATION, cartItems, verifyPrices, verifyCreatedCart, safeCheckoutUrl, randomProof, sha256, json, cors} from './commerce.mjs';

export function createCheckoutHandler(env, fetcher=fetch) {
  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const enabled = () => env.ROOTX_SHOPIFY_CHECKOUT_ENABLED === 'true' && env.ROOTX_SHOPIFY_SYNC_READY === 'true' && Boolean(env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN && env.SHOPIFY_WEBHOOK_SECRET && base && key);
  async function rest(path, options={}) {
    const response = await fetcher(base + '/rest/v1/' + path, {...options, signal:AbortSignal.timeout(7000), headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...options.headers}});
    if (!response.ok) throw new Error('Database unavailable.');
    return response.status === 204 ? null : response.json();
  }
  async function storefront(query, variables) {
    const response = await fetcher('https://' + SHOP + '/api/' + API_VERSION + '/graphql.json', {method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN},body:JSON.stringify({query,variables})});
    if (!response.ok) throw new Error('Secure checkout is temporarily unavailable.');
    const data = await response.json();
    if (data.errors?.length || !data.data) throw new Error('Secure checkout is temporarily unavailable.');
    return data.data;
  }
  return async req => {
    const headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (req.method === 'GET') return json({enabled:enabled()},200,headers);
    if (req.method !== 'POST') return json({error:'Method not allowed.'},405,headers);
    const auth = req.headers.get('Authorization') || '';
    if (!/^Bearer [\w.-]+$/.test(auth)) return json({error:'Please sign in again.'},401,headers);
    let placeholder = null;
    try {
      const userResponse = await fetcher(base + '/auth/v1/user', {headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(7000)});
      const user = userResponse.ok ? await userResponse.json() : null;
      if (!user?.id || !UUID.test(user.id) || !user.email || !user.email_confirmed_at || user.is_anonymous) return json({error:'Please sign in with a verified account.'},401,headers);
      if (!enabled()) return json({error:'Online payment is not available yet.'},503,headers);
      const text = await req.text();
      if (text.length > 10000) return json({error:'Invalid cart.'},400,headers);
      let body;
      try { body = JSON.parse(text); } catch { return json({error:'Invalid cart.'},400,headers); }
      if (!UUID.test(body?.client_request_id || '')) return json({error:'Invalid checkout request.'},400,headers);
      let items;
      try { items = cartItems(body.items); } catch (e) { return json({error:e.message},400,headers); }
      const [products,mappings] = await Promise.all([
        rest('rootx_products?select=slug,price,active'), rest('rootx_shopify_variants?select=slug,variant_id')
      ]);
      const ids = items.map(i => mappings.find(m => m.slug === i.slug)?.variant_id).filter(Boolean).map(id => 'gid://shopify/ProductVariant/' + String(id).replace(/^gid:\/\/shopify\/ProductVariant\//,''));
      const variants = await storefront(VARIANTS_QUERY,{ids});
      let proofItems;
      try { proofItems = verifyPrices(items,products,mappings,variants.nodes || []); } catch(e) { return json({error:e.message},409,headers); }
      const query = 'rootx_shopify_checkouts?user_id=eq.'+user.id+'&client_request_id=eq.'+body.client_request_id;
      const previous = (await rest(query+'&select=id,items,checkout_url,expires_at,consumed_order_id,created_at'))[0];
      if (previous) {
        if (JSON.stringify(previous.items) !== JSON.stringify(proofItems)) return json({error:'Your cart changed. Please start checkout again.',code:'CHECKOUT_EXPIRED'},409,headers);
        if (previous.consumed_order_id || Date.parse(previous.expires_at) <= Date.now()) return json({error:'Please start a new checkout.',code:'CHECKOUT_EXPIRED'},409,headers);
        if (!safeCheckoutUrl(previous.checkout_url)) return json({error:'Checkout is being prepared. Please try again shortly.',...(Date.now()-Date.parse(previous.created_at)>120000?{code:'CHECKOUT_EXPIRED'}:{})},409,headers);
        return json({checkout_url:previous.checkout_url},200,headers);
      }
      const proof = randomProof();
      const id = crypto.randomUUID();
      // A per-account transaction lock enforces the limit even under concurrent requests.
      const reserved = await rest('rpc/rootx_reserve_shopify_checkout',{method:'POST',body:JSON.stringify({payload:{id,user_id:user.id,client_request_id:body.client_request_id,items:proofItems,link_token_hash:await sha256(proof),expires_at:new Date(Date.now()+7*86400000).toISOString()}})});
      if (!reserved.created) return json({error:'Checkout is being prepared. Please try again shortly.'},409,headers);
      placeholder = id;
      const created = await storefront(CART_MUTATION,{input:{lines:proofItems.map(i=>({merchandiseId:'gid://shopify/ProductVariant/'+i.variant_id,quantity:i.quantity})),buyerIdentity:{email:user.email,countryCode:'IN'},attributes:[{key:'rootx_checkout',value:proof}]}});
      const result = created.cartCreate;
      if (result?.userErrors?.length || result?.warnings?.length) throw new Error('Cart availability changed. Please update your cart.');
      verifyCreatedCart(result?.cart,proofItems,variants.nodes);
      const saved = await rest('rootx_shopify_checkouts?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({cart_id:result.cart.id,checkout_url:result.cart.checkoutUrl})});
      if (saved.length !== 1) throw new Error('Could not save secure checkout.');
      placeholder = null;
      return json({checkout_url:result.cart.checkoutUrl},200,headers);
    } catch {
      if (placeholder) {
        try { await rest('rootx_shopify_checkouts?id=eq.'+placeholder+'&cart_id=is.null',{method:'DELETE',headers:{Prefer:'return=minimal'}}); } catch { /* A pending row is safe; no customer order has been created. */ }
      }
      return json({error:'Could not start secure checkout. Please try again shortly.'},503,headers);
    }
  };
}
