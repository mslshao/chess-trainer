# Opening library

The opening data bundled inside `chess-trainer.html`, as standalone JSON.
These files are extracted from the HTML; the HTML does not read them.

| File | Contents | Format |
| --- | --- | --- |
| `lichess-catalogue.pack.json` | 3,865 Lichess catalogue lines, one per line of the file | Opening pack, `packVersion` 1 |
| `opening-lessons.json` | 34 family lessons: both sides' plans, a caution, one key decision | Array of lesson objects |
| `repertoire.library.json` | Built-in personal library: 40 opening lines, 4 traps, 3 plans, 12 study positions | Library, `schemaVersion` 4 |

`repertoire.library.json` is the same JSON the app's Library export shows before
any personal edits, so it can be pasted back through Library import.
The catalogue pack is the reference example of the opening-pack format; importing
it into the app is redundant because the same lines are already built in.

## Regenerating

After changing the HTML, from the repo root:

```bash
node library/extract.cjs
```

The script loads the HTML's engine block and writes all three files. Before
writing, it checks the catalogue with `normaliseOpeningPack` and the library with
`validateLibrary` and `importLibrary`, and exits non-zero on a failure. The lessons
have no app-side validator; they are written as embedded.

These are copies, not sources. The canonical sources live in
`chess-opening-packs/` (with `build.cjs`). The catalogue and lesson JSON here
match that folder as parsed JSON and duplicate those sources. They are retained
for now; `repertoire.library.json` remains the separate built-in personal-library
export. Rebuild from the sources before extracting after a content change.

## Licence

Catalogue names and move sequences: Lichess
[chess-openings](https://github.com/lichess-org/chess-openings), CC0-1.0, revision
`3fd6ce992679e4d991a6bb4dade71f2b826c568a`. Lessons, repertoire annotations and
study positions are original to this project and remain `verified: false` pending
a human source check.
