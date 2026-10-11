---
document_id: PPO-CRM-LEAD-RECORD-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; record reads, lead email and file links, email sending, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 40ac5a01439d37a09fcba5a031afa4efab30711d
versioning: git
---

# Lead record page and shared record layout — owner decision

On 11 October 2026, after the register pages were designed in Figma, Dean pointed out that every register still needs a full page for each record:

> "we will still need dedicated pages of each individual ID relating to things such as leads, work orders, projects, etc."

Most of those routes already exist (`/sales/leads/[id]`, `/service/work-orders/[id]`, `/projects/[id]` and others), but none had been drawn in Figma. Claude recommended one shared record layout, drawn first for the lead page, and Dean answered "Proceed with your recommendations".

The design was then developed in four rounds the same day:
1. **Revision:** Dean asked Claude to "ensure you have included all the information in the leads record page", including "a section for emails and files". Claude checked his live Pipedrive lead panel and his two Pipedrive audit documents.
2. **Polish:** Dean asked for "a visual polish". During it he decided that the Email tab writes and sends emails, that the details column scrolls, and that the Activity tab follows Pipedrive's.
3. **Refinements:** Claude listed five, and Dean answered "Proceed with your recommendation".
4. **Acceptance:** Dean saved the named Figma version "Lead record page — shared record layout, accepted".

This record retains:
- his decisions;
- the design reference and its icon-free captures;
- the conformance declaration;
- the departures from today's page;
- what remains open.

Scope: the existing lead record route `/sales/leads/[id]`, register entry `route:/sales/leads/[id]`, CRM leads including the LC-11, LC-12 and LC-17 additions. The layout is proposed for the record pages of the other registers, but that is not decided until a second record type has been drawn on it. No parent requirement ID is added or renamed.

This is a design decision. It authorises none of the following:
- application code or new reads;
- a lead link on email records or document references;
- email sending or a mailbox connection;
- a route change or migration;
- a permission or capability;
- deployment.

Dean's 9 October 2026 visual review of the running page, and the page's earlier references, are retained unchanged. This design replaces their layout only when it is built.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| A full page for each record | User decision, 11 October 2026 | "For all the UI pages that include the registries/tables of data, although we have the large snapshot window that opens with the basic details, we will still need dedicated pages of each individual ID relating to things such as leads, work orders, projects, etc." The record window stays as the quick look from a register |
| One shared record layout, lead first | User decision, 11 October 2026 | "Proceed with your recommendations." Claude recommended designing the record layout once and reusing it, as the register grid was, starting with a lead. The project record keeps its Gantt planner layout |
| Everything on the lead page, with emails and files | User decision, 11 October 2026 | "Ensure you have included all the information in the leads record page. For example, there should still be a section for emails and files." Claude compared the design with Dean's live Pipedrive lead panel and his "Pipedrive Feature Audit" and "Pipedrive Configured Account Audit" documents |
| Email writes and sends | User decision, 11 October 2026 | "the email section will be for writing and sending actual emails, [not] just linking them. Emails will be linked to leads and deals in the Sale[s] Inbox page." |
| Scrolling details column | User decision, 11 October 2026 | "make the container that includes the lead summary, customer details, etc., scrollable." The details column and the activity column each scroll on their own |
| The Activity tab | User direction, 11 October 2026 | "What about the activity tab section?", with a screenshot of Pipedrive's Activity tab as the reference |
| Polish and refinements | User decisions, 11 October 2026 | "Give the page a visual polish …", then "Proceed with your recommendation" for five refinements: <ul><li>a one-row header;</li><li>honest readiness wording;</li><li>the key states;</li><li>shared components for the desktop views;</li><li>a contrast check and the phone action sheet.</li></ul> |
| Acceptance | User decision, 11 October 2026 | Dean saved the named version "Lead record page — shared record layout, accepted" |
| The other recommendations on the notes card | Claude's recommendations, adopted | <ul><li>Pipedrive's lead page as the reference, adapted to PPO's records and rules.</li><li>The main action is the record's next step; the rest sit under "…", with destructive ones last and in red.</li><li>"Ready to convert" from the app's conversion requirements.</li><li>Other open work with the same customer, to avoid duplicate leads.</li><li>A neutral owner avatar: the app's pale green avatar fill is not used behind navy text.</li><li>The sample is a lead the signed-in person owns.</li></ul> |
| Building the page, the reads, email sending and the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Lead record page — shared record layout, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Lead record page (accepted)" `224:2`: <ul><li>desktop record page `226:208`;</li><li>its Activity `247:1950`, Emails `234:1141` and Files `234:1782` views;</li><li>the Leads register entry `226:17`, whose record window gains "Open lead page";</li><li>the states section `255:2955`;</li><li>phone list `228:809`, Details `228:1060`, Activity `228:1156`, Emails `235:1790`, Files `235:1928`, New activity `249:2273` and New email `244:2114`.</li></ul>Its notes card `230:1087` lists the scope, layout, rules, handovers, decisions, recommendations, the Pipedrive comparison, what is open and what is not drawn |
| Components, proposed as shared | <ul><li>Record / Header `224:32`</li><li>Record / Readiness bar `239:1800` and Record / Check item `239:1799` (Done, Asked later, Missing)</li><li>Record / Banner `251:2310` (Info, Warning, Neutral)</li><li>Record / Field `224:12` (Text, Link, Missing)</li><li>Record / Section heading `224:13`</li><li>Record / History item `224:19`</li><li>Record / Filter chip `224:31` (with a count)</li></ul> |
| Page components | Lead record / Details column `252:2947` and Lead record / Focus card `252:3444`. All four desktop views use them, so the views cannot drift |
| Prototype | Flows "Lead record — desktop (proposal)" and "Lead record — phone (proposal)". New Prototype switches: `recordmenu/open` and `phoneactions/open` |
| Retained captures | [Lead record page design r01](../reference/ui/crm/lead-record-page-design-r01/README.md): seven icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing route `/sales/leads/[id]` (`src/app/(business)/sales/leads/[id]/page.tsx`, which today renders the lead as a dialog over the Leads list through `LeadDetail` in `src/components/leads-workspace.tsx`), register entry `route:/sales/leads/[id]` ("Lead detail"). Capabilities, unchanged: `crm.lead.read` to see a lead; `crm.lead.edit` and `crm.lead.convert`, with `crm.opportunity.create`, held through the lead owner's authority, to change or convert it. No capability is invented for sending email or adding files |
| Page type (r20) | Record / evidence workspace. On the phone: one full-screen record page with tabs. These keep their own types and are not redesigned here: <ul><li>the LC-11 conversion review;</li><li>the LC-12 resolution and transfer forms;</li><li>the + Lead form.</li></ul> |
| Reused components | <ul><li>Rail · Sales (proposal), Shell / Top bar, Button, Tag, Brand / Logo and v2 / More panel.</li><li>The accepted Leads register, record window and phone list (the Leads design, `docs/decisions/leads-design.md`, still in review as pull request 426).</li><li>The Lead snapshot (phone) header and footer.</li><li>Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>New, proposed as shared: the components in section 2.</li></ul> |
| Source authority | <ul><li>`LeadDetail` in `src/components/leads-workspace.tsx`: the captured enquiry, resolved customer context, requirement, next activity, notes and history, and the lead actions.</li><li>`src/crm/leads/reads.ts`: `can_edit` and `can_convert`.</li><li>`src/crm/leads/validation.ts`: what conversion requires.</li><li>Migrations 0003 and 0028: activity types, timing, and the outcome rule.</li><li>Migration 0002: the organisation, site, person and relationship fields.</li><li>Migration 0015 and [email-calendar-design.md](email-calendar-design.md): email records and the email-tab direction.</li><li>[DK-01/DK-02](document-register-linked-library-design.md): linked documents, with SharePoint as the authority.</li><li>[crm-leads-runtime.md](crm-leads-runtime.md), [lead-customer-context.md](lead-customer-context.md) and the [lead-to-delivery continuity contract](../contracts/lead-to-delivery-continuity.md).</li></ul>Fixture: synthetic `SYN-PPO-LEAD` and `SYN-PPO-OPP` references, people, `.example` addresses and a phone number from the range reserved for fictional use |
| Incoming handover | <ul><li>The Leads register: a row, or "Open lead page" in the record window.</li><li>Activity links from My Work.</li><li>Global search.</li><li>Emails linked to the lead in the Sales Inbox.</li><li>Documents from the linked library.</li></ul> |
| Outgoing handover | <ul><li>Emails sent from the lead go through the connected mailbox.</li><li>The next activity opens in My Work.</li><li>Organisation, site and contact open their shared records.</li><li>Files open from SharePoint.</li><li>Convert to deal opens the LC-11 review, then the new Discovery deal; on a converted lead the follow-up continues on the deal.</li></ul> |
| States shown | <ul><li>The record page with its Note, Activity, Email and File tabs, Focus and History.</li><li>The "…" menu.</li><li>Six states:<ul><li>no next activity;</li><li>someone else's lead (read only);</li><li>converted;</li><li>archived;</li><li>disqualified;</li><li>Mark as done asking for the outcome.</li></ul></li><li>The phone record page with four tabs, the action sheet, and full-screen activity and email forms.</li></ul>Loading, error and stale states are not drawn |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. Departures

These depart from today's lead page. They are accepted for this page's desktop (1440 px) and phone (390 px) compositions.

| ID | Departure | Today |
|---|---|---|
| R1 | A full page at `/sales/leads/[id]`, with no secondary menu. The breadcrumb ("Sales / Leads / reference") returns to the register | A dialog over the Leads list |
| R2 | One header row: title and status, the record's position with previous/next, the main action and "…". Below it: reference, the owner with an avatar, and origin | Dialog heading with reference, title and status |
| R3 | A readiness bar. "Ready to convert" lists the conversion requirements in `src/crm/leads/validation.ts`: <ul><li>an organisation;</li><li>a site, or a reason it is unknown;</li><li>a contact, or a reason it is unknown;</li><li>the requirement;</li><li>a next activity.</li></ul>The qualification note is shown as "asked when you convert". A real gap shows in amber, with words | Not shown |
| R4 | A banner for the record's state: read only (another owner), converted (with Open deal), archived (with Unarchive) and disqualified (with Reopen), each with its date, person and reason | Pills and a converted section inside the dialog |
| R5 | A 380 px details column with collapsible sections divided by lines: <ul><li>Summary, including last activity and age, which are derived;</li><li>Captured enquiry;</li><li>Organisation, including other open work at the same customer, which needs a new read;</li><li>Site;</li><li>Contact, with phone, email and preference;</li><li>Requirement.</li></ul>It scrolls on its own | Fact lists in one dialog scroll |
| R6 | A composer with four tabs: <ul><li>Note: written in place.</li><li>Activity: a form with subject, the five PPO activity types, a start and end time or a deadline, whole day or no date, owner, links, "make this the lead's next activity", and Mark as done, which asks for the outcome.</li><li>Email: writes and sends from the connected mailbox and links the email to the lead.</li><li>File: uploads to SharePoint or links a document.</li></ul> | Add note and Plan next activity open dialogs; no email or file |
| R7 | Focus: the next activity, with Tomorrow, Next week and Pick a date chips that open the Activity tab with the date filled in | A Next activity section |
| R8 | History grouped by day, filtered by All, Notes, Activities, Emails, Files or Changes, each with a count | One combined list |
| R9 | Emails on a lead. Existing emails are linked to leads and deals in the Sales Inbox page; today `email_messages` links an email only to a deal (`opportunity_id`) | No lead emails |
| R10 | Files on a lead, through the linked library: SharePoint stores the file, and PPO keeps the link, version and who added it. Today document references exist only for work orders | No lead files |
| R11 | Phone: tapping a lead opens the record page directly, with Details, Activity, Emails and Files tabs and fixed footer buttons. "…" opens an action sheet; "Plan an activity" and "Write an email" open full-screen forms | The dialog, and the accepted Leads phone record view |
| R12 | The record window on the Leads register gains "Open lead page" | Not in the accepted Leads design |

The record layout leaves out, as Pipedrive-only features:
- Value, Labels and Expected close date (a PPO lead has none);
- Sequences and WhatsApp;
- Smart Bcc;
- Merge and Delete;
- organisation website, LinkedIn, revenue and staff numbers;
- activity priority, location, video call, description, free/busy and note;
- pinned notes and email drafts.

## 5. Not decided

- **Building the page.** The full page, the new reads (readiness, last activity and age, other open work, history counts and day groups) and the in-place note need their own decisions and pull requests.
- **Email sending.** It needs the Microsoft mailbox connection described in the [Microsoft pilot](../delivery/email-calendar-microsoft-pilot.md), and a capability decision. The 8 September design left sending out of its first increment; Dean's decision brings it into scope. Recommended: build it with the mailbox pilot.
- **Lead links.** Email records and document references need a lead link.
- **The shell rollout.** As for the registers, the shell parts are decided separately for every page.
- **Open questions:**
  - Files: one SharePoint folder per lead, which the deal takes over on conversion? Recommended: yes.
  - "Make this the lead's next activity" replaces the current next activity. Recommended: ticked by default when planning from a lead.
  - Priority, location or a description on PPO activities? Recommended: not yet; the subject holds up to 2,000 characters.
  - Other open work: show the deals and leads at the same organisation that the person may see? Recommended: yes.
  - Edit in place, as Pipedrive does? Recommended: keep the Edit lead form for now, because some changes need a reason.
  - Is the layout really shared? Recommended: prove it on the work order record page next.
- **Not drawn yet:**
  - loading, error and stale states;
  - the deadline, whole-day and no-date variants of the activity form;
  - reading a full email thread;
  - a file preview;
  - upload and send failures;
  - the Sales Inbox linking screen;
  - the LC-11 and LC-12 forms;
  - the phone versions of the six states;
  - a record with sub-pages.

## 6. Verification

- The seven captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`: 807 icons in all. A check after the swap found none left. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/crm/lead-record-page-design-r01/README.md).
- A contrast check of the text colours against their backgrounds passed WCAG AA (4.5:1 for small text). The lowest pair is grey text on the light-grey panels, at 4.62:1.
- Claude checked every frame with screenshots inside Figma and audited the prototype links on the page. No navigation link points off the page, and no frames overlap. Claude could not run Present mode. Dean saved the named version after the refinement pass.
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `node scripts/design-baseline-check.mjs` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## 7. Consequences

- No application code, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- The next record page drawn on this layout tests whether its parts are shared. Any change it needs receives a new named version and a new capture revision folder; these bytes stay unchanged.
