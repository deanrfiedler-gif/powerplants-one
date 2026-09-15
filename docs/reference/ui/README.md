---
document_id: PPO-UI-DESIGN-INDEX
title: HTML design index and maintenance guide
revision: r01
updated: 2026-09-15
owner: Dean Fiedler
status: Repository inventory; individual design approvals remain in linked decisions
source_commit: bc1dcf21490dda37979227f5fc13224183853d5a
---

# Powerplants One HTML design index

Use this page to find a module's HTML visual, its recorded approval and its implementation handover. Keep this index at one stable path; update the relevant row in the same pull request as a new design or approval decision.

**Inventory checked:** 15 September 2026, against [main at bc1dcf2](https://github.com/deanrfiedler-gif/powerplants-one/commit/bc1dcf21490dda37979227f5fc13224183853d5a). The original inventory covered **28 HTML files under `docs/`** are linked below: 20 page/workspace previews, six preserved earlier revisions, one supporting CRM walkthrough and one handbook-generation template. The Service Review r01 row is a subsequent contribution; the original count is a historical snapshot. Application HTML in `src/` and `public/` is outside this design inventory. Files held only in conversations or downloads are not yet covered.

The file links identify repository references, not a claim that every page is the latest design created outside GitHub. A higher revision, a successful check or a merged pull request does not establish design approval. **Approved** below requires a linked Dean decision. **Proposed** means a design exists for review; an instruction to create it does not by itself approve the result. **Study** is explicitly unadopted scope. **Historical** preserves earlier evidence without making it current implementation guidance.

The [accepted UI baseline register](../../standards/ui-baselines.json) retains exact baseline hashes and application mappings. This index points to it and the individual decisions; it does not replace those controls. Implementation notes are bounded summaries of the linked records. Consult [current project status](../../STATUS.md) and the receiving handover for live delivery evidence; this inventory does not re-run application acceptance. Some historical handovers still describe earlier publication or browser-review checkpoints.

## Shared customer and platform pages

| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Customers, Sites & Growing Areas | [r03](customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) | Proposed refinement; owner acceptance remains separate | Shared customer/location records exist; this full workspace is a design. [Workspace handover](../../decisions/customers-sites-workspace-design.md), [r03 maps](../../decisions/customers-sites-maps-r03.md). |
| Equipment & Installed Base | [r02](equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) | Proposed refinement; not an accepted application baseline | Shared equipment context exists; this workspace/inspection experience requires integration. [Decision and receiving boundary](../../decisions/equipment-workspace-design.md). |
| Customer portal | [Working preview](../../blueprints/customer-portal-mockup.html) | Direction authorised; detailed design proposed | CP1–CP5 remain staged delivery work. [Decision](../../decisions/customer-portal-direction.md), [handover](../../delivery/customer-portal-handover.md). |
| Contextual Help / Page guide | [r01](../../blueprints/contextual-help-preview.html) | Proposed details under authorised design direction | CRM guide is the design pilot; application integration pending. [Decision and handover](../../decisions/contextual-help.md). |
| Naming & Filing | [r01](../../blueprints/naming-filing-prototype/index.html) | Authorised design package; visual acceptance separate | General naming/filing assistance and SharePoint integration remain receiving work. [Decision](../../decisions/naming-communications-sharepoint.md), [preview instructions](../../blueprints/naming-filing-prototype/README.md). |

## CRM and communications

| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Deals — Board / Grid | [Preserved working preview](../../blueprints/crm-board-grid-mockup.html) | Historical accepted preview; later presentation decisions govern | I1/I2 and later refinements exist. Use [r08 supersession](../../decisions/shared-ui-r08-implementation.md) and the [shared UI specification](../../standards/ui-style-specification.md); do not implement the old preview's illustrative pipeline as policy. [Design handover](../../delivery/crm-ui-design-handover.md). |
| Leads — desktop interior | [r04, declared in HTML](../../blueprints/crm-leads-desktop-preview.html) | Approved desktop refinement | Bounded manual Leads integration is recorded. Desktop approval applies to this exact reference; the phone reference remains separate. [Approval and runtime handover](../../decisions/crm-leads-runtime.md#approved-desktop-integration--10-september-2026). |
| Leads — phone and original combined preview | [r02](../../blueprints/crm-leads-preview.html) | Approved; retained phone reference | Later desktop interior uses r04 above. [Exact approval](../../decisions/crm-leads-direction.md#approved-ui-reference), [runtime handover](../../decisions/crm-leads-runtime.md). |
| Email & Calendar | [Working preview](../../blueprints/email-calendar-prototype/index.html) | Authorised r02 design package; visual acceptance separate | Bounded synthetic email/link/Activity journey exists; live provider behaviour is separate. [Design](../../decisions/email-calendar-design.md), [runtime handover](../../delivery/email-calendar-journey-handover.md), [preview instructions](../../blueprints/email-calendar-prototype/README.md). |

## Estimating and quotation

| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Estimating workspace | [Working preview](../../blueprints/estimating-workspace-mockup.html) | Discovery reference; full preview is not an application acceptance claim | E1/E2 implement bounded portions. [Discovery handover](../../delivery/estimating-discovery-handover.md), [E1 handover](../../delivery/estimating-e1-handover.md). |
| E2 options and scope discovery | [Original walkthrough](../../blueprints/estimating-e2-walkthrough.html) | Historical proposal with partial policy adoption; original routing is not current authority | Adopted E2-D02/D03 and DR-02 are implemented in bounded slices. Numeric routing and other deferred rules remain unadopted. [Current authority](../../decisions/ADR-0025-e2-discovery-foundation.md), [saved-screen handover](../../delivery/estimating-e2-screens-handover.md). |
| Guided estimating pilot | [Working preview](../../blueprints/estimating-wizard-mockup.html) | Authorised bounded pilot direction; detailed result for review | Fictional supply-and-installation rules; application wizard integration remains separate. [Pilot decision](../../decisions/estimating-wizard-pilot.md). |
| Advanced estimating container | [r03 design study](../../blueprints/estimating-wizard-container.html) | Study — explicitly not adopted; supersedes nothing | Broader line editing, systems and review scope must not be inherited as approved policy. [Five propositions](../../decisions/estimating-container-propositions.md), [study specification](../../blueprints/estimating-wizard-container-design.md). |
| Quotation Builder | [Working preview](../../blueprints/quotation-builder.html) | Proposed result under authorised design direction | E1 exact Draft output exists; this broader builder requires separate implementation. [Design decision](../../decisions/quotation-builder-design.md), [specification](../../blueprints/quotation-builder-design.md). |
| Import Excel estimate | [r01](../../blueprints/excel-estimate-import.html) | Proposed design; operational acceptance separate | Application importer is not implemented. Workbook, rules and validation evidence are linked in the [handover](../../delivery/excel-estimate-import-handover.md). |

## Engineering, projects, service and finance

| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Engineering | [r02](../engineering-r02/PPO-Engineering-Container-r02.html) | Approved | Bounded Engineering intake integration exists; wider BP-05 delivery remains separate. [Accepted decision](../../decisions/engineering-r02-integration.md), [implementation handover](../../delivery/engineering-intake-handover.md). |
| Projects starter workspace | [r02](../../blueprints/projects-starter-visuals/r02/projects-design-review-r02.html) | Published review package; owner design acceptance not inferred from publication | Project/Gantt capability exists separately; broader starter/commercial handover acceptance remains open. [Review package](../../blueprints/projects-starter-visuals/r02/README.md), [J1 reconciliation](../../delivery/projects-j1-reconciliation.md). |
| Service Review & Reports | [r01](service-review/PPO-Service-Review-and-Reports-Workspace-r01.html) | Proposed SV-06/SV-07 workspace; owner acceptance separate | Existing P09/P10 services provide the receiving foundation. [Design and handover](../../decisions/service-review-reports-workspace-design.md). |
| Service Job Pack | [r03](job-pack/powerplants-one-job-pack-r03.html) | Approved design successor to r02 | `/service/packs` exists; r03 page integration remains separate. [Decision](../../decisions/job-pack-design.md), [exact baseline mapping](../../standards/ui-baselines.json). |
| Field Technicians | [r05](field-technicians/powerplants-one-field-technicians-r05.html) | Approved design successor to r04 | Baseline register still maps `/service/technicians` to r04; r05 is not recorded as implemented. [Decision](../../decisions/field-technicians-design.md), [exact baseline mapping](../../standards/ui-baselines.json). |
| Finance & Commercial Controls | [r02](finance/PPO-Finance-and-Commercial-Controls-r02.html) | Proposed refinement; not an accepted application baseline | P10 handoff/reconciliation exists; this four-view workspace requires integration. [Design decision](../../decisions/finance-workspace-design.md), [P10 handover](../../delivery/p10-handover.md). |

## Preserved earlier revisions

These files remain unchanged. The successor link identifies a newer design reference; it does not imply the successor is approved or implemented.

| Page | Earlier HTML | Relationship |
|---|---|---|
| Customers, Sites & Growing Areas | [r01](customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r01.html), [r02](customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r02.html) | Preserved for comparison with the r03 proposal. |
| Equipment & Installed Base | [r01](equipment/PPO-Equipment-and-Installed-Base-Workspace-r01.html) | Preserved for comparison with the r02 proposal. |
| Finance & Commercial Controls | [r01](finance/PPO-Finance-and-Commercial-Controls-r01.html) | Preserved for comparison with the r02 proposal. |
| Service Job Pack | [r02](job-pack/powerplants-one-job-pack-r02.html) | Accepted predecessor; r03 is the accepted design successor. |
| Field Technicians | [r04](../powerplants-one-field-technicians-r04.html) | Earlier design, still the recorded implementation baseline until r05 integration. |

## Supporting references and generated documents

| Reference | File or source | How to use it |
|---|---|---|
| CRM discovery walkthrough | [Seven-screen wireframes](../../blueprints/crm-wireframes.html) | Supporting discovery evidence. Later accepted presentation and business contracts govern implementation. [CRM discovery handover](../../delivery/crm-discovery-handover.md). |
| PPO × MYOB integration handbook | [r01 generator template](../../design/myob-integration/template.html) with [content source](../../design/myob-integration/content.json) | Template source, not the complete rendered handbook. Use the [generator](../../../scripts/build-myob-handbook.py) and [discovery handover](../../decisions/myob-handbook-discovery.md). Field mappings are proposals; installed ERP evidence remains outstanding. |

The retired CRM capture gallery is intentionally absent from the working tree. Its [retirement decision](../../decisions/crm-mockup-retirement.md) links preserved history and recovery instructions; this index does not restore it. Shared branding and theme authority are linked through the [UI specification](../../standards/ui-style-specification.md). A separate latest theme-board HTML, Cases & Triage visual, or other conversation attachment should be added only after its actual file and revision are available and compared with this inventory.

## How to maintain the index

Dean is the design owner. Whoever adds or revises a design updates its index row in the same branch and pull request. There is no separate spreadsheet to reconcile and no schedule is created by this index.

1. **Check for an existing page.** Compare both the filename and content. Reuse its section and reference; do not upload a duplicate merely because a download has `(1)` in its name. Keep distinct desktop/phone references when their accepted scopes differ.
2. **Add the issued HTML with its revision.** For new issued visuals, use `docs/reference/ui/<module>/` and retain the agreed `rNN` filename. Preserve earlier reviewed/accepted bytes. Include required assets and instructions. Existing stable preview filenames keep their current paths and Git history; do not rename established files or break manifests merely to standardise this index.
3. **Update the row and date.** Link the new file, record its actual revision, design status, bounded implementation state and evidence. If replacing the review reference, move the earlier file to the table above without deleting it. If approval has not been recorded, say Proposed or Approval not recorded.
4. **Record approval explicitly.** When Dean approves a particular revision, record the date, exact file/revision, accepted scope and decision in `docs/decisions/`. Keep the accepted baseline pointer separate from a newer proposal. Update the existing baseline register and source manifest where that reference is controlled, including its exact hash; preserve predecessor records. Approval of desktop appearance does not automatically approve mobile behaviour, business rules or the whole module.
5. **Link implementation evidence when it changes.** Update the application note with the relevant handover/PR and actual verification limits. An HTML upload alone does not change the implemented revision. Preserve the distinction between design approval, code delivery, acceptance and deployment.
6. **Check and publish together.** Open the HTML using its documented preview method and check its assets when HTML changed. Check index links, run the applicable documentation checks below, and create a normal pull request. Update `docs/STATUS.md` only for material status changes. Recheck the inventory if another branch added a design before merge.

GitHub renders this Markdown index directly. An HTML link normally opens source in GitHub; download a self-contained preview to open it in a browser, or follow its accompanying README for assets/generation. Do not enable public hosting merely to maintain this index.

## Copyable row template

Copy this row into the relevant table. Replace each placeholder with facts and relative Markdown links to real files. Remove the placeholders before committing; do not invent a revision or approval to fill a cell.

```markdown
| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| MODULE — PAGE | REVISION and relative HTML link | Proposed; approval not recorded | Design only / bounded implementation summary. Link the decision and receiving handover or PR. |
```

If a new r03 is proposed while r02 remains approved, the status cell should read: `r03 proposed; r02 remains the approved reference`, with a link to r02 and its approval decision. If no revision is declared in an existing stable HTML file, use `Working preview` and link its source/decision rather than borrowing an unrelated template's revision.

The maintenance pull request should identify: the page changed; previous and new reference; reason for the revision; actual approval evidence or its absence; implementation impact; and checks performed. Routine index-row edits use Git history. The index's own `r01` metadata identifies this issued maintenance-guide edition; it is not the revision of every listed design.

## Validation and handover

This contribution adds navigation and maintenance guidance only. All 28 documentation HTML paths are accounted for; no HTML, application source, accepted-baseline hash or approval decision is changed. The documentation index, repository entry point, source-reference index and document register link this maintained page. The current-status file records the inventory contribution separately from existing domain status.

Run from the repository root:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
git diff --check
```

The accompanying pull request records the actual results and exact source. These are documentation checks, not a fresh visual audit or application test. Next maintenance step: reconcile newly supplied HTML files with the linked repository references and add only missing or genuinely revised designs in their own reviewed change.
