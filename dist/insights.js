(() => {
  'use strict';
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const evidence = document.getElementById('review-evidence');
  const discoveries = document.getElementById('discovery-feed');
  const stamp = document.getElementById('insight-timestamp');
  if (!evidence || !discoveries) return;
  let snapshot;
  const safeLink = (url) => {
    try { const u = new URL(url); return u.protocol==='https:' ? u.href : null; }
    catch { return null; }
  };
  const card = (article) => {
    const url=safeLink(article.url);
    if(!url)return '';
    return `<a class="method-card block hover:border-cyan/50 transition" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHTML(article.source)}</strong><p class="text-white">${escapeHTML(article.title)}</p><small class="text-slate-500 block mt-3">${escapeHTML(article.date ? new Date(article.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'Date unavailable')} · Read original ↗</small></a>`;
  };
  const render = () => {
    if (!snapshot) return;
    const id = new URLSearchParams(location.search).get('category') || 'mini-pcs';
    const category = window.GAMING_CATALOG?.find(c=>c.id===id) || window.GAMING_CATALOG?.[0];
    if (!category) return;
    const selected=category.products.flatMap(p => (snapshot.products?.[category.id+'/'+p.name]?.reviews || []).map(a=>({...a,product:p.name})));
    const unique=selected.filter((a,i,list)=>list.findIndex(x=>x.url===a.url)===i).slice(0,6);
    evidence.innerHTML=unique.length?unique.map(a=>card(a)).join(''):'<p class="text-slate-400 col-span-full">No recent independently matched publisher articles for these models. We do not invent reviews or ratings.</p>';
    const latest=(snapshot.discoveries||[]).slice(0,8);
    discoveries.innerHTML=latest.length?latest.map(card).join(''):'<p class="text-slate-400 col-span-full">No recent discoveries available from the connected feeds.</p>';
    stamp.textContent=snapshot.generatedAt ? 'Publisher feed scan: '+new Date(snapshot.generatedAt).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})+' UTC · Not an Amazon inventory check' : 'Automated publisher scan not yet completed';
  };
  fetch('data/insights.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json()}).then(data=>{snapshot=data;render()}).catch(()=>{evidence.innerHTML='<p class="text-slate-400">Review feed currently unavailable.</p>'});
  document.getElementById('category-grid')?.addEventListener('click',()=>queueMicrotask(render));
  window.addEventListener('popstate',render);
})();