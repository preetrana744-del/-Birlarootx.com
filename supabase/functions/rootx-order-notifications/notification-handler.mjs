import {notificationMessage} from './notification-templates.mjs';
export function createNotificationHandler({db,env,fetcher=fetch,now=()=>new Date()}){
 const origin='https://birlarootx.com';
 return async req=>{
  const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'Origin denied'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
  const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');
  if(!token)return reply(401,{error:'Sign in required'});
  try{
   const auth=await db.auth.getUser(token);
   if(auth.error||!auth.data.user||!auth.data.user.email_confirmed_at||auth.data.user.is_anonymous)return reply(401,{error:'Verified sign-in required'});
   const actor=auth.data.user.id;
   const adminResult=await db.from('rootx_admin_users').select('user_id').eq('user_id',actor).maybeSingle();
   if(adminResult.error)return reply(503,{error:'Account role could not be verified'});
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
