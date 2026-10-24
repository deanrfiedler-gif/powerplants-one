---
document_id: PPO-CP01-PORTAL-HOME-FIGMA-DEC
date: 2026-10-23
owner: Dean Fiedler
status: Owner-accepted design; implementation, identity, hosting and live customer access separate
source_commit: 01cef3916c874159a9404f737065292ae2466046
versioning: git
---

# Portal home and access design — owner decision

On 23 October 2026 Dean asked Claude to design and build "the 'Portal home, organisation/site selection and access (CP-01)' UI page in Figma as a proposal for my review. It is the first Customer portal page. Draw the page; do not stop at a written brief." `/portal` is not built, so this design defines the build. Dean then asked for three rounds of review:
- "Carry out an audit and polish on the pages to ensure they are correct and as professional as possible. If you discover any new and/or innovative features that could be included while you are carrying out the audit, feel free to add them to the design."
- After asking "Are you 100% satisfied with the design of the Portal pages now?": "Yes, do the third pass on the gaps you listed, using your recommendation for the phone header, and play the flows in Present mode."

He then accepted the design: "I accept the Portal home & access CP-01 design with your recommendations, including D1–D19 and Q1–Q8. Lock it in." That adopts departures D1–D19 and the recommended answers to Q1–Q8.

Claude drew the page from these sources:
- the [customer portal direction](customer-portal-direction.md) (Dean, 6 September 2026: "design it now and implement it in bounded stages as the supporting workflows become ready");
- the [customer portal design](../blueprints/customer-portal-design.md), in particular §3 roles and grants, §5 screens, §7 customer status mapping, §8 publications, §9 identity, access and recovery, and §10 UX;
- the [implementation plan](../delivery/customer-portal-implementation-plan.md) (CP1–CP5) and [acceptance procedures](../testing/customer-portal-acceptance.md) (CPA-01–CPA-16);
- the [customer communications decision](customer-communications-d025.md) and [ADR-0058](ADR-0058-outbound-customer-email.md) for notices;
- the [Users and access design](users-and-access-figma-design.md) for the request pattern used to grant access;
- the [logo pack r01](../reference/ui/ppo-logo-pack/README.md) usage notes;
- the earlier [portal walkthrough](../blueprints/customer-portal-mockup.html), as earlier direction only;
- the accepted Organisations CS-01, Sites CS-04 and People CS-02 pages for the story.

Scope:
- `scope:CP-01` "Portal home, organisation/site selection and access", destination `/portal`.
- Page-register coverage under CRM-01, CRM-03, CRM-06, NFR-01, NFR-02 and NFR-09, with local acceptance CPA-01, CPA-02, CPA-05 and CPA-13 (all Not run). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, grant, identity provider, hosting, invitation, customer message or deployment. It settles none of D-011, D-012, D-022 or D-024; Q1 and Q2 record recommended answers for those decisions to adopt, not their adoption.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CP-01 in Figma as the first Customer portal page | User decision, 23 October 2026 | Dean's request quoted above |
| Three audit-and-polish passes, the third playing the flows in Present mode | User decisions, 23 October 2026 | Quoted above. Section 6 |
| Departures D1–D19 | Accepted as recommended, 23 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 How customers sign in (D-022) | Recommended answer accepted as direction; D-022 still to be decided with evidence | A verified, supported OIDC identity provider chosen through an ADR (with cost and the MYOB Acumatica portal assessment), email-verified invitations that expire after 7 days, multi-factor sign-in and Powerplants-administered membership. Until then CP1 uses local synthetic principals only |
| Q2 What customers call it (D-024) | Recommended answer accepted as direction; D-024 still open | "Powerplants customer portal", shown as "Customer portal" beside the logo. Never "PPO" or "Powerplants One" |
| Q3 Who administers a customer organisation's users | Resolved as recommended | Nobody at the customer at first. Powerplants staff propose and apply every grant through the Users and access request pattern; customer-managed invitations are a later option with their own rules, after a pilot |
| Q4 Phone-first | Resolved as recommended | Yes for Home, requests and replies, with desktop at full parity |
| Q5 Cards before their stage | Resolved as recommended | Upcoming visit and Latest updates are hidden entirely, not shown empty, until CP2a and CP4 are delivered for that grant |
| Q6 Held update email versus portal publication | Resolved as recommended; settled in CP4 | A held update email never blocks or reveals portal publication; the portal shows what is published, whatever the notice choice |
| Q7 Next page | Resolved as recommended | Support · CP-02 |
| Q8 Calendar file or live feed | Resolved as recommended | One calendar file per confirmed visit, not a live subscription feed |
| Accept the design | User decision, 23 October 2026 | Quoted above |
| Named Figma version | Saved by Dean | Dean saved the named version "Portal home & access — accepted" himself and reported it: “I have saved it.” (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Portal home & access · CP-01" `2105:659722`, under a new divider page "— Customer portal —" `2105:659721`, after Audit history AD-07 and before "— Evidence —". The page header `2105:659723` holds the conformance declaration; the notes card `2132:2453` is in Flows and notes |
| Desktop 1440 | Sign in `2114:687284`; First visit after an invitation `2114:687403`; Get help with access `2114:687563`; Recovery email sent `2167:7936`; Home, Priya Shah, one site, full length `2105:744671`; Home, CP1 scope only `2158:701289`; Help menu `2147:2944`; Choose a site, Grace Holt, two sites `2112:679119`; Home after switching to SYN Hillview Growers `2158:701418`; Account and access `2114:686913`; Access changed during the session `2114:687150`; staff entry point on the People record `2159:701260`; staff Propose portal access dialog `2114:690895` |
| Tablet 1024 | Home `2122:1495` |
| Phone 390 and 320 | Sign in `2125:687808` / `2125:688075`; Home, full length `2122:1601` / `2122:1750`; Choose a site `2125:687591` / `2125:687858`; Account menu `2125:687733` / `2125:688000`; Help at 390 `2158:701202` |
| States | Desktop: loading `2112:679266`, zero (new customer) `2112:679417`, one card failed `2112:679572`. Phone 390: loading `2158:700772`, zero `2158:700920`, one card failed `2158:701074`, access changed during the session `2127:2286`, access removed `2127:2375`, recovery email sent `2127:2426`, session expired `2127:2476` |
| Page parts | Section "Page components (proposed)" `2105:679519`: Portal / Logo · full on navy `2105:679520` and on light `2105:679543`, Header · desktop `2105:708787`, Context switcher `2105:708779`, Header action `2105:708769`, Account button `2105:708773`, Nav item `2105:708840`, Nav bar · desktop `2105:708841`, Card header `2105:708862`, Request row `2105:725810`, Publication row `2105:725822`, Preference row `2105:725846`, Site option `2105:725863`, Text field, Phone header `2105:725934`, Context bar · phone `2105:725935` (superseded by the phone header, kept as history), Tab item `2105:725951`, Tab bar · phone `2105:725994`, Footer `2105:725995`, Placeholder · to be decided `2105:708866`, and the Keyboard focus and field states board `2159:701631`. They stay on the page, as the AD-01 and People parts do |
| Prototype | Flows "CP-01 — desktop" (from Sign in), "CP-01 — phone" (from Sign in 390) and "CP-01 — switching sites" (from Choose a site). Desktop: Sign in → Home; Can't sign in → Get help with access → Send instructions → Recovery email sent → Back to sign in; First time here → First visit → Continue to Home; Home → Help menu → Home; Home → Account and access → Home or Sign out. Phone: Sign in → Home → Account menu → Help sheet or close, or Sign out; Can't sign in → Recovery email sent → Back to sign in. Switching: Choose a site → SYN Hillview Growers → Home after switching. The staff record menu item opens the dialog |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST (site time, Brisbane). Priya Shah (Hillview Growers, as on Organisations CS-01 and People CS-02) is a Customer site coordinator with one granted site, SYN Glasshouse 4. She is also primary contact at SYN Hillview Growers, which shows that a contact role grants nothing. New synthetic person: Grace Holt, Hillview Growers, site coordinator at both sites; she switches to SYN Hillview Growers at 09:02, and that grant ends at 10:12 in the access-changed frames. New references: `SYN-TKT-000102` "Bay 4 drippers running low" (Your reply needed; question from Sasha Cole, Mon 12 Oct 15:20), `SYN-TKT-000098` (Reviewed by service team), `SYN-TKT-000104` (Received), `SYN-RPT-000064` and `SYN-RPT-000063`; none appears elsewhere in the repository. Existing, unchanged: `SYN-PPO-ORG-000007`, `SYN-SITE-000012`, visit `SYN-PPO-APT-000052` moved to Thu 15 Oct 08:00–11:00 and confirmed 08:51 (as on PL-04 and Sites), and project PRJ-000014 Glasshouse 4 screen controls. Staff frames: Taylor Quinn proposes, Jordan Kim reviews |
| Retained captures | [Portal home and access design r01](../reference/ui/customer-portal/portal-home-access-design-r01/README.md): 28 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CP-01` and `/portal` (not built). Page-register coverage under CRM-01, CRM-03, CRM-06, NFR-01, NFR-02 and NFR-09, unchanged; all 78 parent IDs preserved. Stage CP1 (Home and Support), drawn on its own; CP2a and CP4 cards appear only when delivered |
| Page type (r20) | Overview / dashboard (Home). Form / guided workflow (sign-in, first visit, recovery, staff proposal). Record detail (Account and access) |
| Reused components | Components page: Button (including its Focus variant), Tag, Record / Field, Record / Section heading and Font Awesome Pro Light icons through the Kit. Planner / Input (proposed, PL-01) in the staff dialog. The accepted People CS-02 record, cloned for the staff frames only. New, proposed on this page: the parts listed in section 2 |
| Incoming handovers | A portal grant applied through the Users and access request pattern (staff frames) → invitation → first visit; sign-in (D-022, not chosen); a link in a notification email (ADR-0058 shared mailbox; live sending not authorised) |
| Outgoing handovers | Support (CP-02: requests, new request, reply), Visits (CP2a, visits with their service reports), Projects (CP4), Account and access, and Help. Request support and "Ask about this visit" open the CP1 new-request form with context. The portal changes no Ticket state, grant, visit or work authority |
| Source authority | The sources listed above. The earlier walkthrough is earlier direction, restyled onto PPO tokens and components |
| Proposed departures | D1–D19 in section 4, accepted |
| Status | Owner-accepted design, 23 October 2026 |
| Decision record | This file |
| Named version | "Portal home & access — accepted", saved by Dean (section 7) |

## 4. What the design shows

### Shell and context

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | A portal shell separate from the staff shell: an 88 px navy header with the full Powerplants logo at 88 × 88 (logo pack r01, transparent clear space, alt "Powerplants Australia"), the portal name, the current organisation and site, Help and the account menu, over a white navigation bar. No staff rail, search, staff top bar, Conversations action, notifications bell or internal terms | Design §10; Dean's brief |
| D2 | Top navigation in place of the spec's 216 px navy side navigation, keeping a 1200 px content column that matches the phone tab bar | Proposed composition |
| D3 | One organisation and site at a time, always visible and switched on purpose. With one granted site the context is a plain label; with several it opens "Choose a site", grouped by organisation. Switching clears the page; there is no combined all-sites view and no counts from other sites | Design §3 and §9; CPA-02 |
| D4 | Navigation follows grants and delivered stages: CP1 shows Home and Support only; Visits (CP2a) and Projects (CP4) appear only when delivered and granted; Knowledge (CP3) is not shown | Design §5 |
| D12 | Phone: one 80 px header row with the full logo at the logo pack's 80 px minimum (the spec's §10 asks for 88), the current organisation and site, and the account button. Help moves into the account menu and appears in the header only when signed out. At 320 px the site icon and account chevron drop out and the site name may wrap to two lines. 16 px body and inputs, 48 px main buttons, labelled bottom tabs (Home, Support, Visits, Projects) and sheets in the EC-04 sheet style. This replaces an 88 px header plus a 60 px site bar | Design §10; Dean's compact phone header direction; third pass |

### Home

| ID | Departure or rule | Basis |
|---|---|---|
| D5 | Needs your action, Upcoming visit (when enabled) and Latest updates each show their own last-refreshed time, loading skeleton, zero state and could-not-load state; a failed card shows no stale data. Primary action Request support. An urgent-help line says to phone the usual contact, that the portal is not watched around the clock and that a request does not book work | Design §5, §11 |
| D6 | Customer status words come only from facts: Received, Your reply needed (only with an unanswered public question) and Reviewed by service team. No SLA countdown, In progress or Resolved | Design §7 |
| D7 | Publications show only released revisions, with "Opening a report does not record that you accept it." | Design §8; P09 OUT-10 |
| D13 | Confirmed-visit cards offer "Add to calendar" (a one-off calendar file) and "Ask about this visit" (a support request with the visit attached) | Proposed; design §5 |
| D16 | Phone loading, zero and one-card-failed Home, with the failed card moved to the top | Phone-first (Q4) |
| D17 | A CP1-only Home (Home and Support, no visit or update cards), and Grace Holt's Home after switching sites, with a status message naming what is now shown and only that site's records in every card | Design §5, §9; CPA-02 |

### Access, account and help

| ID | Departure or rule | Basis |
|---|---|---|
| D8 | Account and access: details come from the contact record and change only through a correction Powerplants checks; notification choices are the contact's recorded notice preferences (People CS-02 Notices), not a second copy; role and grants are read only in plain words ("You can see", "You can", "You can't") | Brief; D-025, ADR-0058 |
| D9 | Recovery shows the same message whether or not the address has an account; access changed clears the page and lists what remains and what went; access removed shows no records; session expired says unsent text was not saved | Design §9; CPA-01, CPA-02, CPA-05 |
| D10 | Open decisions shown as neutral placeholders in the annotation style (dashed purple, not customer interface): sign-in, first-visit confirmation, recovery steps and session length (D-022); the name "Customer portal" (D-024); privacy and retention (D-012). D-011 decides which customer relationships can be granted; the frames show one organisation's own sites only | Brief |
| D14 | "Ask Powerplants to add someone": the customer can ask for a colleague to be added; Powerplants checks it and applies any grant through D11. The customer never grants access | Q3; design §3 |
| D15 | Help menu (desktop popover, phone sheet): Using the portal; What to include in a support request (the first reviewed CP3 article); Accessibility; Ask the service team; and the urgent-contact line | Design §8, §11 |
| D19 | Keyboard focus and field errors: a 2 px focus ring with a 3 px offset (white on navy), the shared Button Focus variant, a 2 px focus border on fields, and errors in words with an icon, linked to the field | Design §10; CPA-13 |

### Staff side (accepted amendment, drawn on this page only)

| ID | Departure or rule | Basis |
|---|---|---|
| D11 | "Propose portal access" names one contact, one portal role, explicit sites (a site contact role grants nothing), start, optional end, a named independent reviewer, a reason and checks before submission. It submits for independent review; access starts only when the request is applied; no invitation or message is sent. Proposing needs a portal-access capability that does not yet exist in `permissions.ts` | Users and access accepted request pattern (D6, D7); design §3 |
| D18 | Entry point on the People record: "Propose portal access…" in the record menu, and a Portal access summary (role, sites, since) in the details column | Third pass |

The People CS-02 and Users and access AD-01 Figma pages themselves were not edited. D11 and D18 are accepted as the design for those pages' next amendment.

## 5. Not decided and not drawn

- **Building the page.** `/portal` is not built and the build order is not decided. CP1 runtime still depends on the readiness in the [implementation plan](../delivery/customer-portal-implementation-plan.md).
- **Prerequisites for a build:**
  - a local synthetic external-principal model, portal membership and grants (design §6, CP1);
  - a portal-access capability for staff proposals, and the request type in Users and access (D11);
  - a context read that returns only currently granted organisations and sites;
  - per-card reads with their own last-refreshed time (D5);
  - recording correction requests and notice preferences against the contact record (D8);
  - the CP1 new-request form receiving the visit as context (D13).
- **Decisions still open:** D-022 identity and hosting, D-024 customer wording, D-011 customer relationships and D-012 retention. Q1 and Q2 give the recommended direction.
- **Not drawn:**
  - Support (CP-02), the new-request form, request detail and reply;
  - the Visits, Projects and Knowledge pages, and commercial and account views (CP5);
  - a consultant with grants at more than one organisation (the switcher already groups by organisation);
  - the phone Account and access page;
  - 200% zoom, checked at build;
  - dark mode.
- **Data in the frames:** the people, organisations, sites, requests, reports, visits and grants are synthetic. They are not operational records and grant no access.

## 6. Audit and polish

Claude audited the page three times at Dean's request. Each pass checked fonts, stored versus bound colours, clipping, truncation (each truncating text measured against its rendered width), overlaps, frames outside their sections and the story across accepted pages.

- **First pass:** fixed the clipped Mobile field, the optional end date's Required tag and the cut-off start in the staff dialog, white icons on primary buttons, centred full-width button labels, and equal card heights in the Home row.
- **Second pass:** the request title no longer says "since Monday"; publication kind and organisation labels raised from 11 to 12 px; the one-site context shown as a plain label; D-012 and session-length placeholders in the placeholder style; added D13–D15 and Q8.
- **Third pass:** the phone header rebuilt as one 80 px row (Claude's earlier "64 px" suggestion could not hold the logo at its 80 px minimum); added D16–D19; one navigation label, "Visits"; report numbers added and request numbers checked against the repository; desktop Recovery email sent added. At 320 px the header site name was truncated, so the site icon and account chevron drop out at that width.
- **Present mode:** Claude played all three flows in the Figma desktop app and clicked every link. Two faults were found and fixed: desktop "Send instructions" had no destination (it now opens Recovery email sent, and that step was replayed), and the site switcher on Grace's after-switch Home returned to a frame showing the wrong current site (that link was removed).
- **Final re-audit:** 1,460 visible texts, all Roboto; no colour drift, clipping, truncation, overlap or frame outside its section; 33 prototype links, none pointing off the page.

The audit is recorded on the notes card `2132:2453`.

## 7. Verification

- The 28 captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 400,000. Image 27 is a frame holding copies of the seven phone state frames. The 32 prototype reactions were removed and each of the 482 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,283 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and the Captures page keeps its 113 flow starting points.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/customer-portal/portal-home-access-design-r01/README.md).
- Dean saved the named Figma version "Portal home & access — accepted" in the Figma desktop app after the captures were made and reported it: “I have saved it.” Claude did not check version history. The page header's Named version field was then updated.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline. CPA-01–CPA-16 remain Not run.
