
(() => {
 const header=document.querySelector('.site-header');
 if(!header)return;
 const icons={"search":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m16 16 5 5\"/></svg>","account":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"7\" r=\"3.5\"/><path d=\"M4 21v-2a8 8 0 0 1 16 0v2\"/></svg>","bag":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 7h14l1 14H4L5 7z\"/><path d=\"M8 8V6a4 4 0 0 1 8 0v2\"/></svg>"};
 const desktopShop=document.createElement('a');desktopShop.className='reference-desktop-shop';desktopShop.href='#products';desktopShop.textContent='SHOP ALL';header.append(desktopShop);
 const account=header.querySelector('.rootx-account-link');
 if(account){const icon=document.createElement('span');icon.className='reference-account-icon';icon.innerHTML=icons.account;account.append(icon);account.setAttribute('aria-label','Login and track orders');}
 const bag=header.querySelector('.bag-button');
 if(bag){const icon=document.createElement('span');icon.className='reference-bag-icon';icon.innerHTML=icons.bag;bag.append(icon);}
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
 const dialog=document.createElement('dialog');dialog.className='reference-search-dialog';
 dialog.innerHTML='<form><label for="rootx-product-search">Search Birla RootX products</label><input id="rootx-product-search" name="query" type="search" placeholder="Product name" autocomplete="off"><button type="submit">SEARCH</button><button type="button" class="reference-close-search">CLOSE</button><p role="status" class="reference-search-status"></p></form>';
 document.body.append(dialog);
 header.querySelector('.reference-search-button')?.addEventListener('click',()=>dialog.showModal());
 dialog.querySelector('.reference-close-search').addEventListener('click',()=>dialog.close());
 dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const q=dialog.querySelector('input').value.trim().toLowerCase();const cards=[...document.querySelectorAll('.product-card')];const match=cards.find(card=>card.querySelector('h3').textContent.toLowerCase().includes(q));if(match){dialog.close();match.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});}else dialog.querySelector('.reference-search-status').textContent='No matching product. Try Carbs Slayer, Jacked, Spilan, Epic Burn or Growth Factor.';});
})();
