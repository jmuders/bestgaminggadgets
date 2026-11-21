import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Wikimedia Commons is used only for openly licensed, model-specific image files.
// Search hits are NOT automatically product matches unless the full model tokens
// occur in the file title or description. Never scrape Amazon/review-site photos.
export const IMAGE_LIMIT = 3;
const API = 'https://commons.wikimedia.org/w/api.php';
const LICENSE = /^(CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)|CC0(?: 1\.0)?|Public domain)$/i;
const clean = s => String(s??'').replace(/<[^>]*>/g,' ').replace(/&[^; ]{2,12};/g,' ').replace(/\s+/g,' ').trim();
const normalize = s => clean(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hostAllowed = value => {
  try {const u=new URL(value);return u.protocol==='https:' && (u.hostname==='upload.wikimedia.org'||u.hostname==='commons.wikimedia.org');}
  catch{return false;}
};
const modelTokens = name => normalize(name).split(' ').filter(t=>t.length>1);
export function validatePhoto(photo,productName) {
  if (!photo || !hostAllowed(photo.url) || !hostAllowed(photo.page)) return false;
  if (!LICENSE.test(photo.license||'')) return false;
  if (!photo.author || !photo.title || !photo.source || !photo.license) return false;
  if (!Number.isFinite(photo.width) || photo.width < 550 || !Number.isFinite(photo.height) || photo.height < 350) return false;
  const haystack=normalize(photo.title+' '+(photo.description||''));
  const tokens=modelTokens(productName);
  return tokens.length>=2 && tokens.every(t=>haystack.split(' ').includes(t));
}
function extractPhoto(page,productName) {
  const info=page.imageinfo?.[0];
  const ext=info?.extmetadata??{};
  const read=k=>clean(ext[k]?.value??'');
  const license=read('LicenseShortName');
  const photo={
    title:page.title?.replace(/^File:/,'')||'',
    description:read('ImageDescription').slice(0,250),
    url:info?.thumburl||'',
    page:info?.descriptionurl||'',
    author:read('Artist').slice(0,240),
    license,
    source:'Wikimedia Commons',
    width:Number(info?.thumbwidth||0),
    height:Number(info?.thumbheight||0),
    approved:false,
  };
  if(!validatePhoto(photo,productName)) return null;
  // Policy checks qualify an image for an automatic source-match, not a human review.
  return {...photo,approved:true};
}
async function searchPhotos(productName,fetcher=fetch) {
  const params=new URLSearchParams({
    action:'query',generator:'search',gsrsearch:'filetype:bitmap '+productName,
    gsrnamespace:'6',gsrlimit:'12',prop:'imageinfo',
    iiprop:'url|size|extmetadata',iiurlwidth:'1100',format:'json',origin:'*'
  });
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetcher(API+'?'+params,{signal:controller.signal,headers:{'User-Agent':'BestGamingGadgets/1.0 (https://github.com/jmuders/bestgaminggadgets; product image attribution)'}});
    if(!response.ok)throw new Error('Commons HTTP '+response.status);
    const body=await response.json();
    if(body.error)throw new Error('Commons API: '+body.error.code);
    const photos=Object.values(body.query?.pages||{}).map(page=>extractPhoto(page,productName)).filter(Boolean);
    const used=new Set();
    return photos.filter(p=>{if(used.has(p.page))return false;used.add(p.page);return true;}).slice(0,IMAGE_LIMIT);
  } finally {clearTimeout(timer);}
}
export async function refreshImages({catalog,fetcher=fetch,previous={},now=new Date().toISOString(),maxRequests=60}) {
  const products={};
  const stats={checked:0,reused:0,found:0,errors:0,missing:0};
  let requests=0;
  for(const category of catalog)for(const product of category.products){
    const key=category.id+'/'+product.name;
    const old=previous.products?.[key];
    const cached=(old?.photos||[]).filter(p=>p.approved===true&&validatePhoto(p,product.name)).slice(0,IMAGE_LIMIT);
    const age=Date.parse(now)-Date.parse(old?.checkedAt||'');
    if(cached.length && Number.isFinite(age)&&age>=0&&age<7*86400000){
      products[key]={photos:cached,checkedAt:old.checkedAt};stats.reused++;stats.found+=cached.length;continue;
    }
    if(requests>=maxRequests){
      products[key]={photos:cached,checkedAt:old?.checkedAt||null};stats.missing+=!cached.length?1:0;continue;
    }
    requests++;stats.checked++;
    try{
      const photos=await searchPhotos(product.name,fetcher);
      products[key]={photos:photos.length?photos:cached,checkedAt:now};
      stats.found+=products[key].photos.length;
      if(!products[key].photos.length)stats.missing++;
    }catch(e){
      stats.errors++;
      products[key]={photos:cached,checkedAt:old?.checkedAt||null};
      stats.found+=cached.length;
      if(!cached.length)stats.missing++;
      console.warn('Image lookup failed for '+key+': '+e.message);
    }
    await delay(90);
  }
  return {version:1,generatedAt:now,products,stats,provider:'Wikimedia Commons',maxImagesPerProduct:IMAGE_LIMIT};
}

if(process.argv[1] && import.meta.url.endsWith(process.argv[1])){
  const root=process.cwd();
  const catalogCode=await fs.readFile(path.join(root,'dist/catalog.js'),'utf8');
  const catalog=JSON.parse(catalogCode.match(/window\.GAMING_CATALOG\s*=\s*(\[[\s\S]*\]);?\s*$/)[1]);
  const cacheFile=path.join(root,'engine/cache/images.json');
  let previous={};
  try{previous=JSON.parse(await fs.readFile(cacheFile,'utf8'));}catch{}
  const result=await refreshImages({catalog,previous,maxRequests:60});
  await fs.mkdir(path.join(root,'dist/data'),{recursive:true});
  await fs.mkdir(path.dirname(cacheFile),{recursive:true});
  await fs.writeFile(path.join(root,'dist/data/images.json'),JSON.stringify(result,null,2)+'\n');
  await fs.writeFile(cacheFile,JSON.stringify(result,null,2)+'\n');
  console.log('Licensed product photos:',result.stats);
}
