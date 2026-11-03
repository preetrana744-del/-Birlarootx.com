// Read-only probes: no signup, password reset, order creation or notification send.
import {siteStatus, holdMarker} from './site-status.mjs';
const timeout=()=>AbortSignal.timeout(15000);
async function text(url,needle){const response=await fetch(url,{cache:'no-store',signal:timeout()});if(!response.ok)throw Error(url+' HTTP '+response.status);const body=await response.text();if(!body.includes(needle))throw Error(url+' missing expected page content');}
if(siteStatus.unpublished){
 const routes=['/','/account.html','/product.html','/products/growth-factor/','/policies/support.html'];
 const results=await Promise.allSettled(routes.map(async route=>{
  const response=await fetch('https://birlarootx.com'+route,{cache:'no-store',signal:timeout()});
  if(response.status!==404)throw Error(route+' should be unpublished, received HTTP '+response.status);
 }));
 const errors=results.filter(r=>r.status==='rejected');
 for(const failure of errors)console.error(failure.reason.message);
 if(errors.length)process.exitCode=1;
 else console.log('5 live routes verified unavailable (HTTP 404): website intentionally unpublished.');
 process.exit(process.exitCode||0);
}
if(siteStatus.hold){
 const routes=['/','/account.html','/product.html','/products/growth-factor/','/policies/support.html'];
 const results=await Promise.allSettled(routes.map(async route=>{
  const url='https://birlarootx.com'+route;
  const response=await fetch(url,{cache:'no-store',signal:timeout()});
  if(!response.ok)throw Error(url+' HTTP '+response.status);
  const body=await response.text();
  if(!body.includes(holdMarker)||/<(?:script|form|iframe)\b/i.test(body))throw Error(url+' is not a passive holding page');
 }));
 const errors=results.filter(r=>r.status==='rejected');
 for(const failure of errors)console.error(failure.reason.message);
 if(errors.length)process.exitCode=1;
 else console.log('5 live maintenance routes verified. Storefront and backend are intentionally not exercised during hold.');
 process.exit(process.exitCode||0);
}
const probes=[
 text('https://birlarootx.com/','id="products-title"'),
 text('https://birlarootx.com/account.html','auth-form'),
 text('https://birlarootx.com/products/growth-factor/','Growth Factor | Birla RootX'),
 text('https://birlarootx.com/policies/support.html','Customer Support'),
 (async()=>{const r=await fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/functions/v1/rootx-shopify-checkout',{signal:timeout(),cache:'no-store'});if(!r.ok)throw Error('Checkout readiness HTTP '+r.status);if(typeof(await r.json()).enabled!=='boolean')throw Error('Invalid checkout readiness');})(),
 (async()=>{const r=await fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/rest/v1/rootx_products?select=slug,price,active&active=eq.true',{headers:{apikey:'sb_publishable_rS7URzLNbhXhdPp50Te_Qg_9LtpKOI_'},cache:'no-store',signal:timeout()});if(!r.ok)throw Error('Catalogue HTTP '+r.status);const rows=await r.json();if(!Array.isArray(rows)||rows.some(p=>!p.slug||!Number.isFinite(Number(p.price))||Number(p.price)<=0||p.active!==true))throw Error('Invalid catalogue response');})()
];
const results=await Promise.allSettled(probes);const errors=results.filter(r=>r.status==='rejected');for(const failure of errors)console.error(failure.reason.message);if(errors.length)process.exitCode=1;else console.log('6 live read-only health probes passed. Checkout disabled is an allowed pre-launch state; SMTP and inbox delivery are not covered.');
