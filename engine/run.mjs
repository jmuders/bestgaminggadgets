import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { buildSnapshot, parseArticles, validateSnapshot } from './lib.mjs';

const ROOT = process.cwd();
const config = JSON.parse(await fs.readFile(path.join(ROOT,'engine/sources.json'),'utf8'));
const catalogCode = await fs.readFile(path.join(ROOT,'dist/catalog.js'),'utf8');
const catalogMatch = catalogCode.match(/window\.GAMING_CATALOG\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!catalogMatch) throw new Error('Catalog format not recognized');
const catalog = JSON.parse(catalogMatch[1]);
const xml = new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',trimValues:true,removeNSPrefix:true});
const collected = [];
const failures = [];
for (const source of config.sources) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),12000);
    let response;
    try {
      response = await fetch(source.url,{signal:controller.signal,headers:{'User-Agent':'BestGamingGadgetsBot/1.0 (+https://github.com/jmuders/bestgaminggadgets)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'}});
    } finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error('HTTP '+response.status);
    const length = Number(response.headers.get('content-length') || 0);
    if(length > 2_000_000) throw new Error('Feed too large');
    const body = await response.text();
    if(body.length > 2_000_000) throw new Error('Feed too large');
    const entries = parseArticles(xml.parse(body),source);
    collected.push(...entries);
    console.log(source.name+': '+entries.length+' entries');
  } catch(error) {
    failures.push({source:source.name,reason:String(error.message).slice(0,140)});
    console.warn(source.name+': '+error.message);
  }
}
const outputPath=path.join(ROOT,'dist/data/insights.json');
let previous={};
try { previous=JSON.parse(await fs.readFile(outputPath,'utf8')); }catch{}
const snapshot=buildSnapshot({catalog,articles:collected,previous,failures,now:new Date().toISOString()});
validateSnapshot(snapshot,catalog);
await fs.mkdir(path.dirname(outputPath),{recursive:true});
await fs.writeFile(outputPath,JSON.stringify(snapshot,null,2)+'\n');
console.log(JSON.stringify({matchedProducts:Object.keys(snapshot.products).length,discoveries:snapshot.discoveries.length,articleCount:snapshot.stats.articleCount,failures:failures.length},null,2));
if(!collected.length) console.warn('All publisher feeds unavailable: deployed without new evidence; no availability claims made.');
