---
document_id: PPO-QUALITY-REG
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Adopted requirements; delivery and acceptance incomplete
source_commit: 10625815187f26179f316b887fcdee33467ac81f
---

# Product quality and gap register

Tracker: [#181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181). Authority: [Dean's adoption decision](../decisions/product-quality-adoption.md). Delivery: [ordered implementation packages](../delivery/product-quality-plan.md). This register covers all eight requested refinements, five quality standards and the eight existing capabilities mentioned in the recommendation. It elaborates the [78 original parents](requirements.csv) without altering their issued wording or claiming parent completion.

**Status rule:** all rows are adopted scope. “New extension”, “partial runtime”, “existing design” and “implemented foundation” describe inspected delivery evidence at `10625815`, not business acceptance. Every new acceptance criterion below is **not yet executed**. For existing work, preserve its actual handover evidence. No row is complete merely because this register exists.

F, C and Q identifiers are local derived requirement IDs in this document. Sequence stages refer to the delivery plan; quality applies to every stage. Role names describe responsibilities, not assigned employees. Dean owns prototype prioritisation; operational role assignments remain to be confirmed.

## Feature refinements

### F01 — QR-linked equipment and precise location

**Parents:** CRM-01/06, SVC-06, SVC-12, DOC-01/06, NFR-01. **Lead role:** Service/data steward. **Stage:** 2. **Baseline:** equipment and site records exist; QR resolution is a new extension. Extend the current [shared data contract](../contracts/service-data-dictionary.md) and lifecycle #15.

Scan a label to open the existing equipment identity, current site/area, serial evidence, permitted documents, service history and unresolved work. An opaque application link confers no access. Keep equipment identity stable when it moves; historical visits retain the location/configuration used at the time.

**Acceptance F01-A:** a known label resolves the correct synthetic equipment; unknown, retired, malformed and unavailable targets have distinct recovery. Camera denial offers manual reference search. A copied link and an identity change cannot expose another actor's equipment, documents or hidden work. Location correction preserves earlier history. Opening/scanning performs no business mutation. Offline availability is limited to explicitly authorised cached scope, with freshness visible.

**Benefit measure:** matched tasks record time and wrong-record selections from label to correct equipment; compare with the current manual lookup. Exact identity and zero unauthorised disclosure are mandatory; timing improvement is measured, not assumed.

### F02 — Structured commissioning and inspections

**Parents:** ENG-07, PRJ-06/08, SVC-10, DOC-02/03, NFR-07/09. **Lead:** Engineering/Service reviewer. **Stage:** 2. **Baseline:** capture and report foundations exist; structured template detail is an extension. Coordinate #11/#12/#15 and existing Service output contracts.

Version each procedure and required/conditional field, reading unit, approved limit source, photograph requirement and test-instrument/calibration reference. Separate measured values, calculated assessment, reviewer decisions, defects and retests. Required units and approved limits cannot be guessed; missing limits show assessment unavailable. Historical submissions retain their exact template, source and results.

**Acceptance F02-A:** a fictional commissioning run includes a valid reading, failed reading, missing prerequisite and overdue instrument evidence. Required/conditional validation is accessible. Failure creates one owned defect/retest through a recoverable command; repeated submission or lost-response recovery creates no duplicate. A retest links the original failure instead of overwriting it. Unapproved calibration/criteria cannot be presented as verified acceptance. Submitted evidence survives supported restart/reconnect, and reviewed output remains byte-exact under its existing document contract.

**Benefit measure:** missing required evidence per submission, time to review, and unresolved defect count/age. All failed required checks must have an explicit owned disposition before the selected package can be accepted.

### F03 — Service bulletins and equipment support lifecycle

**Parents:** SVC-06/12, ENG-06, SCM-04, DOC-04. **Lead:** Engineering/Service. **Stage:** 4, after equipment journey. **Baseline:** explicit new extension, linked to #15/#11.

Record supplier bulletin provenance/revision, supported model/serial/software applicability, obsolete parts, support dates, replacement options and review owner. Start with reviewed manual sources; do not invent an OEM API. Match installed assets as confirmed, potentially affected, not affected or insufficient information. Keep a revisioned assessment and follow-up per asset.

**Acceptance F03-A:** model/serial boundaries and unknown software versions produce the expected candidate set. A superseded bulletin preserves prior assessments. Each affected asset has a reviewed outcome or owned action; incomplete fleet/source data is visible. No automatic part substitution, firmware update, customer communication or warranty conclusion occurs.

**Benefit measure:** share of the declared installed base with reviewed applicability, plus unassessed candidate count and age; missing asset attributes stay in the denominator as unknown.

### F04 — Persistent personal and team views

**Parents:** CRM-02/04/06, NFR-01/08/12. **Lead:** Product/CRM. **Stage:** 1. **Baseline:** #120 URL-state implementation and #121 UI documentation are in open [PR #179](https://github.com/deanrfiedler-gif/powerplants-one/pull/179); named saved views are a new extension.

Build on the existing validated criteria contract. Save a name, versioned criteria and explicit personal/team scope; support rename, update, duplicate, delete and optional preferred view. Saved criteria are preferences, never stored authority or a cached list of permitted records. Introduce team visibility/management through the existing grant model with a bounded contract before runtime work.

**Acceptance F04-A:** a personal view survives browser and application restart; a permitted teammate can use a shared view but cannot edit it without management authority. Current server permissions govern every read and aggregate. Concurrent edits preserve the user's proposal and expose a version conflict. Unsupported/stale criteria recover visibly. Deleted or inaccessible views fall back safely. Detail/Back, copied URL, phone stage and clear-filter behaviour retain #120's semantics. No view operation changes an opportunity, Activity, quotation or receipt.

**Benefit measure:** steps and time to reopen three repeated tasks, plus reload/Back restoration success. Personal preferences never become team defaults implicitly.

### F05 — Readiness explanations and change-impact previews

**Parents:** PRJ-04/05, SVC-03/05, ENG-06, SCM-08, FIN-03, NFR-01/09. **Lead:** Delivery/Service coordinator. **Stage:** 3. **Baseline:** partial Service readiness runtime; wider design in [Supply Chain contract](../contracts/supply-chain-readiness.md), #13 and r16.

Show each readiness fact, source/revision/time, completeness, blocker reason, owner and next action. Preview a proposed delay/substitution/scope change against affected jobs, bookings, engineering reviews, documents and permitted commercial consequences. List and optional map use the same scoped results; unknown impacts are explicit. Recurring monitoring needs an owner, schedule, last-run outcome and recoverable history.

**Acceptance F05-A:** a partial receipt with quarantined material blocks the appropriate fictional work. A revised promise or substitution produces a source-bound preview without changing bookings or commitments. Concurrent source changes require refresh/review before applying a command. Confirmation creates only the explicitly reviewed, authorised effects and owned follow-ups; retries recover originals. Hidden costs/records do not leak through counts, maps or explanations. A failed recurring scan shows unavailable/partial, never a false all-clear; retries do not duplicate actions.

**Benefit measure:** time to identify a blocker and responsible owner; all declared in-scope affected records reconciled to the fixture oracle; count of unowned impacts must be zero for accepted scenarios.

### F06 — Actionable My Work and notification preferences

**Parents:** CRM-03, PRJ-03, SVC-02/12, DOC-05, NFR-01/11. **Lead:** Product/domain coordinators. **Stage:** 3, with early reuse in stages 1–2. **Baseline:** `/work` and shared Activities exist; extend them.

Bring overdue actions, approvals, readiness blockers and exceptions into the existing queue. Each item has a stable source, accountable owner, next action, due date or explicit unknown, and a reason it appears. Deduplicate references to the same obligation. Support appropriate grouping, digest preferences and acknowledgement without silently completing the underlying business action.

**Acceptance F06-A:** permission-filtered items open the correct controlled action; completion/transfer remains a domain command. Stale links and changed authority recover safely. Refresh/retry does not create duplicates. Quiet preferences can group routine notifications; required owned obligations remain visible. “No work” is distinct from failed loading. Unknown due dates cannot be classified as on time.

**Benefit measure:** queue-to-action steps, duplicate alert rate and unowned/unknown-due items, with source/completeness recorded.

### F07 — Data-quality and integration operations workspace

**Parents:** CRM-01/06, FIN-06, NFR-01/05/09/11/12. **Lead:** Data steward/integration operator. **Stage:** 4, with operational instrumentation from stage 1. **Baseline:** P11 `/admin`, receipts/outbox and Finance reconciliation exist; full workflow is an extension under #2/#13/#16.

Surface duplicate candidates, missing/wrong external mappings, stale facts, partial imports, document failures and reconciliation exceptions. Show source/company/entity identity, last successful update, completeness, owner, attempts and safe next action. Provide reviewed correction, reassignment, retry/reconcile and dismissal with reason. A similarity match never merges customers automatically.

**Acceptance F07-A:** exercise partial import, duplicate candidate, missing ERP link, timeout-after-acceptance and failed document generation using simulated adapters. Current permissions govern diagnostics and repair. Retry preserves original operation identity; Unknown requires evidenced reconciliation. Corrections retain history and downstream references. No second stock/accounting master is introduced; incomplete data cannot show a verified zero/balance. Operator recovery produces attributable evidence without sensitive payloads in logs.

**Benefit measure:** oldest unresolved exception, resolution time, completeness coverage and repeat failures. Recovery creates zero duplicate business effects in the declared test cases.

### F08 — Horticulture-specific visit readiness

**Parents:** PRJ-04, SVC-03/04/06/10, NFR-02. **Lead:** Site/Service coordinator. **Stage:** 2 then stage 3 impact integration. **Baseline:** site/pack readiness and BP-01 section 17 already include crop/biosecurity context; elaborate that scope.

Show site-approved crop-access windows, irrigation/shutdown constraints, visitor/biosecurity instructions, induction evidence, required tools and instrument readiness beside the appointment and in its controlled pack. Record source, owner, timezone, applicability and review date. Unknown restrictions request clarification, not assumed permission. These are recorded site instructions, not generated agronomic or safety advice.

**Acceptance F08-A:** a fictional visit outside its access window shows a clear blocker and owner; a time/zone boundary and changed site restriction create a reviewable consequence. Required tools/calibration are distinguishable from customer assets and saleable stock. Pack revisions and acknowledgement retain exact source instructions. Booking requires its existing explicit authority and never changes irrigation equipment or shutdown settings.

**Benefit measure:** preparation exceptions discovered before dispatch and visits with complete approved prerequisites; use synthetic cases until approved pilot evidence exists.

## Existing capabilities carried forward

These are included in the adoption through their existing plans. Carry-over does not close their parent issues or imply a runtime feature where only design exists.

| ID / capability | Parent links and existing home | Required completion evidence | Stage / current position |
|---|---|---|---|
| C01 Customer portal and aftercare | CRM-06/07; SVC-01/11; DOC-06; [CP1–CP5](../delivery/customer-portal-implementation-plan.md) | Customer/site isolation, controlled publication, support request and exact report acknowledgement; no staff-only material | 5; existing staged design |
| C02 Recurring maintenance | SVC-12; [BP-01 13.9](../blueprints/BP-01-master-blueprint.md#139-service-agreement-and-asset-lifecycle-contracts); #15 | Versioned plan/occurrence identity; repeat generation, skip/defer/cancel and asset movement; no duplicate work or implied booking | 4; existing scope |
| C03 Warranty and supplier recovery | SVC-12; SCM-07; FIN-03; #15 | Separate installation/commissioning/coverage dates, disputed decisions, replacement history and supplier claim/ERP credit; no inferred entitlement | 4; existing scope |
| C04 Reviewed technical knowledge | DOC-04/06; ENG-07; SVC-06; BP-01 16.3 | Draft from completed work links source evidence; reviewer approves applicability/revision; expiry and supersession visible; private content stays private | 4; existing scope |
| C05 Estimate-to-actual learning | EST-03/04/05; FIN-04/07; [feedback design](../blueprints/estimate-actual-feedback-design.md); #10 | Comparable scope, quantities, currencies, tax and cost basis; approved reusable scope/template suggestions; incomplete actuals excluded or labelled; no automatic repricing | 4; existing design, exact operating definitions remain open |
| C06 Contextual AI assistance | CRM-01/02/03; DOC-06; NFR-01/02; [assistant specification](../blueprints/ppo-assistant-specification.md); #66 | Source-linked permission-aware answers; visible uncertainty; reviewed proposals use existing commands and original recovery; malicious source instructions cannot confer authority | 5; AI1 already authorised, runtime not delivered |
| C07 Voice capture | SVC-07/10; DOC-06; NFR-03/07; existing assistant/field direction | Explicit capture, editable transcript, equipment/job confirmation, noisy/failed capture and retry; distinguish draft/local/accepted; retention and provider handling agreed before real audio | 5; staged design, no live provider assumed |
| C08 Global search | CRM-06; DOC-06; NFR-01/04; current shared shell/runtime | Maintain scoped results, source freshness and safe navigation as new entities join; revoke/identity-change/denied document regressions | All stages; implemented foundation retained |

Telemetry remains conditional future scope under BP-01 17.5 and D-027. It was not a new unconditional recommendation in Dean's quoted list. Define OEM access, consent, alarm ownership and operating coverage before selecting an integration. This register neither drops that existing possibility nor turns it into a production commitment.

## Five engineering and design standards

### Q01 — Security requirements with evidence

**Parents:** NFR-01/02/03/10, DOC-06. **Lead:** Security/engineering. **Applies:** every stage. Existing server controls are a foundation; systematic mapping remains to be completed.

Use [OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/) as the versioned verification catalogue. Q01-A requires an applicability matrix with exact standard ID, surface/threat, implementation link, positive/negative evidence, reviewer and disposition. Select verification depth from PPO's threat model; record justified non-applicability and unresolved controls. Cover search, documents, exports, cached responses, operation recovery and AI retrieval/actions. Exclusion is not a passing result.

**Release evidence:** no unresolved reproducible unauthorised read/write or cross-company leak in the selected journey; other findings have explicit severity, owner and disposition. Security mapping and testing do not assert ASVS certification. Measure evidenced applicable controls and unresolved findings; never count planned tests as coverage.

### Q02 — Monitoring tied to business operations

**Parents:** NFR-02/05/11, FIN-06. **Lead:** Engineering/operations. **Applies:** all increments and stage 4 workspace. Extend existing correlation IDs and diagnostics.

[OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) and [Next.js instrumentation](https://nextjs.org/docs/app/guides/instrumentation) support the proposed mechanism. Q02-A must follow one synthetic save through HTTP, database transaction, outbox and worker, retaining operation identity across an interrupted outcome. Define queue-age, document-generation and integration-outcome measures with owner, threshold rationale and recovery link. Inject each selected failure and verify a useful owned alert; recovery closes or updates the same incident.

Allowlist safe attributes and prevent credentials, correspondence, restricted record content and sensitive URL criteria from entering telemetry. Telemetry failure cannot turn an accepted command into a reported rejection. Sampling, retention and exporter outage behaviour need an ADR before deployment. Measure trace coverage, detection/recovery time and unresolved queue age against declared operating thresholds.

### Q03 — Executable shared component system

**Parents:** NFR-08/12, DOC-03. **Lead:** Product/engineering. **Applies:** every new surface. Existing [UI specification](../standards/ui-style-specification.md) and [baseline register](../standards/ui-baselines.json) govern presentation.

Q03-A maps approved theme tokens and interactions into shared components for controls, tables, forms, dialogs, status and source/completeness. Demonstrate loading, empty, partial, denied, failed, saving, saved, conflict and long content; include focus return, keyboard alternatives, reduced motion and responsive layout. Existing deliberate token divergences must be resolved explicitly or retained as documented exceptions. Reuse the application shell.

Evaluate [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) against current scoped CSS and baseline checks before choosing interchange/storage. It is a Community Group specification, not a W3C Recommendation. An additional component tool is optional and requires a concrete benefit. Measure undeclared token drift and covered component states; capture source-bound visual comparison. Obtain actual r17 bytes before asserting r17 implementation.

### Q04 — Measured usability, accessibility and browser performance

**Parents:** NFR-04/07/08, DOC-03. **Lead:** Product/accessibility/engineering. **Applies:** complete selected workflows.

Adopt [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) as the workflow target. Q04-A includes keyboard-only completion, screen reader labels/status/errors, focus visibility and return, zoom/reflow, contrast, touch alternatives, interrupted connectivity and representative physical phones. Keep PPO's 44 px primary/phone control policy; WCAG's AA target-size criterion is not uniformly 44 px. Generated documents need separate accessibility assessment.

Record field responsiveness using [Core Web Vitals](https://web.dev/articles/vitals): p75 LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1, separately for mobile and desktop, with build, period, sample count and journey coverage. These are adopted browser quality targets, separate from PPO's existing PT-27 p95 core-read candidate. Insufficient field data stays “insufficient”; lab/emulated evidence remains labelled. Measure task completion, time, errors and abandoned/recovered work against the current journey using matched tasks. Define device/sample protocol before claiming acceptance; no aggregate hides a failed core task.

### Q05 — Repeatable and recoverable releases

**Parents:** NFR-06/09/10/11/12, DOC-02. **Lead:** Engineering/operating owner. **Applies:** each release, with #16.

Q05-A binds source commit, image digest, migrations, configuration/template versions, dependency inventory, vulnerability disposition and original test evidence to a release. [GitHub's SBOM export](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom) is one supported inventory source; validate coverage of the actual build. Follow [Azure safe deployment principles](https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/safe-deployments) with an environment-specific rollout, health checks, deliberate promotion and documented stop/recovery decisions.

Stop for failed required checks, incompatible schema/client payloads, unauthorised access, lost/duplicate operations, broken document integrity or failed release health/journey checks. Rehearse database, documents, configuration, audit/outbox, pending offline operations and exact receipts in an isolated restore; preserve evidence and reconcile Unknown before enabling effects. Confirm usable export and operating support ownership. Application rollback cannot undo external transactions. Existing PT-22 evidence remains valid within its recorded synthetic scope; operational RPO/RTO and support commitments require measured, costed acceptance.

## Evidence closure

For each F/C/Q item, attach the implementing issue/PR, source SHA, environment, acceptance procedure, original result/capture, reviewer, remaining exceptions and deployment identifier where applicable. The delivery tracker must distinguish **planned → implemented → component verified → journey accepted → deployed**. Record failed attempts and corrections. Only advance the state supported by evidence; production acceptance is a separate operating decision.

Primary standards above were rechecked on 14 September 2026. Vendor patterns in the previous assessment are precedents, not PPO dependencies or adopted vendor subscriptions. Benefits and acceptance contracts here are PPO-specific adaptations.
