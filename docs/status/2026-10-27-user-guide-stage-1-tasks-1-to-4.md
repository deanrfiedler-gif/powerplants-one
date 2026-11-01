---
title: User guide stage 1, Tasks 1 to 4: guide compiler, library and renderer
date: 2026-10-27
---

Dean accepted [ADR-0065](../decisions/ADR-0065-guide-markdown-parser.md) on 23 October 2026 and authorised the stage 1 build. PR #718 implements Tasks 1 to 4 of the [build plan](../superpowers/plans/2026-10-23-user-guide-stage-1.md); Tasks 5 to 9 have not started.

**Implemented** (code only; nothing is served from it yet):

- `marked` 18.1.0 and `yaml` 2.9.1, exact pins in `dependencies`. The lockfile adds only those two packages.
- In `src/guides/`: the guide model and the six status words; the front matter reader; the body compiler; the URL policy; the guide library, with its register cross-checks, the visibility rule and route matching; and the React renderer.
  - The compiler turns Markdown into PPO's allowlisted model and refuses everything else, naming the file and line.
  - The renderer reproduces the accepted page-guide panel, uses no HTML strings and re-checks every link.
- `npm run build` now runs `scripts/build-guides.ts` first. It writes the ignored `.ppo-guides/released.json` and fails on any guide error.
- Departures from the plan are recorded as rulings R1 to R15 in the PR. The main ones:
  - **CRM pilot skipped by name.** `docs/guides/crm-deals.md` still uses the old template, so the build skips it by name until its rewrite (Task 5).
  - **Route matching.** Every registered route is matched, so a static route never takes a dynamic route's guide.
  - **Visibility.** Carried-over guides are shown only while they are InReview or Reviewed.
  - **Callouts.** A callout marker must stand alone on its line.
  - **Discovery.** Every file under `docs/guides/pages/` is a guide. Elsewhere, a file is a guide when its front matter declares a guide key in any YAML form.
  - **Stricter refusals.** Character references, link titles, brackets and backslashes in links are refused beyond the plan's list.

**Not done:**

- No guide file exists under `docs/guides/pages/`: the build compiles 0 guides and releases 0.
- Pages still show the TypeScript guides or the "being prepared" fallback, unchanged.
- No guide was reviewed or published.
- The authoring contract (`docs/guides/README.md`) is Task 9. Until then, ADR-0065 and the code are the rules.
- Tasks 5 to 9 edit `docs/design/development/guides.json`, `register.json`, the component files and the studio tooling. They wait for Dean's go-ahead. Task 8 also waits for #721 and #729, which change the same catalogue files.

**Checked** after the review fixes below, on Node 24.21.0 and npm 11.19.0, with the proxy, CA-bundle and `ANTHROPIC_BASE_URL` variables cleared for the unit tests. PR #718 lists each head it checked.

- The npm checks all passed:
  - `npm run studio:check`: 372 entries, no errors, 26 stale.
  - `lint` and `typecheck`.
  - `test:unit`: 1,255 of 1,255.
  - `build`: "Guides compiled: 0. Guides released: 0", plus the skip line for `crm-deals.md`.
- The Python checks all passed: `check_foundation.py`, `check_naming.py`, `build_status.py --check` and `check_documentation_scope.py`.
- `npm audit --omit=dev --audit-level=high` found 0 vulnerabilities.
- `node scripts/check-npm-audit.mjs` found no unexcepted high or critical advisories.
- The same 26 entries read stale on unmodified main 923f1284, and no review fingerprint was refreshed.

**DK-06 ([ADR-0056](../decisions/ADR-0056-dependency-update-and-audit-gates.md)):**

- Managed publications on the current DK06-OUT09-2 contract fingerprint only the `playwright` and `playwright-core` versions, which are unchanged, so they stay supported.
- Any retained DK06-OUT09-1 publication still supported fingerprints the whole lockfile. It reads `DefinitionChanged`, and Job pack preparation at its sites refuses with `TemplateUnavailable` until it is republished as DK06-OUT09-2. This is the same consequence as every lockfile change.

**Review:**

- Each task, and the whole branch, was reviewed by Claude subagents, and every finding was fixed or ruled on.
- ChatGPT gave the independent second-model review that CONTRIBUTING.md requires for a security control, on 27 October 2026 against 293fd86e. It found 2 Critical and 3 Important defects. Each was confirmed against the code, reproduced by a failing test and fixed:
  - **Blank reviewer.** A reviewer name that displays as blank (whitespace, invisible or filler characters) no longer counts as review evidence, and the front matter refuses one.
  - **Release file.** The production server applies the visibility rule again to the release file it reads, so a file edited after the build cannot show a hidden guide.
  - **Discovery.** Outside `docs/guides/pages/`, a guide key declared anywhere in the front matter, in any YAML form, makes the file a guide, so a malformed guide fails the build.
  - **Route links.** A route link may hold only the characters a URL path keeps as written, and is refused unless the browser opens it as written, so `..` and `%2e%2e` segments cannot pass the register check and open another page. All 216 registered routes still pass.
  - **Nesting.** Lists, callouts, bold and italic text and links may nest 8 levels deep. The compiler refuses more, and the renderer draws nothing past that depth, so a hand-edited model cannot exhaust the stack.
- Whether the reviewer accepts the fixes is not yet recorded.
- No acceptance scenario was run. No business approval or production readiness is claimed.
