const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync('dist/catalog.js','utf8'),context);
const catalog = context.window.GAMING_CATALOG;
assert.ok(Array.isArray(catalog) && catalog.length >= 15);
const ids = new Set();
for (const category of catalog) {
  assert.ok(typeof category.id === 'string' && /^[a-z0-9-]+$/.test(category.id));
  assert.ok(!ids.has(category.id), 'duplicate category: ' + category.id);
  ids.add(category.id);
  assert.equal(category.products.length,3,category.id+' must have exactly 3 picks');
  assert.ok(category.name && category.description);
  for (const product of category.products) {
    assert.ok(product.name && product.label && product.reason && product.tradeoff && product.spec);
    assert.ok(!product.asin || /^[A-Z0-9]{10}$/i.test(product.asin));
  }
}
const html = fs.readFileSync('dist/index.html','utf8');
for(const target of ['category-grid','product-grid','comparison-head','comparison-body']) assert.ok(html.includes('id="'+target+'"'));
const code = fs.readFileSync('dist/site.js','utf8');
new vm.Script(code);
assert.ok(code.includes('https://www.amazon.com/'));
assert.ok(code.includes('sponsored noopener noreferrer'));
console.log('Validated '+catalog.length+' categories / '+catalog.length*3+' picks and site JS syntax');
