---
document_id: PPO-FIN-UI-DEC
title: Finance workspace design and handover
revision: r01
date: 2026-09-14
status: Proposed interactive design; visual browser validation pending; application integration separate
owner: Dean Fiedler - personal prototype owner
source_commit: 723cce14d4746cd04a8d115ce8c60f6c057d76bd
---

# Finance workspace design and handover

The [Finance & Commercial Controls r01 HTML](../reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html) provides the dedicated interactive workspace requested by Dean. Finance already has the bounded P10 service handoff and account simulation; this proposal continues that work and does not describe the domain as unstarted.

Open the downloaded HTML in a modern browser. It is one self-contained file with embedded fonts, synthetic examples and tab-memory interactions. No installation, build step or account connection is needed. Reload or **Reset demo** restores the fixtures.

## Authority and source

Dean authorised the four-view standalone design using his attached r16 theme board on 14 September 2026. This records that design instruction and the resulting proposal; it does not record visual acceptance or application integration.

The repository baseline inspected was `main` at `723cce14d4746cd04a8d115ce8c60f6c057d76bd`. The existing [Finance contract](../contracts/finance-handoff.md), [ADR-0016](ADR-0016-p10-finance-handoff.md), [P10 handover](../delivery/p10-handover.md), [shared UI specification](../standards/ui-style-specification.md) and [naming standard](../standards/naming-conventions.md) govern the continuation. No Finance contract or application source was changed. Before publication, main advanced to `10625815187f26179f316b887fcdee33467ac81f`; the Finance contract and repository guidance were unchanged. This contribution was rebased onto that commit, retaining its newer documentation and register entries.

The supplied `powerplants-one-theme-style-board-r16(2).html` has SHA-256 `19d96d383fadfda3bb03b5939cb933a64e4b220e69b8cb9a21df3f48d90b794f`. Its three embedded `PPOBoardRoboto` font faces and core tokens are reused. The design retains navy `#242a37`, green `#62bb46`, light surfaces, one-pixel control borders and top-flush drawers with square top corners and rounded bottom corners. The original theme file is unchanged.

## Four connected views

| View | Working interactions and scope |
|---|---|
| Finance work queue | Seven handoffs; summary worklists, search, state/owner filters, due-date/customer sort, empty results and owner/next-action context. Dates use a fixed 14 September 2026 AEST snapshot. |
| Handoff review | Captured, technically reviewed, allocated, billable and non-billable quantities; source excerpts; treatment editing on Drafts; return/revision history; approval; processor claim/outcome; local review printing. |
| Customer accounts | Three accounts with invoice/payment/credit/deposit examples; document filters and application details; source dates; complete, partial and failed-update observations. Amounts are fictional AUD within the one PPA-DEMO company. |
| Reconciliation & exceptions | Original-result lookup after uncertainty; exact like-unit comparison; a matching closure journey and a mismatched result with an owned correction request. A request alone leaves reconciliation open. |

The four demo roles illustrate responsibility. They are not authenticated grants. The **Finance page guide** explains the journey and the **Finance states & responsibilities** panel includes the wider contract states, including Cancelled, which is not an available action in r01.

## Contract boundaries

- FIN-01–FIN-03/FIN-06/FIN-07, FD-01/FD-02/FD-04/FD-10 and TR-14 supply the bounded design traceability; this is not acceptance of every parent requirement. FIN-04/FIN-05/FIN-08 remain wider BP-09 scope.
- Original captured quantities remain unchanged. Non-billable quantities still consume the reviewed allocation. Returned handoffs retain that allocation; a revised Draft preserves the original revision and its treatment.
- Review approval, processor claim, observed outcome and reconciliation are distinct states. Unknown outcome permits original lookup; it cannot start a fresh processing attempt. The simulator retains one original target.
- Reconciliation compares quantities and units against every original result line. Missing, duplicate, extra or unlike-unit result lines block closure. The correction example preserves the mismatched original.
- Invoice original amount and source remaining are separate. The complete example is $1,100 original, $400 applied payment, $100 applied credit and $600 remaining. A $200 unapplied deposit remains separate. The failed-update example retains the reversal and $1,000 last-known invoice remaining. Partial account totals display **Unavailable**.
- MYOB remains the accounting authority. The design contains no ERP connection, posting endpoint, price/rate calculation, tax calculation, invoice issuance, correction posting, external transaction or customer communication. Source excerpts are explicitly illustrative, not issued report bytes. Local review printing is not the controlled OUT-14 release.
- Project profitability, cash forecasting, company-wide balances, new Finance policy, role enforcement, server persistence, full allocation/reversal workflows and document issuance remain outside r01. D-017 and operational MYOB evidence remain open.

## Walkthrough

1. As **Reviewer**, open Northbank's irrigation service from the queue. Inspect 90 MIN allocated as 60 billable plus 30 non-billable, and 2 EA material. Open the exact source excerpt and approve the handoff.
2. Change to **Processor**, claim processing, then choose **Unknown — accepted, then timed out**. Open Reconciliation and look up the original result. No second target is created.
3. Change to **Reconciler** and confirm the matching comparison. Northbank leaves the exception worklist while its completed record remains in the queue.
4. On Fernhaven, request a correction for 150 MIN observed against 120 MIN approved billable. The owned request is recorded; the mismatch remains open.
5. As **Preparer**, open returned Riverbend, create a revised Draft with a coverage note, edit treatment and resubmit. Review the retained revision history. On Berryline, both unresolved treatments must be set before submission.
6. In Customer accounts, inspect Northbank's applications and separate deposit, Greenridge's partial source, and Fernhaven's failed update and reversed payment. Table filters do not recalculate source totals.

Changing an unfinished drawer and pressing Close or Escape asks whether to keep editing or discard. Applying an action updates only this tab. Keyboard tabs, native dialogs, small-screen layouts and print styling are coded, but require the browser validation below.

## Verification and limits

`node scripts/check-finance-design.mjs` passes 18 isolated design checks, including allocation conservation, role/state guards, stale confirmation, no-effect and uncertain-result recovery, retained revisions, mismatch closure blocking, account completeness, template generation and escaped user text. The harness evaluates the shipped script with inert form/DOM stubs; it is not browser interaction or application integration evidence.

The complete script parses successfully. Static inspection confirms four labelled tabs, embedded fonts, no external resource dependencies, no duplicate static IDs and responsive/print styles. `python3 scripts/check_foundation.py`, `python3 scripts/check_prototype.py` and `python3 scripts/check_naming.py` all passed, as did `git diff --check`. The foundation check preserved all 15 issued source hashes and all 78 parent requirements.

**Visual browser validation is pending.** A local browser download timed out. The available cloud browser then rejected the local HTML URL under its browser security policy. No alternate preview route was used. Desktop/mobile appearance, native modal behaviour, real keyboard focus, browser console and printed-page layout have therefore not been verified in a browser.

Review the file at desktop and narrow mobile widths, including treatment editing, dirty-drawer dismissal, filter counts, keyboard tab movement and print layout, before adopting it as an accepted visual baseline. The accepted [UI baseline register](../standards/ui-baselines.json) remains unchanged because r01 has not yet been visually accepted. The ordinary document register, documentation index and Finance design status link this proposal so it is discoverable.

Application integration is a subsequent increment against the live Finance contract and existing application roles, source revisions, allocation/recovery services and document controls. This HTML is the design reference for that review, not an application deployment.
