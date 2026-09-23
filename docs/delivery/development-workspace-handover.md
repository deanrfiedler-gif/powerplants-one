---
document_id: PPO-DEVELOPMENT-WORKSPACE-HANDOVER
title: Design and development workspace handover
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Local implementation for review; operational and visual acceptance separate
source_commit: ccc2251bbba9df266cac9027ddaa9418ab9abc1d
---

# Design and development workspace — handover

The local application now reads one working design register from Git. It brings together registered scopes/pages, detailed draft guidance, local/live destinations, available images, desktop/mobile Markdown contracts, shared shell/theme references and retained journey maps. The separate **Design and build workspace** header icon opens the register. The existing information icon adds a development draft for the current canonical page while retaining released application help.

## Delivered

- `/development/page-register`: 266 entries, including all 150 retained scope IDs, 112 source addresses and four shared systems; 262 draft guides and a design contract for every entry. Search, filters, additional-result loading, coverage view, link handling and export are implemented.
- `/development/design-system`: actual root tokens and reusable Button/ButtonLink states, temporary isolated colour/radius proposals, reset/export and affected-page links. Legacy scoped styles remain explicit migration work.
- Thirty discovered journey HTML files, 24 latest files by filename family, earlier issues retained. Eight existing images serve fifteen baseline entries; missing images open explanatory references. Higher revision does not imply acceptance.
- Native labelled reader, guide section navigation/search, related-entry back trail, focus return, responsive cards/full-screen phone reader, source/visual/functional/deployment distinctions and explicit failures.
- Stable Git master, route discovery/synchronisation, imported-component/shared-source/design/article fingerprints, CI integrity check, AGENTS maintenance instructions and PR checklist. The working copy refreshes every 30 seconds while visible with no reader open, or on demand.
- Local-synthetic/loopback/trusted-launcher gate on both pages and all supporting endpoints. No hosted enablement, new business grants, database changes, Git credential/editor or public deployment.

The portable [standalone r05](../reference/ui/app-page-register/PPO-App-Page-Register-r05.html) remains available with its 260 articles and retained r04 notes/shortlist/build-order/backup features. The original r04 bytes remain unchanged. Routine future maintenance belongs to the [working master](../design/development/README.md); the frozen HTML is not a competing live master.

## Verification and evidence

Starting source: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`; branch `feat/design-development-workspace`. Main's unrelated facilities-page change was preserved. Local preview uses `http://127.0.0.1:3006` to keep this checkout separate; destination defaults still use the requested port 3000. Exact final source is the PR head; the initial baseline in imported articles is provenance, not a current acceptance claim.

- `studio:check`: 266 entries, 112 source addresses, 30 journeys, zero integrity errors. All 266 visual reviews intentionally remain pending.
- New unit contracts: local/hosted/production/off gate, environment/UUID validation, static-before-dynamic matching, retained scope/route coverage, omitted-route detection, shared/imported change invalidation and path containment.
- Complete unit suite: 337 tests, 333 passed, four failed. Main checkout at the same starting source: 332 tests, 328 passed, the same four failures. They concern two private document-store tests, Windows recovery-path rejection wording and the warm-route path separator expectation. No failure is presented as a passing check; the new five tests passed. No unrelated adapter/recovery fix is included.
- Seven live HTTP groups passed: catalog count/no-store, static/dynamic information-icon lookup, unknown guide/route/arbitrary path refusal, exact Markdown content/security headers, stale-hash refusal and forged gateway-header refusal. [Recorded results](../testing/evidence/development-workspace/http-results.json).
- Standalone r05: [16 DOM verification groups passed](../testing/evidence/app-page-register-r05/dom-results.json), including all 260 article windows and destination rules. r05 itself was not visually rendered because its browser URL was blocked; no alternate renderer/protocol workaround was used.

Final code commit `422bac8` includes the latest main changes through `c5280be` (browser-runtime PR #281). The final Next build and its TypeScript phase passed. Repository-wide lint passed before the final catalogue hash-cache refactor; focused lint passed for all affected TypeScript after that refactor (an explicitly supplied CSS file was reported as ignored, not linted). All three required Python checks passed: foundation, prototype (78 parent dispositions) and naming (370 records). Register integrity and six focused tests (five new contracts plus the updated browser-runtime test) passed. The seven HTTP groups also passed against the compiled local server. `git diff --check` passed and committed r04/r05 hashes match the retained evidence.

The [browser evidence](../testing/evidence/development-workspace/README.md) records desktop, phone, focus, guide and theme observations. Following the compiled-server restart, the browser tool rejected navigation from its temporary connection-error data page; compiled visual checks were therefore not claimed and no alternate renderer was used. The compiled server remained available to the seven endpoint checks. Database/business workflow suites were not re-run; this does not imply whole-app acceptance.

## Important boundaries

Imported guides are Draft r01 and require page-by-page review against actual workflows. Baseline desktop/mobile contracts capture purpose, tasks and common requirements; where an exact visual is missing they do not claim measured mockup parity. The new workspace proves the maintenance mechanism; it does not finish the full application or make all planned links live.

The local information-icon preview uses canonical path mapping. Release-bound operational publishing, permission-controlled procedures and tab/query-specific approved variants remain the next help increment under HELP-01–HELP-14. The login page is a launcher-owned entry, not an ordinary Next page. Legacy `/crm/*` aliases are excluded from duplicate canonical coverage. Explicit runtime-computed dependencies still need declaration.

GitHub source links target the stable main branch and resolve for newly added files after merge. Application links may lead to a sign-in, missing route or denied record. Local and live UUIDs are separate and not persisted. Theme proposals are not applied edits. Browser previews cannot update Git or deploy a theme.

## Maintain and continue

Use the [working-register workflow](../design/development/README.md) and [ADR-0040](../decisions/ADR-0040-development-workspace.md). For the next page refinement, nominate the exact mockup and viewport, complete its concrete desktop/mobile contract, compare the running page at that state, and update its guide and evidence in the same PR. Prioritise the PP-01 service journey and the most-used CRM/estimating pages. Preserve source, visual review, functional proof, owner acceptance and deployed availability as distinct statements.

No merge or hosted deployment is recorded in this handover. The review branch is `feat/design-development-workspace`; publication is recorded below.
