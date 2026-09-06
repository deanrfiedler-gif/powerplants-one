# CRM discovery, Pipedrive parity and BP-03 — Handover

**Revision:** r01 · **Date:** 6 September 2026 · **Owner:** Dean Fiedler, personal private prototype · **Workstream:** PPO-009 / [issue #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9), distinct from PP-01 P09.

**Publication authority:** [external issue publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/9#issuecomment-5557062585). That record carries the actual PR, final head/tree, normal merge/main identities, workflow runs and review/rule limits. This file does not claim its own future commit SHA. The discovery contribution can be published while issue #9 remains open for missing account evidence and owner acceptance.

## Delivered package

| Artefact | Reviewable outcome |
|---|---|
| [BP-03 r01](../blueprints/BP-03-crm.md) | Seven journeys; actors/inputs/transitions/permissions/exceptions/audit; proposed records/commands/reads; capability matrix; communication, single-writer coexistence and migration/rollback design; eight-parent traceability |
| [PAR-01–PAR-18 assessment](../blueprints/crm-parity.md) | Required outcomes, dates/scope/confidence, actual-use limits, users/criticality, fields/history, proposed disposition/dependencies/acceptance and ten small evidence requests |
| [Screen specification](../blueprints/crm-screen-specification.md) and [standalone wireframes](../blueprints/crm-wireframes.html) and [18 original captures](../blueprints/crm-visuals/README.md) | Seven synthetic desktop/phone screens, board/list alternative and seven illustrative states; no app integration or persistence |
| [Ordered sequence and acceptance](crm-implementation-plan.md) | Six BP-03-local increments, concrete first vertical slice, explicit exclusions/dependencies/migration implications and sixteen planned acceptance cases |
| [Detailed first implementation starter](crm-first-increment-starter.md) | Copy-ready I1 instruction with live baseline, isolated work, synthetic persistence/permission tests, compatibility, checked merge and explicit stop boundary |

The maintained blueprint index, STATUS, discovery backlog/JSON, decision/document registers, requirement links and prototype traceability are aligned proportionately. Existing parent identities, PP-01 scope classifications and AT/PT test statuses are unchanged. Issued references, application/database/service-worker/fixture/dependency files and existing workflows are unchanged by this CRM contribution. An isolated CRM design-assurance workflow uses existing pinned dependencies to render/check the standalone document and retain its synthetic captures; it does not run a CRM application or access operational sources.

## Starting verification and observations

GitHub connection succeeded as `deanrfiedler-gif` (231005545); repository metadata reported private visibility and pull/push/maintain/admin permissions. Starting main was `85bd2fcc388495cc24dc2ee4f273accc49da2f24`, tree `7406ceb9b000e616410489bb66503a6e9e8c6c08`. P08 #34/#35 and its [publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/34#issuecomment-5556131594) were inspected. Issue #9 was open with four unchecked acceptance criteria, dependency PPO-001 and no comments; no CRM branch/PR existed in the inspected branch/PR collections. A separate local clone and `docs/ppo-009-crm-discovery` branch preserve P09's checkout.

P09 was active separately in issue #36 / draft PR #37, starting head `54abe1f4c30272095088d9f5e6a1b13e2547d708`, then `08cfbcd37c072b56ff04c0a5e8baa2ba4bb3d3d0` and `da9790bf3dc1c2bd6be458976837dce8742ed715` during design. Main remained the P08 checkpoint at that reread. These observations are dated discovery evidence, not a fixed future baseline. The publication record captures final pre-merge observations.

Pipedrive MCP BETA stage read succeeded with `limit=30`: ten nondeleted stages across pipeline IDs 1 and 6, no next cursor in the returned scope, matching BP-01's earlier configuration. Stage names, ordering, probabilities, ageing and update timestamps are recorded without customer content. Only this endpoint's working access was tested. No account/current-user/licence/permission-metadata endpoint is exposed; account identity and complete visibility remain unverified. Identifiable operational-record reads were not performed pending account context. Earlier 60-open-deal evidence is explicitly inherited, not re-executed or extrapolated to total pipeline size.

Official Pipedrive documentation was checked for stage/deal/lead/custom-field, permission, email/calendar and export semantics; source links and limits are in the parity assessment. Documentation does not prove entitlement or usage. No raw operational export, customer communication, credentials or identifiable customer records are in the package.

## Design choices and shared dependencies

I1 proposes **owned opportunity and qualification follow-up** using existing shared organisation/person/site context, current Activity categories and one fictional Enquiry → Qualified pipeline with Open sales outcome. No value/probability/forecast, separate lead, full board, close/transfer, mail/calendar, offline, source import or downstream effect is required for that slice. It is ready for a subsequent authorised synthetic implementation after live contract reconciliation.

The [integration note](../blueprints/BP-03-crm.md#4-shared-platform-integration-note) distinguishes implemented P02–P08 physical contracts from proposed CRM extensions. Opportunity links/types do not exist yet. Current activities require every target's permission; company visibility/person-context boundaries remain. A group hierarchy or owner does not grant access. Typed Opportunity ActivityLink/identity/receipt/capability extensions need future forward migration; no number is preallocated. P09 reserves ADR-0014/0009 at discovery start, so CRM allocates no ADR, migration or service API ID in this design session.

P09 retains submission/review/report/response ownership; P10 retains Finance. Shared documentation overlap is limited to indexes/status/registers/traceability and a short plan note. No P09 runtime, report contract, migration or fixture is edited. Future implementation must re-read then-current full unions/dispatch and accepted report permissions rather than copying the P08 baseline over newer work.

## Validation and review evidence

Local documentation validation and initial PR wireframe evidence are recorded below; actual PR and merged-main CI outcomes are recorded externally. Documentation checks never establish runtime or business acceptance.

| Validation | Actual result |
|---|---|
| Foundation, prototype and naming checks | All three passed locally. Initial foundation failure identified attempted changes to baseline-derived requirement fields; those fields were restored exactly and new links kept in maintained prototype traceability. |
| CRM coverage/consistency self-review | All 8 CRM parents / 18 PAR items / 7 journeys / 7 screens / 16 proposed CA cases mapped. Mechanical comparison preserved all 78 identities/titles/scope/implementation/test statuses; baseline requirements, AT CSV and PT JSON bytes unchanged |
| Standalone wireframe browser/visual QA | [Run 34014261906](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34014261906), attempt 1 passed: 147 screen/state/viewport views and behaviour/reflow checks, 18 original captures with verified hashes. Nine originals covering all seven screens and denied/conflict visually inspected; [gallery/provenance](../blueprints/crm-visuals/README.md). No CRM application or physical-device test claimed |
| Existing application assurance | Required by current PR/main workflow; actual final-head and merged-main run results are recorded in the external publication record. These validate the existing synthetic platform, not new CRM runtime |
| Independent review / owner acceptance | Not performed; sole-developer documentation self-review only, subject to actual PR requirements |

Local Chromium was absent; installation via the available runtime failed (timeouts/invalid download). Visual browser verification therefore used an isolated disposable CI job with the repository's existing pinned Playwright/Chromium and runtime; no dependency pin or application workflow changes.

Local application engine availability at discovery was Node 24.19.0 / npm 11.9.0, while repository pins are Node 24.20.0 / npm 11.19.0. No engine pin/gate is weakened. Runtime baseline regression is checked by the existing disposable CI on the actual PR/main, not claimed from local Python checks or wireframe rendering. No new application tests are written for a documentation-only contribution.

Main reported `protected=false`. Detailed branch-protection read returned 403 Resource not accessible by integration; rulesets read returned 403 with a private-plan limitation; effective branch-rules URL was refused by the connector. These are inaccessible reads, not a claim that all rules were inspected. No control, account plan, visibility, membership or permission was changed. Normal expected-head merge must satisfy the actual current checks/reviews; self-review is not independent approval.

## Remaining evidence and acceptance

The [ten targeted requests](../blueprints/crm-parity.md#4-smallest-useful-evidence-requests) remain owned through Dean and proposed functional reviewers. Consequential gaps are account identity/visibility before identifiable source reads; actual pipeline/separate-lead/custom-field and permission configuration before account-specific mapping; used communication/automation/add-on/history/mobile evidence before full parity and transition. Minimal redacted settings/walkthroughs can resolve these progressively. No exhaustive export is required to begin synthetic I1.

D-013/D-025/D-026 and other operational decisions remain open. All parity dispositions are proposed, none retired. Issue #9 remains open because actual account-wide evidence and acceptance are materially incomplete. Full AT-25 includes approved outcomes, preserved history/permissions through migration and controlled automation/mobile behaviour; it stays Planned, and every CA case stays Not run until implementation/rehearsal. Existing AT/PT statuses are preserved.

## Next step and stop boundary

Use [the first CRM implementation starter](crm-first-increment-starter.md) in a new session to authorise I1. Recheck main, P09 activity and current contracts before implementation. This session stops at discovery/design publication and implementation preparation. No CRM runtime/database implementation, Finance work, Pipedrive mutation/import/cutover, customer message, sync/automation activation or hosting is included.
