
(() => {
 const header=document.querySelector('.site-header');
 if(!header)return;
 header.classList.add('rootx-unified-header');
 const icons={"search":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m16 16 5 5\"/></svg>","account":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"7\" r=\"3.5\"/><path d=\"M4 21v-2a8 8 0 0 1 16 0v2\"/></svg>","bag":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 7h14l1 14H4L5 7z\"/><path d=\"M8 8V6a4 4 0 0 1 8 0v2\"/></svg>"};
 const desktopShop=document.createElement('a');desktopShop.className='reference-desktop-shop';desktopShop.href='/index.html#products';desktopShop.textContent='SHOP ALL';header.append(desktopShop);
 const account=header.querySelector('.rootx-account-link');
 if(account){const icon=document.createElement('span');icon.className='reference-account-icon';icon.innerHTML=icons.account;account.append(icon);account.setAttribute('aria-label','Login and track orders');}
 const bag=header.querySelector('.bag-button');
 if(bag){const icon=document.createElement('span');icon.className='reference-bag-icon';icon.innerHTML=icons.bag;bag.append(icon);}
 const actions=header.querySelector('.header-actions')||header;
 if(!header.querySelector('.reference-search-button')){const search=document.createElement('button');search.type='button';search.className='reference-search-button';search.setAttribute('aria-label','Search products');search.innerHTML=icons.search;actions.append(search);}
 if(document.querySelector('.hero')){
 const shop=document.createElement('div');shop.className='reference-shop-label';shop.innerHTML='<span>HOME</span>SHOP BIRLA ROOTX';document.querySelector('.hero').before(shop);
 const faqList=document.querySelector('.faq .faq-list');
 const allFaqs=document.createElement('button');allFaqs.type='button';allFaqs.className='reference-all-faqs';allFaqs.textContent='EXPLORE ALL FAQS';
 if(faqList){faqList.after(allFaqs);if(matchMedia('all').matches)faqList.querySelectorAll('details').forEach(d=>d.open=false);allFaqs.addEventListener('click',()=>{faqList.querySelectorAll('details').forEach(d=>d.open=true);faqList.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});});}
 const footer=document.querySelector('.site-footer');
 const mobileFooter=document.createElement('div');mobileFooter.className='reference-mobile-footer';
 const group=(title,html)=>'<details class="reference-footer-group"><summary>'+title+'</summary>'+html+'</details>';
 const productLinks=[...document.querySelectorAll('.product-card h3 a')].map(a=>'<a href="'+a.getAttribute('href')+'">'+a.textContent+'</a>').join('');
 const intro=[...document.querySelectorAll('.hero-lede,.deck-intro')].map(p=>'<p>'+p.textContent+'</p>').join('');
 const journal=[...document.querySelectorAll('.journal-preview nav a')].map(a=>'<a href="'+a.getAttribute('href')+'">'+a.textContent+'</a>').join('');
 mobileFooter.innerHTML=group('SHOP ALL',productLinks)+group('KNOW MORE',intro+'<a href="#story">Our approach</a><a href="#faq">FAQs</a>'+journal)+group('SUPPORT','<a href="/account.html">Login / Track orders</a><a href="#faq">Ordering information</a>')+group('GET IN TOUCH','<div class="reference-contact-slot"></div>')+'<p class="reference-footer-copyright">© 2026 BIRLA ROOTX</p><p class="reference-footer-copyright">FOOD SUPPLEMENT · READ PRODUCT LABELS BEFORE USE</p>';
 footer.prepend(mobileFooter);
 const support=footer.querySelector(':scope > .support-footer');
 const journalSection=document.querySelector('.journal-preview');
 const anchor=document.createComment('Original support position');if(support)support.before(anchor);
 const media=matchMedia('all');
 const sync=()=>{if(media.matches){if(support)mobileFooter.querySelector('.reference-contact-slot').append(support);journalSection?.classList.add('reference-journal-moved');}else{if(support)anchor.after(support);journalSection?.classList.remove('reference-journal-moved');}};
 sync();media.addEventListener('change',sync);
 const desktopFooter=matchMedia('(min-width:900px)');
 const syncFooter=()=>mobileFooter.querySelectorAll('details').forEach(d=>{d.open=desktopFooter.matches;});
 syncFooter();desktopFooter.addEventListener('change',syncFooter);

 }
 const dialog=document.createElement('dialog');dialog.className='reference-search-dialog';dialog.setAttribute('aria-label','Search Birla RootX');
 dialog.innerHTML='<div class="rootx-search-bar"><form role="search"><label class="rootx-search-label" for="rootx-product-search">Search products</label><span class="rootx-search-icon" aria-hidden="true">'+icons.search+'</span><input id="rootx-product-search" name="query" type="search" placeholder="Search for products" autocomplete="off" aria-controls="rootx-search-results"><button class="rootx-clear-search" type="button" aria-label="Clear search" hidden>×</button></form><button type="button" class="reference-close-search" aria-label="Close search">×</button></div><div class="rootx-search-content"><p role="status" aria-live="polite" class="reference-search-status"></p><div id="rootx-search-results" class="rootx-search-results"></div></div>';
 document.body.append(dialog);
 const input=dialog.querySelector('input'),results=dialog.querySelector('.rootx-search-results'),status=dialog.querySelector('.reference-search-status'),clear=dialog.querySelector('.rootx-clear-search'),trigger=header.querySelector('.reference-search-button');
 const normalize=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const distance=(a,b)=>{const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}return row[b.length];};
 const fallback=[
 {name:'Carbs Slayer',slug:'carbs-slayer',type:'60 capsules partitioning carb support'},
 {name:'Jacked Pre-Workout',slug:'jacked-pre-workout',type:'40 scoops pre workout performance'},
 {name:'Spilan Test',slug:'spilan-test',type:'60 capsules vitality SA3X'},
 {name:'Epic Burn Pro',slug:'epic-burn-pro',type:'60 capsules thermogenic'},
 {name:'Growth Factor',slug:'growth-factor',type:'60 capsules sleep recovery'}
 ];
 const render=()=>{
 const q=normalize(input.value),terms=q.split(' ').filter(Boolean);
 const catalogue=window.BIRLAROOTX_PRODUCTS ? Object.entries(window.BIRLAROOTX_PRODUCTS).map(([key,p])=>({...p,key})) : fallback;
 const matches=catalogue.filter(p=>{const hay=normalize([p.name,p.type,p.summary].filter(Boolean).join(' ')),words=hay.split(' ');return terms.every(term=>hay.includes(term)||(term.length>=4&&words.some(word=>distance(term,word)<=1)));});
 clear.hidden=!input.value;
 status.textContent=q?(matches.length?matches.length+' product'+(matches.length===1?'':'s')+' found':'No products found. Try another name or explore our range below.'):'Explore the range';
 results.replaceChildren();
 (matches.length?matches:catalogue).forEach(p=>{
 const tile=document.createElement('article');tile.className='rootx-search-product';
 const link=document.createElement('a');link.className='rootx-search-product-link';link.href='/products/'+p.slug+'/';
 const img=document.createElement('img');img.src=p.image||'/assets/brand-deck/'+p.slug+'.jpg';img.alt=p.name;img.width=280;img.height=280;
 const name=document.createElement('h3');name.textContent=p.name;link.append(img,name);tile.append(link);
 const cost=document.createElement('p');cost.className='rootx-search-price';cost.textContent=p.availability==='ready'?'₹'+p.price.toLocaleString('en-IN'):'View current price';tile.append(cost);
 const cart=p.key?document.querySelector('.product-card .add-button[data-product="'+p.key+'"]'):null;
 if(cart){const add=document.createElement('button');add.type='button';add.className='rootx-search-add';add.disabled=cart.disabled;add.textContent=cart.getAttribute('aria-pressed')==='true'?'REMOVE FROM CART':cart.disabled?cart.textContent.trim():'ADD TO CART';add.setAttribute('aria-label',cart.getAttribute('aria-label')||('Add '+p.name+' to cart'));add.addEventListener('click',()=>{cart.click();render();});tile.append(add);}
 else{const view=document.createElement('a');view.href=link.href;view.className='rootx-search-view';view.textContent='View formula →';tile.append(view);}
 results.append(tile);
 });
 };
 if(new URLSearchParams(location.search).get('bag')==='1')header.querySelector('button.bag-button')?.click();
 const close=()=>dialog.close();
 trigger?.setAttribute('aria-haspopup','dialog');trigger?.setAttribute('aria-expanded','false');
 trigger?.addEventListener('click',()=>{render();dialog.showModal();document.documentElement.classList.add('rootx-search-open');trigger.setAttribute('aria-expanded','true');input.focus();});
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('rootx-search-open');trigger?.setAttribute('aria-expanded','false');trigger?.focus();});
 dialog.querySelector('.reference-close-search').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientY>r.bottom||e.clientY<r.top)close();}});
 input.addEventListener('input',render);clear.addEventListener('click',()=>{input.value='';render();input.focus();});
 document.addEventListener('rootx:catalogue-update',()=>{if(dialog.open)render();});
 dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();render();results.querySelector('a')?.focus();});
})();

