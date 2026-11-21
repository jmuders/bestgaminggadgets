(() => {
  'use strict';
  const catalog = window.GAMING_CATALOG || [];
  const categoryGrid = document.getElementById('category-grid');
  const productGrid = document.getElementById('product-grid');
  if (!catalog.length || !categoryGrid || !productGrid) return;
  const params = new URLSearchParams(window.location.search);
  const tag = typeof window.amazonAssociatesTag === 'string' && /^[a-z0-9][a-z0-9-]*-20$/i.test(window.amazonAssociatesTag.trim()) ? window.amazonAssociatesTag.trim() : '';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const amazonURL = (product) => {
    const url = product.asin && /^[A-Z0-9]{10}$/i.test(product.asin)
      ? new URL('https://www.amazon.com/dp/' + product.asin)
      : new URL('https://www.amazon.com/s');
    if (!product.asin) url.searchParams.set('k', product.name);
    if (tag) url.searchParams.set('tag', tag);
    return url.toString();
  };
  let selected = catalog.find(c => c.id === params.get('category')) || catalog[0];
  const renderCategories = () => {
    categoryGrid.innerHTML = catalog.map(c => `<button type="button" class="category-tile text-left ${c.id === selected.id ? 'active' : ''}" data-category="${escapeHTML(c.id)}" aria-pressed="${c.id === selected.id}"><span class="category-glyph" aria-hidden="true">${escapeHTML(c.icon)}</span><span class="flex-1"><strong class="block text-sm sm:text-base">${escapeHTML(c.name)}</strong><small class="block text-slate-400 mt-1">3 curated picks</small></span><span class="text-cyan">↗</span></button>`).join('');
    document.getElementById('category-count').textContent = `${catalog.length} CATEGORIES · ${catalog.length * 3} PICKS`;
  };
  const renderProducts = () => {
    document.getElementById('selected-title').innerHTML = `Top 3 <span class="text-cyan">${escapeHTML(selected.name)}</span>`;
    document.getElementById('selected-description').textContent = selected.description;
    productGrid.innerHTML = selected.products.map((p, i) => `<article class="pick-card ${i === 0 ? 'pick-featured' : ''}">
      <div class="flex items-center justify-between gap-3"><span class="pick-label">${escapeHTML(p.label)}</span><span class="text-slate-500 text-sm font-bold">0${i+1} / 03</span></div>
      <div class="product-graphic" aria-hidden="true"><span>${escapeHTML(selected.icon)}</span><div class="graphic-ring"></div></div>
      <div class="px-1 pb-1 flex flex-col grow">
        <h3 class="font-display text-2xl font-bold leading-tight">${escapeHTML(p.name)}</h3>
        <p class="text-slate-400 text-sm mt-3">${escapeHTML(p.reason)}</p>
        <div class="mt-6 pt-4 border-t border-white/10 space-y-3 text-sm">
          <p><span class="text-cyan font-bold">+ BEST FOR</span><br>${escapeHTML(p.spec)}</p>
          <p><span class="text-pink font-bold">− TRADE-OFF</span><br>${escapeHTML(p.tradeoff)}</p>
        </div>
        <a class="amazon-cta mt-7" href="${escapeHTML(amazonURL(p))}" target="_blank" rel="sponsored noopener noreferrer" aria-label="Find ${escapeHTML(p.name)} on Amazon.com in a new tab">CHECK ON AMAZON.COM ↗</a>
        <p class="text-xs mt-3 text-slate-500">See live price & availability on Amazon</p>
      </div></article>`).join('');
    const rows = [
      ['Best for', selected.products.map(p => p.reason)],
      ['Key differentiator', selected.products.map(p => p.spec)],
      ['Trade-off', selected.products.map(p => p.tradeoff)],
      ['Amazon US', selected.products.map(p => `<a class="text-cyan underline underline-offset-4" href="${escapeHTML(amazonURL(p))}" target="_blank" rel="sponsored noopener noreferrer">Check listing ↗</a>`), true]
    ];
    document.getElementById('comparison-head').innerHTML = `<tr><th scope="col">COMPARE</th>${selected.products.map(p=>`<th scope="col">${escapeHTML(p.label)}<span class="block text-white text-base mt-1">${escapeHTML(p.name)}</span></th>`).join('')}</tr>`;
    document.getElementById('comparison-body').innerHTML = rows.map(([label,values,raw])=>`<tr><th scope="row">${escapeHTML(label)}</th>${values.map(value=>`<td>${raw?value:escapeHTML(value)}</td>`).join('')}</tr>`).join('');
  };
  categoryGrid.addEventListener('click', e => {
    const button = e.target.closest('[data-category]');
    if (!button) return;
    const next = catalog.find(c => c.id === button.dataset.category);
    if (!next) return;
    selected = next;
    const updated = new URL(window.location.href);
    updated.searchParams.set('category', selected.id);
    history.replaceState(null, '', updated);
    renderCategories();
    renderProducts();
    document.getElementById('picks').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  renderCategories();
  renderProducts();
})();