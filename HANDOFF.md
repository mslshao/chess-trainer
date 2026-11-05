# Chess Trainer: handoff

Current state as of 2026-11-05. `docs/HISTORY.md` has the earlier session log and
the reasoning behind past decisions; where the two differ, this file wins.

## What it is

`chess-trainer.html`: one file, offline, self-testing at `?test=1`. At runtime it
requests only `file:` (the document) and `blob:` (the engine worker), with a
main-thread fallback when workers are unavailable. Progress saves to
`localStorage`, with an in-memory fallback and a "not persisting" badge.

## Repository layout

| Path | Role |
| --- | --- |
| `chess-trainer.html` | The deliverable |
| `library/` | Bundled opening data as JSON, extracted from the HTML by `library/extract.cjs`. Copies, not sources |
| `tests/run-node.cjs` | The engine suite in Node |
| `.github/workflows/tests.yml` | Runs the Node suite and fails if `library/` no longer matches the HTML |
| `docs/HISTORY.md` | Pre-repository session log |

Not committed yet: `chess-opening-packs/` (`build.cjs`, the source modules for
the generated blocks, and the pack README) and `chess-trainer-checks/` (browser
harnesses). Until they are, generated blocks can only be edited in the HTML, and a
rebuild from the local folder would overwrite those edits.

## Generated and hand-maintained code

`build.cjs` writes the blocks between these markers: `OFFLINE-BOOK` (catalogue
pack, family lessons, catalogue logic), `OPENING-TESTS` and `OPENING-UI`. Edit
their source modules, not the HTML copy. Everything else is hand-maintained in
the HTML, including `REPERTOIRE_SEED`, `TRAP_SEED` and `PLAN_SEED`. This split is
inferred from the markers and the old handoff; confirm it against `build.cjs` once
that is committed.

## Versions

- `SAVE_VERSION = 3`. Version 1 and 2 saves still load.
- `LIBRARY_SCHEMA_VERSION = 4`, accepting 1 to 4 (`LIBRARY_SCHEMA_ACCEPTED`).
- Opening pack `packVersion` 1. Per file: 5 MB and 10,000 entries
  (`OPENING_PACK_CONFIG`); all imported packs together: 3 MB serialised.
- Lichess catalogue revision `3fd6ce992679e4d991a6bb4dade71f2b826c568a`, CC0,
  downloaded 2026-11-03.

## Landmarks

All present once each as of 2026-11-05.

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
(repertoire plus lessons) against the catalogue. 57 are Lichess lines move for
move and must carry the Lichess ECO code. The other 17 continue a named Lichess
line and are listed in the test with that line's ply count and name; only their
extra moves are unchecked. That table, plus all annotation prose, is the human
source-check list.

## Verification

- Browser, `?test=1`: 194/194 in headless Chromium 153 at `file://` on
  2026-11-05, with zero page errors, zero console output, only `file:` and
  `blob:` requests, and the worker badge on. The last Edge run was 193/193 on
  2026-11-03, before the catalogue test existed.
- Node, `node tests/run-node.cjs`: 193/193 in about 17 s. The worker probe is
  browser-only. `--fast` (or `&fast=1` in the browser) skips four deep perft cases.
- CI: GitHub Actions runs the Node suite and the `library/` sync check on pushes
  that touch the HTML, `library/`, `tests/` or the workflow. Linux runner,
  superseded runs cancelled, 5-minute cap, to stay inside the free allowance.
- UI flows, screenshots and the degraded modes (worker throws, `localStorage`
  throws) are checked by the browser harnesses, which are not in the repo yet.

## Remaining work

1. Commit `chess-opening-packs/` and the harness scripts from
   `chess-trainer-checks/`. Results, screenshots and HTML backups can stay local.
2. Human source check: annotation prose for all authored lines and traps, and the
   moves past the catalogue for the 17 lines in the test table.
3. Firefox at `file://` has never been run. The expected outcome is the
   main-thread fallback badge, which is verified by simulation in Chromium.
4. Optional, not started: drag-and-drop in the setup editor, and a "Save as
   scenario" shortcut from it.

## Conventions

Canadian spelling. No em-dashes anywhere. CONFIG-and-flag rather than silent
choices. Never weaken a failing test to reach green. Never fabricate opening
theory. When a test catches a content problem, sweep the whole class rather than
fixing the one instance. Edit generated blocks at their source. After changing the
HTML, run `node library/extract.cjs` and commit the result; CI fails otherwise.
