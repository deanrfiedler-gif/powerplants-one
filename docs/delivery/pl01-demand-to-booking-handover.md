---
document_id: PPO-PL01-BOOKING-HO
title: PL-01 booking from unassigned demand — implementation handover
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Implemented and locally verified on an isolated branch; draft PR for owner review; no deployment
source_commit: 2189d0f7992448b11da8e0b99e1c0fd6402ba79d
---

# PL-01 booking from unassigned demand — implementation handover

**State:** implemented and locally verified on an isolated branch, offered as [draft PR #280](https://github.com/deanrfiedler-gif/powerplants-one/pull/280). The Plan visit panel design review and owner acceptance remain separate. No deployment, migration, seed, permission capability or grant is added.

Authority: Dean's PL-01 instruction of 19 September 2026, recorded in [ADR-0039](../decisions/ADR-0039-pl01-booking-continuation.md). On 22 September Dean delegated the decision on this parked work and it was resumed as the next single repository write after #279 merged. Predecessor: [PPO-PL01-DEC r02](../decisions/pl01-unassigned-demand.md), whose "scheduling from demand" exclusion this lifts.

- **Starting base:** main `2189d0f7992448b11da8e0b99e1c0fd6402ba79d` (#279 merged)
- **Branch:** `feature/pl01-booking-from-demand`
- **Worktree:** `C:/Users/Dean.Fiedler/Projects/ppo-wt/pl01-booking-from-demand`
- **Origin:** the 19 September work began on main `8b33b4e` in an uncommitted worktree. It was preserved as local commit `7cf1354` on 22 September and applied here with the corrections listed below.

## What it does

- Each unassigned demand card in the planner offers **Plan visit**. It opens a panel showing the exact work order, the authorised scope revision and the site timezone.
- A guided proposal is saved in site time. It takes an optional paired customer window, and the user must explicitly select Preparing.
- The proposal is offered only when four conditions hold:
  - the order is Authorised
  - the current scope equals the authorised scope, and that scope is approved
  - there is no non-cancelled visit
  - the user holds edit authority
- A changed work order version is shown for review and never adopted automatically.
- After acceptance, **Continue booking / View appointment** leads through the existing readiness review, customer contact and crew confirmation. Each step is saved separately, and a proposal reserves no crew.
- A bounded same-tab `sessionStorage` journal keeps the exact original of each of the four saved steps. A reload resolves the session, then checks the original server receipt. Only an explicit unchanged retry resends. Sign-out and identity locks clear the journal in every open view.
- Planner criteria (day, view, timezone, site, resource, status) live in the URL, so a validated `returnTo` brings the user back to the exact planner view.

## Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | PL-01 Unassigned demand (PPO-PL01-DEC r02), increment SC-07 demand → SC-08 booking; API-R03/R04/R09, API-C04; TR-03/TR-08; SR-05/06/07/19/20; PT-08/09/10/26 boundaries preserved |
| Page type | Planning workspace, with a supporting Form / guided workflow and the existing Record detail (appointment) |
| Reused components | PPO shell; `src/components/business-ui` (Field, SelectField, ReadState, ErrorNotice, Stamp, useResource, api); ScopeView, extracted unchanged in behaviour to `src/service/components/client/scope-view.client.tsx`; the existing appointment crew/contact controls and work-order readiness form; `src/scheduling/time` IANA conversion |
| Source authority | User instruction (ADR-0039). No design HTML exists for PL-01 by recorded decision (PPO-PL01-DEC r02). The panel composition is proposed, not an accepted baseline. All data is synthetic fixtures |
| Incoming handover | Current permitted work-order, authorised scope revision/version, site and site timezone from `schedule.read` demand plus `service.work_order.read` detail |
| Outgoing handover | An accepted proposal identity (appointment, Proposed, no reservation). The service owner keeps preparation follow-through; readiness, contact and confirmation remain independent saved steps on the existing screens |
| Exceptions and recovery | Missing or unreadable context disables saving and links to the work order. A stale version is shown for review. A lost response is recovered by receipt lookup, with an unchanged retry offered only explicitly. Corrupt or unavailable storage refuses to send. Another identity cannot restore the journal |
| Departures (proposed) | 1. No design HTML, continuing the recorded application-first PL-01 departure. 2. A right-side modal panel holds a guided form. The standard reserves right-side panels for inspection and centred dialogs for short decisions; this form keeps the planner visible as context. 3. Panel rules sit in scoped `src/app/styles/planner-demand.css`. 4. The planner screen moved to `src/scheduling/components/client/` under the PPO-STD-002 forward structure, with its consumers updated. No design-baseline hash changes |
| Verification | Below. Code delivery and component tests are separate from owner acceptance; no acceptance scenario was executed |

## Corrections made while resuming (23 September)

1. **Conflicts.**
   - `src/app/layout.tsx`: both stylesheet imports are kept (Facilities and planner-demand).
   - Planner screen: the WIP's URL-derived context is kept. Main's default day `2031-09-22` (ADR-0030) now sits in `plannerContext`.
2. **Fixture dates, per [ADR-0030](../decisions/ADR-0030-test-fixture-time-dependence.md).**
   - The WIP-added future literals moved +261 weeks: `2026-09-21/25/28/29` became `2031-09-22/26/29/30`, keeping each weekday.
   - Past evidence dates (`2026-09-05`) stay.
   - This was applied only to the WIP-added literals, never repository-wide, so main's already-shifted dates are untouched. `tests/unit` stays excluded; the one unit assertion of the planner's default day now expects `2031-09-22`.
3. **Asset-site fixture removed.**
   - Migration 0041 made `ppo.assets.site_id` `NOT NULL` and permanent (`shared_graph_guard`). A test that set an asset's site to `NULL` could not run.
   - Demand and work-order detail share `orderVisibility`, so a demand row whose detail is unreadable is not constructible on the live schema. That test therefore now claims only what it proves: demand visibility grants no proposal authority.
4. **Completed attendance created for real.** The WIP assumed the seed contains completed attendance, but it contains none. The test now completes a visit through the real field workflow (`tests/helpers/reports.ts` `submitted()`), then proves the work order stays out of demand.
5. **Browser configuration.**
   - The separate `config/playwright.pl01.config.ts` is removed. It added a new top-level directory and needed a hand-started server.
   - The spec declares its own `America/Los_Angeles` device timezone, so entry in device time cannot pass unnoticed. It runs under `playwright.compiled.config.ts`, including CI's full compiled browser job.
   - The crew submit label is corrected to **Confirm booking**, which is unchanged since before the WIP.
6. **Lint.** The recovery hook's cleanup now captures its refs locally. There is no behaviour change.

## Executed validation

Local run on Windows 11, Node 24.21.0, PostgreSQL 16.15 and the Chrome channel. The disposable `ppo_synthetic_test` database was migrated through 0042; 0016 is hosted-only.

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass |
| `eslint .` | Pass, 0 warnings |
| `npm run test:unit` | 328 of 332 pass. The 4 failures (P06 ×2, P12, and warm-routes path separators) reproduce identically on unmodified main `2189d0f`; they are Windows-only. All 5 PL-01 unit tests pass |
| `npm run build` | Pass |
| `tests/database/demand.test.ts` | 8 of 8 pass, including one proposal from two planners on one basis, cancelled visits returning to demand, and completed attendance staying excluded |
| `tests/browser/pl01.spec.ts`, compiled, desktop and mobile | 8 of 8: the full journey from demand to confirmed two-person crew with the retained planner context; lost response survives reload without repeating; unknown original offers only unchanged retry; corrupt storage and identity isolation |
| `tests/browser/field-technicians.spec.ts` | 4 of 4 |
| `tests/browser/planner.spec.ts` and `work-orders.spec.ts` | 16 of 16. These specs hard-code `Origin: http://127.0.0.1:3000`, which CI uses, so locally they were run with that literal pointed at the local port and then restored byte-for-byte. The run was not committed |
| Live schema at 0042 | Six appointment states, `guard_dispatch`, deferrable `booking_consistency`, `capture_appointment_revision` with `no_delete`, and the active `ppo.resource_reservations` exclusion |

**Not run locally:** the full database, HTTP and compiled browser suites, and the hosted-demo upgrade. CI runs them on the PR. No migration, seed or grant is added, so the migration-registry and grant-snapshot suites are unaffected.

## Open

- **Owner review:** the Plan visit panel composition and the right-side form departure.
- **Owner acceptance:** PL-01 booking continuation acceptance is not executed.
- **Unchanged from PPO-PL01-DEC:** its open question on follow-up after a completed visit.
- **Not deployed:** the hosted demo.
- **Unrelated, noticed:** `src/app/(business)/facilities/page.tsx` is committed with three CRLF lines under `eol=lf`, so every Windows checkout shows it modified. It needs a separate renormalisation fix.
