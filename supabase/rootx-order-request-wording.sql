CREATE OR REPLACE FUNCTION rootx_private.log_order_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    insert into public.rootx_order_events(order_id,status,note)
      values (new.id,new.status,case when new.source='request' then 'Order request received. No online payment has been collected by this request flow. The team will confirm acceptance and delivery.' else 'Shopify order received. Refer to the recorded payment status.' end);
  elsif (new.status,new.expected_delivery_date,new.tracking_number,new.courier,new.admin_note)
    is distinct from (old.status,old.expected_delivery_date,old.tracking_number,old.courier,old.admin_note) then
    insert into public.rootx_order_events(order_id,status,note)
      values (new.id,new.status,coalesce(nullif(btrim(new.admin_note),''),'Delivery details updated.'));
  end if;
  return new;
end;
$function$;
