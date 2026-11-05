# Chess Trainer

A single-file, offline chess trainer: opening study and practice, a catalogue of
3,865 opening lines, spaced-repetition drills, matches against an NPC opponent,
a board setup editor, and PGN export. No network access at runtime; the engine
runs in a blob worker with a main-thread fallback.

## Use

Open `chess-trainer.html` in a browser. Progress saves to `localStorage`.

- `chess-trainer.html?test=1` runs the full self-test suite (including deep perft).
- `chess-trainer.html?test=1&fast=1` skips the four deep perft cases.

## Status and history

`HANDOFF.md` is the running session handoff: current state, schema versions,
verification results, conventions, and remaining work. Newest entries first.

## Opening library

`library/` holds the bundled opening data as standalone JSON: the 3,865-line
Lichess catalogue (opening-pack format), the 34 family lessons, and the built-in
personal library with its 12 study positions. `node library/extract.cjs`
regenerates them from the HTML. See `library/README.md`.

## Not yet in this repo

The opening catalogue, family lessons, engine and test blocks are generated into
the HTML by `chess-opening-packs/build.cjs`. Those build sources are not
committed here yet. `library/` holds extracted copies of the data, but the build
script and source modules exist only outside this repo. Edit the source modules,
not their generated copies, once they are added.

## Data

Opening names and move sequences come from the Lichess
[chess-openings](https://github.com/lichess-org/chess-openings) catalogue (CC0),
pinned at revision `3fd6ce992679e4d991a6bb4dade71f2b826c568a`.
