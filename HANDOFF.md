# Chess Trainer: session handoff

## Latest update: full offline catalogue and main families (2026-11-03)

The standalone HTML now embeds all **3,865** Lichess catalogue lines and **34**
authored family lessons. Library tabs: Learn openings, Explore catalogue,
My lines & traps, and Opening packs. The old 40 repertoire lines and 12 study
positions are in My lines & traps. Catalogue results are grouped and paged at
24 lines, with text/ECO/moves search, family and first-move filters, bookmarks,
and a position filter that handles transpositions. Each catalogue line can be
previewed or practised; each family has both sides' plans, a caution and one key
decision. Default drill sets remain focused on personal content or a chosen
family group rather than automatically adding thousands of catalogue cards.

The full data and build sources are in `chess-opening-packs/`. Read its README
for usage, pack schema, source attribution and rebuilding. The HTML needs none
of those neighbouring files at runtime. `build.cjs` embeds marked engine, data,
UI and test blocks; edit the source modules rather than only their generated
copies. Other HTML code remains hand-maintained. The pinned Lichess revision is
`3fd6ce992679e4d991a6bb4dade71f2b826c568a` (CC0).

Save version is now **3**, accepting versions 1 and 2. New `openingBooks` state
stores imported packs, bookmarks, opponent-book preference, and the personal
library only when edited. The included catalogue is not duplicated in saves.
Library schema stays 4; independent opening-pack schema is 1. Pack imports
validate atomically, merge without replacing personal content, reject conflicting
ids, and suppress repeated source entries in the catalogue. Files are limited to
5 MB / 10,000 entries; all extra packs together have a 3 MB serialized budget.
Clear saved data resets the extra books and personal edits as well as progress.

The opponent uses personal lines by default; a checkbox in Opening packs enables
the complete catalogue. Worker NPC requests synchronise changed book state.
Book candidates and arrows now check the actual position in addition to the move
text, avoiding false matches after custom-FEN starts. Position trails and the
catalogue position index are cached. Imported content works in both the worker
and main-thread fallback.

Verified in a separate headless Microsoft Edge profile with networking disabled:
**193/193 tests**, none skipped; all 34 study/practice flows, catalogue controls,
position matching, pack lifecycle, persistence and personal edits passed browser
checks. Desktop and 390-pixel screenshots were inspected. Zero browser errors;
only `file:` and `blob:` requests. First position-filter lookup was about 180 ms.
HTML size is about 1.27 MB. Harnesses/results/screenshots and a before-catalogue
backup are in `C:\Users\Michael\OneDrive\Documents\ChatGPT\Usage\chess-trainer-checks`.

Earlier handoff entries below are historical; this update supersedes their
save-version and test-count statements.

## Latest update: seeded opening study positions (2026-11-03)

The Library now begins with 12 named study positions. Each offers **Study position**
(preview opens directly at the decision; step forward for the explanation) and
**Practise position** (one-card recall set). **Practise all 12 positions** runs a
bounded set with the existing missed-card retry and spaced-repetition tracking.
The explanation stays hidden until an answer, hint reveal, or skip; alternatives
are described as different book choices rather than automatically bad chess.
Use the existing **Play from here** button in Study for free exploration with
the complete move history retained.

Coverage: Ruy Lopez, Italian, Scotch, Petroff, Queen's Gambit Declined, London,
King's Indian, Open Sicilian, French Advance, Caro-Kann Advance, Scandinavian,
and Symmetrical English. The last four are new fully annotated opening lines,
bringing the book to 40 openings and 10 lines explained move by move. Their move
sequences and names were cross-checked against the Lichess CC0 opening catalogue:
[A openings](https://github.com/lichess-org/chess-openings/blob/master/a.tsv),
[B openings](https://github.com/lichess-org/chess-openings/blob/master/b.tsv), and
[C openings](https://github.com/lichess-org/chess-openings/blob/master/c.tsv).
Source URLs are stored on the new entries. Human verification remains false.

Library schema is now **4**. `RepertoireEntry.positions[]` is optional and holds
`{id, title, ply, prompt, explanation}`. The FEN, side to move and answer are
derived from the entry's start FEN plus its move history. `ply` counts half-moves
already played; `movesSan[ply]` is the answer. v1-v3 libraries import unchanged,
without silently merging built-in content, and v4 exports retain checkpoints.
`CT.openingPositions()` returns the derived cards; `buildDrillDeck` accepts
`positionsOnly` and `positionId`. Stable `position:entryId:checkpointId` keys
reuse the existing save and drill statistics. Save format stays at version 2.

Mode hand-offs now release the previous board owner when entering a preview or
drill. Study and practice leave the live game intact. Pending autosaves flush on
`pagehide`, so an immediate reload after answering cannot discard the score.
Corrected existing teaching notes about the Open Sicilian pawn trade and the
King's Indian's unfinished development.

Verified in headless Microsoft Edge on Windows at `file://`: **184/184 tests**,
none skipped, zero browser errors, requests limited to `file:` and `blob:`.
Browser interaction checks cover all 12 study boards and explanations, all 12
correct answers, immediate-reload persistence, the whole set, hints and skips,
study/drill hand-offs, Play from here, and a v3 library import. Desktop and
390-pixel layouts were inspected. Reproducible harnesses, results, screenshots,
and the original HTML backup are in
`C:\Users\Michael\OneDrive\Documents\ChatGPT\Usage\chess-trainer-checks`.
The Node suite has 183 cases (the worker probe is browser-only).

The earlier handoff below is historical; its schema and test counts are superseded.

Single deliverable: `chess-trainer.html`. One file, offline, from scratch, self-testing at `?test=1`.
Landmarks to verify before editing: `PIVOT_CONFIG`, `GLOSSARY`, `PACING_PRESETS`, `SCENARIO_KINDS`,
`STATS_CONFIG`, `MATCH_CONFIG`, `DRILL_SET_CONFIG`, `SETUP_CONFIG`, `LIBRARY_SCHEMA_VERSION = 3`,
`SAVE_VERSION = 2`, `submitTypedMove`, `leaveModes`, `noteMatchGameEnd`, `enterSetup`, `useSetup`.

Phases 0 to 5 complete, plus a post-phase board setup editor (this session's delta below). 5g is
closed except for a two-browser confirmation only the user can run (see "What 5g still wants").

## Test state

178 tests in a browser, all passing, none skipped. Node counts 177: the worker-probe case is
browser-only. `?test=1` runs everything including the deep perft set; `?test=1&fast=1` skips the
four deep cases. Measured in Chromium 141 at `file://`: about 20 s for the full suite, perft
throughput about 7.6M nodes per second on this container.

## The verification change that matters most

Previous sessions could not run anything: the isolated VM failed with `HYPERVISOR_VIRT_DISABLED`,
the Chrome extension refused `file://`, and desktop access was declined. That is no longer the
constraint. Two harnesses now exist and should be rebuilt at the start of any future session:

1. **Headless engine suite.** The engine lives between `<script id="engine">` and `/*ENGINE-END*/`
   and is Node-runnable as-is. Slice it out, append `module.exports = CT;`, import it, and call
   `CT.runTests({})`. Full run is about 20 s. This is the same suite `?test=1` runs.
2. **Headless UI, via jsdom.** `npm install jsdom`, load the file with `runScripts: 'dangerously'`,
   polyfill `<dialog>` (`showModal`, `close`, `open`), and drive the app. jsdom surfaces window and
   console errors, so a zero-error boot is a real check rather than an assertion of faith. To reach
   UI-internal state, build a scratch copy that exposes the closure (`CT.__ui = { get state(){...},
   ... }` inside `init()`); the shipped file has no such hook and must not gain one.
3. **A real browser at `file://`, via Playwright.** Chromium is preinstalled at
   `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; `npm install playwright` and launch with
   that `executablePath` (do not run `playwright install`, the browser CDN is not reachable).
   Navigate to `file:///.../chess-trainer.html?test=1`, wait for `globalThis.__TEST_RESULTS`, and
   listen on `console`, `pageerror` and `request`. This is the real `file://` policy, the real
   `<dialog>`, the real blob worker, the real network panel, and real screenshots.

Firefox cannot be obtained here: the Playwright browser download is blocked by the egress
allowlist and no distro Firefox package is available. Its two plausible failure modes were
simulated in Chromium instead, by stubbing `Worker` to throw and by making `localStorage` throw on
access. Both degrade correctly (see below).

## Delta this session (board setup editor)

One feature, asked for directly: reconstruct a position without typing FEN. Motivation was an
over-the-board game the user wanted to analyse without playing it out against the NPC, whose
replies would not match the human opponent's.

**L1 helpers**, placed right after `genFEN`: `SETUP_CONFIG`, `setupFromPosition`, `setupEmpty`,
`setupStart`, `setupPlace`, `setupMovePiece`, `setupSetTurn`, `setupSetCastling`, `setupSetEp`,
`setupSetFullmove`, `setupCastlingAvailable`, `setupEpCandidates`, `setupReport`. Every helper
returns a fresh position (so the editor keeps an undo history of plain positions), and every
helper ends in `setupNormalise`. `setupReport` runs the same `validatePosition` the FEN parser and
scenario builder use but returns the whole list, because a half-built board has several things
wrong at once. It also says when a legal position is already finished (mate, stalemate,
insufficient material), since loading such a position is allowed but there is nothing to analyse.

Two CONFIG defaults, flagged rather than chosen silently:

- `autoClearCastling: true`. Moving a king or rook off its home square drops the matching right
  instead of reporting an error the user then has to fix by hand. The alternative is one flag
  away and the test proves the validator reports it in that mode.
- `autoClearEp: true`. An en passant square that stops being consistent with the board is
  dropped the same way. The editor only ever offers consistent squares (`setupEpCandidates`).
- The halfmove clock is always written as 0. The fifty-move count of a reconstructed position is
  unknown and changes nothing for analysis. The fullmove number is editable so the move list
  reads like the scoresheet (Walkthrough labels already honour a non-standard start).

**UI** (`btnSetup`, `setupCard`, `enterSetup`, `exitSetup`, `setupSquare`, `useSetup`,
`renderSetup`): a 12-piece palette, Erase, and a "Move pieces" mode (click a piece, click its new
square). Placing the same piece on the same square again removes it. Three resets: from the live
game, the standard start, an empty board. Side to move, castling boxes (disabled when the board
cannot support them), en passant (shown only when a candidate exists), move number, a live
"Playable" or violation-list panel, Undo edit (the Undo button and `u` do the same in the
editor), Escape cancels. "Use this position" takes the Import path exactly: `createGame({ fen })`,
`state.npc = null`, `leaveModes`, so both sides are yours and Analyse works at once.

Mode ownership: `state.setup` is cleared by `leaveModes` and by every mode starter (walkthrough,
library preview, drill, review), and `enterSetup` calls `leaveModes` first, so exactly one surface
owns the board. Coach surfaces that draw on the board (danger flags, book shadows, eval bar) are
suppressed while editing, and Analyse, Hint and the click-to-play lists refuse with a toast until
the position is in use.

**Verified in Chromium 141 at `file://`**: 178 of 178, zero page errors, zero console output,
schemes requested still exactly `file:` and `blob:`. A Playwright script drove the editor through
every control (move mode, palette place and remove, erase, side to move, en passant offered only
where a double step could have happened, castling dropping with the rook, an invalid board
disabling Use, undo, move number, Use, typed moves for both sides, Analyse, Escape leaving the
game untouched, mode hand-offs with Walkthrough, empty board plus two kings flagged as finished).

Also swept: the two remaining US spellings in runtime copy (`analyzing...` and "to analyze the
live position") that the previous handoff missed. `analyze` survives only as the RPC name and in
test labels that name it.

## Previous delta (Phase 5, for reference)

### 5d, Match (best of N against one NPC config)

New L5 module: `MATCH_CONFIG`, `createMatch`, `matchGameSeed`, `matchColourFor`, `matchScore`,
`matchStatus`, `matchRecordGame`, `matchSummary`, `finishMatch`, plus `CT.match` (one in progress)
and `CT.matchLog` (finished summaries, capped at 20). UI: a Match button, a New match dialog
(length, colour, tier, style, seed) and a sidebar Match card with the running score, a per-game pip
strip, and the next-game and file-match actions.

Three CONFIG defaults, all deliberate and all flagged rather than chosen silently:

- `adaptive: false`. Adaptive difficulty is off for the whole match; opponent strength is stamped at
  creation. A score against a moving target measures nothing.
- `alternateColours: true`. Every listed length is even, so colours come out equal.
- `clinchEarly: true`. The match ends once the games left cannot close the gap. A gap exactly equal
  to the remaining points is deliberately not a clinch: the trailing side can still draw.

Per-game seeds derive from the match seed, so `(matchSeed, length)` replays the whole series.
Only games created by `startMatchGame` carry a `matchId`, so wandering off to Practice or a scenario
mid-match costs nothing. An assisted game counts for the match score but still fails `isRated`, so it
never reaches the rating estimate. `noteMatchGameEnd` reads game status rather than the game record,
because a game with no moves produces no record but is still a result.

### 5d, Drill Set (bounded rep block)

New drill-section module: `DRILL_SET_CONFIG`, `buildDrillSetQueue`, `createDrillSet`,
`drillSetCurrent`, `drillSetRecord`, `drillSetSummary`, `drillSetVerdict`, `recordDrillSet`, plus
`CT.drillSetLog` (capped at 20). The Drill button now opens a dialog: set or endless, size, content
filter (traps, openings, both), seed. Endless drill is unchanged.

The queue is drawn up front, weighted but without replacement, so a set has no duplicates and does
not react to how you answer; the spaced-repetition weighting still chooses which cards make the set.
Missed or hinted cards return once at the end as a single retry pass, which never changes the score
and is never re-queued, so a set always terminates. Scoring is unaided first attempts only, against
a `passMark` of 0.8. Completed sets are logged; abandoned ones are reported and let go.

### 5f, export completeness (decision resolved, then implemented)

The open question was whether storing move text per game record was worth the storage. Measured
rather than estimated: a full log with move text serialises to about 42 KB at 20 games and roughly
67 KB extrapolated to the 50-game cap, against a 4 MB warn threshold. That is around 1.5%. The move
text costs about 0.8 KB per game. Space was never the constraint; the decision was not close.

Game records now carry `moves` (space-joined SAN, about a third smaller than an array of strings),
`startFen` (only when it is not the standard start, which is exactly when a PGN needs SetUp and FEN
tags), and `match`. `gameRecordToPGN` rebuilds a record as a real PGN with the seven standard tags
first and opponent details in extra tags; `exportGamesPGN` writes the whole log as one file and
reports how many records it could not export. UI: a "Download all games (PGN)" button in Save data,
and a count of exportable games in the status line.

`SAVE_VERSION` is 2. Version 1 saves are accepted and upgraded in place: the new fields start empty.
Refusing to load yesterday's save would be a far worse failure than one compatibility branch.

### Progress panel

Recent matches and recent drill sets, five each. Added because a log nothing reads is a design smell,
not because the phase asked for it.

### Copy fixes found while sweeping

Header tag said "Phase 2 build"; the footer said drills, walkthrough and scenarios were "on the way";
the library dialog was hard-coded to "schema v1" while `LIBRARY_SCHEMA_VERSION` is 3 (now read from
the constant); "Analyze position" and "Not analyzed yet" were the only US spellings left in UI copy.

### 5g, final QA (run in Chromium 141 at `file://`)

Everything below was observed, not inferred.

- 173 of 173 tests pass. Zero page errors, zero console errors, zero console warnings, across both
  the test page and a full app session.
- Network: exactly two URL schemes are ever requested, `file:` for the document and `blob:` for the
  engine worker. Zero requests with a scheme that can leave the machine. Statically the file
  contains no `fetch`, `XHR`, `WebSocket`, `EventSource`, `<link>`, `@import` or external `src`;
  its only URL is the SVG namespace and its only `url(` is an internal SVG marker reference.
- The blob worker is created and answers its ping under `file://` policy: the badge reads
  "engine worker: on". `localStorage` also works at `file://`, so no "not persisting" badge.
- Native `<dialog>` behaviour is correct for the two new dialogs: open on click, close on start.
- Degraded mode A, `Worker` stubbed to throw (the likely Firefox-at-`file://` case): the app boots,
  the badge reads "engine worker: main-thread fallback", the NPC still replies, hints still resolve,
  and nothing throws.
- Degraded mode B, `localStorage` throwing on access (private windows, strict policy): the app
  boots, the "not persisting" badge appears with its explanation, and a drill set still runs to
  completion in memory with nothing thrown.
- Visual pass by screenshot. Two defects found and fixed:
  1. Finishing or leaving a drill left the board flipped to the last card's side, so the live game
     came back from the wrong side. Pre-existing, not new to the drill set, but the set report made
     it obvious because the report and the live board are on screen together. The drill now records
     the orientation it borrowed and hands it back, in `finishDrillSet`, `exitDrill` and
     `leaveModes`.
  2. A match game's status line read "Adaptive: adjusted hold for this game (fixed for the match)",
     which is both awkward and untrue: nothing was adjusted. That line now tells two different
     stories, one for adaptive explaining a change it made and one for a match explaining why it
     will not make one.

### What 5g still wants

- **Firefox**, on the user's machine, from `file://`. Unobtainable here. The expected outcome is the
  main-thread fallback badge rather than "worker: on", which is degraded mode A and is verified.
- **Edge.** Chromium 141 is a close proxy and Edge shares the engine, but it was not literally run.
- A look with the user's own eyes at the new Match card, drill-set report and dialogs.

## Remaining work

- **Library content verification, ongoing and not phase-gated.** All 36 openings and 4 traps are
  standard theory but remain `verified: false` pending a human source check. INTAKE never
  auto-promotes.
- **Firefox and Edge confirmation** of the editor is the same ask as for everything else: it is
  synchronous DOM and L1 code with no worker involvement, so the expected outcome is identical.
- Possible follow-ups, none started: drag-and-drop as an alternative to click-click (the click
  path stays, since it works on a trackpad); a "Save as scenario" shortcut from the editor (today
  it is Use, then Scenarios, then "Use the position on the board", which is three clicks).

## Conventions to keep

Canadian spelling. No em-dashes anywhere. CONFIG-and-flag rather than silent choices. Never weaken a
failing test to reach green. Never fabricate opening theory. When a test catches a content problem,
sweep the whole class rather than fixing the one instance.
