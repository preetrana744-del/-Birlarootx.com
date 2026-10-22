/* Birla RootX dynamic catalogue + unified account link.
   Preserves the existing storefront JS and local cart behaviour. */
(() => {
  'use strict';
  const api='https://lbqgdfbpuxjkwldhwpvi.supabase.co/rest/v1/rootx_products?select=slug,name,price,image_url,active&active=eq.true';
  const key='sb_publishable_rS7URzLNbhXhdPp50Te_Qg_9LtpKOI_';
  const account='account.html';
  document.querySelectorAll('.header-actions').forEach(node=>{
    if(node.querySelector('.rootx-account-link'))return;
    const link=document.createElement('a');
    link.href=account;link.textContent='Login / Orders';link.className='rootx-account-link';
    link.setAttribute('aria-label','Customer and admin login, order tracking');
    node.insertBefore(link,node.querySelector('.bag-button'));
  });
  document.querySelectorAll('.mobile-menu').forEach(node=>{
    const a=document.createElement('a');a.href=account;a.textContent='Login / Track orders';node.appendChild(a);
  });
  const checkout=document.querySelector('.cart-checkout');
  if(checkout){
    checkout.disabled=true;checkout.textContent='Request order →';
    checkout.addEventListener('click',()=>{
      if(checkout.disabled)return;
      let size=0;
      try{
        const cart=JSON.parse(localStorage.getItem('birlarootx-cart-v1')||'[]');
        size=Array.isArray(cart)?cart.reduce((n,i)=>n+(Array.isArray(i)?Number(i[1])||0:0),0):0;
      }catch(_){}
      if(!size){document.querySelector('.cart-empty')?.scrollIntoView({block:'nearest'});return;}
      location.href=account+'?checkout=1';
    });
    const info=checkout.parentElement?.querySelector('p');
    if(info)info.textContent='Submit an order request. Online payment is not yet connected.';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    fetch('https://lbqgdfbpuxjkwldhwpvi.supabase.co/functions/v1/rootx-shopify-checkout',{
      headers:{apikey:key},cache:'no-store',signal:controller.signal
    }).then(response=>response.ok?response.json():null).then(status=>{
      if(status?.enabled===true){checkout.textContent='Checkout →';if(info)info.textContent='Shipping and the final total are confirmed at secure checkout.';}
    }).catch(()=>{}).finally(()=>clearTimeout(timer));
  }
  function resolveImage(url){
    if(typeof url!=='string'||!url.trim())return null;
    try{const parsed=new URL(url,location.href);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password?parsed.href:null;}catch{return null;}
  }
  const local=window.BIRLAROOTX_PRODUCTS;
  if(!local)return;
  const originalImages=new Map(Object.values(local).map(p=>[p.slug,p.image]));
  const notice=document.createElement('div');
  notice.className='rootx-catalogue-notice';
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const message=document.createElement('span');
  const retry=document.createElement('button');retry.type='button';retry.textContent='Retry availability';
  notice.append(message,retry);
  (document.querySelector('main')||document.body).prepend(notice);
  let requestNumber=0;
  function updateDisplay(){
    Object.entries(local).forEach(([cartKey,product])=>{
      const card=document.querySelector('.product-card [data-product="'+cartKey+'"]')?.closest('.product-card');
      if(card){
        const price=card.querySelector('.product-price');if(price)price.textContent=product.availability==='ready'?'₹'+product.price.toLocaleString('en-IN'):'—';
        const img=card.querySelector('.product-image img');if(img)img.src=product.image;
        let state=card.querySelector('.rootx-product-availability');
        if(!state){state=document.createElement('p');state.className='rootx-product-availability';card.append(state);}
        state.textContent=product.availability==='ready'?'':product.availability==='loading'?'Checking availability…':product.availability==='unavailable'?'Currently unavailable':'Availability could not be confirmed';
        state.hidden=product.availability==='ready';
      }
    });
    const cover=document.querySelector('[data-hero-link]');
    if(cover)Object.values(local).forEach((p,i)=>{const img=cover.querySelectorAll('img')[i];if(img)img.src=p.image;});
    const heroPrice=document.querySelector('[data-hero-price]');
    if(heroPrice){const index=cover?Math.round(cover.scrollLeft/(cover.clientWidth||1)):0;const p=Object.values(local)[index]||Object.values(local)[0];heroPrice.textContent=p.availability==='ready'?'₹'+p.price.toLocaleString('en-IN'):'—';}
    if(typeof renderProductPage==='function')renderProductPage();
    if(typeof renderBag==='function')renderBag();
    document.dispatchEvent(new CustomEvent('rootx:catalogue-update'));
  }
  async function refreshCatalogue(){
    const request=++requestNumber;
    notice.hidden=false;message.textContent='Checking current product prices and availability…';retry.hidden=true;
    Object.values(local).forEach(p=>p.availability='loading');updateDisplay();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(api,{headers:{apikey:key},cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('Catalogue unavailable');
      const result=await response.json();
      if(!Array.isArray(result))throw Error('Invalid catalogue');
      const bySlug=new Map();
      for(const item of result){
        if(!item||typeof item.slug!=='string'||bySlug.has(item.slug)||!Number.isFinite(Number(item.price))||Number(item.price)<=0||typeof item.active!=='boolean')throw Error('Invalid catalogue');
        bySlug.set(item.slug,item);
      }
      if(request!==requestNumber)return;
      Object.values(local).forEach(product=>{
        const item=bySlug.get(product.slug);
        product.availability=item?.active===true?'ready':'unavailable';
        if(item?.active===true){product.price=Number(item.price);product.image=resolveImage(item.image_url)||originalImages.get(product.slug);}
      });
      notice.hidden=true;updateDisplay();
    }catch{
      if(request!==requestNumber)return;
      Object.values(local).forEach(p=>p.availability='error');
      message.textContent='Current prices and availability could not be confirmed. Ordering is paused. Please retry.';
      retry.hidden=false;updateDisplay();
    }finally{clearTimeout(timer);}
  }
  retry.addEventListener('click',refreshCatalogue);
  refreshCatalogue();
  window.addEventListener('pageshow',e=>{if(e.persisted)refreshCatalogue();});
})();

