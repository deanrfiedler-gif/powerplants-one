---
document_id: PPO-SC09-MATERIAL-CHANGES-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; application changes and operating rules separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Material change impact design — owner decision

On 31 October 2026 Dean asked Claude "to design and build the 'Material change-impact review (SC-09)' UI page in Figma as a proposal for my review". Asked "Do you accept the SC-09 proposal with the recommended answers?", Dean answered: "Accept all". That answer adopts decisions D1–D11 and the recommended answers to Q1–Q8.

Claude drew the page from these sources:
- the [SC-09 design contract](../design/development/pages/scope-sc-09.md) and [ADR-0049](ADR-0049-native-supply-chain.md);
- the [Supply Chain readiness contract](../contracts/supply-chain-readiness.md) (SCM-08);
- the [engineering change-impact design](engineering-change-impact-review-design.md), [Quotation conversion](quotation-conversion-native.md) and [Quotation disposition](quotation-disposition-native.md) decisions, and the [Receipt correction decision](quotation-receipt-correction.md);
- the retained reference `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`, as earlier direction;
- the Figma pages Change review EN-07, Materials & substitutions EN-06, Material demand SC-01, Purchasing SC-02, Inbound shipments SC-03, Receiving SC-04, Inventory SC-05, Workshop builds CX-02, Quotation conversion ES-07 and Baseline PJ-03. None was edited.

**Accepting SC-09 accepts none of those pages.** Where one of them is still a proposal, it stays one.

Scope: `scope:SC-09` "Material change-impact review", route `/supply/changes`. Parent requirement SCM-08 is unchanged, none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, migration, capability, grant, adapter, endpoint, business transaction or deployment. The native page at `/supply/changes` stays as it is until a build is separately requested. Dean's instruction for this work was "Do not build the app page". Q1–Q8 are adopted as design direction for synthetic rules; none is a verified operating rule.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| SC-09 shows and routes; it never edits demand, orders, reservations or receipts; Change review owns the engineering decision | User decision, 31 October 2026 | The boundary in Dean's request |
| D1–D11 | Accepted as recommended, 31 October 2026 | "Accept all". Section 4 |
| Q1 Who coordinates material changes | Resolved as recommended; design direction | The supply coordinator. The project manager keeps implementation authority and everything customer-facing |
| Q2 Should PPO propose reductions by need date | Resolved as recommended; design direction | No. A person always chooses; need date and priority are information only |
| Q3 Must the workshop lead acknowledge before a released unit is changed | Resolved as recommended; design direction | Yes, and Workshop builds enforces it, not this page |
| Q4 How customers are told when a change delays delivery | Resolved as recommended; design direction | The project manager decides and tells them through PJ-05. SC-09 flags the delay and hands over, and sends nothing |
| Q5 The cable kit "short by two" in Dean's request | Resolved as recommended | Keep it as drawn. On Inbound shipments the correction short by two is SV-20 on SYN-SHP-000013, and the cable kit on SYN-SHP-000011 is 1 kit short. SV-20 shows the reductions and the kit has its own row, because existing references aren't rewritten |
| Q6 CP-4 as a "released panel" in Dean's request | Resolved as recommended | The 09:00 record stays true to Change review and Workshop builds: ready to release, released at 09:20. The released panel appears in the "source changed again" state |
| Q7 Who owns the order line | Resolved as recommended; design direction | Quinn Avery on this page. Change review lists Robin Hale as owner with Quinn Avery approving; align it at Change review's own lock-in |
| Q8 "Remind" on an overdue acknowledgement | Resolved as recommended; design direction | Keep it as a My Work reminder a person sends, with no automatic escalation. The built page doesn't have it |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Not saved yet | Section 7 |
| Changing the application page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Material change impact · SC-09" `2914:372`, after Returns & claims · SC-08. The page header `2914:373` holds the conformance declaration; the notes card `2934:4143` is in Flows and notes. File index row `2963:4153` |
| Desktop 1440 | Register `2916:10163`; CP-4 Summary, full length `2916:30737`; CP-4 Affected records `2920:1229`; FS-10 receipt correction `2920:1950`; SV-20 reductions `2923:2027`; Pump CP-40 resolved with holds `2923:2741`; Record follow-through `2929:15043` |
| Tablet 1024 | CP-4 change record `2929:15266` |
| Phone 390 | My action `2929:449210`; Acknowledge `2929:449510`; Acknowledged `2929:449862` |
| Phone 320 | My action `2929:449360`; Acknowledge `2929:449686`; Acknowledged `2929:450003` |
| States (desktop 1440) | Loading `2930:8643`; Nothing open `2930:9500`; Could not load `2930:10244`; Read-only `2930:10988`; Owner has not acknowledged `2930:11629`; Source changed again `2930:12269`; Partial `2930:12911` |
| Page parts | Section "Page components (proposal)" `2914:441`: Material changes / Change grid header `2914:442`, Change grid row `2914:620`, Affected record row `2914:622`, Compare row `2914:636`. They stay on this page until a build needs them |
| Prototype | Flows "SC-09 — desktop" (from the Register) and "SC-09 — phone" (from the phone 390 My action) |
| Retained captures | [Material changes design r01](../reference/ui/supply-chain/material-changes-design-r01/README.md): 21 icon-free PNGs with hashes, from copies `2963:4162`–`2963:5995` on Captures at y = 1,350,000 |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Robin Hale (supply coordinator) follows seven changes, five of them open. Two state frames are later and say so: Source changed again at 09:25, and Owner has not acknowledged at 13:05. The phone Acknowledged frame reads 09:02.

- **SYN-IMP-000031, CP-4 contactor 18 A → 25 A**, from engineering change SYN-ECR-000014 version 2 on Glasshouse 4 climate screens. It affects build SYN-PPO-BLD-000040 (Drew Collins), order line SYN-PO-000236 line 1 (Quinn Avery) and one reserved contactor at Warehouse North / C-07 (Robin Hale). Implementation waits on Jamie Rossi. Delivery SYN-DSP-000058 on Wed 14 Oct and the install visit on Thu 15 Oct are unchanged, and their owners were told.
- **SYN-IMP-000029, FS-10 receipt 8 → 7**, from SYN-RCT-000080. Jamie Rossi accepted at 08:52 and Taylor Brooks is due Wed 14 Oct, as on Receiving.
- **SYN-IMP-000030, SV-20 10 → 8**, from SYN-SHP-000013. Robin Hale chose −2 EA on Block C on Mon 12 Oct, 14:10, and it waits on Morgan Lee, as on Inbound shipments. SYN-PPO-WO-000039 keeps its 4 EA. 2 EA stay unmet.
- **SYN-IMP-000024, Pump CP-40 reservation outcome**: resolved with holds. The original source identity stays, and an ES-07 reassessment stays open separately.

Claude added these synthetic values to complete the story, and no other page holds them: the SYN-IMP-000nnn references, SYN-PPO-PACK-000067, SYN-PPO-QUO-000164, SYN-DEM-000094 and SYN-RES-000118. No existing reference was rewritten.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md):

| Field | Declaration |
|---|---|
| Scope identity | `scope:SC-09`, `/supply/changes`; existing scope ID kept; all 78 parent IDs preserved |
| Page type (r20) | Register / worklist, grouped by status. Record detail with a Change checks bar and tabs. Review / comparison for before and after evidence. One side form (Record follow-through). Phone: my action and acknowledge |
| Reused components | Shell / Top bar 35:138 (linked); Rail · Supply chain with Workshop, Material demand selected; v2 menu item, heading, strip and edge; compact Phone header; Grid header cell, cell, checkbox and row actions; My Work / Group row; Record Header, Readiness bar, Check item, Field, Section heading, View tab, Filter chip and Banner; Tag; Button; Controls / Form field (proposed by the file audit, PR #694) |
| Incoming handovers | Exact source versions from a released materials revision (EN-06), an engineering change (EN-07), a corrected receipt (SC-04), a shipment shortfall (SC-03), a project forecast change (PJ-03) and a conversion reassessment (ES-07) |
| Outgoing handovers | "Open in owning page" to Workshop builds, Purchasing, Inventory, Material demand, Inbound shipments, Receiving, Change review, the project programme (PJ-03), Scheduling and Job packs. Follow-through returns each module's exact outcome reference. Customer contact stays with the project manager through PJ-05. No endpoint is assumed |
| Source authority | The sources listed above; Dean's request of 31 October 2026; synthetic fixtures |
| Proposed departures | V1 Material changes is a group in the Material demand side menu; today SC-09 sits under the Material demand rail item with no menu entry. V2 The status words New, Owners notified, In progress, Resolved and Resolved with holds are names over the built Impact states. V3 A record-level Acknowledge, separate from a demand owner's Accepted, Returned or Held. V4 The grid register and record tabs replace the one-third / two-thirds worklist and detail grid in the design contract. V5 At 1024 the details column moves to a strip above the tabs. V6 Four proposal-only parts on the page. No token or shared component changes. Accepted |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Material changes — accepted" waits for Dean (section 7) |

## 4. What the design shows

| ID | Rule | Basis |
|---|---|---|
| D1 | Place. Material changes is a group in the Material demand side menu, under the existing rail item. The rail stays at eight items | `src/supply/navigation.ts` gives SC-09 `rail: "supply"`; `departmentRails` has no entry of its own |
| D2 | SC-09 shows and routes; it edits nothing. Every affected record has "Open in owning page" | SC-09 contract; the boundary with Change review EN-07 |
| D3 | The register groups by New, Owners notified, In progress, Resolved with holds and Resolved, always in words | Dean's request |
| D4 | Acknowledged means the owner has seen the change and their action, and nothing more. A demand owner's Accepted, Returned or Held stays a separate decision in Material demand, and a note or notification isn't consent | SYN-ES07-05, [Receipt correction decision](quotation-receipt-correction.md) |
| D5 | Record follow-through records the owning module's exact outcome reference as coordination evidence and applies nothing | SC-09 contract, task 3 |
| D6 | Reductions are read-only here. A person enters them in Inbound shipments: blank keeps an allocation and a number is the exact reduction. Need date and priority are information only; unmet demand and holds stay | SYN-ES07-06; Inbound shipments SC-03 |
| D7 | The "Unchanged" block names each booking and issued job pack the change doesn't alter, with its owner and when they were told. Scheduling owns any new date, and the pack owner decides any reissue | Readiness contract (promise delay); SCM-08 |
| D8 | Resolved with holds is its own status. The reservation-outcome example keeps the original source identity and a separate ES-07 reassessment | SYN-ES07-04 |
| D9 | When a source changes after the read, the page compares the read with now and asks again. An earlier acknowledgement stays in History and doesn't carry over | SC-09 contract, stale revision |
| D10 | If one module can't be read, its record shows its last read and an Unavailable tag, and the count says how many are current. Nothing is inferred | SC-09 contract, restricted evidence and missing context |
| D11 | At 1024 the details column moves above the tabs so the comparison keeps its width. Phones show only "my action" and Acknowledge, with stacked cards and 16 px input text | Dean's frame list; SC-09 contract, mobile rules for what's drawn |

## 5. What this does not decide or build

- `/supply/changes` is not changed. The native page keeps its current layout until a build is separately requested; the design defines that build.
- D1 needs the Material demand side menu to gain the group at build. SC-01's drawn menu isn't changed here.
- The enforcement in Q3 belongs to Workshop builds, and no such rule, capability or grant is added here.
- Priority-based and consequential reversal stay outside built scope and aren't drawn.
- Not drawn: the Holds & unmet, Unchanged and History tabs as separate views (their content is on Summary); filter menus; records for the cable kit, CO2 Bay 2 and CP-4 enclosure rows; a full record on the phone.

## 6. Verification

Audit of 31 October 2026, by script and screenshots: 21 frames plus the notes card; no overlap and nothing outside a section; every desktop and tablet top bar a linked instance of 35:138; off-page links stripped. Claude screenshotted most frames at reading size, not all of them individually.

At 1440 with the side menu open, the register's Owner column sits past the visible width and scrolls into view. Project or work order was given the visible place, and the toolbar's owner filter shows the owner.

Not run: click-through in Figma Present mode, physical devices, keyboard or screen reader.

Other pages that disagree, not changed here, for those pages' next change:
- Material demand SC-01: the side menu lacks the Material changes group; its Changes tab doesn't show SYN-IMP references; it lists Morgan Lee as review owner for SV-20, where this page shows Robin Hale as coordinator and Morgan Lee as the decision owner.
- Change review EN-07 lists Robin Hale as owner of SYN-PO-000236 line 1 (Q7).

Design acceptance is not functional, business or deployment acceptance.

## 7. Named version

The named Figma version "Material changes — accepted" hasn't been saved. It waits for Dean, who saves it or tells Claude to.
