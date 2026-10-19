---
document_id: PPO-EC01-EMAILS-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design, including Amendment A1 (sent email tracking) accepted on 19 October 2026; native implementation and UI baseline acceptance separate
source_commit: 70450f2eaa1166ed575736beb10cd5b335a8a4fd
versioning: git
---

# Emails design — owner decision

On 19 October 2026 Dean asked for the Emails page: "You next task is to build the UI page in Figma for the Emails module. This will be similar to the Emails module that Pipedrive uses, where leads, deals, projects, service requests, etc, can be linked to emails. I want this UI page to be extremely professional." Claude drew it as scope EC-01, which covers two routes:
- the mailbox at `/email` (the Sales rail item built as "Sales Inbox");
- an email thread at `/email/[id]`.

Claude drew the page from these sources:
- the EC-01 design register pages ([scope-ec-01](../design/development/pages/scope-ec-01.md), [route-email](../design/development/pages/route-email.md), [route-email-id](../design/development/pages/route-email-id.md));
- the [email and calendar integration blueprint](../blueprints/email-calendar-integration.md), screens EC-S01 to EC-S08, for the mailbox scope, linking, sharing and connection rules;
- [ADR-0020](ADR-0020-email-calendar-synthetic-journey.md), [ADR-0021](ADR-0021-gmail-first-real-provider.md), [ADR-0058](ADR-0058-outbound-customer-email.md) and the [D-025 customer communications decision](customer-communications-d025.md);
- the built page: `src/components/email-screens.tsx`, `src/email/service.ts` (which links an email to an Opportunity only) and the `Sales Inbox` item in `src/shell/navigation.ts`;
- the shell, register and record parts of the accepted pages, with the Site surveys CS-08 shell cloned and the Conversations reading pattern;
- Dean's Pipedrive phone screenshots of 19 October 2026, for the phone views.

Dean then asked for three audit and polish passes, and on the phone views: "I think we need to simplify the sections at the top. This means you may have to remove the main top bar that is shown at the very top of the mobile phone view." He asked whether the phone sheets should use the grey heading row of the Customer messages EC-04 sheets, which Claude recommended and applied. After Claude listed what was still missing, Dean said: "Proceed on the basis of your professional recommendations." Claude drew the missing frames. Dean then accepted the design: "I accept the Emails EC-01 design with your recommendations, including D1–D8 and Q1–Q5. Lock it in." That adopts D1–D8 and the recommended answers to Q1–Q5.

Section 8 records Amendment A1, sent email tracking, which Dean asked for during the lock-in and accepted the same day. Sections 1 to 7 describe the design as first accepted; where A1 differs, A1 governs.

Scope:
- `scope:EC-01` "Connected inbox and record-linking review", with `route:/email` and `route:/email/[id]`. The design also shows the EC-02 mailbox status and, as a proposal only, an EC-04 reply composer.
- Parent requirements CRM-03, OUT-17, PAR-06 and IF-09 in the master blueprint. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, mailbox connection, provider consent, sending or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw the Emails page, Pipedrive-like, with links to leads, deals, projects and service requests | User decision, 19 October 2026 | Dean's request quoted above |
| Simplify the phone top: no global phone header on Email | User decision, 19 October 2026 | Quoted above. D8 |
| Grey heading row on phone sheets, as on Customer messages EC-04 | User decision, 19 October 2026 | Dean's question, Claude's recommendation, applied. D8 |
| Three audit and polish passes, then the missing frames | User decisions, 19 October 2026 | Section 6 |
| Departures D1–D8 | Accepted as recommended, 19 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Sending | Resolved as recommended | Reading and linking are accepted. Reply, Reply all, Forward, New email and the composer frame stay an EC-04 proposal. Whether a person sends from their own mailbox through Microsoft Graph, or customer email stays on the shared mailbox through the communications service (ADR-0058), is settled in its own ADR before any sending is built |
| Q2 Where Email lives | Resolved as recommended | The rail item is labelled "Email" (built as "Sales Inbox") and the same item is shown in the Projects and Service rails, because one mailbox links to projects, requests and work orders. Changing the rails is a shell change, not made here |
| Q3 Mailbox scope | Resolved as recommended | The pilot scope stays: Inbox and Sent items, the last 30 days, one personal mailbox each, no shared mailboxes in this view. Drafts, other folders and shared mailboxes come later |
| Q4 Follow-up and archive | Resolved as recommended | "Plan a follow-up" creates a My Work activity linked to the same record, without copying the body (blueprint). Archive changes the provider mailbox only once write access is approved; until then it hides the thread in PPO only |
| Q5 Global phone actions | Resolved as recommended | On Email, the menu button opens the department menu with the account, Conversations (with its badge) and global search at its top. The bottom tab bar stays. Offering the same slim header to other phone work surfaces is one later shell decision, not page by page. The floating New email button depends on Q1 |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Amendment A1, sent email tracking | User decision, 19 October 2026 | Requested and accepted the same day. Section 8 |
| Named Figma version | Not yet decided | "Emails — accepted" waits for Dean's explicit yes. Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Emails · EC-01" `1499:392390`, under "— Sales —", after Deal record page · CR-01 `879:44`. The page header `1499:392391` holds the conformance declaration; the notes card `1511:397359` is in Flows and notes. File index row "Row / Emails · EC-01" `1532:187842`, after the Deal record row |
| Desktop 1440 | Inbox with Dana Brooks's thread linked to a deal `1502:91`; Priya Shah's email not linked, with suggested records and one ticked `1506:457`; Link to records panel, search "Hillview", two ticked `1507:788`; reply composer, proposal (Q1) `1508:1222`; Sent items `1525:403768` |
| Tablet 1024 | Inbox with the rail and side menu collapsed `1509:394014`; Link to records panel `1525:404343` |
| Phone 390 and 320 | Inbox list at 390 `1509:394623` and 320 `1513:400714`; Choose folder sheet `1513:401853`; Filter sheet `1513:401924`; thread at 390 `1509:395121` and 320 `1525:7819`; Link email to records sheet `1509:395314` and with search results `1525:403554` |
| States | Desktop: reconnect required, email hidden `1509:396707`; no email matches the search `1509:397179`; newsletter marked not business `1511:2492`; first import in progress `1516:403478`; link not confirmed, nothing changed `1516:403770`; Share one message with a colleague dialog `1511:2966`; a deal record's Email section for the person who linked and for a colleague `1511:3028`. Phone 390: reconnect required `1525:402948`; search with no matches `1525:403134`; first import `1525:403323` |
| Page parts | Section "Page components (proposed)" `1501:70`: Email / Record chip `1501:71`, Email / Thread row `1501:147` (Default, Unread, Selected), Email / Link suggestion `1501:149`, Email / Attachment tile `1501:161`, Email / Collapsed message `1501:170`, Email / Mailbox status `1501:198` (Ready, Initial sync, Reconnect required). They stay on the page, as the Sites, People, Organisations and Site surveys parts do |
| Icons | 25 Font Awesome icons added to Components › Icons on 19 October 2026 (paperclip, reply, reply-all, share, star and solid star, envelope-open, bold, italic, underline, list-ul, image, inbox-in, inbox-out, pen-to-square, file-pdf, file-image, file-excel, envelope-circle-check, alarm-clock, calendar-clock, ticket, handshake, signature and solid envelope), `1495:393807`–`1495:393945` and `1501:4235` |
| Prototype | Flows "EC-01 — desktop" (Priya's row to the suggestions, Search all records to the link panel and Cancel back; Reply to the composer and Discard back; Inbox and Sent items) and "EC-01 — phone" (list to thread and Back; Priya to the link sheet, search to the results and Cancel; the folder switcher and filter to their sheets and back). Both were played end to end in Figma Present mode on 19 October 2026 |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00, signed in as Jamie Park (Sales). Mailbox jamie.park@powerplants.example on Microsoft 365, Inbox and Sent items for the last 30 days, synced 08:58, 24 conversations and 6 unread. Dana Brooks (SYN Isolation Nursery) confirms Thursday access on Deal `SYN-PPO-OPP-000026` Substrate store dosing review, already linked. Priya Shah (SYN Hillview Growers) sends shade screen photos that are not linked: she is a contact on `SYN-PPO-OPP-000118` Glasshouse 4 shade screen upgrade (Proposal) and `SYN-PPO-OPP-000131` Propagation house irrigation review (Qualification), and Hillview has `SYN-PPO-TKT-000089` open, so all three are suggested and none ticked. Jamie ticks the shade screen deal, searches "Hillview" and adds Project `SYN-PPO-PRJ-000014` Glasshouse 4 screen controls. Ava Morris (SYN Northbank Nursery) replies on `SYN-PPO-TKT-000088` Boiler controller alarm, linked to `SYN-PPO-WO-000041`. Record titles, stages and dates follow the accepted Organisations CS-01 and Service requests SV-01 designs; only records that exist on 13 October are used |
| Retained captures | [Emails design r01](../reference/ui/email-calendar/emails-design-r01/README.md): 22 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:EC-01`, `route:/email` and `route:/email/[id]` (Sales rail; built label "Sales Inbox", drawn as "Email"). Shows the EC-02 mailbox status and an EC-04 composer as a proposal. Parent requirements CRM-03, OUT-17, PAR-06 and IF-09, unchanged. Capabilities unchanged |
| Page type (r20) | Work queue and persistent detail: a three-pane mailbox (side menu, thread list, reading pane), a right-hand link panel (phone: bottom sheet) and a share dialog |
| Reused components | Shell v2 (Rail · Sales, the top bar with the proposed Conversations action, side menu items and headings, phone tab bar), Button, Tag, Record / Filter chip, Record / Banner, Record / Section heading, Toolbar search, Grid / Checkbox and Conversations / Avatar. New, proposed: Email / Record chip, Thread row, Link suggestion, Attachment tile, Collapsed message and Mailbox status |
| Incoming handovers | The person's connected mailbox (Microsoft Graph delegated read; Gmail label import on the hosted demo, ADR-0021); reads of the Leads, Deals, Projects, Service requests, Work orders, Organisations, People and Sites the reader can open, for suggestions and search |
| Outgoing handovers | Each linked record gains an Email section that shows the person who linked their emails and shows colleagues only shared messages; Share one message with a colleague on one record; Plan a follow-up as a My Work activity without the body; Reply and New email hand over to EC-04 sending, which is not approved |
| Source authority | The EC-01 design register pages, the integration blueprint, ADR-0020, ADR-0021, ADR-0058 and D-025; `src/components/email-screens.tsx` and `src/email/service.ts`; the r04 HTML reference as history |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Emails — accepted" waits for Dean's explicit yes |

## 4. What the design shows

### Mailbox (desktop)

- **Side menu:** New email (Q1), then Mailbox (Inbox with its unread count, Sent items), Views (Not linked, Suggested links, Follow-up planned, Shared with me) and Linked to (Leads, Deals, Projects, Service requests, Work orders), each with a count. The mailbox status card sits at the foot: Ready ("Connected · up to date", the address, provider, folders, history and last sync), Importing, or Reconnect required.
- **Thread list:** the folder title with its counts, Refresh, Filter and sort, search across email, people and records, and quick filters (All, Unread, Not linked). Rows are grouped by day and show the sender with the message count, the subject, a one-line preview, the time, an attachment mark, and the linked records as chips, or a status tag ("3 suggested links", "Not linked", "Not business"). Unread rows are bold with a dot; the selected row has the row-selected fill and a navy bar.
- **Reading pane:** the subject, "Private to you", the message count, folder and mailbox, Reply, Reply all and Forward, and icon actions to plan a follow-up, share, archive and more. A Linked to card lists the records with Link record, and says that only the reader can read the email and that linking does not share it. Earlier messages collapse to one line; the latest shows its sender, address, recipients, time, body and attachment tiles.
- **Not linked:** a Not linked yet card lists the suggested records, each with its reason ("deal contact and subject match", "Priya Shah is a contact on this deal", "open request for SYN Hillview Growers"). Nothing is ticked for the reader. Link n records, Search all records and Not business email.
- **Link to records panel:** the right-hand snapshot panel with search, record-type chips (All, Leads, Deals, Projects, Service requests, Work orders, Organisations, People, Sites), suggested records first, then results with the match reason, and a sticky footer with the count selected, Cancel and Link n records. It states that linking files the email for the reader on each record and shares neither the email nor its attachments.
- **Sent items:** the same layout, with recipients in place of senders.

### States

Reconnect required (email hidden, links kept, nothing deleted); no email matches the search, with Search Powerplants records; a newsletter marked not business, which cannot be linked or shared and leaves suggestions; first import in progress, where what has arrived can be read and linked; a link that was not confirmed, where nothing changed on the record and the tick is kept; the Share dialog (one colleague, one record, attachments only if ticked, later replies private); and a deal record's Email section for the person who linked and for a colleague who can read the deal, who sees shared messages only and never a count of private ones.

### Tablet and phone

- **Tablet:** the rail and side menu collapse; the thread list and reading pane stay side by side; the link panel overlays the reading pane.
- **Phone:** one slim Email header replaces the global phone header: menu, a folder switcher ("Inbox 6 ▾"), search and filter. The list uses the same thread rows above the Sales tab bar, with Email current. The folder sheet holds Inbox, Sent items and the views; the filter sheet holds unread, links and record types, sharing and attachments. A thread opens full screen under a slim header (back, message count, star, archive, more) with a one-line link strip, or a dashed "Link to a record" when not linked, and a floating Reply button. Linking uses a bottom sheet with suggestions, search and results. Sheets have the grey heading row of the EC-04 sheets: close on the left, the title centred, a hairline and no drag handle.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | A three-pane mailbox on PPO's shell: side menu, thread list with day groups and quick filters, and a reading pane with the whole thread. Rows show the linked records or the link status | A synthetic message list for review |
| D2 | An email links to Leads, Deals, Projects, Service requests, Work orders, Organisations, People and Sites, each on its own. A deal link does not silently link its organisation or contact | Links to an Opportunity only |
| D3 | Suggest, then select: suggestions come from roles on records the reader can open, each with its reason, and nothing is pre-ticked. "Not business email" takes an email out of suggestions, linking and sharing | A link form |
| D4 | Link record and Search all records open the right-hand snapshot panel (phone: bottom sheet) | A modal |
| D5 | Private by default: "Private to you" on every reading pane; sharing is one message, on one record, with attachments only if ticked; a record's Email section never shows a colleague private subjects, senders or counts | As the blueprint, newly drawn |
| D6 | The rail item reads "Email" with a neutral unread badge and the Solid envelope when selected; the mailbox status sits at the foot of the side menu | "Sales Inbox" |
| D7 | Tablet collapses the rail and side menu and keeps the list and reading pane side by side | Not drawn |
| D8 | Phone, simplified at Dean's request: a slim Email header without the global phone header, folder and filter sheets, a full-screen thread with a link strip and a floating Reply button, and sheets with the EC-04 grey heading row | The global phone header with toolbar rows |

## 5. Not decided and not drawn

- **Building the page.** The built `/email` and `/email/[id]` keep the synthetic review page. The build order is not decided.
- **Prerequisites for a build:**
  - an approved mailbox connection: tenant, test mailbox, consent and retention (integration blueprint open questions);
  - link targets beyond Opportunity, one link per record, and unlinking that withdraws dependent shares;
  - a suggestion read with match reasons over records the reader can open;
  - the share model (one message, one record, attachments opt-in) and the record Email section;
  - the not-business flag, and the follow-up activity without the body (Q4);
  - the "Email" rail label and placement (Q2) and the phone header (Q5), as shell changes;
  - an ADR for sending before any composer is built (Q1).
- **The Conversations action** is part of the proposed top-bar shell amendment. On phone it moves into the menu (Q5).
- **Not drawn:** drafts and scheduled send, and templates; the Gmail label picker; the mailbox settings page (EC-02); calendar (EC-03); filing attachments to SharePoint; bulk linking from the list; the composer at tablet and phone width (Q1); phone 320 versions of the states; 200% zoom.
- **Open items:**
  - **Sent email tracking** was requested after acceptance and is accepted as Amendment A1 (section 8). It depends on Q1, because only email sent through PPO can be tracked.
  - The accepted Organisations CS-01 design lists `SYN-PPO-WO-000040` under SYN Hillview Growers, but the accepted Service requests SV-01 design links it to SYN Greenhouse Demonstration. This design does not use that work order.
  - The Customer messages EC-04 page in the same Figma file uses the same phone sheet pattern; a change to one should be made to both.
- **Data in the frames:** the people, addresses (`*.example`), organisations and records are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request Claude audited the page four times:
- **Pass 1:** measured every visible text for clipping and truncation and fixed the findings, then rebuilt the phone views to D8 and added the folder and filter sheets.
- **Pass 2:** read back every visible text and cross-checked the story. Previews now match their message bodies, the unread count drops to 5 once Priya's email is open, and the newsletter appears in every inbox list. Two states were added (first import, link not confirmed).
- **Pass 3:**
  - checked record titles, stages and dates against the accepted Organisations and Service requests designs, and replaced requests that did not yet exist on 13 October;
  - put the message bodies back on the PPO/Body text style and removed stray prototype links;
  - gave the phone sheets the EC-04 heading row.
- **Pass 4:** measured contrast for every text and background pair. The one failure, the time on a selected row (4.41:1), now uses text/secondary (5.14:1). The missing frames were drawn and both flows were played in Present mode.

The audit is recorded on the notes card `1511:397359`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma, measured every single-line text against its rendered width, and measured contrast for every text and background pair. After the audit no text is clipped. Subjects and previews longer than their column end in an ellipsis by design.
- Both flows were played end to end in the Figma desktop app's Present mode. Every navigation link resolves to a frame on the page.
- The 22 captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 270,000. Images 21 and 22 are frames holding copies of two and three frames. Navigation links were removed from the copies, and the two flow starting points the copies brought were removed. Each of the 921 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,837 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a navigation link. The only remaining interactions are the shell components' own hover and toggle behaviour.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/email-calendar/emails-design-r01/README.md).
- The named Figma version "Emails — accepted" waits for Dean's explicit yes.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 8. Amendment A1 — sent email tracking (19 October 2026)

While this design was being locked in, Dean asked for sent email tracking: "A feature that we do need to include in the Emails module is the ability to track sent emails so we can see when the customer (or receiver) has open and also when they have viewed the email. Pipedrive does this. They include an icon of an eye in the email section that changes colour/style depending of if the email has not been opened, has been open, and as been viewed, etc." Claude drew it as Amendment A1 in its own section of the page, and Dean accepted it: "I accept amendment A1, sent email tracking, with your recommendations, including A1-D1–D6 and A1-Q1–Q4."

| Item | Classification | Evidence |
|---|---|---|
| Add sent email tracking, Pipedrive-style | User decision, 19 October 2026 | Dean's request quoted above |
| A1-D1 to A1-D6 | Accepted as recommended, 19 October 2026 | Dean's acceptance quoted above; the table below |
| A1-Q1 Default | Resolved as recommended | On by default for email a person sends from PPO, with a switch for each email. Never on customer notices sent from the shared mailbox (EC-04) unless that ADR decides otherwise |
| A1-Q2 Privacy | Resolved as recommended | Powerplants' privacy notice says sales email may contain tracking. PPO stores the event type and time only, with no IP address, location or device, and keeps tracking events for 12 months. Updating the notice is a business action outside this repository |
| A1-Q3 Who sees it | Resolved as recommended | Whoever can see the message: the sender, and a colleague it is shared with. Never on a record's Email section for anyone else |
| A1-Q4 Alerts | Resolved as recommended | No alert by default. An optional "Tell me when it is opened" on an email adds one My Work notification on the first open |
| Building tracking | Not decided | It needs sending from PPO (Q1) first, then a tracking image and link service, event storage and the privacy notice |

| ID | Change |
|---|---|
| A1-D1 | **What is tracked.** Email sent through PPO with tracking on carries a small tracking image (opens) and tracked links or shared documents (views). Email sent from Outlook or elsewhere shows "Not tracked" |
| A1-D2 | **An eye with words on every sent email.** Thread rows show a tracking status in Sent items, threads and phone lists: Not opened, Opened n×, Opened · may be automatic, Viewed, or Not tracked. Colour is never the only signal. Sent items gains Opened and Not opened quick filters |
| A1-D3 | **Details.** The reading pane shows a tracking line under the sender, with Details opening a popover (phone: a sheet) of dated events. Opens are counted for the email, not for each recipient, and the popover says so |
| A1-D4 | **Composer.** "Track opens and link views" is on by default and can be turned off for one email. The footer says tracking adds a small image and tracked links |
| A1-D5 | **Honest states.** An open loaded by a mail privacy service straight after delivery shows as "may be automatic". Tracking is evidence, never proof, and delivery stays a separate state (ADR-0058) |
| A1-D6 | **New part.** Email / Tracking status (five states) is added to the Thread row behind a "Show tracking" switch. The switch is off on every r01 frame, so those frames and their captures do not change |

**Design reference.** Section "A1 · Sent email tracking" `1543:7805` on the Emails page: desktop Sent items with tracking and the details popover `1543:7806`; the reply composer with the tracking switch `1544:5345`; phone Sent items with tracking `1544:5828`; the phone tracking sheet `1544:6128`; the tracking states legend `1546:5890`; and the A1 notes card `1546:5931`. New page part: Email / Tracking status `1541:8843` (Not opened, Opened, Opened automatically, Viewed, Not tracked). New icons on Components › Icons: `Icon/solid/eye` `1541:4106` and `Icon/arrow-pointer` `1541:4112`. The named version "Emails — sent email tracking amendment A1" waits for Dean's explicit yes.

**Not drawn.** Tracking in the Inbox for threads whose last message is the reader's, a per-recipient view (not offered: opens cannot be told apart reliably), the "Tell me when it is opened" switch (A1-Q4), and the privacy notice text.

**Verification.** Claude checked each A1 frame with screenshots taken inside Figma. A fresh export of the r01 capture 01 copy, made after the Thread row change, has the same byte size as the committed image, so the hidden tracking part leaves r01 unchanged. The five r02 captures are copies of the A1 frames, made on the Captures page at y = 272,000. Each of the 181 Font Awesome icon instances, including the tracking eye, was swapped for `Icon/placeholder`. Scans then found:
- no icon or stray vector left;
- no visible text, of 355, whose stored colour differed from its bound variable;
- no navigation link.

They were exported at scale 1; the hashes are in the [r02 README](../reference/ui/email-calendar/emails-design-r02/README.md). The register entries for `scope:EC-01`, `route:/email` and `route:/email/[id]` add the r02 captures. The r01 captures stay unchanged. A1 changes no application code, route, migration, permission or capability.
