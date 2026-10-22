// Read-only probes: no signup, password reset, order creation or notification send.
const timeout=()=>AbortSignal.timeout(15000);
async function text(url,needle){const response=await fetch(url,{cache:'no-store',signal:timeout()});if(!response.ok)throw Error(url+' HTTP '+response.status);const body=await response.text();if(!body.includes(needle))throw Error(url+' missing expected page content');}
const probes=[
 text('https://birlarootx.com/','id="products-title"'),
 text('https://birlarootx.com/account.html','auth-form'),
 text('https://birlarootx.com/products/growth-factor/','Growth Factor | Birla RootX'),
 text('https://birlarootx.com/policies/support.html','Customer Support'),
 (async()=>{const r=await fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/functions/v1/rootx-shopify-checkout',{signal:timeout(),cache:'no-store'});if(!r.ok)throw Error('Checkout readiness HTTP '+r.status);if(typeof(await r.json()).enabled!=='boolean')throw Error('Invalid checkout readiness');})(),
 (async()=>{const r=await fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/rest/v1/rootx_products?select=slug,price,active&active=eq.true',{headers:{apikey:'sb_publishable_rS7URzLNbhXhdPp50Te_Qg_9LtpKOI_'},cache:'no-store',signal:timeout()});if(!r.ok)throw Error('Catalogue HTTP '+r.status);const rows=await r.json();if(!Array.isArray(rows)||rows.some(p=>!p.slug||!Number.isFinite(Number(p.price))||Number(p.price)<=0||p.active!==true))throw Error('Invalid catalogue response');})()
];
const results=await Promise.allSettled(probes);const errors=results.filter(r=>r.status==='rejected');for(const failure of errors)console.error(failure.reason.message);if(errors.length)process.exitCode=1;else console.log('6 live read-only health probes passed. Checkout disabled is an allowed pre-launch state; SMTP and inbox delivery are not covered.');
