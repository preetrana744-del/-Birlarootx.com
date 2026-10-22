import {notificationMessage} from './notification-templates.mjs';
export async function secretMatches(given,expected){
 if(typeof expected!=='string'||expected.length<32||typeof given!=='string'||given.length>512)return false;
 const digest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const [a,b]=await Promise.all([digest(given),digest(expected)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export function createNotificationHandler({db,env,fetcher=fetch,now=()=>new Date()}){
 const origin='https://birlarootx.com';
 return async req=>{
  const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'Origin denied'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
  const workerHeader=req.headers.get('x-rootx-worker-secret');
  const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');
  if(!token&&!workerHeader)return reply(401,{error:'Sign in required'});
  try{
   let actor,adminResult;
   if(workerHeader){
    if(req.headers.get('origin'))return reply(403,{error:'Worker calls must be server-side'});
    if(!await secretMatches(workerHeader,env('ROOTX_NOTIFICATION_WORKER_SECRET')))return reply(401,{error:'Worker authentication failed'});
    actor=env('ROOTX_NOTIFICATION_ADMIN_ID');
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor||''))return reply(503,{error:'Worker administrator is not configured'});
    adminResult=await db.from('rootx_admin_users').select('user_id').eq('user_id',actor).maybeSingle();
    if(adminResult.error||!adminResult.data)return reply(403,{error:'Worker administrator is not authorized'});
   }else{
    const auth=await db.auth.getUser(token);
    if(auth.error||!auth.data.user||!auth.data.user.email_confirmed_at||auth.data.user.is_anonymous)return reply(401,{error:'Verified sign-in required'});
    actor=auth.data.user.id;
    adminResult=await db.from('rootx_admin_users').select('user_id').eq('user_id',actor).maybeSingle();
    if(adminResult.error)return reply(503,{error:'Account role could not be verified'});
   }
   const apiKey=env('RESEND_API_KEY'),from=env('ROOTX_FROM_EMAIL');
   const configured=Boolean(apiKey&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from||''));
   if(!configured)return reply(200,{configured:false,sent:0,pending:true});
   const claimed=await db.rpc('rootx_claim_notifications',{actor_id:actor});
   if(claimed.error)return reply(503,{error:'Notification queue unavailable'});
   let sent=0,failed=0;
   for(const job of claimed.data||[]){
    const to=job.kind==='request_admin'?(env('ROOTX_ADMIN_EMAIL')||'rootx1212@gmail.com'):job.snapshot.customer_email;
    let accepted=false,providerId=null,errorCode=null,terminal=false;
    if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(to||'')){errorCode='invalid_recipient';terminal=true;}
    else try{
     const message=notificationMessage(job.kind,job.snapshot);
     const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':'rootx-notification/'+job.id},body:JSON.stringify({from,to:[to],reply_to:'rootx1212@gmail.com',...message}),signal:AbortSignal.timeout(12000)});
     if(response.ok){const result=await response.json();if(result.id){accepted=true;providerId=result.id;}else errorCode='provider_missing_id';}
     else {errorCode='provider_http_'+response.status;terminal=response.status>=400&&response.status<500&&![408,409,429].includes(response.status);}
    }catch{errorCode='provider_timeout_or_network';}
    const status=accepted?'accepted':terminal||job.attempts>=5?'failed':'pending';
    const patch={status,provider_message_id:providerId,last_error:errorCode,lease_until:null,accepted_at:accepted?now().toISOString():null,available_at:new Date(now().getTime()+Math.min(60,2**job.attempts)*60000).toISOString()};
    const saved=await db.from('rootx_notification_outbox').update(patch).eq('id',job.id).eq('claim_token',job.claim_token).select('id');
    if(accepted&&saved.data?.length&&!saved.error)sent++;else failed++;
   }
   return reply(200,{configured:true,sent,failed,provider_acceptance_only:true,admin:Boolean(adminResult.data)});
  }catch{return reply(503,{error:'Notification processing unavailable; order records are saved'});}
 };
}

