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
    checkout.disabled=false;checkout.textContent='Request order →';
    checkout.addEventListener('click',()=>{
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
    try{const parsed=new URL(url,location.href);return ['https:','http:'].includes(parsed.protocol)?parsed.href:null;}catch{return null;}
  }
  async function refreshCatalogue(){
    try{
      const response=await fetch(api,{headers:{apikey:key},cache:'no-store'});
      if(!response.ok)throw Error('Product catalogue request failed');
      const result=await response.json();
      if(!Array.isArray(result))throw Error('Invalid product catalogue');
      const bySlug=new Map(result.map(p=>[p.slug,p]));
      const local=window.BIRLAROOTX_PRODUCTS;
      if(!local)return;
      Object.entries(local).forEach(([cartKey,product])=>{
        const item=bySlug.get(product.slug);
        if(!item)return;
        const n=Number(item.price);
        if(!Number.isFinite(n)||n<=0)return;
        const image=product.image.startsWith('/assets/brand-deck/')?product.image:resolveImage(item.image_url);
        product.price=n;
        if(image)product.image=image;
        const card=document.querySelector('.product-card [data-product="'+cartKey+'"]')?.closest('.product-card');
        if(card){
          const price=card.querySelector('.product-price');if(price)price.textContent='₹'+n.toLocaleString('en-IN');
          const img=card.querySelector('.product-image img');if(img&&image)img.src=image;
        }
      });
      const cover=document.querySelector('[data-hero-link]');
      if(cover){Object.values(local).forEach((p,i)=>{const img=cover.querySelectorAll('img')[i];if(img)img.src=p.image;});}
      const heroPrice=document.querySelector('[data-hero-price]');
      if(heroPrice){
        const index=cover?Math.round(cover.scrollLeft/(cover.clientWidth||1)):0;
        const product=Object.values(local)[index]||Object.values(local)[0];
        if(product)heroPrice.textContent='₹'+product.price.toLocaleString('en-IN');
      }
      if(typeof renderProductPage==='function')renderProductPage();
      if(typeof renderBag==='function')renderBag();
      document.querySelectorAll('[data-detail-price]').forEach(node=>node.textContent='₹'+
        (Object.values(local).find(p=>p.slug===new URLSearchParams(location.search).get('product'))||local.carbs).price.toLocaleString('en-IN'));
    }catch(err){console.warn('RootX product database temporarily unavailable; showing cached product catalogue.',err);}
  }
  refreshCatalogue();
  window.addEventListener('pageshow',e=>{if(e.persisted)refreshCatalogue();});
})();
