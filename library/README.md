# Built-in personal library

`repertoire.library.json` is the trainer's built-in personal library (40 opening
lines, 4 traps, 3 plans and 12 study positions; `schemaVersion` 4), exported from
`chess-trainer.html`. The HTML does not read it. It is the same JSON the app's
Library export shows before any personal edits, so it can be pasted back through
Library import.

The catalogue and family lessons are not duplicated here. Their sources are
`chess-opening-packs/lichess-catalogue.json` and `main-families.json`.

## Regenerating

After changing the HTML, from the repo root:

```bash
node library/extract.cjs
```

The script loads the HTML's engine block, exports the library, and checks it with
`validateLibrary` and `importLibrary` before writing. It exits non-zero on a
failure. CI fails if the committed file no longer matches the HTML.

## Licence

Repertoire annotations, traps, plans and study positions are original to this
project and remain `verified: false` pending a human source check. Move sequences
are cross-checked against the Lichess
[chess-openings](https://github.com/lichess-org/chess-openings) catalogue (CC0-1.0).
