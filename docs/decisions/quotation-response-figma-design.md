---
document_id: PPO-ES06-QUOTATION-RESPONSE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design, 30 October 2026; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Quotation response design — owner decision

The page `/estimating/quotes/[id]/response` is built (`QuotationResponse` in `src/components/quotation-response.tsx`) from the [native response decision](quotation-response-native.md), but it had no Figma design. Its earlier design is the ES-06 r01 HTML ([record](quotation-response-negotiation-design.md)), whose customer signing view the native decision declined. The [Customer response FI-07 design](customer-response-figma-design.md) is a different page, for field reports; this record uses the name "quotation response" to keep the two apart.

On 23 October 2026 Dean asked Claude to design the page in Figma as the staff record of the customer's answer, any negotiation, and preparation for conversion. Claude drew it from these sources:
- the [native response decision](quotation-response-native.md) for every rule of the page;
- the [quote view tracking decision](quote-view-tracking.md), Q9: no Accept button in this stage;
- the [conversion decision](quotation-conversion-native.md) and the [Won handover decision](won-delivery-continuity.md) for the two outgoing steps;
- the accepted [Quotation detail design](quotation-detail-figma-design.md) for the story, the record header and the lifecycle step;
- the [Deal record design](deal-record-page-design.md), Q3, for the lost reasons.

Claude asked "Do you accept the Customer response design?" after listing the recommended answers to Q1–Q7 and flagging Q8. On 30 October 2026 Dean answered with the offered button: "Accept, lock it in". The button's full text was "I accept the Customer response design with your recommendations, including D1–D15 and Q1–Q8. Lock it in."; the words that reached the session were the label. This record reads the reply as adopting D1–D15 and the recommended answers.

Scope:
- Register entries `route:/estimating/quotes/[id]/response` and `scope:ES-06`. The route is unchanged.
- Parent requirements EST-08 (record customer response, prepare conversion) and CRM-02 (close outcomes and lost reasons), with EST-03 and OUT-06 as the native decision traces. All parent IDs are unchanged.
- This records a design. It changes no application code, route, migration, capability, grant, contract, service or customer message.

## 1. What the owner decided

| Question | Answer | Effect |
|---|---|---|
| The design | Accepted as drawn: "Accept, lock it in" | D1–D15 (section 4) |
| Q1 What evidence an acceptance needs | Resolved as recommended | An email linked from Emails or a signed PDF. A call note records a verbal acceptance but is not written evidence |
| Q2 Who may record responses | Resolved as recommended | The deal owner and the quotation owner. This departs from the built rule (`SYN-ES06-01`, current estimate owner only) and needs a capability decision before build (section 5) |
| Q3 Whether acceptance prompts Won automatically | Resolved as recommended | Prompt only. The deal owner marks Won on the deal, which starts CR-03 |
| Q4 Whether a verbal acceptance is enough to prepare conversion | Resolved as recommended | No. It is recorded, and ES-07 preparation waits for written evidence. This adds a condition to the built preparation rule (section 5) |
| Q5 Whether Declined carries a lost reason | Resolved as recommended | Yes, from the Deals list (Price, Competitor, Timing, No decision), suggested to the deal owner and never applied to the deal |
| Q6 Report numbering | Resolved as recommended | #1, #2 and so on per issue, with the full response ID where it matters: preparation and details |
| Q7 Default owner of ES-07 preparation | Resolved as recommended | The quotation owner, changeable |
| Q8 The accepted Quotation detail frame | Resolved as recommended | Quotation detail's Response frame `2149:1799` shows the 15:42 phone acceptance only. Add the 10:30 clarification and the 16:08 email when that page next changes. It is not edited here |
| Building the page to this design | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Customer response · ES-06" `2244:50787`, after Quotation page & customer views `2221:85`, at the named version "Customer response ES-06 — shared record layout, accepted". The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Desktop 1440 | Overview, no response `2245:734902` (flow start "Response — desktop"); Record response, Accepted by email `2245:740015`; Clarification, confirmation pending `2245:740485`; Negotiation hold on price `2245:749173`; Prepare successor revision `2245:749625`; Correct a response `2245:754654`; Prepare for ES-07 review `2245:755106`; Prepared for ES-07 review with the Won prompt `2245:755595`; Declined with reason `2245:763644`; Response history `2245:764053`; Superseded issue r1 `2245:764492` |
| Tablet and phone | Tablet 1024, record response `2245:791935`; phone 390 overview `2245:792499` (flow start "Response — phone") and record response `2245:792723`; phone 320 overview `2245:797796` and record response `2245:798020` |
| States | Loading `2245:773254`, no access `2245:773614`, stale `2245:773976`, uncertain save `2245:774205`, issue superseded while recording `2245:783233`, not eligible for conversion `2245:783666` |
| Notes card | `2245:807288`: story, D1–D15 with their basis, Q1–Q8 with the adopted answers, what is never shown and what is not drawn |
| Page parts | Response / Response card `2245:2504`, Correction link `2244:734757` (Corrected by, Corrects), Hold banner `2244:734786` (Hold, Pending, Ready, Info), Input `2244:734851` (Text, Select, Date, Textarea at Desktop and Phone), Outcome option `2244:734867` (Default, Selected, Unavailable) and Evidence item `2244:734868`. At acceptance they moved to the Components page `1:4`, section "Components · Estimating parts" |
| Shared parts | Record / Header, Criterion row, History item and Filter chip; Quotation detail / Lifecycle step and Customer views line; Job pack / Select row, Decision dialog and Form field; Tag; Button; Brand / Logo; Shell / Top bar with the Conversations action (badge 3); Shell / Phone header · compact; the A1 Sales rail with its Quotations item |
| Prototype | Flows "Response — desktop" and "Response — phone", with 19 linked layers: overview to record to prepare to prepared; negotiation to the successor dialog; the phone overview and record |
| Retained captures | [Quotation response design r01](../reference/ui/estimating/quotation-response-design-r01/README.md): 22 icon-free PNGs at exact frame size, with hashes. The capture copies are `2771:524641`–`2771:530300` on the Captures page, from y = 490,000; the File index row is `2771:519530` |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `route:/estimating/quotes/[id]/response` and `scope:ES-06`; parent requirements EST-08 and CRM-02, with EST-03 and OUT-06 as traced by the native decision, unchanged |
| Page type (r20) | Document & evidence workspace, with guided staff forms (Form / guided workflow) to record, correct, clarify and prepare. Phone: one record page with the compact record header and a sticky action bar |
| Reused components | Section 2, shared parts |
| Incoming handover | The exact ES-05 issue and send (Quotation detail, Release); a customer's reply email from Emails EC-01, linked as evidence and never parsed; a call note from Calling and call logging; Customer views from quote view tracking, read-only |
| Outgoing handover | The ES-05 successor path (Prepare successor revision); ES-07 receiving review (Prepared for ES-07 review, nothing sent); a prompt to the deal owner to mark the deal Won, which starts the CR-03 won-deal handover, or to record Lost on the Deal record CR-01. Prompts only |
| States shown | Section 2 |
| Departures | Staff evidence workspace, not customer signing, as the native decision declares; D1–D15 below; the built-rule differences in section 5 |
| Verification | Section 6 |

## 4. What the design shows

The story is synthetic, as at Tue 13 Oct 2026, 09:00, then through the day: SYN-PPO-QUO-000188 r2, Option A, $81,200.00 excluding GST, for SYN Woodhaven Nursery, Potting Shed 2; deal SYN-PPO-OPP-000326, deal owner Sasha Clarke, quotation owner Alex Lee; issued on Wed 7 Oct and sent on Mon 12 Oct at 15:02, as on Quotation detail.

- 10:30: the head grower, Morgan Tate, phones asking to swap the 2.2 kW drive motor for 3 kW: Clarification #1. Alex Lee answers at 10:52, information only, and it is sent at 10:58. Morgan confirms by email at 11:40, recorded at 11:44.
- 15:42: Jamie Ellis accepts by phone: #2, recorded at 15:44 with the claimed role "Owner", corrected at 15:51 by #3, as Quotation detail shows.
- 16:08: Jamie emails the acceptance: #4, with the email linked.
- 16:20: prepared for ES-07 review, and Sasha is prompted to mark the deal Won.

The second quotation, SYN-PPO-QUO-000197 r1 (Fertigation dosing skid, SYN Meadow Growers), is held by a Negotiation on price. The Declined example is SYN-PPO-QUO-000199 r1 (SYN Ridgeway Orchids). Invented here: Morgan Tate, the clarification, the 16:08 email, the response numbers and IDs, SYN-PPO-QUO-000197 with SYN-PPO-OPP-000338 and Robin Hart, SYN-PPO-QUO-000199 with SYN-PPO-OPP-000341 and Casey Nguyen, and the stale and superseded-while-recording alternatives. No existing reference is renamed.

The design never shows an online customer acceptance, an edited or deleted response, a response carried to a successor, or a deal marked Won or Lost automatically.

| ID | Departure or decision | Basis |
|---|---|---|
| D1 | One page per issued revision, on the Release page shell: breadcrumb "quotation / Response", record header, a four-step response lifecycle (Issue, Customer response, Open items, ES-07 preparation), main column and side column | Release page `2229:471`; Quotation detail record layout; page contract |
| D2 | Staff record what the customer said. There is no Accept or Sign button anywhere, for staff or customers | Quote view tracking Q9; D-024; native decision |
| D3 | Four outcomes as radio cards with words: Accepted, Declined, Clarification, Negotiation. Each report keeps the recorder, the respondent and claimed role, the reported time, the server time, evidence and rationale, and names the report before it | Native decision |
| D4 | Correct a response: choose the original, explain what was wrong, save a complete replacement report. Both stay visible, linked "Corrected by #3" and "Corrects #2". Nothing is edited or deleted | Native decision |
| D5 | Clarification: the question, an attributable information-only answer, and a separately recorded respondent confirmation; acceptance is held until it is recorded. A wanted change is a Negotiation | Native decision |
| D6 | Negotiation holds the issue permanently (preparation and new acceptance). "Prepare successor revision" opens ES-05 with a note for the estimator; r2 starts with no response | Native decision |
| D7 | A superseded issue keeps its responses; nothing transfers; acceptance is refused on it; a late historical report stays on it | Native decision |
| D8 | Prepare for ES-07: eligibility checks listed in words, owner, due date, note and confirmation of the exact response ID. The result reads "Prepared for ES-07 review" with five disclosures (authority, signature, terms, validity, conversion policy). Nothing is sent, received or converted | Native decision; conversion decision |
| D9 | After preparation the deal owner sees "Mark the deal Won to start the delivery handover (CR-03)" with Open deal. Declined prompts the deal owner to record the outcome, suggesting the lost reason. Neither changes the deal | Won handover decision; Deal record Q3 |
| D10 | Evidence is linked, never parsed: an email from Emails, a signed PDF, or a call note from the call log | Emails EC-01; Calling and call logging |
| D11 | Customer views appear read-only in the side column and are never a response | Quote view tracking section 4 |
| D12 | Phone (the deal owner after a call): compact Record header, content first, outcome cards stacked, 16 px inputs with 48 px boxes, 48 px buttons in a sticky bar. At 1024 the rail collapses and the form takes the full width | Phone header amendment P1–P9; Quotation detail tablet |
| D13 | States: loading; no access with protected content removed; stale with entries kept and a compare; uncertain save with the original kept and replacements held; issue superseded while recording; not eligible with reasons listed | Native decision recovery rules; page contract |
| D14 | Status always has words: tags, hold banners and check rows name the state; colour only supports it | Page contract; Quotations design |
| D15 | Six parts stayed on the page until acceptance and then moved to Components | Components rule, 17 October 2026 |

## 5. Not decided and not drawn

- **Building the page.** The built page differs from this design and needs its own authorisation and pull request. Three differences change rules, not only layout: more than one recorder (Q2) needs a capability decision; written evidence before preparation (Q4) and a typed evidence link (Q1, D10) change the [response contract](../contracts/quotation-response.md); a lost reason on Declined (Q5) needs a field. The native decision and the contract stay authoritative for the running page until then.
- **Not drawn:** the ES-07 receiving page, which has its own proposal; Deal record changes; tablet and phone versions of the states; the clarification answer form, which mirrors the confirmation form; 200% zoom.
- **Related records not edited:** Quotation detail's Response frame (Q8) and the Deal record.

## 6. Verification

- A scripted check on 23 October 2026 found no overlapping frame, nothing outside its section, no clipped text, no placeholder text and no off-page link. The Figma file audit later relinked the top bars to Shell / Top bar and bound colours across proposal pages, and the frames stayed in place; the page was re-read at lock-in and its frames, flows and parts were present.
- The prototype was not played in Present mode before acceptance.
- The 22 captures are copies of the accepted frames with all 623 Font Awesome icons swapped for `Icon/placeholder`; a check after the swap found no Font Awesome instance left and no loose vector outside the placeholder and the logo. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/quotation-response-design-r01/README.md).
- The named Figma version "Customer response ES-06 — shared record layout, accepted" was saved on 30 October 2026, on Dean's explicit yes ("Yes, save it"), by Claude in the Figma desktop app.
