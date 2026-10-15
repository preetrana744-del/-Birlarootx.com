const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync(__dirname + '/../../account.js', 'utf8');
const originalCart = JSON.stringify([['carbs', 2], ['jacked', 1]]);
const user = { id: 'customer-1', email: 'buyer@example.test' };
const validSession = () => ({ user, access_token: 'user-access-token', expires_at: Math.floor(Date.now() / 1000) + 3600 });
const storage = initial => {
  const data = new Map(Object.entries(initial));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
};

async function fixture(options = {}) {
  const elements = new Map(), redirects = [], calls = [], rpcCalls = [], requestHeaders = [];
  const makeElement = id => ({
    id, hidden: false, disabled: false, value: '', textContent: '', innerHTML: '', required: false,
    firstChild: { textContent: '' }, parentElement: { hidden: false }, classList: { toggle() {} },
    listeners: new Map(), addEventListener(name, callback) { this.listeners.set(name, callback); },
    scrollIntoView() {}, querySelectorAll() { return []; }
  });
  const $ = id => { if (!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); };
  const inputs = ['shipping_name', 'shipping_phone', 'shipping_address'].map($);
  $('checkout-form').elements = Object.fromEntries(inputs.map(input => [input.id, input]));
  $('checkout-delivery').querySelectorAll = () => inputs;
  const localStorage = storage({ 'birlarootx-cart-v1': originalCart });
  const sessionStorage = options.sessionStorage || storage({});
  let authListener;
  const resultFor = table => {
    if (table === 'rootx_admin_users') return options.isAdmin ? { user_id: user.id } : null;
    if (table === 'rootx_profiles') return options.isAdmin ? [{ id: user.id, email: user.email, full_name: 'Buyer', phone: '9000000000' }] : { full_name: 'Buyer', phone: '9000000000' };
    if (table === 'rootx_orders') return options.orders || [];
    if (table === 'rootx_products') return [
      { slug: 'carbs-slayer', name: 'Carbs Slayer', price: 2499, active: true },
      { slug: 'jacked-pre-workout', name: 'Jacked Pre-Workout', price: 2999, active: true }
    ];
    return [];
  };
  const db = {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session: Object.hasOwn(options, 'session') ? options.session : validSession() }, error: null }),
      refreshSession: async () => { calls.push({ refresh: true }); return { data: { session: options.refreshedSession || validSession() }, error: null }; },
      onAuthStateChange(callback) { authListener = callback; }
    },
    from(table) {
      const result = { data: resultFor(table), error: null };
      const query = { select() { return this; }, order() { return this; }, eq() { return this; }, maybeSingle() { return Promise.resolve(result); }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } };
      return query;
    },
    functions: { invoke: async (name, request) => {
      calls.push({ name, request });
      return options.invoke ? options.invoke(name, request) : { data: { checkout_url: 'https://vbvfdy-ed.myshopify.com/cart/c/secure-cart' }, error: null };
    } },
    rpc: async (name, request) => { rpcCalls.push({ name, request }); return { data: { order_number: 'ROOTX-123' }, error: null }; }
  };
  const location = { hash: '', search: '?checkout=1', href: 'https://birlarootx.com/account.html?checkout=1', assign: url => redirects.push(url) };
  class FakeFormData {
    constructor() { this.data = { shipping_name: 'Buyer', shipping_phone: '9000000000', shipping_address: '123 Sample Road, Delhi' }; }
    get(key) { return this.data[key]; }
  }
  vm.runInNewContext(source, {
    window: { rootxAuth: db }, document: { getElementById: $, querySelectorAll: () => [] },
    location, history: { replaceState: () => { location.search = ''; } }, localStorage, sessionStorage,
    crypto: webcrypto, URL, URLSearchParams, AbortController, FormData: FakeFormData,
    setTimeout, clearTimeout,
    fetch: async (url, request) => {
      requestHeaders.push({ url, request });
      if (options.statusError) throw Error('unavailable');
      return { ok: options.statusHttpOk !== false, json: async () => ({ enabled: options.enabled === true }) };
    }
  });
  for (let i = 0; i < 20 && $('place-order').disabled; i++) await new Promise(resolve => setImmediate(resolve));
  // Startup begins with several database microtasks before the checkout button is disabled.
  for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));
  return { $, localStorage, sessionStorage, redirects, calls, rpcCalls, requestHeaders,
    submit: () => $('checkout-form').listeners.get('submit')({ preventDefault() {}, currentTarget: $('checkout-form') }),
    signOut: () => authListener('SIGNED_OUT') };
}

async function main() {
  {
    const app = await fixture({ enabled: false });
    assert.equal(app.$('place-order').textContent, 'Submit order request →');
    assert.equal(app.$('checkout-delivery').hidden, false);
    await app.submit();
    assert.equal(app.rpcCalls[0].name, 'rootx_place_order');
    assert.equal(app.calls.length, 0);
    assert.equal(app.localStorage.getItem('birlarootx-cart-v1'), null);
    assert.match(app.$('notice').textContent, /No online payment has been charged/);
  }
  {
    const app = await fixture({ statusError: true });
    assert.equal(app.$('checkout-delivery').hidden, false);
    await app.submit();
    assert.equal(app.rpcCalls.length, 1, 'a failed readiness check preserves order requests');
  }
  {
    const app = await fixture({ enabled: true });
    assert.equal(app.$('place-order').textContent, 'Continue to secure payment →');
    assert.equal(app.$('checkout-delivery').hidden, true);
    assert.equal(app.$('shipping_address').disabled, true, 'hidden required delivery fields cannot block secure checkout');
    assert.equal(app.requestHeaders[0].request.cache, 'no-store');
    assert.match(app.requestHeaders[0].request.headers.apikey, /^sb_publishable_/);
    assert.equal(app.requestHeaders[0].request.headers.Authorization, undefined);
    await app.submit();
    const { name, request } = app.calls[0];
    assert.equal(name, 'rootx-shopify-checkout');
    assert.deepEqual(JSON.parse(JSON.stringify(request.body.items)), [{ slug: 'carbs-slayer', quantity: 2 }, { slug: 'jacked-pre-workout', quantity: 1 }]);
    assert.deepEqual(Object.keys(request.body).sort(), ['client_request_id', 'items']);
    assert.equal(request.headers.Authorization, 'Bearer user-access-token');
    assert.match(request.body.client_request_id, /^[0-9a-f-]{36}$/);
    assert.equal(app.redirects.length, 1);
    assert.equal(app.localStorage.getItem('birlarootx-cart-v1'), originalCart, 'opening checkout does not prove payment');
    assert.equal(app.rpcCalls.length, 0);
  }
  {
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const app = await fixture({ enabled: true, invoke: () => pending });
    const first = app.submit();
    await new Promise(resolve => setImmediate(resolve));
    await app.submit();
    assert.equal(app.calls.length, 1, 'double submits create only one checkout request');
    release({ error: { context: { status: 503 } }, data: null });
    await first;
    const firstId = app.calls[0].request.body.client_request_id;
    await app.submit();
    assert.equal(app.calls[1].request.body.client_request_id, firstId, 'retry reuses the same idempotency ID');
    assert.equal(app.redirects.length, 0);
    assert.equal(app.localStorage.getItem('birlarootx-cart-v1'), originalCart);
    assert.equal(app.rpcCalls.length, 0, 'a checkout failure never silently submits an unpaid request');
  }
  {
    const app = await fixture({ enabled: true, session: null });
    await app.submit();
    assert.equal(app.calls.length, 0);
    assert.equal(app.$('auth-panel').hidden, false);
    assert.match(app.$('notice').textContent, /sign in again/);
    assert.equal(app.localStorage.getItem('birlarootx-cart-v1'), originalCart);
  }
  {
    let attempts = 0;
    const app = await fixture({ enabled: true, invoke: async () => ++attempts === 1 ? {
      data: null,
      error: { context: { status: 409, json: async () => ({ error: 'Consumed checkout', code: 'CHECKOUT_EXPIRED' }) } }
    } : { data: { checkout_url: 'https://vbvfdy-ed.myshopify.com/cart/c/new-cart' }, error: null } });
    await app.submit();
    const expiredId = app.calls[0].request.body.client_request_id;
    assert.equal(app.sessionStorage.getItem('rootx-shopify-checkout-v1'), null, 'expired checkout clears only its request ID');
    assert.equal(app.localStorage.getItem('birlarootx-cart-v1'), originalCart);
    assert.match(app.$('notice').textContent, /checkout has expired/);
    await app.submit();
    assert.notEqual(app.calls[1].request.body.client_request_id, expiredId, 'next click creates a fresh request ID');
    assert.equal(app.redirects.length, 1);
  }
  {
    const app = await fixture({ enabled: true, session: { ...validSession(), expires_at: 1 } });
    await app.submit();
    assert.equal(app.calls[0].refresh, true, 'expired sessions refresh before invocation');
    assert.equal(app.redirects.length, 1);
  }
  for (const checkout_url of ['https://vbvfdy-ed.myshopify.com.evil.test/pay', 'http://vbvfdy-ed.myshopify.com/cart', 'javascript:alert(1)']) {
    const app = await fixture({ enabled: true, invoke: async () => ({ data: { checkout_url }, error: null }) });
    await app.submit();
    assert.equal(app.redirects.length, 0, 'unsafe redirect is rejected: ' + checkout_url);
    assert.equal(app.localStorage.getItem('birlarootx-cart-v1'), originalCart);
  }
  {
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const app = await fixture({ enabled: true, invoke: () => pending });
    const submit = app.submit();
    await new Promise(resolve => setImmediate(resolve));
    app.signOut();
    release({ data: { checkout_url: 'https://vbvfdy-ed.myshopify.com/cart/c/secure-cart' }, error: null });
    await submit;
    assert.equal(app.redirects.length, 0, 'a response after sign-out cannot open a previous customer checkout');
  }
  const shopifyOrder = {
    id: 'order-1', customer_id: user.id, order_number: 'SHOP-1001', source: 'shopify', status: 'confirmed',
    subtotal: 2499, total: 2798, currency: 'INR', created_at: '2026-10-15T00:00:00Z',
    payment_status: '<img src=x onerror=alert(1)>', shipping_name: 'Buyer', shipping_phone: '9000000000', shipping_address: 'Sample Road'
  };
  for (const isAdmin of [false, true]) {
    const app = await fixture({ orders: [shopifyOrder], isAdmin });
    const html = app.$(isAdmin ? 'admin-orders' : 'customer-orders').innerHTML;
    assert.match(html, /Total ₹2,798/, 'Shopify final total includes tax/shipping');
    assert.match(html, /Shopify order · Payment: &lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<img src=x/, 'payment statuses are escaped in customer and admin views');
  }
  {
    const app = await fixture({ orders: [{ ...shopifyOrder, source: 'request', total: 999999, payment_status: 'paid' }] });
    const html = app.$('customer-orders').innerHTML;
    assert.match(html, /Total ₹2,499/, 'existing request cards retain their original subtotal');
    assert.doesNotMatch(html, /Shopify order|Payment:/);
  }
  console.log('Checkout frontend: offline flow, readiness, secure request, cart retention, duplicate prevention, retry expiry, auth expiry, redirect safety, sign-out race, and payment display passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
