---
document_id: PPO-PRODUCT-QUALITY-ASSESSMENT
revision: r01
date: 2026-09-14
prepared_for: Dean Fiedler
status: Research and recommendations; not adopted scope or implementation acceptance
repository_commit: 10625815187f26179f316b887fcdee33467ac81f
---

# Powerplants One — Product quality and opportunity assessment

**Recommendation:** retain the seven-domain scope, modular monolith and r16 visual direction. Add a small number of explicit product extensions, deliver the valuable capabilities already designed, and make production quality demonstrable through release evidence.

“Gold standard” is treated here as dependable, efficient, accessible and maintainable operation across the selected business journeys. This assessment identifies opportunities; it does not certify the application or establish a new completion percentage.

## 1. Evidence and assessment method

Reviewed current public repository main at **10625815187f26179f316b887fcdee33467ac81f**, including merged [PR #177](https://github.com/deanrfiedler-gif/powerplants-one/pull/177), repository guidance, README, STATUS, BP-01, BP-02, ADR-0003, CRM/Estimating/Service specifications, open issues, the runtime tree and selected application files. Specific checks covered existing search, quick actions, adapters, dependencies, diagnostic instrumentation, shared UI requirements, assistant evaluation, customer portal, supply readiness and estimate-to-actual feedback.

The uploaded **powerplants-one-theme-style-board-r16(2).html** was inspected as source and extracted readable content. Its title and current sections identify r16; an early retained file comment says r03. The current r16 sections govern this assessment. SHA-256: `19d96d383fadfda3bb03b5939cb933a64e4b220e69b8cb9a21df3f48d90b794f`.

Primary product documentation and engineering standards were checked on **14 September 2026**. Vendor examples show useful patterns; suitability and priorities for PPO are the assessment’s own recommendations.

Classification used below:

- **Existing:** implemented, or explicitly in maintained design; its actual maturity is stated.
- **Strengthen:** existing intention needs a more complete user journey, operating contract or verification.
- **New extension:** not found explicitly in the inspected material. This is a bounded finding, not proof of absence from every historical conversation.
- **Later:** useful only after its data, ownership and operating dependencies exist.

No application code, GitHub issues, permissions or deployments were changed by this assessment.

## 2. Capabilities that have already been considered

| Capability | Evidence and treatment |
|---|---|
| Seven core domains | [BP-01](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/BP-01-master-blueprint.md) already covers CRM, Estimating, Engineering, Projects, Service, Supply Chain and Finance. No missing eighth core domain was identified. |
| Global search and quick creation | Implemented in [shell search](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/src/shell/search.ts) and [shell model](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/src/shell/model.ts). Search reuses permitted record readers, limits each source and distinguishes denied access from source failure. Extend this foundation. |
| Offline field capture and recovery | P08/P12 and the [current status](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/STATUS.md) record implemented synthetic capabilities. Real-device and operational acceptance remain separate. |
| Customer portal | [Portal design](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/customer-portal-design.md) already defines a staged programme. It is not a newly discovered omission. |
| Recurring maintenance, warranty and asset lifecycle | Already in BP-01 and [issue #15](https://github.com/deanrfiedler-gif/powerplants-one/issues/15). Detailed operational delivery remains. |
| Estimate-to-actual learning | An extensive [r05 proposal](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/estimate-actual-feedback-design.md) exists. It is proposed, not adopted or implemented. Preserve its cost-driver and source-completeness discipline. |
| AI, voice and source-grounded assistance | [Assistant specification](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/ppo-assistant-specification.md) already defines AI1–AI4, reviewed commands, hostile-input tests, cost controls and model evaluation. Runtime remains a separate increment. |
| Change consequences and recurring monitoring | r16 chapter 16 already demonstrates a candidate substitution, guided comparison, linked records and an owned recurring check. These are simulated proposals. |
| Data stewardship, notifications, retention and support | Already present in BP-01/BP-02. Their operating workflows need delivery and acceptance; adding another high-level heading would add little value. |

## 3. Prioritised product opportunities

P1 means valuable near-term work or a prerequisite for operational use. P2 follows the relevant module’s first complete journey. P3 requires a separate business case. These are proposed priorities, not agreed deadlines. Item numbers are local assessment labels, not new parent requirement IDs.

### 1. Persistent personal and team work views — P1; strengthen

**Benefit:** a salesperson returns to their filtered deals; a dispatcher opens “next week, awaiting parts”; an estimator shares the exact clarification queue.

Start with existing [issue #120](https://github.com/deanrfiedler-gif/powerplants-one/issues/120): Board/List, filters, sorting and stage survive navigation and reload through URL state. Follow with named views, favourites, owner, visibility and controlled column preferences. Sharing a view must not grant access to its underlying records. Avoid sensitive free text in URLs.

**First deliverable:** the bounded CRM URL-state journey, including Back/Forward, invalid parameters, phone return navigation and current-permission tests. Named team views are a subsequent extension.

Linear documents durable saved/shared views and view ownership, providing a useful interaction benchmark. [Linear custom views](https://linear.app/docs/custom-views)

**Map:** CRM-02/CRM-06, NFR-01/NFR-08; #120 and shared UI #121.

### 2. QR-linked equipment records and precise site locations — P1; new scanning extension to existing assets

**Benefit:** a technician scans a label and reaches the correct pump, controller or fertigation unit, its serial number, applicable documents, service history and open work.

Represent customer → site → greenhouse/zone → equipment without making names into identifiers. Link configuration versions and predecessor/replacement assets. The QR should resolve an opaque equipment reference through normal authentication. A label must contain no credential or permission-bearing token.

**First deliverable:** one synthetic equipment family, printable label, camera/manual-reference alternatives, permission-checked lookup and a concise equipment record. Unknown, retired, duplicate and wrong-site labels need explicit outcomes. Offline scanning can resolve only already-authorised downloaded context.

Microsoft’s functional-location model demonstrates precise location hierarchies; its inspection tools support camera barcode capture. PPO’s permission and offline design remain its own. [Functional locations](https://learn.microsoft.com/en-us/dynamics365/field-service/functional-locations), [inspection capture](https://learn.microsoft.com/en-us/dynamics365/field-service/inspections)

**Map:** CRM-01, SVC-06/SVC-12, ENG-07; #15. Requires site/asset authority decisions before operational migration.

### 3. Structured commissioning and inspection records — P1; strengthen with new detail

**Benefit:** capture the same required evidence every time, and make readings comparable across visits.

Add versioned task templates, conditional questions, required photographs, measured values with units, approved limits, test instrument identity and calibration evidence where applicable. A failed test creates an owned defect or retest. Distinguish Not tested, Not applicable, Failed and Passed. Example fields might include flow, pressure, EC or pH; approved engineering/OEM sources must supply the actual procedures and limits.

**First deliverable:** one reviewed commissioning template tied to a specific equipment/task type. Preserve the exact template version and readings in the report. Demonstrate offline recovery, a failed result, a corrected reading and an immutable original.

Conditional inspections and asset-linked histories are established in Dynamics 365 Field Service. [Advanced inspections](https://learn.microsoft.com/en-us/dynamics365/field-service/inspections-advanced)

**Map:** ENG-07, PRJ-06, SVC-06/SVC-10, NFR-07; Engineering and Service acceptance.

### 4. Installed-equipment service bulletins and support lifecycle — P2; new explicit extension

**Benefit:** answer “Which installed customers may be affected by this approved supplier bulletin, obsolete part or software support change?”

Maintain supplier/OEM, model, serial range, installed software/configuration version, verified source document, applicability decision and accountable follow-up. A match produces a review candidate. It must not automatically declare a fault, update equipment, create a quotation or contact a customer.

**First deliverable:** manually enter one fictional bulletin and compare it with a synthetic installed base, including unknown serial/version values and an explicit “cannot determine” result.

This is a PPO-specific inference from its equipment and aftercare needs, supported by the established asset-record pattern; no OEM API or automatic bulletin feed has been verified. [Microsoft customer assets](https://learn.microsoft.com/en-us/dynamics365/field-service/assets)

**Map:** SVC-06/SVC-12, ENG-06/ENG-07, DOC-04; #15.

### 5. Explainable readiness and change-impact review — P1; existing proposal to implement

**Benefit:** show what blocks a job, who can resolve it and what a changed date or product affects.

Extend the existing [Supply Chain contract](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/contracts/supply-chain-readiness.md) and r16 pattern. Show quantities and evidence for each blocker, source time, owner and next action. Before accepting a supplier promise or substitution, preview affected work packages, confirmed appointments, technical reviews and commercial exposure. Keep requested dates, forecasts, promises and bookings distinct.

**First deliverable:** one proposed supplier-delay change against two synthetic jobs. Preview consequences, record the approved change once, then create the appropriate review requests without silently moving confirmed bookings. A scenario comparison must state assumptions and leave saved commitments unchanged.

Procore’s change-event model captures potential scope, cost and schedule consequences before final commercial action. [Procore change events](https://v2.support.procore.com/product-manuals/change-events-project/tutorials/create-change-events)

**Map:** SCM-08, PRJ-04/PRJ-05, ENG-06, SVC-05; #13 and #12.

### 6. Actionable My Work and notification preferences — P1; strengthen

**Benefit:** staff can see what needs attention without checking every module.

Bring together permitted overdue actions, pending reviews, unresolved readiness items, unacknowledged changes and owned sync exceptions. Every row should explain the reason, deadline, source record and available next action. Add deduplication, urgency, quiet hours, digests and personal subscriptions as notification contracts mature.

**First deliverable:** a unified read-only queue over existing owned records. Failed sources must show partial coverage. Acknowledging a notification must not approve a quotation or acknowledge changed technical content.

View subscriptions and noise reduction offer useful precedents. PPO’s action ownership must remain authoritative. [Linear custom views and subscriptions](https://linear.app/docs/custom-views)

**Map:** BP-01 shared services, CRM-03, SVC-05, NFR-05/NFR-08; existing My Work and outbox.

### 7. Data-quality and integration operations workspace — P1 before live imports; strengthen

**Benefit:** identify an incorrect customer link, outdated supplier promise or incomplete account import before it causes downstream work.

Provide owned queues for duplicate candidates, unresolved ERP keys, missing units, stale observations, partial imports and disputed record relationships. Show last successful observation, expected completeness, reconciliation result and recovery action. A zero balance or “no records” result must not conceal a failed import.

**First deliverable:** a dry-run import with mapping preview, row-level exceptions and repeated-import proof. A reviewed merge/correction preserves aliases, external keys and issued history; recovery is explicit, rather than a promise that every downstream merge can be trivially undone.

This operationalises existing [BP-01 section 7.7](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/BP-01-master-blueprint.md) and [BP-02](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/architecture/BP-02-platform-architecture.md). It is not a newly missing governance concept.

**Map:** CRM-01, FIN-06, NFR-05/NFR-09/NFR-10; #2 and #16.

### 8. Estimate-to-actual learning and reusable scope — P2; existing design to progress

**Benefit:** future estimates improve from reviewed delivery evidence.

Use the existing r05 design’s cost-driver comparison, root-cause classification, comparable job cohorts and reviewed improvement proposals. Separate scope changes, estimating omissions, productivity, purchasing changes and rework. Approved prices and future estimates change only through their own controlled revision.

**First deliverable:** adopt a bounded portion of the current proposal and demonstrate one estimate/actual comparison with an explicit source cutoff and incomplete-data state. Reusable assemblies or scope templates require their own source, units, compatibility and version contracts.

**Map:** EST-04/EST-05, PRJ-08, FIN-04; [existing feedback proposal](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/estimate-actual-feedback-design.md).

### 9. Horticulture-specific visit readiness — P2; strengthen

**Benefit:** reduce visits that cannot proceed because of crop access, irrigation windows, site biosecurity, required instruments or an unavailable shutdown.

Expose the site’s confirmed operating windows, relevant access/cleaning requirements, seasonal restrictions, required tools and test instruments beside the appointment. Keep “information supplied”, “reviewed” and “permission granted” distinct. Do not infer safe shutdown authority or prescribe technical procedures.

**First deliverable:** one bounded visit with a site-window restriction and required instrument, demonstrating conflict review and clear ownership of unknowns.

This elaborates existing site readiness and biosecurity scope in [BP-01/BP-07](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/BP-07-service-operations.md). It is an operational design recommendation, not legal or technical safety advice.

**Map:** SVC-03/SVC-04, PRJ-04 and shared site context.

### 10. Reviewed knowledge from completed work — P2; existing intention to complete

**Benefit:** preserve both successful and unsuccessful fixes so technicians do not repeat avoidable diagnosis.

A service reviewer can propose a knowledge note from completed work, linking symptom, equipment applicability, verified cause, remedy, unsuccessful attempts, original evidence and review owner. Keep customer-specific records separate from reusable guidance. Superseded content stays identifiable.

**First deliverable:** one reviewed note linked to an equipment family, shown during preparation for a relevant synthetic visit; test an inapplicable model and a revoked source.

**Map:** DOC-04, SVC-06; BP-01 knowledge scope and assistant AI4.

### 11. Customer self-service and proactive aftercare — P2; existing staged plan

Progress the current portal plan for permitted support requests, published project updates, applicable documents and service history. Add renewal or maintenance follow-up through existing owner-controlled Activities. Internal margin, draft technical findings and staff-only notes need separate publication rules.

**First deliverable:** the prepared CP1 journey once its underlying workflow and customer identity boundaries are verified.

**Map:** [existing portal design](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/customer-portal-design.md), CRM-07 and SVC-12. Do not create a competing portal specification.

### 12. Contextual AI, voice and selected telemetry — P2/P3; existing proposals

Start with the existing assistant’s permitted summaries and editable drafts. Show exact sources, unknowns and changed fields; retain the ordinary form as a complete route. Voice should reuse the same reviewed commands and confirm names, dates and quantities. The existing AIA catalogue already covers hostile input, source grounding and model evaluation.

Carbon provides an explainability pattern; OWASP describes prompt-injection mitigations. Both reinforce the current direction. [Carbon AI label](https://carbondesignsystem.com/components/ai-label/usage/), [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

Read-only OEM observations may later support service triage, after interface, licence, consent and response ownership are established. Automatic climate control, financial actions or optimisation need separate justification.

**Map:** existing [assistant specification](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/docs/blueprints/ppo-assistant-specification.md), #66 and BP-01 conditional telemetry scope.

## 4. Engineering and release quality

The following requirements make “gold standard” reviewable. Existing controls receive credit; the recommendation is to complete or strengthen their evidence.

| Area | Recommended addition or completion | Observable exit evidence |
|---|---|---|
| Security verification | Adopt an applicable, version-pinned OWASP ASVS 5.0.0 requirements map, with a scoped Level 2 target proposed for review. Extend existing permissions tests across search, previews, exports, files, AI and cached responses. | Each applicable requirement has implementation/evidence or a justified disposition; independent assessment covers the intended operating exposure. |
| Operational monitoring | Extend existing audit and local proof diagnostics with production traces, metrics and redacted logs, using OpenTelemetry-compatible instrumentation. | Trace a save through API, database, outbox and worker; alert on failed reports, queue age, unresolved external outcomes and repeated sync failures. |
| User-perceived performance | Preserve PT-27’s agreed scope and measure actual browser experience alongside it. Optimise measured slow queries/rendering and closed editors; protect permission-sensitive caching. | Representative desktop/phone/network results, p95 business-command measurements and Core Web Vitals distributions. |
| Release integrity | Retain locked dependencies and pinned Actions; add a reviewed dependency/licence inventory, release SBOM and vulnerability triage evidence. | Match the deployed artifact to its source and dependency inventory. Account-level scanning configuration must be inspected before claiming it exists or is absent. |
| Controlled rollout | Operationalise small deployments, limited exposure, clear stop conditions, feature disable controls and compatible migrations. | Demonstrate stopping a bad release, restoring service and handling old offline payloads. A code rollback never claims to undo a financial transaction. |
| Integration assurance | Add provider-specific contract tests and reconciliation fixtures when real adapters are introduced. | Duplicate, delayed, out-of-order, partial, revoked and unknown outcomes do not create false success or duplicate effects. |
| Accessibility | Execute complete selected workflows against WCAG 2.2 AA, including generated documents and mobile errors. | Keyboard and single-pointer alternatives, visible focus, zoom/reflow, screen-reader and real-device results; automated scans supplement manual evaluation. |
| Operating ownership | Define support, access lifecycle, retention/deletion, backup restoration and source-system exit/export procedures. | A named owner can diagnose an incident, restore accepted records/documents and reconcile pending work under a rehearsed procedure. |

ASVS 5.0.0 was released in May 2025 and is the current stable version identified by OWASP. The standard supplies testable security requirements; adoption is not certification. [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

OpenTelemetry supplies traces, metrics and logs; Next.js has a supported instrumentation entry point. The inspected PPO diagnostic module is deliberately restricted to local synthetic verification, so it is not evidence of production tracing. [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/), [Next.js instrumentation](https://nextjs.org/docs/app/guides/instrumentation), [PPO proof diagnostics](https://github.com/deanrfiedler-gif/powerplants-one/blob/10625815187f26179f316b887fcdee33467ac81f/src/platform/proof-diagnostics.ts)

Proposed browser targets use Google’s “good” thresholds at the **75th percentile**, separately for desktop and mobile: **LCP ≤2.5 seconds, INP ≤200 milliseconds, CLS ≤0.1**. These measure different things from PPO’s p95 core-read candidate. Measure the private application through its own approved instrumentation. [Core Web Vitals](https://web.dev/articles/vitals)

GitHub documents exportable dependency inventories in SBOM format. Azure guidance supports progressive exposure and health-based release stops. [GitHub SBOM](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom), [Azure safe deployments](https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/safe-deployments)

## 5. Design and implementation direction

Retain r16’s navy/green identity, quiet surfaces, readable numbers, shared shell and purposeful desktop/mobile differences. Its source-linked AI explanation, change review and visible sync states are appropriate directions.

Make the approved portions of r16 executable through semantic design tokens and shared React components for tables, forms, panels, dialogs, state messages and history. Preserve intentional domain profiles. A component workbench should exercise long text, unavailable data, loading, empty, validation, denied, stale, conflict and offline states, with interaction and visual regression tests. Storybook is one option; the outcome does not depend on purchasing or installing it.

The DTCG **2025.10** format is a stable interchange option for design tokens. It is a Community Group specification, not a W3C Recommendation. [DTCG reports](https://www.designtokens.org/tr/2025.10/), [Storybook testing](https://storybook.js.org/docs/writing-tests)

For phone field work, test touch targets, sunlight readability, software-keyboard obstruction, one-handed capture and interrupted connectivity. Keep 44 px as PPO’s preferred mobile control target; WCAG 2.2 AA’s target-size criterion is 24 px with defined exceptions. Respect reduced motion and never make colour the sole status signal. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

For implementation, keep TypeScript/Next.js/PostgreSQL and the existing domain-service architecture. Preserve server validation, exact decimal/money meaning, immutable issued evidence, transaction/outbox consistency and replay protection. Add explicit module-import boundaries and provider contract tests where missing. Review framework-supported loading, rendering and caching optimisations against actual PPO profiles. [Next.js production guidance](https://nextjs.org/docs/app/guides/production-checklist)

A new microservice layer, graph database, autonomous-agent framework or native mobile rewrite has no demonstrated need from this assessment. Read-only relationship views can begin with PPO’s existing relational records. Revisit infrastructure only when an observed scale, device or support limitation justifies it.

## 6. Proposed delivery order and outcome measures

| Sequence | Bounded result | Dependencies | Value measurement |
|---|---|---|---|
| 1. Finish current acceptance and define release criteria | Reconcile current merged work, complete outstanding verification, adopt an applicable security/accessibility/performance checklist and implement #121/#120 in their current order. | Current source/main evidence; selected pilot scope. | Critical journeys completed without workaround; retained view state; no unresolved critical access/data-loss defects. |
| 2. Prove one equipment journey | QR/manual lookup → correct equipment/context → one structured inspection → reviewed result and owned retest/follow-up. | Asset authority, field evidence, template approval, actual-device access. | Time to find the right asset/history; incomplete inspection rate; rework needed before review. |
| 3. Prove one coordination journey | Supplier change → readiness explanation → impact preview → owned review requests. | Supply/Projects receiving contracts and confirmed scheduling boundaries. | Time to identify affected jobs; missed consequences; duplicate or silent booking changes. |
| 4. Operational data and support preparation | Dry-run import, mapping/exceptions, traceable document worker and rehearsed deployment/restore. | Verified MYOB/SharePoint configuration and operating ownership. | Import exceptions, stale-data age, unresolved queue age and measured restoration. |
| 5. Expand accepted value | Estimate feedback, portal, reviewed knowledge, recurring maintenance and then selected AI assistance. | Each existing increment’s receiving contracts and decision evidence. | Quotation/review cycle time, first-visit resolution, correction rate, task completion time and user trust. |

Measure a baseline on the same representative tasks before setting improvement targets. Do not invent percentage savings, support promises or a fixed implementation duration from this research. BP-01 already contains KPI definitions that should be reused and refined.

**Recommended next concrete deliverable:** one small product-quality gap register mapped to existing parent requirements and issues, with source, classification, priority, owner role, first increment and acceptance evidence. New proposals should enter the existing module plans. This assessment prepares that decision; it does not authorise a bulk expansion of the backlog.

## 7. Limits and review notes

This is a targeted repository and primary-source comparison, not an exhaustive market review, penetration test or production acceptance exercise. Some status prose predates the latest merge; current GitHub merge metadata was used to avoid treating delivered E2 work as merely planned.

The r16 attachment was inspected through source and readable content. A local rendered preview could not run because the browser executable was unavailable. No fresh visual, real-device, screen-reader or accessibility-conformance result is claimed.

No application suites were rerun during this research. No new infrastructure, integration, paid service or corporate operating responsibility is assumed. “New extension” claims are limited to the inspected sources. The complete existing blueprint remains the scope reference, and current user decisions retain precedence.

