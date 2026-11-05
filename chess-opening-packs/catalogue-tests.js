test('offline catalogue: pinned pack is complete, legal and uses stable unique ids', function(){
  eq(_bundledPack.openings.length, 3865, 'all source lines included');
  eq(new Set(_bundledPack.openings.map(function(e){ return e.id; })).size, 3865, 'source ids unique');
  eq(_bundledPack.revision, '3fd6ce992679e4d991a6bb4dade71f2b826c568a', 'source snapshot recorded');
  for (const e of _bundledPack.openings) eq(validateRepertoireEntry(e).length, 0, e.nameEn);
  eq(JSON.parse(exportOpeningPack(_bundledPack.id)).openings.length, 3865, 'portable full pack');
});
test('learning families: every decision and explanation refers to a legal sourced line', function(){
  eq(OPENING_LESSONS.length, 34, 'broad learning coverage');
  const deck = learningCards();
  eq(new Set(deck.map(function(c){ return c.id; })).size, 34, 'stable distinct progress records');
  for (const e of OPENING_LESSONS){
    eq(validateRepertoireEntry(e).length, 0, e.nameEn + ' validates');
    ok(_bundledPack.openings.some(function(x){ return e.movesSan.every(function(s, i){ return s === x.movesSan[i]; }); }), e.nameEn + ' source prefix');
    ok(e.whitePlan.length > 30 && e.blackPlan.length > 30 && e.watch.length > 30, 'both sides and a caution taught');
    const c = deck.find(function(x){ return x.entryId === e.id; });
    parseSAN(parseFEN(c.fen), c.answerSan);
    eq(c.answerSan, e.movesSan[c.ply], 'decision is the next move');
    eq(buildDrillDeck({lessonId:e.id}).length, 1, 'targeted practice');
  }
  eq(buildDrillDeck({lessonsOnly:true,lessonIds:[OPENING_LESSONS[0].id,OPENING_LESSONS[1].id]}).length,2,'group practice stays scoped');
  eq(buildDrillDeck({lessonId:'missing'}).length,0,'missing lesson does not fall back to all');
});
test('catalogue search: accents, spelling, families, moves and bounded pages', function(){
  ok(queryOpeningCatalogue({query:'grunfeld defence'}).total > 0, 'accent and Canadian spelling');
  ok(queryOpeningCatalogue({query:'petroff'}).total > 0, 'common alias');
  const r = queryOpeningCatalogue({query:'B90',family:'Sicilian Defense',firstMove:'e4'});
  ok(r.total > 0 && r.rows.every(function(e){return e.eco.indexOf('B90')>=0;}),'combined filters');
  const a=queryOpeningCatalogue({}), b=queryOpeningCatalogue({page:1});
  eq(a.rows.length,24,'bounded DOM page');
  ok(!a.rows.some(function(e){return b.rows.some(function(x){return x.id===e.id;});}),'no overlap between pages');
  eq(queryOpeningCatalogue({query:'impossible-opening-name-zzzz'}).total,0,'empty search');
  eq(queryOpeningCatalogue({page:999999}).page,a.pages-1,'page clamped after filtering');
  ok(queryOpeningCatalogue({query:'e4 c5',firstMove:'e4'}).total>0,'moves searchable');
});
test('catalogue position filter: transpositions match and real position differences do not', function(){
  const e = catalogueEntries().find(function(e){return e.movesSan.join(' ')==='d4 Nf6 c4 e6 Nc3 Bb4';});
  ok(e,'Nimzo line found');
  const transpose=fenAfterSan(['c4','e6','Nc3','Nf6','d4','Bb4'],START_FEN);
  eq(cataloguePositionMatches(transpose).get(e.id),6,'same board from another move order');
  const changed=transpose.replace(' w KQkq ', ' w KQ ');
  ok(!cataloguePositionMatches(changed).has(e.id),'castling rights affect the match');
  eq(queryOpeningCatalogue({fen:transpose,family:'Nimzo-Indian Defense'}).total>0,true,'position and family filter combine');
});
test('packs: additive import, repeated content, conflicts and invalid data are handled atomically', function(){
  const packs=CT.importedPacks, prefs=CT.openingPrefs;
  try {
    CT.importedPacks=[]; CT.openingPrefs={favourites:[],catalogueOpponent:false};touchOpeningBook();
    const before=catalogueEntries().length, original=CT.library;
    const raw={packVersion:1,id:'test-pack',name:'Test pack',openings:[Object.assign({},BUNDLED_OPENING_PACK.openings[0]) ]};
    importOpeningPack(JSON.stringify(raw));
    eq(CT.library,original,'personal library untouched');
    eq(catalogueEntries().length,before,'duplicate catalogue content displayed once');
    eq(importOpeningPack(JSON.stringify(raw)).duplicate,true,'same pack is idempotent');
    throwsWith(function(){importOpeningPack(JSON.stringify(Object.assign({},raw,{name:'Different'})));},/already uses/,'conflict is explicit');
    const broken={packVersion:1,id:'broken',name:'Bad',openings:[{id:'bad',nameEn:'Illegal',movesSan:['e5']}]};
    throwsWith(function(){importOpeningPack(JSON.stringify(broken));},/legal/);
    eq(CT.importedPacks.length,1,'failed import did not commit');
    eq(importOpeningPack(exportOpeningPack(_bundledPack.id)).duplicate,true,'included pack never duplicates');
    removeOpeningPack('test-pack');eq(CT.importedPacks.length,0,'remove imported pack');
    throwsWith(function(){removeOpeningPack(_bundledPack.id);},/included/);
  } finally {CT.importedPacks=packs;CT.openingPrefs=prefs;touchOpeningBook();}
});
test('opening save: packs, bookmarks and custom lines survive; malformed books cannot partly restore', function(){
  const saved={packs:CT.importedPacks,prefs:CT.openingPrefs,library:CT.library,custom:CT.libraryCustomized,stats:CT.drillStats};
  try {
    CT.importedPacks=[];CT.openingPrefs={favourites:[],catalogueOpponent:true};touchOpeningBook();
    importOpeningPack(JSON.stringify({packVersion:1,id:'save-test',name:'Save test',openings:[{id:'line',nameEn:'Test move order',movesSan:['a3','a6']}] }));
    toggleOpeningFavourite('pack:save-test:line');
    CT.library=buildSeedLibrary();CT.libraryCustomized=true;
    const data=JSON.parse(exportSaveFile({}));
    CT.importedPacks=[];CT.openingPrefs={favourites:[],catalogueOpponent:false};touchOpeningBook();
    applySaveState(data);
    eq(CT.importedPacks.length,1,'pack restored');
    eq(CT.openingPrefs.favourites[0],'pack:save-test:line','bookmark restored');
    eq(CT.openingPrefs.catalogueOpponent,true,'opponent choice restored');
    eq(CT.libraryCustomized,true,'personal library restored');
    const before=CT.drillStats;
    throwsWith(function(){applySaveState({saveVersion:3,drillStats:{shouldNotCommit:{seen:3}},openingBooks:{version:99,packs:[]}});},/malformed/);
    eq(CT.drillStats,before,'bad book rejected before other progress changes');
  } finally {CT.importedPacks=saved.packs;CT.openingPrefs=saved.prefs;CT.library=saved.library;CT.libraryCustomized=saved.custom;CT.drillStats=saved.stats;touchOpeningBook();}
});
test('catalogue practice: selected lines generate bounded legal cards and avoid flooding ordinary drills', function(){
  const e=catalogueEntries().find(function(e){return e.movesSan.length>=24;});
  const deck=buildDrillDeck({entryId:e.id,include:'openings'});
  eq(deck.length,8,'long line practice capped');
  for(const c of deck){eq(c.entryId,e.id,'selected line only');parseSAN(parseFEN(c.fen),c.answerSan);}
  ok(buildDrillDeck({include:'openings'}).length<150,'default drills remain focused');
  eq(buildDrillDeck({entryId:'missing'}).length,0,'invalid selection stays empty');
});
test('book candidates require the matching board, even when move text is legal elsewhere', function(){
  const off = parseFEN(fenAfterSan(['a3','a6','e4'],START_FEN));
  eq(bookCandidates(['e4'],off).length,0,'unrelated FEN cannot borrow an opening move');
  eq(bookNextMove(['e4'],off),null,'deepest-line lookup also rejects it');
  eq(bookBranches(['e4'],genFEN(off)).length,0,'no misleading arrows');
  const correct = parseFEN(fenAfterSan(['e4'],START_FEN));
  correct.fullmove=20;
  ok(bookCandidates(['e4'],correct).length>0,'move counter does not change position identity');
});
test('worker book: imported custom starts and opponent selection reach the actual NPC worker', async function(){
  const saved={packs:CT.importedPacks,prefs:CT.openingPrefs,library:CT.library,custom:CT.libraryCustomized};
  try {
    CT.importedPacks=[];CT.openingPrefs={favourites:[],catalogueOpponent:true};
    CT.library={schemaVersion:4,openings:[],traps:[],plans:[]};touchOpeningBook();
    const fen='4k3/8/8/8/8/8/8/R3K3 w - - 0 1';
    importOpeningPack(JSON.stringify({packVersion:1,id:'worker-test',name:'Worker test',openings:[{id:'line',nameEn:'Custom rook start',fen:fen,movesSan:['Ra2','Kd7']}]}));
    const after=fenAfterSan(['Ra2'],fen);
    const r=await CT.npcMoveAsync(after,['Ra2'],{tier:'Novice',seed:17,ply:1});
    eq(r.source,'book','imported book used');eq(r.san,'Kd7','same intended continuation');
    if(typeof document!=='undefined' && CT.worker)eq(r.via,'worker','real worker used');
  } finally {CT.importedPacks=saved.packs;CT.openingPrefs=saved.prefs;CT.library=saved.library;CT.libraryCustomized=saved.custom;touchOpeningBook();}
});
