---
document_id: PPO-CP06-QUOTATIONS-ACCOUNT-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; implementation, grants, adapters and live customer access separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Quotations and account design — owner decision

On 23 October 2026 Dean asked Claude to "design and build the 'Customer quotation, variation and account views (CP-06)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/portal/commercial` is not built, so this design defines the build. A Figma call limit stopped the first session; on 30 October he told Claude "Yes, finish it", then "Play flows first". Claude played both flows, fixed what playback found, and asked "Do you accept the Quotations & account CP-06 design?". Dean answered: "Accept, lock in." That answer was offered as accepting the design with Claude's recommendations, including departures D1–D16 and the recommended answers to Q1–Q7.

Claude drew the page from these sources:
- the [customer portal design](../blueprints/customer-portal-design.md) §3 (customer commercial representative), §5, §8, §9 and §10; the [implementation plan](../delivery/customer-portal-implementation-plan.md) (CP5); and the [acceptance procedures](../testing/customer-portal-acceptance.md) (CPA-15, Not run);
- the [quotation view tracking decision](quote-view-tracking.md), option B and Q9;
- the [project commercial design](project-commercial-figma-design.md) (PJ-05) and the [customer messages design](customer-messages-figma-design.md) (M1);
- the [MYOB book of record direction](ppo-workspace-myob-book-of-record.md);
- the [portal home and access design](portal-home-access-figma-design.md) (CP-01), whose shell this page reuses;
- the Figma proposals for the Quotation page ES-05, Dispatch & delivery SC-06 · SC-07, Customer accounts FN-02, Change review EN-07 and Support requests CP-02.

**Those last five were still proposals when CP-06 was accepted.** CP-06 reuses their numbers and rules exactly, and accepting CP-06 accepts none of them. If one of them changes before acceptance, CP-06's story and handover wording follow it.

Scope:
- `scope:CP-06` "Customer quotation, variation and account views", destination `/portal/commercial`, stage CP5.
- Parent requirements EST-03, EST-07, EST-08, FIN-01, FIN-02, FIN-06, FIN-07, DOC-02 and DOC-06; none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, MYOB adapter, identity provider, hosting, invitation, customer message, business transaction or deployment. It does not settle D-024: Q3 records a recommended direction for that decision to adopt.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CP-06 in Figma | User decision, 23 October 2026 | Dean's request quoted above |
| Finish the page, then play the flows | User decisions, 30 October 2026 | "Yes, finish it"; "Play flows first" |
| Departures D1–D16 | Accepted as recommended, 30 October 2026 | "Accept, lock in." Section 4 |
| Q1 Story date | Resolved as recommended | As at Wed 14 Oct 2026, 10:00, not the brief's Tue 13 Oct 09:00. CP-4 ships at 07:47 on Wed 14 Oct and the variation can't be issued before the change is accepted at 08:35 on Tue 13 Oct |
| Q2 Which customer is Glasshouse 4 | Resolved as recommended | Two representatives. The quote page's SYN-PPO-QUO-000188 belongs to SYN Woodhaven Nursery, so Jamie Ellis sees it; Lena Ortiz (SYN Riverbend Growers) sees variations, orders and account. Showing it to Riverbend would leak another customer's quotation |
| Q3 Accept online, and with what signature | Recommended answer accepted as direction; D-024 still open | Not in this stage. Reply to the sender, and staff record the response. D-024 should consider a typed name plus a one-time email code, checked against the commercial grant and the exact revision's hash, piloted on variations and then quotations |
| Q4 First slice | Resolved as recommended | Orders & deliveries, then Account (once a read-only MYOB adapter exists), then issued quotations, then variations. Each still needs its own go-ahead and its owning workflow |
| Q5 Accounts by site | Resolved as recommended | Account reads are granted per MYOB customer account, because a balance can't be split by site without recalculating it. Quotations, variations and orders stay limited to granted sites |
| Q6 Statements | Resolved as recommended | Download a statement produced from the same MYOB read, stamped with its time; later the exact MYOB-produced PDF. Finance's monthly statements are unchanged |
| Q7 Navigation label | Resolved as recommended | "Quotations & account" on desktop and tablet, "Account" on the phone tab bar |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Waits for Dean | Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Quotations & account · CP-06" `2281:149`, last under "— Customer portal —". The page header `2281:150` holds the conformance declaration; the notes card `2306:4486` and flows card `2306:4613` are in Flows and notes. File index row `2787:111` |
| Desktop 1440 | Commercial home `2282:722`; Quotation list `2284:778336`; Quotation view `2284:778539`; Quotation reply `2771:407376`; Quotation replaced `2784:340995`; Variations list `2285:777165`; Variation view with reply `2285:777379`; Variation question `2784:340771`; Variation reply sent `2771:407611`; Orders, one in transit `2286:598`; Delivery with proof `2286:895`; Report a problem `2771:407812`; Account `2290:777797`; Invoice query `2290:778203`; Access not granted `2290:778442` |
| Tablet 1024 | Account `2299:785510` |
| Phone 390 | Commercial home `2300:785591`; Order tracking `2300:786030`; Quotation view `2300:786475`; Quotation reply `2771:408099`; Account `2300:786957`; Variation with reply `2771:407956` |
| Phone 320 | Commercial home `2300:787402`; Order tracking `2300:787551`; Quotation view `2300:787707`; Quotation reply `2771:408343`; Account `2300:787902`; Variation with reply `2771:408203` |
| States (phone 390) | Loading `2304:788842`; Nothing to show `2304:789252`; Source out of date `2304:789646`; Slice not yet available `2304:790051`; Quotation replaced `2304:790446`; Link withdrawn `2304:790839`; Tracking number missing `2304:791233`; Access changed `2304:791631` |
| Page parts | Section "Page components (proposed)" `2281:218`: Portal / Nav bar · desktop · Quotations & account selected `2282:646`; Home and Support only `2290:778429`; Portal / Tab bar · phone · Account selected `2282:670`; Home and Support only `2304:788815`; Commercial / Sub tab `2282:721`. They stay on this page until a build needs them |
| Prototype | Flows "CP-06 — desktop" (from Commercial home) and "CP-06 — phone" (from the phone Commercial home); 96 links, none off the page |
| Story | Synthetic, section 3 |
| Retained captures | [Quotations and account design r01](../reference/ui/customer-portal/quotations-account-design-r01/README.md): 36 icon-free PNGs with hashes, from copies `2787:120`–`2787:4101` on Captures at y = 590,000 |

## 3. Story and conformance

Synthetic, as at Wed 14 Oct 2026, 10:00 AEST, with Delivery with proof at 14:10. Lena Ortiz is the accounts contact for SYN Riverbend Growers on Customer accounts FN-02; the story gives this contact the commercial grant for SYN Riverbend Glasshouse 4 (the site name Project updates CP-03 uses) and the account read for MYOB customer SYN-C-00418. Jamie Ellis, Operations manager at SYN Woodhaven Nursery, is the quote page's recipient and holds a quotations-only grant. Lee Nguyen (operations, Riverbend) is a requester without the commercial grant.

Reused exactly:
- SYN-PPO-QUO-000188 revision 2, $81,200.00 excluding GST, issued 7 Oct 2026, valid until Fri 6 Nov 2026, from Sasha Clarke;
- SYN-DSP-000058: CP-4 SYN-SN-260040 and the mounting kit, [SYN Freight Co] SYNC-4471-3016, dispatched Wed 14 Oct 07:47, notice 08:12, delivered 13:40 at loading bay B, signed by Lee Nguyen;
- balance $27,379.00 = SYN-INV-000431 $20,537.00 + SYN-INV-000398 "GH4 variation V-02" $6,842.00, queried on Mon 5 Oct (the brief's "stage 1 invoice"), and last payment $41,800.00 on Fri 28 Aug. The figures match FN-02's read, with nothing posted overnight; the invoice is 14 days overdue at this date.

New and synthetic: variation V-03 revision 1 "Screen drive 3 contactor upgrade", +$1,320.00 excluding GST, no time effect, reply by Tue 20 Oct, issued by Jamie Rossi on Tue 13 Oct 15:30, from Change review SYN-ECR-000014. PJ-05 holds no such record yet.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md):

| Field | Declaration |
|---|---|
| Scope identity | `scope:CP-06`, `/portal/commercial` (not built), stage CP5; the parent IDs above, all 78 preserved |
| Page type (r20) | Overview / dashboard (home). Register / worklist (quotations, variations, orders, invoices). Document & evidence workspace (exact issued quotation and variation, proof of delivery). Form / guided workflow (reply, invoice query, problem report) |
| Reused components | CP-01 portal shell: Header, Context switcher, Account button, Nav item, Phone header, Tab item, Footer, Card header and Placeholder. CP-04 sub tab, card and urgent-line styling. CP-02 Text area, Choice, Step and Text field. The quote page's document content. Components page: Button, Tag, Font Awesome Pro Light icons through the Kit |
| Incoming handovers | Issued quotation revisions (Quotation release, Quotation page ES-05); issued variations (PJ-05, from Change review EN-07); dispatch, carrier, tracking and proof of delivery (SC-06 · SC-07, M1); invoices, credit notes, payments and balance (FN-02, MYOB read); the commercial grant (CP-01 D11) |
| Outgoing handovers | Reply: a customer message to the named sender, kept with the exact revision; staff record any response on ES-06 or PJ-05. Report a problem and Query an invoice: a prefilled Support request (CP-02); Service or Finance owns the follow-up, and Finance records any dispute on FN-02. Downloads serve the exact retained file. Nothing posts to MYOB, applies a payment, changes an order or confirms a delivery |
| Source authority | The sources listed above; Dean's brief of 23 October 2026; synthetic fixtures |
| Proposed departures | D1–D16 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | Waits for Dean (section 7) |

## 4. What the design shows

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | Separate grant, separate slices. "Quotations & account" appears only with the commercial grant, and each tab only when its slice is delivered, granted and its source can be read. Requester or coordinator membership grants nothing | Design §3, §5; CP-01 D4; CPA-15 |
| D2 | One navigation item and five tabs (Overview, Quotations, Variations, Orders & deliveries, Account) at `/portal/commercial`, rather than four navigation items | Proposed composition; CP-01 D2 |
| D3 | Overview cards each name their source and read time. A card whose source fails says so and shows no old figures | CP-01 D5; FIN-06 |
| D4 | A quotation shows the exact retained issue, Download PDF and Reply to the sender. No Accept or Sign. A replaced revision shows no prices and no link to its successor; validity ended and withdrawn behave as on the quote page | Quote view tracking §4.2, §4.6, Q9; DOC-02; EST-08 |
| D5 | Reply sends a customer message to the named sender, kept with the exact revision. Staff record any response on ES-06 or PJ-05; "Response recorded" shows only after they do | Design §6; EST-08 |
| D6 | A variation shows its exact issued revision: what changes, why, price and time effect as issued (excluding GST, as PJ-05 keeps them) and the reply-by date, with Reply or Ask a question. Approving online appears only as a labelled proposed departure under D-024; nothing on the page approves a variation | PJ-05 decision; design §8 |
| D7 | Orders & deliveries is the customer side of SC-06 · SC-07 and M1: carrier and tracking number exactly as recorded, the expected time labelled as the carrier's estimate, Delivered only with proof of delivery, and the proof limited to quantities received. Report a problem opens a prefilled Support request | SC-06 · SC-07; customer messages; CP-02 |
| D8 | Account figures come from one complete MYOB read with "Figures as at". The balance shows only when it reconciles and is never worked out from a filtered list. A partial or failed read shows no figures | FIN-01, FIN-02, FIN-06; FN-02; EI-1 |
| D9 | Status always in words with a tag tone. The customer sees "you queried it", never Finance's internal dispute reference | Brief; FN-02 |
| D10 | Query an invoice opens a Support request prefilled from the same read. It doesn't hold the invoice or record a dispute; Finance does that on FN-02 | Brief; CP-02; FN-02 |
| D11 | Nothing on the page pays, applies a payment, posts to MYOB or edits a document. A wrong invoice is corrected by a credit note | EI-1 to EI-4; FIN-02 |
| D12 | Two representatives tell the story (Q2) | ES-05; FN-02; design §9 |
| D13 | The story runs as at Wed 14 Oct, 10:00 (Q1) | SC-06; EN-07; FN-02 |
| D14 | New synthetic record V-03 revision 1. The internal cost impact on Change review and any margin are never shown | EN-07; design §3 |
| D15 | Phone: one column of cards, a labelled "Show" selector in place of the tabs, 16 px text and inputs, 48 px buttons, and the tab bar Home · Support · Account. The tracking number is selectable with Copy | Design §10; CP-01 D12 |
| D16 | A link to a slice the person isn't granted shows a non-enumerating "isn't available to you" page; a change of access clears the page and lists what remains | Design §9; CP-01 D9; CPA-15 |

Frames added beyond the brief so that every main action has a destination: Quotation reply, Quotation replaced, Variation question, Variation reply sent and Report a problem on desktop; Variation with reply and Quotation reply on phone.

## 5. What this does not decide or build

- `/portal/commercial`, its capability, read models and adapters are not built, and no capability is added to `src/platform/permissions.ts`. CP5's entry dependencies in the implementation plan still apply.
- D-024 stays open. Online acceptance or approval needs its own decision.
- The quote page's public link (`/quote/[token]`) and this portal view are separate routes to the same retained issue. Quote view tracking lists the portal view as later work; how portal views count towards that record's view tracking is not decided here.
- Not drawn: the validity-ended banner (as the quote page), the review step of an invoice query or problem report (CP-02 review), a recorded response on a variation, phone frames for Delivery with proof, Report a problem and Query an invoice, and tablet frames other than Account.

## 6. Verification

Audit of 30 October 2026, by script and screenshots: 36 frames and 1,627 visible texts, Roboto only; no text past its frame; no overlap and nothing outside a section; no margin, internal cost, internal dispute or punch reference, and no Accept or Sign button; every frame showing the balance names MYOB and its read time.

Both flows were played in the Figma desktop app, and about 30 of the 96 links were clicked by hand, covering each main path; the rest were traced in code. Playback found three defects, fixed and replayed: the revision 1 row dead-ended in a phone state; Ask a question and the reply panel's close did nothing; and the quotation reply's choice didn't match its text.

Open for those pages' next change, not changed here:
- CP-01's Portal / Phone header cuts a long site name at 390 px (recommended: wrap, as at 320 px).
- Glasshouse 4 is Riverbend on FN-02, SC-06, EN-07 and CP-03 but Hillview on CP-01.
- FN-02's dispute SYN-DSP-000001 shares the SYN-DSP- prefix with dispatches such as SYN-DSP-000058 (recommended: a separate type for disputes).

Design acceptance is not functional, business or deployment acceptance. CPA-15 stays Not run.

## 7. Named version

Dean saves the named Figma version "Quotations & account — accepted" himself. This pull request stays in draft until he confirms it.
