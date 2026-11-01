---
title: User guide stage 1, Tasks 5 to 9: page guides served from Markdown
date: 2026-11-01
---

On 1 November 2026 Dean asked Claude to go ahead with Tasks 5 to 9 of the [stage 1 build plan](../superpowers/plans/2026-10-23-user-guide-stage-1.md) under [ADR-0065](../decisions/ADR-0065-guide-markdown-parser.md). They are implemented in draft PR #817, which is not yet merged. Tasks 1 to 4 were merged earlier through PR #718.

**Implemented** (code and documents on the branch; nothing below is reviewed, accepted, published or deployed):

- **Markdown is the single source of page guides.** The seven TypeScript guide modules are retired. Their content is carried over unchanged into twenty Markdown guides under `docs/guides/pages/`, each InReview and marked `shown_before_review` with `carried_over_from`. A parity test proves they draw the same panel markup as before, so users see exactly the released guides they saw.
- **Serving.** `npm run build` compiles the guides into `.ppo-guides/released.json`, and the root layout passes the released guides to the shell. A missing or damaged release file leaves the shell working, with the "being prepared" fallback on every page.
- **CRM Deals guide.** [`crm-deals.md`](../guides/crm-deals.md) is rewritten for the five-stage workflow. It is InReview without `shown_before_review`, so it stays hidden and the Deals pages still show the fallback.
- **Design workspace and tooling.** The catalogue reads the Markdown guides and reports their errors in `studio:check`. One six-status vocabulary applies to Markdown guides and JSON drafts. A page shows the Markdown guide that covers it before any JSON draft. `studio:sync` writes Draft Markdown stubs.
- **Removed JSON drafts.** Twenty `guides.json` drafts whose keys moved to Markdown are removed: `guide.page.sales.opportunities`, `guide.page.engineering`, `guide.page.estimating`, `guide.page.sales.leads`, `guide.page.work`, `guide.route-engineering-basis`, `-drawings`, `-queries`, `-reviews`, `guide.route-estimating-cost-sources`, and the ten `guide.route-supply-*` drafts (changes, deliveries, dispatch, material-readiness, purchasing, receipts, returns, service-stock, shipments and stock). Their text stays in Git history for the later rewrite. Drafts for pages a Markdown guide covers only through `also_applies_to` stay.
- **Authoring contract.** [`docs/guides/README.md`](../guides/README.md) (PPO-GUIDES-README) states the rules: file locations, every front matter key and the template mapping, the six statuses and who changes them, the visibility rule, allowed Markdown, panel rules, links, callouts, refusals, adding a guide, recording a review and retiring a carried-over guide. A unit test proves the library does not read it as a guide.
- **Design register.** The [guidance contract](../design/development/systems/guidance.md) and the [design workspace README](../design/development/README.md) describe the Markdown pipeline and the visibility rule. Stale references to the retired modules are corrected in `pages/route-work.md`, `systems/guidance.md` and six `guides.json` source and workflow paths.

**Checked** on 1 November 2026, on Node 24.21.0 and npm 11.19.0, at the Task 9 working tree (2c831557 plus this change). Unit tests and builds ran with the proxy, CA-bundle and `ANTHROPIC_BASE_URL` variables cleared.

- `npm run check` passed:
  - `studio:check`: 372 entries, no errors, 346 unreviewed, 26 stale.
  - `lint` and `typecheck`: no problems.
  - `test:unit`: 1,313 of 1,313 passed.
  - `build`: "Guides compiled: 21. Guides released: 20", then the Next.js build compiled and generated 82 of 82 pages. Turbopack warned twice that the release-file read in `src/guides/library.ts` traces the whole project; the build still passed.
- `npm audit --omit=dev --audit-level=high`: "found 0 vulnerabilities".
- `node scripts/check-npm-audit.mjs`: "No unexcepted high or critical advisories (0 excepted, 0 exceptions recorded)."
- `check_foundation.py`, `check_naming.py`, `build_status.py --check` and `check_documentation_scope.py --base 2c831557` passed.
- `node scripts/build-crm-ui-review.mjs` and the CRM UI Playwright suite: 46 passed and 38 skipped by the specs' own conditions. `desktop-shell.spec.ts` passed its 6 desktop runs; its 12 phone runs skip by design. Chrome is not installed here, so the suite ran through a temporary, Git-ignored wrapper config that used the pre-installed Chromium and left out the PDF renderer setup. No spec was changed.

**Stale design reviews.** As ADR-0065 expected, all 26 entries with a recorded visual review read "Source or design changed since review", because the shared shell and layout sources changed: `scope:SH-01`, `scope:SH-02`, `scope:PL-01`, `scope:FI-01`, `scope:FI-02`, `route:/`, `route:/login`, `route:/offline/index.html`, `route:/my-jobs`, `route:/my-jobs/[id]`, `route:/my-jobs/site-readiness`, `route:/sales/leads`, `route:/sales/leads/[id]`, `route:/sales/opportunities/new`, `route:/sales/tasks`, `route:/schedule`, `route:/work`, `route:/work/[id]`, `route:/work/actions`, `route:/work/new`, `route:/work/reviews`, `route:/work/team`, `route:/work/waiting`, `system:shell`, `system:guidance` and `system:offline`. No review fingerprint was refreshed.

**DK-06 ([ADR-0056](../decisions/ADR-0056-dependency-update-and-audit-gates.md)).** Tasks 5 to 9 do not change `package.json` or `package-lock.json`; the lockfile change that added `marked` and `yaml` came with Tasks 1 to 4, and its DK-06 consequence is unchanged: retained DK06-OUT09-1 publications read `DefinitionChanged` until republished, and DK06-OUT09-2 publications stay supported.

**Not done:**

- No guide was reviewed or published. The carried-over guides are shown before review only to keep the help users already had.
- The independent cross-model review of `src/guides/compile.ts` and `links.ts` for this PR is still to be requested and recorded.
- No acceptance scenario, device, keyboard or screen-reader check was run. No business approval or production readiness is claimed.
- No migration, permission, capability or route changed.
