const products = {
  carbs: {
    name: 'Carbs Slayer', slug: 'carbs-slayer', price: 1999, image: 'carbs-slayer.jpg', number: '01',
    type: '60 capsules · Partitioning complex', format: '60 capsules', category: 'Health supplement',
    summary: 'The supplied front label describes Carbs Slayer as a nutrient partitioning complex. The pack shown contains 60 capsules.',
    packNotes: ['Cutting edge nutrient partitioning complex', '60 capsules', 'Health supplement'],
    tone: 'olive'
  },
  jacked: {
    name: 'Jacked Pre-Workout', slug: 'jacked-pre-workout', price: 1999, image: 'jacked-pre-workout.jpg', number: '02',
    type: '40 concentrated scoops', format: '40 ultra-concentrated scoops', category: 'Dietary supplement',
    summary: 'A pre-workout product presented in a concentrated scoop format. Its front label names a training matrix and an advance formula.',
    packNotes: ['Pre-workout formula', 'Training matrix · advance formula', '40 ultra-concentrated scoops'],
    tone: 'purple'
  },
  spilan: {
    name: 'Spilan Test', slug: 'spilan-test', price: 1999, image: 'spilan-test.jpg', number: '03',
    type: '60 capsules · Featuring SA3X™', format: '60 capsules', category: 'Health supplement',
    summary: 'The supplied front label names SA3X™ and describes a specialised extract. The pack shown contains 60 capsules.',
    packNotes: ['Featuring SA3X™', 'Specialised extract', '60 capsules'],
    tone: 'sage'
  },
  epic: {
    name: 'Epic Burn Pro', slug: 'epic-burn-pro', price: 1999, image: 'epic-burn-pro.jpg', number: '04',
    type: '60 capsules · Thermogenic formula', format: '60 capsules', category: 'Dietary supplement',
    summary: 'Epic Burn Pro is presented on its front label as a thermogenic formula. The pack shown contains 60 capsules.',
    packNotes: ['Thermogenic formula', '60 capsules', 'Dietary supplement'],
    tone: 'rose'
  },
  growth: {
    name: 'Growth Factor', slug: 'growth-factor', price: 1999, image: 'growth-factor.jpg', number: '05',
    type: '60 capsules · Sleep support formula', format: '60 capsules', category: 'Health supplement',
    summary: 'The supplied front label identifies Growth Factor as a sleep support formula. The pack shown contains 60 capsules.',
    packNotes: ['Sleep support formula', '60 capsules', 'Health supplement'],
    tone: 'blue'
  }
};
window.BIRLAROOTX_PRODUCTS = products;
const bag = new Map();
const $ = (selector, root = document) => root.querySelector(selector);
const rupees = (value) => `₹${value.toLocaleString('en-IN')}`;
const productList = Object.values(products);

function setSeoMetaContent(selector, attributes, content) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function renderBag() {
  const entries = [...bag.entries()];
  const itemCount = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const subtotal = entries.reduce((sum, [key, quantity]) => sum + products[key].price * quantity, 0);
  $('.bag-count').textContent = itemCount;
  $('.cart-drawer-count').textContent = `(${itemCount})`;
  $('.cart-subtotal').textContent = rupees(subtotal);
  $('.cart-empty').classList.toggle('visible', entries.length === 0);
  $('.cart-items').innerHTML = entries.map(([key, quantity]) => {
    const product = products[key];
    return `<div class="cart-line"><img src="${product.image}" alt="" /><div><h3>${product.name}</h3><p>Qty ${quantity} · ${rupees(product.price)} each</p></div><span class="cart-line-price">${rupees(product.price * quantity)}</span><button class="cart-line-remove" type="button" data-remove="${key}">Remove</button></div>`;
  }).join('');
  $('.cart-line-remove').forEach((button) => button.addEventListener('click', () => { bag.delete(button.dataset.remove); renderBag(); }));

  document.querySelectorAll('[data-product]').forEach((button) => {
    const isAdded = bag.has(button.dataset.product);
    const labelNode = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    const icon = button.querySelector('span');

    if (labelNode) labelNode.textContent = isAdded ? 'Added to cart ' : 'Add to cart ';
    if (icon) icon.textContent = isAdded ? '✓' : '+';
    button.setAttribute('aria-pressed', String(isAdded));
  });
}
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function renderProductPage() {
  const page = $('[data-product-page]');
  if (!page) return;

  const requestedSlug = new URLSearchParams(window.location.search).get('product');
  const product = productList.find((item) => item.slug === requestedSlug) || products.carbs;
  const productIndex = productList.indexOf(product);
  const detailImage = $('[data-detail-image]');

  const seoDescription = `${product.name} by Birla RootX. ${product.summary} Price ₹1,999.`;
  const canonicalUrl = `https://birlarootx.com/product.html?product=${encodeURIComponent(product.slug)}`;
  const imageUrl = `https://birlarootx.com/${product.image}`;

  document.title = `${product.name} | Birla RootX`;
  $('meta[name="description"]')?.setAttribute('content', seoDescription);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  setSeoMetaContent('meta[property="og:title"]', { property: 'og:title' }, document.title);
  setSeoMetaContent('meta[property="og:description"]', { property: 'og:description' }, seoDescription);
  setSeoMetaContent('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
  setSeoMetaContent('meta[property="og:image"]', { property: 'og:image' }, imageUrl);
  setSeoMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, document.title);
  setSeoMetaContent('meta[name="twitter:description"]', { name: 'twitter:description' }, seoDescription);
  setSeoMetaContent('meta[name="twitter:image"]', { name: 'twitter:image' }, imageUrl);

  const structuredData = document.getElementById('product-structured-data');
  if (structuredData) {
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          '@id': `${canonicalUrl}#product`,
          name: product.name,
          url: canonicalUrl,
          image: [imageUrl],
          description: product.summary,
          category: product.category,
          brand: { '@type': 'Brand', name: 'Birla RootX' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://birlarootx.com/' },
            { '@type': 'ListItem', position: 2, name: 'Performance Series', item: 'https://birlarootx.com/#products' },
            { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl }
          ]
        }
      ]
    });
  }

  page.dataset.tone = product.tone;
  $$('[data-detail-number]').forEach((element) => { element.textContent = product.number; });
  $$('[data-detail-name]').forEach((element) => { element.textContent = product.name; });
  $('[data-detail-type]').textContent = product.type;
  $('[data-detail-summary]').textContent = product.summary;
  $('[data-detail-format]').textContent = product.format;
  $('[data-detail-category]').textContent = product.category;
  $('[data-detail-price]').textContent = rupees(product.price);
  detailImage.src = product.image;
  detailImage.alt = `${product.name} by Birla RootX, ${product.format}`;
  $('[data-detail-add]').dataset.product = Object.keys(products).find((key) => products[key] === product);
  $('[data-pack-notes]').innerHTML = product.packNotes.map((note) => `<li>${note}</li>`).join('');
  const related = productList.filter((item) => item !== product);
  $('[data-related-products]').innerHTML = related.map((item) => `
    <a class="related-card" href="product.html?product=${item.slug}">
      <span class="related-image related-image-${item.tone}"><img src="${item.image}" alt="" loading="lazy" /></span>
      <span class="related-card-copy"><span>${item.number} / BIRLA ROOTX</span><b>${item.name}</b><i>Explore ↗</i></span>
    </a>`).join('');

  const previous = productList[(productIndex + productList.length - 1) % productList.length];
  const next = productList[(productIndex + 1) % productList.length];
  $('[data-detail-prev]').href = `product.html?product=${previous.slug}`;
  $('[data-detail-prev] span').textContent = previous.name;
  $('[data-detail-next]').href = `product.html?product=${next.slug}`;
  $('[data-detail-next] span').textContent = next.name;
}
renderProductPage();

function openBag() {
  window.birlaPreviousFocus = document.activeElement;
  document.body.classList.add('cart-open');
  document.body.style.overflow = 'hidden';
  $('#cart-drawer').setAttribute('aria-hidden', 'false');
  $('.bag-button').setAttribute('aria-expanded', 'true');
  $('.cart-close').focus();
}
function closeBag() {
  document.body.classList.remove('cart-open');
  document.body.style.overflow = '';
  $('#cart-drawer').setAttribute('aria-hidden', 'true');
  $('.bag-button').setAttribute('aria-expanded', 'false');
  if (window.birlaPreviousFocus instanceof HTMLElement) window.birlaPreviousFocus.focus();
}

document.querySelectorAll('[data-product]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.product;
  const product = products[key];
  bag.set(key, (bag.get(key) || 0) + 1);
  renderBag();

  const toast = $('.toast');
  $('[data-toast-copy]').textContent = `${product.name} · ${rupees(product.price)}`;
  toast.classList.remove('visible');
  void toast.offsetWidth;
  toast.classList.add('visible');

  window.clearTimeout(window.birlaToastTimer);
  window.birlaToastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2800);
}));
$('.bag-button').addEventListener('click', openBag);
$('.cart-close').addEventListener('click', closeBag);
$('.cart-backdrop').addEventListener('click', closeBag);
$('.toast button').addEventListener('click', () => $('.toast').classList.remove('visible'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeBag(); });
$('#cart-drawer').addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])', $('#cart-drawer'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

const featureImage = $('[data-hero-image]');
if (featureImage) {
  let activeFeature = 0;
  const showFeature = (index) => {
    activeFeature = (index + productList.length) % productList.length;
    const product = productList[activeFeature];
    featureImage.src = product.image;
    featureImage.alt = `Birla RootX ${product.name} supplement pack`;
    $('[data-hero-name]').textContent = product.name.toUpperCase();
    $('[data-hero-index]').textContent = `${product.number} — 05`;
    $('[data-hero-price]').textContent = rupees(product.price);
    $('[data-hero-link]').href = `product.html?product=${product.slug}`;
    $$('[data-slide-to]').forEach((button, buttonIndex) => button.setAttribute('aria-current', String(buttonIndex === activeFeature)));
  };
  $('[data-slide-prev]').addEventListener('click', () => showFeature(activeFeature - 1));
  $('[data-slide-next]').addEventListener('click', () => showFeature(activeFeature + 1));
  $('[data-slide-to]').forEach((button) => button.addEventListener('click', () => showFeature(Number(button.dataset.slideTo))));

  const featureLink = $('[data-hero-link]');
  let touchStartX = 0;
  let touchStartY = 0;
  let suppressFeatureClick = false;

  featureLink.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  featureLink.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const isHorizontalSwipe = Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15;

    if (!isHorizontalSwipe) return;

    event.preventDefault();
    suppressFeatureClick = true;
    showFeature(activeFeature + (deltaX < 0 ? 1 : -1));
    window.setTimeout(() => { suppressFeatureClick = false; }, 350);
  }, { passive: false });

  featureLink.addEventListener('click', (event) => {
    if (suppressFeatureClick) {
      event.preventDefault();
      return;
    }

    if (!window.matchMedia('(pointer: fine)').matches) return;

    event.preventDefault();
    const bounds = featureLink.getBoundingClientRect();
    const clickedLeftHalf = event.clientX - bounds.left < bounds.width / 2;
    showFeature(activeFeature + (clickedLeftHalf ? -1 : 1));
  });
}

$('.menu-button').addEventListener('click', () => {
  const isOpen = $('.site-header').classList.toggle('menu-open');
  $('.menu-button').setAttribute('aria-expanded', String(isOpen));
});
$$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => {
  $('.site-header').classList.remove('menu-open');
  $('.menu-button').setAttribute('aria-expanded', 'false');
}));
