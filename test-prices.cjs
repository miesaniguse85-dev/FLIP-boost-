const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
function extract(name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start >= 0);
  const end = html.indexOf('\n}', start) + 2;
  return (html.slice(start - 6, start) === 'async ' ? 'async ' : '') + html.slice(start, end);
}
const prices = ['250g','250g','500g','500g','1kg','1kg'].map(size => ({dataset:{size},textContent:'old'}));
const elements = {catalogRetry:{hidden:true},catalogStatus:{hidden:false},catalogStatusText:{textContent:''}};
const classes = new Set(['prices-pending']);
const ctx = {
  Number, Error, console, currentLang:'en', cart:{size:'250g',price:525},
  _LIVE_PRICES:{'250g':525,'500g':1000,'1kg':1900},
  commerceCatalog:null, commerceDeliverySettings:null,
  normalizeSizeKey:s=>s, canonicalSizeKey:s=>s,
  updateShopChoiceUI(){}, updateTotal(){}, refreshCheckoutSummary(){},
  document:{
    querySelectorAll:selector=>selector==='.price-amount[data-size]'?prices:[],
    getElementById:id=>elements[id],
    documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}}
  }
};
vm.createContext(ctx);
vm.runInContext(extract('patchSizeBtns')+'\n'+extract('loadCommerceCatalog'),ctx);
(async()=>{
  ctx.commerceGet=async()=>({products:[{product_id:'guji_natural',sizes:[
    {size:'250g',price:700},{size:'500g',price:1300},{size:'1kg',price:2400}
  ]}]});
  assert.match(html, /<html[^>]*class="prices-pending"/);
  await ctx.loadCommerceCatalog();
  assert.equal(ctx.cart.price,700);
  assert.equal(prices[0].textContent,'ETB 700');
  assert.equal(classes.has('prices-pending'),false);
  ctx._LIVE_PRICES['250g']=750;
  ctx.patchSizeBtns();
  assert.equal(prices[0].textContent,'ETB 750','Repeated updates must use size, not old displayed number');
  ctx.currentLang='am'; ctx.patchSizeBtns();
  assert.equal(prices[0].textContent,'ብር 750');
  ctx.commerceGet=async()=>{throw new Error('offline');};
  await ctx.loadCommerceCatalog();
  assert.equal(ctx.commerceCatalog,null);
  assert.equal(classes.has('prices-pending'),true);
  assert.equal(elements.catalogRetry.hidden,false);
  assert.equal(elements.catalogStatus.hidden,false);
  ctx.commerceGet=async()=>({products:[{product_id:'guji_natural',sizes:[{size:'250g',price:700}]}]});
  await ctx.loadCommerceCatalog();
  assert.equal(ctx.commerceCatalog,null,'Incomplete catalog must not enable checkout');
  console.log('Price checks passed: current price, repeated updates, Amharic, offline and incomplete catalog.');
})().catch(error=>{console.error(error);process.exitCode=1;});
