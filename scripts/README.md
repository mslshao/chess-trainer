# Check, push and deliver

Future changes automatically finish by running this command after committing
on main. This is the standing completion workflow in HANDOFF.md; Michael does
not need to ask for it each time. Run from the repository root:

```powershell
node scripts/deliver.cjs
```

The command checks the offline rebuild, library export, delivery regression tests,
full Node suite and both Edge harnesses. After the check-only return and immediately
before pushing, ops.auth() makes one read-only workflow-runs API request to confirm
GitHub access. Missing or rejected access stops the run without pushing or copying.
A successful check allows it to push the checked commit to
origin/main without force, waits for GitHub's Tests workflow, and updates the
original trainer and its neighbouring handoff. Every command must succeed.
Uncommitted changes, a stale branch, changed generated files, failed tests, a
failed push, failed CI or changed remote main stop delivery.

The old destination files are backed up before replacement. Copies are staged on
the destination drive, flushed, and checked by SHA-256 before and after replacement.
If the second replacement fails, the first is rolled back. Backups are retained;
if Windows also prevents rollback, the error names the backup directory for
recovery. Browser save data is never accessed. Matching files are left alone.

The script does not create commits. Commit source changes and their generated
outputs first; if the rebuild detects differences, review and commit them before
rerunning. No switches bypass tests, CI, clean-worktree checks or backup checks.

## Local settings

The ignored `.delivery.local.json` in the repository root has been configured on
Michael's machine. For a different clone, create it with these fields, using real
absolute paths on that machine:

```json
{
  "destinationHtml": "C:/Users/YOUR_NAME/OneDrive/Documents/Important/GenAI/Games/chess-trainer.html",
  "backupDirectory": "C:/Users/YOUR_NAME/Documents/chess-trainer-backups",
  "nodeModuleDirectory": "C:/path/to/existing/node_modules"
}
```

The original trainer must exist. Backups and the delivered files must be outside
the clone. The handoff destination is `chess-trainer-handoff.md` beside the trainer.
`nodeModuleDirectory` is optional if Node can already resolve Playwright. Node 22
or newer, Git, Playwright and installed Microsoft Edge are required. The script
explicitly uses the msedge channel; it never substitutes another browser.

Git authentication uses your existing Git setup. GitHub check lookups use the
public API, or GH_TOKEN/GITHUB_TOKEN from the environment when set. A private
repository needs a token with Actions read access for those lookups. Never put
tokens in the local JSON, code or command arguments. The initial API request
checks these permissions immediately before push; later API failures also block
delivery. Public repositories do not require a token for anonymous API access.

If the gh CLI is installed and signed in, set the token only for the current
PowerShell session before delivery:

```powershell
$env:GH_TOKEN = gh auth token
node scripts/deliver.cjs
```

On this Windows machine, gh is not installed; the existing Git Credential Manager
login can supply the session token through Git's normal credential-helper interface.
Capture its output in memory, never print it, and pass the password field only as
GH_TOKEN in the delivery process environment. Do not persist the credential.
Transport errors include their error code when available; they still stop delivery.
No authentication or network failure is treated as a successful check.

GitHub is polled for up to five minutes. Failed, cancelled or missing required
runs stop delivery; rerun after resolving the cause. Documentation-only commits
may be excluded by CI path filters. In that case an earlier successful ancestor
is accepted only if every CI input (HTML, sources, tests, scripts, library and
workflow) is unchanged. A failed run for the current commit is never bypassed.

## Other commands

```powershell
node scripts/deliver.cjs --check-only
node scripts/deliver.cjs --config C:/path/to/settings.json
node --test tests/delivery.test.cjs
```

`--check-only` runs the same local checks without the GitHub API probe, pushing
or copying. It still requires committed changes and is not a completed delivery.
Paths resolve from the repository, so the script can
also be invoked by its absolute path from another folder.

A lock in the ignored `tests/artifacts/delivery.lock` prevents simultaneous runs.
If a process is killed, confirm it is no longer running before manually removing
its stale lock. Normal exits remove the lock automatically. Test outputs remain
in the ignored artifacts folder; backups remain at the configured external path.
