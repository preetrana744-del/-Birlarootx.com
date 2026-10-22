// Server-only GitHub Actions entrypoint. Never print the worker credential.
const secret=process.env.ROOTX_NOTIFICATION_WORKER_SECRET;
if(process.env.ROOTX_NOTIFICATION_READY!=='true'||!secret){console.log('Notification schedule paused: activation flag/worker credential is missing.');process.exit(0);}
const response=await fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/functions/v1/rootx-order-notifications',{method:'POST',headers:{'x-rootx-worker-secret':secret,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(160000)});
if(!response.ok)throw Error('Notification worker HTTP '+response.status+'; inspect server configuration.');
const result=await response.json();
if(!result.configured)throw Error('Notification sender is not configured.');
console.log('Provider accepted: '+Number(result.sent||0)+'; unsuccessful attempts: '+Number(result.failed||0)+'. Acceptance does not prove delivery.');
if(result.failed)throw Error('Queued notifications need review; automatic retry/backoff remains in effect.');
