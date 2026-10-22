/* Pure validation helpers; no account data is stored here. */
(() => {
  const states=['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
  function shipping(values){
    const clean=k=>String(values[k]||'').trim().replace(/\s+/g,' ');
    const name=clean('shipping_name'),address=clean('shipping_address'),city=clean('shipping_city'),state=clean('shipping_state'),pin=clean('shipping_pin');
    let phone=clean('shipping_phone').replace(/[\s()-]/g,'');
    if(phone.startsWith('+91'))phone=phone.slice(3);else if(phone.length===12&&phone.startsWith('91'))phone=phone.slice(2);else if(phone.length===11&&phone.startsWith('0'))phone=phone.slice(1);
    const errors={};
    if(name.length<2||name.length>120||!/[\p{L}]/u.test(name))errors.shipping_name='Enter the recipient’s full name (2–120 characters).';
    if(!/^[6-9][0-9]{9}$/.test(phone))errors.shipping_phone='Enter a valid 10-digit Indian mobile number; +91 is optional.';
    if(address.length<10||address.length>700||!/[\p{L}]/u.test(address)||!/[\p{L}\p{N}]/u.test(address))errors.shipping_address='Enter house/building, street and locality (10–700 characters).';
    if(city.length<2||city.length>100||!/[\p{L}]/u.test(city))errors.shipping_city='Enter your city or town (2–100 characters).';
    if(!states.includes(state))errors.shipping_state='Choose a valid state or union territory.';
    if(!/^[1-9][0-9]{5}$/.test(pin))errors.shipping_pin='Enter a valid 6-digit Indian PIN code.';
    return {errors,value:{shipping_name:name,shipping_phone:'+91'+phone,shipping_address:address+', '+city+', '+state+' – '+pin+', India',shipping_city:city,shipping_state:state,shipping_pin:pin}};
  }
  function returnIntent(raw,now=Date.now()){try{const x=JSON.parse(raw);return x?.checkout===true&&Number.isFinite(x.expires)&&x.expires>now&&x.expires<=now+86400000;}catch{return false;}}
  window.ROOTX_ACCOUNT_HELPERS={states,shipping,returnIntent};
})();
