# Offline opening books

Open `../chess-trainer.html` directly in your browser. The full catalogue and the
learning material are embedded in that file. No server, account, installation,
or internet connection is needed. The neighbouring files are useful for sharing
packs and maintaining the content; the trainer does not fetch them at runtime.

## Using the library

- **Learn openings:** 34 main opening families. Expand a family for its main
  idea, plans for White and Black, a point to watch, and a representative line.
  Study its key position, practise the decision, preview the line from the start,
  or explore the family's variations. Filter by group or search for an idea.
  Practice sets contain up to ten selected family decisions, with one retry for
  missed or hinted cards. The scores reflect recall of the featured decision.
- **Explore catalogue:** 3,865 named lines, grouped into 136 family headings.
  Search by name, ECO code or moves; filter by family and first move; save
  openings for later. Results show 24 lines per page. The board-position filter
  finds lines that pass through the board currently shown, including other move
  orders. It compares board, turn, castling rights and relevant en passant rights.
  Preview a line or practise up to eight of its final moves.
- **My lines & traps:** the original 40 personal repertoire lines, 12 study
  positions, traps and plans. Additions and personal-library imports now persist.
  Replacing this library does not remove the catalogue or family lessons.
- **Opening packs:** load a JSON pack from your computer, download an included
  or added pack, or remove an added pack. Repeated imports do not duplicate a
  pack. Conflicting pack ids are rejected rather than silently overwriting data.

The opponent uses personal repertoire lines by default. The Opening packs view
lets you also enable the full catalogue for opponent play. The catalogue
includes experimental gambits and historical lines; naming a line does not
establish that its moves are optimal. Catalogue practice tests the chosen line,
and alternative legal moves may also be sound.

Progress, bookmarks, imported packs, opponent-book preference and personal
library changes are saved automatically in this browser. **Save data** exports
them together for backup or transfer. If browser storage is unavailable or full,
the trainer shows its existing “not persisting” badge; export a save file to keep
the session. **Clear saved data** also removes added packs and personal edits,
restoring the included content. Removing an individual pack keeps its drill
history. Included content cannot be removed by the pack controls.

## Pack format

`lichess-catalogue.json` is the portable copy of the included catalogue. A small
additional pack can look like this:

```json
{
  "packVersion": 1,
  "id": "my-opening-notes",
  "name": "My opening notes",
  "source": "",
  "licence": "",
  "revision": "1",
  "openings": [
    {
      "id": "italian-basics",
      "eco": "C50",
      "nameEn": "Italian Game: My starter line",
      "movesSan": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
      "idea": "Develop toward the centre and prepare to castle."
    }
  ]
}
```

Use a stable unique pack id and unique opening ids within it. `nameEn` and
`movesSan` are required. `fen` can specify a nonstandard starting position.
Optional `notes` are move-by-move strings parallel to `movesSan`; use empty strings
where no note is supplied. The importer derives the side to move and validates
every move. It does not mark imported material human-verified.

Pack files may be up to 5 MB, with at most 10,000 lines of up to 80 half-moves
each. All extra packs together must fit within a 3 MB serialised budget so normal
progress still has room in browser storage. The included catalogue is embedded
and does not use that extra-pack budget. To replace an added pack with a different
revision under the same id, remove the old one and load the new one. Save a backup
first if you want to preserve its bookmarks.

## Provenance and learning scope

The catalogue is the complete five-volume
[Lichess chess-openings dataset](https://github.com/lichess-org/chess-openings)
at revision `3fd6ce992679e4d991a6bb4dade71f2b826c568a`, retrieved 2026-11-03.
Lichess releases the collection under **CC0-1.0**. All 3,865 source rows are
included. Display grouping combines a few related source headings; the original
line names and moves are retained. The `lc-…` ids are stable hashes of ECO code,
name and move sequence, not row numbers.

The 34 family introductions are authored teaching material, not annotations
provided by Lichess. Each representative line matches a catalogue sequence or
prefix. Each key decision has a legal, explicit continuation and an explanation;
these are introductions rather than exhaustive lessons on every variation.
Names, lines and broad structural descriptions were checked using the catalogue
and Chess.com's opening references, including the
[Ruy Lopez](https://www.chess.com/openings/Ruy-Lopez-Opening),
[Sicilian](https://www.chess.com/openings/Sicilian-Defense),
[French](https://www.chess.com/openings/French-Defense),
[Caro-Kann](https://www.chess.com/openings/Caro-Kann-Defense),
[Slav](https://www.chess.com/openings/Slav-Defense),
[Semi-Slav](https://www.chess.com/openings/Semi-Slav-Defense),
[London](https://www.chess.com/openings/London-System),
[Colle](https://www.chess.com/openings/Colle-System),
[Nimzo-Indian](https://www.chess.com/openings/Nimzo-Indian-Defense),
[Queen's Indian](https://www.chess.com/openings/Queens-Indian-Defense),
[Bogo-Indian](https://www.chess.com/openings/Bogo-Indian-Defense),
[King's Indian](https://www.chess.com/openings/Kings-Indian-Defense),
[Grünfeld](https://www.chess.com/openings/Grunfeld-Defense),
[Benoni](https://www.chess.com/openings/Benoni-Defense),
[Benko](https://www.chess.com/openings/Benko-Gambit),
[Dutch](https://www.chess.com/openings/Dutch-Defense),
[Pirc](https://www.chess.com/openings/Pirc-Defense),
[Alekhine](https://www.chess.com/openings/Alekhines-Defense),
[Trompowsky](https://www.chess.com/openings/Trompowsky-Attack), and
[English](https://www.chess.com/openings/English-Opening).
No descriptive text is copied from these references. Human verification flags
remain false; legality and source checks are distinct from expert review.

## Maintaining the embedded build

`build-learning.cjs` is the authoring source for `main-families.json`.
`catalogue-engine.js`, `catalogue-ui.js` and `catalogue-tests.js` are maintained
source modules embedded in the HTML between marked boundaries. From the
repository root, run in order:

```powershell
node chess-opening-packs/build-learning.cjs
node chess-opening-packs/build.cjs
node library/extract.cjs
```

All three steps work offline on plain Node, without npm install. `build.cjs` validates the data and replaces only its
marked blocks. Keep the portable pack and embedded snapshot in step by rebuilding
after a content change. Changes outside those blocks remain in the HTML.

## Verification

The Edge 156.0.4314.50 run on 2026-11-04 (America/Los_Angeles) used a separate
test profile with network access disabled: **194/194 embedded tests passed**,
no skipped tests or browser errors. The Node suite passed **193/193**. Browser
interaction checks covered all 34 lesson study/answer flows, immediate-reload
progress, group drills, catalogue paging, accent/spelling search, bookmarks,
board-position matching, line practice, pack import/deduplication/rejection/
removal, saved personal edits, and 390-pixel layouts. Requests used only `file:`
and `blob:`. Firefox was not run in this update.

The regression harnesses are in `tests/browser/`; see its README for prerequisites
and commands. New screenshots and results stay in the ignored `tests/artifacts/`
folder. Earlier results and HTML backups remain local outside the repository.
The HTML is approximately 1.27 MB; the portable catalogue is approximately
1.18 MB. The first browser position lookup built its index in about 180 ms on
this machine; later lookups reuse it.
