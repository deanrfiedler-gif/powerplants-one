# Runtime maintenance handover

**Document ID:** PPO-RUNTIME-MAINT-HO  
**Revision:** r01  
**Status:** Prepared; runtime verification and publication pending  
**Date:** 14 September 2026  
**Owner:** Dean Fiedler  
**Source commit:** 5855713c107500ee80319952473fa1fcf7783f33

[Issue #160](https://github.com/deanrfiedler-gif/powerplants-one/issues/160) owns the exact publication and check results. [ADR-0022](../decisions/ADR-0022-maintained-browser-runtime.md) records the sources, alternatives and limits. Branch: `maintenance/runtime-browser-september`. No SQL, seed, permission, template or issued-output changes are included.

## Selected maintenance

| Component | Before | Selected |
|---|---|---|
| Azure login, both manual workflows | v2.3.1, Node 20 | v3.1.0 at `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906`, Node 24 |
| Node, package/lock engines, local version file and image | 24.20.0 | 24.21.0 |
| npm | 11.19.0 | 11.19.0 |
| Playwright and its test package | 1.63.0 | 1.63.0, exact pins retained |
| Browser used for new PDFs and tests | Bundled Chromium 153.0.8010.12 | Supported stable Chrome channel, minimum 153.0.8010.36 within major 153 |

Every CI browser installation now runs `npm run browser:install`, which installs the official Chrome stable channel and checks the actual version plus PDF capability. Each Playwright configuration runs the same check before its suite. The image repeats that check under the final non-root user. Direct restart/design browser launches also select Chrome. All five document-rendering paths use one guarded launcher. Existing stored PDFs are read using their original hashes and browser receipts, without rerendering or inherited acknowledgement.

The installation follows Google's current stable patch. It is not a fixed browser archive; a new major intentionally fails the compatibility guard until tested and reviewed. Existing Playwright launch defaults and content/network restrictions are retained. Arbitrary untrusted HTML is outside the supported rendering contract.

## Local update after merge

Preserve local edits, then pull the merged branch through GitHub Desktop. Install Node 24.21.0 using your existing Node installation method. In the repository directory:

```sh
node --version
npm install --global npm@11.19.0
npm ci
npm run browser:install
npm run browser:check
npm run dev
```

`browser:install` can install or update the machine's existing Google Chrome stable installation and may request operating-system installation rights. `browser:check` only starts the installed browser and renders a small synthetic PDF in memory. If Chrome is already patched, the check alone is sufficient. Do not run `db:reset`. This patch adds no migration; any migrations owed from other changes pulled at the same time must be assessed against those changes' handovers.

## Verification and publication

Executed on the prepared tree with Node 24.21.0/npm 11.19.0:

- `npm run check`: lint, type checking, 86 unit tests and Next build passed.
- `python3 scripts/check_foundation.py`, `check_prototype.py`, `check_naming.py`: passed; 78 parent requirements and all 15 issued-source hashes retained; 141 document records.
- `python3 -m unittest discover -s tests/demo -p '*_test.py'`: 34 passed. These are synthetic operator/shell tests, not Azure execution.
- Installed Google Chrome executable reports 153.0.8010.36. `npm run browser:check` failed before browser content loaded: this container refuses Chrome's process-singleton socket (`Operation not permitted`). The system package also reported an unavailable fonts-liberation dependency/configuration limitation. No permissions or browser flags were weakened to bypass the container boundary.
- Real PostgreSQL, full browser journeys, rendered-PDF visual inspection and Docker build are not verified locally; their required CI runs must pass before merge. There is no local PostgreSQL service, Docker daemon or Azure CLI session.

The updated installer forces the official stable installation so an older preinstalled Chrome cannot be mistaken for a completed update. No mocked result is a real browser/database/hosting pass.

## Hosted evidence and update boundary

Latest observed successful deployment: [run 34745193611](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34745193611), 13 September 2026, source `ab587d7e82e503f3154342f7bc83f9b05d18e5dc`, image digest `sha256:c522dab0cab8264dfffe2c7ba1ee5f80273c17db3e57a30d4a663206f8e0870e`. Its logs show Node base `24.20.0-bookworm-slim` resolved to `sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e`. This is historical deployment evidence, not a fresh observation of currently serving containers. The managed PostgreSQL minor is not exposed in this evidence.

After merge, run **Azure demo connection check** first, then **Update Azure private demo** with operation **check**. Keep the existing identities, environment approval, main-only guard and scopes. Compare current web and worker image digests with the deployment record. A routine **deploy** must pass its existing database verification gate; do not select **upgrade-and-deploy** merely to overcome the older hosted source. That would also install unrelated application/schema work and needs its own assessed release scope. Do not reset, recreate or change invitations.

For an authorised session inside the existing deployed container, `npm run browser:check` reports actual Node/Playwright/Chrome versions. The following read-only query reports the actual database version using existing runtime configuration without printing credentials:

```sh
node --import tsx --input-type=module -e 'import { database, closeDatabase } from "./src/platform/database.ts"; try { console.log((await database().query("SHOW server_version")).rows[0]); } finally { await closeDatabase(); }'
```

Use that query only inside the configured runtime; Azure's server resource `version` field identifies its configured major and does not establish the installed minor. Do not copy private runtime configuration into Git or a PR. No direct Azure session or workflow-dispatch tool was available during preparation.

The final image remains deployed by digest. Pinning the new Node base digest is deferred until its actual registry manifest is verified; no digest is invented from a different Node version. Database/image scans and invited sign-in acceptance remain separate from package-version checking.
