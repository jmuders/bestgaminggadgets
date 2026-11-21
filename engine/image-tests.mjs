import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePhoto,refreshImages} from './images.mjs';
const sample={title:'Keychron Q1 Max mechanical keyboard.jpg',description:'Keychron Q1 Max keyboard',url:'https://upload.wikimedia.org/test/image.jpg',page:'https://commons.wikimedia.org/wiki/File:Keychron_Q1_Max.jpg',author:'Photographer',source:'Wikimedia Commons',license:'CC BY-SA 4.0',width:1100,height:750};
test('requires correct model, source and licensing',()=>{
 assert.equal(validatePhoto(sample,'Keychron Q1 Max'),true);
 assert.equal(validatePhoto(sample,'Razer DeathAdder V3'),false);
 assert.equal(validatePhoto({...sample,license:'All rights reserved'},'Keychron Q1 Max'),false);
 assert.equal(validatePhoto({...sample,url:'https://example.net/a.jpg'},'Keychron Q1 Max'),false);
 assert.equal(validatePhoto({...sample,width:200},'Keychron Q1 Max'),false);
});
test('only returns verified Commons photos and caps gallery at three',async()=>{
 const catalog=[{id:'keyboards',products:[{name:'Keychron Q1 Max'}]}];
 const fetcher=async()=>({ok:true,json:async()=>({query:{pages:Object.fromEntries(Array.from({length:5},(_,i)=>[String(i),{title:'File:Keychron Q1 Max photo '+i+'.jpg',imageinfo:[{thumburl:'https://upload.wikimedia.org/test/'+i+'.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Keychron_Q1_Max_'+i+'.jpg',thumbwidth:1100,thumbheight:750,extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},Artist:{value:'Photographer'},ImageDescription:{value:'Keychron Q1 Max'}}}]}]))}})});
 const snapshot=await refreshImages({catalog,fetcher,now:'2026-11-21T12:00:00.000Z'});
 assert.equal(snapshot.products['keyboards/Keychron Q1 Max'].photos.length,3);
 assert.equal(snapshot.stats.checked,1);
});
