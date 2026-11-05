'use strict';
/* Regenerates the library/ JSON files from chess-trainer.html.
   Usage, from the repo root: node library/extract.cjs [path/to/chess-trainer.html]
   Loads the HTML's engine block (Node-runnable as-is), writes the bundled data,
   and checks each file with the app's own validators. Exits non-zero on any
   mismatch, so a stale or broken extraction is never written silently. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.resolve(process.argv[2] || 'chess-trainer.html');
const outDir = __dirname;
const html = fs.readFileSync(htmlPath, 'utf8');

const begin = html.indexOf('<script id="engine">');
const end = html.indexOf('/*ENGINE-END*/');
if (begin < 0 || end < begin) throw new Error('engine block markers not found in ' + htmlPath);
const engine = html.slice(begin + '<script id="engine">'.length, end);

const mod = { exports: {} };
new Function('module', engine + `
module.exports = { CT, BUNDLED_OPENING_PACK, OPENING_LESSONS, exportLibrary,
  importLibrary, validateLibrary, normaliseOpeningPack, LIBRARY_SCHEMA_VERSION };`)(mod);
const E = mod.exports;

/* Catalogue: the pack's header fields pretty-printed, then one opening per line,
   so the file stays greppable and diffs show which lines changed. */
function writePack(file, pack){
  const { openings, ...meta } = pack;
  const head = JSON.stringify(meta, null, 2).replace(/\n}$/, '');
  const text = head + ',\n  "openings": [\n'
    + openings.map(function(o){ return '    ' + JSON.stringify(o); }).join(',\n') + '\n  ]\n}\n';
  assert.deepStrictEqual(JSON.parse(text), pack, 'pack round-trip');
  fs.writeFileSync(path.join(outDir, file), text);
  return text.length;
}

const pack = E.BUNDLED_OPENING_PACK;
const normalised = E.normaliseOpeningPack(pack);
assert.strictEqual(normalised.openings.length, pack.openings.length, 'every catalogue line validates');
const packBytes = writePack('lichess-catalogue.pack.json', pack);

const lessons = E.OPENING_LESSONS;
const lessonsText = JSON.stringify(lessons, null, 2) + '\n';
fs.writeFileSync(path.join(outDir, 'opening-lessons.json'), lessonsText);

/* Exactly what the app's Library export button produces for the built-in library. */
const libraryText = E.exportLibrary() + '\n';
const lib = JSON.parse(libraryText);
assert.deepStrictEqual(E.validateLibrary(lib), [], 'built-in library validates');
assert.strictEqual(lib.schemaVersion, E.LIBRARY_SCHEMA_VERSION, 'library schema version');
E.importLibrary(libraryText);
fs.writeFileSync(path.join(outDir, 'repertoire.library.json'), libraryText);

const positions = E.CT.openingPositions().length;
console.log([
  'lichess-catalogue.pack.json  ' + pack.openings.length + ' lines, ' + Math.round(packBytes / 1024) + ' KB',
  'opening-lessons.json         ' + lessons.length + ' family lessons, ' + Math.round(lessonsText.length / 1024) + ' KB',
  'repertoire.library.json      ' + lib.openings.length + ' openings, ' + lib.traps.length + ' traps, '
    + positions + ' study positions, schema v' + lib.schemaVersion + ', ' + Math.round(libraryText.length / 1024) + ' KB',
].join('\n'));
