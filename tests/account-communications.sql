begin;
do $$
declare
 a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); manager uuid:=gen_random_uuid();
 request_id uuid:=gen_random_uuid(); receipt jsonb; first_id uuid; n integer; old_price numeric; product_slug_key text;
 payload jsonb; other_receipt jsonb;
begin
 insert into auth.users(id,aud,role,email,email_confirmed_at,raw_user_meta_data) values
 (a,'authenticated','authenticated','rootx-fixture-a-'||a||'@example.invalid',now(),'{"app":"birlarootx","full_name":"Controlled Customer A"}'),
 (b,'authenticated','authenticated','rootx-fixture-b-'||b||'@example.invalid',now(),'{"app":"birlarootx","full_name":"Controlled Customer B"}'),
 (manager,'authenticated','authenticated','rootx-fixture-admin-'||manager||'@example.invalid',now(),'{"app":"birlarootx","full_name":"Controlled Admin"}');
 insert into public.rootx_admin_users(user_id) values(manager);
 select p.slug,p.price into product_slug_key,old_price from public.rootx_products p where active order by p.slug limit 1;
 payload:=jsonb_build_object('client_request_id',request_id,'shipping_name','Controlled Customer A','shipping_phone','+919876543210','shipping_address','Test House, Test Street, Test Locality, New Delhi, Delhi – 110030, India','shipping_city','New Delhi','shipping_state','Delhi','shipping_pin','110030','items',jsonb_build_array(jsonb_build_object('slug',product_slug_key,'quantity',1)));
 perform set_config('request.jwt.claim.sub',a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 set local role authenticated;
 receipt:=public.rootx_place_order(payload);first_id:=(receipt->>'id')::uuid;
 if (select count(*) from public.rootx_orders)<>1 then raise exception 'Customer A order visibility failed';end if;
 if (select count(*) from public.rootx_profiles where id=a)<>1 then raise exception 'Profile association failed';end if;
 if exists(select 1 from public.rootx_admin_users) then raise exception 'Customer saw admin controls';end if;
 update public.rootx_products set price=price+1 where rootx_products.slug=product_slug_key;
 get diagnostics n=row_count;if n<>0 then raise exception 'Customer changed product';end if;
 update public.rootx_orders set status='shipped' where id=first_id;
 get diagnostics n=row_count;if n<>0 then raise exception 'Customer changed status';end if;
 begin
  insert into public.rootx_admin_users(user_id)values(a);
  raise exception 'Customer could promote itself';
 exception when insufficient_privilege then null;end;
 begin
  perform public.rootx_place_order(payload||'{"shipping_pin":"000000"}'::jsonb);
  raise exception 'Invalid PIN accepted';
 exception when invalid_parameter_value then null;end;
 if (public.rootx_place_order(payload)->>'id')::uuid<>first_id then raise exception 'Retry duplicated request';end if;
 reset role;
 if (select count(*) from public.rootx_notification_outbox where order_id=first_id)<>2 then raise exception 'Acknowledgement/admin notification queue failed';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 set local role authenticated;
 if exists(select 1 from public.rootx_orders where id=first_id) then raise exception 'Cross-customer order leak';end if;
 if exists(select 1 from public.rootx_order_items where order_id=first_id) then raise exception 'Cross-customer item leak';end if;
 if exists(select 1 from public.rootx_order_events where order_id=first_id) then raise exception 'Cross-customer history leak';end if;
 other_receipt:=public.rootx_place_order(payload||jsonb_build_object('client_request_id',gen_random_uuid(),'shipping_name','Controlled Customer B'));
 if (select count(*) from public.rootx_orders)<>1 then raise exception 'Customer B own history failed';end if;
 reset role;
 perform set_config('request.jwt.claim.sub',manager::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',manager,'role','authenticated')::text,true);
 set local role authenticated;
 if not exists(select 1 from public.rootx_admin_users where user_id=manager) then raise exception 'Authorized admin lookup failed';end if;
 update public.rootx_products set price=old_price+1,image_url='https://example.invalid/controlled-photo.jpg' where rootx_products.slug=product_slug_key;
 get diagnostics n=row_count;if n<>1 then raise exception 'Admin product save failed';end if;
 if not exists(select 1 from public.rootx_products p where p.slug=product_slug_key and p.price=old_price+1 and p.image_url='https://example.invalid/controlled-photo.jpg') then raise exception 'Admin product readback failed';end if;
 update public.rootx_orders set status='shipped',courier='Controlled Carrier',tracking_number='CONTROLLED-ONLY',admin_note='Dispatched. This is not a payment receipt.' where id=first_id;
 get diagnostics n=row_count;if n<>1 then raise exception 'Admin status save failed';end if;
 reset role;
 if (select count(*) from public.rootx_notification_outbox where order_id=first_id)<>3 then raise exception 'Status notification queue failed';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 set local role authenticated;
 if not exists(select 1 from public.rootx_order_events where order_id=first_id and status='shipped' and note='Dispatched. This is not a payment receipt.') then raise exception 'Customer-visible history failed';end if;
 begin
  perform public.rootx_claim_notifications(a);
  raise exception 'Customer can invoke service-only notification claim';
 exception when insufficient_privilege then null;end;
 reset role;
 if (select count(*) from public.rootx_claim_notifications(a))<>3 then raise exception 'Notification lease failed';end if;
 if (select count(*) from public.rootx_claim_notifications(a))<>0 then raise exception 'Notification lease allowed duplicate claim';end if;
end;$$;
rollback;
select 'PASS: two isolated customers, authorized admin, own profiles/orders/items/history, denied customer writes, admin photo/price/status readback, PIN rejection, idempotent order retry, notification queue and exclusive leasing. All synthetic data rolled back.' as result;
