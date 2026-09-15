---
document_id: PPO-002-MYOB-HB
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Discovery edition; proposed mappings; tenant evidence outstanding
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
---

# PPO × MYOB Acumatica — Integration Blueprint & Field Mapping Handbook

MYOB Acumatica remains the authoritative ERP. This discovery edition defines the evidence and procedures needed to connect PPO without competing record writers, ambiguous customer/location identities or untraceable financial effects. It addresses [PPO-002 / issue #2](https://github.com/deanrfiedler-gif/powerplants-one/issues/2); it does not close that issue or establish operational integration.

The interactive HTML is generated from the [maintained content](../design/myob-integration/content.json), [template](../design/myob-integration/template.html), [styles](../design/myob-integration/style.css) and [interactions](../design/myob-integration/handbook.js). The full [field-mapping CSV](myob-field-mappings.csv) is generated from the same content. There are 60 proposed mapping entries, 12 configuration evidence requests, five business journeys, eight procedures with 32 review steps and 24 unexecuted MYOB acceptance cases. Entries are field families where the exact installed schema is unknown; discovery must split them into atomic endpoint fields before implementation.

## 1. System responsibilities

[BP-02](../architecture/BP-02-platform-architecture.md), [ADR-0003](../decisions/ADR-0003-prototype-architecture.md) and the [Finance handoff contract](finance-handoff.md) remain authoritative design sources. MYOB owns ERP financial outcomes; SharePoint remains intended business-document authority and native CAD tools retain authoring/dependencies. This handbook makes no change to the TypeScript/Next.js/PostgreSQL modular-monolith architecture.

One authorised writer is required per field family. ERP account status, terms and financial records cannot be independently changed through a PPO copy. Catalogue, pricing, inventory, shared enrichment and project dimensions require field-specific responsibility confirmation. Imported observations retain source, scope, definition, time and completeness. Issued/approved snapshots are immutable.

Compare both service alternatives under D-007: (A) MYOB owns orders/appointments/time and PPO extends them; (B) PPO owns service operations and hands approved consequences to MYOB. The current simulation uses B, but this is not an operational selection. Technical administration permissions confer no Finance, commercial or Engineering approval authority.

## 2. Actual configuration evidence

CFG-01–CFG-12 request product/build; companies/branches; enabled and actually used modules; customisations; existing integrations; API entitlements/capacity; approved test environment; actual field usage; endpoint schemas; authentication/roles; financial definitions; and support/maintenance ownership.

Every item begins **Not supplied**. Proposed respondents are roles to confirm, not appointed employees. Capture observation date, environment, source build, scope, evidence custodian and restricted evidence reference. Keep credentials, raw exports, customer records and restricted screenshots outside the public repository and distributable HTML.

## 3. Field inventory and mapping contract

Each CSV entry retains a stable handbook mapping ID, business purpose, PPO module, candidate MYOB screen/label, actual-use state, observed screen/label, verified API path, vendor-example path, PPO destination and its basis, company context, data type, required stage, allowed-value basis, units/currency, authority, direction, validation, transformation, verification and approval evidence, source references and next action.

`myob_observed_screen`, `myob_observed_field`, `api_entity_path`, `evidence_ref`, `verified_at`, `approved_by` and `approval_ref` are null in r01. All entries are **Proposed**. Generic vendor field examples occupy a different column; they never populate verified API paths. Current logical-contract targets are distinguished from proposed destinations and contract-level record families; none asserts an uninspected physical database column.

| Evidence state | Required basis |
|---|---|
| Proposed | PPO purpose, candidate source/receiver and explicit unknowns |
| Observed in MYOB | Actual screen/label and representative business-use evidence, environment and observation date |
| API verified | Exact endpoint/version/path, schema hash, permission/company scope, redacted request/response and matching interpretation |
| Approved | Owner decision bound to the exact mapping/transform revision, evidence, constraints and acceptance results |

Business-use, API and approval evidence remain separately recorded. An observed field may be unavailable to the API. A schema field may be unused by the business. A PPO-only mapping may receive an explicit API-not-applicable decision with a reason, rather than a fabricated API verification. Changes to endpoints, source meaning, configuration, access or transformations require affected mappings to be revalidated; old evidence is preserved.

During actual discovery, replace generic requiredness/value/UOM placeholders with exact null behaviour, defaults, enums, ranges, string lengths, precision, timezone, currency/tax basis, conversion, lifecycle and error rules. No guessed source enum, statutory calculation, rounding tolerance or sync interval becomes policy.

## 4. Record relationships

PPO Organisation is distinct from an ERP debtor account. ErpAccountMapping includes connection/company/customer context and effective dates. The same customer code in two legal companies is not one key. Confirm tenant, legal-company and branch semantics; branch is not a substitute for company.

Site identity is independent of debtor/delivery address. SiteParty separates operator, owner and billing party over time. A site can contain facilities and growing areas; a greenhouse bay, nursery bench or irrigation zone does not automatically equal an account location or warehouse. The existing Facility contract is retained; growing-area receiving schema remains proposed in this edition.

One product can represent many installed assets. Serial, model and site support identification but do not create assumed global serial uniqueness. Asset moves and configuration changes retain effective history and reassess future work. Installation, commissioning, warranty dates and actual coverage decisions remain separate.

Explicit crosswalks connect operational work packages with ERP project/task/cost dimensions. Handoffs retain exact source entry/report revisions and qualified ERP document/line keys; line splits and combinations require non-duplicated allocations.

## 5. API and connection setup

The [MYOB contract-based REST reference](https://enterprise-support.myob.com/adv/contract-based-rest-api) was checked on 15 September 2026. It documents contract-defined entities and JSON records, with linked/detail and custom fields. Its historical endpoint versions and authentication examples are not selected for this integration.

Capture the actual HTTPS origin through secure configuration, installed endpoint name/version, schema export/hash, entities/actions, record and line keys, custom fields, permitted queries, and error/limit behaviour. The handbook uses only the generic placeholder structure `https://{approved-instance}/entity/{verified-endpoint}/{verified-version}/{verified-entity}`.

Administrator/partner must confirm the installed authentication mechanism, supported OAuth flow if applicable, connected application, redirects/scopes, credential custody, expiry/refresh/revocation, user roles, company/branch restrictions, entitlements and concurrency limits. No OAuth setup or account change is performed. Store credentials server-side. A successful connection is insufficient: prove correct identity and denied out-of-scope access.

The Acumatica 2024 R2 OpenAPI reference was available only as a vendor search excerpt; its full page returned a browser warning. It is retained as a discovery pointer, not used to assert MYOB-specific installed features. Use installed-version help and actual schema exports. A generic API write method does not establish the correct action or authority for invoice release, stock posting or payment processing.

## 6. Synchronisation and recovery

Specify extraction scope, source cutoff, paging/order, change-capture strategy and authoritative keys. Stage imports, validate references and retain rejected rows. Advance a checkpoint only after complete processing; test timestamp ties, late changes, duplicates and permission changes. Do not assume a universal delta token, webhook or requests-per-minute limit.

Record run/correlation identity, scope, contract version, source-as-at, observed-at, page/row counts, completeness, checkpoint and owned failures. A partial or failed refresh retains last-good data with visible age/failure; unknown is not zero. Absence from a filtered/incomplete response does not prove deletion. Inactivation, cancellation, deletion and inaccessible records require distinct treatment; preserve historical references.

Future commands use existing server permission, expected-version, durable receipt and outbox boundaries. A timeout after sending may hide a completed effect. Hold the original operation, locate actual ERP results and choose the evidenced path: found once → bind/reconcile; proven absent → controlled retry; duplicates/uncertain → owned exception. Preserve original payload, correlation and attempt lineage. A software rollback cannot undo an ERP effect.

## 7. Business journeys

| Journey | Included cross-system outcome | Important exception |
|---|---|---|
| J-01 Product/parts sale | Customer/account, exact item/UOM/price basis, accepted order and verified fulfilment/financial references | One-off item or partial supply requires owned resolution |
| J-02 Planned service | Checked pack, captured/reviewed quantities, separate response, Finance disposition and line reconciliation | Unknown processing outcome cannot trigger blind resubmission |
| J-03 Equipment upgrade | Exact site/facility/assets, estimate and Engineering release, procurement, commissioning and retained configuration history | Substitution requires technical/commercial revision review |
| J-04 Major greenhouse project | Work packages mapped to accounting dimensions; commitments, receipts, forecasts, variations and billing kept distinct | Delay or forecast change does not update an accounting budget automatically |
| J-05 Warranty/return/recovery | Technical claim, return receipt, replacement, customer credit and supplier recovery have separately evidenced outcomes | Rejected supplier recovery leaves an owned exposure |

The HTML provides selectable journeys, numbered sequence diagrams, suggested role groups, completion criteria, exceptions and links to exact mapping entries. All scenarios are fictional. A completed visit may have follow-up; attendance acceptance, report response, stock issue and financial reconciliation are separate facts.

## 8. Procedures and local review behaviour

PROC-01 prepares discovery; PROC-02 verifies fields/relationships; PROC-03 prepares a read-only test connection; PROC-04 runs/reconciles the initial pilot; PROC-05 follows reviewed manual Finance handoff; PROC-06 recovers unknown command outcomes; PROC-07 investigates sync failures/conflicts; PROC-08 prepares upgrades/credential rotation. Each has a prerequisite, proposed responsible roles, sequenced actions, expected evidence and completion meaning in the maintained content.

The HTML's 32 checkboxes mean **Reviewed locally**, not executed, verified or approved. Only step IDs and export metadata can be saved/imported. Persist under `ppo-myob-handbook-r01-review-v1` where local browser storage works; report session-only storage otherwise. Reject incompatible edition/schema, duplicate or unknown IDs, extra properties, malformed JSON and oversized imports without changing current marks. Existing incompatible stored bytes remain untouched until explicit reset. Cross-tab changes update review marks and status. Reset affects only this document key and requires local confirmation.

Search matches mapping metadata; module/status/authority filters combine, sort changes order only, and no-match states explain that r01 has no verified entries. Desktop rows and mobile cards represent the same matching IDs. Mapping panels retain selected identity. Source links are explicit external navigations. CSV exports include all mapping columns, with separate all/matching/single-record actions and spreadsheet-formula escaping. Print temporarily includes every section, mapping, workflow and procedure regardless of active filters, then restores the interactive state.

## 9. Acceptance and release readiness

MYOB-T-01–MYOB-T-24 are handbook-local derived acceptance IDs, not replacements for the parent acceptance catalogue. They cover identity, permission denial, missing/null values, schema change, hierarchy, complete/incremental reads, inactive records, units, currency/tax comparability, payments/credits/unapplied cash/reversals, quantity conservation, duplicate/partial/unknown effects, stale sources, expiry/throttling, last-good data, upgrades, exact document revisions and separate warranty consequences. **All are Not run against MYOB.**

The Finance examples retain the existing synthetic contract basis: 1,100 invoice less 400 applied payment and 100 applied credit gives source remaining 600; separate 200 unapplied cash does not change that invoice; reversal of the payment yields source remaining 1,000. These are exact fictional AUD examples, not financial advice, real balances or adopted accounting definitions. The 90 MIN allocation fixture retains 60 Billable and 30 NonBillable exactly once.

| Existing traceability | Handbook contribution |
|---|---|
| EST-09; IF-01–IF-03; AT-05 | Item mapping, one-off-item resolution and unknown conversion outcomes |
| SVC-02; DAT-05; TR-02; IF-04; AT-06/AT-14/AT-30 | Service authority alternatives and separated orders/appointments/time |
| DAT-01–DAT-03; D-011 | Account/site/asset identity, effective relationships and horticultural location |
| FIN-01/FIN-02; FD-01–FD-04; IF-05; AT-18/AT-31 | Account observations and payment/credit/deposit/application distinctions |
| FIN-03/FIN-06/FIN-07; FD-10; TR-14; AT-12/AT-22/AT-31 | Exact handoff, reconciliation, measure definitions and recovery |
| D-005/D-006/D-007/D-012/D-017 | Configuration, integration, service authority, documents and Finance evidence requests |

Progress through discovery → verified bounded reads → reviewed manual handoff → separately specified commands → operational release. Each stage needs its own actual evidence and authorisation. Technical implementation, document QA, executed acceptance and company approval remain distinct.

## 10. Decisions and maintenance

D-005/D-006/D-007/D-011/D-012/D-017 remain open for actual evidence. Suggested owners are unappointed roles. Update affected mappings and tests after MYOB upgrades, customisation changes, credential/access changes, new company/branch scope, new financial definitions, changed field ownership or incidents. Capture exact contract/schema versions and preserve old evidence; retest affected scope before reliance.

The provided theme board confirms r20. SHA-256: `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Embedded Roboto fonts and the supplied compact on-navy symbol are retained; colours, six-pixel controls, fourteen-pixel rounded pickers and detail-panel treatment follow the supplied design. This is an application of the visual source, not a claim that the new layout has been accepted.

Build the deliverable with `python3 scripts/build-myob-handbook.py --output /absolute/output/ppo-myob-integration-handbook-r01.html`. The output is generated and normally kept outside Git; the source and CSV remain reviewable in Git. No application route, migration, dependency pin, CI gate, live adapter or permission is changed. See the [discovery handover](../decisions/myob-handbook-discovery.md) for actual verification and limitations.
