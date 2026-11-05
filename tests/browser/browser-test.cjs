const { chromium } = require('playwright');
const {pathToFileURL} = require('url');
const fs = require('fs');
const assert = require('assert/strict');
const path = require('path');
const file = path.resolve(__dirname,'../..','chess-trainer.html');
const output = path.resolve(__dirname,'../artifacts');
fs.mkdirSync(output,{recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true,channel:process.env.CHESS_BROWSER_CHANNEL || 'msedge'});
  const context = await browser.newContext({offline:true,viewport:{width:1440,height:1050}});
  const errors = [], schemes = new Set();
  const page = await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  page.on('request',r=>schemes.add(new URL(r.url()).protocol));
  const url = pathToFileURL(file).href;
  async function openPersonalLibrary(){
    await page.click('#btnLibrary');
    await page.click('[data-book-tab="personal"]');
  }
  console.log('Browser version:',browser.version());
  let suite = null;
  if(!process.argv.includes('--ui-only')){
    await page.goto(url+'?test=1');
    await page.waitForFunction(()=>globalThis.__TEST_RESULTS, null, {timeout:240000});
    suite = await page.evaluate(()=>globalThis.__TEST_RESULTS);
    console.log(JSON.stringify({suite:{total:suite.total,passed:suite.passed,failed:suite.failed,skipped:suite.skipped},failures:suite.cases.filter(c=>c.status==='fail')}));
    assert.equal(suite.failed,0);
    assert.equal(suite.skipped,0);
    assert.equal(suite.passed,suite.total);
    await page.evaluate(()=>localStorage.clear());
    fs.writeFileSync(path.join(output,'engine-results.json'),JSON.stringify(suite,null,2));
  }
  await page.goto(url);
  await page.waitForSelector('#btnLibrary');
  const liveFen = await page.locator('#fenOut').innerText();
  const positions = await page.evaluate(()=>CT.openingPositions());
  assert.equal(positions.length,12);
  await openPersonalLibrary();
  assert.equal(await page.locator('.study-card').count(),12);
  await page.screenshot({path:path.join(output,'opening-book-desktop.png')});
  await page.click('#libClose');
  for(const p of positions){
    await openPersonalLibrary();
    await page.locator('.lib-position-study').evaluateAll((els,id)=>els.find(e=>e.dataset.id===id).click(),p.id);
    assert.equal(await page.locator('#fenOut').innerText(),p.fen,p.title+' study board');
    assert((await page.locator('#statusCard').innerText()).includes(p.prompt),p.title+' question');
    await page.click('#pvNext');
    assert((await page.locator('#statusCard').innerText()).includes(p.why),p.title+' explanation');
    await page.click('#pvPrev');
    // Study -> practice is a board-mode hand-off, not a new live game.
    await openPersonalLibrary();
    await page.locator('.lib-position-practise').evaluateAll((els,id)=>els.find(e=>e.dataset.id===id).click(),p.id);
    assert.equal(await page.locator('#fenOut').innerText(),p.fen,p.title+' practice board');
    assert.equal(await page.locator('#previewBar').isVisible(),false);
    assert(!(await page.locator('#drillBody').innerText()).includes(p.why),'answer not leaked');
    const move=await page.evaluate(p=>{const m=CT.parseSAN(CT.parseFEN(p.fen),p.answerSan);return {from:CT.algOf(CT.mFrom(m)),to:CT.algOf(CT.mTo(m))};},p);
    await page.click('#board [data-sq="'+move.from+'"]');
    await page.click('#board [data-sq="'+move.to+'"]');
    assert.equal(await page.locator('.dr-verdict').innerText(),'Correct');
    assert((await page.locator('#drillBody').innerText()).includes(p.why),'correct response explains');
    await page.click('#drNext');
    assert((await page.locator('#drillBody').innerText()).includes('Set finished'));
    await page.click('#drExit');
    assert.equal(await page.locator('#fenOut').innerText(),liveFen,'live game restored');
  }
  // Recall score survives reload; all-position sets contain exactly the catalogue.
  // Reload immediately, without waiting for the 250 ms autosave timer.
  await page.reload();
  await openPersonalLibrary();
  for(const card of await page.locator('.study-card').all())
    assert((await card.innerText()).includes('1/1 unaided'),'all scores survived immediate reload');
  await page.click('.lib-position-all');
  assert((await page.locator('#drillBody').innerText()).includes('card 1 of 12'));
  await page.click('#drHint');
  assert((await page.locator('#drillBody').innerText()).includes('Hint 1:'));
  await page.click('#drSkip');
  assert((await page.locator('#drillBody').innerText()).includes('Skipped. The move was'));
  // Practice -> study must release drill ownership and restore the live board on exit.
  const first=positions[0];
  await openPersonalLibrary();
  await page.locator('.lib-position-study').evaluateAll((els,id)=>els.find(e=>e.dataset.id===id).click(),first.id);
  assert.equal(await page.locator('#drillCard').isVisible(),false);
  assert.equal(await page.locator('#fenOut').innerText(),first.fen);
  await page.screenshot({path:path.join(output,'study-position.png')});
  await page.click('#pvPlayHere');
  assert.equal(await page.locator('#previewBar').isVisible(),false);
  assert.equal(await page.locator('#fenOut').innerText(),first.fen);
  await page.fill('#moveInput',first.answerSan);
  await page.press('#moveInput','Enter');
  assert.notEqual(await page.locator('#fenOut').innerText(),first.fen,'play from here works');
  // Phone-sized library: controls remain inside the dialog and a single column.
  await page.setViewportSize({width:390,height:844});
  await openPersonalLibrary();
  assert.equal(await page.evaluate(()=>document.querySelector('#dlgLibrary').scrollWidth <= document.querySelector('#dlgLibrary').clientWidth),true,'no horizontal overflow');
  await page.screenshot({path:path.join(output,'opening-book-mobile.png')});
  // Old library import is still reviewable and does not show stale checkpoint buttons.
  await page.evaluate(()=>CT.importLibrary(JSON.stringify({schemaVersion:3,openings:[{id:'legacy',movesSan:['e4','e5'],sideToMove:'white',verified:false}],traps:[],plans:[]})));
  await page.click('#libClose');
  await openPersonalLibrary();
  assert.equal(await page.locator('.study-card').count(),0);
  assert.equal(await page.locator('.lib-prev').count(),1);
  await page.locator('.lib-prev').click();
  await page.click('#pvNext');
  assert((await page.locator('#statusCard').innerText()).includes('after e4'));
  assert.deepEqual(errors,[]);
  assert.deepEqual([...schemes].sort(),['blob:','file:']);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({browserVersion:browser.version(),suite,ui:'passed: 12 studies and practices, persistence, set, hints, skip, mode hand-offs, free play, mobile, v3 import',errors,schemes:[...schemes]},null,2));
  console.log('UI checks passed; no browser errors; offline requests only.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
