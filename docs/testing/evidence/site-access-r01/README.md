# CS-06 r01 verification record

**Verified implementation commit:** `65e411378cf96d0e752bd45bc727ee1a69166ba8` · **Source main:** `07eb34d5df5ea430c365da78e160cb6aa0b76f20`.

Standalone synthetic design only. Owner acceptance, application integration, authenticated permission enforcement and complete F08-A remain separate.

## Completed verification

- **19 model groups passed**, covering exact facility scope, parent/sibling exclusion, cross-site evidence, whole attendance windows, season/date boundary, activity applicability, personal induction expiry, acknowledgement preserving blockers, original snapshots, review, stale bases, duplicate prevention and advance shutdown approval.
- **15 DOM-emulation groups passed**, covering all six views, source/search/filter forms, timing changes, nested/cross-site scope, acknowledgement, local persistence, captured/reviewed evidence, positive prerequisite completion without work permission, source successors, new requirement review, read-only controls, unavailable-source recovery, stale-save refusal, quota failure and malformed storage retention.
- No reported DOM runtime errors. Native dialog methods are shimmed; these results do not measure geometry, browser-native validation, focus containment, downloads, screen-reader behaviour or actual rendering.
- Focused repository ESLint, JavaScript syntax, deterministic HTML assembly and diff whitespace checks passed.
- Foundation, prototype and naming checks passed: 78 parent requirements, 29 decisions and 38 planned acceptance identities preserved. Exact output is in [verification.json](verification.json).

[Model results](model-results.json) · [DOM results](dom-results.json).

Final HTML SHA-256: `c47c49041195b3834393f880daad83239e15280eaaff8978125f827c52036506`.

The local checks used Node 24.19.0 and jsdom 26.1.0, through an existing optional preview-tools installation. No application dependency or package pin changed. CI remains configured to use the repository-pinned Node/Playwright/Chrome environment.

## Verification and publication limitations

Native browser tests and visual inspection were **not performed**. No browser binary was installed locally; the available Playwright browser download repeatedly timed out and ended in failure. The committed native browser script specifies all-six-view checks at 1440, 1024, 820, 390 and 320 px, form/review journeys, local-save recovery and original desktop/phone captures. These are prepared checks, not passing results. No screenshot or full accessibility claim is made.

Automatic approval review rejected the initial GitHub push because it treated the personal repository destination as inferred rather than explicitly authorised. The rejection was not bypassed. A subsequent read-only remote check returned no matching branch. No PR, Actions run, merge or deployment was created. The local commits, deliverables and patch package are ready for explicit destination approval; the dedicated workflow will provide native verification after authorised publication.

## Reproduction

```sh
python3 scripts/build-site-access-design.py
node scripts/check-site-access-model.mjs
PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node scripts/check-site-access-dom.mjs
node scripts/check-site-access-browser.mjs
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

The browser script uses the repository-pinned Playwright/Chrome environment and writes original screenshots, results and hashes to the ignored `verification-evidence/site-access/` directory. The prepared workflow retains them as an artifact. Full application checks and normal merge gates remain separate from this design package.

Next: publish the review branch/PR once the repository destination is explicitly approved, run native checks, inspect the original desktop/phone captures and correct any findings before claiming visual verification.

## Restored-package native review — 16 September 2026

PR #214 restored this original package. Native run `35152433742` reached the export check after the first twelve model/UI journeys completed. The export locator also matched the retained, hidden Preview options dialog button; its failed click left a download waiter unhandled during browser cleanup. The repaired check selects the visible `Export demo data` control by its accessible name and awaits the click and download together. Export data assertions and every remaining native check are retained. The repaired run, rather than the earlier prepared-test statement, supplies current execution evidence. No product HTML changed for this harness correction.
