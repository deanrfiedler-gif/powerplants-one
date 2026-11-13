---
document_id: PPO-DOCS-MESSAGES-REFINED-FIGMA-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Proposal drawn and audited by the owning session, 12 November 2026; awaiting Dean's review; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, SharePoint, Microsoft 365, Graph, mail or SMS integration, customer communication or deployment; every record, hash, message and mailbox shown is synthetic
source_commit: a65ac3f4a9a675f68c47567d8070a098b4f31b3f
versioning: git
---

# Documents and messages refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Proposal, drawn and audited; awaiting Dean's review. Sections 1 to 8 are the proposal; section 9 records the 12 November continuation audit, made without access to the file; section 10 records the completed build with its inventory, verification and audit. No acceptance or named version is claimed.

On 11 November 2026 Dean asked for the refined UI pages of Documents and messages to be built in Figma from a written brief with Addendum A1 (shared record toolbar, accepted 9 November 2026) and Addendum A3 (persona and story reconciliation, as amended for documents and messages in its section A3.10), inside the accepted shell, organised with the page template adopted for the Sales file and to at least the standard of that file. The target is the new private Figma file Dean created on 10 November 2026, "PPO - Documents & messages module". The pages are the Document library, Outputs and Templates (reached from More › Shared records › Documents & outputs) and Email, Calendar and Customer messages (the Email workspace). His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The brief's questions Q2 to Q10 were therefore answered by their stated defaults; each is recorded in section 5 and can be reversed.

This record is a **proposal**. It records the planned compositions, rules, assumptions and remaining questions. Statements about drawn content in sections 2 to 5 come from the owning session; the continuation in section 9 could not reverify them, and section 10 records the read-back from the file. It changes no code, test, migration, seed, permission or route, and it authorises no business transaction, integration or customer communication. Four statements stay separate throughout: code delivery (none), design acceptance (Dean's, not given), production readiness (not inferred) and integration with SharePoint, Microsoft 365, Graph, any mail or SMS provider or any customer (none exists beyond the synthetic channel, none authorised).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Chrome and geometry: 48 px top bar with global search, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, the 280 px docked workspace menu with nested views (R108), the collapsed strip as sheet K draws it, the 1024 top bar (332 / 360 / 332), the record header toolbar and its phone component (Addendum A1; R116 to R125), the right drawer's Files tab (sheet AK), the File drop overlay (R93) and the More workspaces panel (sheet E) |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: the page template, sheet labels, the Read me cards, the page kit (status chip, button, avatar, checkbox, filter chip, tab, KPI tile), the 101 icon stand-ins, the tablet and phone chrome, and the build-time helper library |
| Private Figma file "PPO - Design", the six accepted pages: Document library DK-01 · DK-02, Output, issue and distribution DK-03 and Template management DK-06 (accepted 15 October 2026), Emails EC-01 with Amendment A1 and Calendar EC-03 (19 October 2026), Customer messages EC-04 (22 October 2026) | Frozen reference for content, accepted rules and stories; its shell is not copied |
| The brief of 11 November 2026, Addendum A1 and Addendum A3 with section A3.10 | Decisions D1 to D13, the persona and capability matrix, scenarios S-01 to S-30, the sheet inventory and the synthetic dataset as at Thursday 5 November 2026, 09:00 AEDT |
| [BP-01](../blueprints/BP-01-master-blueprint.md) section 16 | DOC-01 to DOC-06; "generated, approved, issued, sent, delivered and acknowledged are separate events"; the output register OUT-01 to OUT-18; CRM-03, PAR-06, IF-06, IF-09, IF-10, TR-03, NFR-10, NFR-11. No `EML-` parent exists; no parent requirement ID is added or renamed; all 78 remain |
| Accepted page decisions: [Document library](document-library-figma-design.md) (PPO-DK01-DOCLIB-FIGMA-DEC), [Output, issue and distribution](output-issue-figma-design.md) (PPO-DK03-OUTPUTS-FIGMA-DEC), [Template management](template-management-figma-design.md) (PPO-DK06-TEMPLATES-FIGMA-DEC), [Emails](emails-figma-design.md) (PPO-EC01-EMAILS-FIGMA-DEC with A1), [Calendar](calendar-figma-design.md) (PPO-EC03-CALENDAR-FIGMA-DEC), [Customer messages](customer-messages-figma-design.md) (PPO-EC04-CUSTOMER-MESSAGES-FIGMA-DEC) | The rules each page keeps (R, Q, V, D and G numbers as cited in sections 4, 5 and 7) |
| Customer communications: [D-025](customer-communications-d025.md), [ADR-0058](ADR-0058-outbound-customer-email.md), [ADR-0059](ADR-0059-email-sending-from-ppo.md), [core S2](customer-communications-core-s2.md), contract `docs/contracts/customer-communications.md` | A named person sends every customer message; notices differ from correspondence; states, hold reasons and the fixed stop wording |
| Backend records and contracts: [document library](document-library-backend.md), [native reads](document-library-native-reads.md), [output register](output-issue-register-backend.md), [output actions](output-actions-backend.md), [register facts](output-register-facts.md), [distribution applicability](output-distribution-applicability.md), [template catalogue](template-catalogue-backend.md), [drafts](document-template-drafts-backend.md), [publication](template-publication-backend.md), [use assignment](template-use-assignment-backend.md), [renderer manifest](template-renderer-manifest.md), [template workspace reads](template-workspace-native-reads.md), [controlled output recovery](controlled-output-recovery.md), [document identity recovery](document-identity-recovery.md); contracts `document-library`, `output-register`, `output-actions`, `document-issue-distribution`, `template-catalogue`, `document-template-drafts`, `template-publication`, `template-use-assignment` | Lifecycles, state words, refusals and limits as built |
| [Naming, communications and SharePoint](naming-communications-sharepoint.md) (PPO-NAM-DEC), `AGENTS.md`, [PPO-STD-001](../standards/naming-conventions.md), [readable reference namespaces](readable-reference-namespaces.md) | SharePoint owns business files and native CAD keeps authorship; reference forms |
| [Shell refined concept](shell-refined-concept-design.md) sections 10 and 11, [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [named version hand-off](figma-named-version-build-handoff.md), [ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md), [HTML module conformance](../standards/html-module-conformance.md), [design, build and review roles](design-build-review-roles.md) | The record form, the nine-field declaration, the rule that no Figma link or file key is written into the repository |

## 2. Conformance declaration

### 2.1 The set

| Field | Declaration |
|---|---|
| Scope identity | Documents and messages: `scope:DK-01` and `scope:DK-02` (Document library), `scope:DK-03` (Outputs), `scope:DK-06` (Templates), `scope:EC-01` (Email) with the mailbox status that `scope:EC-02` owns, `scope:EC-03` (Calendar) and `scope:EC-04` (Customer messages), under parents DOC-01 to DOC-06, CRM-03, PAR-06, IF-09 and OUT-17. Routes are listed per scope in 2.2. No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Work queue with persistent detail (the mailbox); Register on a time grid (the calendar); Planning workspace (Site use); Form / guided workflow as 432 px right panels, centred dialogs and full-screen phone sheets; states; tablet and phone variants. Per scope in 2.2 |
| Reused components | Local copies of the accepted shell under the same names: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked, Shell / Workspace menu · collapsed strip, the 1024 top bar, Shell / Record header · toolbar and its phone component, Shell / File drop overlay and the Files-tab drawer; 101 shell icon components (Lucide stand-ins for Font Awesome Light, ADR-0050) and the brand mark; the "PPO colour" variable collection (66 variables, the same names and values as the Shell and Sales files); the Sales page kit under its Sales names. Proposed in this file: the docked Documents and Email menus and the More panel's My workspace column (section 5) |
| Source authority | Dean's brief and its decisions D1 to D13 with Addenda A1 and A3; the six accepted page decisions in section 1; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as service manager Jordan Kim unless a sheet names another person |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn stores or edits a business file, regenerates an issued output, treats a durable render as an issue, records Sent or Delivered on Outputs, claims a delivery without positive evidence, offers a resend, sends without a named person, lets a drafter send an M4, lets a registrar or author review, links an email silently or writes to Outlook |
| Exceptions and recovery | Drawn per page (section 3): loading without counts, true-empty and filtered-empty, could not load with the source named, denied or not found, view only, version conflict, source changed (refused, nothing recorded), a read window reached ("At least this many"), SharePoint, the mailbox, the render worker or the channel unavailable, outcome unknown with reconciliation and never a resend, offline on the phone |
| Departures | Section 5 |
| Verification | Section 6 |

### 2.2 Per scope

Across every scope: SharePoint keeps every business file and PPO keeps exact evidence (`AGENTS.md`; PPO-NAM-DEC; DK-01 R5); generated, approved, issued, sent, delivered and acknowledged are separate events (BP-01 section 16; DOC-02, DOC-05); a named person sends every customer message and notices differ from correspondence (D-025 C2; ADR-0058; ADR-0059); email is private and linking explicit (EC-01 D2, D5; BP-01 16.3); every review is independent (DK-01, DK-06, EC-04 Q3).

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| DK-01, DK-02 Document library, `/documents`, `/documents/library/[id]` | Register; Record detail; Form | Registrations, exact revisions, findings, independent reviews and declared links. SharePoint owns files; each linked record keeps its own authority | Exact sources: synthetic text, an issued job pack or an issued service report from issues the registrar can open; organisation, site, asset, project, work order and engineering package reads | Declared links to records; review and finding items to My Work; "Library evidence, not permission to work" |
| DK-03 Outputs, `/documents/issues`, `/documents/issues/job-packs/[id]`, `/documents/issues/service-reports/[id]` | Register; Record detail; Form | The issue register and synthetic distribution. Service owns packs, reports, checks and reviews; My jobs owns acknowledgement | Checked packs and reviewed reports to issue (SV-05, SV-06); acknowledgements from My jobs (FI-01) | Issued outputs with hashes; distribution facts; the record Outputs menu (R119); "Issue facts, not permission to send" |
| DK-06 Templates, `/documents/templates`, `/documents/templates/[family]/[id]`, `/documents/templates/proposals/[id]`, `/documents/templates/use` | Register; Record detail; Planning workspace; Form | Definitions, proposals, publications and use assignments. Pack preparation resolves the site selection itself | Family reads (`pack.read`, `report.read`, `finance.read`, `template.read`) | Published definitions and site use read by pack preparation; "Catalogue facts, not permission to render" |
| EC-01 Email, `/email`, `/email/[id]` (mailbox status from EC-02) | Work queue with persistent detail; Form | Links, shares, follow-ups and correspondence states. The mailbox provider owns mail; My account owns the connection and the send-as consent | The person's own mailbox (Inbox and Sent items, last 30 days, synthetic provider); records the person can read, for suggestions | Explicit links and single-message shares on records; follow-ups to My Work; "Reconnect" hand-offs to My account |
| EC-03 Calendar, `/calendar` | Register on a time grid; Form | Meeting links and planned follow-ups. Outlook owns meetings; the Service planner owns visits | Outlook meetings (read only); PPO Due items | PPO activities; links on records. Nothing is written to Outlook |
| EC-04 Customer messages, `/email/customer-messages`, `/email/customer-messages/[id]` | Register; Record detail; Form | Preparation, confirmation by a named sender and the ledger. Each source page owns its facts; People own channels and notice preferences | Moved dispatches and revised customer ETAs (SC-06, SC-07); fixed update revisions (PJ-08); confirmed appointments when built | Messages and their outcomes read back on the source record; held and failed follow-ups to My Work; bounce flags to People |

## 3. Sheet inventory

The inventory is in section 10.2: 213 sheets on eight scope pages, each with its code, name, section and node ID. The pages in the file: Document library · DK-01 · DK-02, Outputs · DK-03, Templates · DK-06, Email · EC-01 · EC-02, Calendar · EC-03, Customer messages · EC-04, Interaction states · DK · EC and Administration · DK · EC, with Read me, the two separator pages, Shell and kit and Scratch. Every scope page sits under "— Proposals —". Page types per scope are in 2.2.

## 4. Rules applied

- **Shell geometry and tokens.** Every desktop sheet instances the copied top bar, rail (the signed-in person's department current, nothing selected for Documents or Email) and right strip, with the proposed docked Documents or Email menu or the accepted collapsed strip. Panels are 432 px at x 960 without a scrim; dialogs are 560 to 720 px over a 32 % navy scrim; Roboto 11 to 20 px; colours bound to the "PPO colour" variables.
- **One line per cell; no second search.** Register cells never wrap; the table scrolls sideways with a frozen first column. The only search in a content area is the accepted backend filter in the toolbar of the Document library, Outputs and Customer messages; Templates has none.
- **Shared record header (Addendum A1).** Document, output, template definition, template proposal and customer message records open with the accepted record header toolbar: one state-driven primary, a labelled Actions menu, Outputs only where the record has outputs, previous and next in the view, no Undo and no New.
- **Six events stay separate.** Generated, approved, issued, sent, delivered and acknowledged appear as separate words in a fixed order; an absent event reads in words; Outputs distribution reads Prepared, Simulated sent, Simulated not sent or Outcome unknown, and real sent and delivered times read "Not recorded".
- **Independence.** The person who cannot act sees the primary disabled with the reason (R117): the registrar or source author cannot review; the responder cannot accept; anyone who saved a proposal revision cannot review or publish it; the drafter cannot send an M4.
- **Honest counts.** Outputs totals only when every selected family is Complete; Customer messages counts state their 200-message window; no counts in the Document library menu or anywhere in Templates; the calendar's Due lane counts nothing.
- **Page template.** Read me with four cards; separators; one page per scope; six sections per page (Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, Flows and notes) with 360 px gaps; every sheet labelled 26 px above it as `CODE · Page — state (scope ID) [signed in as …]`.

## 5. Assumptions and proposed departures

Each proposal remains for Dean's decision. Section 9 distinguishes later repository evidence from the owning session's account. Section 10.3 adds A22 to A36 from the completed build and points to each page's own list.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The file is recorded by the name Dean gave it, "PPO - Documents & messages module". The design-to-build standard names no documents-and-messages domain file | Record this file as the file for that domain; change nothing in the standard here |
| A2 | The accepted collapsed docked menu is 12 px wide (Shell sheet K: strip at x 80, content from x 92, 1300 px). The brief and Addendum A1.6 give 80 px and a 1232 px content width, which is the component set's canvas width, not the strip | Keep the shell as the source of truth (12 px, 1300 px), as the Service record already found |
| A3 | Two docked menus are proposed for the Shell file: Documents (Document library, Outputs, Templates, each nesting its accepted views while current) and Email (Mailbox, Customer messages, Calendar, with the mailbox status card at the foot). They are compositions of the accepted docked-menu items, with a neutral accent because neither is a department. A My workspace column is proposed for the More panel, matching the code's More menu | Adopt in the Shell file (Q2 default) |
| A4 | The rail keeps the signed-in person's department as current with nothing selected on Documents and Email pages (DK-01 R2); the rail label "Email" outside Sales stays EC-01 Q2 | Keep until EC-01 Q2 is decided |
| A5 | Jordan Kim is signed in for the file; Robin Hale and Jess Wong on the Customer messages flagship sheets; other people only on sheets that name them (Q3 default) | Keep |
| A6 | The shell, kit, icons and chrome are local components rebuilt from the accepted files' serialised measurements under the same names, because the Plugin API cannot copy nodes between files; node counts match the sources. Three adaptations: the record header's sub-line fills the header width so the header can sit at 1300 and 1032 px (identical at 1312); the Files-tab drawer is a local component made from the Shell's sheet AK; a technician phone tab bar is derived from the Sales phone bar | PPO - Library now exists but is unpublished; assess replacement only through its separate reviewed handoff after publication, preserving accepted names and verifying component identity |
| A7 | Outputs draws the two built families (OUT-09 job pack, OUT-10 service report); OUT-06, OUT-11, OUT-12, OUT-13 and OUT-14 are a labelled proposal sheet (Q4 default) | Keep until each family joins the register |
| A8 | Customer message classes M5 to M10 are drawn as proposals awaiting an extension of D-025 (Q5 default) | Dean extends D-025 or strikes the classes |
| A9 | Showing CUS-EMAIL as a fourth family in the Templates UI is proposed (Q6 default); the synthetic CUS-EMAIL backend already exists under S2, in sibling tables with its own publication rules | Decide with the D-025 stages |
| A10 | The personal mailbox connection stays in My account; this file draws only the mailbox status card and the states that send a person there (Q7 default). EC-02 has no page and no decision record | EC-02's own design remains open |
| A11 | The composer is drawn under ADR-0059 option C: correspondence from the person's own mailbox after a send-as consent recorded in My account (Q8 default) | Keep |
| A12 | Times are Melbourne (AEDT), stated once per list (Q9 default). The accepted pages and the code use Brisbane (AEST), an earlier fixture | Keep, as the My Work file decided |
| A13 | Team availability is drawn as free/busy only behind a proposed permission, with "Service visits are not in Outlook" (Q10 default; EC-03 Q1) | Decide with EC-03 Q1 |
| A14 | Role assumptions: Jordan Kim assigns site use; Robin Hale holds the supply duty and publishes the M1 and M2 templates; Jess Wong publishes the M4 template; Sam Patel proposes templates | Confirm when grants are seeded |
| A15 | Story reconciliations of the brief's D10 and Addendum A3.10: Jordan Kim as Service owner, publisher and independent reviewer; Robin Hale and Jess Wong as senders; SYN-PACK-000071 r01 superseded by r02; SYN-RPT-000039 r01 and r02; Priya Shah's held copy; the withdrawn Update 3 of SYN-PRJ-000033; `SYN-DPT-` for Finance disputes; SYN-DSP-000064's destination | The Service, Supply, Projects and Finance files align their rows |
| A16 | Earlier fixtures superseded here: the 12 to 15 October stories; Jordan Hale as Service owner, reviewer and publisher; Sasha Cole as sender; Alex Nguyen as author; Priya Shah as the Block C site contact; Mei Tan; SYN-PPO-PACK-000066 as a Block C pack; SYN-PPO-WO-000045; "SYN Riverbend Propagation House" | Keep the accepted pages as frozen reference |
| A17 | References use the short forms (`SYN-DOC-`, `SYN-PACK-`, `SYN-RPT-`); customer messages are named by class, source and recipient; no `SYN-MSG-`, `SYN-OUT-` or `SYN-EDOC-` family is proposed. Addendum A2 (reference form) was not supplied with the brief; the rule was taken from the brief's D9 and [readable reference namespaces](readable-reference-namespaces.md) | Keep |
| A18 | Hashes are set in Roboto in the short form with Copy; the kit carries no mono face | Keep |
| A19 | The accepted Files tab reads "Upload file" and "Drop files anywhere on this record to attach them here". On documents sheets the tab and the drop overlay register a SharePoint link through the record's own command and never store a file in PPO (the brief's D2; R93) | Decide the Files tab wording in the Shell file before it is built |
| A20 | The tablet sheets keep the Calendar action in the accepted 1024 top bar, as the Sales file drew it; R87 moves it to the rail below 1024 | Keep |
| A21 | Register source/location notes need reconciliation in the documented separate handoff; EC-02 and `/email/connections` are outside this drawing scope. "Needs review" is an honest visual-review status and must remain until an actual review | Fix in the register's own reviewed change, not here |

## 6. Verification

Section 10.4 records the design verification of the completed build and its limits: the structural and position audits on every page, the renders read, the evidence, counts, capability and authority checks, and contrast computed from the colour variables. Section 9 records what the continuation without file access could verify.

## 7. Not drawn and open questions

Not drawn: SharePoint itself; native CAD and the Engineering controlled-document register EN-03; the Sales file's Sales Inbox, Activities week, Deal Correspondence and Documents tabs and Notification preferences (reused by reference); My account with the mailbox connection, consent and removal; Knowledge, Knowledge authoring and the Help Centre; the source pages that prepare what these pages issue or send (SV-05, SV-06, FN-01, ES-05, PJ-08, EN-08, SC-06, SC-07, MA-06, EQ-06, FN-02); People; Conversations; the customer portal; Teams, SMS and any live mail provider; dark mode; prototype links.

Open questions, cited and not resolved: D-012 (SharePoint retention and deletion); D-024 (customer acceptance and signature); D-025 stages S4 to S6 and its extension to further classes; any newly proposed reopening of DK-01 Q3/Q4 (both were decided "not now" in the accepted page); residual DK-03 read gaps after the exact revision/acknowledgement additions; retained-definition support under DK-06 G5 after its rendering-only contract correction; EC-01 Q2 (the rail label "Email" outside Sales); EC-03 Q1 (team availability permission) and Q2 (`Calendars.ReadWrite`); ADR-0059 E9 (team mailboxes); EC-02's own design; the SharePoint pilot N0 to N6.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, read model, migration, permission, capability, grant, seed, integration or deployment. The build is complete, and its inventory, verification and audit are in section 10. The next steps are: Dean reviews the proposal and decides the A-list; Dean saves a named Figma version, and any later design change needs a new one; the design register and the per-route page guidance follow in their own reviewed change; the two docked menus and the More panel column go to the Shell file as proposals; and the Service, Supply, Projects and Finance files align the rows Addendum A3.10 corrected.


## 9. Continuation audit — 12 November 2026

_Kept as written. The owning session completed the build the same day; section 10 answers the gates this section lists as outstanding._

**Result: incomplete, blocked on private source handoff; PR #918 stays draft.** Dean asked Codex to continue the existing work. The repository claim identifies the owning Claude session, but this Codex environment has neither that session's resume notes nor a callable way to resume it. The private Figma file key/link and connection identity, original brief (including D1–D13, S-01–S-30 and the dataset), and full Addenda A1/A3 are not present in the checkout or PR discussion. They have been requested privately. The file title alone cannot identify the target for the available Figma tools. No replacement file was created and no Figma write was attempted.

### 9.1 Sources, findings and stale guidance

The proposal and six accepted page decisions, BP-01 section 16, Shell R116–R125, named-version handoff, design-to-build standard, naming convention, current status and repository contribution rules were inspected. This is repository evidence, not direct inspection of the private source designs.

| Finding | Evidence and disposition |
|---|---|
| Original brief and full addenda unavailable in this continuation | Section 1's references are the original session's account, not recovered source bytes. Required sheet codes, counts and scenario completeness cannot be derived safely from it. Obtain the private handoff before drawing |
| Addendum A2 still unavailable | Keep A17 and the [readable reference convention](readable-reference-namespaces.md). New synthetic references use `SYN-`; already assigned references and retained snapshots stay exact. Do not manufacture A2 or claim its validation. Assumption A2 in section 5 is the strip-width question, not the missing addendum |
| DK-01 Q3/Q4 are not unanswered decisions | [Accepted page section 1](document-library-figma-design.md#1-decisions-and-evidence) resolved both as "not now". Any review-assignee or inline-viewer expansion is a new explicit proposal |
| DK-03 G3 was subsequently addressed | [Exact revision and acknowledgement facts](output-register-facts.md) records exact revision numbers and visibility-scoped recipient/acknowledgement summaries. Do not repeat G2–G5 as one undifferentiated missing-backend claim; reconcile remaining gaps individually |
| DK-06 G5 has a correction | [Rendering-only manifest](template-renderer-manifest.md) records Dean's decision and DK06-OUT09-2. Retained DK06-OUT09-1 evidence and its support failures remain distinct; the old design's open-gap text is historical |
| CUS-EMAIL is not an unbuilt backend family | [S2](customer-communications-core-s2.md) and the [communications contract](../contracts/customer-communications.md) already define synthetic proposals/publications in sibling tables. A9 proposes its Templates presentation, not a new backend or a live integration |
| Local-library guidance is dated | [12 November independent library review](library-independent-review.md) establishes that PPO - Library exists and remains unpublished. Its findings are not proof of defects in this module's copies. A6 does not authorise publishing or an unverified swap |
| Review status is not stale merely because a proposal exists | Preserve "Needs review" and existing fingerprints. The separate register handoff must name file title, scope, sheet/node inventory, actual review evidence and any later Dean-approved named version; do not infer acceptance from source presence |

### 9.2 Coverage and remaining gates

| Check | This continuation's evidence | Remaining gate |
|---|---|---|
| Live file/page/sheet inventory | 0 Figma pages inspected; 0 sheet codes, dimensions or IDs read back | Inspect the existing six scope pages plus Interaction states and Administration; enumerate every required sheet and reconcile with the brief |
| Structural and position audits | Not run on the target file | Descendant types/counts, instances, fonts, tokens, image-filled nodes, clipping, overlap, containment, labels and section positions; record intentional scrolling/ellipsis separately |
| Visual review | 0 target sheets rendered or visually inspected | Render and inspect every required sheet at legible scale; identify code/node, viewport, defect, fix and post-fix evidence. Structural scans are not visual proof |
| Dataset and story | Original dataset/A3.10 unavailable; A5/A14–A16 retained as unverified source summaries | Reconcile identities, revisions, hashes, actors, dates, recipients, held copies, withdrawn updates and cross-module handoffs, scenario by scenario |
| Counts and capabilities | Rules reviewed; no rendered content scanned | Complete versus bounded/hidden counts, the 200-message window, absence of invented totals, per-person duties and independent reviewer/sender restrictions |
| Authority | Repository boundaries reviewed; no sheet-level pass claimed | Separate generated/approved/issued/sent/delivered/acknowledged, exact bytes and native source ownership; explicit email links/shares; no implicit Outlook write or resend |
| Computed contrast | Not run; actual target-file paints, backgrounds and opacity are unavailable | Compute resolved text/background and meaningful control ratios, classify thresholds/exceptions and inspect fixes; no blanket WCAG claim |
| Repository validation | Status (413 fragments), foundation (78 parents, no errors), naming and prototype checks passed; all 44 documentation-control tests passed | Documentation scope checked again on the committed head; these checks prove documentation consistency only |
| Final-head readiness | Original head `bcdebbb5c50c6cffe195da124fa191c8d0a1c114` had 14 returned PR workflow runs, all successful, and no review threads when inspected | Read final pushed-head CI and current main; source/drawing/audit completeness still blocks ready-for-review irrespective of green CI |

No application, device, keyboard, screen-reader, zoom, prototype-navigation or operational evidence was produced. No application code, integration, library publication, merge or deployment is authorised by this continuation. The earlier session's limited Outputs render claim is retained as history, not enlarged into fresh verification.

Current main `eeac965493a2d856d7e8fdc27ab4ef35acf15188` was integrated without conflict. Local checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py`, `python3 scripts/check_prototype.py`, `python3 -m unittest discover -s scripts -p 'test_documentation*.py'` and `python3 scripts/check_documentation_scope.py --base origin/main --head HEAD`. No application code, token or live design-register mutation was made, so application suites, Studio and token/baseline checks were not rerun for this documentation checkpoint. Final pushed-head CI is reported in PR #918 rather than inferred from the original head.

### 9.3 Recommended review order and handoff

1. Recover the original brief/addenda, persona matrix and dataset; inspect the live file and reconcile its inventory before changes. Keep missing Addendum A2 explicit.
2. Review Read me and the nine-field declaration; settle the 12 px strip, proposed menus, Files-tab wording and synthetic time/persona conventions as proposals.
3. Review Document library → Outputs → Templates: exact revisions and hashes, issue/distribution boundaries, review independence, publication and site use, then all dialogs and recovery states.
4. Review Email → Calendar → Customer messages: privacy/linking, mailbox handoff, read-only meetings, named-sender confirmation and unknown-outcome recovery; distinguish proposed families/classes from built synthetic capability.
5. Review tablet 1024 and phones 390/320 for every required journey, then Interaction states and Administration. Reconcile scans with actual renders and record uncovered sheets explicitly.
6. Complete the proposal audit and dated completion fragment, inspect final-head CI and readiness gates, and only then mark ready. Dean decides acceptance and named-version approval separately. The register/per-route and Shell proposals follow their documented separate reviewed handoffs.

Dean's eventual decisions remain: accept or amend the completed design and A-list; approve a named version after acceptance; decide expanded output families, M5–M10 and CUS-EMAIL presentation; decide proposed workspace/Files wording and team-availability permission. These are not being requested as approvals for unfinished work. The immediate blocker is access to the existing private file and owning-session sources.

## 10. Owning session completion — 12 November 2026

### 10.1 What this section is

The owning session was still running when section 9 was written. It holds what that continuation could not reach: the private file, the brief with decisions D1 to D13, scenarios S-01 to S-30 and the dataset, and Addenda A1 and A3. This section supplies the evidence section 9 lists as outstanding: the sheet inventory read back from the file, the structural and position audits, the scans and the audit. Section 9 stays as written, as history. Its repository reconciliations are adopted here and correct sections 5 and 7 as that commit already edited them: DK-01 Q3 and Q4 were decided "not now" in the accepted page; DK-03 G3 was addressed by the exact revision and acknowledgement facts; DK-06 G5 has its rendering-only correction; the synthetic CUS-EMAIL backend exists under S2, so only its presentation in Templates is proposed; PPO - Library exists and is unpublished; "Needs review" stays an honest review status.

The design remains a **proposal**. Design acceptance is Dean's and has not been given. No named version is saved. Nothing in the application changes.

### 10.2 Sheet inventory

213 sheets on eight scope pages, read back from the file on 12 November 2026. Every sheet is labelled `CODE · Page — state (scope ID) [signed in as …]`. Desktop sheets are 1440 wide (900 high, or full length), tablets 1024, phones 390 or 320. The sheet names below are the frame names in the file.

**Document library · DK-01 · DK-02** — page `7:4`; routes `/documents`, `/documents/library/[id]`; 38 sheets; notes card `38:8816`.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| DL01 | Document library — Current documents, full length (DK-01) | Desktop 1440 | `25:11072` |
| DL02 | Document library — snapshot of SYN-DOC-000112 over the grid (DK-01) | Desktop 1440 | `25:11938` |
| DL04 | SYN-DOC-000112 r01 — Overview, Unreviewed, full length (DK-02) | Desktop 1440 | `25:12904` |
| DL13 | Document library — Withdrawn view with snapshot of SYN-DOC-000111 (DK-01) | Desktop 1440 | `25:13340` |
| DL14 | SYN-DOC-000108 r01 — Content unavailable, recovery owned, full length (DK-02) | Desktop 1440 | `25:13776` |
| DL14b | SYN-DOC-000103 r01 — File not reachable, metadata shown, full length (DK-02) | Desktop 1440 | `25:14237` |
| DL06 | SYN-DOC-000101 r04 — Revisions tab (DK-02) | Desktop 1440 | `29:8013` |
| DL07 | SYN-DOC-000101 r04 — Findings tab, 1 closed, full length (DK-02) | Desktop 1440 | `29:8488` |
| DL08 | SYN-DOC-000101 r04 — Links tab, 5 active, 1 Needs assessment, full length (DK-02) | Desktop 1440 | `29:8936` |
| DL09 | SYN-DOC-000101 r04 — History tab, 20 events, full length (DK-02) | Desktop 1440 | `29:9463` |
| DL15b | SYN-WO-000062 work order — File drop overlay, a link not an upload (DK-01) | Desktop 1440 | `29:10547` |
| DL15 | SYN-WO-000062 work order — linked documents and the Files drawer at 09:25 (DK-01) | Desktop 1440 | `31:19588` |
| DL03 | Register a document — panel, from issued job pack SYN-PACK-000071 r02, at 08:18 before SYN-DOC-000113 exists (DK-01) | Dialogs and panels | `31:20012` |
| DL05 | Review r01 — dialog on SYN-DOC-000112 at 09:18 (DK-02) | Dialogs and panels | `31:20928` |
| DL10 | Add revision r05 — panel on SYN-DOC-000101, as offered to the owner (DK-02) | Dialogs and panels | `31:21426` |
| DL11a | Open a finding — dialog on SYN-DOC-000101 r04, as it was on Thu 15 Oct 2026 (DK-02) | Dialogs and panels | `31:21922` |
| DL11b | Respond to a finding — dialog on SYN-DOC-000101 r04, as it was on Thu 15 Oct 2026 (DK-02) | Dialogs and panels | `31:22391` |
| DL11c | Accept response — dialog on SYN-DOC-000101 r04, as it was on Mon 19 Oct 2026 (DK-02) | Dialogs and panels | `31:22846` |
| DL12a | Add a link — dialog on SYN-DOC-000101 r04, as it was on Mon 19 Oct 2026 (DK-02) | Dialogs and panels | `32:38400` |
| DL12b | Retire a link — dialog on SYN-DOC-000101, as it was on Thu 15 Oct 2026 (DK-02) | Dialogs and panels | `32:38894` |
| DL13a | Withdraw document — dialog on SYN-DOC-000111, as it was on Mon 26 Oct 2026 (DK-02) | Dialogs and panels | `32:39348` |
| DL13b | Recover document — dialog on SYN-DOC-000111, a what-if frame not recorded in the story (DK-02) | Dialogs and panels | `32:39812` |
| DL15c | Add a file link — dialog after a drop on SYN-WO-000062, suggestions with nothing ticked, at 09:26 (DK-01) | Dialogs and panels | `32:40268` |
| DLS01 | Document library — loading, no counts (DK-01) | States | `32:40635` |
| DLS02 | Document library — true-empty, My documents (DK-01) | States | `32:41050` |
| DLS03 | Document library — filtered-empty, filters restated (DK-01) | States | `32:41354` |
| DLS04 | Document library — could not load, source named (DK-01) | States | `32:41661` |
| DLS05 | Document record — denied or not found (DK-02) | States | `32:41963` |
| DLS06 | SYN-DOC-000112 r01 — the registrar and source author cannot review, full length (DK-02) | States | `35:34281` |
| DLS07 | Review r01 — version conflict, the other person's saved state shown, a what-if frame (DK-02) | States | `35:34717` |
| DLS08 | SYN-DOC-000101 r04 — Links tab with a target the reader cannot open (DK-02) | States | `35:35196` |
| DLS09 | SYN-DOC-000106 r01 — a document of the demo company SYN Greenhouse Demonstration, full length (DK-02) | States | `35:35673` |
| DLS10 | SYN-DOC-000106 r01 — Findings tab at the limit of 100 findings per revision, full length (DK-02) | States | `35:36116` |
| DLT01 | Document library — Current documents at 1024, full length (DK-01) | Tablet 1024 | `35:36637` |
| DLT02 | SYN-DOC-000112 r01 — Overview at 1024, Unreviewed, full length (DK-02) | Tablet 1024 | `35:37440` |
| PH01 | Document library — list on the phone at 12:40, read only (DK-01) | Phone 390 and 320 | `35:37807` |
| PH02 | SYN-DOC-000112 r01 — record on the phone at 12:40, read only, full length (DK-02) | Phone 390 and 320 | `35:37940` |
| PH02b | SYN-DOC-000108 r01 — record at 320, content unavailable shown first, full length (DK-02) | Phone 390 and 320 | `35:38127` |

**Outputs · DK-03** — page `7:5`; routes `/documents/issues`, `/documents/issues/job-packs/[id]`, `/documents/issues/service-reports/[id]`; 34 sheets; notes card `32:33752`.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| OU01 | Outputs — All outputs, full length (DK-03) | Desktop 1440 | `19:245` |
| OU05 | SYN-PACK-000071 r02 — Issue tab, issued job pack (DK-03) | Desktop 1440 | `19:1036` |
| OU01b | Outputs — All outputs, menu collapsed to the strip, columns reordered and resized, saved view (DK-03 · S-30) | Desktop 1440 | `25:1071` |
| OU02 | Outputs — Not issued, read-only snapshot of SYN-PACK-000072 over the grid (DK-03) | Desktop 1440 | `25:1834` |
| OU04 | SYN-PACK-000072 r01 — Preparation tab, later frame at 09:33 (DK-03) | Desktop 1440 | `25:2410` |
| OU06 | SYN-PACK-000071 — Issue history, r01 superseded and r02 current (DK-03) | Desktop 1440 | `25:2874` |
| OU07 | SYN-PACK-000071 r02 — Distribution tab, synthetic attempts (DK-03) | Desktop 1440 | `25:3361` |
| OU08 | SYN-PACK-000070 r01 — Returned by the recipient, Exceptions (DK-03) | Desktop 1440 | `26:5668` |
| OU09 | SYN-RPT-000040 r01 — Service report, issue facts and Distribution tab (DK-03) | Desktop 1440 | `26:6094` |
| OU10 | SYN-RPT-000039 r02 — Preparation failed, Recover issue offered (DK-03) | Desktop 1440 | `26:6551` |
| OU11 | Outputs — Exceptions view (DK-03) | Desktop 1440 | `26:7011` |
| OU12 | Outputs — Proposed families, proposal sheet (DK-03) | Desktop 1440 | `26:7463` |
| OU13 | SYN-WO-000060 work order — the Outputs menu open (R119 · DK-03) | Desktop 1440 | `26:7868` |
| OU03 | SYN-PACK-000072 r01 — Request issue dialog at 09:30 (DK-03) | Dialogs and panels | `19:1523` |
| OUX01 | SYN-RPT-000039 r02 — Recover issue dialog at 09:05 (DK-03) | Dialogs and panels | `29:3646` |
| OUX02 | SYN-PACK-000070 r01 — Withdraw pack dialog, from Actions (DK-03) | Dialogs and panels | `29:4114` |
| OUX03 | SYN-PACK-000071 r02 — Prepare distribution dialog, earlier frame Wed 4 Nov 11:45 (DK-03) | Dialogs and panels | `29:4554` |
| OUX04 | SYN-PACK-000071 r02 — Record simulated outcome dialog, earlier frame Wed 4 Nov 11:46 (DK-03) | Dialogs and panels | `29:5031` |
| OUX05 | SYN-PACK-000071 r02 — Reconcile distribution outcome dialog, earlier frame Thu 5 Nov 08:55 (DK-03) | Dialogs and panels | `29:5526` |
| OUS08 | SYN-PACK-000071 r02 — Version conflict on Prepare distribution, the other person's saved state shown (DK-03 · state) | States | `29:6033` |
| OUS01 | Outputs — loading, no counts (DK-03 · state) | States | `30:7287` |
| OUS02 | Outputs — true-empty, "Nothing issued yet", drawn for a workspace before its first issue (DK-03 · state) | States | `30:7744` |
| OUS03 | Outputs — filtered-empty with the filters restated (DK-03 · state) | States | `30:8092` |
| OUS04 | Outputs — could not load, the source named (DK-03 · state) | States | `30:8452` |
| OUS05 | Outputs — a family is not Complete, so no total is claimed (DK-03 · state) | States | `30:8803` |
| OUS06 | Outputs — refusals board, all 16 codes in plain words (DK-03 · state) | States | `30:9442` |
| OUS07 | SYN-RPT-000039 r02 — render worker unavailable during SYN-OPI-000008, earlier frame Wed 4 Nov 07:00 (DK-03 · state) | States | `31:33197` |
| OUS09 | Outputs — the 200-visible window reached, what-if volume (DK-03 · state) | States | `31:33637` |
| OUS10 | SYN-PACK-000072 r01 — view only, no issue authority (DK-03 · state) | States | `31:34250` |
| OUT01 | Outputs — All outputs at 1024, full length, menu on the strip (DK-03) | Tablet 1024 | `31:34669` |
| OUT02 | SYN-PACK-000071 r02 — Issue tab at 1024, full length, facts column stacked below (DK-03) | Tablet 1024 | `31:35409` |
| PH03 | More — Outputs not offered for crew, "Crew keep My jobs", full length (DK-03 Q6) | Phone 390 and 320 | `32:33159` |
| PH03a | Outputs — the service manager's list on the phone, full length (DK-03) | Phone 390 and 320 | `32:33315` |
| PH04 | SYN-PACK-000071 r02 — Issue tab with recipients on the phone, full length (DK-03) | Phone 390 and 320 | `32:33511` |

**Templates · DK-06** — page `7:6`; routes `/documents/templates`, `/documents/templates/[family]/[id]`, `/documents/templates/proposals/[id]`, `/documents/templates/use`; 28 sheets; notes card `31:16827`.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| TP01 | Templates — Definitions, Job packs, full length (DK-06) | Desktop 1440 | `23:244` |
| TP02 | Job pack version 3 — Definition tab, full length (DK-06) | Desktop 1440 | `23:705` |
| TP02b | Job pack version 3 — Usage tab (DK-06) | Desktop 1440 | `23:1267` |
| TP02c | Job pack version 3 — Publication tab (DK-06) | Desktop 1440 | `23:1673` |
| TP03 | Templates — Proposals, Job packs, as at 09:30 (DK-06) | Desktop 1440 | `24:1170` |
| TP06 | Templates — Site use, Northbank Farm · Block C, full length (DK-06) | Desktop 1440 | `24:2172` |
| TP04b | Glasshouse 4 drive work isolation pack — Review tab, Reviewed r2, later frame 09:25 (DK-06) | Desktop 1440 | `25:9067` |
| TP08 | Templates — Definitions, Service reports OUT-10, menu collapsed (DK-06) | Desktop 1440 | `25:9617` |
| TP08b | Templates — Definitions, Finance evidence OUT-14, internal only (DK-06) | Desktop 1440 | `25:9966` |
| TP09 | Templates — Customer email templates CUS-EMAIL, proposed family (DK-06) | Desktop 1440 | `25:10284` |
| TP04 | Glasshouse 4 drive work isolation pack — Proposal tab, Draft r2, full length (DK-06) | Desktop 1440 | `28:2660` |
| TP09b | M2 Delay version 1 — Definition tab, customer email template, proposed family, full length (DK-06) | Desktop 1440 | `28:3201` |
| TPX01 | Create proposal — right panel from Job pack version 2, earlier frame Wed 4 Nov 2026, 14:00 (DK-06) | Dialogs and panels | `28:3732` |
| TPX02 | Revise proposal — right panel, r1 to r2, earlier frame Thu 5 Nov 2026, 08:15 (DK-06) | Dialogs and panels | `28:4156` |
| TPX03 | Review proposal — dialog, r2, three checks Pass, later frame 09:25 (DK-06) | Dialogs and panels | `28:4621` |
| TP05 | Publish as Job pack version 4 — dialog open, not confirmed, later frame 09:30 (DK-06) | Dialogs and panels | `28:5137` |
| TP07 | Assign use — dialog, Glasshouse 4 from Mon 9 Nov 2026, 06:00, what-if once version 4 is published (DK-06) | Dialogs and panels | `28:5641` |
| TPX04 | Definitions — Version 2 selected, read-only snapshot panel (DK-06) | Dialogs and panels | `29:26621` |
| TP10a | Templates — state: no family chosen (DK-06) | States | `29:24028` |
| TP10b | Review proposal — state: proposal changed while open, what-if on Riverbend crew briefing (DK-06) | States | `29:24327` |
| TP10c | Publish — state: refused by renderer manifest drift G5, what-if at 09:30 (DK-06) | States | `29:24747` |
| TP10d | Site use — state: an assignment gap fails closed, what-if at Block C (DK-06) | States | `29:25249` |
| TP10e | Templates — state: definitions not readable for this family, Finance evidence (DK-06) | States | `29:25558` |
| TP10f | Proposal — state: the proposer cannot review or publish, Reviewed r2 at 09:30 (DK-06) | States | `29:25845` |
| TP10g | Customer email template — state: placeholder outside the allowlist refused, what-if on M3 Draft, proposed family (DK-06) | States | `29:26246` |
| TPT01 | Templates — Definitions, Job packs, tablet 1024, menu as the strip (DK-06) | Tablet 1024 | `31:15900` |
| TPT04 | Glasshouse 4 drive work isolation pack — Proposal tab, Draft r2, tablet 1024, full length (DK-06) | Tablet 1024 | `31:16275` |
| PH05 | Templates — Definitions, Job packs, read only on the phone, Publish on desktop, as at 09:30 (DK-06) | Phone 390 and 320 | `31:16697` |

**Email · EC-01 · EC-02** — page `7:7`; route `/email` (and the record Email section); 32 sheets; notes card `37:6333`.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| EM01 | Email — Inbox, three panes, full length (EC-01 · EC-02) | Desktop 1440 | `25:14689` |
| EM07 | Email — Sent items with tracking, frame at 09:10 (EC-01 · ADR-0059) | Desktop 1440 | `31:36061` |
| EM06 | Email — Sending states: Sending… 09:05, Sent 09:06 and the states reference (EC-01 · ADR-0059) | Desktop 1440 | `31:36534` |
| EM06b | Email — Not delivered, with one My Work follow-up (EC-01 · ADR-0059) | Desktop 1440 | `31:36895` |
| EM06c | Email — Not confirmed — checking Sent items, with one My Work follow-up (EC-01 · ADR-0059) | Desktop 1440 | `31:37236` |
| EM08 | Email — Send-as consent missing: Send disabled, reading and linking still work (what-if before the consent of Mon 2 Nov) (EC-02) | Desktop 1440 | `31:37580` |
| EM10 | SYN-WO-000062 — the record’s Email section, frame at 11:25 (EC-01) | Desktop 1440 | `31:38024` |
| EM09a | Email — Mailbox state: Initial sync, importing with no counts (a new user) (EC-02) | Desktop 1440 | `32:24050` |
| EM09b | Email — Mailbox state: Reconnect required, 1 sync error, email hidden and nothing lost (EC-02) | Desktop 1440 | `32:24375` |
| EM09c | Email — Mailbox state: Not connected, with the link to My account (a new user) (EC-02) | Desktop 1440 | `32:24652` |
| EM09d | Email — Mailbox state: Out of date, last sync 08:10 and retrying (what-if at 09:00) (EC-02) | Desktop 1440 | `32:24921` |
| EM02 | Email — Link to records panel: suggestions with reasons, nothing ticked (menu collapsed) (EC-01) | Dialogs and panels | `32:25320` |
| EM03 | Email — Share a message to a record: one message on one record, frame at 11:15 (EC-01 D5) | Dialogs and panels | `35:23646` |
| EM04 | Email — Plan a follow-up: a My Work activity, the email body is not copied (EC-01 Q4) | Dialogs and panels | `35:24043` |
| EMX09 | More workspaces panel with a proposed My workspace section (proposal for the Shell file) (D1 · EC-01 Q2) | Dialogs and panels | `35:24522` |
| EM05 | Email — Reply as correspondence: the composer with Carl’s reviewed draft, frame at 09:05, full length (EC-01 · ADR-0059) | Dialogs and panels | `35:25054` |
| EMX10 | Email — Actions menu on a linked thread: Share, Plan a follow-up, Archive in PPO; attachment tile (EC-01 Q4 · D5) | Dialogs and panels | `39:5589` |
| EMS01 | Email — State: loading, no counts (EC-01) | States | `35:25530` |
| EMS02 | Email — State: true-empty, “No email in the last 30 days” (a new user) (EC-01 Q3) | States | `35:25840` |
| EMS03 | Email — State: could not load the mailbox, the source named (what-if at 09:00) (EC-01) | States | `35:26115` |
| EMS04 | Email — State: a thread whose customer records you cannot read, no suggestions (what-if on Owen Dunne’s thread) (EC-01 D3) | States | `35:26389` |
| EMS05 | Email — State: permission changed while the link panel was open, nothing linked (what-if) (EC-01) | States | `35:26803` |
| EMS06 | Email — State: the mailbox unavailable, reading from the last sync and nothing sends (what-if at 09:05) (EC-02 · ADR-0059) | States | `35:27212` |
| EMT01 | Email — Inbox on tablet 1024: rail kept, side menu collapsed to the strip (EC-01 D7) | Tablet 1024 | `37:4838` |
| EMT02 | Email — Reply as correspondence on tablet 1024, frame at 09:05, full length (EC-01 · ADR-0059) | Tablet 1024 | `37:5178` |
| PH06 | Email — Inbox on the phone with the slim Email header (EC-01 D8) | Phone 390 and 320 | `37:5560` |
| PH06b | Email — Inbox at 320: rows truncate, chips stack (EC-01 D8) | Phone 390 and 320 | `37:5698` |
| PH07 | Email — Thread on the phone with the Link to records sheet, nothing ticked (EC-01 D4) | Phone 390 and 320 | `37:5836` |
| PH09 | Email — Sent items with tracking on the phone, frame at 09:10 (EC-01 · ADR-0059) | Phone 390 and 320 | `37:5964` |
| PH10 | Email — Mailbox Reconnect required on the phone, 1 sync error (EC-02) | Phone 390 and 320 | `37:6088` |
| PH20 | Email — Offline on the phone: reads cached, nothing sends (5.7) | Phone 390 and 320 | `37:6165` |
| PH08 | Email — Reply as correspondence on the phone, full screen, frame at 09:05, full length (EC-01 · ADR-0059) | Phone 390 and 320 | `37:6257` |

**Calendar · EC-03** — page `7:8`; route `/calendar`; 18 sheets; notes card `32:10097`.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| CA01 | Calendar — Week, Mon 2 to Fri 6 Nov 2026 (EC-03) | Desktop 1440 | `29:17452` |
| CA02 | Calendar — Day, Thu 5 Nov 2026, meeting detail panel (EC-03) | Desktop 1440 | `29:17850` |
| CA03 | Calendar — List, Mon 2 to Fri 6 Nov 2026 (EC-03) | Desktop 1440 | `29:18287` |
| CA04 | Calendar — Team availability, Service team, proposed (EC-03) | Desktop 1440 | `29:18830` |
| CA05 | Calendar — Plan follow-up dialog, from the Service stand-up, frame 08:55 (EC-03) | Dialogs and panels | `29:19307` |
| CA06 | Calendar — Link a meeting to records, right panel, owner only (EC-03) | Dialogs and panels | `29:19813` |
| CA07a | Calendar — State: overlap side by side, 08:30 stand-up and supplier call (EC-03) | States | `31:24582` |
| CA07b | Calendar — State: out of date, last sync 08:10, what-if (EC-03) | States | `31:25009` |
| CA07c | Calendar — State: reconnect required, last good sync Wed 4 Nov 2026, 18:40 (EC-03) | States | `31:25421` |
| CA07d | Calendar — State: nothing scheduled, Sat 7 Nov 2026 (EC-03) | States | `31:25770` |
| CAS01 | Calendar — State: a colleague’s private meeting reads Busy, Team availability (EC-03) | States | `31:26109` |
| CAS02 | Calendar — State: meeting organised in another time zone, 07:30 AEST shown at 08:30 AEDT (EC-03) | States | `31:26603` |
| CAT01 | Calendar — Week, Mon 2 to Fri 6 Nov 2026, tablet 1024 (EC-03) | Tablet 1024 | `32:8748` |
| CAT02 | Calendar — Day, Thu 5 Nov 2026, meeting detail panel, tablet 1024 (EC-03) | Tablet 1024 | `32:9083` |
| PH11 | Calendar — Day agenda, Thu 5 Nov 2026, calendar-first (EC-03) | Phone 390 and 320 | `32:9453` |
| PH12 | Calendar — Meeting detail, Glasshouse 4 site call (EC-03) | Phone 390 and 320 | `32:9606` |
| PH13 | Calendar — Plan follow-up sheet, from the Service stand-up, frame 08:55 (EC-03) | Phone 390 and 320 | `32:9747` |
| CAS03 | Calendar — Phone state: technician day agenda, nothing in Outlook (EC-03) | Phone 390 and 320 | `32:9956` |

**Customer messages · EC-04** — page `7:9`; route `/email/customer-messages`; 40 sheets; notes card `34:7619`.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| CM01 | Customer messages — To send, full length (EC-04) | Desktop 1440 | `22:1024` |
| CM04 | M2 · SYN-DSP-000061 · Sam Okafor — Sent · delivery not confirmed, History, later frame 09:14 (EC-04) | Desktop 1440 | `25:4425` |
| CM07 | M4 · SYN-PRJ-000024 · Priya Shah — Needs follow-up, Held · do not notify (EC-04) | Desktop 1440 | `25:5662` |
| CM08 | M1 · SYN-DSP-000059 · Mei Tran — Needs follow-up, Outcome unknown (EC-04) | Desktop 1440 | `25:6146` |
| CM09 | M1 · SYN-DSP-000060 · Ari Levin — Needs follow-up, Failed · bounced (EC-04) | Desktop 1440 | `25:6650` |
| CM02 | M2 · SYN-DSP-000061 · Sam Okafor — Delay notice, Prepared, full length (EC-04) | Desktop 1440 | `26:9409` |
| CM05 | M4 · SYN-PRJ-000024 · Jo Marsh — Project update 4, Prepared, full length (EC-04) | Desktop 1440 | `26:9944` |
| CM06 | M4 · SYN-PRJ-000024 · Jo Marsh — Independent sender required, full length (EC-04) | Desktop 1440 | `26:10477` |
| CM10 | Customer messages — All messages, full length (EC-04) | Desktop 1440 | `26:10947` |
| CM11 | Customer messages — Message classes, full length (EC-04) | Desktop 1440 | `26:11626` |
| CM12 | Customer messages — Message classes after turning M2 Off, drawn what-if at 09:05, full length (EC-04) | Desktop 1440 | `26:12183` |
| CM14 | Customer messages — Proposed classes in use, proposal sheet, full length (EC-04) | Desktop 1440 | `26:12632` |
| CM15 | Customer 360 · Hillview Growers — Customer messages timeline card (EC-04 on CS-01) | Desktop 1440 | `26:13078` |
| CM03 | M2 · SYN-DSP-000061 · Sam Okafor — Confirm and send dialog, 09:12 (EC-04) | Dialogs and panels | `29:13849` |
| CMX01 | M4 · SYN-PRJ-000024 · Jo Marsh — Approve and send dialog, later frame 09:40 (EC-04) | Dialogs and panels | `29:14329` |
| CM13 | M4 · SYN-PRJ-000033 · Rhea Kaur — Withdraw a prepared message, as it was Tue 3 Nov 2026, 08:10 (EC-04) | Dialogs and panels | `29:14810` |
| CMX02 | M1 · SYN-DSP-000059 · Mei Tran — Check Sent Items dialog, copy found, later frame 09:20 (EC-04) | Dialogs and panels | `29:15250` |
| CMX03 | Message classes — Turn off a class dialog (CM12), drawn what-if at 09:05 (EC-04) | Dialogs and panels | `29:15736` |
| CMX04 | Message classes — Turn on a class dialog (CM12), drawn what-if after M2 was turned off (EC-04) | Dialogs and panels | `29:16156` |
| CMS01 | M2 · SYN-DSP-000061 · Sam Okafor — State: content changed while open, drawn what-if (EC-04) | States | `31:4636` |
| CMS02 | M2 · SYN-DSP-000061 · Sam Okafor — State: held when you confirmed, drawn what-if (EC-04) | States | `31:5044` |
| CMS03 | M2 · SYN-DSP-000061 · Sam Okafor — State: send not confirmed, connection dropped, drawn what-if (EC-04) | States | `31:5467` |
| CMS04 | Customer messages — State: view only (no send duty), To send (EC-04) | States | `31:5870` |
| CMS05 | M2 · SYN-DSP-000061 · Sam Okafor — State: view only (no send duty), record (EC-04) | States | `31:6250` |
| CMS06 | Customer messages — State: nothing to send, complete window, later frame 09:45 (EC-04) | States | `31:6658` |
| CMS07 | Customer messages — State: window reached, At least this many, drawn what-if (EC-04) | States | `31:6964` |
| CMS08 | Customer messages — State: could not load (EC-04) | States | `31:7356` |
| CMS09 | M2 · SYN-DSP-000061 — State: held, the contact belongs to another customer, never sent, drawn what-if (EC-04) | States | `31:7659` |
| CMS10 | Customer messages — State: loading, no counts (EC-04) | States | `31:8064` |
| CMT01 | Customer messages — To send, tablet 1024, menu collapsed to the strip (EC-04) | Tablet 1024 | `32:16698` |
| CMT02 | M2 · SYN-DSP-000061 · Sam Okafor — Delay notice, Prepared, tablet 1024, full length (EC-04) | Tablet 1024 | `32:17073` |
| PH14 | Customer messages — To send list, phone 390 (EC-04) | Phone 390 and 320 | `32:17460` |
| PH16 | M2 · SYN-DSP-000061 · Sam Okafor — Confirm and send sheet, phone 390 (EC-04) | Phone 390 and 320 | `32:17516` |
| PH17 | Customer messages — Needs follow-up list, phone 390 (EC-04) | Phone 390 and 320 | `32:17664` |
| PH17b | Customer messages — Needs follow-up, search and filter combined, phone 320 (EC-04) | Phone 390 and 320 | `32:17718` |
| PH18 | M1 · SYN-DSP-000059 · Mei Tran — Check Sent Items sheet, phone 390, 09:20 (EC-04) | Phone 390 and 320 | `32:17780` |
| PH19 | Customer messages — Choose view sheet, phone 390 (EC-04) | Phone 390 and 320 | `32:17937` |
| PH19f | Customer messages — Filter sheet, phone 390 (EC-04) | Phone 390 and 320 | `32:18031` |
| PH15 | M2 · SYN-DSP-000061 · Sam Okafor — message, full length, phone 390 (EC-04) | Phone 390 and 320 | `35:18647` |
| PH15b | M2 · SYN-DSP-000061 · Sam Okafor — message, full length, phone 320 (EC-04) | Phone 390 and 320 | `35:18793` |

**Administration · DK · EC** — page `7:11`; settings sheets, no route claimed; 8 sheets; notes card `26:3583`. The page holds the Desktop 1440 and Flows and notes sections only: the brief asks for desktop settings sheets and nothing else.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| AD01 | Documents and communications settings — hub, full length (DK · EC) | Desktop 1440 | `25:17123` |
| AD02 | Document library settings — types, review rules, link kinds and SharePoint reference, full length (DK-01 · DK-02) | Desktop 1440 | `25:17669` |
| AD03 | Outputs settings — families and issue rules, full length (DK-03) | Desktop 1440 | `25:18296` |
| AD04 | Templates settings — families, review checks, publication, use and the renderer manifest, full length (DK-06) | Desktop 1440 | `25:18866` |
| AD05 | Customer message classes — switches, review class, sender duties and fixed wording, full length (EC-04) | Desktop 1440 | `26:1207` |
| AD06 | Email settings — linking, privacy, window, tracking and drafting, full length (EC-01 · EC-02) | Desktop 1440 | `26:1931` |
| AD07 | Calendar settings — read-only Outlook, team availability and the Outlook write consent, full length (EC-03) | Desktop 1440 | `26:2498` |
| AD08 | Numbering, nudges and views — references, My Work nudges, saved views, columns, density and record layout, full length (DK · EC) | Desktop 1440 | `26:2999` |

**Interaction states · DK · EC** — page `7:10`; no route: five specification boards and the app-wide patterns, drawn on the Outputs register; 15 sheets; notes card `57:4742`. ST01 to ST05 are 1440 px boards without the shell, labelled "[specification board]". The page holds four sections: the brief asks for no tablet or phone sheet here.

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| ST01 | Interaction states — evidence family (DK · EC) | Desktop 1440 | `46:244` |
| ST02 | Interaction states — messages and mail (DK · EC) | Desktop 1440 | `46:1157` |
| ST03 | Interaction states — register standard (DK · EC) | Desktop 1440 | `47:482` |
| ST04 | Interaction states — controls and accessibility (DK · EC) | Desktop 1440 | `47:983` |
| ST05 | Interaction states — contrast proof (DK · EC) | Desktop 1440 | `55:598` |
| STX01 | Outputs — Filters panel (DK-03 · app-wide) | Dialogs and panels | `55:1668` |
| STX02 | Outputs — Columns panel: reorder, show or hide, widths, density (DK-03 · app-wide) | Dialogs and panels | `55:2500` |
| STX03 | Outputs — Export dialog: permitted rows only (DK-03 · app-wide) | Dialogs and panels | `55:3356` |
| STX04 | Outputs — Save view dialog (DK-03 · app-wide) | Dialogs and panels | `55:4174` |
| STX05 | Keyboard shortcuts dialog (DK · EC · app-wide) | Dialogs and panels | `55:4984` |
| STS01 | Denied or not found — one page for both, opened by link (DK · EC · app-wide) | States | `57:2096` |
| STS02 | M2 · SYN-DSP-000061 · Sam Okafor — permission changed while open, what-if at 09:10 (EC-04 · app-wide) | States | `57:2300` |
| STS03 | Outputs — at 200 % zoom, reflowed, full length (DK-03 · app-wide) | States | `57:2675` |
| STS04 | Outputs — docked menu shown, Collapse menu hovered (DK-03 · app-wide) | States | `57:3170` |
| STS04b | Outputs — menu collapsed to the 12 px strip, strip hovered (DK-03 · app-wide) | States | `57:3963` |

**Read me** — page `0:1`: header card `22:1016`, page template card `22:1020`, "Sheet index and notes" card `63:43329` and audit card `63:43358`. **Shell and kit** — page `7:12`: icons `8:2` (101 icon components and the brand mark), page kit `10:2`, shell components `12:6` and tablet and phone chrome `12:7`; three hidden text nodes in the kit section hold the build-time helper library, as the Sales file does. The separator pages "— Accepted —" and "— Proposals —" and the Scratch page are empty.

Against the brief's minimums: every numbered sheet of its section 7 is drawn (DL01 to DL15, OU01 to OU13, TP01 to TP10, EM01 to EM10, CA01 to CA07, CM01 to CM15, ST01); 42 dialogs and panels against 32; 54 page states against 16; 12 tablet sheets against 12 (DL01, DL04, OU01, OU05, TP01, TP04, EM01, EM05, CA01, CA02, CM01, CM02); 23 phone sheets at 390 px against 20 and four at 320 px against four (PH02b, PH06b, PH15b, PH17b); eight Administration sheets against eight. Codes the brief does not number follow one scheme: `X` for extra dialogs and panels, `S` for states, `T` for tablet, with the page's letters in front.

### 10.3 Assumptions and departures added by the build

These extend section 5. Every page's Flows and notes card carries its own numbered list (A-DL1 to A-DL15, A-OU1 to A-OU11, A-TP1 to A-TP15, A-EM1 to A-EM9, A-CA1 to A-CA12, A-CM1 to A-CM14, A-ST1 to A-ST12, A-AD1 to A-AD13). The ones that need Dean's decision, correct the brief or reach another file are raised here.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A22 | Dataset error. The brief dates quotation SYN-PPO-QUO-000214 r01 "Fri 31 Oct" and "valid to Sun 30 Nov". In 2026, 31 October is a Saturday and 30 November a Monday. OU12 now reads "Sat 31 Oct"; the valid-to date is not drawn | Dean confirms the dates or the weekdays; Estimating aligns |
| A23 | Dataset conflict. The brief's sheet list says SYN-PACK-000071 r01 was issued "Tue 3 Nov 09:10"; its dataset and Addendum A3.10 say Mon 2 Nov 2026, 15:00, acknowledged 16:10. The sheets follow the dataset and A3.10 | Keep; correct the sheet list |
| A24 | Dataset conflict. The brief asks the To send view for "the two M4 rows View only" while its counts fix To send at 2 (the two Prepared messages). The held copy to Priya Shah is drawn under its own band in To send and counted in Needs follow-up | Dean decides whether a held copy belongs in To send beside its prepared sibling |
| A25 | SYN-DOC-000102 carries the type "Operating notes", which is outside the six types the accepted page fixed (DK-01 Q5). The Document library draws it as given; Administration marks it as a proposed seventh type | Dean adds the type or renames the document's type |
| A26 | Ravi Kumar prepares the distribution of SYN-PACK-000071 r02 and records its outcome (the dataset names him), although the persona matrix lists only pack preparation and read for him | Confirm the duty when grants are seeded; otherwise only the persona and three "by Ravi Kumar" lines change |
| A27 | Hashes the dataset does not give are synthetic, each on one revision or one message only: six in the Document library, three in Customer messages, the template fingerprints and manifest hashes in Templates. SYN-PACK-000071 r01 has no hash in the dataset, so Issue history reads "Retained" for it and invents none. SYN-DOC-000113 r01 carries the same hash as SYN-PACK-000071 r02 because it registers the same PDF | Keep; the module files must not reuse them for anything else |
| A28 | A message record's facts strip ends "Message facts, not evidence of delivery". The accepted wording covers four records (library, issue, review, catalogue) and has none for a message | Adopt as the fifth, or strike the note |
| A29 | Templates: the family is a four-way segmented control with exactly one selected, where the accepted page used a select; a record's position reads "In identity order" because Templates claims no count; Jordan Kim sees "Propose a change" disabled with the reason, because the matrix gives him no proposing duty | Keep the first two as proposals; confirm the third with the grants |
| A30 | Email: the reading pane uses the Addendum A1 pattern (one state-driven primary and a labelled Actions menu) where the accepted page drew an icon row; a selected Sent row's tracking details are a docked card where Amendment A1 drew a popover; report and library-document link targets are marked "Proposed · not built" because EC-01 D2 lists eight other target kinds and the code links a thread to a deal only | Dean decides each; the first two change the accepted Emails page |
| A31 | The customer message phone sheets PH15 and PH15b use one full-width 48 px primary, as the brief asks for phone primaries. The other phone record sheets (PH04, PH12, PH20) keep the accepted phone record header component, which pairs Actions with a 32 px primary. The service manager's phone sheets carry the technician tab bar with More current; Robin Hale's carry none, because no accepted bar fits Supply | Decide in the Shell file: one height for the phone primary |
| A32 | Dean Fiedler's mailbox reads Reconnect required with one sync error (the dataset and A3.10); sheet A01 of the Sales file shows the same mailbox "Outlook connected, synced 08:58" | The Sales file aligns, or the story keeps two times of day |
| A33 | Supporting details the dataset does not give are plausible inventions and are listed on each page's notes card: meeting durations and attendees, email bodies and addresses on `.example`, file names and sizes, minor times, typed reasons in dialogs, and the earlier history of SYN-DOC-000101. Sheets that are not at 09:00 say so in their name (earlier frame, later frame or what-if) | Keep |
| A34 | Administration proposes a rule-set change control (one person drafts, a reviewer who saved no part of the draft reviews, another person publishes) for the SharePoint reference format and the nudge day counts. No administration route or rule-set store exists. Its status words Built, Fixed by decision, Open decision and Proposed are used on that page only, and "Built" repeats the brief's summary of the code; the repository was not read to confirm each one | Decide with the settings design |
| A35 | The customer email template family is labelled "Proposed in Templates" on TP01, TP09, TP09b, TP10a, TP10g, TPT01 and AD04: its synthetic backend exists under S2 (section 9.1), and only its presentation as a fourth family in Templates is proposed (A9). The per-class placeholder names drawn on TP09b, TP10g and AD04 are illustrative; the allowlist built under S2 governs | Keep |
| A36 | Interaction states makes choices where the brief is silent: tones (Running and Submitted neutral, Durable and Checked success, Simulated not sent warning, absent events grey); plain words for three hold reasons Customer messages does not draw ("Held · source changed", "Held · sender not authorised", "Held · earlier outcome unknown"); hover and pressed as 8 % and 16 % ink overlays, because the kit has no state tokens; an export that leaves Powerplants approved by the administrator; letter shortcuts marked as proposals; and, while the menu is collapsed to the 12 px strip, Find in Documents reached from the top-bar search | Decide with the kit and the Shell file |

### 10.4 Verification

Design verification of the file as it stood on 12 November 2026. "Builder" means the session that drew a page; "this session" coordinated, repaired and audited. Nothing here is application, device, keyboard, screen-reader or zoom evidence.

| Check | Result | Limit |
|---|---|---|
| Structural and position audit, all eight scope pages | No issue on any page after the last write: no overlap between sheets, labels, cards or sections; nothing loose on a page; every sheet has one label with its code and signed-in person; every child inside its sheet; Roboto Regular and Medium only; no register cell taller than one line | Computed from node bounds. The scrolling table regions and ellipsised cells are intended |
| Label and persona | The "[signed in as …]" of every label matches the account in its top bar. After correction C1 the account was applied again on every top bar of the seven pages built before it (171 top bars); Interaction states was built after it and its ten shell sheets were checked | — |
| Renders | Every sheet was rendered and read at least once by its builder, and the defects found were fixed. This session read OU01, OU05 and OU03 when it built them and, after the repairs: DL04, EM01, CA02, CM02, CM01, TP04b, TP09, TPT01, CM12, CMX03, CMX04, CAS01, CA03, PH12, PH13; the phone sections of Document library, Outputs, Templates, Email and Customer messages (23 phone sheets at 0.4 to 0.5 scale); two crops of the Interaction states boards; and both new Read me cards. Later the same day this session read a whole-page render of each of the eight scope pages and of the Read me page for layout, and read crops of every shell sheet's label and top bar (181 sheets), of the ten Templates record headers changed after their last render, of the calendar now-line on CA01, CA07b and CAT01, and of the changed texts on ST02 and ST05. That check found C10 | The whole-page renders were read at 0.46 to 1.0 scale, so small text was checked closely only where it had changed. The four notes cards changed by wording, and Calendar's notes card, were seen only at page-render scale. Administration was inspected from section renders at 0.72 scale, and the Interaction states dialogs and states at 0.7 |
| Evidence scan | Every `SYN-` reference on every page is in the brief's dataset or Addendum A3; none is invented. References by page: Document library 29, Outputs 39, Templates 5, Email 6, Calendar 4, Customer messages 12, Administration 14, Interaction states 24 | Matched by each builder to the dataset by hand; the other module files were not opened |
| Hashes | One hash per revision or message. Given by the dataset: `b6e20f94 … 1c73a8` (SYN-DOC-000112 r01), `3f9a1c0e … 7bc21e` and `8d41b2f7 … e07b5c` (SYN-DOC-000101 r03, r04), `5c1e2a90 … 0b9d4f` (SYN-PACK-000071 r02 and SYN-DOC-000113 r01, the same PDF), `a41d0c77 … 9e2b15` (SYN-PACK-000072 r01), `e7a09b21 … 44f0c6` (SYN-RPT-000040 r01), `9d41f2c7 … 0e58` (Job pack version 3), `2b8e4f10 … c9d731` (the M2 message), `71c3a9e2 … 5d08bf` (the M4 message to Jo Marsh) | The rest are synthetic (A27) |
| Forbidden controls | No Resend, Send to all, Send from Outlook, Mark delivered, Regenerate, Edit file, Upload-to-replace or Approve issue control on any sheet. The words appear only inside rules that forbid them (for example EC-04 D7 "There is no resend") | Text scan plus the builders' reading of the renders |
| Six events | "Delivered" appears only as the event's label with "Not confirmed" or "Not recorded" beside it, and in rule sentences; no row, chip or state reads Delivered. No "Sent" state on an Outputs sheet; real sent and delivered times read "Not recorded". "Approved", "Active" and "Live" appear in Templates and Administration only inside the quoted rule that forbids them | — |
| Counts | Recomputed from the dataset: Outputs 14 (6 job packs, 8 service reports), Issued 10, Not issued 4, Exceptions 2 at 09:00; Document library 12 current and 1 withdrawn, Reviewed 4, Review outdated 1, Returned 1, Unreviewed 6, Content unavailable 1; Customer messages To send 2 and Needs follow-up 3, with Robin Hale's badges 1 and 2; Email 31 conversations and 4 unread; Calendar 4 meetings and 1 overlap on Thursday. No count in the Document library menu, anywhere in Templates or on the calendar's Due lane. Outputs totals only where both families are Complete | — |
| Dates | Full form throughout; AEDT stated once per list. Weekday and date pairs checked against 2026: one dataset error corrected (A22) | — |
| Capability and independence | Each enabled command belongs to the signed-in persona under the brief's matrix, with the role assumptions A14 and A26. Drawn refusals: the registrar and source author cannot review (DLS06); a proposal's contributor cannot review or publish (TP10f); the drafter cannot send an M4 (CM06); no issue authority (OUS10); no send duty (CMS04, CMS05) | Read from the sheets against the brief's matrix; the repository's grants were not compared |
| Contrast | Computed on ST05 from the 66 "PPO colour" variables with the WCAG relative-luminance formula: 89 pairs; 82 pass, 3 fail, 2 are below 3:1 and not relied on (hairlines) and 2 are exempt (disabled). The failures: white on brand/green-deep, 3.57:1 against 4.5:1, the 14 px label of the accepted record header primary and of the phone primary (not changed; R11); brand/green-deep on white as 10 px text, 3.57:1, the calendar's now-line time (corrected to status/success, 6.07:1, on CA01, CA07b, CAT01 and ST02; C9); line/control on surface/hover, 2.96:1 against 3:1, the table scrollbar thumb (not changed; R12). After the correction no text of 14 px or smaller is bound to brand/green-deep on any page | Computed from the variable values, not measured on rendered pixels. The shell's own top bar, rail and logo are not judged here |
| Repository | Section 10.8 | — |

Figma tool calls used: about 185 across this session and the eight builders (about 170 for the build and about 15 for the later whole-page render check), inside the seat's limit of about 200 in 24 hours. That limit set how often sheets could be rendered again.

### 10.5 Audit — 12 November 2026

The brief asks for an audit after the build: corrections, refinements, gaps, new features and polish, with coverage of its scenarios and a recommended order. Items are for Dean's decision unless marked as corrected.

#### Corrections made during the build (errors of the build, fixed in the file)

| ID | Correction |
|---|---|
| C1 | A colour override equal to a component's own binding rendered black: the neutral chip in record headers and the top-bar avatars of Dean Fiedler, Ravi Kumar, Casey Ward and Quinn Avery. The helper now writes the variable's resolved colour; every top bar was applied again and no unbound black fill remains |
| C2 | Phone record headers and action bars kept the component's default texts in a clipped area ("SYN-QUO-000214 · Riverbend Growers", "Rev 02 · 3 of 14", "Issue on desktop"). They surfaced in the evidence scan, were blanked on every phone sheet and the helper was corrected |
| C3 | OU05's Recipients table was wider than its card; rebuilt to fit |
| C4 | Texts meant to truncate wrapped instead (the helper set the line limit before the resize mode). Corrected in the helper and on the sheets |
| C5 | Table header cells exactly 100 px wide hugged their label and pushed later headers out of line; pinned on every page |
| C6 | OU12 printed the dataset's "Fri 31 Oct" for a Saturday; corrected (A22) |
| C7 | A cleanup pattern removed three legitimate "Riverbend Growers" texts on CM08, CMX02 and CM10; restored and rendered again |
| C8 | Six Templates sheets (TP01, TP09, TP09b, TP10a, TP10g, TPT01) and AD04 labelled the customer email template family "not built". Its synthetic backend exists; the chip now reads "Proposed in Templates", and the Templates, Administration and Customer messages notes cards say the same (A35) |
| C9 | The calendar's now-line time was 10 px brand/green-deep on white, 3.57:1 against 4.5:1 (found by the contrast board). It is now status/success, 6.07:1, on CA01, CA07b, CAT01 and the sample on ST02; the line stays green. ST05 and the Interaction states notes card say so |
| C10 | CA07b (the calendar out of date, last sync 08:10) drew its eight Outlook meetings in the current style, although its banner says the grid keeps the last copy and ST02 gives the stale style for CA07b and CA07c. They now use the grey "as last synced" style CA07c already used (fill surface/hover, bar line/control, text text/secondary); the PPO Due items stay current. Found by the whole-page render check |

#### Page by page

| Page | Reads well | Watch |
|---|---|---|
| Document library | The frozen Document cell, revision and review chip show which exact version is in hand and whether it is reviewed. The record leads with "Library evidence, not permission to work" and the hash with Copy. Unavailable content is said first, with the recovery owner | DL04 runs 27 px past 900 and is labelled full length. On DL15 the header's Actions and Outputs sit under the open drawer. The type "Operating notes" (A25) |
| Outputs | The six events sit in one fixed row on every record; a durable render never reads as an issue; real sent and delivered times read "Not recorded". The refusals board states all 16 codes in plain words | OU13's work order page is a carrier for the Outputs menu; Service owns that page. The Actions menu is not drawn open. r01 of SYN-PACK-000071 shows "Retained" in place of a hash (A27) |
| Templates | No count anywhere; a version is never called Live, Active or Approved; publication and use are separate commands; the contributor's refusal is drawn | TP08 leaves space under a two-row register. The proposal record's History and Publication tabs are labels only. A29 |
| Email | Private by default and linked only by an explicit act: suggestions carry their reason and nothing is ticked. Correspondence states name what is known and never offer a resend. The mailbox states send the person to My account | A30. EMX09 highlights the rail's More item so the open panel has a visible trigger; that is a local override of the accepted rail |
| Calendar | Outlook meetings are read only, with no edit, move, respond or invite control. The Due lane counts nothing. Service visits are stated as not in Outlook | Durations and attendees are assumed (A33). A32 |
| Customer messages | Every message names its sender; the exact message is shown as the customer will see it; the ledger keeps Prepared, Queued, Submitted and the outcome apart. An unknown outcome leads to Check Sent Items | A24. CM15 leaves about 166 px unused. Three assumed hashes (A27) |
| Interaction states | One place states every chip, tone and state word with its rule, the register standard, the controls, the focus order per page type and what a screen reader says. The contrast board prints every ratio and names its three failures | The boards are specifications, not tested behaviour. Record header navigation states are not on a board. STS03 draws the content at 200 % inside a shell at 100 % |
| Administration | Each rule says whether it is built, fixed by decision, open or proposed, and who may change it at which scope. The hub states that these pages store no file, regenerate no output and send nothing without a named person | Sheets run to 2,372 px and were inspected at 0.72 scale. A34 |

#### Authority check

Checked by each builder on its page and by this session's text scans, against the brief's list. Nothing drawn stores or edits a business file (documents register a SharePoint link; A19 covers the Files tab wording); regenerates an issued output; treats a durable render as an issue (OU04, OU10); records Sent or Delivered on Outputs; claims a delivery without positive evidence; offers a resend; sends without a named person (CM03, CMX01); lets a drafter send an M4 (CM06); lets a registrar or author review (DLS06); lets a responder accept their own response (DL11b, DL11c); lets a proposal's contributor review or publish (TP10f); links an email silently (EM02, PH07); writes to Outlook (CA02, PH13, AD07); or claims "Nothing to send" from a truncated window (CMS06 from a complete window; CMS07 "At least this many").

#### Scenario coverage

| Scenario | Sheets |
|---|---|
| S-01 | OU01, OU11 |
| S-02 | OU03, OU04 |
| S-03 | OU05, OU06, OU07, OUX03, OUX04, OUX05 |
| S-04 | OU10, OUX01 |
| S-05 | OU09 |
| S-06 | DL01, DL04, DL05 |
| S-07 | DL06, DL07, DL08, DL09 |
| S-08 | DL03 |
| S-09 | DL14, DL14b |
| S-10 | TP01, TP02, TP06 |
| S-11 | TP03, TP04, TP04b, TPX03 |
| S-12 | TP05, TP10c |
| S-13 | TP09, TP09b |
| S-14 | EM01, EM02 |
| S-15 | EM05, EM06, EM07, EM10 |
| S-16 | EM06b, EM06c |
| S-17 | EM09b, PH10, CA07c |
| S-18 | CA02 |
| S-19 | CA04 |
| S-20 | CA05, PH13 |
| S-21 | CM01, CM02, CM03, CM04 |
| S-22 | CM05, CMX01, CM06, CM07 |
| S-23 | CM08, CMX02, CM09 |
| S-24 | CM10 |
| S-25 | CM11, CM12, CMX03, CMX04 |
| S-26, S-27 | CM14 |
| S-28 | OU13, DL15, DL15b, DL15c |
| S-29 | PH01, PH02, PH03, PH06, PH11 |
| S-30 | OU01b, STS04, STS04b, STX02, STX04, CMS04 |

All 30 scenarios have at least one sheet. Outputs and messages of the other module files appear where this file owns the evidence: Service's packs and reports on Outputs; Supply's dispatch notices and Projects' updates on Customer messages; the proposed output families OUT-06, OUT-11, OUT-12, OUT-13 and OUT-14 only on the proposal sheet OU12; the proposed message classes M5 to M10 only on CM11 and CM14.

#### Refinements (R)

| ID | Refinement |
|---|---|
| R1 | Decide the held copy's place in To send (A24) |
| R2 | Adopt or strike the message facts-strip note (A28) |
| R3 | Phone record action bar: one 48 px full-width primary (as PH15 and PH15b), or the accepted pair with its 32 px primary (as PH04, PH12 and PH20) (A31) |
| R4 | Email reading pane: the Addendum A1 pattern or the accepted icon row; tracking details as a card or the accepted popover (A30) |
| R5 | Templates: segmented family control or the accepted select; the "In identity order" position text (A29) |
| R6 | Files tab and drop overlay wording on documents records: "Add file link" and "Drop to add a file link" (A19) |
| R7 | "Operating notes" as a seventh document type (A25) |
| R8 | Who prepares distribution: Ravi Kumar or Jordan Kim (A26) |
| R9 | One state for Dean Fiedler's mailbox across this file and the Sales file (A32) |
| R10 | The tablet's Calendar action: in the 1024 top bar as drawn, or on the rail as R87 says (A20) |
| R11 | White on brand/green-deep is 3.57:1 for the 14 px label of the accepted record header primary and the phone primary, and it needs 4.5:1. This is a token decision for the Shell file (white on status/success computes 6.07:1); nothing was changed here |
| R12 | The table scrollbar thumb (line/control on surface/hover) is 2.96:1 against 3:1; text/secondary gives 5.14:1. This is a kit decision shared with the Sales file; nothing was changed here |
| R13 | Shell questions raised by the states boards: how the chrome reflows at 200 % zoom; whether the 12 px strip gets a search affordance; who approves an export that leaves Powerplants; the proposed letter shortcuts (A36) |

#### Gaps (G)

| ID | Gap |
|---|---|
| G1 | EC-02 has no design and no decision record; `/email/connections` is not drawn (A10) |
| G2 | The template proposal record's History and Publication tabs are tab labels only |
| G3 | A record's Actions menu is drawn open once (EMX10); elsewhere its commands are named or shown as their dialogs |
| G4 | No side-by-side comparison with the six accepted pages of the Design file: few reference renders were taken, and the layouts follow the brief's reference rows, the accepted decision records and the three Outputs exemplars |
| G5 | Closed on 12 November 2026: whole-page renders of every page were read for layout, and the sheets changed after their last render were read in crops (10.4). The check found C10. The limits stated in 10.4 remain |
| G6 | Keyboard order, focus, zoom and screen-reader names are specified on the Interaction states boards and tested nowhere; no device was used |
| G7 | Dark mode and prototype links are not drawn |
| G8 | Addendum A2 was not supplied (A17) |
| G9 | Record header navigation states (first, middle, last, opened by link) are not on a board |

#### New features (N)

Rules first: each candidate prepares, checks or suggests, and never sends, issues, publishes, reviews or links anything without a named person's act on an exact version.

| ID | Feature | Drawn |
|---|---|---|
| N-N1 | Exact-bytes check before Download or Register, stated in words; a mismatch refuses and names the recovery owner | Integrated: DL03, OU05, DL04 |
| N-N2 | Link suggestions with reasons for email, meetings and dropped files, nothing ticked | Integrated: EM02, CA06, DL15c |
| N-N3 | Outcome-unknown watch: a nudge after a day with its recovery path, never a resend | Integrated: CM08, EM06c, OU07, AD08 |
| N-N4 | Carl drafts correspondence from the thread and linked records, "Drafted by Carl · review before sending"; never a notice | Integrated: EM05 |
| N-N5 | Inline PDF viewer for exact retained bytes (needs an ADR; DK-01 Q4 was decided "not now") | Proposal on the Document library notes |
| N-N6 | File an email attachment to SharePoint and register it as an exact revision | Proposal on the Email notes; EMX10 draws the attachment tile |
| N-N7 | Bulk registration from a SharePoint library, each document reviewed individually | Proposal on the Document library notes |
| N-N8 | The M4 PDF as an exact output beside the message (D-025 R7) | Proposal: CM05 |
| N-N9 | SMS as a second synthetic channel for M1 and M3 | Proposal: CM11 |
| N-N10 | Delivery evidence from the live channel (S4): Delivered only from positive evidence | Proposal: CM04 names where it would appear |
| N-N11 | Template sample render against a synthetic record, "Sample · not issued" (DK-06 V6) | Proposal: TP04 |
| N-N12 | The customer's view of issued documents and messages in the portal | Proposal: OU13 |

#### Polish (P)

| ID | Polish |
|---|---|
| P1 | TP08 and CM15 leave unused space; cap the card widths |
| P2 | DL04 trimmed to 900 px, or kept full length as labelled |
| P3 | EMX09's rail highlight removed if the accepted rail must stay untouched |
| P4 | At 320 px the technician tab bar's labels "My inspections" and "Incidents" nearly touch (the accepted component's behaviour) |
| P5 | Font Awesome Light replaces the Lucide stand-ins on publication (ADR-0050) |

#### Recommended order

1. Read me: the header, the page template, the sheet index and the audit card.
2. The decisions that change another file: the 12 px strip (A2), the two docked menus and the My workspace column (A3; EMX09), the Files tab wording (A19; DL15, DL15b, DL15c), the phone action bar (A31) and the primary's contrast (R11).
3. The dataset corrections: A22 to A25.
4. One path per page: DL01, DL04, DL05; OU01, OU05, OU03, OU07; TP01, TP04, TP04b, TP05; EM01, EM02, EM05, EM07; CA01, CA02; CM01, CM02, CM03, CM04, CM08.
5. The proposal sheets: OU12, TP09 and TP09b, CA04, CM14.
6. States, then tablet and phone, then Interaction states and Administration.
7. The remaining refinements, then the gaps.

### 10.6 What Dean decides, and the named version

Dean decides: acceptance of the design, with or without changes; the A-list (A1 to A21 in section 5, A22 on in 10.3); the refinements; and which gaps are drawn next. No named version is saved. Saving one is Dean's act in Figma, after acceptance; the suggested name is "Documents and messages refined UI pages — accepted". Any later design change needs a new named version. Until then the design register stays "Needs review", and the register and per-route guidance follow in their own reviewed change (A21).

Four statements stay separate. Code delivery: none. Design acceptance: Dean's, not given. Production readiness: not inferred. Integration with SharePoint, Microsoft 365, Graph, any mail or SMS provider or any customer: none exists beyond the synthetic channel and none is authorised; every reference, hash, message and mailbox drawn is a synthetic placeholder.

### 10.7 Sections above that this section completes

Section 3's inventory is 10.2. Section 6's verification is 10.4. Section 9.2's remaining gates are answered by 10.2 (inventory), 10.4 (audits, renders, dataset, counts, capabilities, authority, contrast) and 10.5; the limits stated in 10.4 remain. Section 9.3's review order is replaced by the order in 10.5.

### 10.8 Repository checks

Run on this change after integrating current `main`: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` (the 78 parent requirement IDs unchanged), `python3 scripts/check_naming.py`, `python3 scripts/check_prototype.py`, `python3 -m unittest discover -s scripts -p 'test_documentation*.py'` and `python3 scripts/check_documentation_scope.py --base origin/main --head HEAD`. All passed.

The change adds this section, updates the status lines and the pointers in sections 3, 5, 6, 8 and 9 that 10.7 names, and adds one status fragment. It touches no landing page (`README.md`, `docs/README.md`, `docs/STATUS.md`, `docs/decisions/README.md`, `docs/status/legacy-index.txt`), no design register and no application code, test, migration, seed, permission or token, so the application, Studio and token suites were not run. No Figma link or file key is written into the repository. Final-head CI is reported on the pull request. It was opened as a draft, and Dean marked it ready for review on 12 November 2026.
