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
  
  function tracking(courier,reference){
    const name=String(courier||'').toLowerCase().replace(/[\s_-]+/g,'');
    if(!String(reference||'').trim())return null;
    // Fixed official carrier pages; no customer details or tracking IDs in the URL.
    if(name==='delhivery')return {name:'Delhivery',url:'https://www.delhivery.com/tracking'};
    if(name==='bluedart')return {name:'Blue Dart',url:'https://www.bluedart.com/tracking'};
    return null;
  }
  async function saveProduct(db,{slug,price,file,uuid}){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!Number.isFinite(price)||price<1||price>100000)throw Error('Enter a valid product and price between ₹1 and ₹100,000.');
    const patch={price,updated_at:new Date().toISOString()};let uploaded=null;
    const bucket=db.storage.from('rootx-product-images');
    if(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024||file.size<=0)throw Error('Use a non-empty JPG, PNG or WebP up to 5 MB.');
      const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
      const path=slug+'/'+uuid()+'.'+ext;
      const up=await bucket.upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
      if(up.error)throw Error('Photo upload failed. Product was not saved. Please retry.');
      uploaded=path;patch.image_url=bucket.getPublicUrl(path).data.publicUrl;
    }
    let result;
    try{result=await db.from('rootx_products').update(patch).eq('slug',slug).select('slug');}
    catch{throw Error('Save status could not be confirmed. Refresh before retrying. Any uploaded photo was retained to avoid breaking a possibly saved product.');}
    if(!result.error&&result.data?.length)return;
    // A definite SQL/PostgREST rejection or zero-row update cannot have committed.
    // Transport failures are ambiguous: never delete a possibly referenced photo.
    const definite=!result.error||/^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(result.error.code||'');
    if(uploaded&&definite){
      try{const cleanup=await bucket.remove([uploaded]);if(cleanup.error)throw cleanup.error;}
      catch{throw Error('Product was not saved. The unused uploaded photo could not be removed; ask an administrator to review Storage before retrying.');}
    }
    if(uploaded&&!definite)throw Error('Save status is uncertain. Refresh before retrying; the uploaded photo was retained safely.');
    throw Error('Product was not saved. '+(uploaded?'The new unused photo was removed. ':'')+'Check your administrator access and retry.');
  }
  window.ROOTX_ACCOUNT_HELPERS={states,shipping,returnIntent,tracking,saveProduct};
})();

