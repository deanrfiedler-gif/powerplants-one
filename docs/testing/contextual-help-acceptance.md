---
document_id: PPO-HELP-TEST
title: Contextual Help Acceptance and Onboarding Pilot
revision: r01
date: 2026-09-13
status: Planned application acceptance; design-preview checks recorded separately
owner: Dean Fiedler - personal prototype owner
source_commit: 1cc882e53020bdfb22f7e9192365d90b1d8282ab
---

# Contextual Help Acceptance and Onboarding Pilot

[Design](../blueprints/contextual-help-design.md) · [CRM pilot guide](../guides/crm-deals.md) · [Decision and actual verification](../decisions/contextual-help.md).

These are future application acceptance procedures, not newly passing tests. The standalone HTML demonstrates part of the design; its checks cannot prove PPO permissions, saved-record integrity, release binding, SOP access or onboarding benefits. All HELP and T cases are **Not run against the application** in this package.

## 1. Preconditions and evidence

For implementation verification, record exact app commit/build, deployed environment, migration/fixture epoch, guide key/revision, workflow capability basis, browser/device/viewport, actor/permissions and date. Use synthetic records and disposable test identities. Include an editable owner, permitted reader and denied/cross-company identity. Seed both an eligible identification action and an ineligible one, unknown value/contact, completed next action and competing edit.

Reconcile the stage-model dependency before testing. At the design baseline, the guide teaches Enquiry/Qualified; open five-stage work may change the application before this pilot runs. Never test a mixed bundle and call an obsolete article acceptable because the panel opens.

## 2. Application acceptance matrix

| ID | Procedure | Observable pass condition |
|---|---|---|
| HELP-01 | Open help from Board, List, full deal and new-opportunity form; invoke from a stage editor. | Correct guide/section every time; only one top-level help entry; active form values and context retained. |
| HELP-02 | Open side panel at 1440 px; change sections, search, get zero results; return to page and reopen. | Stable 600 px outer width; no business-page reflow or horizontal page overflow; restore same-page position; visible page usable. |
| HELP-03 | Expand and collapse; resize to 1024 px and 390 px while reading; close and reopen. | Query/section/reading position preserved; modal background inert; correct non-modal behaviour restored; close remains reachable. |
| HELP-04 | Keyboard-only opening, contents, search, Clear, Expand, Close and Escape; test help above a business dialog. | Logical focus order; modal focus contained; non-modal panel has no trap; only top layer closes; focus returns without discarded data. |
| HELP-05 | Screen-reader landmarks/headings/search counts; text zoom to 200%; reflow to 320 CSS px. | Names/roles/status understandable, no clipped text or keyboard-inaccessible content, no two-dimensional article scrolling; table alternatives usable. |
| HELP-06 | Open restricted content, then lock/sign out/change identity in another tab. | Restricted article, index, query and feedback context cleared; no cross-identity flash or old result count. |
| HELP-07 | Follow a permitted SOP; test denied resource metadata, draft, approved, review-due, superseded, withdrawn and expired URL fixtures. | State matches verified source; no hidden title/count leakage or access expansion; external links preserve work and expose no access tokens. |
| HELP-08 | Simulate guide load failure, missing route, removed anchor, no search matches, provider outage and unavailable feedback. | Honest usable fallback/retry; no fabricated help/SOP/feedback success; normal app remains usable. |
| HELP-09 | Execute CRM T1–T6 below with the matching guide. | Exact labels and outcomes correspond; all required/conditional information explained; no proposed feature taught as current. |
| HELP-10 | Open help during validation error, save-in-flight, version conflict and uncertain save; close it and recover through the existing command flow. | Same business operation/draft retained; help neither retries nor cancels; no duplicate record/event or false save confirmation. |
| HELP-11 | Serve old and new application builds with their guide bundles; intentionally misbind a guide or omit a newly added route. | Matching bundle selected; mismatch uses explicit fallback; coverage check detects missing route registration. |
| HELP-12 | Read long article, long translated-style labels and long resource title on desktop/phone. | Readable density and stable dimensions; one main article scroll; no controls obscured by sticky bars or safe-area/keyboard. |
| HELP-13 | Follow another guide and return; take an external SOP link; navigate away from an unsaved form. | Help trail works; external tab behaviour is labelled; existing unsaved-navigation protection remains authoritative. |
| HELP-14 | Update a field/permission/stage definition in a candidate change. | Impact review identifies guide sections, revision and scenarios; content owner and release evidence recorded together. |

Automated checks may cover route bindings, safe content, missing links, IDs, permitted payloads and core interaction invariants. Use actual reading/task review for clarity and completeness; do not replace it with counts of headings or screenshots. Capture failed cases and residual limitations as well as passes.

## 3. CRM user tasks

Use equivalent scenarios A and B with different fictional names, amounts and due times. Keep task difficulty and permission rules comparable. Do not hand users the steps that the guide is intended to teach.

| ID | Task prompt | Correct outcome to observe |
|---|---|---|
| T1 | Find an assigned opportunity and compare its Board and List records. | Correct record, same filtered population, distinguish deal owner from Activity owner. |
| T2 | Create an opportunity for an existing permitted organisation with unknown contact/value and an initial action. | No duplicate customer/deal, truthful unknowns, required owner/action/source/context saved, value not replaced by zero. |
| T3 | Complete a follow-up and make the next action clear. | Actual Activity outcome recorded; correct new/existing next action selected with owner and due state; no automatic qualification assumed. |
| T4 | Progress a supported opportunity while contact is unknown. | Required qualification evidence and eligible owner-held identification action; confirmed current stage, unchanged sales outcome. Adapt to the actual accepted stage model before execution. |
| T5 | Interpret a partial page of amounts with unknown values. | State AUD/ex-GST, known-only returned-page basis, unknowns and remaining pages; no revenue/forecast claim. |
| T6 | Revise a brief after a concurrent change or uncertain save. | Compare/reconcile existing operation, no duplicate effect, preserve legitimate changes; downstream estimate review remains explicit. |

Reader/denied variants of T2/T4 must confirm appropriate inability to act, rather than encourage users to find a bypass. Tasks are complete only when the resulting saved records and outstanding responsibilities are inspected.

## 4. Onboarding benefit measurement

**Proposed cohort:** a small formative pilot of 4–6 representative internal reviewers, including newer and experienced users where available. This is a suggested usability sample, not a statistical power claim or a staffing commitment. Confirm participants and business reviewers before inviting anyone; this package sends no invitations.

Start with a common short orientation on synthetic data and task boundaries. Use the same application build for both conditions. Compare the existing general Quick Help condition with contextual Page guide enabled. Permit guide use in the contextual condition without counting it as human assistance.

Counterbalance A/B scenarios and condition order to reduce practice effects. Record experience and order. If access to matched participants is impractical, run baseline then guided tasks and disclose the learning effect; do not present a small before/after sample as causal proof.

| Measure | Definition/denominator | Interpretation |
|---|---|---|
| Independent task completion | Correctly completed tasks without facilitator hints ÷ eligible attempted tasks. Guide use is allowed. | A read-only refusal task counts as correct only when the user recognises the limit. Exclude setup failures from the denominator and report them separately. |
| Repeated support questions | Questions matching a pre-agreed topic asked after that topic was previously explained, divided by eligible attempted tasks; report raw counts and participants. | Separate first questions, repeats, validation errors and missing-feature questions. Repeated topics identify guide or UI defects. |
| Avoidable information omissions | Missing/misclassified required or scenario-relevant facts at the first completion attempt ÷ applicable information opportunities. | Predefine an answer rubric; truthful unknowns with permitted owned follow-up are not omissions. Record server-blocked and reviewer-detected omissions separately. |
| Time to correct completion | Active elapsed time from task start to inspected correct result; report median/range for completed tasks and incompletes separately. | Pause/log environment outages; never count abandoned attempts as fast success. |
| Maintenance effort | Author/reviewer minutes to correct or update the guide for one bounded workflow change. | Benefit must be assessed with the ongoing cost of keeping help accurate. |

Use a private observation record containing: anonymous participant code, experience band, scenario/condition/order, app build, guide revision, task ID, permission role, start/end/pause time, attempted/completed/assistance state, first/repeated question category, omission numerator/denominator, error category and a short synthetic-only note. No names, customer records, raw searches or screen recordings in public GitHub. Business telemetry and retention require a later design; this pilot can use manual observation.

Before running, agree a practical completion target and acceptable error level with the owner; record them before results are available. There is no invented percentage-savings target. Blocking defects include incorrect authority, lost work, inaccessible core help controls, stale workflow instructions and misleading saved/accepted outcomes. Resolve these before an operational rollout regardless of average time saved.

## 5. Review decision

At pilot review, compare raw denominators, results and recurring themes by condition and user experience. Record one of: ready for a wider synthetic pilot, revise guide/UI then repeat affected tasks, or pause a specific unsafe/inaccurate pathway. Keep evidence and limitations attached.

A rise in help opens may mean users can finally find help; a fall may mean the control is hidden. Neither alone proves benefit. Distinguish a confusing interface from missing instructions and fix the UI where that is the cause.

No onboarding tasks or staff study have been run by this design package. The [handover](../decisions/contextual-help.md) records only the actual source review, documentation checks and standalone preview verification.
