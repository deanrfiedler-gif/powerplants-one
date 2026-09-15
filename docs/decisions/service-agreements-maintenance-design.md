---
document_id: PPO-MA-WORKSPACE-DES
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Requested HTML design; native visual review and application integration tracked separately
source_commit: 07ade644de06ff3b13e5af6ae9c299ca7c78c535
---

# Service Agreements & Maintenance — design and receiving handover

Dean authorised the module-only **Service Agreements & Maintenance** workspace for MA-01–MA-04 with integrated MA-05 renewal follow-up. The central question is: **What have we committed to maintain, what is due, and who needs to act?**

Open [PPO-Service-Agreements-and-Maintenance-Workspace-r01.html](../reference/ui/maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html) in a current browser. All fonts, icons, fictional records and interactions are embedded. The r20 navy/green tokens, Roboto 400/500/700, controls, surfaces, radii and square contiguous Snapshot are reused. No global navigation rail or app masthead is included; Shell r14 remains the external container.

This is an interactive design reference. Current manual agreement references and coverage review do not constitute a managed agreement/recurrence application. The HTML does not change application routes, migrations, dependency pins, business records or deployment.

## Sources and scope authority

- Main `07ade644de06ff3b13e5af6ae9c299ca7c78c535`, tree `7a070efb308b551d36bd16132adad018652e9029`: AGENTS, README, STATUS, [BP-01 §13.8–13.9](../blueprints/BP-01-master-blueprint.md#138-maintenance-and-response-commitments), [BP-07](../blueprints/BP-07-service-operations.md), [work coverage validation](../../src/service/work-scope-validation.ts), [P09](../delivery/p09-handover.md) and [P10](../delivery/p10-handover.md).
- [PPO-015 / issue #15](https://github.com/deanrfiedler-gif/powerplants-one/issues/15) remains open. This design contributes to SVC-12.1, SVC-12.2 and SVC-12.4, with CRM-07/FIN-03 receiving dependencies; D-018/D-028 and complete AT-19/AT-33 are not closed.
- [Coverage audit r04](https://github.com/deanrfiedler-gif/powerplants-one/blob/45084d9b9bacf92373176b68995da7665f4acee4/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md) and [Agreement/Maintenance workflow map](https://github.com/deanrfiedler-gif/powerplants-one/blob/45084d9b9bacf92373176b68995da7665f4acee4/docs/reference/ui/module-workflow-maps/PPO-Service-Agreements-Recurring-Maintenance-and-Renewals-Workflow-Map-r01.html) are supplied design sources in PR #200. Their planning briefs are not application acceptance.
- Theme r20 SHA-256: `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Work Orders r01 SHA-256: `cd36f26448a299d622b51d64c03beced91b8b5f68f098a17213fb35517506336`. Service Review [draft PR #203](https://github.com/deanrfiedler-gif/powerplants-one/pull/203) informs the receiving presentation; its unpublished application behaviour or visual acceptance is not assumed.

The Willowbank customer/site/pump context reuses the supplied location lineage, including site `33000000-0000-4000-8000-000000000301` and pump `33000000-0000-4000-8000-000000000501`. New `SYN-PPO-AGR-080101`–`080105` records and MA-prefixed receiving references are fictional and isolated from Work Orders/Service Review fixture state. Physical pump location, served areas and included/excluded growing-area work remain distinct. Other seeded agreement examples do not assert real customer contracts.

## Six connected views

| View / brief | Working demonstration |
|---|---|
| Agreement register — MA-01 | Five fictional agreements; complete/partial source labels; clickable Snapshot filters; search and ordering; selected agreement shared across views. |
| Coverage & terms — MA-01/MA-02 | Exact source revision, covered equipment/areas, exclusions, independent dates, source availability and immutable assessment history. Covered remains separate from billing and work authority. |
| Maintenance plans — MA-03 | Three sourced routine tasks; original monthly anchor/timezone; two explicitly fictional source templates; successor task/calendar choice, owner/effective date and required review. Earlier plans remain inspectable. |
| Due maintenance — MA-04 | Selected/all-permitted scope, open/status filters, bounded generation preview, duplicate-safe occurrence retention, owned exact work-request preparation and a partial receiving-result example. |
| Exceptions & history — MA-04 | Reasoned deferral/skip/cancel with ownership; original due identity, prior scope, requests and results retained; coverage and source/plan histories. |
| Renewals & follow-up — MA-05 | Expiry-window worklist, owned customer-review brief, separate Commercial proposal revisions and CRM receiving context. No accepted renewal or CRM Activity is created. |

Register search/filter/order, selected agreement/occurrence and view are represented in the URL; browser Back/reload restores those values. Due-filter and plan-history selections are local view controls. Accepted record changes persist in the browser. There is no cross-device/offline synchronisation.

## Guided Willowbank demonstration

1. Open **Irrigation care · Willowbank** and review Covered routine task scope against the fictional r02 agreement; retain Finance review and the repair/pipework exclusions.
2. Inspect the reviewed plan and its explicit fictional one-month rule. No service interval or acceptance limit is inferred for real equipment.
3. Defer the original 15 September obligation to 18 September using Casey's fictional crop-window evidence. The stable original identity and 15 September due date stay unchanged.
4. Prepare the exact three-task request owned by Robin Ellis. The request is locally prepared; work scope authorisation, customer agreement, crew booking and dispatch still require their existing controls.
5. Inspect the synthetic later-step Service Review result. Filter cleaning and seal observation are complete; pressure verification lacks eligible instrument evidence. Retain Partial, customer Reservations, no billing approval, an owner and the 22 September follow-up due date.
6. Prepare remaining work if desired. Only the outstanding task enters the next request, still against the same original maintenance occurrence and with the follow-up date.
7. Prepare a renewal review. Switch to the Commercial preview role to retain proposed successor terms. Current expiry and agreement source remain unchanged.

The receiving result is an embedded fictional evidence example, not a simulated call to live Service APIs. It is limited to the first original occurrence and cannot be reused to manufacture completion of other obligations. Earlier maintenance and Service Review records are not overwritten.

## Identity, dates and changes

Calendar generation uses a supplied fictional monthly or quarterly source template, an unchanged anchor and `Australia/Brisbane`. Month-end clamping preserves the original anchor for the following month. The preview window is bounded to 12 months and 100 occurrences per agreement. Meter, telemetry, inspection-triggered rules, seasonal optimisation and arbitrary rule authoring remain future design work.

The local logical key is plan identity plus original calendar due date. Generated occurrences retain their exact plan revision/tasks even after a successor is reviewed. Re-running a window retains existing identities and creates only missing dates. A successor applies only to future ungenerated dates from its effective date; it does not migrate, cancel or rescope existing obligations. This illustrates the contract; a production key/version reconciliation algorithm still requires D-018 and server implementation.

Deferral records a separate target date, reason, source and owner. Skip/cancel preserves the record and is refused once a request or reviewed result exists; that work needs an explicit receiving disposition. Changed targets or coverage after request preparation prevent a mismatched receiving result. Source revision changes retain the originals and invalidate current applicability. Reconciliation/migration of an existing occurrence against new agreement terms is a later receiving refinement; no automatic rebasing is offered.

Agreement, installation, commissioning and warranty dates are displayed independently. Missing warranty dates stay unknown. Unknown/Disputed coverage requires FinanceReview; ContractReference needs the exact source. Missing source, draft/expired agreement, unreviewed plan and mismatched revisions block ordinary maintenance requests. The broader P04 bounded identification route for uncertain coverage is not implemented by this maintenance request preview.

## Recovery and access demonstration

Service owner, coordinator, Commercial, read-only staff and denied previews expose different actions. Model guards recheck role and version for every command. This is client-side design behaviour, not server authentication/authorisation. Live receiving work must apply current grants to every source and target.

Failed local saves preserve form values and original records. Lost confirmation stores the original command with its committed receipt, then recovers that exact result without a second effect. Recovery requires the original role; changed-content reuse and stale forms are refused. Another tab's storage change blocks a stale save. Local backup/export and explicit reset are provided. Unsupported saved records are retained for recovery rather than overwritten.

No email or customer message is sent. No accepted agreement, work order, booking, dispatch, CRM Activity, invoice or ERP transaction is created. MYOB remains Finance's intended transaction authority. Managed renewal acceptance/activation, agreement CRUD, full warranty cases (MA-06), supplier recovery (MA-07), asset replacement/decommission effects and complete AT-19/AT-33 remain separate.

## Verification and publication

The deterministic build, pure model suite, non-rendered DOM journey and native browser suite have distinct evidence meanings. See the [verification record](../testing/evidence/maintenance-r01/README.md) for actual results and limits. The dedicated design workflow uses the repository's existing Node/npm/Playwright/browser pins, contents-read permission and original screenshots. No branch-protection context or existing assurance workflow is weakened.

This contribution is a standalone draft for review. Native browser/visual evidence, owner acceptance and application integration must each be stated from actual results. The PR is the authoritative publication/check record. Once the design is accepted, the next implementation step is to settle the occurrence/plan contracts and exact receiving links under PPO-015.
