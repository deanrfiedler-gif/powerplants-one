---
document_id: PPO-FIN-UI-DEC
title: Finance workspace design and handover
revision: r02
date: 2026-09-14
status: Proposed interactive design; visual browser validation pending; application integration separate
owner: Dean Fiedler - personal prototype owner
source_commit: c3797ce9605a9eb1afab1f839e47e63095de1f7d
---

# Finance workspace design and handover

The [Finance & Commercial Controls r02 HTML](../reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html) refines the dedicated Finance workspace with complete no-posting and correction journeys, richer evidence, connected accounts and a scripted review assistant. It retains the four-view structure and the existing bounded P10 contract. Finance was already implemented in part; this proposal does not describe the domain as unstarted.

Download the HTML and open it in a modern browser. It contains its fonts, styles, script and synthetic examples in one file. No installation, build step or account connection is needed. Changes last for the page session; reload or **Reset demo** restores the fixtures. The **Page guide** contains the demonstration walkthrough.

## Authority and source

Dean authorised r02 on 14 September 2026, including the workflow corrections, r18 component refinements and contextual AI demonstration. This records that instruction and the resulting proposal, not visual acceptance or application integration. R01 was merged in [PR #178](https://github.com/deanrfiedler-gif/powerplants-one/pull/178). Its [HTML](../reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html) remains unchanged, with SHA-256 `837476446970f1c66c48a7d70c55681aa67b24877097e96886adc762537429e1`. R01's original repository source was `723cce14d4746cd04a8d115ce8c60f6c057d76bd`; publication retained newer main documentation at `10625815187f26179f316b887fcdee33467ac81f`.

R02 was prepared against `main` at `c3797ce9605a9eb1afab1f839e47e63095de1f7d`. The maintained [Finance contract](../contracts/finance-handoff.md), [ADR-0016](ADR-0016-p10-finance-handoff.md), [P10 handover](../delivery/p10-handover.md), [shared UI specification](../standards/ui-style-specification.md) and [naming standard](../standards/naming-conventions.md) govern the continuation. No Finance contract or application source is changed.

The supplied `powerplants-one-theme-style-board-r18(1).html` has SHA-256 `e55ccbabef40a0b07a95ee5847f99147a8f29e8f7c84f90497df2b4d5e6696ab`. All 39 core tokens and all three embedded `PPOBoardRoboto` font faces match exactly. R02 applies its 24 px heading, 2 px focus outline, 14 px floating choice cards, square inspection/assistant panels, focused decision dialogs and bottom-corner form drawers. Mobile controls and assistant buttons have a minimum 44 px target. Enhanced selects keep a native select fallback and coded keyboard handling; real browser interaction remains unverified. The supplied theme file is unchanged.

## Four connected views

| View | R02 interactions and scope |
|---|---|
| Finance work queue | Eleven handoffs with state/owner/search filters, actionable worklists, waiting age, submission/review/outcome times and evidence gaps. Fixed synthetic clock starts at 14 September 2026, 12:30 AEST. Review targets are examples, not an agreed SLA. |
| Handoff review | Captured, reviewed, allocated, billable and non-billable quantities; source/revision inspection; explicit Travel; exact fractional material; treatment editing; return, revision, cancellation and processing actions; matching customer account link; complete searchable history. |
| Customer accounts | Six matching account contexts. Three have observed document fixtures; three explicitly have no configured source. Invoices, payments, credits, deposits, reversals and applications link to their source context. Complete, partial and failed reads retain dated observation history; incomplete current totals are unavailable. |
| Reconciliation & exceptions | Unknown-outcome lookup; no-posting reconciliation; exact line and metadata comparison; unexpected/missing/duplicate lines; correction owner and required evidence; linked correction observations, verification and final resolution with the original result preserved. |

The demo access selector illustrates Preparer, Reviewer, Processor, Reconciler and read-only access; it does not implement authentication. **Demo scenarios** offers loading, partial read, failed read, unavailable access and changed-source cases with recovery actions. Denied access hides records and amounts, including print and assistant content. Incomplete reads do not expose misleading overall counts or allow mutations.

## Workflow and evidence boundaries

- FIN-01–FIN-03/FIN-06/FIN-07, FD-01/FD-02/FD-04/FD-10 and TR-14 supply bounded traceability; this is not acceptance of every parent requirement. FIN-04/FIN-05/FIN-08 remain wider BP-09 scope.
- Fully non-billable work records verified no effect and reaches **NoPostingRequired** through separate reconciliation. It retains reviewed quantities, allocation and reasons, consumes that allocation and creates no processing target or zero-quantity target lines. Chargeable **Not processed** work returns to Approved with its attempt history retained.
- Original captured quantities remain unchanged. Travel is separately identified and non-billable under the existing P11 v2 treatment. Time is whole MIN; materials use exact fixed-point quantities with up to six decimal places. The two Greenridge partial-allocation examples conserve one shared source across handoffs; this illustrates allocation evidence without extending the live allocation API.
- Approval, claim, observed outcome and reconciliation remain distinct. Unknown outcome permits lookup of the original result, without another processing attempt. Unconfirmed target references are not exposed to the reviewer or assistant. Cancellation and return of an Approved handoff are guarded before any possible effect. A changed source preserves original evidence and holds; pre-effect work returns for revision, while uncertain or completed effects require recovery/reconciliation.
- Result evidence includes company, customer/account, currency, document type, source status, observation time, evidence references and mappings to source entries and allocations. Comparison uses every result line, exact like units and explicit differences. Missing, duplicate, extra, unlike-unit, direction or identity discrepancies block closure. These are deterministic fixture checks, not an invented monetary tolerance or tax policy.
- Correction progress is **Requested → Evidence supplied → Verified → Resolved**. Supplying mismatched evidence leaves the correction open. A separately recorded matching observation must link the original result and be verified by the Reconciler before closure. Original results and previous observations remain inspectable. Recording fixture evidence does not issue a correction in MYOB.
- Accounts distinguish current observation, last successful observation and attempted read time. Northbank shows $1,100 original invoice, $400 applied payment, $100 applied credit and $600 remaining; its $200 unapplied deposit stays separate. Fernhaven's failed-read example retains the reversed payment and $1,000 historical remaining while current totals are unavailable. Partial totals are unavailable; filters never recalculate source totals.
- History shows every recorded fixture event with actor, time, revision, state and outcome; text, actor and event filters are available. Revised source snapshots remain inspectable. This page-session history is not a persistent audit service.
- MYOB remains the accounting authority and SharePoint the business document authority. No ERP connection, posting endpoint, price/rate or tax calculation, invoice issuance, correction posting, external transaction or customer communication is included. Source excerpts are illustrative, not issued report bytes. Local review printing is not the controlled OUT-14 release.

Project profitability, cash forecasting, company-wide balances, new Finance policy, authenticated permissions, server persistence, production allocation/reversal workflows and document issuance remain outside r02. D-017 and operational MYOB evidence remain open.

## Scripted Finance review assistant

**Explain this difference** opens the r18-style Assistant position with Conversation, Drafts and Activity. Each handoff has a separate thread and captured revision/source context. It can explain the deterministic comparison, identify missing/stale evidence, summarise history and propose an editable return or correction note. On Fernhaven it explains **120 MIN approved versus 150 MIN observed: +30 MIN**. Source links inspect the captured response evidence, not a later replacement silently substituted into the response.

Replies are scripted locally; no model provider or runtime integration is connected. The existing CRM AI pilot is not represented as an implemented Finance service. Stop, retry, failed response and unavailable-information examples retain the draft input. Context changes prevent stale notes being applied. Switching records with unfinished assistant work asks for confirmation and retains the original thread. Draft text is preserved in full, with an explicit limit error if it is too long for the ordinary note form.

Using a draft opens the normal return/correction form for editing and explicit human confirmation. The ordinary role, state, revision and evidence checks still apply. The assistant cannot approve, reconcile or post. Flagging a response records a local review marker only; it sends no message or feedback outside the file.

## Review walkthroughs

1. **No posting:** as Reviewer open Riverbend Travel (`000248`) and approve. As Processor claim it and record verified **Not processed / no posting required** evidence. As Reconciler confirm **No posting required**. Check that all 60 MIN remain recorded, the allocation is consumed and no target exists. Berryline's Draft can also be made fully non-billable to exercise labour and material together.
2. **Correction:** open Fernhaven (`000245`), inspect original result and **Explain this difference**. Request an owned correction with required evidence. As Processor record **Still different** evidence, then matching evidence; both observations remain. As Reconciler verify, then resolve. Inspect the retained original 150 MIN and linked corrected 120 MIN.
3. **Unknown result:** on Bayview (`000246`) look up the original result, inspect the mapped evidence and reconcile as Reconciler. A fresh claim, cancellation or second outcome remains blocked while unknown.
4. **Return/cancel/source revision:** return Approved Greenridge (`000244`) before claiming it, revise as Preparer and inspect prior history. Use a separate reset to cancel it before any effect. Use **Demo scenarios → Changed source revision** before and after a possible effect; retained evidence and guarded recovery should remain visible.
5. **Partial allocation:** inspect Greenridge (`000250` and `000251`) and the source allocation ledger: 180 MIN split 120/60 and 2.5 M split 1.75/0.75. The first handoff bills 90 MIN and 1.25 M; the balance is explicitly non-billable. Source totals are counted once.
6. **Accounts:** use **Open customer account** from each handoff. Inspect Northbank applications/deposit, Greenridge partial data and Fernhaven failed data/reversal. Record complete, partial and failed fixture observations; distinguish current totals from last successful history and follow application links.
7. **Assistant recovery:** request a reply, stop and retry; simulate a failed reply; retain a draft while switching records; change a source before using a draft. Inspect exact sources and use an editable note through the ordinary confirmed form. No AI action should bypass Finance permissions or post anything.
8. **Presentation acceptance:** check desktop and narrow mobile widths; native select fallback/enhanced menus; keyboard tabs, Escape and focus return; inspection versus form panels; dirty-form dismissal; empty/failed/denied states; long history, assistant overflow and printed pages.

## Verification and limits

`node scripts/check-finance-design-r02.mjs` passes **48 isolated design checks** covering the workflows above, exact quantities, role/state guards, allocation conservation, metadata/unmatched-line blockers, account read history, stale confirmation, escaped input and assistant stop/retry/context/draft protections. The full shipped script parses and its generated templates execute with inert DOM/form stubs. These checks do not render a browser or exercise the application server.

The preserved r01 suite, `node scripts/check-finance-design.mjs`, still passes its **18 checks**. Static inspection confirms four labelled tabs, 22 unique static IDs, embedded resources, the 39 exact r18 tokens and three matching font faces, with responsive and print rules present. `python3 scripts/check_foundation.py`, `python3 scripts/check_prototype.py`, `python3 scripts/check_naming.py` and `git diff --check` all passed. Foundation verification preserves all 15 issued source hashes and 78 parent requirements. Application CI is a separate repository gate, not visual acceptance of this HTML.

**Visual browser validation remains pending.** During the prior design review, a local browser download timed out and the available cloud browser rejected the local HTML URL under its security policy. No alternate route was used for r02. Desktop/mobile appearance, actual keyboard focus, native modal/select behaviour, assistive technology, browser console and printed-page layout have therefore not been verified in a browser.

R02 is a proposal for review. The accepted [UI baseline register](../standards/ui-baselines.json) remains unchanged until visual acceptance. The ordinary document register, documentation index and Finance design status identify r02 as the latest proposal and retain r01. Application integration is a subsequent increment against the maintained Finance contract, existing roles, source revisions, allocation/recovery services and document controls.
