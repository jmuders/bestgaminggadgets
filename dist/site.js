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
  let images = {};
  const safeImage = value => {
    try { const u=new URL(value);return u.protocol==='https:' && u.hostname==='upload.wikimedia.org' ? u.href : null; }
    catch { return null; }
  };
  // Only use exact-model photographs with an accepted license and an explicitly
  // approved gallery entry. An unreviewed search result is not product photography.
  const bundled = {
    'mini-pcs/MINISFORUM Neptune HX100G': [{url:'assets/hx100g.webp',alt:'MINISFORUM Neptune HX100G product photo',source:'Bundled product photo'}],
    'mini-pcs/Beelink SER8': [{url:'assets/ser8.webp',alt:'Beelink SER8 product photo',source:'Bundled product photo'}],
    'mini-pcs/FIREBAT MN56': [{url:'assets/mn56.webp',alt:'FIREBAT MN56 product photo',source:'Bundled product photo'}]
  };
  const verifiedPhotos = (product, category) => {
    const key = category.id+'/'+product.name;
    const discovered = (images[key]?.photos || []).filter(photo =>
      photo.approved === true && safeImage(photo.url) &&
      typeof photo.author === 'string' && typeof photo.page === 'string' &&
      typeof photo.license === 'string'
    ).map(photo=>({
      url:photo.url,
      alt:product.name+' — '+(photo.description || photo.title || 'product photograph'),
      source:photo.source,
      page:photo.page,
      author:photo.author,
      license:photo.license
    }));
    const items = [...(bundled[key] || []), ...discovered];
    const seen = new Set();
    return items.filter(photo=> {
      if(seen.has(photo.url)) return false;
      seen.add(photo.url); return true;
    }).slice(0,5);
  };
  const renderMedia = (product, category, index) => {
    const photos=verifiedPhotos(product,category);
    const galleryId='gallery-'+index;
    if(!photos.length) {
      return `<div class="gallery-empty" role="img" aria-label="Verified product photographs not available for ${escapeHTML(product.name)}"><span class="gallery-empty-icon" aria-hidden="true">${escapeHTML(category.icon)}</span><span>PRODUCT IMAGES PENDING VERIFICATION</span></div>`;
    }
    return `<div class="media-carousel" data-carousel data-index="0" aria-label="${escapeHTML(product.name)} image gallery">
      <div class="media-track" id="${galleryId}" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Photos of ${escapeHTML(product.name)}">
      ${photos.map((photo,i)=>`<div class="media-slide" role="group" aria-roledescription="slide" aria-label="Image ${i+1} of ${photos.length}">
        <img src="${escapeHTML(photo.url)}" alt="${escapeHTML(photo.alt)}" loading="${i===0?'eager':'lazy'}" decoding="async" draggable="false">
        ${photo.page ? `<a class="media-credit" href="${escapeHTML(photo.page)}" target="_blank" rel="noopener noreferrer" aria-label="Photo credit and license details">${escapeHTML(photo.author)} · ${escapeHTML(photo.license)} ↗</a>` : ''}
      </div>`).join('')}
      </div>
      ${photos.length>1 ? `<button type="button" class="media-arrow media-prev" data-direction="-1" aria-controls="${galleryId}" aria-label="Previous photo">‹</button><button type="button" class="media-arrow media-next" data-direction="1" aria-controls="${galleryId}" aria-label="Next photo">›</button>
      <div class="media-counter" aria-live="polite">1 / ${photos.length}</div>
      <div class="media-dots" role="group" aria-label="Choose product photo">${photos.map((photo,i)=>`<button type="button" class="media-dot" aria-label="Show image ${i+1}" data-slide="${i}" aria-current="${i===0?'true':'false'}"></button>`).join('')}</div>` : ''}
    </div>`;
  };
  const syncCarousel = (gallery, target, smooth=true) => {
    const track=gallery.querySelector('.media-track');
    const slides=[...track.querySelectorAll('.media-slide')];
    if(!slides.length) return;
    const index=Math.max(0,Math.min(target,slides.length-1));
    gallery.dataset.index=String(index);
    const x=slides[index].offsetLeft-slides[0].offsetLeft;
    track.scrollTo({left:x,behavior:smooth&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
    gallery.querySelectorAll('[data-slide]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.slide)===index)));
    const counter=gallery.querySelector('.media-counter');
    if(counter)counter.textContent=(index+1)+' / '+slides.length;
    const prev=gallery.querySelector('.media-prev'),next=gallery.querySelector('.media-next');
    if(prev)prev.disabled=index===0;
    if(next)next.disabled=index===slides.length-1;
  };
  productGrid.addEventListener('click',event=>{
    const control=event.target.closest('[data-direction],[data-slide]');
    if(!control)return;
    const gallery=control.closest('[data-carousel]');
    if(!gallery)return;
    const next=control.dataset.slide!==undefined?Number(control.dataset.slide):Number(gallery.dataset.index||0)+Number(control.dataset.direction);
    syncCarousel(gallery,next);
  });
  productGrid.addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    if(event.target.closest('a,button')&&!event.target.classList.contains('media-track'))return;
    const gallery=event.target.closest('[data-carousel]');
    if(!gallery)return;
    event.preventDefault();
    syncCarousel(gallery,Number(gallery.dataset.index||0)+(event.key==='ArrowRight'?1:-1));
  });
  productGrid.addEventListener('scroll',event=>{
    const track=event.target.closest('.media-track');
    if(!track)return;
    const gallery=track.closest('[data-carousel]');
    const width=track.clientWidth;
    if(width) {
      const index=Math.round(track.scrollLeft/width);
      const dots=gallery.querySelectorAll('[data-slide]');
      gallery.dataset.index=String(index);
      dots.forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.slide)===index)));
      const counter=gallery.querySelector('.media-counter');
      if(counter)counter.textContent=(index+1)+' / '+track.children.length;
    }
  },true);
  const hasImages = (product, category) => verifiedPhotos(product, category).length > 0;
  const photoReady = category => category.products.filter(product=>hasImages(product,category)).length;
  const unavailableNotice = category => `<div class="gallery-unavailable md:col-span-3" role="status">
    <h3 class="font-display text-xl font-bold text-white">Product photography under verification</h3>
    <p class="mt-2">We currently have ${photoReady(category)} of 3 exact-model photo sets for ${escapeHTML(category.name)}. Products without verified images are withheld rather than shown with unrelated photographs. More images will appear after approved source assets are connected.</p>
  </div>`;
  const renderCategories = () => {
    categoryGrid.innerHTML = catalog.map(c => `<button type="button" class="category-tile text-left ${c.id === selected.id ? 'active' : ''}" data-category="${escapeHTML(c.id)}" aria-pressed="${c.id === selected.id}"><span class="category-glyph" aria-hidden="true">${escapeHTML(c.icon)}</span><span class="flex-1"><strong class="block text-sm sm:text-base">${escapeHTML(c.name)}</strong><small class="block text-slate-400 mt-1">${photoReady(c)===3 ? "3 illustrated picks" : "Photo verification pending"}</small></span><span class="text-cyan">↗</span></button>`).join('');
    document.getElementById('category-count').textContent = `${catalog.length} CATEGORIES · ${catalog.reduce((n,c)=>n+photoReady(c),0)} PHOTO-VERIFIED PICKS`;
  };
  const renderProducts = () => {
    document.getElementById('selected-title').innerHTML = `Top 3 <span class="text-cyan">${escapeHTML(selected.name)}</span>`;
    document.getElementById('selected-description').textContent = selected.description;
    productGrid.innerHTML = selected.products.map((p, i) => !hasImages(p,selected) ? "" : `<article class="pick-card ${i === 0 ? 'pick-featured' : ''}">
      <div class="pick-card-heading flex items-center justify-between gap-3"><span class="pick-label">${escapeHTML(p.label)}</span><span class="text-slate-500 text-sm font-bold">0${i+1} / 03</span></div>
      ${renderMedia(p, selected, i)}
      <div class="pick-card-body flex flex-col grow">
        <h3 class="font-display text-2xl font-bold leading-tight">${escapeHTML(p.name)}</h3>
        <p class="text-slate-400 text-sm mt-3">${escapeHTML(p.reason)}</p>
        <div class="mt-6 pt-4 border-t border-white/10 space-y-3 text-sm">
          <p><span class="text-cyan font-bold">+ BEST FOR</span><br>${escapeHTML(p.spec)}</p>
          <p><span class="text-pink font-bold">− TRADE-OFF</span><br>${escapeHTML(p.tradeoff)}</p>
        </div>
        <a class="amazon-cta mt-7" href="${escapeHTML(amazonURL(p))}" target="_blank" rel="sponsored noopener noreferrer" aria-label="Find ${escapeHTML(p.name)} on Amazon.com in a new tab">CHECK ON AMAZON.COM ↗</a>
        <p class="text-xs mt-3 text-slate-500">See live price & availability on Amazon</p>
      </div></article>`).join('') + (photoReady(selected)<3 ? unavailableNotice(selected) : '');
    productGrid.querySelectorAll("[data-carousel]").forEach(g=>syncCarousel(g,0,false));
    const visibleProducts = selected.products.filter(p=>hasImages(p,selected));
    const rows = [
      ['Best for', visibleProducts.map(p => p.reason)],
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
  fetch('data/images.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
    if(data?.products && typeof data.products==='object'){images=data.products;renderCategories();renderProducts();}
  }).catch(()=>{});
})();