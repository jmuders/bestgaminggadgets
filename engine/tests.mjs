import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseArticles,matchesProduct,buildSnapshot,validateSnapshot} from './lib.mjs';
const source={id:'fixture',name:'Example Publisher',type:'review',url:'https://example.com/rss'};
test('parse RSS safely',()=>{
 const rows=parseArticles({rss:{channel:{item:[{title:'Beelink SER8 review',link:'https://example.com/post',pubDate:'Sat, 21 Nov 2026 10:00:00 GMT'},{title:'offsite',link:'https://bad.example/'}]}}},source);
 assert.equal(rows.length,1);
 assert.equal(rows[0].title,'Beelink SER8 review');
});
test('specific models only',()=>{
 assert.equal(matchesProduct({title:'The Beelink SER8 review'},{name:'Beelink SER8'}),true);
 assert.equal(matchesProduct({title:'Best Beelink PCs'},{name:'Beelink SER8'}),false);
});
test('build a sourced coverage snapshot without stock claims',()=>{
 const catalog=[{id:'mini-pcs',products:[{name:'Beelink SER8'}]}];
 const articles=[{id:'a',title:'Beelink SER8 review',url:'https://example.com/post',date:'2026-11-21T10:00:00.000Z',source:'Example Publisher',sourceId:'fixture',sourceType:'review'}];
 const data=buildSnapshot({catalog,articles,now:'2026-11-21T11:00:00.000Z'});
 assert.equal(data.products['mini-pcs/Beelink SER8'].reviews.length,1);
 assert.equal(data.amazonAvailabilityVerified,false);
 validateSnapshot(data,catalog);
});
