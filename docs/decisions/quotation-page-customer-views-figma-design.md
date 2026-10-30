---
document_id: PPO-ES05-QUOTE-PAGE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design, 30 October 2026; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Quotation page and customer views design — owner decision

The [quote view tracking decision](quote-view-tracking.md) (PPO-QUOTE-VIEW-TRACKING-PROP, accepted 19 October 2026) chose option B: a Powerplants page that shows the exact issued quotation, with staff seeing when it was viewed. It drew nothing. On 23 October 2026 Dean asked Claude to draw it: "Your task is to design and build the customer quotation page and the staff "Customer views" display from my accepted quotation view tracking decision, as a proposal for my review. Draw the page; do not stop at a written brief."

Claude drew the page and asked whether Dean accepted it. On 30 October 2026 Dean was asked "Do you accept the design with the recommended answers to D1–D15 and Q1–Q8?" and answered "Accept and lock in". That adopts departures D1–D15 and the recommended answers to Q1–Q8.

Scope:
- `scope:ES-05`, with the release page's Distribution step (`route:/estimating/quotes/[id]/release`). The customer page is a new route, indicative `/quote/[token]`. It stays unregistered until build stage QV-S1 adds it.
- Amendment frames for Quotation detail, the Deal record (`scope:CR-01`) and My Work (`route:/work`).
- Parent requirements EST-03, EST-08, CRM-03 and OUT-06. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, view tracking, sending, customer page, DNS change, privacy notice change or customer message. Stages QV-S1 to QV-S3 and [ADR-0059](ADR-0059-email-sending-from-ppo.md) keep their own gates. Tracking stays off for every real recipient until Dean confirms that the privacy notice covers it.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw the customer page and the staff display | User decision, 23 October 2026 | Dean's brief, quoted above |
| Departures D1–D15 | Accepted as recommended, 30 October 2026 | Dean's answer, quoted above. Section 4 |
| Q1 Heading and footer wording for customers | Resolved as recommended | The header reads "Quotation SYN-PPO-QUO-000188 · Revision 2" with "Valid until … · prepared for …", and the browser tab "Quotation SYN-PPO-QUO-000188 r2 · Powerplants". The footer carries only the privacy line, "Privacy notice" and the company imprint, with no marketing text. Final branding waits for D-024 and the privacy notice |
| Q2 The sender's photo | Resolved as recommended | No. Name, role, phone and email only. A link page can be forwarded, so it carries no more personal data than an email signature, and D-024 has not decided branding |
| Q3 "Tell me when it is first viewed" by default | Resolved as recommended | Off by default and set per send in the composer (A1-Q4 and quote view tracking Q7). A personal default can be a later preference |
| Q4 Section names | Resolved as recommended | From the template, mapped to fixed keys. Each template version marks its sections with one of summary, scope, pricing, options, terms, exclusions or appendices. Staff see the template's heading ("Included scope"), and anything unmapped counts as "Other" |
| Q5 Story section times | Resolved as recommended | The accepted figures on Quotation detail stand: Pricing 3 min 45 s, Terms 45 s, Exclusions and assumptions 30 s. The brief's "about 3 minutes on pricing and 1 minute 35 on terms" is not used, so both pages show one quotation identically |
| Q6 First-viewed notice and automatic views | Resolved as recommended | A view marked "may be automatic" does not set off the notice. Otherwise a link scanner would set it off seconds after sending |
| Q7 Visits to a withdrawn, replaced or closed link | Resolved as recommended | Not recorded. The notice pages record nothing; only an active quotation page records events |
| Q8 Appendices A to C on the customer page | Resolved as recommended | Not offered in this stage. The page offers the exact retained PDF only, as quote view tracking §4.2 says; the appendices stay with the quotation until a decision adds them |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Quotation page & customer views · ES-05" `2221:85` (after Quotation release `2244:50245`), at the named version "Quotation page & customer views — accepted". The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Customer page, desktop 1440 | Issued r2, full length `2223:121` (flow start "Quote page — customer"); section markers and active time, annotated for review `2223:242`; validity ended `2227:298`; older r1 without section markers `2227:690` |
| Customer page, phone | 390 first screen `2225:421` (flow start "Quote page — phone") and full length `2225:211`; 320 first screen `2225:526` and full length `2225:316` |
| Link states | Withdrawn `2227:878`, replaced `2227:909`, closed `2227:940`, phone notice `2227:971` |
| Staff, desktop 1440 | Send quotation composer, link only `2229:471` (flow start "Quote page — staff"); PDF attached with its warning `2229:1082`; tracking off by the privacy gate `2229:1378`; Withdraw link dialog `2231:1823`; Deal record Estimates & quotations tab with the line `2232:1711`; My Work follow-up suggestion `2232:2500`. Copied unchanged from Quotation detail for the flow: Document tab `2231:939` and Customer views Details `2231:1389` |
| Staff, phone 390 | Deal Quotes tab with the line `2234:2633`; Customer views sheet `2234:2884` |
| States | Not viewed yet `2236:2693`, viewed may be automatic `2236:2715`, send failed `2236:2729`, send outcome unknown `2236:2747`, tracking off `2236:2765`, a colleague reading the deal `2236:2779`, first-viewed notice `2236:2791`, older quotation `2236:2803`, link withdrawn `2236:2820` |
| Notes card | `2238:2753`: the story, D1–D15 with their basis, Q1–Q8 with the adopted answers, kept rules, the flows and what is not drawn |
| Page parts | Moved to the Components page `1:4` at acceptance. Estimating parts: Quote page / Header `2222:155`, Footer `2222:192`, Notice `2222:193`, Contact card `2222:156`, Download bar · phone `2222:213`; Quotation / Customer views table line `2222:221`; Send / Option row `2222:126`, Send / Switch `2222:101`. My Work parts: My Work / Suggestion card `2222:228` |
| Shared parts | Brand / Logo, Button, Tag, Record / Header, Record / Banner, Quotation detail / Lifecycle step and Customer views line, Shell / Phone header · compact (Record, 390), the A1 Sales rail with its Quotations item, the top bar with the Conversations action (badge 3), and the issued document from the accepted Customer page preview (r2 `2159:3764`, r1 `2156:3570`) |
| Prototype | Three flows and 29 links. Customer: click the Powerplants logo to step through the states. Staff: Send quotation, the quotation record, Customer views Details, Withdraw link. Phone: the customer page, the notice, then the deal's Quotes tab and its sheet |
| Retained captures | [Quotation page design r01](../reference/ui/estimating/quotation-page-design-r01/README.md): 29 icon-free PNGs at exact frame size, with hashes. The capture copies are `2771:467733`–`2771:512001` on the Captures page, from y = 470,000; the File index row is `2771:404435` |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-05`; indicative new route `/quote/[token]`, unregistered until QV-S1; related `route:/estimating/quotes/[id]`, `route:/estimating/quotes/[id]/release`, `scope:CR-01` and `route:/work`; parent requirements EST-03, EST-08, CRM-03 and OUT-06, unchanged |
| Page type (r20) | Customer page: Document & evidence workspace, external variant with no application shell. Staff: Form / guided workflow for Send quotation, and Record detail amendments. Phone: a one-column customer page with a fixed Download PDF bar, and the staff deal page with the compact record header and a sheet |
| Reused components | Section 2, shared parts |
| Incoming handover | Customer: the View quotation button in the correspondence email the deal owner sends from their own mailbox (ADR-0059 option C, Proposed), with one unguessable link per send. Staff: Send on Quotation detail (its D3) opens the release Distribution step; the deal's Estimates & quotations tab and phone Quotes tab; My Work. Opening a page decides nothing |
| Outgoing handover | Customer: Download PDF serves the exact retained PDF; questions and go-ahead go to the sender by email or phone, with no Accept or Sign. Staff: a send receipt with its outcome on Distribution; Customer views events on Quotation detail and the deal; responses are still recorded on `/estimating/quotes/[id]/response` (ES-06); follow-up through My Work. Never a status, response, stage or delivery change from a view |
| States shown | Section 2. Frames that show views assume the privacy gate is met; `2229:1378` and `2236:2765` show today's real state, "Not tracked" |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. What the design shows

The story is synthetic, as at Tue 13 Oct 2026, 09:12 AEST unless a frame says otherwise, and uses the record already accepted on [Quotation detail](quotation-detail-figma-design.md): SYN-PPO-QUO-000188 r2, Option A of deal SYN-PPO-OPP-000326 "Potting machine and take-off" at SYN Woodhaven Nursery, Potting Shed 2, contact Jamie Ellis, deal owner Sasha Clarke (who sends), quotation owner Alex Lee, $81,200.00 excluding GST, issued Wed 7 Oct and valid until Fri 6 Nov 2026. It was sent yesterday at 15:02; a view at 15:02 is marked "may be automatic", views followed today at 08:41 and 09:12, and the PDF was downloaded at 08:47. The deal frames keep the Deal record's own date, Thu 15 Oct. Labelled alternative stories: validity ended Mon 9 Nov, closed Mon 7 Dec, r1 Fri 25 Sep, My Work Wed 21 Oct. No new reference was needed and none is renamed. Invented here: the views and active time of r1 and the covering note.

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | The customer page sits outside the application shell in a plain Powerplants frame: a slim header, the exact issued document, a side column with the sender's contact and a "This quotation" card, and a footer. No navigation, sign-in or search | Quote view tracking §4.2; PPO-UI-CONFORMANCE (the customer document keeps its own masthead) |
| D2 | The issued document is the accepted preview's document. Only its responsive width changes: 760 px on desktop, full width on the phone. Nothing is re-rendered | §2.1 and §4.2; Quotation detail D5 and D14 |
| D3 | No Accept or Sign button anywhere. The contact card says "There is nothing to accept or sign on this page" and asks the customer to reply to the sender | Quote view tracking Q9; D-024 |
| D4 | Phone: the document reflows to one column under a compact customer header, with a fixed 48 px Download PDF bar. No third-party scripts or fonts; never indexed | §4.2 and §4.5; Dean's 48 px phone action rule |
| D5 | Withdrawn and closed show the same notice, "This link is no longer active"; replaced shows "This quotation has been replaced". All three show only Powerplants and the sender's contact: no quotation number, customer, site or prices, and no link to the new revision. Validity ended shows a warning banner above the readable quotation until the link closes 30 days later | §4.5, §4.6 and Q8. One wording for withdrawn and closed, so a forwarded link reveals nothing |
| D6 | The privacy line names section time: "Powerplants records when this page is opened, about how long each section is on screen, and when the PDF is downloaded, without your name, device or location." It refines Quotation detail Q9's line, which did not mention time. With tracking off, and on notices, the line is not shown. The Quotation detail preview keeps its retained wording until that page next changes | §4.3 SectionRead and Q4; Quotation detail Q9 (final wording waits for the privacy notice) |
| D7 | Send quotation composer: From (your own mailbox), To from the release recipients, Cc for this email only, subject, covering note and a locked View quotation block that PPO adds. Options: Attach the PDF (off, with a warning when on), Tell me when it is first viewed (off), Track email opens (A1, on, kept apart from views), and a line saying whether customer views are on | §4.1, Q2 and Q7; A1-Q1 and A1-D4; ADR-0059 option C; Quotation detail `2148:697929` |
| D8 | The release page is drawn only as far as its Distribution step: a four-step strip under the shared record header, with "What Jamie receives", the release recipients and "After you send" beside the composer. The other steps are not redesigned here | `scope:ES-05`; Quotation detail D3 |
| D9 | The privacy gate shows where it matters: the composer says view tracking is off and disables the view and email-open switches; the quotation and the deal read "Not tracked"; the customer page shows no recording line | §4.7; ADR-0059 section 5 |
| D10 | Customer views on the deal: a line under the issued revision in the Estimates & quotations table, and in each quotation card on the phone Quotes tab, where Details opens a sheet. Only the sender, the quotation owner and the deal owner see it; other readers see the send outcome only | §4.4 and Q6; Deal record R10 |
| D11 | My Work: one suggestion card for the deal owner when a viewed quotation has no response after 5 working days (Plan follow-up, Open quotation, Dismiss); the quotation owner is told in Updates. The optional first-viewed notice is one Updates item | Quote view tracking Q7; Quotation detail Q5; Q6 above |
| D12 | Withdraw link asks for confirmation and says what happens: the link stops at once, recorded views stay, nothing changes the quotation, its response or the deal stage, and sending again creates a new link. The action uses the danger colour | §4.5; Quotation detail Q6 |
| D13 | Two accepted Quotation detail frames are copied unchanged so the staff flow reads end to end. They are references, not amendments, and are not recaptured here | Quotation detail captures 01 and 06 |
| D14 | New page parts moved to Components at acceptance (section 2) | Components rule |
| D15 | An annotated copy of the desktop page marks the seven sections with their story times, and the r1 frame carries a note that it has no markers. Annotations are for review and are never shown to customers | §4.3 and Q10 |

### Kept rules

Views are evidence, never proof: no view, download or time changes the quotation's state, its response or the deal stage. Wording is only "Viewed", "Viewed · may be automatic", "Not viewed yet" and "Not tracked", never "Read" or a person's name. Events keep type and time (and a section's active seconds, rounded to 5), with no IP address, device, browser or identity, for 12 months. Delivery (Sent, Failed, Not confirmed) is never inferred from a view. Customer notices (M1–M4) are never tracked.

## 5. Not decided and not drawn

- **Building it.** QV-S1 (synthetic page and events), QV-S2 (real send, which needs ADR-0059 accepted) and QV-S3 (real recipients, which needs the privacy notice, ADR-0059 E5 and E6, and the D-020 review) each need their own authorisation and pull request.
- **Not drawn:** tablet 1024; 200% zoom and keyboard focus order; the release page's other steps; a rate-limited or unavailable customer page; Cc recipients' own links; a one-time email code, online accept and the portal view (later decisions); the privacy notice text.
- **Related records not edited.** The Deal record and My Work pages, the Quotation detail preview's privacy line, and their captures keep their bytes; the amendment frames here apply when those pages next change. The [Quotation release](../design/development/pages/route-estimating-quotes-id-release.md) Figma page `2244:50245` is a separate proposal, not accepted, which copies the composer frames `2229:471` and `2229:1378` unchanged.
- **A shared control to reconcile.** The file audit's Controls / Switch (`2648:7306`) is still proposed. Send / Switch stays until that control is adopted.

## 6. Audit and polish

Before presenting the page Claude fixed: the issued document's letterhead and contact wrapping at the wider width; the desktop header and footer gutters; the phone header wording; clipped stacked blocks on the phone; composer frames whose sending options fell below 900 px (now full length); the amendment tags that collided with neighbouring rows, replaced by a note band; a suggestion card clipped by a fixed height; the compact header hidden on the phone deal frames; and the composer's wording about who sees views.

## 7. Verification

- A scripted check on 23 October found no overlapping frame, nothing outside its section, every text in Roboto or Roboto Mono, every text colour bound to a variable, no Accept or Sign control on any customer frame, and no view wording that names a person. It is a layout and wording check and did not look for clipped text. Claude checked the frames by screenshot inside Figma.
- The prototype has 29 links and three flows. It was not played in Present mode before acceptance.
- Asked whether Claude or Dean should save the named version, Dean answered "Yes, you save it" on 31 October 2026. Claude saved "Quotation page & customer views — accepted" in the Figma desktop app and saw it at the top of version history. The header's Named version field was updated just after the save, so the saved version shows the field's earlier wording.
- The 29 captures are copies of the accepted frames with all 334 Font Awesome instances swapped for `Icon/placeholder`. A scan after the swap found no Font Awesome instance and no vector outside the placeholder and the Powerplants logo. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/quotation-page-design-r01/README.md).
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
