---
document_id: PPO-QUALITY-PLAN
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Adopted staged delivery plan; runtime increments pending
source_commit: 10625815187f26179f316b887fcdee33467ac81f
---

# Product quality delivery plan

The [adoption decision](../decisions/product-quality-adoption.md) and [quality register](../requirements/product-quality-register.md) turn Dean's recommendations into delivery scope. This plan coordinates existing domain work; it does not restart P01–P12 or replace Estimating E2/E3, Projects J1, portal CP1–CP5 or AI1 with parallel duplicates.

## Ordered delivery

| Stage | Outcome | Dependencies and exit evidence |
|---|---|---|
| 0 — Scope adoption | Register all eight refinements, five standards and existing capabilities; amend BP-01 and delivery guidance | This documentation contribution; normal PR checks. No runtime completion claimed |
| 1 — Persistent work views | Finish #121/#120 through #179, then named personal/team views F04; establish per-journey Q01–Q05 evidence records | Reconcile current main and #179 outcomes; follow the first package below. Preserve #180 permission correction and other live work |
| 2 — Equipment-to-inspection journey | F01 scan/context → F08 approved visit preparation → F02 capture/review/owned defect/retest | Current equipment/Service/documents; exact criteria/template and supported offline contract; complete package below |
| 3 — Readiness-to-owned-action journey | F05 source-backed blocker/change preview → F06 My Work follow-up; extend F08 impact and recurring monitoring | Existing Service scheduling authority and #13 manual readiness contract; current source versions and cost visibility; package below |
| 4 — Lifecycle and operating workflows | F03 bulletins; F07 data/integration recovery; C02 maintenance, C03 warranty, C04 knowledge, C05 estimating feedback | #15/#13/#16/#10/#11/#12, explicit recurrence/coverage/financial definitions, no live ERP assumptions; retain each existing domain sequence |
| 5 — Customer and assisted journeys | C01 portal CP1–CP5; C06 AI1 then evaluated extensions; C07 reviewed voice capture | Accepted publication/identity boundaries, source permission coverage, agreed audio/provider handling. Existing independently authorised AI1/portal work may proceed when ready |
| Every stage | C08 search and Q01–Q05 shared quality | Original component, journey and deployment evidence scoped to the delivered feature |

Stages are a dependency order, not dates or a revised completion percentage. Existing bounded work may proceed concurrently in separate reviewed contributions when dependencies and repository-writing coordination permit it. New feature scope increases remaining work; it does not increase current completion.

## First package — saved views after #120

**Actor/outcome:** a coordinator restores a frequent CRM task across sessions and deliberately shares a reusable view with a permitted team.

1. Confirm #179 publication/verification and reuse its criteria codec/history rules. Do not rewrite its existing URL implementation. Inspect actual main, migrations and current permissions before creating the follow-on branch.
2. Define a bounded persisted view record: stable ID, owner, name, criteria schema version, criteria, visibility/team target and record version. Reuse current grant/team entities where they exist; if no suitable team model exists, define the minimal sharing contract before coding. Neither a team label nor a copied URL supplies authority.
3. Specify creator management, authorised team management and reader access; preserve current CRM filters, money/completeness and source permissions. Keep operation recovery and stale-version conflicts in existing services. Preferred view is per user and explicit.
4. Implement create/use/rename/update/duplicate/delete with accessible states and original command recovery. Expired team membership, deleted view, unsupported criteria and identity change have explicit recovery. Search text in URLs is already potentially sensitive; exclude it from diagnostics/telemetry.
5. Execute F04-A plus negative permission, concurrency, restart, desktop/phone and Back/copy/reload cases. Verify no opportunity or Activity business writes from view navigation. Compare matched repeat-task steps/time before and after.

**Exit:** one complete persisted personal/team journey, original evidence and normal PR/main verification. #120/#121 close only for their own delivered outcomes; this named-view extension has separate tracking. No claim that every module already supports saved views.

## Second package — equipment, visit readiness and inspection

**Actor/outcome:** a technician scans the correct equipment, checks approved visit constraints, records a versioned inspection and hands a failed check to a reviewer without losing or duplicating evidence.

Prepare a synthetic equipment/site pair, a moved asset history, permitted document, one approved fictional inspection template, explicit reading unit/limit provenance, an instrument/calibration record, crop-access window and a required tool. Keep fictional engineering values visibly synthetic; seek actual limits only for an operational template.

Use the canonical equipment identity and existing Service work/assignment/document controls. Define the resolver route and label lifecycle without adding a second asset model. Add only the structured inspection fields and states needed for this complete journey. Scope any offline extension explicitly; a QR label alone cannot download records or grant access.

Execute F01-A/F02-A/F08-A as one scenario: scan → preparation blocker/clarification → permitted capture → failed check → owned defect → retest → reviewed exact output. Include camera denial/manual lookup, changed assignment, missing calibration evidence, lost response, restart, invalid unit and inaccessible document. A successful visit does not close unresolved defects or imply customer/project acceptance.

**Exit:** original submitted/retested evidence and source versions remain reconstructible; one failed check produces one owned obligation, including repeated recovery. A reviewer can see missing prerequisites and accept only the intended scope. Record task time, wrong-record selections and missing-evidence rate alongside Q01–Q05 results.

## Third package — readiness, change preview and My Work

**Actor/outcome:** a coordinator can explain a blocked job, assess a changed material promise and create the correct owned follow-up while protecting confirmed bookings and commercial authority.

Start from the existing [manual Supply Chain contract](../contracts/supply-chain-readiness.md), current Service readiness and immutable command/recovery model. Define source completeness and authority before making a consolidated Ready statement. A preview records the exact source versions it used; apply must revalidate them.

Use a fictional partial receipt with quarantine, a later supplier promise and a possible substitute. Show affected jobs/bookings, technical review and permitted cost consequences with owner/reason/source. A list is the required accessible representation; a map is an optional equivalent view with the same permissions and completeness. Keep price/ERP quantities as explicitly simulated data or unavailable; no invented endpoints.

Execute F05-A/F06-A: view blockers → preview change → source changes during review → refresh/reconfirm → controlled owned action → receipt recovery → queue completion through the owning domain. Exercise hidden records/costs, a failed/partial recurring monitor and duplicate retry. Prove that viewing a preview never moves a booking, substitutes a part or changes an issued quotation.

**Exit:** all in-scope fixture impacts are accounted for, no duplicate or unowned follow-ups, current access is enforced, and trace/recovery evidence explains the operation. Compare time to identify the blocker/owner with the current journey.

## Quality evidence and Azure promotion

Each implementation PR identifies its F/C IDs and applicable Q01–Q05 criteria. Add meaningful tests for implemented behaviour, use existing suites and retain their acceptance thresholds. Documentation work uses the existing foundation/prototype/naming checks; it does not need synthetic application tests that merely restate prose.

For a feature release, record source and actual-main verification, migration compatibility, exact image, dependency inventory, representative signed-in journey, expected health/queue behaviour, stop conditions and recovery. Deploy increments deliberately to the existing private Azure demo using its current manual workflow once source checks and database review permit. All modules share the integrated application build; a design file is not independently deployable runtime functionality.

Business pilot and production promotion require the selected complete journeys, approved data/integrations, access, operational ownership and measured restore/support evidence. Feature scope adoption is not permission to buy services, change access or deploy a production environment.

## Tracking and handover

[Delivery tracker #181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181) coordinates this adopted scope; reuse existing #120/#121/#15/#13/#16/#66 and domain issues. Create bounded runtime child issues when their contract is ready rather than bulk duplicating existing scope. The initial backlog snapshot, 78 parent register and issued references retain their historical meaning.

For each item record implementation PR, source, component result, executed journey result, owner review and deployment separately. The scope-adoption task can complete while the overarching feature tracker stays open. Unknown inputs receive an owner role and exact requested evidence; they do not silently disappear or become assumed policy.

This repository contribution belongs to the product-quality adoption session in workspace `16405d635a01`, branch `docs/product-quality-adoption`. Open #178/#179/#180 and independently advanced audit branches retain their work. Reconcile current `docs/STATUS.md` and the document register before merge; do not overwrite newer entries with this snapshot.
