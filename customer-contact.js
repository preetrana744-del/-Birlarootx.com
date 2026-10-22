(() => {
 const email='rootx1212@gmail.com';
 const support=document.querySelector('#contact-support')||document.querySelector('footer');
 if(!support||support.querySelector('.rootx-email-options'))return;
 const options=document.createElement('div');options.className='rootx-email-options';
 const app=document.createElement('a');app.href='mailto:'+email;app.textContent='Open email app';
 const copy=document.createElement('button');copy.type='button';copy.textContent='Copy email';
 const status=document.createElement('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 options.append(app,copy,status);support.append(options);
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(email);status.textContent='Email address copied.';}catch{status.textContent='Copy this address: '+email;}});
})();
