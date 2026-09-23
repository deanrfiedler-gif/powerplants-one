---
document_id: PPO-SH-EVID
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Local verification recorded with disclosed baseline failures; CI and owner acceptance separate
source_commit: ccc2251bbba9df266cac9027ddaa9418ab9abc1d
---

# SH platform verification evidence

Scope and boundaries: [handover](../../../delivery/sh-platform-handover.md), [ADR-0041](../../../decisions/ADR-0041-sh-platform-coordination.md). All records and identities are synthetic. No credentials, raw exports or operational documents are included.

Environment: Windows, Node 24.21.0, PostgreSQL guarded `ppo_synthetic_test`, Chrome 153.0.8010.53, Playwright 1.63.0. Commands use `npm.cmd`/`npx.cmd` to avoid the local PowerShell npm script policy. Accepted database and application browser/HTTP verification runs are serialized. Interrupted exploratory runs are excluded from passing evidence. Browser component fixtures are separate from database proof.

## Commands and results

The results below identify individual runs and retries. Unexecuted checks are not passes.

- Baseline `npm.cmd run test:unit`: 328/332, four existing Windows failures (two P06 private document adapter checks, P12 private roots, warm-routes path separator assertion).
- Baseline `node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/my-work.test.ts tests/database/desktop-shell.test.ts`: 9/9 passed.
- Current full `npm.cmd run test:unit`: 332/336, same four failures; all four new SH unit cases passed.
- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`: all passed after rebase and the breadcrumb/preferences refinements. The later visual/failure-state refinements receive the focused checks recorded below.
- `$env:PPO_PORT='3215'; node --env-file=.env.local --import tsx --test tests/http/sh-platform.test.ts`: 1/1 passed against compiled application.
- `node scripts/build-crm-ui-review.mjs` then `npx.cmd playwright test --config=playwright.crm-ui.config.ts tests/ui/desktop-shell.spec.ts --project=desktop`: 5/5 passed; old placeholder assertion updated for the implemented inbox.
- `$env:PPO_PORT='3215'; npx.cmd playwright test --config=playwright.compiled.config.ts tests/browser/sh-platform.spec.ts tests/browser/my-work.spec.ts tests/browser/my-work-mobile.spec.ts tests/browser/shell.spec.ts --output=tmp/sh-final-browser --reporter=list`: **35 passed, 20 intentional opposite-viewport skips**, including warm-up; no failures. Retains all ten desktop and ten phone My Work journeys, six shell journeys and eight SH journeys. Subsequent row-alignment/failure-count refinements receive a focused rerun below.
- `python scripts/check_foundation.py`, `python scripts/check_prototype.py`, `python scripts/check_naming.py`: passed after the new documents, register entries and rebase conflict resolution.

### Database and upgrade proof

```powershell
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/sh-platform.test.ts tests/database/my-work.test.ts tests/database/desktop-shell.test.ts
node --env-file=.env.local --import tsx --test --test-name-pattern='SH06 Engineering' tests/database/sh-platform.test.ts
```

First run: **18/19**; the Engineering case hit the existing 10-second statement deadline in `beforeEach` during schema reset, before assertions. Isolated Engineering rerun: **1/1**. All nineteen distinct cases therefore have passing executions, including the nine retained My Work/shell contracts and ten new SH contracts. This is not represented as a single uninterrupted 19/19 run.

```powershell
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='P07 upgrade|actor-wide time conflict|P10 additive upgrade|P08 additive|P06 upgrade|P05 additive|P09 fresh|fresh combined|original Gantt 0018|^upgrade preserves|already-current demo|baseline executed from Windows|old conflicting Gantt|late privilege failure|P09 exact submission|P09 return comments|P09 competing approve and return|P09 strict review|P09 revoked review|P10 source creation|P10 return retains|P10 empty scoped' tests/database/field.test.ts tests/database/finance-upgrade.test.ts tests/database/offline.test.ts tests/database/packs.test.ts tests/database/planner.test.ts tests/database/reports.test.ts tests/database/leads-projects-integration.test.ts tests/database/finance.test.ts tests/demo/upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='identical growing-area names|revoked review and response receipt' tests/database/sh-platform.test.ts tests/database/reports.test.ts
```

Affected migration/retained-source run: **21/22**. All changed exact migration-registry assertions and all **five hosted-upgrade cases passed**. The Service receipt-revocation case hit a seed-time statement timeout in the unchanged timezone trigger before its assertions. Final isolated run: **2/2**, proving that receipt case and the refined same-name Facility physical/grouping context. All twenty-two distinct migration/retained-source cases have passing executions.

Pristine main `ccc2251b` isolated diagnostics for the field actor-wide conflict and Service receipt-revocation cases both passed (one each). The intermittent setup timeouts were **not reproduced in those isolated main checks**; no statement deadline or assertion was relaxed. Earlier interrupted broad runs are excluded. The entire database suite was not claimed as locally green.

### Final visual refinements

The first inspected compiled captures exposed notification-row spacing; the text now occupies the space next to its checkbox. Entirely unavailable search/review sources withhold numeric totals, and partial notification counts are qualified. The first focused rerun passed **11/11**, including real Engineering reviewer/author/receiver navigation and unchanged source status. Inspecting those populated captures then exposed a returned proposal retaining an active reviewer task. The corrected source mapping now emits only its current correction task, and returned receiving requests use the latest explicit correction owner/deadline/reason. The expanded Engineering database case passed **1/1**, including delegated correction visibility and removal from the receiver’s actionable queue. Final affected lint, typecheck and compiled build passed. `node --import tsx --test tests/unit/sh-platform.test.ts tests/unit/desktop-shell.test.ts` passed **9/9**. Final compiled SH run passed **11/11**, including corrected reviewer/correction ownership, current source status, navigation back, failure counts and all seven widths:

```powershell
$env:PPO_PORT='3215'
npx.cmd playwright test --config=playwright.compiled.config.ts tests/browser/sh-platform.spec.ts --output=tmp/sh-reviewed-browser --reporter=list
npx.cmd playwright test --config=playwright.compiled.config.ts tests/browser/sh-platform.spec.ts --grep 'SH notification event|SH real review detail' --output=tmp/sh-bell-receiver-proof --reporter=list
node --env-file=.env.local --import tsx --test tests/http/sh-platform.test.ts
```

The second focused browser run passed **5/5**, including warm-up, after strengthening the populated bell wait and selecting the handover actually addressed to the receiver. The final HTTP check passed **1/1** against that compiled build. No browser runtime/version guard was bypassed. The maintained guard contains merged #281; local runtime was Chrome 153.



## Visual contract

All seven requested widths: 1440, 1280, 1024, 768, 430, 390, 320. Five interiors (`/work`, Actions, Reviews, Updates, Search) are checked for page overflow after reads settle. Additional captures cover all six review perspectives, all four notification views, compact search, current record preview and saved-view management. Failure/partial/empty captures use explicit synthetic response fixtures and are not source-availability claims.

### Inspected captures

The implementation agent opened and inspected these actual PNGs. They retain the current shell, r22 controls, keyboard focus treatment, drawers and responsive wrapping; no page overflow was found at the seven tested widths. Inner workspace scrolling is retained, so viewport captures show the relevant scrolled section. This is implementation QA, not independent owner or physical-device acceptance. [Capture manifest](capture-manifest.json) records the source run/path and SHA-256 for all 37 retained PNGs.

| Area | Representative inspected captures |
|---|---|
| Retained My Work | [Desktop](captures/my-work-desktop.png), [phone](captures/my-work-phone.png), [phone agenda](captures/my-work-agenda-phone.png), [Actions](captures/actions-desktop.png) |
| Notifications | [Inbox](captures/notifications-inbox-desktop.png), [320px rows](captures/notifications-inbox-320.png), [grouped](captures/notifications-grouped.png), [owned](captures/notifications-owned.png), [bell](captures/notification-bell.png), [phone detail](captures/notification-detail-phone.png) |
| Preferences | [Desktop](captures/preferences-desktop.png), [quiet hours and retained layout settings](captures/preferences-quiet-hours.png), [phone](captures/preferences-phone.png) |
| Search and views | [Full desktop](captures/search-desktop.png), [320px](captures/search-320.png), [compact desktop](captures/compact-search-desktop.png), [compact phone](captures/compact-search-mobile.png), [desktop preview](captures/search-preview-desktop.png), [phone preview](captures/search-preview-phone.png), [desktop views](captures/saved-views-desktop.png), [phone views](captures/saved-views-phone.png) |
| Six review perspectives | [My reviews](captures/reviews-my-reviews.png), [All permitted](captures/reviews-all-permitted.png), [Returned to me](captures/reviews-returned-to-me.png), [Handovers](captures/reviews-handovers.png), [Sent by me](captures/reviews-sent-by-me.png), [History](captures/reviews-history.png) |
| Real source roles | [Reviewer queue](captures/reviewer-mine.png), [correction queue](captures/reviewer-returned.png), [receiver desktop](captures/receiver-desktop.png), [receiver phone](captures/receiver-mobile.png), [return reason on phone](captures/returned-detail-phone.png) |
| Synthetic presentation failures | [Partial search](captures/search-partial.png), [empty search](captures/search-empty.png), [failed search](captures/search-failed.png), [failed notifications](captures/notifications-failed.png), [unavailable reviews](captures/reviews-unavailable.png) |

## Publication boundary

PR #281 merged as `c5280be`; this branch rebased before final verification. The merged guard accepts the reviewed Chrome 153/154 versions. Local Chrome 153 evidence remains distinct from CI runtime evidence. PR #282 is an independent Facilities LF correction. Neither change is copied here. Source/visual review, business acceptance and deployment remain outstanding.

The final concurrent-work inspection also found draft PR #283 (local design register/page guides). It overlaps `src/app/layout.tsx`, `src/components/shell-controls.tsx`, STATUS and the document register. Its already-published ADR-0040 led this branch to renumber its new SH decision to **ADR-0041** before publication; no parent requirement ID changed. The draft is not copied or merged here. Future integration must retain both shell contributions and update its local page inventory for `/search` and the changed SH interiors.
