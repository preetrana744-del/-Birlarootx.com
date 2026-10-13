const products = {
  carbs: {
    name: 'Carbs Slayer', slug: 'carbs-slayer', price: 2499, image: 'carbs-slayer.jpg', number: '01',
    type: '60 capsules · Partitioning complex', format: '60 capsules', category: 'Health supplement',
    summary: "A 60-capsule health supplement labeled as a nutrient partitioning complex. Each label serving contains 290 mg Berberis Aristata Extract (Berberine Hcl 98%) and 10 mg Banaba.",
    packNotes: ['Cutting edge nutrient partitioning complex', '60 capsules', 'Health supplement'],
    tone: 'olive'
  },
  jacked: {
    name: 'Jacked Pre-Workout', slug: 'jacked-pre-workout', price: 2999, image: 'jacked-pre-workout.jpg', number: '02',
    type: '40 ultra-concentrated scoops', format: '40 ultra-concentrated scoops', category: 'Dietary supplement',
    summary: "Blue Raspberry pre-workout with 40 servings per container. Each 5 g scoop lists 100 mg natural caffeine, 2 g L Arginine Hydrochloride, 2 g L Citrulline Malate, Theobroma Cacao Extract and Bacopa Monnieri Extract.",
    packNotes: ['The ultimate pre-workout', 'Training matrix · advance formula', '40 ultra-concentrated scoops'],
    tone: 'purple'
  },
  spilan: {
    name: 'Spilan Test', slug: 'spilan-test', price: 2999, image: 'spilan-test.jpg', number: '03',
    type: '60 capsules · Featuring SA3X™', format: '60 capsules', category: 'Health supplement',
    summary: "A 60-capsule health supplement featuring SA3X on the front label. Each label serving contains 500 mg Akarkara Extract in a vegetable cellulose capsule.",
    packNotes: ['Featuring SA3X™', 'Specialised ultra potent extract', '60 capsules'],
    tone: 'sage'
  },
  epic: {
    name: 'Epic Burn Pro', slug: 'epic-burn-pro', price: 2499, image: 'epic-burn-pro.jpg', number: '04',
    type: '60 capsules · Thermogenic formula', format: '60 capsules', category: 'Nutraceutical',
    summary: "A 60-capsule nutraceutical labeled as a thermogenic formula. Its ingredient panel lists natural caffeine, Theobroma Cacao Extract, Dandelion root extract and Coleus Forskohlii Extract.",
    packNotes: ['Super thermogenic', '60 capsules', 'Nutraceutical'],
    tone: 'rose'
  },
  growth: {
    name: 'Growth Factor', slug: 'growth-factor', price: 2499, image: 'growth-factor.jpg', number: '05',
    type: '60 capsules · Sleep support formula', format: '60 capsules', category: 'Health supplement',
    summary: "A 60-capsule health supplement labeled as a sleep support formula. Each label serving contains 375 mg Mucuna Pruriens Seed Extract (Velvet Bean) and 375 mg Chlorophytum Borivilianum Extract.",
    packNotes: ['Sleep support formula', '60 capsules', 'Health supplement'],
    tone: 'blue'
  }
};
const labelShared = {
  "storage": "Store at a temperature below 25C in a dry place. Keep out of reach of children.",
  "cautions": [
    "Health supplement is not to be used as substitute for a varied diet.",
    "This product is not intended to diagnose, treat, cure or prevent any disease.",
    "NOT FOR MEDICINAL USE.",
    "Warning: Not to exceed recommended usage."
  ],
  "notRecommendedFor": [
    "Children",
    "Pregnant lactating women",
    "People with liver & kidney disease."
  ],
  "nutritionFootnote": "%RDA is based on Men/Women sedentary work as per ICMR. # RDA value not established.",
  "manufacturer": "Stiriti Ayur Therapies Pvt Ltd.",
  "manufacturerAddress": "H.No. 3-20, Sy No 170 & 180, Cheekatmamidi Village, Bommalaramaram Mandal, Yadadri-Bhangir District-508116, Telangana State, India.",
  "license": "10018047001030",
  "exclusivelyFor": "RootX Wellness LLP, 55, Westend Marg, Saket New Delhi: 110030",
  "shelfLife": "Best before 36 months from manufacturing date.",
  "website": "birlarootx.com",
  "email": "rootx1212@gmail.com",
  "customerCare": "+91 8448875888"
};
const productLabels = {
  "carbs": {
    "mrp": 2499,
    "servingSize": "1 Veg Capsule",
    "servings": 60,
    "ingredients": [
      [
        "Berberis Aristata Extract (Berberine Hcl 98%)",
        "290 mg"
      ],
      [
        "Banaba",
        "10 mg"
      ]
    ],
    "otherIngredients": "Vegetable cellulose (capsule)",
    "nutrition": [
      [
        "Energy",
        "1 Kcal"
      ],
      [
        "Carbohydrate",
        "0.3 g"
      ],
      [
        "Sugar",
        "0 g"
      ],
      [
        "Protein",
        "0 g"
      ],
      [
        "Fat",
        "0 g"
      ]
    ],
    "directions": "Take 2 capsules right before carbohydrates containing meal.",
    "barcode": "8937636532341"
  },
  "jacked": {
    "mrp": 2999,
    "servingSize": "1 scoop (5 grams)",
    "servings": 40,
    "ingredients": [
      [
        "Natural Caffeine (from coffee bean extract)",
        "100 mg"
      ],
      [
        "L Arginine Hydrochloride",
        "2 grams"
      ],
      [
        "L Citrulline Malate",
        "2 grams"
      ],
      [
        "Theobroma Cacao Extract",
        "200 mg"
      ],
      [
        "Bacopa Monnieri Extract (50% Bacosides)",
        "300 mg"
      ]
    ],
    "otherIngredients": "Citric Acid, Erythritol, Blue Raspberry Natural Flavouring, Sucralose, Silicon Dioxide",
    "nutrition": [
      [
        "Energy",
        "15 Kcal"
      ],
      [
        "Carbohydrate",
        "3.5 g"
      ],
      [
        "Sugar",
        "0 g"
      ],
      [
        "Protein",
        "0 g"
      ],
      [
        "Fat",
        "0 g"
      ]
    ],
    "directions": "Mix 1 Ultra-Concentrated Scoop (5g) with 300ml of cold water and consume 30-45 minutes prior to resistance training. Do this the first 3 times using the product. Beginning with the 4th use, if needed, you may gradually increase to 2 scoops. (10g)",
    "flavour": "Blue Raspberry",
    "barcode": "8937636453158"
  },
  "spilan": {
    "mrp": 2999,
    "servingSize": "1 Veg Capsule",
    "servings": 60,
    "ingredients": [
      [
        "Akarkara Extract",
        "500 mg"
      ]
    ],
    "otherIngredients": "Vegetable Cellulose (capsule)",
    "nutrition": [
      [
        "Energy",
        "2 Kcal"
      ],
      [
        "Carbohydrate",
        "0.5 g"
      ],
      [
        "Sugar",
        "0 g"
      ],
      [
        "Protein",
        "0 g"
      ],
      [
        "Fat",
        "0 g"
      ]
    ],
    "directions": "Take 2 capsules once a day.",
    "barcode": "8937636611534"
  },
  "epic": {
    "mrp": 2499,
    "servingSize": "1 Veg Capsule",
    "servings": 60,
    "ingredients": [
      [
        "Natural caffeine (from coffee bean extract)",
        "100 mg"
      ],
      [
        "Theobroma Cacao Extract",
        "200 mg"
      ],
      [
        "Dandelion root extract",
        "150 mg"
      ],
      [
        "Coleus Forskohlii Extract (10% forskolin)",
        "300 mg"
      ]
    ],
    "otherIngredients": "Vegetable cellulose (capsule)",
    "nutrition": [
      [
        "Energy",
        "3 Kcal"
      ],
      [
        "Carbohydrate",
        "0.6 g"
      ],
      [
        "Sugar",
        "0 g"
      ],
      [
        "Protein",
        "0 g"
      ],
      [
        "Fat",
        "0 g"
      ]
    ],
    "directions": "Begin by taking one capsule on an empty stomach 15-30 minutes before breakfast. Consume an additional one capsule 5-6 hours later. Do not consume more than 3 capsules in 24 hours period.",
    "barcode": "8937636373968"
  },
  "growth": {
    "mrp": 2499,
    "servingSize": "1 Veg Capsule",
    "servings": 60,
    "ingredients": [
      [
        "Mucuna Pruriens Seed Extract (Velvet Bean)",
        "375 mg"
      ],
      [
        "Chlorophytum Borivilianum Extract",
        "375 mg"
      ]
    ],
    "otherIngredients": "Vegetable cellulose (capsule)",
    "nutrition": [
      [
        "Energy",
        "3 Kcal"
      ],
      [
        "Carbohydrate",
        "0.6 g"
      ],
      [
        "Sugar",
        "0 g"
      ],
      [
        "Protein",
        "0 g"
      ],
      [
        "Fat",
        "0 g"
      ]
    ],
    "directions": "Take 2-3 Capsules Before Bed. For Best Results, Consume No More Than 5 Grams Of Carbohydrates Within 60 Minutes Of Taking Growth Factor.",
    "barcode": "8937636690720"
  }
};
Object.entries(productLabels).forEach(([key, label]) => { products[key].label = label; products[key].labelImage = products[key].slug + '-label.svg'; });
window.BIRLAROOTX_PRODUCTS = products;
const CART_STORAGE_KEY = 'birlarootx-cart-v1';
const bag = new Map();

function loadBag() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return;
    const latest = new Map();
    saved.forEach((entry) => {
      if (!Array.isArray(entry) || entry.length !== 2) return;
      const [key, quantity] = entry;
      const qty = Math.floor(Number(quantity));
      if (Object.hasOwn(products, key) && Number.isSafeInteger(qty) && qty > 0) latest.set(key, qty);
    });
    bag.clear();
    latest.forEach((quantity, key) => bag.set(key, quantity));
  } catch (_) {}
}

function saveBag() {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...bag.entries()]));
  } catch (_) {}
}

loadBag();
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

function updateCartButtons() {
  document.querySelectorAll('[data-product]').forEach((button) => {
    const isAdded = bag.has(button.dataset.product);
    button.innerHTML = isAdded ? 'Remove from cart <span>−</span>' : 'Add to cart <span>+</span>';
    button.setAttribute('aria-pressed', String(isAdded));
    button.setAttribute('aria-label', `${isAdded ? 'Remove' : 'Add'} ${products[button.dataset.product].name} ${isAdded ? 'from' : 'to'} cart`);
  });
}

function renderBag() {
  const entries = [...bag.entries()];
  const itemCount = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const subtotal = entries.reduce((sum, [key, quantity]) => sum + products[key].price * quantity, 0);

  const bagCount = $('.bag-count');
  const drawerCount = $('.cart-drawer-count');
  const subtotalNode = $('.cart-subtotal');
  const emptyNode = $('.cart-empty');
  const itemsNode = $('.cart-items');

  if (bagCount) bagCount.textContent = itemCount;
  if (drawerCount) drawerCount.textContent = `(${itemCount})`;
  if (subtotalNode) subtotalNode.textContent = rupees(subtotal);
  if (emptyNode) emptyNode.classList.toggle('visible', entries.length === 0);

  if (itemsNode) {
    itemsNode.innerHTML = entries.map(([key, quantity]) => {
      const product = products[key];
      return `<div class="cart-line"><img src="${product.image}" alt="" /><div class="cart-line-copy"><h3>${product.name}</h3><p>${rupees(product.price)} each</p></div><span class="cart-line-price">${rupees(product.price * quantity)}</span><div class="cart-quantity" role="group" aria-label="${product.name} quantity"><button type="button" data-quantity="${key}" data-quantity-change="-1" aria-label="Decrease ${product.name} quantity" ${quantity === 1 ? 'disabled' : ''}>−</button><output aria-label="${product.name} quantity">${quantity}</output><button type="button" data-quantity="${key}" data-quantity-change="1" aria-label="Increase ${product.name} quantity">+</button></div><button class="cart-line-remove" type="button" data-remove="${key}" aria-label="Remove ${product.name} from bag">Remove <span aria-hidden="true">×</span></button></div>`;
    }).join('');
  }

  updateCartButtons();
}
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


function renderLabelDetails(product) {
  const label = product.label;
  const panel = $('[data-label-details]');
  if (!label || !panel) return;

  const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const list = (items) => '<ul class="label-list">' + items.map((item) => '<li>' + escapeText(item) + '</li>').join('') + '</ul>';
  const fact = (heading, value) => '<div class="label-fact"><dt>' + escapeText(heading) + '</dt><dd>' + escapeText(value) + '</dd></div>';
  const meta = (heading, value) => '<div><dt>' + escapeText(heading) + '</dt><dd>' + escapeText(value) + '</dd></div>';
  const disclosure = (heading, content) => '<details class="label-disclosure"><summary>' + escapeText(heading) + '</summary><div class="label-disclosure-content">' + content + '</div></details>';

  const ingredientRows = label.ingredients.map(([name, amount]) => '<tr><th scope="row">' + escapeText(name) + '</th><td>' + escapeText(amount) + '</td></tr>').join('');
  const nutrition = Array.isArray(label.nutrition) && label.nutrition.length
    ? '<section class="label-panel"><h3 class="label-panel-heading">Nutrition information</h3>' +
      '<table class="label-table" aria-label="Nutrition information per serving"><thead><tr><th scope="col">Nutrient</th><th scope="col">Per serving</th><th scope="col">%RDA</th></tr></thead><tbody>' +
      label.nutrition.map(([name, amount]) => '<tr><th scope="row">' + escapeText(name) + '</th><td>' + escapeText(amount) + '</td><td>#</td></tr>').join('') +
      '</tbody></table><p class="label-footnote">' + escapeText(labelShared.nutritionFootnote) + '</p></section>'
    : '';

  panel.innerHTML =
    '<dl class="label-facts">' +
      fact('Serving size', label.servingSize) +
      fact('Servings per container', label.servings) +
      (label.flavour ? fact('Flavour', label.flavour) : '') +
    '</dl>' +
    '<section class="label-panel"><h3 class="label-panel-heading">Active ingredients</h3>' +
      '<table class="label-table" aria-label="Active ingredients and amount per serving"><thead><tr><th scope="col">Ingredient</th><th scope="col">Amount per serving</th></tr></thead><tbody>' + ingredientRows + '</tbody></table>' +
      '<p class="label-footnote"><strong>Other ingredients</strong><br />' + escapeText(label.otherIngredients) + '</p>' +
    '</section>' +
    nutrition +
    '<section class="label-panel label-directions"><h3 class="label-panel-heading">Directions printed on the label</h3><p>' + escapeText(label.directions) + '</p></section>' +
    '<div class="label-disclosures">' +
      disclosure('Storage and cautions', list([labelShared.storage, ...labelShared.cautions])) +
      disclosure('Not recommended for', list(labelShared.notRecommendedFor)) +
      disclosure('Pack and manufacturer details', '<dl class="label-meta">' +
        meta('MRP', rupees(label.mrp) + ' (inclusive of all taxes)') +
        meta('Shelf life', labelShared.shelfLife) +
        meta('Manufactured and marketed by', labelShared.manufacturer) +
        meta('Manufacturer address', labelShared.manufacturerAddress) +
        meta('FSSAI licence number', labelShared.license) +
        meta('Manufactured exclusively for', labelShared.exclusivelyFor) +
        meta('Website', labelShared.website) +
        meta('Email', labelShared.email) +
        meta('Customer care', labelShared.customerCare) +
        meta('Barcode', label.barcode) +
      '</dl>') +
      disclosure('Full label artwork', '<img class="label-artwork" src="' + escapeText(product.labelImage) + '" alt="' + escapeText(product.name) + ' complete product label" loading="lazy" />') +
    '</div>';
}

function renderProductPage() {
  const page = $('[data-product-page]');
  if (!page) return;

  const requestedSlug = new URLSearchParams(window.location.search).get('product');
  const product = productList.find((item) => item.slug === requestedSlug) || products.carbs;
  const productIndex = productList.indexOf(product);
  const detailImage = $('[data-detail-image]');

  const seoDescription = `${product.name} by Birla RootX. ${product.summary} MRP ${rupees(product.price)} (inclusive of all taxes).`;
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
  $$('[data-detail-name]').forEach((element) => { element.textContent = product.name; });
  $('[data-detail-type]').textContent = product.type;
  $('[data-detail-summary]').textContent = product.summary;
  $('[data-detail-format]').textContent = product.format;
  $('[data-detail-category]').textContent = product.category;
  $$('[data-detail-price]').forEach((element) => { element.textContent = rupees(product.price); });
  const stickyName = $('[data-sticky-name]');
  if (stickyName) stickyName.textContent = product.name;
  detailImage.src = product.image;
  detailImage.alt = `${product.name} by Birla RootX, ${product.format}`;
  $('[data-detail-add]').dataset.product = Object.keys(products).find((key) => products[key] === product);
  const stickyAdd = $('[data-sticky-add]');
  if (stickyAdd) stickyAdd.dataset.product = $('[data-detail-add]').dataset.product;
  renderLabelDetails(product);
  const highlights = $('[data-detail-highlights]');
  if (highlights) highlights.innerHTML = product.packNotes.map((note) => `<li>${note}</li>`).join('');
  const viewerImage = $('[data-viewer-image]');
  if (viewerImage) {
    viewerImage.src = product.image;
    viewerImage.alt = detailImage.alt;
    $('[data-viewer-name]').textContent = product.name;
    $('[data-image-open]').setAttribute('aria-label', `View ${product.name} image`);
  }
  const related = productList.filter((item) => item !== product);
  $('[data-related-products]').innerHTML = related.map((item) => `
    <a class="related-card" href="product.html?product=${item.slug}">
      <span class="related-image related-image-${item.tone}"><img src="${item.image}" alt="" loading="lazy" /></span>
      <span class="related-card-copy"><span>BIRLA ROOTX</span><b>${item.name}</b><i>Explore</i></span>
    </a>`).join('');

  const previous = productList[(productIndex + productList.length - 1) % productList.length];
  const next = productList[(productIndex + 1) % productList.length];
  $('[data-detail-prev]').href = `product.html?product=${previous.slug}`;
  $('[data-detail-prev] span').textContent = previous.name;
  $('[data-detail-next]').href = `product.html?product=${next.slug}`;
  $('[data-detail-next] span').textContent = next.name;
}
renderProductPage();
renderBag();

const imageViewer = $('#product-image-viewer');
if (imageViewer && typeof imageViewer.showModal === 'function') {
  const imageOpener = $('[data-image-open]');
  const imageStage = $('[data-image-stage]');
  const imageZoom = $('[data-image-zoom]');
  let previousOverflow = '';
  const resetImageZoom = () => {
    imageStage.classList.remove('is-zoomed');
    imageZoom.setAttribute('aria-pressed', 'false');
    imageZoom.innerHTML = 'Zoom in <span aria-hidden="true">+</span>';
    imageStage.scrollTop = 0;
    imageStage.scrollLeft = 0;
  };
  imageOpener.addEventListener('click', () => {
    resetImageZoom();
    previousOverflow = document.body.style.overflow;
    imageViewer.showModal();
    document.body.classList.add('image-viewer-open');
    document.body.style.overflow = 'hidden';
    $('[data-image-close]').focus();
  });
  $('[data-image-close]').addEventListener('click', () => imageViewer.close());
  imageViewer.addEventListener('close', () => {
    document.body.classList.remove('image-viewer-open');
    document.body.style.overflow = previousOverflow;
    resetImageZoom();
    imageOpener.focus();
  });
  imageViewer.addEventListener('click', (event) => {
    if (event.target !== imageViewer) return;
    const bounds = imageViewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageViewer.close();
  });
  imageZoom.addEventListener('click', () => {
    const zoomed = imageStage.classList.toggle('is-zoomed');
    imageZoom.setAttribute('aria-pressed', String(zoomed));
    imageZoom.innerHTML = zoomed ? 'Fit image <span aria-hidden="true">−</span>' : 'Zoom in <span aria-hidden="true">+</span>';
    imageStage.scrollLeft = zoomed ? Math.max(0, (imageStage.scrollWidth - imageStage.clientWidth) / 2) : 0;
    imageStage.scrollTop = zoomed ? Math.max(0, (imageStage.scrollHeight - imageStage.clientHeight) / 2) : 0;
  });
} else if ($('[data-image-open]')) {
  $('[data-image-open]').hidden = true;
}

function openBag() {
  syncBag();
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

function syncBag() {
  loadBag();
  renderBag();
}

function showCartFeedback(product, isRemoving) {
  const toast = $('.toast');
  const toastCopy = $('[data-toast-copy]');
  const toastTitle = $('.toast b');
  if (toastTitle) toastTitle.textContent = isRemoving ? 'Removed from cart' : 'Added to cart';
  if (toastCopy) toastCopy.textContent = `${product.name} · ${rupees(product.price)}`;
  if (toast) {
    toast.classList.remove('visible');
    void toast.offsetWidth;
    toast.classList.add('visible');
    window.clearTimeout(window.birlaToastTimer);
    window.birlaToastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2800);
  }
}

// Reconcile shared cart state when another tab changes it or a page is restored.
window.addEventListener('storage', (event) => {
  if (event.storageArea === window.localStorage && (event.key === CART_STORAGE_KEY || event.key === null)) syncBag();
});
window.addEventListener('pageshow', syncBag);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') syncBag();
});

document.addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity-change]');
  if (quantityButton) {
    const key = quantityButton.dataset.quantity;
    const change = Number(quantityButton.dataset.quantityChange);
    if (!Object.hasOwn(products, key) || (change !== -1 && change !== 1)) return;
    loadBag();
    const quantity = bag.get(key);
    if (quantity === undefined) {
      renderBag();
      $('.cart-close')?.focus();
      return;
    }
    const next = quantity + change;
    if (!Number.isSafeInteger(next) || next < 1 || !Number.isSafeInteger(next * products[key].price)) return;
    bag.set(key, next);
    saveBag();
    renderBag();
    const updatedButton = $(`[data-quantity="${key}"][data-quantity-change="${change}"]`);
    (updatedButton?.disabled ? $(`[data-quantity="${key}"][data-quantity-change="1"]`) : updatedButton)?.focus();
    const toast = $('.toast');
    if (toast) {
      $('.toast b').textContent = 'Quantity updated';
      $('[data-toast-copy]').textContent = `${products[key].name} · Qty ${next} · ${rupees(products[key].price * next)}`;
      toast.classList.add('visible');
      window.clearTimeout(window.birlaToastTimer);
      window.birlaToastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2800);
    }
    return;
  }

  const removeButton = event.target.closest('.cart-line-remove');
  if (removeButton) {
    const key = removeButton.dataset.remove;
    const product = products[key];
    if (!product) return;
    loadBag();
    bag.delete(key);
    saveBag();
    renderBag();
    showCartFeedback(product, true);
    ($('.cart-line-remove') || $('.cart-close'))?.focus();
    return;
  }

  const addButton = event.target.closest('[data-product]');
  if (addButton) {
    const key = addButton.dataset.product;
    const product = products[key];
    if (!product) return;

    loadBag();
    const isRemoving = addButton.getAttribute('aria-pressed') === 'true';
    if (isRemoving) bag.delete(key);
    else if (!bag.has(key)) bag.set(key, 1);
    saveBag();
    renderBag();
    showCartFeedback(product, isRemoving);
  }
});

$('.bag-button').addEventListener('click', openBag);
$('.cart-close').addEventListener('click', closeBag);
$('.cart-backdrop').addEventListener('click', closeBag);
$('.toast button').addEventListener('click', () => $('.toast').classList.remove('visible'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && document.body.classList.contains('cart-open')) closeBag(); });
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
  const featureLink = $('[data-hero-link]');
  const featurePanel = featureLink.closest('.hero-visual') || featureLink;
  const featureName = $('[data-hero-name]');
  let activeFeature = 0;
  let gesture = null;
  let suppressFeatureClickUntil = 0;

  featurePanel.setAttribute('role', 'region');
  featurePanel.setAttribute('aria-roledescription', 'carousel');
  featurePanel.setAttribute('aria-label', 'Featured products');
  featureName.setAttribute('aria-live', 'polite');
  featureImage.draggable = false;
  featureLink.draggable = false;

  const showFeature = (index) => {
    activeFeature = (index + productList.length) % productList.length;
    const product = productList[activeFeature];
    featureImage.src = product.image;
    featureImage.alt = `Birla RootX ${product.name} supplement pack`;
    featureName.textContent = product.name.toUpperCase();
    $('[data-hero-price]').textContent = rupees(product.price);
    featureLink.href = `product.html?product=${product.slug}`;
    featureLink.setAttribute('aria-label', `Explore ${product.name}`);
    $$('[data-slide-to]').forEach((button, buttonIndex) => button.setAttribute('aria-current', String(buttonIndex === activeFeature)));
  };
  $('[data-slide-prev]').addEventListener('click', () => showFeature(activeFeature - 1));
  $('[data-slide-next]').addEventListener('click', () => showFeature(activeFeature + 1));
  $$('[data-slide-to]').forEach((button) => button.addEventListener('click', () => showFeature(Number(button.dataset.slideTo))));

  const resetDrag = () => {
    featurePanel.classList.remove('is-dragging');
    featurePanel.style.removeProperty('--hero-drag-x');
  };
  const detectAxis = (deltaX, deltaY) => {
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 10) return null;
    return Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? 'horizontal' : 'vertical';
  };

  featurePanel.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    suppressFeatureClickUntil = 0;
    if (event.target.closest('.hero-controls, button')) return;
    gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null
    };
  });

  window.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!gesture.axis) gesture.axis = detectAxis(deltaX, deltaY);
    if (gesture.axis !== 'horizontal') return;
    if (event.cancelable) event.preventDefault();
    if (!featurePanel.hasPointerCapture(event.pointerId)) featurePanel.setPointerCapture(event.pointerId);
    featurePanel.classList.add('is-dragging');
    const maxOffset = featurePanel.getBoundingClientRect().width * 0.025;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.18));
    featurePanel.style.setProperty('--hero-drag-x', `${offset}px`);
  });

  const finishGesture = (event, cancelled = false) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const currentGesture = gesture;
    gesture = null;
    const deltaX = event.clientX - currentGesture.startX;
    const deltaY = event.clientY - currentGesture.startY;
    const axis = currentGesture.axis || detectAxis(deltaX, deltaY);
    if (axis || cancelled) suppressFeatureClickUntil = performance.now() + 450;
    resetDrag();
    if (featurePanel.hasPointerCapture(event.pointerId)) featurePanel.releasePointerCapture(event.pointerId);
    if (!cancelled && axis === 'horizontal' && Math.abs(deltaX) >= 45) {
      showFeature(activeFeature + (deltaX < 0 ? 1 : -1));
    }
  };
  window.addEventListener('pointerup', (event) => finishGesture(event));
  window.addEventListener('pointercancel', (event) => finishGesture(event, true));
  featurePanel.addEventListener('lostpointercapture', (event) => finishGesture(event, true));
  window.addEventListener('blur', () => {
    if (gesture) suppressFeatureClickUntil = performance.now() + 450;
    const pointerId = gesture?.pointerId;
    gesture = null;
    resetDrag();
    if (pointerId !== undefined && featurePanel.hasPointerCapture(pointerId)) featurePanel.releasePointerCapture(pointerId);
  });

  // A drag must never also follow the product link or trigger a half-panel click.
  featurePanel.addEventListener('click', (event) => {
    if (performance.now() >= suppressFeatureClickUntil || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  featureLink.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.detail === 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    event.preventDefault();
    const bounds = featureLink.getBoundingClientRect();
    const clickedLeftHalf = event.clientX - bounds.left < bounds.width / 2;
    showFeature(activeFeature + (clickedLeftHalf ? -1 : 1));
  });

  featurePanel.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showFeature(activeFeature + (event.key === 'ArrowRight' ? 1 : -1));
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
