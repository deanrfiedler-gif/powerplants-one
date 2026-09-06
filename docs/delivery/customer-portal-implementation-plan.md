---
title: Customer portal - bounded implementation plan
revision: r01
date: 2026-09-06
status: Design delivery now; runtime stages pending verified dependencies
owner: Dean Fiedler
---

# Customer portal delivery plan

[Design](../blueprints/customer-portal-design.md) · [Acceptance](../testing/customer-portal-acceptance.md) · [CP1 starter](customer-portal-cp1-starter.md) · [Handover](customer-portal-handover.md).

## Authority and ordering

Dean authorised design now and bounded implementation as supporting workflows become ready. This is continuing authority for synthetic local implementation, its necessary additive migrations/fixtures, tests, documentation and normal checked repository delivery. Do not treat each prepared starter as a new approval requirement. Recheck the actual stage outcome and current dependencies before work; never silently broaden a stage. Live access/invitations, hosting, paid services, production integration/migration and operational communications remain separate decisions.

CP1–CP5 are local portal work labels, not P13+, new domains, new parent requirement IDs or automatic GitHub issue numbers. Preserve P01–P12 and existing CRM/estimating streams. This package creates one focused design issue; implementation issues are opened when their stage is ready. No speculative fleet of child issues or due dates.

## Stages and completion evidence

| Stage | Bounded outcome | Entry dependencies | Exit evidence |
|---|---|---|---|
| Design (this package) | Roles/scopes, ownership, journeys, publication, source assessment, clickable synthetic walkthrough, acceptance, maintained CP1 starter | Current repository/brand/contracts inspected | Documentation checks; original desktop/phone visual review; working preview interactions; checked PR/main evidence |
| CP1 - Customer scope and support conversation | Separate synthetic customer principals, explicit membership/grants, Home/Support, text-only request linked to one canonical Ticket and owned Activity, staff public question/reply and customer reply, receipt recovery | Published portal design; completed/verified P12 and its P11 integrated access/recovery evidence; current P03/P09/shared contracts reconciled; isolated migration allocation | Actual PostgreSQL/HTTP/UI/restart proof for CPA-01–06/12–14; two customers in one company; current access loss; one receipt/Ticket/follow-up on retry; no external connection |
| CP2a - Equipment, safe attachments and service publications | Permitted equipment summary; customer uploads through separate quarantine; exact P09 issued report access via explicit portal audience | Verified CP1; current immutable P09 output/recovery; customer attachment pipeline specified and tested | CPA-07/08/12/14; direct HTML/PDF/media isolation; upload failure/original-byte recovery; missing/superseded/withdrawn output |
| CP2b - Authenticated report response | Customer response to the exact issued HTML, owned reservations/dispute; staff unavailability stays distinct | Verified CP2a; exact P09 response wording and source invariants reconciled with customer principal | CPA-09; no inherited response or document mutation; no scheduling/Finance effect |
| CP3 - Published knowledge | Small reviewed synthetic article collection, applicable equipment links, audience-scoped search, version/withdrawal and staff publication | Verified CP1; controlled publication/metadata/permissions ready; synthetic content owner and review behaviour defined | CPA-11/12/14; publication-to-search lineage, withdrawn snippets removed, support remains reachable; no AI or supplier-rights assumption |
| CP4 - Project updates and customer actions | Approved dated summaries, milestones/date basis, exact released attachments and customer action replies | Verified CP1 and publication controls; BP-06's corresponding project/milestone/customer-action runtime delivered and verified; Engineering release boundary for included drawings | CPA-10/12/14; internal data canaries absent; incomplete/stale source shown; customer reply cannot approve a variation |
| CP5 - Commercial/account extensions | Separate bounded read/response slices: issued quotations, authorised variations, orders/deliveries, then account reads | Relevant BP-04 issue/response and BP-06/BP-08 workflows verified; P10 Finance/reconciliation; supported source adapters and customer commercial grant model | CPA-15 plus current owning-domain tests; exact revisions, current account/source/currency/completeness; no duplicate transactions or internal margin leakage |

CP2 and CP3 can proceed independently after CP1 and their own controls; CP4 need not wait for all CP5 sources. Each CP5 capability is its own reviewable slice when ready. No arbitrary all-domain completion gate is required. Runtime CP1 follows the existing core demonstration/integration/recovery sequence; design preparation does not interrupt it.

## Current readiness observation

At main `94289a20fc609e47af647b29ca8170557da312bb` on 6 September 2026:

- CP1: not ready. P10 #48 is open; P11/P12 are not delivered. P03 Ticket and P09 report foundations exist, but external membership, organisation isolation and public conversations are absent. Those are CP1 work, not presumed production capabilities.
- CP2: awaits CP1; P09 supplies reusable exact reports but no authenticated customer distribution.
- CP3: awaits CP1 and implemented controlled knowledge publication; no real article library or rights inventory inspected.
- CP4: awaits BP-06 project controls and publication. The preview's milestones are fictional fixtures only.
- CP5: estimating E1 #49 is open and only drafts are in its described scope; full issue/response, operational adapters and account access are not ready. Finance #48 is separately owned. CRM I2 #47 remains unrelated work to preserve.

Preparation update: E1 #49 merged at `1f13dd8d6f5006559152fe9d5410aed3fff64234`; publication preserves its actual tree and shared documentation. E1 delivers manual estimates/draft quotations only, so CP5 issue/response/account dependencies remain unmet. P11/P12 still govern CP1 entry.

Before implementation fetch current main, read relevant handovers and linked external publication records, inspect open PRs/migration/ADR allocation, and record a fresh readiness outcome. Do not infer readiness from an old README sentence or isolated test count. A changed repository may make a stage ready sooner than this dated observation.

## Live customer activation boundary

Synthetic stage completion is not permission to invite real customers. Before activation, prepare a concrete supported identity/hosting design and cost, verified organisation/site membership and administrator process, release and support ownership, urgent-contact/response wording, retention/incident handling, real document rights and tested source integrations. Obtain only the outstanding consequential business/activation decisions. No launch is represented by this design or a local identity selector.

## Verification and handover per runtime stage

Use the repository's existing exact toolchain, scripts and applicable CI. Run foundation/prototype/naming checks; preserve original regression gates. Execute real database, HTTP, browser and independent process/database restart cases for the new behaviour. Inspect desktop/320px/390px and long content. Record failures and their actual corrections, code head, environment, counts, original capture hashes, limitations and normal expected-head merge. Verify actual merged main; do not substitute feature-branch checks.

Keep full CPA cases Not run or partial where downstream preconditions are missing; never promote mockup assertions into runtime acceptance. Finish the current bounded stage and maintain the next ready starter/dependency observation. No separate reauthorisation is required for the scope already granted, and no automatic background execution is implied without a configured task.

## Configured continuation

The hourly “Continue PPO customer portal” condition task was created successfully on 6 September 2026. It first checks the current status of design PR #51, then one ready bounded stage. It inspects active work to avoid duplicate/concurrent mutations, keeps unchanged blockers quiet, preserves checks and reports completed delivery or a new actionable blocker. This task supplies future execution; the maintained plan alone does not.
