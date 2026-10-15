// Prepared manual admin operation; not deployed or wired into Save.
// Only price is synced. Shopify photos, status, inventory, taxes and variants are preserved.
// Enable only after secure Admin API credentials and an end-to-end test are complete.
// Docs: https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/productVariantsBulkUpdate
import {SHOP, API_VERSION, UUID, json, cors} from './commerce.mjs';

export const SYNC_CONTEXT_QUERY = "query RootxSyncContext($variantId: ID!) { shop { myshopifyDomain currencyCode } productVariant(id: $variantId) { id price product { id } } }";
export const SYNC_PRICE_MUTATION = "mutation RootxSyncPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: false) { productVariants { id price } userErrors { message } } }";

const gid = (value, kind) => {
  const id = String(value || '').replace('gid://shopify/' + kind + '/', '');
  if (!/^[1-9][0-9]{0,19}$/.test(id)) throw new Error('Invalid catalogue mapping.');
  return 'gid://shopify/' + kind + '/' + id;
};
function price(value) {
  if (!['number','string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error('Invalid product price.');
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 1000000) throw new Error('Invalid product price.');
  return n.toFixed(2);
}
export function createProductSyncHandler(env, fetcher=fetch) {
  async function rest(path) {
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetcher(env.SUPABASE_URL + '/rest/v1/' + path, {
      signal:AbortSignal.timeout(7000),
      headers:{apikey:key,Authorization:'Bearer '+key}
    });
    if (!response.ok) throw new Error('Database unavailable.');
    return response.json();
  }
  async function admin(query,variables) {
    const response = await fetcher('https://' + SHOP + '/admin/api/' + API_VERSION + '/graphql.json', {
      method:'POST',signal:AbortSignal.timeout(10000),
      headers:{'Content-Type':'application/json','X-Shopify-Access-Token':env.SHOPIFY_ADMIN_ACCESS_TOKEN},
      body:JSON.stringify({query,variables})
    });
    if (!response.ok) throw new Error('Shopify unavailable.');
    const body = await response.json();
    if (body.errors?.length || !body.data) throw new Error('Shopify rejected sync.');
    return body.data;
  }
  return async req => {
    const headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (req.method !== 'POST') return json({error:'Method not allowed.'},405,headers);
    const authorization = req.headers.get('Authorization') || '';
    if (!/^Bearer [\w.-]+$/.test(authorization)) return json({error:'Please sign in again.'},401,headers);
    try {
      const auth = await fetcher(env.SUPABASE_URL + '/auth/v1/user', {
        signal:AbortSignal.timeout(7000),
        headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:authorization}
      });
      const user = auth.ok ? await auth.json() : null;
      if (!user?.id || !UUID.test(user.id) || !user.email_confirmed_at || user.is_anonymous) return json({error:'Please sign in again.'},401,headers);
      const membership = await rest('rootx_admin_users?user_id=eq.' + user.id + '&select=user_id&limit=1');
      if (!Array.isArray(membership) || !membership.some(row=>row.user_id === user.id)) return json({error:'Admin access required.'},403,headers);
      if (env.ROOTX_SHOPIFY_PRODUCT_SYNC_ENABLED !== 'true' || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) return json({error:'Shopify product sync is not configured.'},503,headers);
      const raw = await req.text();
      if (raw.length > 1000) return json({error:'Invalid product.'},400,headers);
      let body;
      try { body = JSON.parse(raw); } catch { return json({error:'Invalid product.'},400,headers); }
      if (!body || Object.keys(body).some(k=>k !== 'slug') || typeof body.slug !== 'string' || body.slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) return json({error:'Invalid product.'},400,headers);
      const productPath = 'rootx_products?slug=eq.' + body.slug + '&select=slug,price,image_url&limit=2';
      const [products,mappings] = await Promise.all([
        rest(productPath),
        rest('rootx_shopify_variants?slug=eq.' + body.slug + '&select=product_id,variant_id&limit=2')
      ]);
      if (products.length !== 1 || mappings.length !== 1) return json({error:'Product is not connected to Shopify.'},409,headers);
      const expected = price(products[0].price);
      const productId = gid(mappings[0].product_id,'Product');
      const variantId = gid(mappings[0].variant_id,'ProductVariant');
      const context = await admin(SYNC_CONTEXT_QUERY,{variantId});
      if (context.shop?.myshopifyDomain !== SHOP || context.shop?.currencyCode !== 'INR' || context.productVariant?.id !== variantId || context.productVariant?.product?.id !== productId) return json({error:'Shopify catalogue connection does not match.'},409,headers);
      const changed = price(context.productVariant.price) !== expected;
      if (changed) {
        const result = (await admin(SYNC_PRICE_MUTATION,{productId,variants:[{id:variantId,price:expected}]})).productVariantsBulkUpdate;
        if (!result || result.userErrors?.length || result.productVariants?.length !== 1 || result.productVariants[0].id !== variantId || price(result.productVariants[0].price) !== expected) throw new Error('Price sync was not confirmed.');
      }
      const latest = await rest(productPath);
      if (latest.length !== 1 || price(latest[0].price) !== expected) return json({error:'Product changed during sync. Sync its latest price again.'},409,headers);
      return json({synced:true,changed,slug:body.slug,price:expected,currency:'INR',synced_fields:['price'],images:'unchanged'},200,headers);
    } catch {
      // Never return database errors, customer data, API credentials or Shopify responses.
      return json({error:'Could not sync product price. Please try again.'},503,headers);
    }
  };
}

