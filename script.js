const products = {
  carbs: { name: 'Carbs Slayer', price: 1999, image: 'carbs-slayer.jpg' },
  jacked: { name: 'Jacked Pre-Workout', price: 1999, image: 'jacked-pre-workout.jpg' },
  spilan: { name: 'Spilan Test', price: 1999, image: 'spilan-test.jpg' },
  epic: { name: 'Epic Burn Pro', price: 1999, image: 'epic-burn-pro.jpg' },
  growth: { name: 'Growth Factor', price: 1999, image: 'growth-factor.jpg' }
};
const bag = new Map();
const $ = (selector, root = document) => root.querySelector(selector);
const rupees = (value) => `₹${value.toLocaleString('en-IN')}`;

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
  $$('.cart-line-remove').forEach((button) => button.addEventListener('click', () => { bag.delete(button.dataset.remove); renderBag(); }));
}
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function openBag() {
  document.body.classList.add('cart-open');
  $('#cart-drawer').setAttribute('aria-hidden', 'false');
  $('.bag-button').setAttribute('aria-expanded', 'true');
  $('.cart-close').focus();
}
function closeBag() {
  document.body.classList.remove('cart-open');
  $('#cart-drawer').setAttribute('aria-hidden', 'true');
  $('.bag-button').setAttribute('aria-expanded', 'false');
}

$$('[data-product]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.product;
  const product = products[key];
  bag.set(key, (bag.get(key) || 0) + 1);
  renderBag();
  $('[data-toast-copy]').textContent = `${product.name} · ${rupees(product.price)}`;
  $('.toast').classList.add('visible');
  window.clearTimeout(window.birlaToastTimer);
  window.birlaToastTimer = window.setTimeout(() => $('.toast').classList.remove('visible'), 2800);
}));
$('.bag-button').addEventListener('click', openBag);
$('.cart-close').addEventListener('click', closeBag);
$('.cart-backdrop').addEventListener('click', closeBag);
$('.toast button').addEventListener('click', () => $('.toast').classList.remove('visible'));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeBag(); });

$('.menu-button').addEventListener('click', () => {
  const isOpen = $('.site-header').classList.toggle('menu-open');
  $('.menu-button').setAttribute('aria-expanded', String(isOpen));
});
$$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => {
  $('.site-header').classList.remove('menu-open');
  $('.menu-button').setAttribute('aria-expanded', 'false');
}));
