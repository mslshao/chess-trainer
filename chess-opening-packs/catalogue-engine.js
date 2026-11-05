/* Offline opening catalogue. Data is embedded by build.cjs; no runtime fetch. */
const OPENING_PACK_CONFIG = { version: 1, maxBytes: 5 * 1024 * 1024, maxEntries: 10000, pageSize: 24 };
CT.importedPacks = [];
CT.openingPrefs = { favourites: [], catalogueOpponent: false };
CT.libraryCustomized = false;
CT.bookRevision = 0;
let _catalogueCache = null, _positionIndex = null, _entryPositionKeys = new WeakMap();
function touchOpeningBook(){ CT.bookRevision++; _catalogueCache = null; _positionIndex = null; _entryPositionKeys = new WeakMap(); }
/* Identical move text can arise from different FEN starts. Only the actual
   matching board may supply an NPC book move. Cache the legal position trail. */
function matchesOpeningPosition(entry, ply, pos){
  let keys = _entryPositionKeys.get(entry);
  if (!keys){
    try {
      const scan = parseFEN(entry.fen || START_FEN); keys = [repetitionKey(scan)];
      for (const san of entry.movesSan){ makeMove(scan, parseSAN(scan, san)); keys.push(repetitionKey(scan)); }
      _entryPositionKeys.set(entry, keys);
    } catch (e){ return false; }
  }
  return keys[ply] === repetitionKey(pos);
}
function openingText(s){
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/defence/g, 'defense').replace(/petroff/g, 'petrov').replace(/[’']/g, '').replace(/[^a-z0-9+#]+/g, ' ').trim();
}
function openingFamily(e){
  const n = e.family || e.nameEn || 'Other openings';
  for (const prefix of ["King's Gambit", 'Benko Gambit', 'London System', 'French Defense', "Queen's Indian Defense", 'Semi-Slav Defense'])
    if (n.indexOf(prefix) === 0) return prefix;
  return n.split(':')[0].split(',')[0];
}
function normaliseOpeningPack(raw){
  if (!raw || raw.packVersion !== 1) throw new Error('This is not an opening pack version 1.');
  if (typeof raw.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(raw.id)) throw new Error('Pack id must use letters, digits, dots, dashes or underscores.');
  if (typeof raw.name !== 'string' || !raw.name.trim()) throw new Error('Pack name is required.');
  if (!Array.isArray(raw.openings) || !raw.openings.length || raw.openings.length > OPENING_PACK_CONFIG.maxEntries)
    throw new Error('A pack needs 1 to ' + OPENING_PACK_CONFIG.maxEntries + ' opening lines.');
  const ids = new Set();
  const entries = raw.openings.map(function(x){
    if (!x || typeof x.id !== 'string' || !x.id.trim() || ids.has(x.id)) throw new Error('Each opening needs a unique id.');
    ids.add(x.id);
    if (typeof x.nameEn !== 'string' || !x.nameEn.trim() || !Array.isArray(x.movesSan) || x.movesSan.length > 80
      || x.movesSan.some(function(s){ return typeof s !== 'string' || s.length > 16; })) throw new Error('Invalid name or moves for ' + x.id);
    const start = parseFEN(x.fen || START_FEN);
    const turn = start.turn ^ (x.movesSan.length % 2 ? BLACK : 0);
    const e = { id: x.id, eco: typeof x.eco === 'string' ? x.eco : '', nameEn: x.nameEn,
      movesSan: x.movesSan.slice(), sideToMove: turn === WHITE ? 'white' : 'black',
      verified: false, tag: 'catalogue', sourceField: typeof raw.source === 'string' ? raw.source : '',
      idea: typeof x.idea === 'string' ? x.idea : '' };
    if (x.fen) e.fen = genFEN(start);
    if (x.notes !== undefined) e.notes = x.notes;
    if (x.positions !== undefined) e.positions = x.positions;
    const errs = validateRepertoireEntry(e);
    if (errs.length) throw new Error(x.nameEn + ': ' + errs.join('; '));
    return e;
  });
  return { packVersion: 1, id: raw.id, name: raw.name, source: typeof raw.source === 'string' ? raw.source : '',
    licence: typeof raw.licence === 'string' ? raw.licence : '', revision: typeof raw.revision === 'string' ? raw.revision : '',
    downloadedOn: typeof raw.downloadedOn === 'string' ? raw.downloadedOn : '', openings: entries };
}
const _bundledPack = normaliseOpeningPack(BUNDLED_OPENING_PACK);
function openingPackList(){ return [_bundledPack].concat(CT.importedPacks); }
function catalogueEntries(){
  if (_catalogueCache) return _catalogueCache;
  const seen = new Set(), out = [];
  for (const pack of openingPackList()) for (const e of pack.openings){
    const fingerprint = JSON.stringify([e.eco, e.nameEn, e.fen || START_FEN, e.movesSan]);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    out.push(Object.assign({}, e, { id: 'pack:' + pack.id + ':' + e.id, packId: pack.id, family: openingFamily(e) }));
  }
  out.sort(function(a, b){ return a.family.localeCompare(b.family) || a.movesSan.length - b.movesSan.length || a.nameEn.localeCompare(b.nameEn) || a.id.localeCompare(b.id); });
  _catalogueCache = out;
  return out;
}
function findOpeningEntry(id){
  return CT.library.openings.find(function(e){ return e.id === id; })
    || OPENING_LESSONS.find(function(e){ return e.id === id; })
    || catalogueEntries().find(function(e){ return e.id === id; });
}
function allBookEntries(){ return CT.library.openings.concat(catalogueEntries()); }
function opponentBookEntries(){ return CT.openingPrefs.catalogueOpponent ? allBookEntries() : CT.library.openings; }
function importOpeningPack(text){
  if (typeof text !== 'string' || byteLength(text) > OPENING_PACK_CONFIG.maxBytes) throw new Error('Opening packs must be smaller than 5 MB.');
  let raw; try { raw = JSON.parse(text); } catch (e){ throw new Error('The pack is not valid JSON.'); }
  const pack = normaliseOpeningPack(raw);
  if (pack.id === _bundledPack.id){
    if (pack.revision === _bundledPack.revision && JSON.stringify(pack.openings) === JSON.stringify(_bundledPack.openings))
      return { pack: _bundledPack, duplicate: true };
    throw new Error('This id belongs to the included catalogue. Give a separate pack a different id.');
  }
  const existing = CT.importedPacks.find(function(p){ return p.id === pack.id; });
  if (existing){
    if (JSON.stringify(existing) === JSON.stringify(pack)) return { pack: existing, duplicate: true };
    throw new Error('A different pack already uses this id. Remove that pack first or choose a new id.');
  }
  if (byteLength(JSON.stringify(CT.importedPacks.concat([pack]))) > 3 * 1024 * 1024)
    throw new Error('Extra packs exceed the 3 MB saved-book limit. Remove an unused pack first.');
  CT.importedPacks.push(pack); touchOpeningBook();
  return { pack: pack, duplicate: false };
}
function removeOpeningPack(id){
  if (id === _bundledPack.id) throw new Error('The included catalogue stays available offline.');
  CT.importedPacks = CT.importedPacks.filter(function(p){ return p.id !== id; });
  CT.openingPrefs.favourites = CT.openingPrefs.favourites.filter(function(x){ return x.indexOf('pack:' + id + ':') !== 0; });
  touchOpeningBook();
}
function exportOpeningPack(id){
  if (id === _bundledPack.id) return JSON.stringify(BUNDLED_OPENING_PACK, null, 2);
  const p = CT.importedPacks.find(function(x){ return x.id === id; });
  if (!p) throw new Error('Pack not found.');
  return JSON.stringify(p, null, 2);
}
function toggleOpeningFavourite(id){
  if (!findOpeningEntry(id)) return;
  const fav = CT.openingPrefs.favourites, i = fav.indexOf(id);
  if (i < 0) fav.push(id); else fav.splice(i, 1);
}
function openingBookSave(){
  return { version: 1, packs: CT.importedPacks, prefs: CT.openingPrefs,
    library: CT.libraryCustomized ? CT.library : null };
}
function prepareOpeningBookSave(raw){
  if (!raw || raw.version !== 1 || !Array.isArray(raw.packs)) throw new Error('Saved opening books are malformed.');
  const packs = raw.packs.map(normaliseOpeningPack);
  const ids = packs.map(function(p){ return p.id; });
  if (new Set(ids).size !== ids.length || ids.indexOf(_bundledPack.id) >= 0) throw new Error('Saved packs have conflicting ids.');
  if (byteLength(JSON.stringify(packs)) > 3 * 1024 * 1024) throw new Error('Saved extra packs exceed 3 MB.');
  if (raw.library){ const errs = validateLibrary(raw.library); if (errs.length) throw new Error('Saved custom library: ' + errs[0]); }
  const prefs = raw.prefs || {};
  return { packs: packs, library: raw.library || null, prefs: {
    favourites: Array.isArray(prefs.favourites) ? Array.from(new Set(prefs.favourites.filter(function(x){ return typeof x === 'string'; }))).slice(0,10000) : [],
    catalogueOpponent: prefs.catalogueOpponent === true } };
}
function restoreOpeningBooks(saved){
  CT.importedPacks = saved.packs; CT.openingPrefs = saved.prefs;
  if (saved.library){ CT.library = saved.library; CT.libraryCustomized = true; }
  else if (CT.libraryCustomized){ CT.library = buildSeedLibrary(); CT.libraryCustomized = false; }
  touchOpeningBook();
}
function cataloguePositionKey(pos){ return repetitionKey(pos); }
function cataloguePositionMatches(fen){
  if (!_positionIndex){
    const index = new Map();
    for (const e of catalogueEntries()){
      const pos = parseFEN(e.fen || START_FEN), seen = new Set();
      for (let ply = 0; ply <= e.movesSan.length; ply++){
        const key = cataloguePositionKey(pos);
        if (!seen.has(key)){
          if (!index.has(key)) index.set(key, new Map());
          index.get(key).set(e.id, ply); seen.add(key);
        }
        if (ply < e.movesSan.length) makeMove(pos, parseSAN(pos, e.movesSan[ply]));
      }
    }
    _positionIndex = index;
  }
  return _positionIndex.get(cataloguePositionKey(parseFEN(fen))) || new Map();
}
function queryOpeningCatalogue(opts){
  const o = opts || {}, words = openingText(o.query).split(' ').filter(Boolean);
  const at = o.fen ? cataloguePositionMatches(o.fen) : null;
  const fav = new Set(CT.openingPrefs.favourites);
  const rows = catalogueEntries().filter(function(e){
    if (o.family && e.family !== o.family) return false;
    if (o.firstMove && (o.firstMove === 'other' ? ['e4','d4','c4','Nf3'].indexOf(e.movesSan[0]) >= 0 : e.movesSan[0] !== o.firstMove)) return false;
    if (o.favourites && !fav.has(e.id)) return false;
    if (at && !at.has(e.id)) return false;
    const text = openingText(e.nameEn + ' ' + e.eco + ' ' + e.movesSan.join(' '));
    return words.every(function(w){ return text.indexOf(w) >= 0; });
  });
  const pageSize = Math.min(100, Math.max(1, Number(o.pageSize) || OPENING_PACK_CONFIG.pageSize));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(0, Math.min(pages - 1, Number(o.page) || 0));
  return { total: rows.length, page: page, pages: pages, rows: rows.slice(page * pageSize, (page + 1) * pageSize), matches: at };
}
function learningCards(lessonId){
  const lessons = lessonId ? OPENING_LESSONS.filter(function(e){ return e.id === lessonId; }) : OPENING_LESSONS;
  return lessons.map(function(e){
    const p = e.positions[0], moves = e.movesSan.slice(0, p.ply), fen = fenAfterSan(moves, START_FEN);
    return { id: 'lesson:' + e.id + ':' + p.id, kind: 'opening', entryId: e.id, positionId: p.id,
      ply: p.ply, title: p.title, nameEn: e.nameEn, eco: e.eco, fen: fen, answerSan: stripSan(e.movesSan[p.ply]),
      prompt: p.prompt, why: p.explanation, movesSoFar: moves, side: parseFEN(fen).turn === WHITE ? 'white' : 'black', fullLine: e.movesSan.slice(p.ply) };
  });
}
function openingDrillLabel(id){
  const parts = /^(trap|opening|position|lesson):(.+):([^:]+)$/.exec(id);
  if (!parts) return 'Practice card';
  const entry = parts[1] === 'trap' ? CT.library.traps.find(function(e){ return e.id === parts[2]; }) : findOpeningEntry(parts[2]);
  if (!entry) return 'Opening from a removed library or pack';
  const checkpoint = (entry.positions || []).find(function(p){ return p.id === parts[3]; });
  return checkpoint ? checkpoint.title : entry.nameEn || 'Opening practice';
}
Object.assign(CT, { OPENING_PACK_CONFIG, OPENING_LESSONS, touchOpeningBook, openingText, openingFamily,
  openingPackList, catalogueEntries, findOpeningEntry, allBookEntries, opponentBookEntries, importOpeningPack,
  removeOpeningPack, exportOpeningPack, toggleOpeningFavourite, openingBookSave, prepareOpeningBookSave,
  restoreOpeningBooks, cataloguePositionMatches, queryOpeningCatalogue, learningCards, matchesOpeningPosition, openingDrillLabel });
