// Embeds the data and engine module in the standalone trainer; no network needed.
const fs=require('fs'),path=require('path');
const dir=__dirname,file=path.join(dir,'..','chess-trainer.html');
const pack=JSON.parse(fs.readFileSync(path.join(dir,'lichess-catalogue.json'),'utf8'));
const lessons=JSON.parse(fs.readFileSync(path.join(dir,'main-families.json'),'utf8'));
const safe=x=>JSON.stringify(x).replace(/</g,'\\u003c');
const start='/*OFFLINE-BOOK-BEGIN*/',end='/*OFFLINE-BOOK-END*/';
const block=start+'\nconst BUNDLED_OPENING_PACK = '+safe(pack)+';\nconst OPENING_LESSONS = '+safe(lessons)+';\n'
 +fs.readFileSync(path.join(dir,'catalogue-engine.js'),'utf8')+'\n'+end;
let html=fs.readFileSync(file,'utf8');
if(html.includes(start))html=html.slice(0,html.indexOf(start))+block+html.slice(html.indexOf(end)+end.length);
else html=html.replace('CT.library = buildSeedLibrary();','CT.library = buildSeedLibrary();\n\n'+block);
const uiStart='/*OPENING-UI-BEGIN*/',uiEnd='/*OPENING-UI-END*/';
const uiBlock=uiStart+'\n'+fs.readFileSync(path.join(dir,'catalogue-ui.js'),'utf8')+'\n'+uiEnd+'\n';
if(html.includes(uiStart))html=html.slice(0,html.indexOf(uiStart))+uiBlock+html.slice(html.indexOf(uiEnd)+uiEnd.length+1);
else html=html.replace('  function renderPersonalLibrary(){',uiBlock+'  function renderPersonalLibrary(){');
const testStart='/*OPENING-TESTS-BEGIN*/',testEnd='/*OPENING-TESTS-END*/';
const testBlock=testStart+'\n'+fs.readFileSync(path.join(dir,'catalogue-tests.js'),'utf8')+'\n'+testEnd+'\n';
if(html.includes(testStart))html=html.slice(0,html.indexOf(testStart))+testBlock+html.slice(html.indexOf(testEnd)+testEnd.length+1);
else html=html.replace('CT.runTests = async function(opts){',testBlock+'CT.runTests = async function(opts){');
fs.writeFileSync(file,html);
const CT=new Function(html.split('<script id="engine">')[1].split('/*ENGINE-END*/')[0]+'\nreturn CT;')();
for(const e of lessons){const errs=CT.validateRepertoireEntry(e);if(errs.length)throw Error(e.nameEn+': '+errs.join('; '));}
console.log(JSON.stringify({catalogue:CT.catalogueEntries().length,lessons:lessons.length,htmlBytes:Buffer.byteLength(html)}));
