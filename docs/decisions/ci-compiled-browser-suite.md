# CI browser suite against the compiled application

**Decided:** 11 September 2026 · **Owner:** Dean Fiedler (approved the recommended approach) · **Scope:** test harness and CI only · **Status:** implemented on the linked pull request as an additional signal; replacement of the development-server browser step is a later decision

## Problem

The browser suite has only ever driven `npm run dev`, the Turbopack development server. The hosted Azure demo runs the compiled application. Two consequences: first-request compilation lands inside assertion windows ([CI browser suite route warm-up](ci-browser-warm-up.md), issue #113), and the compiled code that invited testers use has never been driven by the 140-case suite, even though every Application assurance run already produces it through `npm run check`.

## Invariant that is preserved unchanged

`localConfig()` refuses synthetic identity whenever `NODE_ENV` is `production` or any hosted-platform marker is present; `demoConfig()` requires Entra identity **and** `NODE_ENV=production`; `npm start` is refused outright. Not one of these lines changes.

## Decision

Treat *compiled application* and *production environment* as separate things. The loopback synthetic-identity launcher gains a `--compiled` flag that serves the completed `npm run build` output with `next({ dev: false })`. `NODE_ENV` defaults to `test` in that mode — a value the pinned Next.js 16.3.4 accepts for a custom server without warning, and one the guard treats as non-production. The launcher refuses to start in compiled mode without `.next/BUILD_ID`. With no flag the launcher behaves exactly as before.

`playwright.compiled.config.ts` spreads the ordinary configuration and changes only the server command to `npm run serve:compiled`, so projects, viewports, deadlines, assertions and the warm-up dependency are identical. The warm-up is kept deliberately: it records compiled first-request timings beside the development-server ones as the control measurement.

A new workflow, **Compiled application browser assurance** (`application-compiled.yml`), runs on push and pull request beside Application assurance. It builds as a separate step, so a build failure is distinguishable from a test failure, migrates and seeds the same disposable database, runs the same browser suite against the compiled server and retains evidence as `compiled-application-browser-evidence`. Application assurance is not changed.

## Verification

- Guard: `NODE_ENV=production` with `--compiled` still fails with "Synthetic identity requires an explicitly local, unshared, non-production environment." (executed locally).
- Local, Node 22.22.2 (project pins 24.20.0): `npm run build` completed in 77 s; `tsc --noEmit`, `eslint` and 67/67 unit tests pass; `playwright test --config=playwright.compiled.config.ts --list` shows the same 70 + 70 + 1 as the ordinary configuration.
- End to end: Playwright started the compiled server through the new configuration and the warm-up project requested all 211 routes in 3,321 ms with none unreachable; slowest first request 637 ms (`/api/v1/appointments/…/completion-draft`). By comparison the development server has taken more than five seconds to answer a single first request under load (issue #113).
- Not executed locally: the browser projects (no Chromium in the sandbox). The first run of the new workflow is the proof.

## Honest scope

This drives the same compiled routes and pages as the hosted image, under synthetic identity rather than Entra sign-in, on loopback rather than in the container, with development React on the server (the client bundle is production). It tests the deployed code, not the deployed container. Driving the Entra-fronted image directly would require an authentication bypass, which is the wrong trade for a prototype whose identity guard is its main safety boundary.

## Acceptance and follow-on decision

Five consecutive clean runs of the new workflow on `main` and pull requests. After that, decide separately whether the compiled run replaces the development-server browser step in Application assurance or both continue; replacing it immediately would drop the only coverage of the development-mode behaviour local work relies on.
