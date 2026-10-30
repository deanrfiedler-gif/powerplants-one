---
document_id: PPO-CP02-SUPPORT-REQUESTS-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; implementation, identity, hosting and live customer access separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Support requests design — owner decision

On 23 October 2026 Dean asked Claude to design and build "the 'Customer support request and conversation (CP-02)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/portal/support` is not built, so this design defines the build. Claude drew the page and presented it. Dean chose to play the flows before deciding ("Play flows first"), and Claude played them in the Figma desktop app on 30 October 2026 and fixed what that found (section 6).

Claude then asked "Do you accept the CP-02 design with the recommended answers?" and Dean answered: "Accept, lock it in". That adopts departures D1–D16 and the recommended answers to Q1–Q8.

Claude drew the page from these sources:
- the [customer portal direction](customer-portal-direction.md) (Dean, 6 September 2026: "design it now and implement it in bounded stages as the supporting workflows become ready");
- the [customer portal design](../blueprints/customer-portal-design.md), in particular §3 roles and grants, §5 screens, §6 records, §7 the CP1 request and conversation contract, §9 access and recovery and §10 UX;
- the [CP1 starter](../delivery/customer-portal-cp1-starter.md) and [acceptance procedures](../testing/customer-portal-acceptance.md) (CPA-01–CPA-06, CPA-12, CPA-13);
- the accepted [Portal home and access](portal-home-access-figma-design.md) CP-01 design, for the shell, the page parts and the first three status words;
- the accepted [Service requests](service-requests-figma-design.md) SV-01 and SV-02 design and [Customer messages](customer-messages-figma-design.md) EC-04 design;
- [ADR-0008](ADR-0008-p03-customer-intake.md), [ADR-0043](ADR-0043-service-request-lifecycle.md) (still proposed) and [ADR-0058](ADR-0058-outbound-customer-email.md);
- the Equipment, Sites and Warranty cases Figma pages, read only, for the story.

Scope:
- `scope:CP-02` "Customer support request and conversation", destination `/portal/support`, with proposed sub-routes `/portal/support/new` and `/portal/support/[reference]`.
- Page-register coverage under SVC-01, SVC-02, CRM-01, CRM-03, CRM-06, NFR-01, NFR-02 and NFR-09, with local acceptance CPA-01–CPA-06, CPA-12 and CPA-13 (all Not run). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, grant, identity provider, hosting, invitation, customer message or deployment. It does not settle D-024: Q1 records the recommended wording for that decision to adopt. ADR-0043 stays proposed.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CP-02 in Figma | User decision, 23 October 2026 | Dean's request quoted above |
| Play the flows before deciding | User decision, 30 October 2026 | "Play flows first". Section 6 |
| Departures D1–D16 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Customer status words (D-024) | Recommended answer accepted as direction; D-024 still open | Seven words: Received, Your reply needed, Reviewed by service team, Visit being arranged, Visit booked, Resolved, Closed. They keep the three CP-01 accepted and add Dean's later four. Dean's draft "Being reviewed" and "Waiting for you" are not used: Triaged is a finished review, and "Your reply needed" says what to do |
| Q2 Urgent issues | Resolved as recommended | Steer to phone on every Support screen and in the form, without blocking sending. No after-hours number until the urgent-contact and response policy names a verified one; until then "your usual Powerplants contact" |
| Q3 Who at Powerplants is notified | Resolved as recommended | The eligible service owner for the site, found by routing, gets one owned activity in My Work. No group broadcast. With no eligible owner, the portal refuses the request as unavailable before saving anything (design §6) |
| Q4 Coordinators seeing others' requests | Resolved as recommended | Yes, for their granted sites, with the raiser's name shown. Requesters see only their own. A request is recorded as shared with its site when raised; a requester-only option waits for a pilot |
| Q5 Photos before attachments (CP2a) | Resolved as recommended | Staff ask in a public message, the customer replies to the request notice email with the photo, and staff add it to the internal request. It is not shown in the portal until CP2a |
| Q6 Replies on a resolved request | Resolved as recommended | Allowed: the message is appended and the owner's follow-up becomes actionable; staff decide whether to reopen. On a closed request a reply starts a new linked request |
| Q7 Customer cancelling a request | Resolved as recommended | Not in CP1: no customer command changes request state. The customer replies "no longer needed" and staff close it |
| Q8 Next page | Resolved as recommended; since overtaken | Visits & reports · CP-04. Equipment & reports · CP-04 was drawn in a parallel session on 23 October, before this acceptance |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Not saved | Waits for Dean's explicit yes (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Support requests · CP-02" `2179:85`, under "— Customer portal —", after Portal home & access · CP-01. The page header `2179:154` holds the conformance declaration; the notes card `2179:189` and flows card `2179:230` are in Flows and notes. File index row "Row / Support requests · CP-02" `2771:2143` |
| Desktop 1440 | Support list `2181:91`; New request step 1 Where `2181:348`, step 2 What's happening `2182:659`, step 3 How to reach you `2182:901`, Review `2182:1095`; Received `2182:1296`; the new request just received `2193:4301`; Uncertain receipt `2182:1437`; Waiting for you `2183:1009`; reply sent `2183:1237`; Resolved with its report `2184:1427`; Visit booked `2184:1664`; staff public reply on a copy of the SV-02 record `2184:712108` |
| Tablet 1024 | Support list `2186:3460`; request detail `2186:3696` |
| Phone 390 and 320 | At 390: list `2187:2566`, steps `2188:714755`, `2188:714898`, `2188:715038`, Review `2188:715140`, Received `2187:2718`, just received `2766:4425`, detail with reply `2190:715870`, reply sent `2190:716235`. At 320: list `2187:2831`, steps `2189:3098`, `2189:3292`, `2189:3431`, Review `2189:3531`, Received `2187:2980`, detail with reply `2190:716055` |
| States | Desktop: new message while writing `2183:1467`, access lost while reading `2184:1880`. Phone 390: loading `2191:716067`, no requests `2191:716159`, no matches `2191:716243`, could not load `2191:716336`, access lost on a deep link `2191:716431`, submitting `2192:4006`, validation errors with input kept `2192:4126`, uncertain receipt `2192:4293`, request closed `2192:4418` |
| Parts | Moved on acceptance to Components › "Components · Customer portal" `2613:6751`, under the label "From Support requests · CP-02": Support / Request table header `2180:92` and tablet `2186:3444`, Request row · desktop `2180:110` and tablet `2186:3459`, Request card · phone `2180:123`, Message `2180:144`, Event `2180:150`, Choice `2180:172`, Text area `2180:221`, Detail row `2180:225`, Step `2180:247` |
| Prototype | Flows "CP-02 — desktop" (from the Support list), "CP-02 — phone" (from the Support list at 390) and "CP-02 — uncertain receipt". The paths are on the flows card |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST (site time, Brisbane). Priya Shah, Customer site coordinator at SYN Glasshouse 4 (Hillview Growers), as on CP-01. `SYN-TKT-000102` Bay 4 drippers running low (Your reply needed; Sasha Cole's 15:20 question as on CP-01 Home, plus a 15:22 request for a photo by email); `SYN-TKT-000098` Pump shed controller display flickers (raised by Grace Holt, Reviewed by service team, as on CP-01). New references: `SYN-TKT-000105` Screen motor 3 noisy since Friday, against Shade screen motor M-3 (`SYN-AST-000145`, the motor Equipment shows replaced on Thu 15 Oct); `SYN-TKT-000101` Vent 2 not closing fully (Closed); `SYN-TKT-000096` Irrigation pump losing pressure (Resolved, service report `SYN-RPT-000064` from CP-01). The later-stage frame adds M-3 to the visit already confirmed for M-4, `SYN-PPO-APT-000052` |
| Retained captures | [Support requests design r01](../reference/ui/customer-portal/support-requests-design-r01/README.md): 35 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CP-02` and `/portal/support` (not built). Page-register coverage under SVC-01, SVC-02, CRM-01, CRM-03, CRM-06, NFR-01, NFR-02 and NFR-09, unchanged; all 78 parent IDs preserved. Stage CP1, text only; attachments are CP2a |
| Page type (r20) | Register / worklist (Support list). Form / guided workflow (New request: three steps and a review, with Received and uncertain-receipt results). Record detail (a request with its customer-safe intake and public conversation). Staff frame: Record detail, an amendment to SV-02 |
| Reused components | The CP-01 portal parts: Header · desktop, Nav bar · desktop and Nav item, Phone header, Tab bar · phone and Tab item, Footer, Card header, Placeholder · to be decided, Publication row. Components page: Button, Tag and Font Awesome Pro Light icons through the Kit. Staff frame: a copy of the accepted SV-02 record frame. New: the Support parts in section 2 |
| Incoming handovers | Request support from Home, the Help guide "What to include in a support request" and "Ask about this visit" on a confirmed visit (CP-01 D13). A link in a request notice email (ADR-0058 shared mailbox; live sending not authorised). Permitted sites and equipment from the contact's current portal grant, read only |
| Outgoing handovers | Send request → exactly one canonical internal request in New (SV-01 and SV-02), its first public message and an owned activity for the eligible service owner. A customer reply → an immutable public message that makes the owner's follow-up actionable. A warranty-type request is assessed in Warranty cases after triage. A report link opens CP-04 (CP2a). The portal changes no request state, owner, priority, visit, work order or work authority |
| Source authority | The sources listed above. The earlier walkthrough is earlier direction only |
| Proposed departures | D1–D16 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | Not saved (section 7) |

## 4. What the design shows

### Status and who acts

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | Seven customer status words, each mapped to an internal fact: Received (request New, or Needs information with every public question answered); Your reply needed (an unanswered public question; a private clarification alone never shows it); Reviewed by service team (Triaged, no customer-visible work yet); Visit being arranged (a linked work order without a confirmed appointment); Visit booked (a confirmed appointment); Resolved and Closed (ADR-0043, proposed). CP1 delivers only the first three; the other four appear only when their owning stages publish events. Status is always a worded Tag, never colour alone | Design §7; CP-01 D6; Q1 |
| D2 | Who needs to act, in words, on every row and request: You, Powerplants service team or No one, with what is expected next | Design §5 |

### Support list

| ID | Departure or rule | Basis |
|---|---|---|
| D3 | A table on desktop and tablet and cards on phone, for the current site only (CP-01 D3). Search by reference, title or equipment; Show (Open, Your reply needed, Resolved and closed, All); Raised by. Needs-you first, then by last update. More load as you scroll; a total is stated only when every permitted request has loaded, otherwise no count | Design §5, §9 |
| D4 | Raised by is shown, and site coordinators see requests others raised at their sites. Requesters see only their own; nobody sees another site | Design §3; Q4 |

### New request and its result

| ID | Departure or rule | Basis |
|---|---|---|
| D5 | Three short steps and a review. Where: site required or "I don't know which site"; equipment optional, from the equipment shared for that site, or "I don't know, or it isn't listed". What's happening: summary 1–200, what is happening 1–4000, impact on production as four plain choices. How to reach you: from the contact record, never edited here. Review, with Change links back to each step | Design §5, §7 |
| D6 | "Photos coming soon" is a plain notice, never a drop zone or a disabled upload. When a photo is needed, staff say how to send it | Design §7; Q5 |
| D7 | Received shows only after the server confirms the commit: reference, time, what happens next and "Sending a request does not book a visit or authorise work." | Design §7 step 4 |
| D8 | Uncertain receipt: "We are not sure your request was received" with one action, Check if it arrived, which looks up the original operation and never sends a second copy. If it did not arrive, sending from there reuses the same operation. The request stays in memory only, and editing waits until the check | Design §7 step 4, §9; CPA-04, CPA-05 |

### Request detail

| ID | Departure or rule | Basis |
|---|---|---|
| D9 | The customer-safe intake (Your request), the public conversation (messages and status events in time order), Who needs to act and Reply. Staff appear as "Name, service team", as on CP-01. Internal notes, owner, priority, activities and internal statuses are never shown | Design §5, §6; CPA-06, CPA-12 |
| D10 | A message that arrives while the customer writes is shown marked New; the draft is kept and the customer sends it as is or changes it. Each send is its own operation; a retry cannot duplicate it | Design §7 step 5; CPA-06 |
| D11 | Access lost: content and the unsent draft are cleared, not hidden. An unavailable deep link reads the same whether or not the request exists | Design §9; CPA-01, CPA-02 |

### Staff side and notices (accepted amendments, drawn on this page only)

| ID | Departure or rule | Basis |
|---|---|---|
| D12 | On the SV-02 Updates tab, Reply to customer and Add internal note are separate actions, each with its own composer. The reply composer names the audience, offers "Ask for a reply" (which drives Your reply needed and the owner's clarification activity), previews exactly what the customer sees and the email notice, and says sent messages cannot be edited: a correction is a new message. Notes have no visibility toggle | Design §6, §7; CPA-06 |
| D13 | On a staff reply, the contact's notice choice sends a short shared-mailbox email ("There is a new message about SYN-TKT-000102 …") with a link, never the message text. This is a proposed new Customer messages class | ADR-0058; CP-01 D8 |

The Service requests SV-02 and Customer messages EC-04 Figma pages themselves were not edited. D12 and D13 are accepted as the design for those pages' next amendment.

### Later stages, phone and urgent help

| ID | Departure or rule | Basis |
|---|---|---|
| D14 | Later stages are shown and labelled: Visit booked (`SYN-TKT-000105`), Resolved with its report (`SYN-TKT-000096`) and Closed (`SYN-TKT-000101`). Each carries a "Later stage" placeholder, and CP1 builds none of them. A closed request offers "Ask about this again", which starts a new request linked to the old one | Brief; ADR-0043 (proposed) |
| D15 | Phone: cards, 16 px inputs, 44–48 px targets and full-width buttons. The form hides the tab bar, shows Close, "Step n of 4" and a progress bar, and pins Back and Continue to the bottom. In the full-length frames the reply box sits after the conversation; on a device it stays above the keyboard | CP-01 D12, Q4; design §10 |
| D16 | Urgent help on every Support screen and in the form: "Urgent or unsafe? Phone your usual Powerplants contact." Choosing "Production has stopped, or it is unsafe" repeats it; it never blocks sending | CP-01 D5; design §11; Q2 |

## 5. Not decided and not drawn

- **Building the page.** `/portal/support` is not built and the build order is not decided. CP1 runtime still depends on the readiness in the [implementation plan](../delivery/customer-portal-implementation-plan.md).
- **Prerequisites for a build:**
  - the CP-01 prerequisites: a local synthetic external-principal model, portal membership and grants;
  - portal request, public message and receipt records, with one canonical request per accepted operation (design §6, §7);
  - a routing rule that finds an eligible service owner for a site (Q3);
  - the staff public-reply command and its Updates tab in SV-02 (D12);
  - the request notice class in Customer messages (D13), which D-025's later stages must authorise.
- **Decisions still open:** D-024 customer wording (Q1 gives the direction), the urgent-contact and response policy (Q2), D-011 customer relationships, D-012 retention and D-022 identity and hosting. ADR-0043 stays proposed, and Resolved and Closed depend on it.
- **Not drawn:**
  - dark mode, 200% zoom and screen-reader output, checked at build;
  - Grace Holt's two-site view of Support;
  - the warranty hand-over inside Warranty cases;
  - the notice class on the EC-04 page;
  - a desktop closed request, and detail pages for `SYN-TKT-000098`, so those list rows have no destination.
- **Data in the frames:** the people, organisations, sites, equipment, requests, reports and visits are synthetic. They are not operational records and grant no access.

## 6. Audit and Present-mode play-through

- **Scripted audit, 23 October:** every visible text checked for font and stored against bound colour; clipping, overlaps and frames outside their sections checked. Fixed before presenting: lost text bindings on the Choice and Text area parts, the one-site header copied from CP-01 Home, bylines that wrap at 320, the tablet table width, and the staff copy's linked-work count.
- **Present mode, 30 October:** Claude played all three flows in the Figma desktop app and clicked every link. It found and fixed:
  - the phone Received frames had lost the reference number, a fault Claude's earlier clipping fix had caused;
  - the Review Change links, "Request support for something else" and the phone `SYN-TKT-000101` card had no destination;
  - the uncertain-receipt frame could not be reached from any flow, so it gained its own flow;
  - phone "View request" had no page, so `2766:4425` was added;
  - "Photos / Photos" on Review now reads "Photos / Attached", and the serial no longer breaks at a hyphen on the request detail.

  The changed links were replayed and pass. The tablet, phone 320, staff and other state frames are not in a flow and were checked by screenshot and script only.
- **Final re-audit:** no overlap, clipping, frame outside its section or prototype link pointing off the page; 54 navigation links.

The audit is recorded on the notes card `2179:189`.

## 7. Verification

- The 35 captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 470,000. Images 34 and 35 are frames holding copies of the phone state frames. Each of the 458 Font Awesome icon instances was swapped for `Icon/placeholder`, and the remaining 18 reactions (hover and component interactions) were removed. Scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or a logo was left;
  - none of 1,712 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and the Captures page keeps its 115 flow starting points.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/customer-portal/support-requests-design-r01/README.md).
- The named Figma version "Support requests — accepted" has not been saved; it waits for Dean's explicit yes.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline. CPA-01–CPA-16 remain Not run.
