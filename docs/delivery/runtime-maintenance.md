# Runtime maintenance handover

**Document ID:** PPO-RUNTIME-MAINT-HO
**Revision:** r01
**Status:** Maintenance implementation delivered to PR #163; authoritative verification and merge state in that PR; hosted rollout separate
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

- `npm run check`: lint, type checking, 86 unit tests and Next build passed. A subsequent clean `npm ci` installed 232 packages; `npm ls --depth=0` matched all 20 declared packages, and a second build passed using that clean installation.
- `python3 scripts/check_foundation.py`, `check_prototype.py`, `check_naming.py`: passed; 78 parent requirements and all 15 issued-source hashes retained; 141 document records.
- `python3 -m unittest discover -s tests/demo -p '*_test.py'`: 34 passed. These are synthetic operator/shell tests, not Azure execution.
- Installed Google Chrome executable reports 153.0.8010.36. `npm run browser:check` failed before browser content loaded: this container refuses Chrome's process-singleton socket (`Operation not permitted`). The system package also reported an unavailable fonts-liberation dependency/configuration limitation. No permissions or browser flags were weakened to bypass the container boundary.
- Real PostgreSQL, full browser journeys, rendered-PDF visual inspection and Docker build are not verified locally; their required CI runs must pass before merge. There is no local PostgreSQL service, Docker daemon or Azure CLI session.

The updated installer forces the official stable installation so an older preinstalled Chrome cannot be mistaken for a completed update. No mocked result is a real browser/database/hosting pass.

## Publication history and owner handoff

The local source commit was prepared as `5ef79bc97fac38b27d7906def4a1eeb95442c267` (tree `a4e6a52899437c965b91a75b12fc138ab2feae2f`). Its normal branch push failed: `fatal: could not read Username for 'https://github.com': No such device or address`. `CONTRIBUTING.md` requires stopping on a blocked push and records that workflow files need owner publication because the connector lacks workflow-write access. No alternate credential, empty remote branch or permission change was attempted. No PR, CI run, merge or rollout was created for this change.

The owner handoff archive contains the exact branch as a Git bundle, its review diff, checks and import instructions. The final handover commit adds only this verification/publication record. Import the bundle as a new local branch and publish it using the owner's existing authenticated GitHub Desktop connection. Then open a draft PR linked to #160. Do not merge until the configured checks, actual browser/PDF paths, compiled application suite and image build pass. Review the generated quotation, job pack, report and Finance PDFs visually using their retained CI evidence. The existing authorisation covers continuing those checks and the normal merge after owner publication; no repeated scope approval is needed.

## Owner publication and CI evidence

Dean imported and published the exact handoff commit `a0132823f971a7570206dc6c626d7a7115c9d150` and opened [PR #163](https://github.com/deanrfiedler-gif/powerplants-one/pull/163). The earlier Git-transport block is resolved by that owner action. Current checks and any remaining corrections continue on the same branch through the authenticated connector; no workflow permissions are changed.

The first PR runs installed Chrome 153.0.8010.36 on Node 24.21.0 and passed the actual PDF smoke check. Three design workflows then failed because their older scripts in `docs/blueprints` and `docs/testing` still selected bundled Chromium. Six active launch sites now select the same Chrome channel. The original failures remain visible in runs `34790816072`, `34790816018` and `34790816040`. The correction was published as `41d6da7f9682391f750439b09cb78f6dbd306d15`, tree `f4b4bda47f84759038e109facff853448d5712e5`. The repaired CRM, estimating and customer-portal design workflows passed in runs `34791071036`, `34791071043` and `34791071051`. Historical review scripts inside issued/versioned visual evidence are not active workflow entry points and remain unchanged.

Azure preparation passed both before and after the design-only correction: runs `34790816031` and `34791071067`. Logs establish the actual Node 24.21.0/Chrome 153.0.8010.36 versions, PDF smoke check, hosted-identity tests against disposable PostgreSQL, Bicep compilation and Docker image build. The image's final non-root-user PDF check passed. These jobs had no Azure sign-in and deployed no resource.

Visual review used the real HTTP-generated six-page Finance PDF from artifact `10328352036` in run `34790815981`, source `a0132823f971a7570206dc6c626d7a7115c9d150`; all page layouts and the first page at full review size were inspected. No clipping, overlap, missing brand/font or broken table continuation was observed. PDF SHA-256 `072cf3ad7371dc963675e32c56071a3816e9ce55c936410123843f6f88d5e9dc` and HTML SHA-256 `ea72146732d234073aee1d2f0305b33215e2359b6404c2cac3d4389a46eabdec` matched its manifest, which records Chrome 153.0.8010.36. The subsequent design-script correction changed no document-rendering source. This representative review does not stand in for full Service/Finance acceptance.

**Authoritative completion record:** [PR #163](https://github.com/deanrfiedler-gif/powerplants-one/pull/163) and [issue #160](https://github.com/deanrfiedler-gif/powerplants-one/issues/160) retain the final checked commit, complete CI conclusions, remaining quotation/job-pack/report visual review, merge SHA and any hosted action. Read those exact records before treating this static handover or a component pass as final completion. The final handover update changes documentation/evidence only; original failed runs are preserved. No independent human review is claimed.

## Hosted evidence and update boundary

Latest observed successful deployment: [run 34745193611](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34745193611), 13 September 2026, source `ab587d7e82e503f3154342f7bc83f9b05d18e5dc`, image digest `sha256:c522dab0cab8264dfffe2c7ba1ee5f80273c17db3e57a30d4a663206f8e0870e`. Its logs show Node base `24.20.0-bookworm-slim` resolved to `sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e`. This is historical deployment evidence, not a fresh observation of currently serving containers. The managed PostgreSQL minor is not exposed in this evidence.

After merge, run **Azure demo connection check** first, then **Update Azure private demo** with operation **check**. Keep the existing identities, environment approval, main-only guard and scopes. Compare current web and worker image digests with the deployment record. A routine **deploy** must pass its existing database verification gate; do not select **upgrade-and-deploy** merely to overcome the older hosted source. That would also install unrelated application/schema work and needs its own assessed release scope. Do not reset, recreate or change invitations.

For an authorised session inside the existing deployed container, `npm run browser:check` reports actual Node/Playwright/Chrome versions. The following read-only query reports the actual database version using existing runtime configuration without printing credentials:

```sh
node --import tsx --input-type=module -e 'import { database, closeDatabase } from "./src/platform/database.ts"; try { console.log((await database().query("SHOW server_version")).rows[0]); } finally { await closeDatabase(); }'
```

Use that query only inside the configured runtime; Azure's server resource `version` field identifies its configured major and does not establish the installed minor. Do not copy private runtime configuration into Git or a PR. No direct Azure session or workflow-dispatch tool was available during preparation.

The final image remains deployed by digest. Pinning the new Node base digest is deferred until its actual registry manifest is verified; no digest is invented from a different Node version. Database/image scans and invited sign-in acceptance remain separate from package-version checking.
