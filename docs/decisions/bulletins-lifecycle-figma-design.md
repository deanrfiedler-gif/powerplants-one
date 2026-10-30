---
document_id: PPO-EQ06-EQ07-BULLETINS-LIFECYCLE-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; changing the built pages and UI baseline acceptance separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Service bulletins and support lifecycle EQ-06 · EQ-07 design — owner decision

On 23 October 2026 Dean asked for the design of this page: "Your task is to design and build the "Service bulletins and support lifecycle" UI page in Figma, covering Service bulletin applicability (EQ-06) and Support lifecycle and obsolescence (EQ-07), as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma covering:
- the Bulletins register, the bulletin record, the asset review form and a superseded bulletin;
- the Lifecycle register, an asset's dated support evidence, and the handover to Sales aftercare with its read-back;
- tablet, phone and eight states.

Drawing stopped on 23 October at the shared Figma call limit. Dean said "Yes, finish it", and Claude finished the page on 31 October, aligning it with pages accepted or drawn in between.

Claude drew the page from these sources:
- the [`scope:EQ-06`](../design/development/pages/scope-eq-06.md) and [`scope:EQ-07`](../design/development/pages/scope-eq-07.md) design contracts;
- [ADR-0045](ADR-0045-equipment-native-workflows.md) and the [Equipment workspace design](equipment-workspace-design.md), with its [r02 HTML](../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html);
- the built pages at `/equipment/bulletins` and `/equipment/lifecycle`, and the proof in [`docs/testing/evidence/equipment-native/`](../testing/evidence/equipment-native/README.md), which show what data really exists;
- the Equipment EQ-01 and Movement, replacement & retirement EQ-04 proposals in Figma, and the accepted [Sales aftercare design](sales-aftercare-figma-design.md).

On 31 October 2026 Claude asked "Do you accept the EQ-06 · EQ-07 design with the recommended answers?" and Dean answered: "Accept, lock in". That adopts D1–D12 and the recommended answers to Q1–Q6.

Scope:
- `scope:EQ-06` "Service bulletin applicability" at `/equipment/bulletins`, and `scope:EQ-07` "Support lifecycle and obsolescence" at `/equipment/lifecycle`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain. The page elaborates SVC-03, SVC-06, DOC-01 and DOC-02.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, customer message, work order or deployment, and it changes no hosted authority. Every record, person, manufacturer, bulletin and date shown is synthetic, and nothing is claimed about any real product.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the EQ-06 · EQ-07 page | User decision, 23 October 2026 | Dean's request quoted above |
| Decisions D1–D12 | Accepted as drawn, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Who reviews bulletin applicability | Resolved as recommended | The service lead owns each disposition and asks Engineering when it needs technical judgement; a Cannot tell can name Engineering as the next step's owner. Technicians may record Does not apply on site when the evidence plainly falls outside the published criteria; anything that applies goes to the service lead |
| Q2 Should customers be told | Resolved as recommended | Not from the bulletin itself. When a review says Applies – action needed, the customer hears through the owning work and its customer notice, and the portal (CP-04) shows that work, not the manufacturer's bulletin. Exception: for a safety bulletin, the service lead sends the manufacturer's notice through Customer messages within two working days |
| Q3 Which manufacturers first | Resolved as recommended | The controllers inside Powerplants workshop builds, then the climate, fertigation and dosing controllers under service agreements, then pumps and sensors; any other manufacturer when its first bulletin arrives. Dean still names the real list |
| Q4 Does end of support trigger a sales follow-up automatically | Resolved as recommended | Only when reviewed. Lifecycle flags support ending within 12 months on the register and in the owner's My Work, and the reviewer decides whether to hand over. Nothing goes to Sales automatically |
| Q5 Story date | Resolved as recommended | Fri 16 Oct 2026, 09:00, not the brief's Tue 13 Oct: CP-4's record did not exist until 09:20 that day, so it could not be a candidate. Equipment and Bench testing use the same date. Frames with an earlier action carry their own time |
| Q6 Bulletin numbering | Resolved as recommended | SYN-BUL-000nnn with revisions r1, r2 and so on, keeping the r02 reference SYN-PPO-SB-000004 r01 exactly as issued |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Corrections made during lock-in | Claude's polish after acceptance, disclosed here | Section 7. None changes a decision |
| Named Figma version | Waits for Dean | Section 8 |
| Changing the built pages | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Bulletins & lifecycle · EQ-06 · EQ-07" `2280:85`, under "— Shared records —", after Test instruments & calibration · EQ-09. The page header `2280:86` holds the conformance declaration; the notes card `2553:86` in Flows and notes holds D1–D12, Q1–Q6, what is not drawn and the checks. File index: the row "Row / Bulletins & lifecycle · EQ-06 · EQ-07" `2840:40236` in the Shared records group, before Configuration backups |
| Desktop 1440 | Bulletins register `2284:295`; bulletin record SYN-BUL-000005 r1, full length `2290:2487`; asset review form, CP-4 `2296:3794`; superseded SYN-BUL-000006 r1 `2292:6357`; Lifecycle register `2297:781596`; Climate controller 02 before the handover, full length `2297:782949`; Hand over to Sales aftercare `2298:5721`; handover read back, full length `2836:412568` |
| Tablet 1024 | Bulletins register with the side menu collapsed `2284:2135` |
| Phone 390 | Asset with a bulletin to check `2300:784738`; compare with this unit, full length `2300:784919`; review form, full length `2300:785117` |
| Phone 320 | Compare with this unit, full length `2300:785271`; review form, full length `2300:785194` |
| States | Eight frames in section "States": loading `2284:3804`; nothing matches `2284:4624`; could not load `2284:5383`; read-only `2290:3116`; candidates not yet reviewed `2292:6893`; Cannot tell `2296:4481`; evidence older than 12 months `2297:783508`; source revision superseded, phone `2300:785375` |
| Components | Moved at acceptance to the Components page, section "Components · Service, Supply chain and Shared records parts" `1095:257413`, keeping their node IDs and instances: Bulletin grid header `2282:772075` and row `2282:772282`; Lifecycle grid header `2282:772283` and row `2282:772469`; Bulletin / Candidate review `2282:772483`; Lifecycle / Evidence entry `2282:772497` |
| Prototype | Flows "EQ-06 — desktop" (from the Bulletins register) and "EQ-06 — phone" (from the asset), 28 links: register rows to the record, the superseded r1 and the r2 state; Review a candidate to the form and back; Open r2; the side menu between Bulletins and Lifecycle; the Lifecycle row to the record, Hand over to the form and on to the read-back; on phone, Check bulletin to compare to review |
| Story | Synthetic, as at Fri 16 Oct 2026, 09:00 AEST, signed in as Sasha Cole, service coordinator; Jordan Kim, service lead, owns bulletins; Casey Ward on site. SYN-BUL-000005 r1 records SYN Automation bulletin SA-SB-26-014 rev A (ScreenLogic SL-24, firmware 2.4.2 and earlier), which the Equipment CP-4 proposal already cites. Three candidates: CP-4 SYN-AST-000214, Applies – action needed, work order SYN-WO-000057; loan dosing unit SYN-AST-000216, Does not apply (serial below the range), reviewed Wed 14 Oct, 15:05, after EQ-04 fits it at 14:45; 2-channel unit SYN-PPO-AST-000311, on the bench as SYN-RTN-000017, Cannot tell, next step with Drew Collins. SYN-BUL-000006 r2 (DoseMotion) supersedes r1 and keeps r1's review. Climate controller 02 SYN-PPO-AST-000102, the r02 identity, a ClimaLogic CX2: hardware support ends Wed 30 Jun 2027, software updates Thu 31 Dec 2026; handed over Thu 8 Oct as SYN-ACR-000906, the item on the accepted CR-05 page |
| Retained captures | [Bulletins and lifecycle design r01](../reference/ui/equipment/bulletins-lifecycle-design-r01/README.md): fourteen icon-free PNGs with hashes. Copies `2842:404500`–`2842:412996` on the Captures page from y 720,000 |

## 3. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | `scope:EQ-06` and `scope:EQ-07`; the Equipment r02 HTML; ADR-0045; parents SVC-03, SVC-06, DOC-01 and DOC-02 |
| Page type (r20) | EQ-06: Review / comparison, supporting Register / worklist. EQ-07: Register / worklist, supporting Document & evidence workspace. One bulletin and one asset's support evidence use the shared record layout; side forms for the review and the handover |
| Reused components | Shell / Top bar with the Conversations action (badge 3); Rail · Service with Equipment selected; Equipment's side menu with Bulletins or Lifecycle selected; Toolbar search, Button, Tag; Grid header, cell, checkbox and row actions cells; Grid / Group band; Record / Header, Readiness bar, Section heading, Field, View tab; Work order record / Blocker row; Controls / Form field and Controls / Choice option; Shell / Phone header · compact |
| Source authority | Rules: ADR-0045 and the EQ-06 and EQ-07 contracts. Data shapes: the built pages. Story: synthetic. Composition: this accepted design |
| Incoming handovers | Equipment (EQ-01): installed base, components and configuration revisions; Document library (DK-01/02): exact bulletin and supplier files; Workshop builds and Bench testing (CX-02): build and bench evidence; on a phone, a bulletin opens from the equipment record open on site |
| Outgoing handovers | Applies – action needed: a service request or work order (Service) or a maintenance plan change (Maintenance), with owner and status read back. Cannot tell: a next step owned as an activity (My Work). End of support: an upgrade conversation in Sales aftercare (CR-05), never a quotation. Configuration changes go to Equipment review |
| Exceptions and recovery | Loading; nothing matches; could not load, with filters kept; read-only; candidate not yet reviewed; Cannot tell without a next step or owner; source revision superseded; evidence older than 12 months |
| Departures | Section 5 |
| Verification | Sections 7 and 8 |

## 4. What the design shows

- **D1, place.** Bulletins and Lifecycle stay where Equipment's side menu puts them (Equipment records), in the Service rail under Assets and aftercare. On a phone, the technician reaches a bulletin from the equipment record already open.
- **D2, Bulletins register.** A grid grouped by review state (Needs review, Superseded, Closed), with bands across the checkbox and settings columns. Severity is the manufacturer's word, in quotation marks, never our rating.
- **D3, dispositions in words.** Applies – action needed, Applies – no action, Does not apply, Cannot tell; a candidate without a review shows Not yet reviewed.
- **D4, criteria as published.** Manufacturer, model, serial range and configuration, with "Not stated" where the bulletin is silent. Each match says which criteria it met and which could not be checked. A match is only a candidate.
- **D5, asset-level review.** One review per candidate: disposition, reason and evidence are required, and Cannot tell also needs a next step and an owner. The review keeps its basis versions.
- **D6, handover, never authority.** Applies – action needed asks for one owning workflow, with owner and needed-by; its status is read back on the bulletin. A review authorises no work or spending.
- **D7, supersession.** A new manufacturer revision is a new record revision linked to its predecessor. Earlier reviews stay on the old revision and appear on the new one as earlier reviews, never as decisions; every candidate is reviewed again.
- **D8, closing.** A bulletin closes only when every candidate has a definitive disposition and every handover is done; Not yet reviewed and Cannot tell block it.
- **D9, Lifecycle register.** Grouped by support status in words: Unsupported, Support ending within 12 months, Supported, Unknown. Unknown is never read as supported; evidence older than 12 months is flagged in words.
- **D10, Lifecycle record.** Dated supplier evidence, newest first, never overwritten; replacement advice quoted as the supplier's; uncertainty in words. Support evidence never changes the physical lifecycle, and history stays bound to the original configuration.
- **D11, Sales aftercare handover.** Starts an upgrade conversation with the customer's account manager, prefilled from the evidence, and its status is read back. It is never a quotation and makes no promise. As CR-05 accepted, the item opens as Date needed unless someone sets a review date; no interval is applied.
- **D12, phone.** Compact header, flush record sections and one full-width 48 px main action. The technician compares the unit with the published criteria, then reviews with 16 px inputs, large radio targets and camera or file evidence.

## 5. Departures and earlier records

Departures from the built pages, accepted with this design:
- a grid register grouped by review or support state, with counts, instead of cards;
- the built dispositions change: Unknown becomes Cannot tell or Not yet reviewed, PotentiallyAffected is dropped, Affected splits into action needed and no action, NotApplicable becomes Does not apply;
- criteria gain a serial range and a configuration criterion; the built criterion is an exact serial only;
- new fields: severity as published, and a link from a bulletin revision to its predecessor;
- Applies – action needed hands over to a named workflow, instead of linking an owned Activity by UUID;
- support conclusions show as words, with "within 12 months" worked out from the dated end, and Discontinued shown as Unsupported;
- a new outgoing action, Hand over to Sales aftercare.

Earlier records:
- ADR-0045 stays the source of the rules: source-backed bulletin and support decisions do not authorise work, and history stays with its original configuration. It left distinct review authority to a later decision; Q1 gives direction for bulletins only.
- The [Equipment workspace design](equipment-workspace-design.md) carries a dated pointer to this record.
- The accepted Sales aftercare design's Q6 noted that its end-of-support item was dated before this page's story date. The Thu 8 Oct handover here makes the two pages agree; that record is unchanged.

## 6. Not decided and not drawn

- Applying this design to the built pages, and any change to the routes, service, data model or permissions. The built pages stay as they are, with acceptance pending.
- Building the handover into Sales aftercare; each boundary needs its own receiving agreement.
- The real list of manufacturers (Q3).
- Not drawn: Record bulletin and Record new revision forms; Record support evidence form; the Source, Revisions and History tabs at full size; closing a bulletin; tablet records; phone lifecycle frames; turning a bulletin into a Knowledge article (DK-05).

## 7. Audit and polish

Before presenting, 31 October 2026:
- every frame was viewed after editing; grid columns were measured against their longest values and widened to fit;
- record frames were fitted to their content, and header actions measured to stay inside the bar;
- wording copied from Equipment was searched for and removed, and hidden menus inherited from CP-4 were deleted;
- no overlaps and nothing outside its section.

During lock-in, 31 October 2026, after acceptance. These are polish and correct no decision:
- the r2 state's Review a candidate no longer links to the Cannot tell form, which belongs to another bulletin;
- "(proposal)" was removed from frame names and labels, and the page parts moved to Components;
- capture 12 was stacked so it exports at scale 1.

## 8. Verification

- **Captures:** all Font Awesome instances in the copies were swapped to the placeholder, 937 in all; a final pass found none left and no stray vector. Prototype links were removed from the copies, and the Captures page's flow list is unchanged.
- **Prototype:** 28 links read back with destinations on this page. The flows were **not played in Present mode**.
- **Visual:** every source frame was viewed by eye before capture, and captures 10, 13 and 14 as composed copies.
- **Named version:** "Bulletins & lifecycle — accepted" waits for Dean.
- **Not done:** no application check, because no application code changes; no accessibility tool, device or screen-reader test of the design; no paired comparison with the built pages.
