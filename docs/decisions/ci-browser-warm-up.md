# CI browser suite: warm every route before the first assertion

**Decided:** 11 September 2026 · **Owner:** Dean Fiedler · **Scope:** test harness only · **Status:** implemented on the linked pull request; effect to be confirmed by consecutive green full runs

## Problem

The browser suite runs against `npm run dev` — the Next.js/Turbopack development server — and `scripts/local-server.ts` clears the Turbopack cache before every start. Every one of the application's route handlers and pages is therefore compiled on its first request, and the desktop project, which runs first, pays that cost inside whichever test reaches a route first.

On 10 September 2026 two independent branches failed the full Application assurance job this way. Run 34534398231 (PR #111) failed `offline.spec.ts:157` and `:556` on desktop-chromium only: the forwarded `POST /api/v1/sync/operations` and the recovery request were still in flight when their 5-second assertion windows closed (`route.fetch: Test ended`). The same two cases passed on mobile-chromium in the same run and on desktop-chromium in run 34536514657 nineteen minutes later. The change under test did not touch the offline workspace or the sync path. Earlier entries in [STATUS-log.md](../STATUS-log.md) (8 September pool-capacity and cold-stall corrections) record the same class.

## Decision

Add a Playwright dependency project, `warm-up`, that runs `tests/browser/warm-up.setup.ts` once after Playwright starts the dev server and before either browser project. It enumerates every `route.ts` and `page.tsx` under `src/app` (`scripts/warm-routes.ts`), substitutes a well-formed placeholder identifier for dynamic segments, and issues one unauthenticated GET to each. Any response proves the module compiled; a 401, 403 or 404 is as good as a 200. Per-route timings are attached to the test as `warm-up-timings` JSON and the ten slowest are printed, so the first run also measures the compile costs the suite was paying.

Playwright runs dependency projects unfiltered (confirmed in the pinned 1.63.0 runner source), so the focused single-file and `--grep` steps in the workflows warm as well. No workflow file changes; the separate `playwright.demo`, `playwright.crm-ui` and `playwright.projects-ui` configurations are unaffected.

## What is deliberately not changed

- No assertion, deadline or timeout in any spec. The 5-second windows encode a product expectation about visible save and sync state; a development-server compile is a harness artefact, not product behaviour.
- No Playwright retries. Retries would hide exactly this class of defect and undermine exact-head evidence.
- The `P11 declared load and raw core-read performance proof` job is not warmed: it measures cold-versus-warm p95 by design and starts its own server.

## Verification

Local (Node 22.22.2; the project pins 24.20.0): `tsc --noEmit`, `eslint` on the changed files, `node --test tests/unit/*.test.ts` 67/67 including three new cases that exercise the path mapping, the enumeration order and the real `src/app` tree (≥150 routes; `/api/v1/sync/operations`, `/api/v1/sync/recovery`, `/finance/handoffs` and `/offline` present; no route-group or slot names leak into URLs). `playwright test --list` shows the warm-up scheduled ahead of a single-file `--grep` invocation and a full-suite count of 70 + 70 + 1. Browser execution remains CI-only.

## Acceptance

Three consecutive full Application assurance runs green with no first-desktop-pass stall, and the `warm-up-timings` attachment showing the previously stalling routes compiled outside any assertion window. If a desktop-only stall recurs after warming, it is a different mechanism and reopens the tracked issue.

## Follow-on

The hosted demo runs a production image while the browser suite has only ever driven the development server. A CI-only mode that builds the deployed image and runs the browser projects against it would remove compile effects entirely and test what testers use. That touches the intentional production-start refusal, the Playwright `webServer` block and the seed path; it is a separate bounded design task with its own record.
