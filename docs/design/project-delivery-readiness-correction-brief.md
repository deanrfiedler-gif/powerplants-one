---
document_id: PPO-PJ07-CORRECTION-BRIEF
date: 2026-10-26
owner: Dean Fiedler
status: Proposed Figma correction brief; no canvas changes or visual acceptance
source_commit: 55722e8226b62c2a0e2e3bfe67b38b104bb09590
versioning: git
---

# Delivery readiness design correction brief

This brief receives the [proposed native contract](../contracts/project-delivery-readiness.md) under Dean's instruction to proceed with the next bounded specification task. It describes concrete changes for review, not completed Figma edits. The [direct inspection record](../decisions/r10-workflow-reconciliation.md#direct-figma-observations) supplies bounded evidence from the 26 October review; no fresh screenshots or Present-mode run are claimed here. Keep the private file link and licensed-icon screenshots outside this public repository.

## Target and preserved context

Proposal page `2720:87`, notes `2736:2384`. Keep the accepted Project record, its source dates/baseline and native authority boundaries. Readiness is a deliberate later tab, not a replacement for Overview, Schedule or PJ-09 acceptance. Reuse the shared header, tabs, fields, choice options, group bands and list rows. Shared component changes require a separate consumer review; changing this proposal must not incidentally alter accepted pages.

| Target | Required correction | Review evidence |
|---|---|---|
| Worklist `2720:9833` | Use the reserved Delivery readiness rail destination and an explicit nominated delivery scope per Project. Add “Delivery step not selected”, multiple-scope and restricted/partial-source states. Show assessed scope apart from view filters. | List → Project scope → source → return retains identity/filter; no accidental match of `readiness` as a Project UUID. |
| Readiness tab `2720:10714` | Name the task/area/activity/required date and source time. Show native state, source/criterion revision, read time, evidence time, coverage and owner. Distinguish unknown applicability, restricted, stale and expired rows. | Filtering/collapsing does not change assessment; zero visible blockers is not Ready. Show exceptions only with their native scope. |
| Assign blocker `2725:1994` | Rename to “Assign follow-up”. The source state is read-only; editable fields are eligible owner, due date, required action/evidence and reason. Show linked Activity and retained prior follow-ups only under the contract's source-enforcing Activity target. If that adapter is unavailable, show an unavailable action and permitted source continuation; no Project-only Activity fallback. | Completing Activity leaves an unresolved source blocker visible to entitled users. Invalid/revoked owner, revoked source access and lost-response states are drawn; denied lists/counts/history expose no follow-up metadata. |
| Impact review `2725:2133` | Show a complete manifest: current/proposed/retained effect, source/version, native owner, receiving instruction, dependencies, evidence gap and exact date units. Separate investigation requests from reviewed movement instructions. | Unknown viability can request clarification; it cannot masquerade as a fully reviewed executable movement instruction. |
| 320px impact `2730:3046` | Replace plain text `2730:3096` (“3 more rows…”) with all remaining cards or an explicit complete-review interaction. Site calendar, job pack and commercial effects must be reachable before confirmation. | Every authorised impact reviewed at 320px and 390px; no action after merely reading four of seven effects. |
| Date text `2730:3092` and all corresponding copies | Change “Wed 2 Dec · +9 days on baseline” to “Wed 2 Dec · +13 calendar days against baseline”, or use a separately labelled native working-day calculation naming its calendar revision. | Compare with Thu 19 Nov baseline; preserve Saturday working exceptions. Date labels agree with desktop key dates and native comparison. |
| Request action, including `2730:3098` | Open a final review of exact instructions and named owners. Label confirmation by actual effect, for example “Create 4 coordination requests”. State that source owners decide their own changes. | Success shows Requested with per-owner status, not “Delivery moved”. Unknown result offers original recovery without a new request. |
| Service item / subsequent state | Show “Awaiting Service review”, then the request bound by the proposed Scheduling receiving adapter and its source-owned outcome. Unsupported/unbound outcomes stay Reported only. Show the original pending request during reassignment/correction and the required adoption, cancellation or reconciliation. | A coordinator without scheduling authority cannot move it. Native acceptance may already have moved it: no duplicate apply, replacement while the original is unresolved, or invented appointment for unbooked work. |
| Notes Q1/Q2/Q3/Q4/Q5/Q6 | Point to the proposed contract: Project-owned subordinate UUID identity; named source owners; source/time invalidation; independent target effects; commercial applicability beyond new cost; new-baseline provenance. | Do not label CHG registered, r02 recovered, any endpoint built, or this design accepted. |

## Missing frames and states to draw

Use one connected synthetic story, with exact identities across all views. The existing Block C story can continue, but new outcome/request IDs must be clearly synthetic and scoped; do not imply they exist in the application.

1. Scope definition and applicability: select exact tasks/areas, show unassigned source relationships, reasoned source-owned NotApplicable and an unknown attendance interval. Undetermined applicability produces Evidence needed unless a higher-priority condition applies; No review recorded is separate history. Forecast Demand remains Not assessed. A selected filter is never the assessed scope.
2. Whole-scope mixed evidence: one native stop, one restricted source, one expired item and one unassessed Forecast demand; full versus partial counts and safe source links. Include all-NotApplicable and no nominated scope without a green Ready result.
3. Follow-up assignment at 1024, 390 and 320px, including completed follow-up with source still blocked, invalid owner, original-save recovery, unsupported source protection and access revocation across My Work/detail/history/counts.
4. Full seven-effect impact review at 1440/1024/390/320; source comparison on return, changed/expired source refusal and cancelled draft with safe restoration.
5. Final request confirmation, atomic save failure, saved-but-response-lost recovery, and a repeated exact confirmation recovering the original batch.
6. Per-owner receiving: Received, Held and Returned; corrected submission under the same identity; changed recipient with new explicit review. Show unchanged-intent adoption of the same pending request, changed-effect cancellation before replacement, acceptance winning the cancellation race and an unknown original holding replacement.
7. Partial native outcomes: Service booking moved, Project forecast pending, pack returned, shutdown evidence unknown. Show actual source facts and outstanding actions; do not roll back completed work or display success for the batch.
8. Outcome evidence and closing: verified source-bound versus reported-only result, source-adapter unavailable, inaccessible receipt, exact operation/request recovery, stale comparison after one sibling's legitimate update, and closure retaining unresolved native references. Closing is not a Ready transition.

## Prototype and visual verification

Play both named flows in Figma Present mode after the corrections. Check every relevant branch, not just start-point existence:

- Worklist → explicit delivery scope → source detail → return with preserved context.
- Assign follow-up → source unchanged → inspect Activity → source evidence corrected → refreshed assessment.
- Impact review → every effect → final instruction confirmation → per-owner receiving → partial outcome → reconciliation.
- Back/cancel/close, returned correction, stale basis, read-only/restricted and uncertain-original paths.

At 1440 and 1024, verify rail selection, source disclosure, long identifiers, fixed versus content scroll, open panel width and action visibility. At 390 and 320, inspect every impact card, all tabs and disclosure controls, long owners/reasons, 16px input text, target spacing, bottom safe-area and keyboard-aware scrolling. A full-height screenshot is not evidence that a shorter viewport can reach the action. Test actual scrolling/overlays in Present; verify keyboard/focus/200% zoom and screen readers separately in the implemented app.

Capture the exact corrected frame IDs, story, source/date basis, unresolved exceptions and walkthrough results. Only after Dean's baseline decision should the owner save the named version and retain icon-free captures/hashes under ADR-0053. Neither this brief nor a passed prototype walkthrough grants source-policy approval, production readiness or merge authority.
