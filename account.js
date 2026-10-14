(() => {
  'use strict';
  const db = window.supabase.createClient('https://lbqgdfbpuxjkwldhwpvi.supabase.co', 'sb_publishable_rS7URzLNbhXhdPp50Te_Qg_9LtpKOI_', {auth:{storageKey:'birlarootx-auth-v1',autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
  const $ = id => document.getElementById(id);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => '₹' + Number(value || 0).toLocaleString('en-IN');
  const stamp = value => value ? new Date(value).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'}) : 'Not available';
  const statuses = ['received','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'];
  let authMode='signin',currentUser=null,isAdmin=false,orderToken=null;
  let recoveryPending=location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery';
  const setNotice=(message,error=false)=>{ const box=$('notice');box.hidden=!message;box.textContent=message||'';box.classList.toggle('error',error);if(message)box.scrollIntoView({block:'nearest',behavior:'smooth'}); };
  const showAuth=()=>{ $('auth-panel').hidden=false; $('dashboard').hidden=true; $('logout').hidden=true; };
  const setMode=mode=>{
    authMode=mode;
    $('google-auth-options').hidden=mode!=='signin'&&mode!=='signup';
    $('full-name').hidden=mode!=='signup';
    $('full-name').required=mode==='signup';
    $('full-name').parentElement.hidden=mode!=='signup';
    $('email').parentElement.hidden=mode==='newpassword';
    $('email').required=mode!=='newpassword';
    $('password-label').hidden=mode==='reset';
    $('password').required=mode!=='reset';
    $('password').autocomplete=mode==='signup'||mode==='newpassword'?'new-password':'current-password';
    $('password').placeholder=mode==='newpassword'?'New password (minimum 8 characters)':'Your password';
    $('auth-title').textContent=({signin:'Sign in to RootX',signup:'Create your account',reset:'Reset your password',newpassword:'Choose a new password'})[mode];
    $('auth-submit').firstChild.textContent=({signin:'Sign in ',signup:'Create account ',reset:'Send reset link ',newpassword:'Save new password '})[mode];
  };
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{setNotice('');setMode(b.dataset.mode);}));
  // OAuth uses the backend Supabase provider, not Google API credentials in client code.
  // An exact return URL avoids dependency on wildcard redirect allowlisting.
  $('google-signin').addEventListener('click',async()=>{
    const button=$('google-signin');
    if(button.disabled)return;
    button.disabled=true;
    setNotice('');
    try{
      // Check the public Auth settings first so customers don't land on a broken
      // Google redirect while the owner is still configuring Google Cloud.
      const settingsResponse=await fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/auth/v1/settings',{
        headers:{apikey:'sb_publishable_rS7URzLNbhXhdPp50Te_Qg_9LtpKOI_'}
      });
      if(settingsResponse.ok){
        const settings=await settingsResponse.json();
        if(settings?.external?.google===false){
          throw Error('Google sign-in is not enabled yet. The store owner needs to finish Google Cloud OAuth setup and enable Google in Supabase Authentication.');
        }
      }
      // Keep an order-in-progress accessible after returning from Google.
      if(new URLSearchParams(location.search).has('checkout')){
        sessionStorage.setItem('rootx-google-return-checkout','1');
      }
      const {error}=await db.auth.signInWithOAuth({
        provider:'google',
        options:{
          redirectTo:new URL('account.html',location.href).href,
          queryParams:{prompt:'select_account'}
        }
      });
      if(error)throw error;
    }catch(err){
      setNotice(err.message||'Google sign-in could not start. Please try again.',true);
    }finally{
      button.disabled=false;
    }
  });
  $('auth-form').addEventListener('submit',async e=>{
    e.preventDefault();const button=$('auth-submit');button.disabled=true;setNotice('');
    const email=$('email').value.trim().toLowerCase(),password=$('password').value,name=$('full-name').value.trim();
    try{
      let result;
      if(authMode==='signin'){result=await db.auth.signInWithPassword({email,password});}
      if(authMode==='signup'){
        if(name.length<2)throw Error('Enter your full name.');
        result=await db.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:new URL('account.html',location.href).href}});
        if(!result.error){setNotice('Account request received. If email confirmation is enabled, check your inbox and verify before signing in.');setMode('signin');return;}
      }
      if(authMode==='reset'){
        result=await db.auth.resetPasswordForEmail(email,{redirectTo:new URL('account.html',location.href).href});
        if(!result.error){setNotice('If this email has an account, a password reset link will be sent. Please check your inbox.');setMode('signin');return;}
      }
      if(authMode==='newpassword'){
        if(password.length<8)throw Error('Password must have at least 8 characters.');
        result=await db.auth.updateUser({password});
        if(!result.error){recoveryPending=false;setNotice('Password updated.');setMode('signin');await showDashboard();return;}
      }
      if(result?.error)throw result.error;
      await showDashboard();
    }catch(err){setNotice(err.message||'Could not complete request.',true);}finally{button.disabled=false;}
  });
  $('logout').addEventListener('click',async()=>{await db.auth.signOut();currentUser=null;isAdmin=false;setNotice('You have signed out.');setMode('signin');showAuth();});
  $('refresh').addEventListener('click',()=>showDashboard());
  function itemDetails(items){
    if(!items||!items.length)return '';
    return '<div class="order-items">'+items.map(i=>'<div><img src="'+safe(i.image_url||'favicon.svg')+'" alt=""><span>'+safe(i.product_name||i.name)+' × '+Number(i.quantity||1)+'</span><b>'+money(Number(i.unit_price||i.price||0)*Number(i.quantity||1))+'</b></div>').join('')+'</div>';
  }
  function orderView(order,items,events){
    const date=order.expected_delivery_date ? safe(order.expected_delivery_date) : 'Not assigned yet';
    let result='<article class="order"><div class="order-top"><span class="order-title">'+safe(order.order_number)+'</span><span class="chip">'+safe(order.status.replaceAll('_',' '))+'</span></div>'+
      '<div class="line">Placed '+stamp(order.created_at)+' · Total '+money(order.subtotal)+' · Expected delivery: '+date+'</div>'+
      (order.courier?'<div class="line">Courier: '+safe(order.courier)+'</div>':'')+
      (order.tracking_number?'<div class="line">Tracking reference: '+safe(order.tracking_number)+'</div>':'')+
      (order.admin_note?'<div class="line">'+safe(order.admin_note)+'</div>':'')+
      itemDetails(items);
    if(events?.length)result+='<ol class="timeline">'+events.map(event=>'<li><b>'+safe(event.status.replaceAll('_',' '))+'</b><small>'+stamp(event.created_at)+(event.note?' · '+safe(event.note):'')+'</small></li>').join('')+'</ol>';
    return result+'</article>';
  }
  async function getOrders(){
    const q=await Promise.all([
      db.from('rootx_orders').select('id,order_number,customer_id,status,expected_delivery_date,tracking_number,courier,admin_note,shipping_name,shipping_phone,shipping_address,subtotal,created_at').order('created_at',{ascending:false}),
      db.from('rootx_order_items').select('order_id,product_name,quantity,unit_price,image_url'),
      db.from('rootx_order_events').select('order_id,status,note,created_at').order('created_at',{ascending:true})
    ]);
    for(const x of q)if(x.error)throw x.error;
    return {orders:q[0].data||[],items:q[1].data||[],events:q[2].data||[]};
  }
  async function loadCustomer(){
    const all=await getOrders();
    $('customer-orders').innerHTML=all.orders.length ? all.orders.map(o=>orderView(o,all.items.filter(i=>i.order_id===o.id),all.events.filter(e=>e.order_id===o.id))).join('') : '<p class="muted">No orders yet. Your order history and delivery updates will appear here after an order request is submitted.</p>';
    const cart=readCart();
    const params=new URLSearchParams(location.search);
    const checkout=params.has('checkout')&&cart.length;
    $('checkout-section').hidden=!checkout;
    if(checkout){
      const productResult=await db.from('rootx_products').select('slug,name,price,active').eq('active',true);
      if(productResult.error)throw productResult.error;
      const details=cart.map(i=>({...i,product:productResult.data.find(p=>p.slug===i.slug)}));
      if(details.some(i=>!i.product)){$('checkout-items').textContent='A cart item is no longer available. Please update your cart.';$('place-order').disabled=true;return;}
      $('checkout-items').innerHTML='<div class="order">'+details.map(i=>'<div class="order-top"><span>'+safe(i.product.name)+' × '+i.quantity+'</span><b>'+money(i.product.price*i.quantity)+'</b></div>').join('')+'<hr><div class="order-top"><strong>Estimated total</strong><strong>'+money(details.reduce((n,i)=>n+i.product.price*i.quantity,0))+'</strong></div></div>';
      const profile=await db.from('rootx_profiles').select('full_name,phone').eq('id',currentUser.id).maybeSingle();
      if(profile.data){$('checkout-form').elements.shipping_name.value=profile.data.full_name||'';$('checkout-form').elements.shipping_phone.value=profile.data.phone||'';}
    } else if(params.has('checkout')){$('checkout-section').hidden=false;$('checkout-items').textContent='Your cart is empty. Add a product first.';$('checkout-form').hidden=true;}
  }
  function readCart(){
    try{let array=JSON.parse(localStorage.getItem('birlarootx-cart-v1')||'[]');const lookup={carbs:'carbs-slayer',jacked:'jacked-pre-workout',spilan:'spilan-test',epic:'epic-burn-pro',growth:'growth-factor'};return Array.isArray(array)?array.filter(i=>Array.isArray(i)&&lookup[i[0]]&&Number.isInteger(i[1])&&i[1]>0&&i[1]<=99).map(i=>({slug:lookup[i[0]],quantity:i[1]})):[];}catch{return [];}
  }
  $('checkout-form').addEventListener('submit',async e=>{
    e.preventDefault();const items=readCart();if(!items.length)return setNotice('Your cart is empty.',true);
    const button=$('place-order');button.disabled=true;setNotice('');
    try{
      if(!orderToken)orderToken=crypto.randomUUID();
      const form=new FormData(e.currentTarget);
      const payload={client_request_id:orderToken,shipping_name:String(form.get('shipping_name')||'').trim(),shipping_phone:String(form.get('shipping_phone')||'').trim(),shipping_address:String(form.get('shipping_address')||'').trim(),items};
      const {data,error}=await db.rpc('rootx_place_order',{payload});if(error)throw error;
      localStorage.removeItem('birlarootx-cart-v1');orderToken=null;
      history.replaceState(null,'','account.html');
      $('checkout-section').hidden=true;
      setNotice('Order request '+data.order_number+' received. No online payment has been charged. Your request is visible to the RootX team.');
      await loadCustomer();
    }catch(err){setNotice(err.message||'Order request failed.',true);}finally{button.disabled=false;}
  });
  function adminOrder(order,items,events,profile){
    const statusOptions=statuses.map(s=>'<option value="'+s+'" '+(order.status===s?'selected':'')+'>'+safe(s.replaceAll('_',' '))+'</option>').join('');
    return '<article class="order"><div class="order-top"><b>'+safe(order.order_number)+'</b><span class="chip">'+safe(order.status.replaceAll('_',' '))+'</span></div>'+
      '<div class="line">Customer: '+safe(order.shipping_name)+' · '+safe(profile?.email||'')+' · '+safe(order.shipping_phone)+'</div>'+
      '<div class="line">Address: '+safe(order.shipping_address)+'</div>'+
      '<div class="line">Placed '+stamp(order.created_at)+' · Total '+money(order.subtotal)+'</div>'+itemDetails(items)+
      '<form class="admin-order-form" data-order-id="'+safe(order.id)+'">'+
      '<label>Status<select name="status">'+statusOptions+'</select></label>'+
      '<label>Expected delivery date<input name="expected_delivery_date" type="date" value="'+safe(order.expected_delivery_date||'')+'"></label>'+
      '<label>Courier name<input name="courier" maxlength="100" value="'+safe(order.courier||'')+'"></label>'+
      '<label>Tracking number<input name="tracking_number" maxlength="100" value="'+safe(order.tracking_number||'')+'"></label>'+
      '<label>Customer-visible update<input name="admin_note" maxlength="1000" value="'+safe(order.admin_note||'')+'"></label>'+
      '<button type="submit" class="btn">Save delivery update</button></form>'+
      (events.length?'<div class="line">History: '+events.map(e=>safe(e.status.replaceAll('_',' '))+' ('+stamp(e.created_at)+')').join(' → ')+'</div>':'')+'</article>';
  }
  async function loadAdmin(){
    const [all,profiles,products]=await Promise.all([
      getOrders(),
      db.from('rootx_profiles').select('id,email,full_name,phone,created_at').order('created_at',{ascending:false}),
      db.from('rootx_products').select('slug,name,price,image_url,active').order('name')
    ]);
    if(profiles.error)throw profiles.error;if(products.error)throw products.error;
    const people=profiles.data||[];
    const byId=new Map(people.map(p=>[p.id,p]));
    $('metric-orders').textContent=all.orders.length;
    $('metric-customers').textContent=people.length;
    $('metric-open').textContent=all.orders.filter(o=>!['delivered','cancelled'].includes(o.status)).length;
    $('admin-orders').innerHTML=all.orders.length?all.orders.map(o=>adminOrder(o,all.items.filter(i=>i.order_id===o.id),all.events.filter(e=>e.order_id===o.id),byId.get(o.customer_id))).join(''):'<p class="muted">No orders received yet.</p>';
    $('admin-customers').innerHTML=people.length?people.map(p=>'<div class="person"><b>'+safe(p.full_name||'Customer')+'</b><div class="line">'+safe(p.email)+' · '+safe(p.phone||'Phone not provided')+' · Joined '+stamp(p.created_at)+'</div></div>').join(''):'<p class="muted">No registered customers yet.</p>';
    $('admin-products').innerHTML=(products.data||[]).map(p=>
      '<form class="product-editor" data-slug="'+safe(p.slug)+'"><img src="'+safe(p.image_url)+'" alt="'+safe(p.name)+'"><h4>'+safe(p.name)+'</h4>'+
      '<label>Product price (INR)<input name="price" type="number" min="1" max="100000" step="0.01" value="'+Number(p.price)+'" required></label>'+
      '<label>Replace product photo<input name="image" type="file" accept="image/jpeg,image/png,image/webp"></label>'+
      '<button type="submit" class="btn">Save product</button></form>').join('');
  }
  $('admin-orders').addEventListener('submit',async e=>{
    const form=e.target.closest('form[data-order-id]');if(!form)return;e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;setNotice('');
    try{
      const f=new FormData(form);
      const record={status:String(f.get('status')),expected_delivery_date:f.get('expected_delivery_date')||null,courier:String(f.get('courier')||'').trim(),tracking_number:String(f.get('tracking_number')||'').trim(),admin_note:String(f.get('admin_note')||'').trim(),updated_at:new Date().toISOString()};
      if(!statuses.includes(record.status))throw Error('Invalid status.');
      const {data,error}=await db.from('rootx_orders').update(record).eq('id',form.dataset.orderId).select('id');
      if(error)throw error;if(!data?.length)throw Error('Update denied.');
      setNotice('Delivery details saved. Customer tracking updated.');await loadAdmin();
    }catch(err){setNotice(err.message||'Could not update order.',true);}finally{button.disabled=false;}
  });
  $('admin-products').addEventListener('submit',async e=>{
    const form=e.target.closest('form[data-slug]');if(!form)return;e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;setNotice('');
    try{
      const f=new FormData(form),price=Number(f.get('price'));
      if(!Number.isFinite(price)||price<=0||price>100000)throw Error('Price must be between ₹1 and ₹100,000.');
      const patch={price,updated_at:new Date().toISOString()};
      const file=form.querySelector('[name=image]').files[0];
      if(file){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Use JPG, PNG or WebP up to 5 MB.');
        const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
        const path=form.dataset.slug+'/'+crypto.randomUUID()+'.'+ext;
        const up=await db.storage.from('rootx-product-images').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
        if(up.error)throw up.error;
        patch.image_url=db.storage.from('rootx-product-images').getPublicUrl(path).data.publicUrl;
      }
      const {data,error}=await db.from('rootx_products').update(patch).eq('slug',form.dataset.slug).select('slug');
      if(error)throw error;if(!data?.length)throw Error('Update denied.');
      setNotice('Product updated. New price/image will appear on the storefront after refresh.');await loadAdmin();
    }catch(err){setNotice(err.message||'Could not save product.',true);}finally{button.disabled=false;}
  });
  async function showDashboard(){
    if(recoveryPending){showAuth();setMode('newpassword');return;}
    const {data:{user},error}=await db.auth.getUser();
    if(error||!user){currentUser=null;showAuth();return;}
    currentUser=user;
    if(sessionStorage.getItem('rootx-google-return-checkout')==='1'){
      sessionStorage.removeItem('rootx-google-return-checkout');
      if(!new URLSearchParams(location.search).has('checkout')){
        history.replaceState(null,'',new URL('account.html?checkout=1',location.href).pathname+'?checkout=1');
      }
    }
    const admin=await db.from('rootx_admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
    if(admin.error)throw admin.error;
    isAdmin=Boolean(admin.data);
    $('auth-panel').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;
    $('customer-view').hidden=isAdmin;$('admin-view').hidden=!isAdmin;
    $('role-label').textContent=isAdmin?'AUTHORIZED ADMIN':'CUSTOMER ACCOUNT';
    $('welcome').textContent=isAdmin?'Store management':'My orders & tracking';
    $('account-email').textContent=user.email||'';
    if(isAdmin)await loadAdmin();else await loadCustomer();
  }
  db.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY'){recoveryPending=true;showAuth();setMode('newpassword');setNotice('Please choose a new password.');}
    else if(event==='SIGNED_OUT'){currentUser=null;showAuth();}
  });
  setMode('signin');
  showDashboard().catch(err=>{showAuth();setNotice(err.message||'Could not load your account.',true);});
})();