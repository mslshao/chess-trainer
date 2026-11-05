# Browser harnesses

These scripts run against the repository's chess-trainer.html in a separate,
temporary headless browser profile with networking disabled. They never use your
normal browser profile. Paths resolve from the scripts, not the current folder.
Results and screenshots go to tests/artifacts/, which Git ignores.

Prerequisites: Node, Playwright available as the playwright module, and Microsoft
Edge installed. If Playwright is already installed elsewhere, set NODE_PATH to
its parent node_modules directory. No browser dependency is needed for the build
or the Node suite, and these browser harnesses are not run in GitHub Actions.

Run from the repository root:

```powershell
node tests/browser/catalogue-browser.cjs
node tests/browser/browser-test.cjs --ui-only
```

The first command answers all 34 family lesson drills, verifies their Progress
counts after reload, then runs the full embedded suite at ?test=1. It requires
the saved data to remain byte-for-byte unchanged, checks temporary test storage
was removed and verifies Progress again. It also checks catalogue filters,
bookmarks, position matching, imports, persistence and mobile layouts. The second
checks all 12 original study and
practice positions, immediate-reload scores, hints, skips, mode transitions,
free play and schema-v3 library imports. It explicitly selects My lines & traps.
Both fail on browser errors or any request scheme other than file: and blob:.

Either script can run the full embedded suite; --ui-only skips that duplicate
work. CHESS_BROWSER_CHANNEL explicitly overrides the default msedge channel
when testing another installed Playwright Chromium channel. Firefox is not
covered by these harnesses.

The old engine-test.cjs duplicated tests/run-node.cjs and was not imported.
Keep tests/run-node.cjs as the single Node runner. The old results, screenshots
and HTML backups remain outside this repository.
