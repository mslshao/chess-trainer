# Chess Trainer

A single-file, offline chess trainer: opening study and practice, a catalogue of
3,865 opening lines, spaced-repetition drills, matches against an NPC opponent,
a board setup editor, and PGN export. No network access at runtime; the engine
runs in a blob worker with a main-thread fallback.

## Use

Open `chess-trainer.html` in a browser. Progress saves to `localStorage`.

- `chess-trainer.html?test=1` runs the full self-test suite (including deep perft).
- `chess-trainer.html?test=1&fast=1` skips the four deep perft cases.
- `node tests/run-node.cjs [--fast]` runs the same suite in Node, minus the
  browser-only worker probe. GitHub Actions runs it, checks the offline rebuild
  and checks that `library/` is in sync with the HTML. One Linux job watches the
  HTML, `library/`, `chess-opening-packs/`, `tests/` and the workflow.
- `tests/browser/README.md` explains the separate offline Edge harnesses.

## Status and history

`HANDOFF.md` is the current state: layout, versions, content, verification,
remaining work and conventions. `docs/HISTORY.md` is the earlier session log,
kept for the reasoning behind past decisions.

## Opening library

The catalogue and family lessons live in `chess-opening-packs/`. `library/` holds
the built-in personal library (40 lines, 4 traps, 3 plans, 12 study positions) as
importable JSON; `node library/extract.cjs` regenerates it from the HTML. See
`library/README.md`.

## Maintaining the build

The opening catalogue, family lessons, catalogue engine, UI and catalogue tests
are generated into three marked HTML blocks from `chess-opening-packs/`. Edit
the sources there, then run from the repository root:

```powershell
node chess-opening-packs/build-learning.cjs
node chess-opening-packs/build.cjs
node library/extract.cjs
```

All steps run offline on plain Node, without npm install. Other HTML content,
including the repertoire and its catalogue consistency test, is hand-maintained.
See `HANDOFF.md` for the exact boundaries and `chess-opening-packs/README.md` for
the pack format. Generated test results, screenshots and HTML backups are ignored.

Use this repository copy for future work. Keep the clone outside OneDrive to
avoid syncing Git locks. When moving from the old HTML path, use Save data in
the old copy to export progress, then import that save in the new copy if needed;
browser storage for local files can depend on their location.

## Data

Opening names and move sequences come from the Lichess
[chess-openings](https://github.com/lichess-org/chess-openings) catalogue (CC0),
pinned at revision `3fd6ce992679e4d991a6bb4dade71f2b826c568a`.
