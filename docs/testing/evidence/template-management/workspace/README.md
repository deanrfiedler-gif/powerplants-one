# Templates workspace execution evidence

Owner: Dean Fiedler. Implementer: Codex. PR #704, DK-06. Delivered source, functional proof, independent visual review and owner acceptance are separate. Keep the PR draft until its current-head review and CI gates pass; no deployment is claimed.

Source: PPO - Design, page 793:6155, named version “Template management — accepted”, with the accepted phone-header amendment. [Retained icon-free captures](../../../../reference/ui/template-management/template-management-figma-r01/README.md) remain unchanged. Application captures block Font Awesome network requests and use local fallback glyphs. The fixture captures contain synthetic examples; `native-published-proposal-320.png` comes from the real synthetic database journey. Neither grants design acceptance.

## Validation

| Check | Result |
|---|---|
| Final production build and TypeScript | Passed |
| Focused lint over changed source, tests and configuration | Passed |
| Focused template units | 11 passed |
| Native catalogue/usage database suite | 6 passed |
| Native proposal, publication and site-use database suites | 17 passed |
| Compiled native HTTP suites, including new read projections | 4 passed |
| Compiled browser suite | 13 passed: 12 fixture/layout/recovery cases and one real database journey |
| Studio, foundation and status | Passed; documentation assurance only |

The native browser journey creates a proposal through the drawer, verifies that its author cannot review, switches to the independent reviewer, records all-Pass evidence, publishes the exact revision, follows the publication's site handover and assigns the exact supported definition. The assignment is read back from the real API. No template API in that test is fulfilled by a fixture.

Fixture proof covers both registers, exact definition/proposal and site use at 1440, 1024, 390 and 320 px; snapshot focus/return, continuation revalidation/focus, failed/empty reads, tab retention, publisher-only readiness, historical read-only behavior, uncertain original retry across read-authority loss, exact assignment/predecessor handovers, new/revised proposals and stale refusals. A separate temporary Chrome profile changes Chrome's own zoom setting to 200%; measured layout is 720 CSS pixels with device pixel ratio 2 in a 1440 px physical viewport. Both registers and exact records reflow, and keyboard tab navigation remains usable. These are browser checks, not a manual screen-reader audit.

## Corrections and limits

Screenshots were inspected against accepted desktop and phone captures. Corrections remove the extra record side menu, phone shell-tab-bar gap and toolbar rows, stack phone fields, place the main actions at the viewport edge, and bind the reused WorklistPanel to a right drawer or centered decision with a fixed header and scrolling body. Full identifiers remain available in facts; the current shell and phone amendment govern navigation. Different synthetic row counts/content and current source/runtime versions are deliberate, not design sample figures in application code.

The first browser attempts exposed stale test expectations for the exact revision link and applied-filter accessible name, then nested error fixtures that differed from the native flat HTTP contract. Those fixtures were corrected. The new native HTTP test exposed a real title projection defect: publication snapshots hold proposal metadata, not the revision body. Current main's insertion confirmed that schema; choices now read the exact published template name after authorization. The final four-case HTTP run passed. Version-zero site policy is labelled not adopted and does not claim an already pinned baseline.

An earlier database run on port 55476 was interrupted when another run claimed #706. It is not acceptance evidence. All accepted native results here use the independent loopback cluster on 55474 and only `ppo_synthetic_test`. No Library worktree or new proof files were modified.

Not run: full repository unit/lint suites, unrelated module suites, template migration-upgrade suites (no migration/seed/grant change), exhaustive screenshots for every refusal permutation, or manual screen-reader review. Independent composition review and owner workflow acceptance remain pending. No hosted environment, production connection, business transaction or external send was used. No schema, grant or dependency was added.

## Repeat

Use the existing dedicated worktree and its ignored synthetic environment, a disposable `ppo_synthetic_test` database, and a private document store outside the checkout. Never point these reset-enabled native tests at another database or another run's cluster. Build and start the compiled app on its dedicated port 3474. The committed `playwright.templates.config.ts` does not start or reuse port 3000.

```powershell
npm run build
npm run serve:compiled
# In another terminal in this same worktree, after the server reports ready:
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config playwright.templates.config.ts
```

The native browser test resets its disposable database. Run database and HTTP suites serially, separately from that native browser test. [Execution manifest](execution.json) binds the source, commands, results and capture hashes; it carries no visual review fingerprint.
