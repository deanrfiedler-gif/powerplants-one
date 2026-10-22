---
document_id: PPO-EC04-CUSTOMER-MESSAGES-FIGMA-DEC
date: 2026-10-22
owner: Dean Fiedler
status: Owner-accepted design, 22 October 2026; native implementation and UI baseline acceptance separate
source_commit: e9f28b6955d62cc33408e418f43f00ce5b937551
versioning: git
---

# Customer messages design — owner decision

On 19 October 2026 Dean asked which UI page to design after Emails, and accepted the recommendation: "Proceed with designing EC-04 · Communication draft, approval and delivery review next." Claude drew it as the Customer messages page: the screens for the customer communication core that D-025 stage S2 built behind an API, with no UI ([S2 record](customer-communications-core-s2.md), [API contract](../contracts/customer-communications.md)).

Claude drew the page from these sources:
- the [D-025 decision paper](customer-communications-d025.md) (message classes M1–M4, rules R1–R9) and [ADR-0058](ADR-0058-outbound-customer-email.md) (one monitored shared mailbox, Graph behind a provider-neutral channel);
- the S2 build: `src/communications/model.ts` (states, hold reasons, display states), the transitions it enforces and the [customer communications API](../contracts/customer-communications.md);
- the accepted Changes and follow-up PL-04 queue, snapshot and review card, the accepted dialog pattern of Create discovery workspace ES-02, and the Emails EC-01 shell (Sales rail › Email and its side menu);
- Dean's Pipedrive mobile email screenshots of 19 October 2026, for the phone views.

Dean asked for two audit and polish passes, a simpler phone top, three phone header fixes and a play-through of the prototype in the Figma desktop app (section 6). He then accepted the design on 22 October 2026: "Yes, I accept EC-04, including D8, with the recommended answers." That adopts departures D1–D8 and the recommended answers to Q1–Q4.

Scope:
- `scope:EC-04` "Communication draft, approval and delivery review". The design proposes the routes `/email/customer-messages` and `/email/customer-messages/[id]` (D1); the register still names `/email/drafts` as the destination (section 5).
- Parent requirements CRM-03, DOC-05, OUT-17, TR-03, PRJ-07, SCM-07, SCM-08, SVC-05 and NFR-11; acceptance AT-25 and AT-36. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, mailbox, provider consent, sending or customer message. D-025 stages S3–S6 each still need their own authorisation.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design EC-04 next | User decision, 19 October 2026 | Dean's words quoted above |
| Simplify the phone top, as Pipedrive's mobile email does | User decision, 19 October 2026 | Dean: "I think we will need to reduce the number of boxes, buttons, features, etc., that are at the top of the screen to allow more room for the actual content." D8 |
| Full-width phone buttons; white sheets with a light grey heading row | User decisions, 19 October 2026 | Dean's audit points; section 6 |
| Three phone header fixes: search and filter combined at 320 px, a Light outline Conversations icon, a notification dot on the menu button | User decision, 19 October 2026 | Dean: "Yes, make the three phone header fixes as you recommend" |
| Put the comments icon into the shared Conversations action | User decision, 19 October 2026 | Dean: "Update the shared Conversations icon now, pinning the placeholder on the capture copies first." Section 2 |
| Play the prototype in Figma before accepting | User decision, 19 October 2026 | Dean: "Proceed on that basis." Section 7 |
| Departures D1–D8 | Accepted as recommended, 22 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Sending note | Resolved as recommended | Optional for M1–M3, where the content is fixed and the sender is named. Required for M4, labelled "Approval note", so the approval records what was checked (drawn that way) |
| Q2 Shared mailbox address | Resolved as recommended | The frames show `customers@powerplants.example` as a synthetic placeholder. It stays until S4 names the real mailbox (ADR-0058, Q3) |
| Q3 Who sends M1–M3 | Resolved as recommended | The supply coordinator who records a dispatch may also send it when he or she holds the customer send duty: M1–M3 have no second-person rule, and the sender is named either way. M4 keeps its rule that the drafter cannot send |
| Q4 Outlook fallback | Resolved as recommended | No "Send from Outlook" in the app. The owned follow-up tells the owner to reach the customer another way, and Check Sent Items stays the only recovery for an unknown outcome (ADR-0058 option E stays outside PPO) |
| Accept the design | User decision, 22 October 2026 | Quoted above |
| Named Figma version | User decision, 22 October 2026 | Saved as "Customer messages — accepted" at Dean's request: "Yes, save the named Figma version "Customer messages — accepted"." Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Customer messages · EC-04" `1509:394554`, under "— Sales —", after Calendar · EC-03. The page header `1509:394555` holds the conformance declaration; the notes card `1513:401800` is in Flows and notes. File index row "Row / Customer messages · EC-04" `1992:489053`, after the Calendar row |
| Desktop 1440 | All messages register `1509:395619`; To send, M1 dispatch notice with its exact message `1511:395912`; Confirm and send dialog `1511:397407`; Sent (simulated), delivery not confirmed, on the History tab `1511:398628`; M4 project update a second person approves `1511:399244`; Needs follow-up: M4 held because the contact asked not to be notified `1511:399808`, M1 outcome unknown `1511:400464`, M1 failed with a matched non-delivery report `1511:401030`; Message classes `1512:3378`; Turn off a message class dialog `1512:398889`; Message classes after turning M2 off `1546:415993` |
| Tablet 1024 | To send register with the rail and side menu collapsed `1512:399457` |
| Phone 390 and 320 | To send list `1512:400184`; Needs follow-up list at 390 `1546:415924` and 320 `1525:402853`; the M1 message, full length `1516:402150`, at 320 `1516:403194` and as a scrolling 844 px viewport for the prototype `1546:414023`; Confirm and send sheet `1516:403287`; Choose view sheet `1516:404444`; Filter messages `1516:404506`; Search and filter at 320 `1525:403503`. Every phone header is an instance of Shell / Phone header · compact `1530:110` ([phone header amendment](phone-header-amendment.md)) |
| States | Message cards: content changed while open `1513:401279`; independent sender required, signed in as Kai Morgan `1513:401339`; view only `1513:401398`; held when you confirmed `1513:401457`; send not confirmed `1513:401517`. Register: nothing to send `1513:401578`; could not load `1513:401655` |
| Page parts | Section "Page components (proposed)" `1509:394901`: Message grid header `1509:394902` and Message grid row `1509:394914` (Default, Hover, Selected, Closed). They stay on the page; Stakeholder updates PJ-08 cloned them for its Update grid. The email preview, delivery steps and classes grid are page-local frames |
| Icons | `Icon/comments` `1525:7814` (Font Awesome Light, from Dean's Kit) on Components › Icons, added 19 October 2026. At Dean's request it replaced the placeholder in the shared Conversations top-bar action `1175:2216`, both variants; the 166 capture copies of that action on "Captures (icon-free)" had `Icon/placeholder` pinned first, and a fresh scan found none showing the new icon |
| Prototype | Flows "EC-04 — desktop (proposal)", "EC-04 — phone (proposal)" and "EC-04 — phone 320 (proposal)", 78 navigation links in all. Section 7 |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00, signed in as Sasha Cole, who holds the customer send duty, supply coordination and project editing. Robin Hale is the supply coordinator, Kai Morgan the project coordinator and Jordan Kim the template publisher. To send: M1 "Dispatch – motor M-4 seal kit" for `SYN-PPO-WO-000040`, SYN Hillview Growers, to Priya Shah (SYN Freight Co, consignment SYNC-4471-2209, 2 of 3 lines shipped); M4 "Project update – October progress" for `SYN-PPO-PRJ-000019`, SYN Isolation Nursery, to Dana Brooks, drafted by Kai Morgan; M2 "Delay – dosing pump now Fri 23 Oct" to Mei Tan, SYN Coastal Berry Farms. Needs follow-up: the M4 update for `SYN-PPO-PRJ-000014` held because Priya Shah asked not to be notified of project updates (as People CS-02 records); an M1 to Mei Tan whose hand-over was not answered; an M1 to Sam Okafor, SYN Northbank Nursery, that bounced. Stakeholder updates PJ-08 uses the same M4 messages and times |
| Retained captures | [Customer messages design r01](../reference/ui/email-calendar/customer-messages-design-r01/README.md): 28 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:EC-04`; proposed routes `/email/customer-messages` and `/email/customer-messages/[id]` in the Email workspace (Sales rail › Email). Parent requirements CRM-03, DOC-05, OUT-17, TR-03, PRJ-07, SCM-07, SCM-08, SVC-05 and NFR-11, unchanged. Capabilities unchanged: `customer_message.send` and `customer_message.switch` (migration 0109, default-denied), plus each class's working duty |
| Page type (r20) | Register / worklist (the outbound queue), review / comparison (the exact message beside the facts it was built from) and record detail (one message and its delivery history) |
| Reused components | The Emails EC-01 shell (Rail · Sales with Email selected, the Email side menu, the top bar with the Conversations action), Grid cells, Tag, Button, Toolbar search, Menu items and headings, the PL-04 snapshot and review card, the ES-02 dialog, the phone tab bar and Shell / Phone header · compact. New, proposed: Message grid header and Message grid row |
| Incoming handovers | Messages the communications service prepares: M1 Dispatch notice and M2 Delay notice from Supply (S3), M3 Visit confirmation from Service (S5), M4 Project update drafted on Stakeholder updates PJ-08 (S6). Notice preferences are read from People CS-02 and templates from Template management DK-06 |
| Outgoing handovers | Confirm and send (Prepared to Queued; M4 "Approve and send"), Withdraw, Check Sent Items (Outcome unknown only) and a class switch (Off or Synthetic). Follow-ups go to My Work as a Customer contact activity. Links open the source record, the person and the template. It never edits a prepared or sent message, never takes a typed address, and never claims delivery or reading |
| Source authority | D-025 (R1–R9), ADR-0058, the S2 record and API contract, `src/communications/model.ts`; BP-01 DOC-05 and TR-03; the accepted PL-04, People CS-02 and Template management DK-06 designs |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 22 October 2026 |
| Decision record | This file |
| Named version | "Customer messages — accepted", saved 22 October 2026 |

## 4. What the design shows

### Desktop

- **Side menu.** The Email side menu gains a Customer messages group after Mailbox: To send (3), Needs follow-up (3), All messages and Message classes. The personal mailbox status card shows on Inbox views only.
- **Register.** A grid of messages (Message, Class, State, Customer, To, Source, Prepared, Owner), newest first, with class, customer and date filters. States read with their qualifier: To send, Held · do not notify, Outcome unknown, Failed · bounced, Sent · delivery not confirmed, Delivered, Withdrawn.
- **Snapshot.** Opening a message shows, on the left, who it goes to (fixed when prepared), the shared mailbox it comes from and the recipient's notice preference, then the facts it was built from (source fact version, partial shipment, template publication, follow-up owner). On the right are three tabs: Message, Facts and History. The Message tab shows the exact email (To, From, Subject and body, including the fixed stop instruction and sign-off), a readiness check, an optional sending note, Confirm and send, and Withdraw.
- **Confirm and send.** A dialog restates the recipient, subject, content check and template, says what is checked again before the message leaves and that delivery is not claimed, and names the sender. In the prototype it is simulated: nothing leaves PPO.
- **History.** Prepared, Confirmed (Queued), Submitted, Sent ("copy found in Sent Items") and "Delivery not confirmed". Delivered shows only from positive evidence.
- **M4.** The drafter cannot send. The approver sees "You can send it: you did not draft it", writes a required approval note and uses Approve and send.
- **Needs follow-up.** A held message keeps its prepared content, dimmed, with the reason and its owned follow-up; Open follow-up is the main action. Outcome unknown offers only Check Sent Items: a copy found makes it Sent (or Failed if a bounce came back), and no copy queues it again. Failed shows the matched non-delivery report and the follow-up; there is no resend.
- **Message classes.** One row per class with how it is sent, its sending switch (On · synthetic, or Off), the current template and the duty a sender needs. Turning a class off asks for a reason and lists what happens to pending messages.

### States

Content changed while open (nothing sent; show the current message); independent sender required; view only (no send duty); held when you confirmed (the contact opted out a minute earlier); send not confirmed (check again; PPO returns the first result and never sends twice); nothing to send; could not load.

### Tablet and phone

- **Tablet.** The rail and side menu collapse and the register keeps its columns.
- **Phone.** One compact header, as the [phone header amendment](phone-header-amendment.md) later adopted for every phone page: menu with an unread dot, the view name with its count (opening the Choose view sheet), search, Conversations and filter. At 320 px search and filter combine into one control. The message opens full screen under a record header (back, position, previous and next, More) with flush sections and one full-width 48 px Confirm and send in a sticky bar. Withdraw, Open work order and Open template are under More. The confirm, view and filter sheets have a white body and a light grey heading row.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | Customer messages live in the Email workspace as a side-menu group, at `/email/customer-messages`. The personal mailbox status card shows on Inbox views only | No page; the register names `/email/drafts` |
| D2 | The queue opens a PL-04-style snapshot: the recipient and source facts on the left, the exact message and its send actions on the right. The full record at `/email/customer-messages/[id]` uses the same layout | Not drawn |
| D3 | Confirm and send always opens a dialog (phone: a sheet) that restates recipient, subject, content check and template with the sender's name; M4 reads Approve and send | Not drawn |
| D4 | Grid states read plainly with their qualifier ("Sent · delivery not confirmed", "Held · do not notify", "Failed · bounced", "Outcome unknown") | S2 display states only |
| D5 | Message classes is a read view with one switch per class, changed through a dialog with a required reason. Templates stay in Template management and notice preferences on People | Switches by API only |
| D6 | The frames show S3–S6 facts (carrier, consignment, partial shipment, revised ETA, update revision) that S2 does not bind yet; each stage adds its own bindings | S2 binds customer, recipient, site and reference only |
| D7 | Held and failed messages keep their prepared content visible, dimmed, with the follow-up as the main action. There is no resend button | Not drawn |
| D8 | Phone views use one compact header row, flush record sections, full-width 48 px main actions in a sticky bar, and sheets for choosing a view, filtering and confirming. Adopted for every phone page by the [phone header amendment](phone-header-amendment.md) | The global phone header with toolbar rows |

## 5. Not decided and not drawn

- **Building the page.** Nothing is built. The register's destination `/email/drafts` becomes `/email/customer-messages` (D1) when the page is built; this lock-in leaves the register path unchanged.
- **Prerequisites for a build:** the S2 API (merged); D-025 stage S3 for M1 and M2 sources, S5 for M3 and S6 for M4; the read model behind the register and the snapshot; the Email side-menu group as a shell change; and, for live sending, S4 (the shared mailbox and its scoped app registration).
- **Personal correspondence.** The Emails EC-01 reply composer stays an EC-04 proposal until [ADR-0059](ADR-0059-email-sending-from-ppo.md), still proposed, settles sending from a person's own mailbox. This design covers customer notices from the shared mailbox only.
- **Not drawn:** SMS (no delivery record yet); M3 Visit confirmation (waits for appointments, S5); a correction message; template proposal and publishing (DK-06); My Work follow-up cards; reply handling in the shared mailbox (Outlook); phone records for M4, held, outcome unknown and failed messages; phone versions of the states; 200% zoom.
- **Open items:**
  - The accepted Organisations CS-01 design lists `SYN-PPO-WO-000040` under SYN Hillview Growers, as this design and Changes and follow-up PL-04 do, but the accepted Service requests SV-01 design links it to SYN Greenhouse Demonstration (also noted in the Emails decision).
  - The accepted Projects register does not list `SYN-PPO-PRJ-000014` or `-000019`, which this design, Emails and Stakeholder updates use (Stakeholder updates Q4).
  - The shared top bar's breadcrumb separator "/" has a contrast of 2.52:1. It is decorative and the same on every accepted page; any change belongs to the shell.
- **Data in the frames:** the people, addresses (`*.example`), organisations and records are synthetic, and the shared mailbox address is a placeholder (Q2).

## 6. Audit and polish

- **First pass, at Dean's request.** Measured every single-line text for truncation and clipping and fixed the findings; corrected a Failed status shown in warning orange to the danger colour; shortened a clipped M4 header line. Then rebuilt the phone views after Dean's Pipedrive screenshots: one compact header, the Choose view and Filter sheets, and a flush message view.
- **Second pass, at Dean's request.** Made the phone main actions full-width 48 px buttons (they were 38 px and squeezed at 320 px) and moved Withdraw into More; gave every sheet a white body and a light grey heading row with close on the left and a centred title. Checked the wording against the S2 contract: a held message is held when it is prepared (one history entry, not two); an unanswered hand-over has no separate recorded step; "No notice preference recorded" replaces "Allowed" where nothing is recorded; follow-up due times match the 09:00 story.
- **Phone header fixes.** Search and filter combine into one control at 320 px with an 18 px title; the Conversations action uses the Light comments icon; the menu button shows a red dot for unread notifications.
- **Prototype play-through.** Found and fixed an invisible "Not claimed" label (white text), made the phone message scroll inside an 844 px viewport with the header and action bar fixed, added the 390 Needs follow-up list and the Message classes view after a switch change.
- **At lock-in.** The phone frames swapped their hand-built headers for Shell / Phone header · compact `1530:110`.

The audit is recorded on the notes card `1513:401800`.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma and measured every single-line text against its rendered width. After the audit no text is clipped; long titles in phone list rows end in an ellipsis by design.
- On 19 October 2026 Claude played the desktop, phone and phone 320 flows in the Figma desktop app's Present mode. Every link worked; the four findings above were fixed. The fixes were then checked in the file rather than replayed, because the app had moved to another page another session was using. All 78 navigation links resolve to frames on the page.
- The 28 captures are copies of the accepted frames on the "Captures (icon-free)" page from y = 330,000. Navigation links were removed from the copies (153 nodes) and the capture page's flow starting points were restored. Each of the 902 Font Awesome icon instances was swapped for `Icon/placeholder`. Scans then found:
  - no Font Awesome instance and no vector outside a placeholder;
  - none of 1,779 visible texts with a stored colour that differs from its bound variable;
  - no text below its WCAG contrast threshold except the shell's decorative breadcrumb separator (section 5).
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder; the hashes are in the [captures README](../reference/ui/email-calendar/customer-messages-design-r01/README.md).
- The named version "Customer messages — accepted" was saved on 22 October 2026 in the Figma desktop app at Dean's request: "Yes, save the named Figma version "Customer messages — accepted"." Claude used Ctrl+Alt+S, checked the typed title in the save dialog, and confirmed the entry at the top of version history. The version was saved after the lock-in, so it contains the capture copies and the File index row. The page header and notes card were then updated to record the save.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
