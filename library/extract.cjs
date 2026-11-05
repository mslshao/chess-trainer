'use strict';
/* Regenerates library/repertoire.library.json from chess-trainer.html.
   Usage, from the repo root: node library/extract.cjs [path/to/chess-trainer.html]
   Loads the HTML's engine block (Node-runnable as-is), exports the built-in personal
   library exactly as the app's Library export does, and checks it with the app's
   own validators before writing. Exits non-zero on a failure. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.resolve(process.argv[2] || 'chess-trainer.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const begin = html.indexOf('<script id="engine">');
const end = html.indexOf('/*ENGINE-END*/');
if (begin < 0 || end < begin) throw new Error('engine block markers not found in ' + htmlPath);
const engine = html.slice(begin + '<script id="engine">'.length, end);

const mod = { exports: {} };
new Function('module', engine + `
module.exports = { CT, exportLibrary, importLibrary, validateLibrary, LIBRARY_SCHEMA_VERSION };`)(mod);
const E = mod.exports;

const libraryText = E.exportLibrary() + '\n';
const lib = JSON.parse(libraryText);
assert.deepStrictEqual(E.validateLibrary(lib), [], 'built-in library validates');
assert.strictEqual(lib.schemaVersion, E.LIBRARY_SCHEMA_VERSION, 'library schema version');
E.importLibrary(libraryText);
fs.writeFileSync(path.join(__dirname, 'repertoire.library.json'), libraryText);

console.log('repertoire.library.json  ' + lib.openings.length + ' openings, ' + lib.traps.length + ' traps, '
  + lib.plans.length + ' plans, ' + E.CT.openingPositions().length + ' study positions, schema v'
  + lib.schemaVersion + ', ' + Math.round(libraryText.length / 1024) + ' KB');
