-- Integration regression fixture. Run after integration-schema.sql as postgres.
-- It creates only synthetic fixtures inside a transaction and always rolls back.
-- The final ROLLBACK is intentional; an assertion failure must also be rolled back.
begin;
do $$
declare
  v_user uuid := gen_random_uuid();
  v_rate_user uuid := gen_random_uuid();
  v_request uuid := gen_random_uuid();
  v_proof uuid := gen_random_uuid();
  v_order uuid;
  v_result jsonb;
  v_payload jsonb;
  v_bad jsonb;
  v_count integer;
  v_reservation jsonb;
  v_first_reservation jsonb;
  v_reserved_id uuid;
  i integer;
  v_row public.rootx_orders%rowtype;
begin
  assert not has_table_privilege('anon','public.rootx_shopify_checkouts','select'),
    'anonymous callers can read checkout proofs';
  assert not has_table_privilege('authenticated','public.rootx_shopify_checkouts','select'),
    'customers can read checkout proofs';
  assert not has_table_privilege('authenticated','public.rootx_shopify_variants','insert'),
    'customers can replace commerce mappings';
  assert not has_function_privilege('anon','public.rootx_ingest_shopify_order(jsonb)','execute'),
    'anonymous callers can import orders';
  assert not has_function_privilege('authenticated','public.rootx_ingest_shopify_order(jsonb)','execute'),
    'customers can import orders';
  assert has_function_privilege('service_role','public.rootx_ingest_shopify_order(jsonb)','execute'),
    'service cannot import orders';
  assert not has_function_privilege('anon','public.rootx_reserve_shopify_checkout(jsonb)','execute')
    and not has_function_privilege('authenticated','public.rootx_reserve_shopify_checkout(jsonb)','execute'),
    'browser caller can reserve checkouts';
  assert has_function_privilege('service_role','public.rootx_reserve_shopify_checkout(jsonb)','execute'),
    'service cannot reserve checkouts';
  assert (select bool_and(relrowsecurity) from pg_class
    where oid in ('public.rootx_shopify_checkouts'::regclass,
      'public.rootx_shopify_variants'::regclass,'public.rootx_shopify_webhook_events'::regclass)),
    'integration table without RLS';

  insert into auth.users(id,raw_app_meta_data,raw_user_meta_data)
    values (v_user,'{}'::jsonb,'{}'::jsonb);
  insert into public.rootx_products(slug,name,price,image_url)
    values ('rootx-shopify-schema-fixture','Schema fixture',100,'https://example.invalid/fixture.jpg');
  insert into public.rootx_shopify_variants(slug,product_id,variant_id)
    values ('rootx-shopify-schema-fixture','gid://shopify/Product/9999999999999998',
      'gid://shopify/ProductVariant/9999999999999998');
  insert into public.rootx_shopify_checkouts(id,user_id,client_request_id,items,cart_id,
    checkout_url,link_token_hash)
    values (v_proof,v_user,v_request,
      '[{"variant_id":"gid://shopify/ProductVariant/9999999999999998","quantity":2}]',
      'gid://shopify/Cart/ROOTX-SCHEMA-FIXTURE?key=not-a-real-secret',
      'https://example.invalid/checkout',repeat('a',64));
  v_payload := jsonb_build_object('event_id','rootx-schema-create',
    'shopify_order_id','9999999999999990','order_number','#FIXTURE',
    'token_hash',repeat('a',64),'cart_token','ROOTX-SCHEMA-FIXTURE',
    'updated_at','2026-01-01T10:00:00Z','payment_status','pending',
    'cancelled',false,'fulfillment_status',null,'shipping_name','TEST CUSTOMER',
    'shipping_phone','9991234567','shipping_address','TEST ONLY ADDRESS, DO NOT SHIP',
    'subtotal',200,'total',220,'currency','INR','courier','TEST COURIER',
    'tracking_number','FIXTURE-TRACKING','items',jsonb_build_array(jsonb_build_object(
      'variant_id','9999999999999998','quantity',2,'name','Fixture snapshot','unit_price',100)));

  -- Anonymous/unlinked Shopify orders must never be attached using email.
  v_bad := v_payload || jsonb_build_object('event_id','rootx-schema-unlinked','token_hash',null,
    'email','never-used@example.invalid');
  v_result := public.rootx_ingest_shopify_order(v_bad);
  assert v_result->>'ignored'='true','missing proof imported an order';
  v_bad := v_payload || jsonb_build_object('event_id','rootx-schema-cart-mismatch','cart_token','DIFFERENT-CART');
  v_result := public.rootx_ingest_shopify_order(v_bad);
  assert v_result->>'ignored'='true','proof accepted for a different cart';

  -- An invalid import must not consume a proof or commit a deduplication receipt.
  v_bad := v_payload || jsonb_build_object('event_id','rootx-schema-items-mismatch',
    'items',jsonb_build_array(jsonb_build_object('variant_id','9999999999999998',
      'quantity',1,'name','Fixture snapshot','unit_price',100)));
  begin
    perform public.rootx_ingest_shopify_order(v_bad);
    raise exception 'quantity mismatch accepted';
  exception when sqlstate '22023' then null;
  end;
  assert not exists (select 1 from public.rootx_shopify_webhook_events
    where event_id='rootx-schema-items-mismatch'),'failed import retained event receipt';
  assert (select consumed_order_id is null from public.rootx_shopify_checkouts where id=v_proof),
    'failed import consumed proof';

  v_result := public.rootx_ingest_shopify_order(v_payload);
  v_order := (v_result->>'order_id')::uuid;
  assert v_result->>'created'='true','first order was not created';
  select * into v_row from public.rootx_orders where id=v_order;
  assert v_row.customer_id=v_user and v_row.source='shopify','wrong order owner/source';
  assert v_row.payment_status='pending' and v_row.status='received','pending import state incorrect';
  assert v_row.total=220 and v_row.subtotal=200 and v_row.currency='INR','order totals incorrect';
  assert v_row.client_request_id=v_request,'lost checkout request identity';
  assert v_row.checkout_payload->>'token_hash' is null,'order snapshot leaked proof digest';
  assert (select count(*)=1 and sum(quantity)=2 from public.rootx_order_items where order_id=v_order),
    'line snapshots incorrect';
  assert (select consumed_order_id='9999999999999990'
    from public.rootx_shopify_checkouts where id=v_proof),'proof not consumed';

  v_result := public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
    'event_id','rootx-schema-same-time-paid','payment_status','paid','total',999,
    'shipping_name','SAME SECOND CONFLICT'));
  select * into v_row from public.rootx_orders where id=v_order;
  assert v_result->>'reconciled'='true' and v_row.payment_status='paid'
    and v_row.status='confirmed','same-time pending to paid was lost';
  assert v_row.total=220 and v_row.shipping_name='TEST CUSTOMER',
    'same-time reconciliation replaced totals or shipping snapshot';
  v_result := public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
    'event_id','rootx-schema-same-time-pending'));
  assert v_result->>'stale'='true','same-time late pending did not become stale';
  assert (select payment_status='paid' from public.rootx_orders where id=v_order),
    'same-time late pending regressed paid state';
  v_payload := v_payload || jsonb_build_object('payment_status','paid');

  v_result := public.rootx_ingest_shopify_order(v_payload);
  assert v_result->>'duplicate'='true','event replay not idempotent';
  assert (select count(*)=1 from public.rootx_orders where shopify_order_id='9999999999999990'),
    'duplicate order after replay';

  v_result := public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
    'event_id','rootx-schema-old','updated_at','2026-01-01T09:00:00Z','payment_status','pending'));
  assert v_result->>'stale'='true','older event overwrote newer payment';
  assert (select payment_status='paid' from public.rootx_orders where id=v_order),
    'payment regressed after older event';

  -- A proof cannot be reused to attach another order to the same customer.
  begin
    perform public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
      'event_id','rootx-schema-proof-reuse','shopify_order_id','9999999999999991'));
    raise exception 'proof reused across orders';
  exception when sqlstate '22023' then null;
  end;
  assert not exists (select 1 from public.rootx_shopify_webhook_events
    where event_id='rootx-schema-proof-reuse'),'proof rejection committed receipt';

  -- Shopify fulfillment means shipped; delivery remains an admin decision.
  v_result := public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
    'event_id','rootx-schema-fulfilled','updated_at','2026-01-01T11:00:00Z',
    'fulfillment_status','fulfilled'));
  assert (select status='shipped' from public.rootx_orders where id=v_order),
    'fulfilled incorrectly mapped to delivered';
  update public.rootx_orders set status='delivered',admin_note='Synthetic delivery fixture'
    where id=v_order;
  update public.rootx_products set image_url='https://example.invalid/new-catalog-photo.jpg'
    where slug='rootx-shopify-schema-fixture';
  v_result := public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
    'event_id','rootx-schema-refund','updated_at','2026-01-01T12:00:00Z',
    'payment_status','refunded','tracking_number','','courier',''));
  select * into v_row from public.rootx_orders where id=v_order;
  assert v_row.payment_status='refunded' and v_row.status='delivered',
    'refund lost payment/delivery state';
  assert v_row.tracking_number='FIXTURE-TRACKING' and v_row.courier='TEST COURIER',
    'blank webhook erased admin tracking';
  assert (select image_url='https://example.invalid/fixture.jpg'
    from public.rootx_order_items where order_id=v_order),
    'payment update replaced the original order photo';

  -- Previously linked orders remain updateable after the checkout link expires.
  update public.rootx_shopify_checkouts set created_at=now()-interval '10 days',
    expires_at=now()-interval '1 day' where id=v_proof;
  v_result := public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
    'event_id','rootx-schema-cancel','updated_at','2026-01-01T13:00:00Z',
    'payment_status','refunded','cancelled',true));
  assert (select status='cancelled' from public.rootx_orders where id=v_order),
    'linked order stopped updating after proof expiry';

  -- Unknown variants must not be silently omitted from a customer's order.
  begin
    perform public.rootx_ingest_shopify_order(v_payload || jsonb_build_object(
      'event_id','rootx-schema-unknown-variant','updated_at','2026-01-01T14:00:00Z',
      'items',jsonb_build_array(jsonb_build_object('variant_id','9999999999999997',
        'quantity',2,'name','Unknown','unit_price',100))));
    raise exception 'unknown variant accepted';
  exception when sqlstate '22023' then null;
  end;
  assert not exists (select 1 from public.rootx_shopify_webhook_events
    where event_id='rootx-schema-unknown-variant'),'unknown variant committed receipt';
  assert (select count(*)=1 from public.rootx_order_items where order_id=v_order),
    'invalid update deleted existing order items';
  -- Fully discounted physical orders can have no customer phone in Shopify.
  insert into public.rootx_shopify_checkouts(user_id,client_request_id,items,cart_id,link_token_hash)
    values (v_user,gen_random_uuid(),
      '[{"variant_id":"9999999999999998","quantity":2}]',
      'gid://shopify/Cart/ROOTX-FREE-FIXTURE?key=not-a-real-secret',repeat('d',64));
  v_bad := v_payload || jsonb_build_object('event_id','rootx-schema-free',
    'shopify_order_id','9999999999999992','order_number','#FREE-FIXTURE',
    'token_hash',repeat('d',64),'cart_token','ROOTX-FREE-FIXTURE',
    'shipping_phone','','subtotal',0,'total',0,'items',jsonb_build_array(jsonb_build_object(
      'variant_id','9999999999999998','quantity',2,'name','Free fixture','unit_price',0)));
  v_result := public.rootx_ingest_shopify_order(v_bad);
  assert v_result->>'created'='true','free order without phone was rejected';
  assert (select subtotal=0 and total=0 and shipping_phone=''
    from public.rootx_orders where shopify_order_id='9999999999999992'),
    'free order data was fabricated';
  begin
    perform public.rootx_ingest_shopify_order(v_bad || jsonb_build_object(
      'event_id','rootx-schema-invalid-phone','updated_at','2026-01-01T15:00:00Z',
      'shipping_phone','invalid-phone'));
    raise exception 'malformed nonempty phone accepted';
  exception when sqlstate '22023' then null;
  end;
  assert not exists (select 1 from public.rootx_shopify_webhook_events
    where event_id='rootx-schema-invalid-phone'),'invalid phone committed receipt';

  -- A separate synthetic customer exercises the atomic per-hour allowance.
  insert into auth.users(id,raw_app_meta_data,raw_user_meta_data)
    values (v_rate_user,'{}'::jsonb,'{}'::jsonb);
  for i in 1..10 loop
    v_reservation := jsonb_build_object('id',gen_random_uuid(),'user_id',v_rate_user,
      'client_request_id',gen_random_uuid(),'items',jsonb_build_array(jsonb_build_object(
        'variant_id','9999999999999998','quantity',2)),
      'link_token_hash',lpad(i::text,64,'0'),'expires_at',now()+interval '6 days');
    v_result := public.rootx_reserve_shopify_checkout(v_reservation);
    assert v_result->>'created'='true','new reservation not created';
    if i=1 then
      v_first_reservation := v_reservation;
      v_reserved_id := (v_result->'checkout'->>'id')::uuid;
    end if;
  end loop;
  assert (select count(*)=10 from public.rootx_shopify_checkouts where user_id=v_rate_user),
    'reservation allowance incorrect';
  -- Idempotent retries succeed even when the rate limit is already full.
  v_result := public.rootx_reserve_shopify_checkout(v_first_reservation || jsonb_build_object(
    'id',gen_random_uuid(),'link_token_hash',repeat('f',64)));
  assert v_result->>'created'='false' and (v_result->'checkout'->>'id')::uuid=v_reserved_id,
    'reservation retry changed checkout identity';
  assert (select link_token_hash=lpad('1',64,'0')
    from public.rootx_shopify_checkouts where id=v_reserved_id),
    'reservation retry replaced original proof';
  begin
    perform public.rootx_reserve_shopify_checkout(v_first_reservation || jsonb_build_object(
      'id',gen_random_uuid(),'client_request_id',gen_random_uuid(),'link_token_hash',repeat('e',64)));
    raise exception using errcode='XX000',message='eleventh checkout reservation was allowed';
  exception when sqlstate 'P0001' then null;
  end;
  assert (select count(*)=10 from public.rootx_shopify_checkouts where user_id=v_rate_user),
    'rate-limit rejection left a reservation';
  begin
    perform public.rootx_reserve_shopify_checkout(v_first_reservation || jsonb_build_object(
      'id',gen_random_uuid(),'client_request_id',gen_random_uuid(),
      'expires_at',now()+interval '8 days'));
    raise exception 'overlong checkout expiry accepted';
  exception when sqlstate '22023' then null;
  end;

  raise notice 'RootX Shopify transactional schema tests passed';
end;
$$;
rollback;
