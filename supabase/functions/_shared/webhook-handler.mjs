import {SHOP, verifySignature, normalizeOrder, sha256, json} from './commerce.mjs';
const TOPICS = ['orders/create','orders/updated','orders/paid','orders/cancelled','orders/fulfilled'];
export function createWebhookHandler(env, fetcher=fetch) {
  return async req => {
    if (req.method !== 'POST') return json({error:'Method not allowed.'},405);
    if (!env.SHOPIFY_WEBHOOK_SECRET) return json({error:'Webhook is not configured.'},503);
    if (req.headers.get('X-Shopify-Shop-Domain') !== SHOP) return json({error:'Invalid source.'},401);
    if (Number(req.headers.get('Content-Length') || 0) > 1000000) return json({error:'Payload too large.'},413);
    try {
      const bytes = await req.arrayBuffer();
      if (bytes.byteLength > 1000000) return json({error:'Payload too large.'},413);
      if (!await verifySignature(bytes,req.headers.get('X-Shopify-Hmac-Sha256'),env.SHOPIFY_WEBHOOK_SECRET)) return json({error:'Invalid signature.'},401);
      const topic = req.headers.get('X-Shopify-Topic');
      if (!TOPICS.includes(topic)) return json({ignored:true});
      const eventId = req.headers.get('X-Shopify-Event-Id') || req.headers.get('X-Shopify-Webhook-Id');
      const payload = normalizeOrder(JSON.parse(new TextDecoder().decode(bytes)),eventId);
      if (!payload) return json({ignored:true});
      payload.token_hash = await sha256(payload.proof);
      delete payload.proof;
      const key = env.SUPABASE_SERVICE_ROLE_KEY;
      const response = await fetcher(env.SUPABASE_URL+'/rest/v1/rpc/rootx_ingest_shopify_order',{method:'POST',signal:AbortSignal.timeout(3500),headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({payload})});
      if (!response.ok) throw new Error('Order sync unavailable.');
      const result = await response.json();
      // Only acknowledge after the transaction commits, so failed deliveries can retry.
      return json({received:true,...result});
    } catch {
      // Do not acknowledge a failed import. Do not echo customer data or database errors.
      return json({error:'Order sync could not complete.'},503);
    }
  };
}
