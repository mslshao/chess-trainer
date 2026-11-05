'use strict';
/* Runs the engine test suite (the same suite as chess-trainer.html?test=1) in Node.
   Usage, from the repo root: node tests/run-node.cjs [--fast] [path/to/chess-trainer.html]
   --fast skips the deep perft cases. The worker probe is browser-only, so Node runs
   one case fewer than the browser. Exits non-zero on any failure. */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fast = args.includes('--fast');
const htmlPath = path.resolve(args.find(function(a){ return !a.startsWith('--'); }) || 'chess-trainer.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const begin = html.indexOf('<script id="engine">');
const end = html.indexOf('/*ENGINE-END*/');
if (begin < 0 || end < begin) throw new Error('engine block markers not found in ' + htmlPath);
const mod = { exports: {} };
new Function('module', html.slice(begin + '<script id="engine">'.length, end) + '\nmodule.exports = CT;')(mod);

const t0 = Date.now();
mod.exports.runTests({ fast: fast }).then(function(r){
  for (const c of r.cases) if (c.status === 'fail') console.log('FAIL  ' + c.name + '\n      ' + c.detail);
  console.log(r.passed + '/' + r.total + ' passed, ' + r.failed + ' failed, ' + r.skipped + ' skipped in '
    + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  process.exitCode = r.failed ? 1 : 0;
});
