---
document_id: PPO-ES05-QUOTATION-DETAIL-FIGMA-DEC
date: 2026-10-23
owner: Dean Fiedler
status: Owner-accepted design, 23 October 2026; native implementation and UI baseline acceptance separate
source_commit: 01cef3916c874159a9404f737065292ae2466046
versioning: git
---

# Quotation detail design — owner decision

The accepted [Quotations design](quotations-design.md) drew only the register. Its record window opens "Open release" (`/estimating/quotes/[id]/release`, ES-05) and "Open response" (`/estimating/quotes/[id]/response`, ES-06), and its "…" menu opens the quotation itself, `/estimating/quotes/[id]`, which had no design. The page is built: `QuoteDetail` in `src/components/estimating-screens.tsx` shows the draft output of an E1 quotation and, once a release exists, renders the ES-05 release workspace in its place.

On 23 October 2026 Dean asked Claude to design that page in Figma as the hub of one quotation across its life: revisions, state, the exact issued document, recipients and the send outcome, customer views, the response and conversion, with every decision left on the release, response and conversion pages. Claude drew it from these sources:
- the Quotations design and its amendment A1 (one register in the Sales and Estimating rails, the deal owner sends, the follow-up view; accepted 16 October 2026, Figma frames `1044:1552`);
- the [quote view tracking decision](quote-view-tracking.md), sections 4 to 7 (option B, accepted 19 October 2026);
- [ADR-0059](ADR-0059-email-sending-from-ppo.md) (Proposed) for the send outcomes;
- the [release](quotation-release-native.md), [response](quotation-response-native.md) and [conversion](quotation-conversion-native.md) decisions, and CM9 of the [estimating model](estimating-configurator-model.md) (appendices bound at preparation);
- the accepted [Deal record design](deal-record-page-design.md), whose shared record layout and Estimates & quotations tab supply the story, and `QuoteDetail` for what exists today.

Claude then ran an audit and polish pass at Dean's request ("Carry out an audit and polish on the pages to ensure they are correct and as professional as possible. If you discover any new and/or innovative features that could be included while you are carrying out the audit, feel free to add them to the design."), which added D13–D16 (section 6). Dean then accepted the design on 23 October 2026: "I accept the Quotation detail design with your recommendations, including D1–D16 and Q1–Q11. Lock it in." That adopts departures D1–D16 and the recommended answers to Q1–Q11.

Scope:
- Register entry `route:/estimating/quotes/[id]` ("refine"), related to `scope:ES-05` (release), ES-06 (response) and ES-07 (conversion). The route is unchanged.
- Parent requirements EST-03, EST-07, EST-08 and OUT-06. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, view tracking, sending, customer page or customer message. Quote view tracking stages QV-S1 to QV-S3 and ADR-0059 each keep their own gates.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Quotation detail as the hub of one quotation | User decision, 23 October 2026 | Dean's brief: "Your task is to design and build the Quotation detail page (/estimating/quotes/[id]) in Figma as a proposal for my review" |
| Audit and polish, with new features allowed | User decision, 23 October 2026 | Dean's words quoted above. Section 6 |
| Departures D1–D16 | Accepted as recommended, 23 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which quotation is the story | Resolved as recommended | SYN-PPO-QUO-000188 from the Deal record (deal owner Sasha Clarke, $81,200.00 excl. GST, r1 replaced, Accepted on 13 Oct at 15:42), with the brief's send on Mon 12 Oct at 15:02. The register's issued SYN-QUO-0079 r2 has no deal or deal owner and stays as drawn there. The Deal record's 7 October history line ("Quotation issued … Sent to Jamie Ellis") is not edited; when CR-01 is next changed it splits into Issued (7 Oct) and Sent (12 Oct) |
| Q2 Rails | Resolved as recommended | The page opens in the Sales rail (A1 Quotations item) for deal owners and in the Estimating rail for estimators. The rail is the department you arrived from; the page, route and breadcrumb stay the same |
| Q3 First tab by state | Resolved as recommended | Document by default; Distribution when the latest send is Failed or Not confirmed; Response once any response is recorded. The tab is kept in the link, so a shared link reopens the same tab |
| Q4 Margin for deal owners | Resolved as recommended | No, and not for anyone on this page. It shows customer-safe values only (OUT-06); estimators see cost and margin on the estimate |
| Q5 The 5-working-day suggestion | Resolved as recommended | It goes to the deal owner, with the quotation owner told in Updates, and to the quotation owner only when there is no deal owner. This refines quote view tracking Q7 (which named the quotation owner) under A1, where the deal owner sends and follows up |
| Q6 Withdrawn link on the lifecycle | Resolved as recommended | Yes, as a fact on the Sent step ("link withdrawn 10:05"), with a banner and a Distribution row. It is not a separate step, and earlier views stay |
| Q7 Possibly automatic views in the line | Resolved as recommended | Every view is counted and the line says how many may be automatic: "Viewed 3 times · 1 may be automatic · last today 9:12 · PDF downloaded" |
| Q8 Validity date | Resolved as recommended | "Valid until" shows once release validity (amendment A09, UXB-20) is built; until then the application shows "Not configured". The drawn dates are synthetic |
| Q9 Privacy statement on the customer page | Resolved as recommended | Yes, one line saying Powerplants records when the page is opened and the PDF downloaded, without name, device or location, linked to the privacy notice. The exact wording waits for the privacy notice |
| Q10 Who may open the Customer page preview | Resolved as recommended | Anyone who can read the quotation. The preview shows the issued bytes only, no view data, and records no customer view |
| Q11 The linked-records chain and revision compare here first | Resolved as recommended | Yes. UXB-06 and UXB-18 are adopted for this page only; their wider rows in the UX benchmark register stay Proposed |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Quotation detail · ES-05 · ES-06" `2142:82` (after Quotations `123:40`), at the named version "Quotation detail — shared record layout, accepted". The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Desktop 1440 | Document tab, issued and viewed, full length `2147:87` (flow start "Quotation — desktop"); Customer page preview, full length `2159:3635`; Revisions `2148:697439`; Revision compare `2161:7255`; Distribution, send outcome unknown `2148:697929`; Customer views Details `2149:807`; tracking off before the privacy gate `2149:1355`; Response, Accepted with a correction `2149:1799`; Follow-up `2149:2313`; History `2161:7837`; Draft revision, Estimating rail `2151:1720` |
| Tablet and phone | Tablet 1024 `2151:2396`; phone 390 top `2153:2701` (flow start "Quotation — phone") and scrolled to the document `2153:2743`; phone 320 top `2153:2772` and scrolled `2153:2812` |
| States | Loading `2155:2340`, not found or no access `2155:2712`, stale `2155:3068`, link withdrawn `2156:2705`, validity ended `2156:3136`, replaced revision r1 opened `2156:3570` |
| Notes card | `2157:3398`: story, D1–D16 with their basis, Q1–Q11 with the adopted answers, kept rules, what is not drawn and the audit log |
| Page parts | Quotation detail / Lifecycle step `2145:107` (Done, Now, Not yet, Attention), Customer views line `2145:108`, Linked chain row `2158:700213` (Done, Current, Next) and Document view switch `2159:3604`. At acceptance they moved to the Components page `1:4`, section "Components · Estimating parts" |
| Shared parts | Record / Header, View tab, Field, Section heading, History item, Filter chip and Banner; Grid / Header cell and Cell; Tag; Button; Brand / Logo; Shell / Phone header · compact; the A1 Sales rail with its Quotations item and the Estimating rail from the Quotations page; the top bar with the Conversations action (badge 3), detached as on the other proposals |
| Prototype | Flows "Quotation — desktop" and "Quotation — phone": tabs, the Customer views line, the Document view switch, Compare with r1 and back, and the phone document links |
| Retained captures | [Quotation detail design r01](../reference/ui/estimating/quotation-detail-design-r01/README.md): 22 icon-free PNGs at exact frame size, with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `route:/estimating/quotes/[id]` ("refine"), related to `scope:ES-05`, ES-06 and ES-07; parent requirements EST-03, EST-07, EST-08 and OUT-06, unchanged. Reached from the Sales and Estimating rails (A1) |
| Page type (r20) | Record detail, with a Document & evidence workspace in the Document tab. Phone: one record page with the compact record header and a sticky action bar |
| Reused components | Section 2, shared parts |
| Incoming handover | The Quotations register (record window "…" › Open quotation, from either rail), the Deal record Estimates & quotations tab, Reviews & approvals, the My Work follow-up suggestion, the estimate and global search. Opening the page decides nothing |
| Outgoing handover | Open release `/estimating/quotes/[id]/release` (ES-05: prepare, approve, issue, Send); Record response `/estimating/quotes/[id]/response` (ES-06); Open conversion `/estimating/quotes/[id]/conversion` (ES-07); won-deal handover (CR-03); the estimate and the deal. Download PDF serves the exact retained PDF |
| States shown | Section 4 |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. What the design shows

The story is synthetic, as at Tue 13 Oct 2026, 09:00: SYN-PPO-QUO-000188 r2, Option A of deal SYN-PPO-OPP-000326 "Potting machine and take-off" at SYN Woodhaven Nursery, Potting Shed 2, contact Jamie Ellis, deal owner Sasha Clarke (who sends), quotation owner Alex Lee, $81,200.00 excluding GST. It was issued on Wed 7 Oct and sent yesterday at 15:02; a view at 15:02 is marked "may be automatic", views followed today at 08:41 and 09:12, and the PDF was downloaded at 08:47. The Response frame is the same day at 15:45, after the acceptance at 15:42. The Draft frame is SYN-PPO-QUO-000191 r1 (Option B), as on the Deal record.

### Desktop

- **Header** (Record / Header): the title, the state in words, record position, the quotation number and revision, the deal owner, customer, site, deal and validity. The primary action follows state (D3).
- **Lifecycle bar**: Prepared, Approved, Issued, Sent, Viewed, Responded, Accepted, Converted, each with its dated fact from its source or "Not yet". "Now" marks the step that needs action next; Attention marks an outcome that needs follow-up. It is never a percentage.
- **Details column**: Summary (customer, site, contact, value, deal owner, quotation owner), the Customer views line with Details, and the linked-records chain from lead to won-deal handover.
- **Tabs**: Document (the exact issued HTML, Download PDF, the three CM9 appendices and the issued fingerprint, with a switch to the Customer page preview); Revisions (r2 current, r1 Replaced, and Compare); Distribution (recipients and send attempts, kept apart from views); Customer views (the line, dated events, time per section and the limits); Response (each reported response and correction); Follow-up (the A1 follow-up, validity and the 5-working-day suggestion); History (by day, with filters).

### States

Loading, not found or no access, stale (a response recorded while the page was open), link withdrawn, validity ended (an alternative story as at Mon 9 Nov), and a replaced revision opened (r1).

### Tablet and phone

At 1024 the rail collapses, the header is detached so its actions fit, and Response, Follow-up and History sit under More. On the phone the compact record header (phone header amendment P1–P9) leads to the title, state, a lifecycle list, the Customer views line, the reflowed issued document and section links to the other tabs, with a sticky bar of Download PDF and Record response at 48 px.

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | One hub page for the quotation's whole life. Decisions stay on the release, response and conversion pages; this page links to them | Today `QuoteDetail` is a draft output view that renders the release workspace once a release exists |
| D2 | The eight-step lifecycle bar described above | Quotations Q4 lifecycle; ADR-0059 send outcomes; quote view tracking §4.4 |
| D3 | The primary action follows state: Draft, Not approved and Approved open the release; Issued and not sent offers Send to the deal owner (estimators see "With Sales to send"); Sent with no response offers Record response; Negotiation, Returned or validity ended offer Prepare revision; Accepted opens conversion; Converted opens the handover. Each opens its own page | A1 rules 5 and 6; the release, response and conversion decisions |
| D4 | Seven tabs. Counts are neutral; attention uses words | Quotations Q4 Files, Recipient and History tabs |
| D5 | The Document tab shows the exact issued HTML in a frame, with Download PDF, the CM9 appendices and the issued fingerprint. Nothing is re-rendered | Release decision; estimating model CM9 |
| D6 | Distribution keeps recipients and send outcomes (Sent, Failed, "Not confirmed — checking Sent items") apart from views; Delivered only with positive evidence | ADR-0059 delivery states; its wording follows ADR-0059's acceptance |
| D7 | Customer views follow §4.4: the line and Details with limits, shown only to the sender, the quotation owner and the deal owner, never naming a person. With tracking off the line reads "Not tracked" until the privacy notice is confirmed | Quote view tracking §4.4, §4.7 and Q6 |
| D8 | The Response tab lists every reported response and correction, current issue first; corrections append; historical reports are marked not applicable | Response decision |
| D9 | The Follow-up tab: the A1 follow-up, dated when sent and in the deal owner's My Work; validity and expiry; the 5-working-day suggestion | A1 rules 2, 3 and 5; quote view tracking Q7 and §4.6 |
| D10 | Sales rail for deal owners, Estimating rail for estimators; one route; the breadcrumb reads "Quotations / reference" either way | A1 rule 1 and Q1; shell top bar amendment R1 |
| D11 | The phone and tablet compositions described above | Phone header amendment P1–P9 |
| D12 | The story uses the Deal record's SYN-PPO-QUO-000188. Invented here: the r1 value $78,900.00, the line amounts, validity dates, appendices, hashes and approval times. No existing reference is renamed | Q1 |
| D13 | A linked-records chain in the details column: lead, deal, estimate, this quotation, conversion and won-deal handover, each with its status in words and one click. It replaces plain linked-record fields | UXB-06, adopted for this page (Q11) |
| D14 | A Document tab switch between "Issued document" and "Customer page". The preview shows the customer quotation page as the recipient sees it (the Powerplants frame, Download PDF, the sender's contact, a one-line privacy statement), the link's state with Copy link and Withdraw link, and the notices a customer sees when the quotation is replaced, the link withdrawn or validity ended. Opening it records no view | Quote view tracking §4.2, §4.5 and §4.6; Q9 and Q10 |
| D15 | Revision compare: r1 against r2 by section, with the price and wording changes, the total difference and the unchanged sections, using customer-safe values only | UXB-18, adopted for this page (Q11); each revision is exact and immutable |
| D16 | The History tab: every fact by day, filtered by Revisions, Sends, Customer views, Responses and Follow-ups, with counts. Views never name a person | Deal record history pattern |

## 5. Not decided and not drawn

- **Building the page.** The hub needs a quotation-level read across revisions, releases, sends, views, responses and conversion, with restricted sources reported as restricted. Customer views need QV-S1, and real send outcomes need ADR-0059 accepted and QV-S2. Each needs its own authorisation and pull request; no capability is proposed here.
- **Not drawn:** Declined, Clarification, Negotiation, Returned, Held and Converted states (D3 gives their actions); the record "…" menu; phone sub-pages for the other tabs; the Send composer, which belongs to the release page; 200% zoom.
- **Related records not edited:** the Deal record's 7 October history line (Q1) and the register's SYN-QUO-0079 story.

## 6. Audit and polish

Before acceptance Claude audited every frame for shell parts, fonts, bound colours, clipped text, overflowing rows and overlaps, and fixed what it found:
- the lifecycle cells were made equal height;
- the details column was compacted so it fits the 900 px frames (validity stays in the header, the visibility rule in the Customer views tab), except the withdrawn-link state, about 14 px over;
- the stale banner was aligned with the story (the response at 15:42);
- History counts were matched to the events in each frame;
- no record reference truncates; two cut-off cells, a doubled tab badge, the tablet top bar and the tablet document heading were fixed;
- a flow start duplicated by cloning was removed.

The audit added D13–D16: the linked-records chain, the Customer page preview, the revision compare and the History tab.

## 7. Verification

- Every text uses Roboto or Roboto Mono on PPO text styles, and every text colour is bound to a PPO colour variable. A scripted check found no overlapping frame, nothing outside its section and no clipped text.
- The prototype has 75 links and two flows. It was not played in Present mode before acceptance.
- The 22 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`; a check after the swap found no Font Awesome instance left. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/quotation-detail-design-r01/README.md).
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
