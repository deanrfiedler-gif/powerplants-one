# Project specialist packages contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared 15 October 2026. Status: authorised synthetic PJ-06 R1 backend contract; independent verification, business acceptance and deployment separate. Parents PRJ-04/PRJ-05, SCM-03, AT-38. [Architecture decision](../decisions/project-specialist-packages.md).

## Scope and authority

R1 records an internal package brief against this Project's independently approved PJ-05 basis. It retains scope, exclusions, deliverables, a declared specialist description, fixed internal owner/receiver, requested date or explicit unknown-date reason, optional exact Engineering package and Supply demand references, and existing owned Project Activities. The specialist description is a staff declaration, not a verified supplier identity or award. No external access or communication exists.

All actors need native Project and exact commercial-source visibility plus `project.specialist.read`. Preparation additionally requires `project.specialist.prepare`; receiving requires `project.specialist.receive`. Only the Project coordinator creates. Later preparation belongs to the coordinator or already recorded owner. Proposed ownership confers no authority. The designated receiver must be independent of every prior author and submitter. Owners/receivers must be active and scoped; changing either requires a later transfer contract.

Source selection uses the exact Approved commercial event and its retained source hash. Optional Engineering references must belong to this exact Project, company and site. Optional Supply references must be native Demand records whose Project origin and company/site match. Freeze their exact versions and relevant reference facts, including Supply's original quantity and unit; do not calculate, reserve or convert them. Missing references require explicit reasons. Technical release, PO approval, availability and confirmed booking remain unavailable in this projection.

## Lifecycle and history

Draft -> Submitted -> Accepted or Returned. Draft/Returned may Revise to Draft, preserving prior events. Submit freezes complete content and source snapshots. Accept checks the designated receiver and current exact sources. Return records the receiver's reason without changing content and is allowed after source drift. Preparation can Withdraw any unaccepted package with a reason, including after source drift. Accepted/Withdrawn are terminal. A separately created successor may reference one Accepted predecessor in this same Project; only one successor per predecessor prevents competing correction chains.

Create, Revise, Submit and Accept require an Active Project and currently valid exact source basis. Every new mutation requires an Active Project. Original-operation replay and recovery require current authority for the original evidence, not present applicability or Active state. Reads expose Current/Changed source status and retain the original facts. Revoked/inaccessible source authority withholds the package rather than leaking identifiers, titles or counts. Each history event is checked before disclosure. Activity links are preserved on revision and retain independent lifecycle/access; accepting the brief does not complete those actions.

## API

`GET/POST /api/v1/projects/:id/specialist-packages` uses existing private/no-store identity, same-origin command and strict JSON contracts. GET with `id` returns current version plus up to 50 events; `before_version` pages older events. List uses native `limit`/signed `cursor`, omits inaccessible records and reports no whole-register total. No new UI route.

POST common fields: `schema_version:1`, UUID `operation_id`, UUID `id`, integer `expected_version` (0 only for Create), `action`, `reason` (1–1000), `note` (1–2000). Create requires `basis_id`, `basis_version`, optional `predecessor_id` and `content`. Revise supplies complete `content`; other actions cannot supply it. Actions are Create, Revise, Submit, Accept, Return, Withdraw.

Content: `title` (200), `scope`/`exclusions`/`deliverables` (4000 each), `specialist` (500), UUID `owner_id`/`receiver_id`, nullable ISO `due_date`, nullable `date_needed_reason` (1000; exactly one date choice), nullable `engineering` and `demand` objects `{id,version}`, corresponding nullable `engineering_needed_reason`/`demand_needed_reason` (1000; exactly one reference choice each), and up to 20 distinct saved Project `action_ids`. These are prototype bounds. Unknowns remain explicit and acceptance does not certify missing prerequisites.

Creation and each event commit identity, immutable content/source snapshot, SHA-256 snapshot hash, audit, actor-private receipt and synthetic outbox together. Sequential versions and native workspace locking arbitrate concurrent commands. Reusing an operation with changed content fails; identical retries recover the original. `GET /api/v1/operations/:operation_id` checks the original command's current duty and source/Activity authority. No schema, hash, grant, receipt or source row from prior history is rewritten. No seed or default grant is added.

The database also enforces closed content and nested reference fields, typed text/reference versions, bounded unresolved reasons and calendar dates. Source snapshots contain exactly `commercial`, `engineering` and `demand`; the database recomputes the canonical hash before accepting an event. Extra authority fields cannot enter the immutable projection through a direct writer.

## Required proof and remaining scope

Prove native approved-basis-to-package-to-independent-receiving, return/revise, immutable successor, source drift, company/access revocation, input/refusal, concurrent versions, exact retry/unknown-outcome recovery, transaction rollback and no downstream side effects. Inspect live schema; prove populated upgrades across 0026 and from 0102, original ledgers/grants/receipts preserved, reserved Products 0052 installed after 0103, repeat migration/seed stability, and real PostgreSQL/application restart recovery. Unit, database, compiled HTTP, application, documentation, CI and independent review results must be reported separately.

Subcontract award, supplier onboarding, competence/insurance verification, technical release and procurement receiving, performance/work-evidence acceptance, commercial commitments, cost/rate calculations, scheduling and customer publication are not implemented by R1. MYOB, SharePoint and native CAD retain their authority.
