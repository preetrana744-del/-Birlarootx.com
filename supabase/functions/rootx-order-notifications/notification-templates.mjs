export function notificationMessage(kind,snapshot){
  const ref=String(snapshot.order_number||'your request');
  const account='https://birlarootx.com/account.html';
  const footer='For help, reply to this email or contact rootx1212@gmail.com. Never send passwords, OTPs or card details.';
  if(kind==='request_customer')return {subject:`Birla RootX: request ${ref} received`,text:`We have received your order request ${ref}.\n\nThis is an acknowledgement of a request, not a payment receipt or confirmation of order acceptance. No online payment was collected by this request flow. Stock, shipping charges, the invoice seller and final total still require confirmation.\n\nView updates: ${account}\n\n${footer}`};
  if(kind==='request_admin')return {subject:`New RootX order request: ${ref}`,text:`New order request ${ref} is waiting for review.\n\nRequest received does not mean payment received. Confirm stock, serviceability, delivery charges, invoice seller and the final total with the customer. Do not mark payment as received without verification.\n\nReview securely: ${account}\n\n${footer}`};
  let intro=`There is an update to request ${ref}. Current status: ${String(snapshot.status||'received').replaceAll('_',' ')}.`;
  if(snapshot.status==='shipped')intro=`Request ${ref} has been marked dispatched by the RootX team.`;
  if(snapshot.status==='cancelled')intro=`Request ${ref} has been marked cancelled. This message does not confirm that a refund has been processed. If any payment was collected, support must confirm its refund status separately.`;
  const details=[snapshot.expected_delivery_date?`Estimated delivery: ${snapshot.expected_delivery_date} (estimate, not a guarantee).`:'',snapshot.courier?`Courier: ${snapshot.courier}`:'',snapshot.tracking_number?`Tracking reference: ${snapshot.tracking_number}`:'',snapshot.note?`Team update: ${snapshot.note}`:''].filter(Boolean).join('\n');
  return {subject:`Birla RootX update: ${ref}`,text:`${intro}\n\n${details}\n\nA status update is not proof of payment. View your history: ${account}\n\n${footer}`};
}
