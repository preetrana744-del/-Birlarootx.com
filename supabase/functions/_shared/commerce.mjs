// Shared, dependency-free commerce helpers. No credentials or request bodies are logged.
export const SHOP = 'vbvfdy-ed.myshopify.com';
export const API_VERSION = '2026-10';
export const VARIANTS_QUERY = `query RootxVariants($ids: [ID!]!) { nodes(ids: $ids) { ... on ProductVariant { id availableForSale price { amount currencyCode } } } }`;
export const CART_MUTATION = `mutation RootxCartCreate($input: CartInput!) { cartCreate(input: $input) { cart { id checkoutUrl lines(first: 20) { nodes { quantity merchandise { ... on ProductVariant { id price { amount currencyCode } } } } } } userErrors { field message code } warnings { code message } } }`;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function cartItems(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new Error('Invalid cart.');
  const items = new Map();
  for (const item of value) {
    if (!item || typeof item.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || item.slug.length > 100 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Invalid cart.');
    items.set(item.slug, (items.get(item.slug) || 0) + item.quantity);
    if (items.get(item.slug) > 99) throw new Error('Maximum quantity per product is 99.');
  }
  return [...items].sort(([a], [b]) => a.localeCompare(b)).map(([slug, quantity]) => ({slug, quantity}));
}
export function safeCheckoutUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && [SHOP, 'checkout.shopify.com'].includes(u.hostname) && !u.username && !u.password && !u.port; } catch { return false; }
}
export async function sha256(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
export function randomProof() { return [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function verifySignature(bytes, signature, secret) {
  if (!secret || !/^[A-Za-z0-9+/]{43}=$/.test(signature || '')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(signature), c => c.charCodeAt(0)), bytes);
}
export function variantId(value) {
  const id = String(value || '').replace(/^gid:\/\/shopify\/ProductVariant\//, '');
  if (!/^[1-9][0-9]{0,19}$/.test(id)) throw new Error('Invalid variant.');
  return id;
}
export function verifyPrices(items, products, mappings, variants) {
  const proof = [];
  for (const item of items) {
    const p = products.find(p => p.slug === item.slug && p.active);
    const mapping = mappings.find(m => m.slug === item.slug);
    const id = mapping && variantId(mapping.variant_id);
    const v = id && variants.find(v => v?.id === 'gid://shopify/ProductVariant/' + id);
    if (!p || !v || !v.availableForSale) throw new Error('A product is currently unavailable. Please update your cart.');
    if (v.price?.currencyCode !== 'INR' || !Number.isFinite(Number(v.price.amount)) || Math.round(Number(v.price.amount)*100) !== Math.round(Number(p.price)*100)) throw new Error('A product price is being updated. Please try again shortly.');
    proof.push({variant_id:id,quantity:item.quantity});
  }
  return proof.sort((a,b) => a.variant_id.localeCompare(b.variant_id));
}
export function verifyCreatedCart(cart, proof, variants) {
  if (!cart?.id || !safeCheckoutUrl(cart.checkoutUrl)) throw new Error('Could not start secure checkout.');
  const actual = (cart.lines?.nodes || []).map(l => ({variant_id:variantId(l.merchandise?.id), quantity:l.quantity})).sort((a,b) => a.variant_id.localeCompare(b.variant_id));
  if (JSON.stringify(actual) !== JSON.stringify(proof)) throw new Error('Cart availability changed. Please try again.');
  // Recheck the returned cart, since a merchant can change a price between calls.
  for (const line of cart.lines.nodes) {
    const before = variants?.find(v => v?.id === line.merchandise?.id)?.price;
    const after = line.merchandise?.price;
    if (!before || !after || after.currencyCode !== 'INR' || before.currencyCode !== after.currencyCode || Math.round(Number(before.amount)*100) !== Math.round(Number(after.amount)*100)) throw new Error('A product price is being updated. Please try again shortly.');
  }
}
function money(value) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Missing order amount.');
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1000000) throw new Error('Invalid order amount.');
  return Math.round(n * 100) / 100;
}
export function normalizeOrder(order, eventId) {
  if (!order || !/^[1-9][0-9]{0,19}$/.test(String(order.id)) || !UUID.test(eventId || '')) throw new Error('Invalid order event.');
  const attrs = Array.isArray(order.note_attributes) ? order.note_attributes : [];
  const proof = attrs.find(a => a.name === 'rootx_checkout')?.value;
  // Unrelated Shopify orders are deliberately excluded from the website account database.
  if (typeof proof !== 'string' || !/^[a-f0-9]{64}$/.test(proof)) return null;
  const a = order.shipping_address || {};
  const phone = String(a.phone || order.phone || '').replace(/[ ()-]/g, '');
  const address = [a.address1,a.address2,a.city,a.province,a.zip,a.country].filter(Boolean).join(', ');
  const name = String(a.name || [a.first_name,a.last_name].filter(Boolean).join(' '));
  if (name.trim().length < 2 || name.length > 120 || (phone && !/^\+?[0-9]{7,15}$/.test(phone)) || address.length < 10 || address.length > 1000) throw new Error('Order shipping details are incomplete.');
  if (order.currency !== 'INR' || !Number.isFinite(Date.parse(order.updated_at))) throw new Error('Unsupported order.');
  if (!Array.isArray(order.line_items) || !order.line_items.length || order.line_items.length > 20) throw new Error('Invalid order items.');
  const fulfillments = (order.fulfillments || []).filter(f => f.status === 'success').sort((a,b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at));
  const f = fulfillments[0] || {};
  return {
    event_id:eventId, shopify_order_id:String(order.id), order_number:String(order.name || order.order_number || order.id).slice(0,100),
    proof, cart_token:String(order.cart_token || ''), updated_at:order.updated_at,
    payment_status:order.financial_status, cancelled:Boolean(order.cancelled_at), fulfillment_status:order.fulfillment_status || 'unfulfilled',
    shipping_name:name.trim(), shipping_phone:phone, shipping_address:address,
    subtotal:money(order.subtotal_price), total:money(order.total_price), currency:order.currency,
    courier:String(f.tracking_company || '').slice(0,100), tracking_number:String(f.tracking_number || '').slice(0,100),
    items:order.line_items.map(i => ({variant_id:variantId(i.variant_id),quantity:i.quantity,name:String(i.name || i.title || '').slice(0,120),unit_price:money(i.price)}))
  };
}
export function json(data, status=200, headers={}) { return new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}}); }
export function cors(req) {
  const origin = req.headers.get('Origin');
  return origin && ['https://birlarootx.com','https://www.birlarootx.com'].includes(origin) ? {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS'} : {};
}
