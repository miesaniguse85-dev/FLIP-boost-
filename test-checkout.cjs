const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('async function submitOrder('),end=html.indexOf('\n}',start)+2;
function setup(){
 const el={coPhone:{value:'0912345678',style:{},focus(){}},placeOrderBtn:{disabled:false},coName:{value:'Preview Tester'},coAddr:{value:'Test address'},coSavedLat:{value:'9.01'},coSavedLng:{value:'38.75'},sumDetail:{textContent:'Whole beans'},sumDelivery:{textContent:'ETB 100'},coCustomerId:{value:''},coPartnerCode:{value:''},coContent:{style:{}},cartBadge:{textContent:'1'}};
 const calls=[],alerts=[];
 const c={document:{getElementById:id=>el[id]},alert:m=>alerts.push(m),coLat:9.01,coLng:38.75,validEtPhone:p=>/^09\d{8}$/.test(p),normalizePhone:p=>'+251'+p.slice(1),currentLang:'en',commerceCatalog:{},cart:{size:'250g',qty:1,price:525},selectedBackendFormId:()=> 'whole_beans',activeBackendFormIds:()=>['whole_beans'],verifiedCustomer:null,partnerCodeRecorded:false,calcDelivery:async()=>{},currentDeliveryQuote:{ok:true,delivery_fee:100},deliveryType:'scheduled',quantityKg:()=>.25,tCommerce:k=>k,loadCommerceCatalog:async()=>true,commercePost:async(path,data)=>{calls.push({path,data});return {order_id:'TEST_ONLY',total:625}}};
 vm.createContext(c);vm.runInContext(html.slice(start,end),c);
 return {c,el,calls,alerts};
}
(async()=>{
 let x=setup();await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,1);assert.equal(x.calls[0].data.size,'250g');assert.equal(x.calls[0].data.phone,'+251912345678');assert.equal(x.el.placeOrderBtn.disabled,false);
 x=setup();x.c.coLat=null;await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,0);
 x=setup();x.el.coPhone.value='invalid';await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,0);
 x=setup();x.c.commerceCatalog=null;x.c.loadCommerceCatalog=async()=>false;await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,0);assert.equal(x.el.placeOrderBtn.disabled,false);
 x=setup();x.c.currentDeliveryQuote=null;await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,0);
 x=setup();let resolve;x.c.commercePost=()=>new Promise(r=>{resolve=r});const first=x.c.submitOrder({preventDefault(){}});await new Promise(setImmediate);await x.c.submitOrder({preventDefault(){}});assert.equal(x.el.placeOrderBtn.disabled,true);resolve({total:625});await first;assert.equal(x.el.placeOrderBtn.disabled,false);
 x=setup();x.c.commercePost=async()=>{throw Error('offline')};await x.c.submitOrder({preventDefault(){}});assert.equal(x.el.placeOrderBtn.disabled,false);assert.equal(x.el.coContent.style.display,undefined);assert.ok(x.alerts.includes('offline'));
 x=setup();x.c.loadCommerceCatalog=async()=>{x.c.cart.price=700;return true};await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,0);assert.match(x.alerts[0],/price has changed/);await x.c.submitOrder({preventDefault(){}});assert.equal(x.calls.length,1);
 console.log('8 checkout checks passed: changed-price review, payload, location, phone, unavailable catalog, missing quote, duplicate submission, network retry. No live requests.');
})().catch(e=>{console.error(e);process.exitCode=1});
