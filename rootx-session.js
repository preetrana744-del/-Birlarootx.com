/* One persistent Supabase session shared by the storefront and account page. */
(() => {
  'use strict';
  window.rootxRecoveryRequested=location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery';
  const db = window.rootxAuth = window.supabase.createClient(
    'https://lbqgdfbpuxjkwldhwpvi.supabase.co',
    'sb_publishable_rS7URzLNbhXhdPp50Te_Qg_9LtpKOI_',
    {auth:{storageKey:'birlarootx-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
  );
  const links = document.querySelectorAll('.rootx-account-link, [data-account-name]');
  const buttons = document.querySelectorAll('[data-session-logout]');
  function render(user) {
    const metadata = user?.user_metadata || {};
    const name = String(metadata.full_name || metadata.name || user?.email?.split('@')[0] || 'My account').trim();
    links.forEach(link => {
      link.textContent = user ? 'Hi, ' + name : (link.dataset.accountGuest || 'Login / Orders');
      link.title = user ? 'Signed in as ' + name + ' · My account and orders' : 'Sign in to view your orders';
      link.setAttribute('aria-label', link.title);
    });
    buttons.forEach(button => { button.hidden = !user; });
  }
  // Keep this callback synchronous; Supabase API calls inside it can deadlock.
  db.auth.onAuthStateChange((_event, session) => render(session?.user || null));
  buttons.forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const {error} = await db.auth.signOut();
      if(error) throw error;
      render(null);
    } catch (_) {
      window.alert('Could not sign out. Please try again.');
    } finally { button.disabled = false; }
  }));
})();

