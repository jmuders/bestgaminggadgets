import crypto from 'node:crypto';

const text = x => typeof x === 'string' ? x : x === undefined || x === null ? '' : String(x);
const strip = value => text(value).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const asArray = value => value == null ? [] : Array.isArray(value) ? value : [value];
const normalize = s => strip(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const STOP = new Set(['gaming','wireless','wired','the','and','for','with','pc','pro','plus','mini','series','gen','rgb','review','new','best','black','white','2tb','1tb','15','27','gaming']);
const tokenize = s => normalize(s).split(' ').filter(s=>s.length>=2&&!STOP.has(s));
const hostFor = url => {try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
const sha = value => crypto.createHash('sha256').update(value).digest('hex').slice(0,16);

export function parseArticles(doc,source) {
  const nodes=asArray(doc?.rss?.channel?.item ?? doc?.feed?.entry);
  return nodes.slice(0,100).map(row=>{
    const rawLink=row.link;
    const link=typeof rawLink==='string'?rawLink: asArray(rawLink).map(item=>typeof item==='string'?item:item?.['@_href']).find(Boolean) || '';
    const url=link.trim();
    const title=strip(row.title?.['#text']??row.title);
    const rawDate=row.pubDate??row.published??row.updated??row.date;
    const stamp=Date.parse(text(rawDate));
    return {id:sha(url),url,title,source:source.name,sourceId:source.id,sourceType:source.type,date:Number.isFinite(stamp)?new Date(stamp).toISOString():null,excerpt:strip(row.description??row.summary??'').slice(0,240)};
  }).filter(row=>row.title&&row.url.startsWith('https://')&&hostFor(row.url)===hostFor(source.url));
}
export function matchesProduct(article,product) {
  const title=normalize(article.title);
  const productName=normalize(product.name);
  if(title.includes(productName)) return true;
  const productTokens=[...new Set(tokenize(product.name))];
  if(productTokens.length<2) return false;
  // Require specific model tokens; broad brand-only headlines are not product evidence.
  const count=productTokens.filter(tok=>title.split(' ').includes(tok)).length;
  return count>=2 && count>=Math.ceil(productTokens.length*.75);
}
function matchNewGadget(article) {
  const t=article.title;
  if(!/\b(review|hands-on|first look|announces|launches|unveils|introduced)\b/i.test(t)) return false;
  return /\b(keyboard|mouse|headset|headphones|earbuds|monitor|graphics card|gpu|gaming laptop|mini pc|webcam|microphone|capture card|controller|gaming chair|gaming desk|ssd|gaming router)\b/i.test(t);
}
function cleanArticles(articles,now) {
  const cutoff=Date.parse(now)-90*24*60*60*1000;
  const seen=new Set();
  return articles.filter(article=>{
    if(!article.url||seen.has(article.url)||!article.date)return false;
    const date=Date.parse(article.date);
    if(!Number.isFinite(date)||date<cutoff||date>Date.parse(now)+24*60*60*1000)return false;
    seen.add(article.url);
    return true;
  });
}
export function buildSnapshot({catalog,articles,previous={},failures=[],now}) {
  const cleaned=cleanArticles(articles,now);
  const products={};
  const matchedUrls=new Set();
  for(const category of catalog) {
    for(const product of category.products) {
      const matches=cleaned.filter(a=>matchesProduct(a,product));
      for (const match of matches) matchedUrls.add(match.url);
      const sources=[...new Set(matches.map(a=>a.sourceId))];
      const sorted=matches.slice().sort((a,b)=>Number(/review/i.test(b.title))-Number(/review/i.test(a.title))||Date.parse(b.date)-Date.parse(a.date)).slice(0,5);
      products[category.id+'/'+product.name]={
        evidenceCount:matches.length,
        independentSources:sources.length,
        coverageScore:Math.min(100, sources.length*25+Math.min(matches.length,5)*8),
        reviews:sorted.map(a=>({title:a.title,source:a.source,url:a.url,date:a.date,type:/\breview\b/i.test(a.title)?'review':'coverage'}))
      };
    }
  }
  const discoveries=cleaned.filter(a=>!matchedUrls.has(a.url)&&matchNewGadget(a)).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,24).map(a=>({title:a.title,source:a.source,url:a.url,date:a.date,kind:'discovery'}));
  const snapshot={version:1,generatedAt:now,marketplace:'amazon.com',amazonAvailabilityVerified:false,products,discoveries,stats:{articleCount:cleaned.length,sourceCount:new Set(cleaned.map(a=>a.sourceId)).size,failedSources:failures}};
  // Retain previous verified publisher references during temporary feed failures only, for at most 90 days.
  if(failures.length && previous?.products) {
    const active=new Set(cleaned.map(a=>a.url));
    for(const [id,old] of Object.entries(previous.products)) {
      if(!products[id]||products[id].reviews.length)continue;
      const retained=(old.reviews||[]).filter(a=>a.url?.startsWith('https://')&&Date.parse(a.date)>=Date.parse(now)-90*86400000).slice(0,5);
      if(retained.length) products[id]={...products[id],reviews:retained,evidenceCount:retained.length,independentSources:new Set(retained.map(a=>a.source)).size,coverageScore:Math.min(100,retained.length*8)};
    }
  }
  return snapshot;
}
export function validateSnapshot(snapshot,catalog) {
  if(snapshot.version!==1||snapshot.marketplace!=='amazon.com'||snapshot.amazonAvailabilityVerified!==false)throw Error('Invalid snapshot');
  const expected=catalog.reduce((total,c)=>total+c.products.length,0);
  if(Object.keys(snapshot.products).length!==expected)throw Error('Incomplete catalog snapshot');
  for(const value of [...Object.values(snapshot.products).flatMap(p=>p.reviews),...snapshot.discoveries]){
    if(!value.url.startsWith('https://'))throw Error('Unsafe source URL');
  }
  return true;
}
