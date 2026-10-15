import {createCheckoutHandler} from '../_shared/checkout-handler.mjs';
// Public GET health/readiness; POST verifies the Supabase identity before privileged work.
Deno.serve(createCheckoutHandler(Deno.env.toObject()));
