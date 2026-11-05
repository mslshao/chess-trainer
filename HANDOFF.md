# Chess Trainer: handoff

Current state as of 2026-11-04 (America/Los_Angeles). `docs/HISTORY.md` has the earlier session log and
the reasoning behind past decisions; where the two differ, this file wins.

## What it is

`chess-trainer.html`: one file, offline, self-testing at `?test=1`. At runtime it
requests only `file:` (the document) and `blob:` (the engine worker), with a
main-thread fallback when workers are unavailable. Progress saves to
`localStorage`, with an in-memory fallback and a "not persisting" badge.

## Required workflow for future changes

Michael uses the original HTML location below. The repository is the source of
truth; the OneDrive file is the delivered copy, kept at the same path for normal
use and existing browser storage. Complete this workflow for future changes:

- Repository: https://github.com/mslshao/chess-trainer
- Working clone: `C:\src\chess-trainer`
- Original file used by Michael:
  `C:\Users\Michael\OneDrive\Documents\Important\GenAI\Games\chess-trainer.html`
- Local handoff beside that file:
  `C:\Users\Michael\OneDrive\Documents\Important\GenAI\Games\chess-trainer-handoff.md`

1. Inspect the clone's working state and bring it up to date with `main`, keeping
   any uncommitted work safe. Make changes in the clone, including edits to the
   maintained sources of generated blocks. The old OneDrive source folders are
   historical copies, not build inputs for future work.
2. Rebuild affected generated content and refresh `library/` as described below.
   For trainer code or content changes, run `node tests/run-node.cjs` and both
   browser harnesses from the clone, following `tests/browser/README.md`. The
   catalogue harness runs the full Edge suite; run the original-position harness
   with `--ui-only` to avoid duplicating that suite. Require no failures or skips,
   no browser errors, and only `file:` and `blob:` requests. Report actual counts;
   never weaken tests to obtain a pass. For documentation-only changes, review
   the diff and run `git diff --check`; the unchanged trainer need not be retested.
3. Update this handoff as needed, commit in logical pieces and push to `main`.
   Confirm the push succeeded and any triggered CI checks passed before copying
   a changed trainer to Michael's original location. A failed test or push leaves
   the last delivered trainer in place while the problem is resolved.
4. Copy the tested, committed and pushed `chess-trainer.html` from the clone over
   the original file above. Keep a backup of the previous delivered file outside
   Git before replacing it, and verify the two files have identical SHA-256 hashes.
   If they already match, no overwrite is needed. Keep the original path intact;
   do not clear or replace browser save data. Refresh the local handoff from this
   repository handoff after a successful push so either entry point gives the
   same instructions. Results, screenshots and backups stay local and ignored.
5. Report the pushed commit, verification results and successful copy back. If
   the machine or original path is unavailable, explicitly report delivery as
   pending; a repository push alone does not finish the local delivery step.

This is the standing delivery workflow requested by Michael. Future work should
finish with his usual original file updated, while all development stays in Git.

## Repository layout

| Path | Role |
| --- | --- |
| `chess-trainer.html` | The deliverable |
| `library/` | Built-in personal library as importable JSON, exported from the HTML by `library/extract.cjs`. A copy, not a source |
| `chess-opening-packs/` | Offline build sources, catalogue pack, lesson authoring source and pack guide |
| `tests/run-node.cjs` | The engine suite in Node |
| `tests/browser/` | Portable Edge harnesses and run instructions |
| `tests/artifacts/` | Ignored local browser results and screenshots |
| `.github/workflows/tests.yml` | Checks offline rebuild, Node suite and extracted library sync in one Linux job |
| `docs/HISTORY.md` | Pre-repository session log |

The GitHub repository is the source of truth. The Windows working clone is outside
OneDrive. `.gitattributes` keeps text files on LF line endings. The previous local
HTML matched the original upload SHA-256 exactly, so no local changes needed
merging. Earlier results, screenshots and HTML backups remain outside the repo.

`library/` holds only `repertoire.library.json`. The catalogue and lesson copies
that duplicated `chess-opening-packs/lichess-catalogue.json` and
`main-families.json` were removed on 2026-11-05.

## Generated and hand-maintained code

`chess-opening-packs/build.cjs` was inspected and run against the repository
HTML with no diff. It reads these files from its own folder and replaces only
the corresponding marked blocks in the root `chess-trainer.html`:

- `OFFLINE-BOOK`: `lichess-catalogue.json`, `main-families.json` and
  `catalogue-engine.js`.
- `OPENING-TESTS`: `catalogue-tests.js`.
- `OPENING-UI`: `catalogue-ui.js`.

If markers are absent, the builder inserts the blocks at its named anchors.
Everything outside those blocks is hand-maintained, including `REPERTOIRE_SEED`,
`TRAP_SEED`, `PLAN_SEED` and the authored-lines catalogue test following the
expanded-book validation test. The seven ECO fixes and that test survive a
rebuild unchanged. Edit generated blocks at their sources.

`build-learning.cjs` authors `main-families.json` from its lesson definitions and
the pinned catalogue. Both builders use only built-in Node modules and local
files. From the repo root, run `node chess-opening-packs/build-learning.cjs`,
`node chess-opening-packs/build.cjs`, then `node library/extract.cjs`. All three
were verified to leave the generated files unchanged.

## Versions

- `SAVE_VERSION = 3`. Version 1 and 2 saves still load.
- `LIBRARY_SCHEMA_VERSION = 4`, accepting 1 to 4 (`LIBRARY_SCHEMA_ACCEPTED`).
- Opening pack `packVersion` 1. Per file: 5 MB and 10,000 entries
  (`OPENING_PACK_CONFIG`); all imported packs together: 3 MB serialised.
- Lichess catalogue revision `3fd6ce992679e4d991a6bb4dade71f2b826c568a`, CC0,
  downloaded 2026-11-03.

## Landmarks

All present once each as of 2026-11-04 (America/Los_Angeles).

- Config: `PIVOT_CONFIG`, `GLOSSARY`, `PACING_PRESETS`, `SCENARIO_KINDS`,
  `STATS_CONFIG`, `MATCH_CONFIG`, `DRILL_SET_CONFIG`, `SETUP_CONFIG`,
  `OPENING_PACK_CONFIG`.
- Content: `REPERTOIRE_SEED`, `TRAP_SEED`, `PLAN_SEED`, `buildSeedLibrary`,
  `BUNDLED_OPENING_PACK`, `OPENING_LESSONS`, `openingPositions`.
- Flow: `submitTypedMove`, `leaveModes`, `noteMatchGameEnd`, `enterSetup`,
  `useSetup`, `buildDrillDeck`, `normaliseOpeningPack`.

## Content

3,865 catalogue lines, 34 family lessons, 40 repertoire lines, 4 traps, 3 plans,
12 study positions. All authored content is `verified: false`; nothing promotes
itself.

The test "authored lines follow the pinned catalogue" checks the 74 authored lines
(repertoire plus lessons) against the catalogue. 57 are named Lichess lines move
for move and must carry the Lichess ECO code. The other 17 are pinned to the
deepest named line they reach, by ply count and name, so a changed move is caught.
71 of the 74 stay on some catalogue line for every move. Only three leave it, and
their remaining moves are the only ones no catalogue line covers:

| Entry | Leaves after ply | Moves to source-check |
| --- | --- | --- |
| `londonSystem` | 5 | e6 e3 Bd6 Bd3 |
| `sicilianScheveningen` | 9 | e6 |
| `caroKann` | 7 | Bf5 |

## Verification

- 2026-11-05 cloud session, after the test above gained the leaves-catalogue
  check: rebuild unchanged, Node 193/193, and both browser harnesses passed in
  headless Chromium 153 (`CHESS_BROWSER_CHANNEL=chromium`), suite 194/194. Edge
  was not rerun for this test-only change.
- Edge 156.0.4314.50, headless at file:// from the Windows clone on 2026-11-04
  (America/Los_Angeles): 194/194, zero failures or skips. Zero page or console
  errors; requests used only file: and blob:. Networking was disabled and the
  test profile was separate from the user's normal browser profile.
- Node, node tests/run-node.cjs: 193/193, zero failures or skips, in 11.1 s.
  The worker probe is browser-only. --fast (or &fast=1 in the browser) skips four
  deep perft cases. The duplicate local engine-test.cjs was not imported.
- Both browser harnesses passed from the clone. catalogue-browser.cjs covered
  all 34 lesson study/answer flows, search, paging, bookmarks, position matching,
  pack lifecycle, persistence and mobile layouts. browser-test.cjs --ui-only
  covered all 12 original positions, scores after immediate reload, hints, skips,
  mode transitions, free play and schema-v3 imports. See tests/browser/README.md.
- Offline builders and library/extract.cjs reproduced the committed generated
  files with no differences. Imported files were checked for credentials and
  absolute machine paths; none remain. Results and screenshots are ignored.
- CI retains one Linux job, superseded-run cancellation and the 5-minute cap.
  One new step runs both offline builders and git diff --exit-code. The shared
  push/pull-request path filter now includes chess-opening-packs/**. The job
  still runs the Node suite and library sync check, with no npm install.
- Earlier simulated worker/storage fallback checks are recorded in
  docs/HISTORY.md; those simulations were not rerun during this migration.

## Remaining work

1. Human source check: annotation prose for all authored lines and traps, and the
   six moves in the three lines that leave the catalogue (table above).
2. Firefox at `file://` has never been run. The expected outcome is the
   main-thread fallback badge, which is verified by simulation in Chromium.
3. Optional, not started: drag-and-drop in the setup editor, and a "Save as
   scenario" shortcut from it.

## Conventions

Canadian spelling. No em-dashes anywhere. CONFIG-and-flag rather than silent
choices. Never weaken a failing test to reach green. Never fabricate opening
theory. When a test catches a content problem, sweep the whole class rather than
fixing the one instance. Edit generated blocks at their source. After changing the
HTML, run `node library/extract.cjs` and commit the result; CI fails otherwise.
