---
document_id: PPO-CR05-SALES-AFTERCARE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; changing the built pages and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Sales aftercare and renewal worklist CR-05 design — owner decision

On 23 October 2026 Dean asked for the design of this page: "Your task is to design and build the "Sales aftercare and renewal worklist (CR-05)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma covering:
- the worklist, which names each item's source event, customer and site, owner, next step and date;
- the customer review record, with an outcome ledger of all eleven outcomes;
- the Complete review dialog, which sets exactly one outcome and says which;
- the training record, the Service referral and the renewal handover to Deals;
- history and handovers;
- tablet, phone and eight states.

Claude drew the page from these sources:
- the issued design [PPO-CR05-DES r01](sales-aftercare-renewal-design.md), its [r01 HTML](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html) and companion report;
- the [receiving contract](../contracts/sales-aftercare-receiving.md) PPO-CR05-RECEIVING r01;
- the built pages at `/sales/aftercare` and `/sales/aftercare/[id]`, which show what data really exists;
- the [Organisations](organisations-figma-design.md) and [Deals](deals-figma-design.md) designs and the [Service agreements and maintenance design](service-agreements-maintenance-design.md) (MA-05);
- the drawn pages that hand over to it or receive from it, listed in section 3.

On 30 October 2026 Claude asked "Do you accept the CR-05 design with the recommended answers?" and Dean answered: "Accept, lock in". That adopts D1–D10 and the recommended answers to Q1–Q6.

Scope:
- `scope:CR-05` "Sales aftercare and renewal worklist", at `/sales/aftercare` and `/sales/aftercare/[id]`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain. The page elaborates CRM-07, PAR-10 and SVC-12.4, with AT-14, AT-25 and AT-33, and D-018 and D-028.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, customer message, booking or deployment, and it changes no hosted authority. Every record, person, statement and date shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the CR-05 page | User decision, 23 October 2026 | Dean's request quoted above |
| Decisions D1–D10 | Accepted as drawn, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which events create an aftercare item | Resolved as recommended | Five, once per source event and revision: a service report issued (SV-06); a project stage closed out, meaning the stage's as-built released (PJ-09 and EN-08); a delivery with proof of delivery of customer-facing goods (SC-06); an end-of-support handover (EQ-07); a renewal review handed to Sales (MA-05). Each opens with "Date needed" unless its source carries a commitment. Nothing sets a review date by interval. This settles which events qualify, not when they are built: r01 demonstrates no generation, and section 6 keeps that open |
| Q2 Who owns aftercare | Resolved as recommended | The account manager, as account owner of record in Customer 360, owns the item and the review. The project manager and Service contribute, and either can be named review owner for one item |
| Q3 A satisfaction scale | Resolved as recommended | Not now. Attributed statements and "Not assessed" stay. If one is wanted later, one 5-point question ("How satisfied are you with what we delivered?", 1 Very dissatisfied to 5 Very satisfied) asked of the customer, with "Not asked" kept as its own value |
| Q4 When training is "assessed", and by whom | Resolved as recommended | Only after Delivered, when a named assessor (the trainer or a Powerplants technician, never the attendee) records the method (an observed task), the result as observed and its limits. "Assessed" never means certified competent |
| Q5 Glasshouse 4 has three customers across pages | Resolved as recommended | Hillview Growers, as on the accepted Organisations page (and CP-02 and CP-05). PJ-09 and CP-03 show SYN Riverbend Growers and are corrected when next touched. The accepted SV-06 report SYN-PPO-RPT-000059 shows SYN Greenhouse Demonstration and stays as accepted until that page is next amended |
| Q6 Smaller story checks | Resolved as recommended | Accepted as synthetic, and aligned when those pages are accepted: SYN-RPT-000064 (from CP-02) is numbered above SV-06's latest report; stage 2 customer acceptance is still pending on PJ-09, so this review follows commissioning closeout, not acceptance; the EQ-07 end-of-support handover is dated before EQ-07's own story date |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Corrections made during lock-in | Claude's polish after acceptance, disclosed here | Section 7. None changes a decision |
| Named Figma version | Saved 31 October 2026 | Asked who should save it, Dean answered "You save it"; Claude saved "Sales aftercare — accepted" in the Figma desktop app. Section 8 |
| Changing the built pages | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Sales aftercare · CR-05" `2294:85`, under "— Sales —". The page header `2294:86` holds the conformance declaration; the notes card `2314:3147` in Flows and notes holds D1–D10, Q1–Q6, the flows, what is not drawn and the audit. File index: the row "Row / Sales aftercare · CR-05" `2771:446717` in the Sales group, after Customer messages |
| Desktop 1440 | Worklist, My aftercare `2294:780587`; customer review SYN-ACR-000905, full length (1440 × 2505) `2297:705`; Complete review dialog `2299:784340`; Service referral SYN-REF-000802, prepared then submitted `2299:784669`; Training & follow-up, SYN-PPO-ACR-000901 `2300:1721`; Maintenance & renewal with the handover to Deals, SYN-ACR-000908 `2302:1942`; History & handovers after completion `2302:2502` |
| Tablet 1024 | Worklist with the rail and side menu collapsed `2305:2406` |
| Phone 390 | Review record after the site walk, full length `2305:2751`; record a customer statement with its basis `2307:2916` |
| Phone 320 | Review record, full length `2305:2989`; record a customer statement `2307:2979` |
| States | Eight cards in section "States": loading `2309:790793`; nothing due `2309:790885`; could not load `2309:790949`; read-only `2309:791011`; Date needed `2309:791032`; Service referral returned `2309:791061`; source event withdrawn `2309:791088`; Not assessed is not a low score `2309:791111` |
| Components | Moved at acceptance to the Components page, section "Components · Sales parts" `1095:257410`, keeping their node IDs and instances: Aftercare / Grid header `2294:155`; Grid row `2294:345`; Stage step `2294:358`; Outcome row `2294:359` |
| Prototype | Flows "CR-05 — desktop" (from the worklist) and "CR-05 — phone" (from the phone record), 20 links: the Glasshouse 4 row to the review; Complete review… to the dialog and on to History; Submit referral to the side form; the Block C row to the renewal handover; the Willowbank row to the training record; the rail's Aftercare & renewal back to the worklist; on phone, Record statement to the form and back |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Jamie Park, account manager of Hillview Growers. Later frames carry their own time. SYN-ACR-000905: Glasshouse 4 stage 2 closeout after as-built SYN-CMS-000012 r02 (Mon 12 Oct, 16:40); site walk with Priya Shah 09:30–10:30; "The screens are much quieter than the old ones." (Quoted); screen motor 3 (M-3, SYN-AST-000145) becomes referral SYN-REF-000802, which names her portal request SYN-TKT-000105 without merging it, and Service accepts it into that request at 11:20; training SYN-TRN-000702 is Planned with its session date needed; Glasshouse 5 screens stay an Informal discussion, SYN-CSG-000602. SYN-ACR-000908: the renewal from MA-05 SYN-RNW-000004 on SYN-AGR-000014 r01 (Block C Growers). SYN-ACR-000906: end of support from EQ-07 for Climate controller 02 SYN-PPO-AST-000102 (Northbank Nursery), Date needed. SYN-ACR-000907: follow-up on report SYN-RPT-000064, Date needed. SYN-PPO-ACR-000901 (kept from r01): Willowbank delivery, training SYN-PPO-TRN-000701 Delivered and Not assessed |
| Retained captures | [Sales aftercare design r01](../reference/ui/sales-aftercare/sales-aftercare-design-r01/README.md): eleven icon-free PNGs with hashes. Copies `2771:447150`–`2771:448598` on the Captures page from y 498,000 |

## 3. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | `scope:CR-05`, Sales aftercare and renewal worklist; PPO-CR05-DES r01 and its r01 HTML; PPO-CR05-RECEIVING r01; parents CRM-07, PAR-10 and SVC-12.4 |
| Page type (r20) | Register / worklist; record / evidence workspace for each item; centred dialog for Complete review; side forms for the Service referral and the renewal handover |
| Reused components | Rail · Sales as on Deal record CR-01, with Aftercare & renewal selected; Shell / Top bar with the Conversations action (badge 3); v2 Menu heading, item, strip and edge; Grid header cell, cell, checkbox and row actions cell; Record / Header, View tab, Field, Section heading, History item, Banner and Check item; Button; Tag; Shell / Phone header · compact |
| Source authority | Rules: PPO-CR05-DES r01 and PPO-CR05-RECEIVING r01. Data shapes: the built pages. Story: synthetic. Composition: this accepted design |
| Incoming handovers | Issued service report (SV-06); project stage closeout (PJ-09); delivery with proof of delivery (SC-06); end of support (EQ-07); renewal review handed to Sales (MA-05). Each item names its source record, revision and when it was read |
| Outgoing handovers | Service referral to Service requests (Prepared → Submitted → Returned or Accepted; Service owns triage); CRM handover to Deals (opportunity or renewal conversation; Deals qualifies); visit request to Calendar (Calendar owns the booking); owned Activity in My Work (one identity, no second task store). None of them sends anything to a customer |
| Exceptions and recovery | Loading; nothing due; could not load, which is never shown as "nothing outstanding"; read-only; Date needed; referral returned, keeping revision 1 and its reason; source event withdrawn, keeping earlier reviews; Not assessed |
| Departures | Section 5 |
| Verification | Sections 7 and 8 |

## 4. What the design shows

- **D1, grid worklist grouped by source event.** Each row names its source event, customer and site, owner, next step and date, with word tags for the four tracks (review, training, service referral, commercial). Owner, Next step, Source event and Reference sit to the right and scroll.
- **D2, views by track and owner.** A flush side menu: My aftercare, Reviews due, Date needed; Training, Service referrals, Renewals, Commercial follow-up; Owners; Related.
- **D3, record page with four tabs.** Customer review, Training & follow-up, Maintenance & renewal, History & handovers; with the worklist these are r01's five views. Concerns and commitments live in Customer review.
- **D4, outcome ledger, one outcome per review.** All eleven outcomes always show, each Set or Not set with its own source and date: goods delivered; installation or commissioning completed; customer acceptance of a defined scope; aftercare review conducted; Activity completed; technical issue resolved; training delivered; operator understanding assessed; opportunity created; renewal terms proposed; renewed agreement accepted. Completing a review sets only "Aftercare review conducted"; the dialog names it and lists what stays unchanged.
- **D5, statements beside verified results.** Each statement carries a required basis: Quoted, Paraphrased or Internal interpretation. Verified results sit in their own column. No satisfaction score is asked for, and "Not assessed" is its own value, never a low score.
- **D6, handover states in words.** Service referral and CRM handover: Prepared → Submitted → Returned or Accepted. Training: Planned → Confirmed → Attended → Delivered → Assessed. Commercial: Informal discussion → Prepared opportunity → Quotation → Accepted agreement. A referral names related requests found by the duplicate check and never merges them.
- **D7, dates show their basis.** A user choice, a recorded commitment, or a sourced rule with its reference and revision. Otherwise "Date needed", which is also a view. No interval is invented.
- **D8, renewals read from MA-05.** Maintenance & renewal shows the agreement and its MA-05 review state read-only. "Start renewal conversation" prepares a CRM handover to Deals, which owns qualification, value and terms. Nothing writes to the agreement.
- **D9, phone after a site visit.** Compact record header, flush sections and full-width 48 px actions. Recording a statement is a full-screen sheet with 16 px inputs and the basis as large radio rows.
- **D10, references.** New: SYN-ACR-000905–908, SYN-REF-000802, SYN-TRN-000702, SYN-CSG-000602, SYN-HDV-000652, SYN-ACT-000104–106 and SYN-DSP-000041. Kept as issued: SYN-PPO-ACR-000901, SYN-PPO-TRN-000701, SYN-PPO-DLV-000551 and SYN-PPO-AST-000102.

Boundaries stay as in r01: Customer 360 owns customer records; CS-07 owns relationship objectives and visit programmes; Service owns triage; CR-05 owns follow-up that names a specific source event.

## 5. Departures and earlier records

Departures from r01 and from the built pages, accepted with this design:
- a grid worklist grouped by source event, instead of cards;
- record tabs, instead of the r01 view strip;
- the built page's Concerns & commitments tab folded into Customer review;
- the built page's date filter widened into the side-menu views;
- the renewal item comes from MA-05 SYN-RNW-000004, instead of the r01 Willowbank fixture;
- new references use `SYN-<TYPE>-000nnn`, with r01 references kept as issued.

Earlier records:
- [PPO-CR05-DES r01](sales-aftercare-renewal-design.md) stays the source of the rules, and carries a dated pointer to this record.
- The [receiving contract](../contracts/sales-aftercare-receiving.md) section 7 carries a dated pointer: Q2, Q3 and Q4 give direction on its account-owner, satisfaction and competence questions. Its other open questions stay open.

## 6. Not decided and not drawn

- Applying this design to the built pages, and any change to the routes, the service or the permissions. The built pages stay as they are, with acceptance pending.
- When item generation (Q1) is built. It crosses module boundaries, and each boundary needs its own receiving agreement.
- Follow-up intervals, retention of customer statements, purchasing authority and the operational reference series: all stay open in the receiving contract.
- Not drawn as separate frames: Reviews due, Training and the other side-menu views, which are the same grid filtered; the referral form before submission, whose fields the side form shows after submit; the Calendar booking itself, which Calendar EC-03 owns.

## 7. Audit and polish

Before presenting, 23 October 2026: 1,592 visible texts checked, all Roboto; no placeholder text (the only hits are column headings and field labels that read Owner, Reference or Source); no leftovers from the cloned MA-05 and Deal record frames; no overlaps and nothing outside its section.

During lock-in, 30 October 2026, after acceptance. These are polish and correct no decision:
- the fixed settings column was transparent, so the Owner column showed through it; it is now opaque, on the worklist and tablet frames;
- worklist column widths were rebalanced within the same 872 px, so "Date needed" and "Informal discussion" are not clipped at 1440 (the tablet's Commercial column still scrolls);
- the dialog's note said the referral "stays Prepared", which History contradicts; it now says the referral keeps its own state and completing the review neither submits it nor changes what Service decides;
- state S7 now gives the review's date as 10:30, as the dialog does, and its completion as 11:35;
- the agreement table behind the renewal side form had an over-tall row, because its last column was squeezed; its columns are narrower, within the same table;
- the referral side form clipped its history lines; the prepared and submitted times now sit in its notice, and every field fits;
- the 25 October file audit had already relinked the page's top bars to Shell / Top bar, so the declaration now says that instead of "detached".

## 8. Verification

- **Captures:** 421 icons swapped to the placeholder; a final pass found no Font Awesome instance left and no stray vector; 125 prototype links were removed from the copies, and the copied flow start was removed from the Captures page.
- **Prototype:** all 20 links read back with destinations on this page. The flows were **not played in Present mode**.
- **Visual:** all eleven captures were inspected by eye, as frame screenshots or exported images. After the corrections in section 7, captures 03, 04, 06 and 11 were re-exported; the changed parts of 04 and 06 were viewed again, and the wording changes in 03 and 11 were checked by reading the edited layers back, not by viewing the final images.
- **Named version:** "Sales aftercare — accepted" was saved on 31 October 2026 at Dean's "You save it", and reads back at the top of the file's version history. It was saved after the captures were exported. The only later edit to this page recorded here is the header, notes and File index wording that says it is saved.
- **Not done:** no application check, because no application code changes; no accessibility tool, device or screen-reader test of the design; no paired comparison with the built pages.
