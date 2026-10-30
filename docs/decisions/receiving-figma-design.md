---
document_id: PPO-SC04-RECEIVING-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; application changes, MYOB mappings and operating rules separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Receiving design — owner decision

On 31 October 2026 Dean asked Claude "to finish the existing 'Receiving · SC-04' page in Figma (page 2089:535413) as a proposal for my review". Asked "Do you accept the Receiving SC-04 proposal with the recommended answers?", Dean answered: "Accept all". That answer adopts decisions D1–D9 and the recommended answers to Q1–Q6.

Claude drew the page from these sources:
- the [SC-04 design contract](../design/development/pages/scope-sc-04.md) and [ADR-0049](ADR-0049-native-supply-chain.md);
- the [Supply Chain readiness contract](../contracts/supply-chain-readiness.md) (SCM-06, SCM-08);
- the [MYOB book of record direction](ppo-workspace-myob-book-of-record.md) (EI-3, EI-4, EI-5, EI-7);
- the [Receipt correction decision](quotation-receipt-correction.md) and the [promise rules](supply-readiness-promise-rules.md);
- the Figma proposals for Material demand SC-01, Purchasing SC-02, Inbound shipments SC-03, Returns & claims SC-08 and Integrations AD-04.

**Those five pages' acceptance is not implied.** Accepting SC-04 accepts none of them. SC-04 reuses their numbers except where section 6 records a difference.

Scope: `scope:SC-04` "Receipt, inspection and quarantine", route `/supply/receipts`. Parent requirements SCM-06 and SCM-08 are unchanged, none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, migration, capability, grant, MYOB adapter, endpoint, business transaction or deployment. The native page at `/supply/receipts` stays as it is until a build is separately requested. Dean's instruction for this work was "Do not build the app page". Q1–Q6 are adopted as design direction for synthetic rules; none is a verified operating rule or a MYOB behaviour.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Finish the page as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| Arrival and quarantine never usable; four dispositions; correction by owner acknowledgement and reversal; receipt to MYOB, visible in AD-04 | User decision, 31 October 2026 | The rules in Dean's request |
| D1–D9 | Accepted as recommended, 31 October 2026 | "Accept all". Section 4 |
| Q1 Who releases from quarantine | Resolved as recommended; design direction | The supply coordinator or a delegated release permission, never the person who recorded the quarantine |
| Q2 What needs the goods-in form | Resolved as recommended; design direction | Pumps, motors, controllers and panels, pressure-rated valves, and any delivery with damaged packaging. Consumables get count and condition only |
| Q3 Serials at receipt | Resolved as recommended; design direction | Yes for controllers, pumps and motors, scanned or typed and checked unique. Whether MYOB tracks them is for the MYOB partner to confirm |
| Q4 When MYOB hears | Resolved as recommended; design direction, unverified | On count, one purchase receipt into a not-usable receiving location; on release, a transfer; a rejection goes with Returns & claims; a correction by reversal. Document types and locations are to be confirmed under DEC-CCE-10 |
| Q5 Release "use as is" with a claim open | Resolved as recommended; design direction | Yes, for the coordinator, after a passed check |
| Q6 One receipt in two views | Resolved as recommended | Yes in the views. In All receipts it sits once, under its most urgent state |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Saved 31 October 2026 at Dean's instruction | "You save it". Section 7 |
| Changing the application page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Receiving · SC-04" `2089:535413`, between Inbound shipments · SC-03 and Inventory · SC-05. The page header `2089:540378` holds the conformance declaration; the notes card `2866:30427` is in Flows and notes. File index row `2866:447043` |
| Desktop 1440 | Register `2845:32743`; DP-25 Lines `2849:17295`; DP-25 Inspection, full length `2851:4976`; DP-25 Quarantine `2851:5646`; Cable kit Affected demand `2856:5687`; FS-10 History `2856:6332`; Record receipt `2858:5680`; Release from quarantine `2858:5992`; Correct a receipt `2858:6728` |
| Tablet 1024 | Register `2862:7435` |
| Phone 390 | List `2862:9835`; Record `2862:34337`; Count form `2862:34641` |
| Phone 320 | List `2862:10173`; Record `2862:34489`; Count form `2864:26721` |
| States (phone 390) | Loading `2864:26896`; Nothing matches `2864:26982`; Could not load `2864:27060`; Read-only `2864:27129`; Quantity mismatch `2864:27220`; Serial in use `2864:27414`; Correction waiting `2864:27538`; MYOB not confirmed `2864:27659` |
| Page parts | Section "Page components (proposal)" `2845:24511`: Receiving / Receipt grid header `2845:24512`, Receipt grid row `2845:24528`. They stay on this page until a build needs them |
| Prototype | Flows "SC-04 — desktop" (from the Register) and "SC-04 — phone" (from the phone 390 List); 36 links, none off the page |
| Retained captures | [Receiving design r01](../reference/ui/supply-chain/receiving-design-r01/README.md): 24 icon-free PNGs with hashes, from copies `2866:447052`–`2866:449023` on Captures at y = 810,000 |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Casey Ng (storeperson) counts on the phone and Robin Hale (supply coordinator) decides dispositions. Three frames are later and say so: the Release form at Wed 14 Oct, 09:50, and the Record receipt form and Serial in use state at Tue 11:04.

- **SYN-RCT-000081:** one DP-25 from SYN-PPO-PO-000212 on SYN-SHP-000010, serial DP25-77341, arrived Mon 12 Oct 10:42 with its carton crushed and housing dented. Casey Ng quarantined it; it went to Returns & claims at 11:35 (SYN-SRT-000004). Kim Taylor leak tests it Wed 14 Oct 08:00, and Robin Hale decides by that day. Cover order SYN-PO-000228 stays in Purchasing.
- **SYN-RCT-000086:** 6 cable trays arrived Tue 08:20 on SYN-PO-000220; the docket's one cable and gland kit was not in the delivery. Short 1 keeps build SYN-PPO-BLD-000042 blocked. The phone promise of Wed 14 Oct is Estimated, so it isn't cover.
- **SYN-RCT-000080:** the recount found 7 of 8 FS-10; the eighth is an FS-20 on SYN-SRT-000006. Jamie Rossi accepted at 08:52 and Taylor Brooks is due Wed 14 Oct.
- **MYOB states** follow Integrations AD-04: SYN-RCT-000083 refused, SYN-RCT-000084 outcome unknown, SYN-RCT-000087 sent with no reply, SYN-RCT-000085 and 000086 posted. Receipts AD-04 doesn't list (for example SYN-RCT-000081, 000080 and 000082, posted Monday) carry a state Claude inferred.

Claude added these synthetic values to complete the story, and no other page holds them: docket numbers SYN-DKT-000nnn, MYOB references SYN-PR-004398 and SYN-PR-004402, SYN-RCT-000088, the serials CC8-20418 and CC8-20419, the earlier receipt SYN-RCT-000061, and the Mon 09:32 inspection on SYN-RCT-000080.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md):

| Field | Declaration |
|---|---|
| Scope identity | `scope:SC-04`, `/supply/receipts`; existing scope ID kept; all 78 parent IDs preserved |
| Page type (r20) | Register / worklist, grouped by disposition. Record detail with a Receipt checks bar and five tabs (Lines, Inspection, Quarantine, Affected demand, History). Side forms (Record receipt, Release from quarantine, Correct a receipt). Phone form (count) |
| Reused components | Shell / Top bar 35:138 (linked); Rail · Supply chain with Workshop; compact Phone header; phone Tab bar; Grid cell, header, checkbox and row actions; group bands; Record Header, Readiness bar, Check item, Field, Section heading, History item, View tab and Banner; Tag; Button; Controls / Form field and Choice option (proposed by the file audit, PR #694); the SC-08 phone form fields; phone list row 1612:3460 |
| Incoming handovers | Arrivals and carrier evidence from Inbound shipments (SC-03); purchase order lines read from MYOB through Purchasing (SC-02); approved demand, owners and need dates from Material demand (SC-01); supplier documents linked from the Document library (DK-01, SharePoint) |
| Outgoing handovers | Usable, quarantined, short and over observations to Material demand, with impact reviews for owners; receipt results, read-only, to Purchasing and Inbound shipments; quarantined and rejected goods to Returns & claims; released goods to Workshop booking out (CX-02); goods received, release transfers and reversals to MYOB, visible in Integrations (AD-04). No endpoint is assumed |
| Source authority | The sources listed above; Dean's request of 31 October 2026; synthetic fixtures |
| Proposed departures | V1 The grid register and record tabs replace the one-third / two-thirds worklist and detail grid in the design contract. V2 Phone uses the compact header and list rows, with detail in place of the list. V3 Two proposal-only grid parts on the page. No token or shared component changes. Accepted |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Receiving — accepted" (section 7) |

## 4. What the design shows

| ID | Rule | Basis |
|---|---|---|
| D1 | Place and views. Supply chain › Receiving. Side menu: All receipts, Expected today, Received to inspect, In quarantine, Short or over, Rejected, Released this week; Related: Inbound shipments, Purchasing, Material demand, Returns & claims, Integration activity | Dean's request; accepted Pipedrive-style register and flush menu |
| D2 | Register. A grid grouped by disposition in working order, with the receipt, status, order, supplier, count and arrival in view and the rest on scroll. Bands span the checkbox and settings columns in the group's colour | Grid band rule; SC-03 register |
| D3 | Status words. Expected, To inspect, Quarantined, Short n, Over n, Correcting, Rejected n and Released are always words, never colour alone | SC-04 contract |
| D4 | Usable means released. Arrival, count, inspection and quarantine never count. Only a named person's Release adds usable stock | SCM-06; Dean's request; readiness contract |
| D5 | Four dispositions: Release, Hold in quarantine, Reject to Returns & claims, and Short or over receipt, on the Inspection tab with their conditions stated | Dean's request |
| D6 | Quantity rules on the page. Inspected can't exceed received; usable plus quarantined can't exceed inspected; damage sits inside quarantined | SC-04 contract |
| D7 | Correction by reversal. The form freezes the proposal and each affected demand owner accepts, returns or holds it. Apply stays unavailable until all have accepted, and nothing is overwritten | Receipt correction decision; EI-4 |
| D8 | MYOB on the record. Each receipt shows its purchase receipt and release transfer with state and unique key; failures are owned in Integrations (AD-04). No endpoint or document type is presented as settled | EI-3, EI-5, EI-7; AD-04 |
| D9 | Phone. Compact header, tab bar with Receiving current, labelled cards rather than tables, a count form with 16 px inputs and 48 px fields, and detail in place of the list | Phone header amendment; SC-04 contract |

## 5. What this does not decide or build

- `/supply/receipts` is not changed. The native page keeps its current layout until a build is separately requested; the design defines that build.
- The MYOB document types, locations and serial tracking in Q3 and Q4 remain unverified. DEC-CCE-10 stays open and no adapter or endpoint is assumed.
- Who may release (Q1) is a design direction: no capability or grant is added.
- Not drawn: a clean receipt record (SYN-RCT-000085 appears in the register only), the over-delivery and rejection records beyond the phone states, barcode scanning.

## 6. Verification

Audit of 31 October 2026, by script and screenshots: 24 frames; no overlap and nothing outside a section; 36 prototype links, none off the page; every desktop and tablet top bar a linked instance of 35:138; Receiving the only selected rail item. Claude screenshotted most frames, not all of them individually at full size. Both flows' links were traced in code.

Not run: click-through in Figma Present mode, physical devices, keyboard or screen reader.

Other pages that disagree, not changed here, for those pages' next change:
- Inbound shipments SC-03 (`2091:567718`) gives the DP-25 serial as DP25-88412; Returns & claims and this page use DP25-77341.
- SC-03 names SYN Motion Parts as the supplier on SYN-SHP-000007; Purchasing and this page have SYN Drive Systems.
- Inventory SC-05 still cites an older receipt, SYN-REC-000312.

Design acceptance is not functional, business or deployment acceptance.

## 7. Named version

Asked who should save the named Figma version, Dean told Claude: "You save it". Claude saved "Receiving — accepted" in the Figma desktop app on 31 October 2026 and saw it at the top of the file's version history. The Figma page header's Named version field was updated just after that save, so the saved version's header still reads "waits for Dean".
