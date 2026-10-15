import {createWebhookHandler} from '../_shared/webhook-handler.mjs';
// Shopify sends its own HMAC signature, not a Supabase JWT.
Deno.serve(createWebhookHandler(Deno.env.toObject()));
