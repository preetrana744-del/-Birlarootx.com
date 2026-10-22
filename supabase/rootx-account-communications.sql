-- Additive customer-address and durable communication support.
alter table public.rootx_orders add column if not exists shipping_city text;
alter table public.rootx_orders add column if not exists shipping_state text;
alter table public.rootx_orders add column if not exists shipping_pin text;
CREATE OR REPLACE FUNCTION rootx_private.place_order(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_request_id uuid;
  v_name text;
  v_phone text;
  v_address text;
  v_city text;
  v_state text;
  v_pin text;
  v_raw_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_snapshots jsonb := '[]'::jsonb;
  v_normalized jsonb;
  v_quantity integer;
  v_slug text;
  v_item record;
  v_count integer := 0;
  v_total numeric(12,2) := 0;
  v_order public.rootx_orders%rowtype;
begin
  if v_uid is null then
    raise exception 'Please sign in before placing an order.' using errcode = '42501';
  end if;
  -- Excludes anonymous Auth sessions and deleted/unconfirmed email identities.
  if not exists (select 1 from auth.users u where u.id = v_uid
      and u.email is not null and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous,false) = false) then
    raise exception 'Please verify your email before placing an order.' using errcode = '42501';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or length(payload::text) > 20000 then
    raise exception 'Invalid checkout information.' using errcode = '22023';
  end if;
  begin
    v_request_id := (payload->>'client_request_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'Invalid checkout request id.' using errcode = '22023';
  end;
  if v_request_id is null then
    raise exception 'A checkout request id is required.' using errcode = '22023';
  end if;
  if jsonb_typeof(payload->'shipping_name') is distinct from 'string'
     or jsonb_typeof(payload->'shipping_phone') is distinct from 'string'
     or jsonb_typeof(payload->'shipping_address') is distinct from 'string' then
    raise exception 'Name, phone and shipping address are required.' using errcode = '22023';
  end if;
  v_name := btrim(payload->>'shipping_name');
  v_phone := regexp_replace(btrim(payload->>'shipping_phone'),'[ ()-]','','g');
  v_address := btrim(payload->>'shipping_address');
  v_city := btrim(payload->>'shipping_city');
  v_state := btrim(payload->>'shipping_state');
  v_pin := btrim(payload->>'shipping_pin');
  if jsonb_typeof(payload->'shipping_city') is distinct from 'string' or jsonb_typeof(payload->'shipping_state') is distinct from 'string' or jsonb_typeof(payload->'shipping_pin') is distinct from 'string' or coalesce(length(v_city),0) not between 2 and 100 or v_state is null or v_state not in ('Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal') or coalesce(v_pin,'') !~ '^[1-9][0-9]{5}$' or v_phone !~ '^\+91[6-9][0-9]{9}$' then
    raise exception 'Enter a valid Indian mobile number, city, state and 6-digit PIN code. Refresh the account page if these fields are missing.' using errcode='22023';
  end if;
  if length(v_name) not between 2 and 120 or length(v_address) not between 10 and 1000
     or length(payload->>'shipping_phone') > 25 or v_phone !~ '^\+?[0-9]{7,15}$' then
    raise exception 'Please enter a valid name, phone number and complete shipping address.' using errcode = '22023';
  end if;
  if jsonb_typeof(payload->'items') is distinct from 'array'
     or jsonb_array_length(payload->'items') not between 1 and 20 then
    raise exception 'The cart must contain between 1 and 20 products.' using errcode = '22023';
  end if;
  for v_raw_item in select value from jsonb_array_elements(payload->'items') loop
    if jsonb_typeof(v_raw_item) <> 'object'
       or jsonb_typeof(v_raw_item->'slug') is distinct from 'string'
       or jsonb_typeof(v_raw_item->'quantity') is distinct from 'number'
       or (v_raw_item->>'quantity') !~ '^[1-9][0-9]?$' then
      raise exception 'Each product requires a valid quantity from 1 to 99.' using errcode = '22023';
    end if;
    v_slug := btrim(v_raw_item->>'slug');
    v_quantity := (v_raw_item->>'quantity')::integer;
    if length(v_slug) > 100 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'Invalid product.' using errcode = '22023';
    end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object('slug',v_slug,'quantity',v_quantity));
  end loop;
  if exists (select 1 from jsonb_to_recordset(v_items) as x(slug text,quantity integer)
    group by slug having sum(quantity) > 99) then
    raise exception 'The maximum quantity per product is 99.' using errcode = '22023';
  end if;
  select jsonb_agg(jsonb_build_object('slug',x.slug,'quantity',x.quantity) order by x.slug)
  into v_items from (
    select i.slug,sum(i.quantity)::integer as quantity
      from jsonb_to_recordset(v_items) as i(slug text,quantity integer) group by i.slug
  ) x;
  v_normalized := jsonb_build_object('shipping_name',v_name,'shipping_phone',v_phone,
    'shipping_address',v_address,'shipping_city',v_city,'shipping_state',v_state,'shipping_pin',v_pin,'items',v_items);

  -- Serializes duplicate retries (including simultaneous requests). Unique
  -- (customer_id,client_request_id) is the final database backstop.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || v_request_id::text,0));
  select * into v_order from public.rootx_orders
    where customer_id = v_uid and client_request_id = v_request_id;
  if found then
    if v_order.checkout_payload is distinct from v_normalized then
      raise exception 'This checkout request was already used with different information.' using errcode = '22023';
    end if;
    return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,
      'status',v_order.status,'subtotal',v_order.subtotal,
      'expected_delivery_date',v_order.expected_delivery_date);
  end if;

  -- Locks official product rows until commit, so a simultaneous admin price
  -- change cannot mix prices within this order. The lock order avoids deadlocks.
  for v_item in
    select i.slug,i.quantity,p.name,p.price,p.image_url,p.active
      from jsonb_to_recordset(v_items) as i(slug text,quantity integer)
      join public.rootx_products p on p.slug = i.slug
      order by p.slug for share of p
  loop
    if not v_item.active then
      raise exception 'A product in your cart is no longer available.' using errcode = '22023';
    end if;
    v_count := v_count + 1;
    v_total := v_total + v_item.quantity * v_item.price;
    if v_total > 1000000 then
      raise exception 'The order total exceeds the supported limit.' using errcode = '22023';
    end if;
    v_snapshots := v_snapshots || jsonb_build_array(jsonb_build_object('slug',v_item.slug,
      'quantity',v_item.quantity,'name',v_item.name,'price',v_item.price,'image_url',v_item.image_url));
  end loop;
  if v_count <> jsonb_array_length(v_items) then
    raise exception 'A product in your cart is no longer available.' using errcode = '22023';
  end if;

  -- Enroll an existing Auth identity only once it actively places a RootX order;
  -- never bulk-copy users from other applications sharing this Auth project.
  insert into public.rootx_profiles(id,email,full_name,phone)
  select u.id,u.email,v_name,v_phone from auth.users u where u.id = v_uid
  on conflict (id) do nothing;

  insert into public.rootx_orders(customer_id,shipping_name,shipping_phone,shipping_address,shipping_city,shipping_state,shipping_pin,
    subtotal,client_request_id,checkout_payload)
  values (v_uid,v_name,v_phone,v_address,v_city,v_state,v_pin,v_total,v_request_id,v_normalized)
  returning * into v_order;
  insert into public.rootx_order_items(order_id,product_slug,product_name,quantity,unit_price,image_url)
  select v_order.id,x.slug,x.name,x.quantity,x.price,x.image_url
    from jsonb_to_recordset(v_snapshots)
      as x(slug text,name text,quantity integer,price numeric,image_url text);
  return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,
    'status',v_order.status,'subtotal',v_order.subtotal,
    'expected_delivery_date',v_order.expected_delivery_date);
end;
$function$;


create table public.rootx_notification_outbox (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.rootx_orders(id) on delete cascade,
 customer_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('request_customer','request_admin','status_customer')),
 snapshot jsonb not null,
 status text not null default 'pending' check(status in ('pending','processing','accepted','failed','review')),
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_until timestamptz,
 claim_token uuid,
 first_attempt_at timestamptz,
 provider_message_id text,
 last_error text,
 created_at timestamptz not null default now(),
 accepted_at timestamptz
);
alter table public.rootx_notification_outbox enable row level security;
revoke all on public.rootx_notification_outbox from public,anon,authenticated;
grant select,insert,update on public.rootx_notification_outbox to service_role;
create index rootx_notification_due on public.rootx_notification_outbox(status,available_at);

create function rootx_private.queue_order_notifications() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_snapshot jsonb;
begin
 if new.source <> 'request' or new.customer_id is null then return new; end if;
 v_snapshot:=jsonb_build_object('order_number',new.order_number,'status',new.status,'subtotal',new.subtotal,'expected_delivery_date',new.expected_delivery_date,'courier',new.courier,'tracking_number',new.tracking_number,'note',new.admin_note,'customer_email',(select email from auth.users where id=new.customer_id));
 if tg_op='INSERT' then
  insert into public.rootx_notification_outbox(order_id,customer_id,kind,snapshot) values(new.id,new.customer_id,'request_customer',v_snapshot),(new.id,new.customer_id,'request_admin',v_snapshot);
 elsif (new.status,new.expected_delivery_date,new.tracking_number,new.courier,new.admin_note) is distinct from (old.status,old.expected_delivery_date,old.tracking_number,old.courier,old.admin_note) then
  insert into public.rootx_notification_outbox(order_id,customer_id,kind,snapshot) values(new.id,new.customer_id,'status_customer',v_snapshot);
 end if;
 return new;
end;$$;
revoke all on function rootx_private.queue_order_notifications() from public,anon,authenticated;
create trigger rootx_order_notification_queue after insert or update on public.rootx_orders for each row execute function rootx_private.queue_order_notifications();

-- Service-only leasing; the Edge Function derives actor_id from a verified session.
create function public.rootx_claim_notifications(actor_id uuid) returns setof public.rootx_notification_outbox
language plpgsql set search_path='' as $$
declare v_admin boolean;
begin
 select exists(select 1 from public.rootx_admin_users where user_id=actor_id) into v_admin;
 update public.rootx_notification_outbox set status='review',last_error='Delivery uncertain beyond provider deduplication window; reconcile before resending.' where status in ('pending','processing') and first_attempt_at < now()-interval '23 hours' and (v_admin or customer_id=actor_id);
 return query
 with due as (
  select id from public.rootx_notification_outbox
  where (status='pending' or (status='processing' and lease_until<now())) and available_at<=now() and attempts<5 and (v_admin or customer_id=actor_id)
  order by created_at for update skip locked limit 10
 )
 update public.rootx_notification_outbox n set status='processing',attempts=n.attempts+1,first_attempt_at=coalesce(n.first_attempt_at,now()),lease_until=now()+interval '3 minutes',claim_token=gen_random_uuid()
 from due where n.id=due.id returning n.*;
end;$$;
revoke all on function public.rootx_claim_notifications(uuid) from public,anon,authenticated;
grant execute on function public.rootx_claim_notifications(uuid) to service_role;
