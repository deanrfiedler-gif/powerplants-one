---
document_id: PPO-ASSIST-KNOWLEDGE-HELP-REFINED-FIGMA-PROP
date: 2026-11-13
owner: Dean Fiedler
status: Proposal, 13 November 2026, awaiting Dean's acceptance; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, migration, permission, capability, provider connection, model, speech-to-text service, scheduler or integration; every question, answer, citation, draft, transcript, check, article and guide shown is synthetic
source_commit: bdcdd347fcb29c3806cd23d1e85be03f972b6628
versioning: git
---

# Assistant, Knowledge and Help refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Proposal, awaiting Dean's acceptance. The file holds 304 sheets on 11 scope pages, each page with its Flows and notes card, and the Read me cards (header, sheet index and notes, audit, page template). Later sections will record Dean's acceptance, any further batches and the named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 13 November 2026 Dean asked for the refined UI pages of the three shared helpers of Powerplants One — the Assistant (AI-01, AI-02, AI-03, AI-04, AI-05, AI-07), Knowledge (DK-04, DK-05) and Help (DK-07 and the shared guidance system) — to be built in Figma from a written brief with Addendum A1 (the shared record toolbar), Addendum A2 (reference form) and Addendum A3 (persona and story reconciliation, section A3.12), in the new private Figma file "PPO - Assistant, Knowledge & Help" that Dean created for it.

- **Code delivery:** none. The assistant core, conversations and guide parser that exist in the code are unchanged; no `/assistant`, `/knowledge` or `/help` route, capability or table is created.
- **Design acceptance:** Dean's, and not given.
- **Production readiness:** not inferred. The assistant acceptance cases AIA-01 to AIA-20 remain Not run.
- **Provider and integration status:** the assistant provider is Simulated in this story; no live model, speech-to-text service, scheduler or external knowledge source is connected or authorised.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Assistant, Knowledge & Help", created by Dean for this work (the brief names it "PPO - Assistant, Knowledge and Help (proposal)"; A-F-1) | The target. One page per scope under "— Proposals —" (section 3) |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar", saved by Dean on 10 November 2026 | Source of truth for the shell: top bar (C5: New, Assistant, Calendar, Conversations, Page guide, Notifications, Account), collapsed rail, right strip with six tabs (R66), right drawer with the Assistant (R67) and Page guide (R68) tabs, docked and flyout Assistant and Knowledge menus, collapsed docked strip, record header toolbar and its phone variant (Addendum A1, R116 to R125), Account menu (R11), More workspaces panel, Conversations peek, keyboard shortcuts modal, banners, toasts, page states, dialogs, tooltip, 102 icon components and the "PPO colour" collection (66 variables). Copied as local components under the same names: the Plugin API cannot copy nodes between files, so each component was serialised from the Shell file (read only), transferred and rebuilt by script in the target, with every colour bound to the same-named variable |
| Private Figma file "PPO - Sales module (accepted)" | The page template, the Read me card pattern, the Sales page kit (Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile), the derived 1024 top bar, phone header, status bar and phone tab bar, copied the same way and kept under their Sales names; the Sales helper library (v2) as the base of this file's helper library |
| Private Figma file "PPO - Design" | Not opened (ADR-0067 records that opening Assistant · AI-01 raised the file's memory to 82.5 %). Its ten accepted page designs were read through their decision records and the retained r01 captures in `docs/reference/ui/` |
| [Assistant](assistant-figma-design.md) (PPO-AI01-ASSISTANT-FIGMA-DEC), [Proposal review](assistant-proposal-review-figma-design.md) (PPO-AI02-PROPOSAL-REVIEW-FIGMA-DEC), [Answer evidence](answer-evidence-figma-design.md) (PPO-AI03-ANSWER-EVIDENCE-FIGMA-DEC), [Drafting and domain help](drafting-domain-help-figma-design.md) (PPO-AI04-DRAFTING-DOMAIN-HELP-FIGMA-DEC), [Voice capture](voice-capture-figma-design.md) (PPO-AI05-VOICE-CAPTURE-FIGMA-DEC), [Assistant settings](assistant-settings-figma-design.md) (PPO-AI06-ASSISTANT-SETTINGS-FIGMA-DEC), [Recurring checks](recurring-checks-figma-design.md) (PPO-AI07-RECURRING-CHECKS-FIGMA-DEC), [Knowledge](knowledge-figma-design.md) (PPO-DK04-KNOWLEDGE-FIGMA-DEC), [Knowledge authoring](knowledge-authoring-figma-design.md) (PPO-DK05-KNOWLEDGE-AUTHORING-FIGMA-DEC), [Help Centre and page guides](help-centre-figma-design.md) (PPO-DK07-HELP-CENTRE-FIGMA-DEC) | The accepted rules and content of each scope, carried; their placements redrawn in the refined shell (prompt D2) |
| [Shell refined concept](shell-refined-concept-design.md) (PPO-SHELL-REFINED-FIGMA-DEC) | C5, R11, R66 to R68, R108, Q14, Q22 and sections 10 and 11 (record header toolbar, named version) |
| [Assistant direction](ppo-assistant-direction.md) (PPO-AI-DEC r03), [AI communications threads proposal](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP), [assistant specification](../blueprints/ppo-assistant-specification.md) (PPO-AI-SPEC), [assistant handover](../delivery/ppo-assistant-handover.md) (PPO-AI-HO), the Conversations records (PPO-CONV-T1-SCOPE, PPO-CONV-T2-SCOPE and T2b to T2e) | Provider, budget, persistence, threads and naming ("Carl · AI assistant"), the acceptance cases AIA-01 to AIA-20 (all Not run) |
| [Contextual help](contextual-help.md) (PPO-HELP-DEC r01), [contextual help design](../blueprints/contextual-help-design.md) (PPO-HELP-DES), [user guide direction](user-guide-direction.md) (PPO-USER-GUIDE-PROP), [page guide template](../standards/page-guide-template.md) (PPO-HELP-TPL), [guidance contract](../design/development/systems/guidance.md) | The 13 guide sections, the statuses, the published-with-matching-hash rule and the fallback |
| `docs/design/development/register.json`, `guides.json` and `docs/guides/*.md` at `origin/main` bdcdd347 | Guide coverage read, never invented: 393 register entries (232 routes, 157 scopes, 4 systems); read with `docs/guides/*.md`, Draft 369, In review 21 (16 shown before review) and No guide yet 3 (`system:theme`, `system:guidance`, `system:offline`). The brief and A3.12 counted `guides.json` alone ("367 guides, all Draft"; A-F-5) |
| [Onboarding and support](onboarding-support-figma-design.md) (PPO-AD10-ONBOARDING-SUPPORT-FIGMA-DEC), [Customer knowledge](customer-knowledge-figma-design.md) (CP-05) | Handovers: guide gaps from AD-10; customer-publishable revisions to CP-05 |
| [Sales module refined UI proposal](sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) | The record this one mirrors |
| `docs/blueprints/BP-01-master-blueprint.md` | §16.3 (articles distinguish approved instructions, working notes, suspected causes and obsolete guidance), §17.5 (AI must not approve designs, modify equipment settings, issue quotes, authorise costs or send unreviewed customer commitments); parents CRM-01, CRM-02, CRM-03, CRM-06, DOC-01, DOC-02, DOC-04, DOC-06, OUT-11, OUT-17, PRJ-07, SVC-06, ENG-07, NFR-01 to NFR-12; the 78 parent IDs are unchanged |
| Code read, not changed: `src/assistant/` (Simulated and live adapters, budget, evidence, turns; the adapter defaults to Simulated; enabled only on local synthetic loopback profiles), `src/assistant/model.ts` (`agentName = "Carl"`, "Carl · AI assistant"), `src/conversations/`, `src/guides/`, migrations 0108 and 0110, capabilities `conversation.read`, `conversation.post`, `conversation.agent.ask` | What exists. No `/assistant`, `/knowledge` or `/help` route, no knowledge, guide, proposal, check, voice or flagged-answer table, and no `ai.*`, `assistant.*`, `knowledge.*`, `guide.*` or `automation.*` capability exists |

## 2. Conformance declaration

### 2.1 The file

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-01` Assistant workspace and docked and phone conversation, `scope:AI-02` AI proposal review and saved outcomes, `scope:AI-03` Source and answer evidence inspection, `scope:AI-04` Domain assistance and drafting, `scope:AI-05` Voice capture and transcript review, `scope:AI-07` Recurring checks and automation review, `scope:DK-04` Knowledge search and article detail, `scope:DK-05` Knowledge authoring, review and learning intake, `scope:DK-07` Page guides and contextual help coverage, and `system:guidance`. AI-06 Assistant settings and AD-10 Onboarding and support are drawn in the Settings file and only referenced here. No scope ID or parent requirement ID is added or renamed |
| Page types (r20) | Per scope in 2.2: Overview / dashboard (Assistant Overview, Help Centre), Register / worklist (Your proposals, Recurring checks, run history, templates, Knowledge search, Saved for offline, Authoring & review, Learning intake, Page guide coverage), Record detail with the A1 record header (article revision, check, learning item, guide), Form / guided workflow (proposal review, article editor, new check), Document & evidence workspace (the full evidence view, the guide reading view), the drawer panels (Assistant tab, Page guide tab), dialogs, states, tablet and phone variants |
| Reused components | Local copies of the accepted shell and kit (section 1) under their own names, instanced on every sheet; the Assistant and Page guide drawer components detached once per sheet so their content can change while their header, scope row, composer, footer line and tab column stay as accepted. New in this file and proposed: the "Assistant, Knowledge and Help kit" of 19 local components (Carl identity line by provider state, Citation chip by state, Left-out line, Provider tag, Provenance tag, Proposal field, Suggestion frame, Draft label, Draft frame, Gap row, Missing evidence row, Evidence row by support and currency, Read-back item, Microphone by state, Safety band, Guide status, Guide card, Outcome card, Article card), to move to PPO - Library |
| Source authority | Dean's brief (decisions D1 to D16) as amended by Addendum A3.12; the ten accepted page decisions and the accepted shell; this file's compositions as proposals. The fixture is fictional and synthetic: Thursday 5 November 2026, 09:00 AEDT, Powerplants AU, signed in as Ravi Kumar unless a sheet's label names another person |
| Incoming handover | Per scope in 2.2. Opening the Assistant tab, a search, an article or a guide creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn saves, sends, approves, publishes, schedules or changes a record without a named person's act on an exact revision: Carl's action chips open the owning page's own command or a review; a proposal is confirmed through the owning record's command once; a draft is sent with the owning page's ordinary Send; a check suggests and a person plans the follow-up; an article is validated by someone other than its author, safety-confirmed by a second person, audience-approved separately and published once by a publisher who changes nothing; a guide is reviewed against all 13 sections and published by the documentation owner |
| Exceptions and recovery | Drawn per page and on the Interaction states page: provider Simulated, Paused, Unavailable and the Live what-if; thinking, stopped, partial, read failed, zero results, turn limit, closed while answering; source changed, access changed (only the affected statement withdrawn), citation rejected, Not checked, conflicting records, an instruction inside a source; proposal not saveable, changed since prepared, expired, outcome unknown with Check save status; voice not allowed, too quiet, unavailable, offline with nothing queued; scheduling not available, partial run, paused by budget; superseded and withdrawn articles, Applies Unknown, review overdue, offline copy out of date; no guide for this page, stale guide, withdrawn guide; loading, empty, filtered-empty, could not load, denied, view only, version conflict, window reached |
| Departures | Section 5 |
| Verification | Section 6 |

### 2.2 Per scope

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| AI-01 Assistant, the drawer's Assistant tab on every page type and `/assistant` (phone; the desktop Overview is a proposal) | Drawer panel; Overview / dashboard; states | Questions and answers in page memory; a kept thread is stored by Conversations | The page's registration (scope, record, revision) and the records the asker can read; Ctrl J, the top-bar sparkle, the strip tab, More › Ask Carl on the phone | Action chips that open the owning page's own commands; Keep as a thread to Conversations; Report a problem as a flagged answer (`SYN-AIF-`) to Assistant settings' quality review |
| AI-03 Answer evidence, inside the Assistant tab and `/assistant/evidence` | Drawer panel; Document & evidence workspace | What was read, when, and what was left out | An answer's statements and their sources | Open the source record in its owning page; Report to Data quality (AD-03, Settings file) on request only |
| AI-02 Proposal review, inside the Assistant tab and `/assistant/proposals` | Form / guided workflow in the panel; Register / worklist (Your proposals) | The proposal and its outcome as a record of what was shown and chosen | A request typed or spoken to Carl | The owning record's own command, run once by the person (Create activity); only Outcome unknown reaches the preparer's My Work |
| AI-04 Drafting and domain help, inside the owning pages (SV-02, SV-08, EC-01, PJ-08) and the panel | Record detail with composer; drawer panel | Nothing: the draft lives in the owning composer | Selected messages; a unit and its applicable validated procedures | The page's ordinary Send by the person; a prefilled SV-08 case form saved on SV-08 |
| AI-05 Voice capture, the composer's microphone | Drawer panel; phone composer | Nothing persistent: the recording is deleted when the text returns; the transcript is discarded unless kept as a note | Push-to-talk by the person | Text into the composer; a note saved by the person with the owning page's command |
| AI-07 Recurring checks, `/assistant/automations` | Register / worklist; Record detail; Form (dialog) | Checks, their approvals, runs and suggestions | Reviewed templates; the owner's records at run time (when the owner opens PPO) | Suggestions the person plans as My Work follow-ups or dismisses with a reason |
| DK-04 Knowledge, `/knowledge` | Register / worklist (search); Record detail (article revision); phone offline copies | Reading, offline copies and suggested changes | A record's context (customer, site, equipment, model, configuration) or the person's search | Learning items (Suggest a change) to the article's author; "Knowledge for this equipment" links on EQ-01 |
| DK-05 Knowledge authoring, `/knowledge/review` | Register / worklist (bands, intake); Form (editor); Record detail; dialogs | Articles, revisions, reviews, safety confirmations, audiences, publication, withdrawal and supersession; learning items | Findings (SV-07), incidents (FI-06), remote diagnosis (SV-08), bench tests and workshop builds (CX-02), change review (EN-07), technical queries (EN-04), suggestions from Knowledge, phone captures | Published revisions to Knowledge; Customer-publishable revisions to the customer portal (CP-05); review items to My Work (SH-06) |
| DK-07 and `system:guidance`, the Page guide tab and `/help` | Drawer panel; Overview (Help Centre home); Document (guide reading view); Register / worklist (coverage) | Guides, their review and publication, coverage and feedback | The page registration (never the screen); guide gaps from AD-10; feedback | Feedback and gaps to the guide's owner; SOPs open in the Document library (DK-01, DK-02) |
| Interaction states and Administration · AI · DK | States; configuration editor; dialogs | The words, tones and rules the pages read by | The Assistant and Knowledge workspaces | A setting change to its reviewer; Assistant settings stay in the Settings file |

Statements that hold for every scope:

- **The assistant prepares, explains and suggests; a person decides** (PPO-AI-DEC; BP-01 §17.5; AI-01 D4; AI-02 D10, D12; AI-04; AI-07 D6; R67). The model has no confirmation capability and no privileged identity.
- **The assistant reads only what the asker can read, now**, and says how many sources it left out, never which (AI-01 D8, Q4; AI-03; Conversations T2).
- **The provider state is always visible and true**: "Simulated · no AI used" in this story, with "Simulated answer · no AI used" on every answer; nothing retries by itself or switches model (AI-01 D12, D14).
- **A draft is sent by a person** with the owning page's Send; the customer sees no assistant note (AI-04 D3, D4, Q2).
- **Checks suggest and never act**, and no scheduler exists until one is designed and approved (AI-07 D4, D6).
- **Knowledge is reviewed and published by someone other than its author**, a safety note needs a second person, and the customer audience is a separate approval (DK-05 D8, Q2, Q4, Q5).
- **Guides describe delivered pages only** and admit gaps (DK-07 D8, D10; the guidance contract).
- Ownership: the assistant owns questions, answers, evidence, proposals and their outcomes as records of what was shown and chosen; each module owns the record a saved outcome changes. Knowledge owns articles, revisions, reviews, audiences and intake items; Service, Projects and Engineering own the facts an article cites. Help owns guides and coverage; each page owns its own behaviour. Settings owns the provider switch, capabilities, budget and quality review (AI-06) and onboarding and support (AD-10).

## 3. Sheet inventory

Node IDs are those of each sheet frame in the target file, in reading order within each section; sheet titles are shortened from the sheet labels (the full label, with its signed-in person, is on the canvas). Sizes are width × height in px. The Read me page carries the header card `22:330`, the "Sheet index and notes" card `67:41510`, the audit card `71:3` and the Page template card `22:341`; the Shell and kit page `5:15` holds the local copies, the Assistant, Knowledge and Help kit (section `15:525`) and the hidden build-time libraries; Scratch `5:16` is empty.

### 3.1 Assistant · AI-01 (page `5:4`; 46 sheets)

Route or placement: The drawer’s Assistant tab on every page type; `/assistant` on the phone from More › Ask Carl; the desktop Overview at `/assistant` is a proposal. Flows and notes card `35:46026`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| AW01 | SYN-WO-000062 with the Assistant tab open, start view, Thu 5 Nov 08:48 | Desktop 1440 | AI-01 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `19:4` |
| AW03 | an answer with a conflict: motor M-4 serial, Thu 5 Nov 08:51 | Desktop 1440 | AI-01 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `27:1493` |
| AW05 | opportunity search: Hillview’s open deals, 1 result, Thu 5 Nov 09:12 | Desktop 1440 | AI-01 | Drawer panel over a host page | Dean Fiedler | 1440×900 | `28:1878` |
| AW02 | question and answer, Thu 5 Nov 08:50, full length | Desktop 1440 | AI-01 | Drawer panel over a host page | Ravi Kumar | 1440×1144 | `27:881` |
| AW04 | customer CRM summary on Hillview Growers, Thu 5 Nov 08:58, full length | Desktop 1440 | AI-01 | Drawer panel over a host page | Dean Fiedler | 1440×1127 | `28:1278` |
| AW06 | scope change: the page moved to SYN-TKT-000212, Switch or Stay, Thu 5 Nov 09:01 | Desktop 1440 | AI-01 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `29:8150` |
| AW07 | Keep as a thread from More: choose the deal SYN-OPP-000331, Thu 5 Nov 09:19 | Desktop 1440 | AI-01 | Drawer panel over a host page | Dean Fiedler | 1440×900 | `29:8643` |
| AW07b | the kept thread in Conversations on deal SYN-OPP-000331, later frame Thu 5 Nov 09:20 | Desktop 1440 | AI-01 | Drawer panel over a host page | Dean Fiedler | 1440×900 | `31:8412` |
| AW08 | Assistant Overview /assistant on desktop, proposal, Thu 5 Nov 09:00, full length | Desktop 1440 | AI-01 | Overview / dashboard | Ravi Kumar | 1440×1207 | `31:8773` |
| AW09 | provider states: Simulated in use, Live, Paused and Unavailable as what-if frames | Desktop 1440 | AI-01 | Drawer panel over a host page | Dean Fiedler | 1440×900 | `31:15655` |
| AW11 | access changed while open: only the SYN-WAR-000012 statement withdrawn, what-if 08:53 | Desktop 1440 | AI-01 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:15991` |
| AW12 | without the assistant: no sparkle, no Assistant tab, Page guide tab present, Thu 5 Nov 09:05 | Desktop 1440 | AI-01 | Drawer panel over a host page | Jordan Kim | 1440×900 | `31:16577` |
| AW10 | Deals register with the drawer: scope Deals · Open · 38, 20 rows and First 20 shown · more exist, Thu 5 Nov… | Desktop 1440 | AI-01 | Register / worklist | Dean Fiedler | 1440×1575 | `31:23930` |
| AW-D01 | Ask: the composer in each state | Dialogs and panels | AI-01 | Dialog | Ravi Kumar | 1440×900 | `32:19833` |
| AW-D03 | Keep as a thread: Couldn’t keep, with the reason, what-if 09:20 | Dialogs and panels | AI-01 | Dialog | Dean Fiedler | 1440×900 | `32:19972` |
| AW-D04 | Report a problem with an answer: becomes a flagged answer SYN-AIF- for Assistant settings’ quality review, T… | Dialogs and panels | AI-01 | Dialog | Ravi Kumar | 1440×900 | `32:20504` |
| AW-D06 | Keyboard shortcuts: Ctrl J toggles the Assistant tab | Dialogs and panels | AI-01 | Dialog | Ravi Kumar | 1440×900 | `33:12618` |
| AW-D07 | Export from the Deals register: lists only, never answers, drafts or transcripts, Thu 5 Nov 09:08 | Dialogs and panels | AI-01 | Dialog | Dean Fiedler | 1440×900 | `33:13270` |
| AW-D02 | Switch or Stay from the scope chip menu, Thu 5 Nov 09:01 | Dialogs and panels | AI-01 | Panel | Ravi Kumar | 480×760 | `33:13966` |
| AW-D03b | Keep as a thread: kept on SYN-OPP-000331, later frame Thu 5 Nov 09:20 | Dialogs and panels | AI-01 | Panel | Dean Fiedler | 480×760 | `33:14215` |
| AW-D05 | More menu on an answer: Keep as a thread unavailable with Search PPO as the scope, what-if | Dialogs and panels | AI-01 | Panel | Ravi Kumar | 480×760 | `33:14424` |
| AW-S01 | thinking, announced politely once, Thu 5 Nov 08:50 | States | AI-01 | State | Ravi Kumar | 480×760 | `33:27337` |
| AW-S02 | stopped by the person, Thu 5 Nov 08:50 | States | AI-01 | State | Ravi Kumar | 480×760 | `33:27548` |
| AW-S03 | partial: opportunity search answered from part of what was asked, what-if 09:12 | States | AI-01 | State | Dean Fiedler | 480×760 | `33:27748` |
| AW-S04 | read failed: Deals couldn’t be searched, not “no results”, what-if 09:12 | States | AI-01 | State | Dean Fiedler | 480×760 | `33:27982` |
| AW-S05 | zero results: no open deal matches, what-if 09:13 | States | AI-01 | State | Dean Fiedler | 480×760 | `33:28194` |
| AW-S06 | a source changed since it was read: SYN-TKT-000209 after Ravi’s 09:10 reply, Thu 5 Nov 09:11 | States | AI-01 | State | Ravi Kumar | 480×760 | `33:28416` |
| AW-S07 | turn limit reached, what-if | States | AI-01 | State | Ravi Kumar | 480×760 | `33:33964` |
| AW-S08 | panel closed while answering, shown on reopening, Thu 5 Nov 08:51 | States | AI-01 | State | Ravi Kumar | 480×760 | `33:34165` |
| AW-S09 | switching scope with an unsent question, Thu 5 Nov 09:01 | States | AI-01 | State | Ravi Kumar | 480×760 | `33:34366` |
| AW-S10 | no capability: the Assistant tab hidden, the Page guide tab present | States | AI-01 | State | Jordan Kim | 480×760 | `33:34568` |
| AW-S11 | page memory: a reload cleared the conversation, what-if 09:14 | States | AI-01 | State | Ravi Kumar | 480×760 | `33:34788` |
| TB-AW02 | question and answer in the 720 px reading view, Thu 5 Nov 08:50, full length | Tablet 1024 | AI-01 D15 | Tablet variant | Ravi Kumar | 1024×817 | `33:39501` |
| TB-AW04 | customer CRM summary on Hillview Growers, drawer over the content, Thu 5 Nov 08:58, full length | Tablet 1024 | AI-01 | Tablet variant | Dean Fiedler | 1024×1011 | `33:39811` |
| PH01 | the record’s More › Ask Carl, Thu 5 Nov 08:48 | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:30157` |
| PH01b | /assistant start view, Thu 5 Nov 08:48 | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:30297` |
| PH01c | without the assistant: the record’s More has no Ask Carl, Thu 5 Nov 08:40 | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Casey Ward | 390×844 | `35:30371` |
| PH09 | Back returns to the same record and scroll position, Thu 5 Nov 08:56 | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:30499` |
| PH10 | provider states on the phone: Simulated in use, three what-if | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:39740` |
| PH11 | budget reached: the assistant is paused until 1 December, what-if | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:39822` |
| PH12 | keyboard open: the composer above the keyboard, 16 px text, Thu 5 Nov 08:55 | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:39911` |
| PH13 | access changed: only the SYN-WAR-000012 statement withdrawn, what-if 08:53 | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:40039` |
| PH01 | the record’s More › Ask Carl at 320, Thu 5 Nov 08:48 | Phone 390 and 320 | AI-01 | Phone variant, 320 px | Ravi Kumar | 320×844 | `35:42422` |
| PH01b | /assistant start at 320: the reference moves under the scope name, Thu 5 Nov 08:48 | Phone 390 and 320 | AI-01 | Phone variant, 320 px | Ravi Kumar | 320×844 | `35:42566` |
| PH02 | answer with citations on the phone, Thu 5 Nov 08:50, full length | Phone 390 and 320 | AI-01 | Phone variant, 390 px | Ravi Kumar | 390×1097 | `35:42635` |
| PH02 | answer with citations at 320, Thu 5 Nov 08:50, full length | Phone 390 and 320 | AI-01 | Phone variant, 320 px | Ravi Kumar | 320×1310 | `35:42774` |

### 3.2 Answer evidence · AI-03 (page `5:5`; 20 sheets)

Route or placement: Inside the Assistant tab; `/assistant/evidence` in the same tab. Flows and notes card `35:43701`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| EV01 | citation chips on the 08:50 answer, statement 2 selected, focus name shown | Desktop 1440 | AI-03 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `29:2567` |
| EV04 | missing evidence, four reasons as rows, 08:51 | Desktop 1440 | AI-03 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:17212` |
| EV05 | conflicting records, motor M-4 serial, Carl doesn’t choose, 08:51 | Desktop 1440 | AI-03 | Record detail | Ravi Kumar | 1440×900 | `31:17701` |
| EV06 | changed since read, what-if: a new message on SYN-TKT-000209 at 08:58 after the 08:50 read | Desktop 1440 | AI-03 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:4058` |
| EV07 | access changed, what-if at 08:53: the statement that used SYN-WAR-000012 withdrawn, the others kept | Desktop 1440 | AI-03 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:5332` |
| EV08 | an instruction inside a source, quoted and treated as information only, 08:51 | Desktop 1440 | AI-03 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:4706` |
| EV02 | evidence for statement 2 inside the Assistant tab, opened 08:51, full length | Desktop 1440 | AI-03 | Drawer panel over a host page | Ravi Kumar | 1440×1332 | `29:3168` |
| EV03 | full evidence view at /assistant/evidence, same tab, opened 08:51, full length | Desktop 1440 | AI-03 | Document & evidence workspace | Ravi Kumar | 1440×3408 | `31:11969` |
| EV10 | Report to Data quality dialog, on request only, hands to AD-03 in the Settings file, 08:51 | Dialogs and panels | AI-03 | Dialog | Ravi Kumar | 1440×900 | `33:3874` |
| EV11 | Open evidence: the whole answer’s evidence inside the Assistant tab, 08:51 | Dialogs and panels | AI-03 | Dialog | Ravi Kumar | 1440×900 | `33:4292` |
| EV12 | the AI-03 D3 evidence drawer redrawn inside the refined drawer, A-EV-1 | Dialogs and panels | AI-03 | Dialog | Ravi Kumar | 1440×900 | `33:28741` |
| EV13 | loading sources, no counts | States | AI-03 | State | Ravi Kumar | 460×610 | `33:37460` |
| EV09c | a source that couldn’t be read reads Not checked, never unsupported | States | AI-03 | State | Ravi Kumar | 460×610 | `33:37487` |
| EV09a | citation rejected by PPO removes its statement, what-if | States | AI-03 | State | Ravi Kumar | 460×610 | `33:37556` |
| EV09b | partial coverage: answered from part of the records, what-if follow-up | States | AI-03 | State | Ravi Kumar | 460×610 | `33:37598` |
| EV14 | support words, currency words and citation chip states | States | AI-03 | State | Ravi Kumar | 460×610 | `33:37624` |
| EV15 | cleared after a reload, page memory only | States | AI-03 | State | Ravi Kumar | 460×610 | `33:37701` |
| TB-EV03 | full evidence view at 1024, docked menu collapsed to the strip, sections as a row, 08:51 | Tablet 1024 | AI-03 | Tablet variant | Ravi Kumar | 1024×768 | `35:24064` |
| PH03 | evidence bottom sheet for statement 2 on /assistant, 08:51 | Phone 390 and 320 | AI-03 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:37599` |
| PH03 | evidence bottom sheet for statement 2, 08:51 | Phone 390 and 320 | AI-03 | Phone variant, 320 px | Ravi Kumar | 320×844 | `35:37754` |

### 3.3 Proposal review · AI-02 (page `5:6`; 42 sheets)

Route or placement: Inside the Assistant tab; Your proposals at `/assistant/proposals`. Flows and notes card `35:47251`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| AP01 | request typed, 08:52 | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `27:2161` |
| AP03 | similar record found (F1), 09:03 later frame | Desktop 1440 | AI-02 | Record detail | Ravi Kumar | 1440×900 | `29:762` |
| AP04 | Why this value (F2) on Subject | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `29:1380` |
| AP05 | Ready until 09:07, discarded 09:04 later frame | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `29:1986` |
| AP06a | Saving, the exact command locked, Mon 2 Nov 14:12 earlier frame | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:1615` |
| AP06b | Saved, from PPO, Mon 2 Nov 14:12 earlier frame | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:2161` |
| AP07a | Outcome unknown, Tue 3 Nov 16:41 earlier frame | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:2672` |
| AP07b | Check save status found it saved, Wed 4 Nov 08:10 earlier frame | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:25480` |
| AP08a | not saveable, the AI-02 A$85,000 value, on the Off opportunity target, what-if | Desktop 1440 | AI-02 | Drawer panel over a host page | Dean Fiedler | 1440×900 | `32:22136` |
| AP08b | changed since prepared, what-if 08:58 | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:22788` |
| AP08c | expired at 09:07, what-if | Desktop 1440 | AI-02 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:23356` |
| AP09 | Your proposals, 30 days, 09:00 | Desktop 1440 | AI-02 | Register / worklist | Ravi Kumar | 1440×900 | `31:24981` |
| AP02 | review form, Create activity, full length | Desktop 1440 | AI-02 | Form / guided workflow | Ravi Kumar | 1440×1784 | `27:2742` |
| AP10 | Create opportunity Off, the accepted review as target, 09:10, full length | Desktop 1440 | AI-02 | Drawer panel over a host page | Dean Fiedler | 1440×2686 | `33:25189` |
| APX01 | Review a proposal, opened from Your proposals, 09:00 | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `33:31660` |
| APX02 | Similar record, Create anyway confirmation, what-if 09:03 | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `33:32401` |
| APX03 | Why this value (F2) on Due | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `33:32937` |
| APX04 | Confirm, Create activity, Mon 2 Nov 14:12 earlier frame | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `33:37895` |
| APX05 | Discard, 09:04 later frame | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `33:38408` |
| APX06 | Filters on Your proposals, 09:00 | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `33:38937` |
| APX07 | Columns on Your proposals | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `35:19674` |
| APX08 | Saved view on Your proposals | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `35:20269` |
| APX09 | Export, the list only | Dialogs and panels | AI-02 | Dialog | Ravi Kumar | 1440×900 | `35:20777` |
| APS01 | validation errors, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37160` |
| APS02 | permission denied, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37250` |
| APS03 | duplicate click while saving, Mon 2 Nov 14:12 | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37301` |
| APS04 | access changed, the draft cleared, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37361` |
| APS05 | rejected by PPO, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37413` |
| APS06 | superseded by a newer preview, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37468` |
| APS07 | due date needed, the time never invented, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:37521` |
| APS08 | no matching contact, never invented, what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:41582` |
| APS09 | still not confirmed after a check, what-if Tue 3 Nov 16:52 | States | AI-02 | State | Ravi Kumar | 432×680 | `35:41656` |
| APS10 | an earlier save unconfirmed blocks a new one, what-if Tue 3 Nov 16:46 | States | AI-02 | State | Ravi Kumar | 432×680 | `35:41716` |
| APS11 | change the linked record (the customer), what-if | States | AI-02 | State | Ravi Kumar | 432×680 | `35:41782` |
| APS12 | Your proposals empty, 09:00 | States | AI-02 | State | Taylor Quinn | 900×440 | `35:41861` |
| APS13 | Your proposals couldn’t load, what-if | States | AI-02 | State | Ravi Kumar | 900×440 | `35:41902` |
| TB-AP02 | review form at 1024, drawer over the work order | Tablet 1024 | AI-02 | Tablet variant | Ravi Kumar | 1024×768 | `35:43773` |
| PH04 | review form full screen, full length | Phone 390 and 320 | AI-02 | Phone variant, 390 px | Ravi Kumar | 390×1535 | `35:44363` |
| PH04 | review at 320, scrolled to the top | Phone 390 and 320 | AI-02 | Phone variant, 320 px | Ravi Kumar | 320×844 | `35:44553` |
| PH05a | Saved from PPO, Mon 2 Nov 14:12 earlier frame | Phone 390 and 320 | AI-02 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:45674` |
| PH05b | Outcome unknown, Tue 3 Nov 16:41 earlier frame | Phone 390 and 320 | AI-02 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:45752` |
| PH06 | Your proposals on the phone, 09:00 | Phone 390 and 320 | AI-02 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:45829` |

### 3.4 Drafting and domain help · AI-04 (page `5:7`; 15 sheets)

Route or placement: Inside the owning pages (SV-02, SV-08, PJ-08) and the Assistant tab; no `/assistant/drafts` page (AI-04 Q6). Flows and notes card `35:34437`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| DR01 | SV-02 conversation, Priya Shah’s 08:20 message ticked | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `27:3451` |
| DR02 | the draft in Reply to customer, 09:08 | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `27:3809` |
| DR03 | edited and sent with SV-02’s own Send at 09:10, later frame; ADR-0059 stage assumed | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `29:4392` |
| DR04 | domain help from a validated procedure, 08:55, full length | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×1512 | `29:4717` |
| DR05 | a hypothesis: SYN-KA-000018 without steps, 08:55 | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:10250` |
| DR06 | Escalate, don’t improvise: nothing applies 5 of 5 on SYN-TKT-000212, 09:02 | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:10824` |
| DR07 | an instruction found in a ticked message, ignored; what-if | Desktop 1440 | AI-04 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:20082` |
| DR08 | PJ-08 Update 5 for SYN-PRJ-000027 drafted for Morgan Lee; later pilot role, proposal, full le… | Desktop 1440 | AI-04 | Drawer panel over a host page | Morgan Lee | 1440×1144 | `31:26009` |
| DX01 | Draft with Carl: what Carl will read, before drafting | Dialogs and panels | AI-04 | Dialog | Ravi Kumar | 1440×900 | `32:14136` |
| DX02 | Discard a draft: asks first, nothing was sent | Dialogs and panels | AI-04 | Dialog | Ravi Kumar | 1440×900 | `32:14452` |
| DX03 | Open a remote diagnosis case: SV-08 new case prefilled, completed by Ravi, ready for SV-08’s… | Dialogs and panels | AI-04 | Dialog | Ravi Kumar | 1440×900 | `32:21798` |
| DR09 | drafting states sheet: thinking, no messages, changed since drafted, nothing applicable, unav… | States | AI-04 | State | Ravi Kumar | 1440×1116 | `33:19009` |
| TB-DR02 | the draft in Reply to customer, tablet 1024 | Tablet 1024 | AI-04 | Tablet variant | Ravi Kumar | 1024×768 | `33:26894` |
| PH07 | draft in SV-02’s phone composer | Phone 390 and 320 | AI-04 | Phone variant, 390 px | Ravi Kumar | 390×844 | `33:27239` |
| PH08 | /assistant: domain help steps with the SAFETY band, 08:55, full length | Phone 390 and 320 | AI-04 | Phone variant, 390 px | Ravi Kumar | 390×1672 | `33:37718` |

### 3.5 Voice capture · AI-05 (page `5:8`; 26 sheets)

Route or placement: The composer’s microphone, in the Assistant tab and on the phone. Flows and notes card `35:45538`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| VC01 | microphone and first use, desktop | Desktop 1440 | AI-05 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `27:4197` |
| VC02 | recording, the recorder replaces the composer | Desktop 1440 | AI-05 | Record detail | Ravi Kumar | 1440×900 | `29:5631` |
| VC03 | read-back of names, numbers and times | Desktop 1440 | AI-05 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `29:9223` |
| VC04a | all five ticked, Continue unlocked, Keep as a note unticked | Desktop 1440 | AI-05 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `31:5923` |
| VC04b | after Continue: the text in the composer, the recording deleted | Desktop 1440 | AI-05 | Record detail | Ravi Kumar | 1440×900 | `31:13960` |
| VCX01 | Voice first use panel: Allow chosen, the browser asks | Dialogs and panels | AI-05 | Dialog | Ravi Kumar | 1440×900 | `31:18154` |
| VCX02 | Read-back: check “V3”, a low-confidence item | Dialogs and panels | AI-05 | Dialog | Ravi Kumar | 1440×900 | `31:18653` |
| VCX03 | Keep as a note, what-if when ticked (the story leaves it unticked) | Dialogs and panels | AI-05 | Dialog | Ravi Kumar | 1440×900 | `31:23418` |
| VC-ST01 | the microphone in every state, one sheet | States | AI-05 | State | Ravi Kumar | 1440×680 | `32:7894` |
| VC05a | refusal: “Create isn’t done by voice” | States | AI-05 | State | Ravi Kumar | 432×700 | `32:21110` |
| VC05b | refusal: not while driving | States | AI-05 | State | Ravi Kumar | 432×700 | `32:21160` |
| VC05c | the speech service “To be decided”, no product named | States | AI-05 | State | Ravi Kumar | 432×700 | `32:21212` |
| VC06a | problem: microphone not allowed | States | AI-05 | State | Ravi Kumar | 432×700 | `33:8295` |
| VC06b | problem: too quiet to hear | States | AI-05 | State | Ravi Kumar | 432×700 | `33:8338` |
| VC06c | problem: speech service unavailable, what-if with a live service | States | AI-05 | State | Ravi Kumar | 432×700 | `33:8393` |
| VC06d | problem: budget reserved first, unavailable when paused (what-if) | States | AI-05 | State | Ravi Kumar | 432×700 | `33:8437` |
| VC06e | problem: offline, nothing queued | States | AI-05 | State | Ravi Kumar | 432×700 | `33:8485` |
| PH14 | microphone first use on the phone, 09:15 | Phone 390 and 320 | AI-05 | Phone variant, 390 px | Ravi Kumar | 390×844 | `33:33556` |
| PH15 | recording 0:38 of 2:00, the recorder replaces the composer, 09:15 | Phone 390 and 320 | AI-05 | Phone variant, 390 px | Ravi Kumar | 390×844 | `33:33693` |
| PH15b | the 10-second warning at 1:52, what-if (the story’s note stopped at 0:38) | Phone 390 and 320 | AI-05 | Phone variant, 390 px | Ravi Kumar | 390×844 | `33:33829` |
| PH16 | read-back with ticks, 09:16, full length | Phone 390 and 320 | AI-05 | Phone variant, 390 px | Ravi Kumar | 390×1101 | `35:14015` |
| PH16 | read-back with ticks, 09:16, full length | Phone 390 and 320 | AI-05 | Phone variant, 320 px | Ravi Kumar | 320×1191 | `35:14157` |
| PH17 | Continue: the text in the composer, recording deleted, Keep as a note unticked, 09:16 | Phone 390 and 320 | AI-05 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:34585` |
| PH17b | Service request SV-02 — Add internal note opened with the checked text, 09:17 later frame | Phone 390 and 320 | AI-05 hand-off | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:34726` |
| PH17c | Service request SV-02 — internal note saved by Ravi at 09:17, later frame | Phone 390 and 320 | AI-05 hand-off | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:34838` |
| TB-VC03 | read-back at 1024, the drawer over the request | Tablet 1024 | AI-05 | Tablet variant | Ravi Kumar | 1024×768 | `35:38326` |

### 3.6 Recurring checks · AI-07 (page `5:9`; 25 sheets)

Route or placement: `/assistant/automations` under More › Assistant. Flows and notes card `35:47439`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| RC01 | My checks register, Thu 5 Nov 09:00, full length | Desktop 1440 | AI-07 | Register / worklist | Ravi Kumar | 1440×1038 | `31:4040` |
| RC02 | Templates register, full length | Desktop 1440 | AI-07 | Register / worklist | Ravi Kumar | 1440×1121 | `31:4602` |
| RC04 | check record "Waiting on a customer reply", Overview | Desktop 1440 | AI-07 | Overview / dashboard | Ravi Kumar | 1440×900 | `31:19193` |
| RC05 | Run history register, November | Desktop 1440 | AI-07 | Register / worklist | Ravi Kumar | 1440×900 | `31:19663` |
| RC06 | run detail with suggestions, Thu 5 Nov 07:52, full length | Desktop 1440 | AI-07 | Record detail | Ravi Kumar | 1440×1095 | `32:11606` |
| RC10 | "Backups out of date" record, Suggestions, ran 08:05, full length | Desktop 1440 | AI-07 | Record detail | Taylor Quinn | 1440×1117 | `33:1196` |
| RC03 | New check from a template, 09:15 later frame | Dialogs and panels | AI-07 | Dialog | Ravi Kumar | 1440×900 | `33:26054` |
| RC09 | Approve a team check, 09:35 later frame | Dialogs and panels | AI-07 | Dialog | Jordan Kim | 1440×900 | `33:26512` |
| RC11 | Dismiss a suggestion with a reason, dialog open, nothing dismissed yet | Dialogs and panels | AI-07 | Dialog | Taylor Quinn | 1440×900 | `33:35057` |
| RC12 | Plan follow-up, a My Work activity Taylor creates | Dialogs and panels | AI-07 | Dialog | Taylor Quinn | 1440×900 | `33:35519` |
| RC13 | Pause or retire a check, dialog open | Dialogs and panels | AI-07 | Dialog | Ravi Kumar | 1440×900 | `33:36023` |
| RC07 | partial run, Thu 5 Nov 08:05 | States | AI-07 | State | Taylor Quinn | 1440×900 | `35:5648` |
| RC08 | Paused by budget, what-if with a live provider | States | AI-07 | State | Ravi Kumar | 1440×900 | `35:6141` |
| RC14 | state: scheduling not yet available | States | AI-07 | State | Ravi Kumar | 760×349 | `35:31112` |
| RC15 | state: template withdrawn, what-if | States | AI-07 | State | Ravi Kumar | 760×349 | `35:31138` |
| RC16 | state: owner left, what-if | States | AI-07 | State | Jordan Kim | 760×349 | `35:31162` |
| RC17 | state: suggestion already in My Work, deterministic match | States | AI-07 | State | Ravi Kumar | 760×349 | `35:31184` |
| RC18 | state: a source the owner can’t read | States | AI-07 | State | Taylor Quinn | 760×330 | `35:31212` |
| RC19 | state: failed run, what-if | States | AI-07 | State | Ravi Kumar | 760×330 | `35:31232` |
| RC20 | state: no checks yet | States | AI-07 | State | Dean Fiedler | 760×330 | `35:31255` |
| TB-RC01 | My checks register at 1024, collapsed strip | Tablet 1024 | AI-07 | Tablet variant | Ravi Kumar | 1024×768 | `35:38004` |
| PH18 | suggestions on the phone, 390 | Phone 390 and 320 | AI-07 | Phone variant, 390 px | Ravi Kumar | 390×844 | `35:45199` |
| PH18 | suggestions on the phone, 320, full length | Phone 390 and 320 | AI-07 | Phone variant, 320 px | Ravi Kumar | 320×851 | `35:45268` |
| PH19a | Approve a team check on the phone: disabled, where it can be done | Phone 390 and 320 | AI-07 | Phone variant, 390 px | Jordan Kim | 390×844 | `35:41522` |
| PH19 | run detail on the phone, Thu 5 Nov 07:52, full length | Phone 390 and 320 | AI-07 | Phone variant, 390 px | Ravi Kumar | 390×1256 | `35:45911` |

### 3.7 Knowledge · DK-04 (page `5:10`; 32 sheets)

Route or placement: `/knowledge` under More › Knowledge; offline copies on the phone. Flows and notes card `40:8358`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| KN01 | Knowledge search — “screen drive motor” checked against the CP-4 panel, full length | Desktop 1440 | DK-04 | Register / worklist | Ravi Kumar | 1440×1259 | `31:3217` |
| KN03 | Article SYN-KA-000014 r03 “Replacing a screen drive motor · ScreenLogic SL-24” — published, full length | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×3846 | `31:21616` |
| KN04 | Superseded revision SYN-KA-000021 r01 “Checking screen position settings” — opened from an old link, steps withheld, ful… | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×1009 | `32:15308` |
| KN05 | Suspected fix SYN-KA-000018 r01 “Drive 2 intermittent: worn coupling suspected” — hypothesis, no corrective steps, staff… | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×977 | `32:15811` |
| KN06 | Applies: Unknown — SYN-KA-000011 r01 “Priming a fertigation pump” from SYN-TKT-000212’s context, full length | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×1325 | `33:20139` |
| KN07 | Review overdue — SYN-KA-000009 r01 “Rainwater tank level sensor wiring”, still readable with the warning, full length | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×1224 | `33:20708` |
| KN08 | Withdrawn — SYN-KA-000023 “Resetting a screen motor overload”, reason kept, no steps | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×900 | `33:21256` |
| KN10 | Saved for offline — Casey Ward’s 3 copies with their age, Check now, N-K12 proposal | Desktop 1440 | DK-04 | Record detail | Casey Ward | 1440×900 | `33:30354` |
| KN11 | Knowledge for this equipment — card on the CP-4 panel equipment record, host from Customers, sites and equipment | Desktop 1440 | DK-04 | Record detail | Ravi Kumar | 1440×900 | `33:30736` |
| KN02 | Set context — panel over Knowledge search: five values from a record or by hand | Dialogs and panels | DK-04 | Dialog | Ravi Kumar | 1440×900 | `35:2197` |
| KN09 | Suggest a change — dialog on SYN-KA-000014 r03, step 6 torque, becomes learning item SYN-LRN-000033 | Dialogs and panels | DK-04 | Dialog | Casey Ward | 1440×900 | `35:2700` |
| KN13 | Save for offline — dialog on SYN-KA-000014 r03, earlier frame Mon 2 Nov 17:10 | Dialogs and panels | DK-04 | Dialog | Casey Ward | 1440×900 | `35:30604` |
| KN14 | Article record header — Actions and Outputs menus open on SYN-KA-000014 r03 | Dialogs and panels | DK-04 | Dialog | Ravi Kumar | 1440×310 | `35:31046` |
| KN15 | Suggestion submitted — learning item SYN-LRN-000033 for Alex Lee, 08:44, the article unchanged | Dialogs and panels | DK-04 | Dialog | Casey Ward | 1440×241 | `35:31095` |
| KN12a | Knowledge search — loading, no counts | States | DK-04 | State | Ravi Kumar | 710×440 | `37:3252` |
| KN12b | Knowledge search — no results, “Ask a reviewer to write one” | States | DK-04 | State | Ravi Kumar | 710×440 | `37:3279` |
| KN12c | Knowledge search — filtered-empty, filters restated | States | DK-04 | State | Ravi Kumar | 710×440 | `37:3308` |
| KN12d | Knowledge search — could not load, source named | States | DK-04 | State | Ravi Kumar | 710×440 | `37:3341` |
| KN12i | Saved for offline — copies out of date after 7 days without a check (what-if Fri 13 Nov 09:00), phone 390 | States | DK-04 | State | Casey Ward | 390×844 | `37:21224` |
| KN12j | Knowledge offline — saved copies readable with their age, search needs a connection (what-if 13:20 at Glasshouse 4), pho… | States | DK-04 | State | Casey Ward | 390×844 | `37:21347` |
| KN12e | Article — view only, no commands shown | States | DK-04 | State | Lee Nakamura | 710×440 | `37:21119` |
| KN12f | Article — not permitted, staff-only content, nothing revealed | States | DK-04 | State | Lee Nakamura | 710×440 | `37:21154` |
| KN12g | Article — an unavailable revision is never swapped for another | States | DK-04 | State | Ravi Kumar | 710×440 | `37:21173` |
| KN12h | Article — required source unavailable, held for checking (what-if) | States | DK-04 | State | Ravi Kumar | 710×440 | `37:21201` |
| TB-KN01 | Knowledge search — tablet 1024, collapsed strip, “screen drive motor” on the CP-4 panel | Tablet 1024 | DK-04 | Tablet variant | Ravi Kumar | 1024×768 | `38:3440` |
| TB-KN03 | Article SYN-KA-000014 r03 — tablet 1024, details folded into the context strip, full length | Tablet 1024 | DK-04 | Tablet variant | Ravi Kumar | 1024×1749 | `38:3807` |
| PH20 | Knowledge search — “screen drive motor” with the job’s context at 08:40, phone 390 | Phone 390 and 320 | DK-04 | Phone variant, 390 px | Casey Ward | 390×844 | `35:41951` |
| PH22 | Saved for offline — 3 copies on Casey’s phone with their age, Check now, phone 390 | Phone 390 and 320 | DK-04 | Phone variant, 390 px | Casey Ward | 390×844 | `35:46902` |
| PH23 | Suggest a change — bottom sheet on SYN-KA-000014 r03 step 6 at 08:44, phone 390 | Phone 390 and 320 | DK-04 | Phone variant, 390 px | Casey Ward | 390×844 | `35:47027` |
| PH20 | Knowledge search — “screen drive motor” with the job’s context at 08:40, phone 320 | Phone 390 and 320 | DK-04 | Phone variant, 320 px | Casey Ward | 320×844 | `35:46573` |
| PH21 | Article SYN-KA-000014 r03 — steps with the SAFETY band, offline copy, full length, phone 390 | Phone 390 and 320 | DK-04 | Phone variant, 390 px | Casey Ward | 390×1790 | `35:42105` |
| PH21 | Article SYN-KA-000014 r03 — steps with the SAFETY band, offline copy, full length, phone 320 | Phone 390 and 320 | DK-04 | Phone variant, 320 px | Casey Ward | 320×2116 | `35:46718` |

### 3.8 Knowledge authoring · DK-05 (page `5:11`; 24 sheets)

Route or placement: `/knowledge/review` under More › Knowledge. Flows and notes card `37:21030`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| KA01 | Authoring & review — All work, Thu 5 Nov 09:00, full length | Desktop 1440 | DK-05 | Register / worklist | Casey Quinn | 1440×1497 | `31:12999` |
| KA02 | Learning intake — 7 items, Thu 5 Nov 09:00 | Desktop 1440 | DK-05 | Register / worklist | Alex Lee | 1440×900 | `31:22459` |
| KA10 | Edit a published article makes a successor — SYN-KA-000014 r04 Draft, Thu 5 Nov 09:00 | Desktop 1440 | DK-05 | Record detail | Alex Lee | 1440×900 | `32:21280` |
| KA12 | SYN-KA-000017 r02 — Returned with findings; SYN-KA-000009 review overdue | Desktop 1440 | DK-05 | Record detail | Sam Jordan | 1440×900 | `31:22926` |
| KA04 | Article editor — SYN-KA-000020 r01 Draft, Tue 3 Nov (earlier frame), full length | Desktop 1440 | DK-05 | Form / guided workflow | Alex Lee | 1440×2558 | `32:8748` |
| KA13 | Capture learning — desktop dialog, becomes SYN-LRN-000031, Mon 2 Nov (earlier frame) | Dialogs and panels | DK-05 | Dialog | Sam Jordan | 1440×900 | `33:28981` |
| KA03 | Triage a learning item — SYN-LRN-000027 → Make it a new article, Mon 2 Nov (earlier frame) | Dialogs and panels | DK-05 | Dialog | Alex Lee | 1440×900 | `33:29416` |
| KA05 | Submit for review — SYN-KA-000020 r01 to Casey Quinn, Tue 3 Nov (earlier frame) | Dialogs and panels | DK-05 | Dialog | Alex Lee | 1440×900 | `33:29886` |
| KA06 | Technical review — SYN-KA-000020 r01, Validate or Return, Thu 5 Nov 09:20 (later frame) | Dialogs and panels | DK-05 | Dialog | Casey Quinn | 1440×900 | `33:36503` |
| KA07 | Safety second confirmation — SYN-KA-000020 r01, Thu 5 Nov 09:40 (later frame) | Dialogs and panels | DK-05 | Dialog | Jordan Kim | 1440×900 | `33:36982` |
| KA08 | Customer audience approval — SYN-KA-000021 r02 approved, with audience history, Mon 2 Nov (earlier frame) | Dialogs and panels | DK-05 | Dialog | Jordan Kim | 1440×900 | `35:10598` |
| KA09 | Publish — SYN-KA-000020 r01, Thu 5 Nov 10:05 (later frame) | Dialogs and panels | DK-05 | Dialog | Alex Morgan | 1440×900 | `35:11076` |
| KA11 | Withdraw — SYN-KA-000023 r01, reason required, history kept, Fri 30 Oct (earlier frame) | Dialogs and panels | DK-05 | Dialog | Jordan Kim | 1440×900 | `35:36220` |
| KA11b | Supersede — publishing SYN-KA-000021 r02 supersedes r01, Mon 2 Nov (earlier frame) | Dialogs and panels | DK-05 | Dialog | Alex Morgan | 1440×900 | `35:36694` |
| KA-ST1 | Author tries to review own revision — refused with reason, SYN-KA-000020 r01, Thu 5 Nov 09:00 | States | DK-05 | State | Alex Lee | 1440×900 | `35:38843` |
| KA-ST2 | Source hold — Publish disabled, the publisher can’t override (what-if, not a story event) | States | DK-05 | State | Alex Morgan | 1440×900 | `35:39294` |
| KA-ST3 | Unavailable revision never swapped — SYN-KA-000019 r02 | States | DK-05 | State | Casey Quinn | 740×470 | `35:42299` |
| KA-ST4 | Customer-publishable refused for hardware work — r04 | States | DK-05 | State | Alex Lee | 740×470 | `35:42325` |
| KA-ST5 | Nothing to review — In review, reviewer: me, 09:00 | States | DK-05 | State | Riley Tran | 740×470 | `35:42353` |
| KA-ST6 | Publisher cannot edit — SYN-KA-000020 r01, 10:05 (later frame) | States | DK-05 | State | Alex Morgan | 740×470 | `35:42380` |
| TB-KA01 | Authoring & review — All work, 1024, docked menu collapsed to the strip | Tablet 1024 | DK-05 | Tablet variant | Casey Quinn | 1024×768 | `35:44752` |
| PH24 | Capture learning from a job — SYN-WO-000038 Mallee Fresh, Wed 4 Nov 16:20 ACDT, full length | Phone 390 and 320 | DK-05 | Phone variant, 390 px | Pat Rowe | 390×1015 | `35:46147` |
| PH24b | Sent for triage — SYN-LRN-000032 on job SYN-WO-000038, Wed 4 Nov 16:21 ACDT | Phone 390 and 320 | DK-05 | Phone variant, 390 px | Pat Rowe | 390×844 | `35:46227` |
| PH25 | Safety second confirmation on the phone — SYN-KA-000020 r01, Thu 5 Nov 09:40 (later frame) | Phone 390 and 320 | DK-05 | Phone variant, 390 px | Jordan Kim | 390×844 | `35:46323` |

### 3.9 Help Centre and page guides · DK-07 (page `5:12`; 27 sheets)

Route or placement: The drawer’s Page guide tab, `/help` from the Account menu, and `system:guidance`. Flows and notes card `41:9880`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| HG01 | Page guide tab on SYN-WO-000062: the Work orders guide, Draft · not reviewed yet (carried-… | Desktop 1440 | DK-07 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:9424` |
| HG02 | the same guide after review and publication: Published · reviewed by Jordan Kim Thu 5 Nov… | Desktop 1440 | DK-07 | Drawer panel over a host page | Ravi Kumar | 1440×900 | `32:10096` |
| HG03 | No guide for this page yet, labelled what-if (at bdcdd347 no registered page lacks a guide… | Desktop 1440 | DK-07 | Register / worklist | Ravi Kumar | 1440×900 | `33:15268` |
| HG09 | guide gap SYN-HLP-000014 from Onboarding and support: routed by Taylor Quinn to Jordan Kim… | Desktop 1440 | DK-07 | Drawer panel over a host page | Jordan Kim | 1440×900 | `33:15765` |
| HG04 | Help Centre home, opened from the Account menu’s Help centre, Thu 5 Nov 09:00, full length… | Desktop 1440 | DK-07 | Overview / dashboard | Jesse Moore | 1440×1248 | `33:31051` |
| HG05 | guide reading view: Work orders, the 13 template sections, opened from the panel’s expand… | Desktop 1440 | DK-07 | Document | Ravi Kumar | 1440×2903 | `35:7810` |
| HG08 | Page guide coverage: every registered entry read from the register at commit bdcdd347, by… | Desktop 1440 | DK-07 | Register / worklist | Dean Fiedler | 1440×2424 | `35:34951` |
| HG06 | Review a guide in the panel: all 13 sections match, Mark reviewed enabled, content hash re… | Dialogs and panels | DK-07 | Dialog | Jordan Kim | 1440×900 | `35:40136` |
| HG07 | Publish a guide dialog: General users will see this revision, the hash, publishes once, la… | Dialogs and panels | DK-07 | Dialog | Dean Fiedler | 1440×900 | `35:40800` |
| HG10 | Guide feedback panel: No with a comment, sent to the guide’s owner Jamie Park, Thu 5 Nov 0… | Dialogs and panels | DK-07 | Dialog | Dean Fiedler | 1440×900 | `35:42913` |
| HG10b | Guide feedback, owner’s view this week: Deals guide, 2 No with comments | Dialogs and panels | DK-07 | Dialog | Jamie Park | 760×500 | `35:43542` |
| HG04a | Account menu: Help centre opens the Help Centre home (R11) | Dialogs and panels | DK-07 | Dialog | Jesse Moore | 640×500 | `35:43568` |
| HG11 | Stale: the page changed after this guide was reviewed; still shown (what-if after the 10:0… | States | DK-07 | State | Ravi Kumar | 1440×371 | `35:45337` |
| HG12 | Withdrawn: only Withdrawn hides a guide; the page then reads No guide for this page yet (w… | States | DK-07 | State | Ravi Kumar | 1440×388 | `35:45398` |
| HG-S5 | Review a guide: Mark reviewed disabled until all 13 sections match (12 of 13 · 1 needs cha… | States | DK-07 | State | Jordan Kim | 1440×466 | `35:45457` |
| HG-S1 | guide statuses, the stale flag and who sees each | States | DK-07 D1, guidance contract | State | No one | 1440×486 | `35:46394` |
| HG-S2 | Draft shown before review (the contract’s carried-over case) against the fallback; wording… | States | DK-07 Q7 default | State | Ravi Kumar | 1440×402 | `35:46518` |
| HG-S3 | a guide for a page not yet delivered is never shown as covering it: Recurring checks AI-07… | States | DK-07 | State | Ravi Kumar | 1440×227 | `35:47128` |
| HG-S4 | an SOP opens in the Document library: SYN-DOC-000112 from the Work orders guide; a restric… | States | DK-07 D7, Q3 | State | Ravi Kumar | 1440×372 | `35:47171` |
| TB09 | Help Centre home, tablet 1024, collapsed Knowledge strip | Tablet 1024 | DK-07 | Tablet variant | Jesse Moore | 1024×768 | `35:47557` |
| TB10 | Page guide coverage, tablet 1024, counts read at bdcdd347, collapsed Knowledge strip | Tablet 1024 | DK-07 | Tablet variant | Dean Fiedler | 1024×768 | `35:47874` |
| PH26 | Page guide from the phone header’s more menu on SYN-WO-000062, 390 | Phone 390 and 320 | DK-07 | Phone variant, 390 px | Ravi Kumar | 390×844 | `37:16834` |
| PH29 | No guide for this page yet on the phone, labelled what-if (at bdcdd347 no registered page… | Phone 390 and 320 | DK-07 | Phone variant, 390 px | Ravi Kumar | 390×844 | `37:16947` |
| PH26 | Page guide from the phone header’s more menu on SYN-WO-000062, 320 | Phone 390 and 320 | DK-07 | Phone variant, 320 px | Ravi Kumar | 320×844 | `37:16989` |
| PH27 | Help Centre home on the phone, opened from the more menu’s Help centre, 390, full length | Phone 390 and 320 | DK-07 | Phone variant, 390 px | Jesse Moore | 390×1252 | `38:12543` |
| PH27 | Help Centre home on the phone, opened from the more menu’s Help centre, 320, full le… | Phone 390 and 320 | DK-07 | Phone variant, 320 px | Jesse Moore | 320×1294 | `38:12794` |
| PH28 | guide reading view on the phone: Work orders, the 13 sections, Draft · not reviewed yet, 3… | Phone 390 and 320 | DK-07 | Phone variant, 390 px | Ravi Kumar | 390×1655 | `38:13045` |

### 3.10 Interaction states · AI · DK (page `5:13`; 32 sheets)

Route or placement: The app-wide states, accessibility proof and register standard for every scope above. Flows and notes card `49:2260`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| ST01a | assistant parts in every state, full length | Desktop 1440 | AI-01 · AI-02 · AI-04 · AI-05 | Reference sheet | Ravi Kumar | 1440×2419 | `37:21475` |
| ST01b | checks, knowledge, guides and buttons, full length | Desktop 1440 | AI-07 · DK-04 · DK-07 | Reference sheet | Ravi Kumar | 1440×2498 | `38:8600` |
| ST01c | Register standard — rows, headers, sorting, reorder, resize and density, full length | Desktop 1440 | AI-02 · AI-07 · DK-04 · DK-05 · DK-07 | Reference sheet | Ravi Kumar | 1440×2536 | `40:782` |
| ST01d | Keyboard order — Ctrl J, the drawer’s tab order, Escape and focus return over SYN-WO-000062 | Desktop 1440 | AI-01 · AI-03 | Reference sheet | Ravi Kumar | 1440×900 | `41:14656` |
| ST01e | Accessibility — contrast proof from the PPO colour variables, announcements and rules (prompt 6.6) | Desktop 1440 | — | Reference sheet | Ravi Kumar | 1440×1960 | `42:5120` |
| ST02 | 200 % zoom reflow — Your proposals at 720 CSS px, note sheet | Desktop 1440 | AI-02 | Reference sheet | Ravi Kumar | 1440×560 | `42:5723` |
| DP | No dialogs on this page — dialogs are drawn on their scope pages (AI · DK) | Dialogs and panels | — | Dialog | No one | 1440×142 | `49:2256` |
| PS01 | Your proposals — loading, no counts | States | AI-02 | State | Ravi Kumar | 760×446 | `44:6570` |
| PS02 | Your proposals — true-empty “No proposals in the last 30 days” | States | AI-02 | State | Taylor Quinn | 760×426 | `44:6655` |
| PS03 | Recurring checks — true-empty “No checks yet” | States | AI-07 | State | Dean Fiedler | 760×450 | `44:6684` |
| PS04 | Knowledge search — true-empty “No results” | States | DK-04 | State | Ravi Kumar | 760×472 | `44:6731` |
| PS05 | Authoring & review — true-empty “Nothing to review” | States | DK-05 | State | Riley Tran | 760×384 | `44:6772` |
| PS07 | Your proposals — filtered-empty, filters restated | States | AI-02 | State | Ravi Kumar | 760×453 | `44:6799` |
| PS08 | Knowledge search — could not load, source named | States | DK-04 · AI-01 | State | Ravi Kumar | 760×460 | `45:1558` |
| PS19 | Recurring checks — scheduling not available | States | AI-07 | State | Ravi Kumar | 760×394 | `45:1585` |
| PS09a | Your proposals from an old link — denied | States | AI-02 | State | Jordan Kim | 760×430 | `45:1652` |
| PS09b | Knowledge article from an old link — not found | States | DK-04 | State | Lee Nakamura | 760×430 | `45:1674` |
| PS10 | SYN-KA-000014 r03 — view only | States | DK-04 | State | Lee Nakamura | 1360×442 | `45:1695` |
| PS11 | SYN-KA-000014 r04 draft — version conflict | States | DK-05 | State | Alex Lee | 1360×409 | `45:1782` |
| PS21b | SYN-KA-000020 r01 review — permission changed while open | States | DK-05 | State | Casey Quinn | 1360×317 | `45:1866` |
| PS15 | Assistant tab — Thinking | States | AI-01 | State | Ravi Kumar | 432×468 | `46:1741` |
| PS16 | Assistant tab — Stopped by the person | States | AI-01 | State | Ravi Kumar | 432×468 | `46:1800` |
| PS17 | Assistant tab — turn limit, what-if on the live provider | States | AI-01 | State | Ravi Kumar | 432×567 | `46:1851` |
| PS18 | Assistant tab — panel closed while answering | States | AI-01 | State | Ravi Kumar | 432×509 | `46:1909` |
| PS14 | Assistant tab — provider Simulated, Paused, Unavailable | States | AI-01 | State | Ravi Kumar | 432×682 | `46:1961` |
| PS13 | Assistant tab on Deals — window reached “First 20 shown · more exist” | States | AI-01 | State | Dean Fiedler | 432×592 | `46:2008` |
| PS12 | Assistant tab — source changed since read | States | AI-03 | State | Ravi Kumar | 432×544 | `46:2085` |
| PS21a | Assistant tab — access changed while open | States | AI-01 · AI-03 | State | Ravi Kumar | 432×586 | `46:2172` |
| PS06 | Page guide tab — true-empty “No guide for this page yet” | States | DK-07 | State | Ravi Kumar | 432×329 | `46:2247` |
| TB01 | Your proposals at 1024 — the Assistant drawer over the register with the collapsed strip | Tablet 1024 | AI-01 · AI-02 | Tablet variant | Ravi Kumar | 1024×768 | `47:3086` |
| PH30a | Assistant on the phone — offline, assistant and voice unavailable | Phone 390 and 320 | AI-01 · AI-05 | Phone variant, 390 px | Ravi Kumar | 390×844 | `47:2933` |
| PH30b | Knowledge on the phone — offline copies readable with their age | Phone 390 and 320 | DK-04 | Phone variant, 390 px | Casey Ward | 390×844 | `47:2995` |

### 3.11 Administration · AI · DK (page `5:14`; 15 sheets)

Route or placement: A Settings configuration area beside Assistant settings (A-AD-1); no route is invented (A-AD-2). Flows and notes card `56:5693`.

| Code | Sheet | Section | Scope | Page type | Signed in | Size | Node |
|---|---|---|---|---|---|---|---|
| AD01 | Assistant, Knowledge and Help settings hub, full length: what can be changed, by whom and who reviews… | Desktop 1440 | AI-07 · DK-05 · DK-07 administration | Overview (settings hub) | Dean Fiedler | 1440×996 | `43:9` |
| AD02 | Knowledge types and rules: types, product families, five applicability fields, review intervals, safety… | Desktop 1440 | DK-05 · DK-04 | Configuration editor | Dean Fiedler | 1440×1441 | `44:4773` |
| AD03 | Knowledge duties per product family: author, technical reviewer, safety reviewer, audience approver, pu… | Desktop 1440 | DK-05 | Configuration editor | Dean Fiedler | 1440×900 | `45:8647` |
| AD04 | Learning intake: eight sources and the four triage outcomes of DK-05 D4, Thu 5 Nov 2026, 09:00 | Desktop 1440 | DK-05 | Configuration editor | Dean Fiedler | 1440×900 | `45:9065` |
| AD05 | Recurring check templates: three reviewed, one proposed, the review of a new template, working days, co… | Desktop 1440 | AI-07 | Configuration editor | Dean Fiedler | 1440×900 | `46:3215` |
| AD06 | Page guides: the 13-section template, statuses and the Stale flag, owners per workspace, the guidance c… | Desktop 1440 | DK-07 · system:guidance | Configuration editor | Dean Fiedler | 1440×1773 | `48:1063` |
| AD07 | What Carl may prepare: record types read from Assistant settings (Opportunity Off, Activity proposed, S… | Desktop 1440 | AI-06 read only · AI-02 | Configuration editor | Dean Fiedler | 1440×900 | `49:3540` |
| AD08 | Numbering, nudges and views: readable references (KA, LRN, GH, AIF, HLP), the nudges with their day cou… | Desktop 1440 | DK-05 · AI-07 · DK-07 | Configuration editor | Dean Fiedler | 1440×1418 | `50:1541` |
| AD02-X1 | Propose a change: review interval for Screen drives 12 → 6 months, names the reviewer, “Nothing changes… | Dialogs and panels | DK-05 | Dialog | Dean Fiedler | 1440×900 | `51:1665` |
| AD02-X2 | Review a proposed change: Accept or Return with a reason, “You didn’t propose this change” (what-if, no… | Dialogs and panels | DK-05 | Dialog | Alex Morgan | 1440×900 | `51:1938` |
| AD-S1 | a change waiting for review: nothing has changed yet (example, not a story event), Thu 5 Nov 2026, 09:0… | States | DK-05 | State | Dean Fiedler | 720×293 | `54:2036` |
| AD-S2 | read only for someone without a settings duty: no Propose a change, Thu 5 Nov 2026, 09:00 (AI · DK admi… | States | — | State | Jordan Kim | 720×282 | `54:2058` |
| AD-S3 | could not read Assistant settings: record types read Unknown, nothing filled in, Thu 5 Nov 2026, 09:00 | States | AI-06 read only | State | Dean Fiedler | 720×313 | `54:2079` |
| TB-AD01 | tablet 1024: settings hub, cards in two columns, Thu 5 Nov 2026, 09:00 (AI · DK administration) | Tablet 1024 | — | Tablet variant | Dean Fiedler | 1024×768 | `55:2121` |
| PH-AD01 | phone 390: settings read only, “Open on desktop to change settings”, Thu 5 Nov 2026, 09:00 (AI · DK adm… | Phone 390 and 320 | — | Phone variant, 390 px | Dean Fiedler | 390×844 | `54:2120` |

## 4. Rules applied

- The refined shell places the helpers (C5, R11, R66 to R68, Q14, Q22): the drawer's Assistant and Page guide tabs (the 432 px panel in the 480 px overlay drawer, no scrim on desktop, Ctrl J); the Assistant and Knowledge workspaces under More with More current on the rail and the accepted docked menus, each page's views nested while it is current (R108); the Help centre in the Account menu (R11) and the Page guide's header. The accepted page designs supply the content (prompt D2).
- Addendum A1 on every record (article revision, check, learning item, guide, and the host work order and request): breadcrumb, title with state chip and favourite, sub-line, previous and next "n of N in view" (hidden when opened by link), Actions, Outputs where the record has outputs, one state-driven primary; a disabled primary shows its reason; no record-level Undo, no New (+), no desktop back arrow.
- The app-wide register standard (D14, 6.3): one line per cell, sideways scroll, frozen first column; no inline edit (every change is a command with its own dialog); sorting only where the accepted pages allow it (Knowledge results by the accepted ranking, validated first, never by a column; Your proposals newest first; the authoring worklist by band then due date; coverage by workspace); no address lookup.
- Content rules (6.2): Carl speaks in the first person only to say what it read and could not; every statement carries citation chips naming the record, revision and read time; "Simulated answer · no AI used" on every answer; left-out sources are counted, never named; suggestions read "Suggested by Carl · not done"; drafts read "Drafted by Carl · review before sending"; Knowledge statuses are three facts in words; the SAFETY band in amber with words; guides show status and reviewed date; one tone per chip meaning; words never colour alone.
- The phone (6.5): `/assistant` from More › Ask Carl for the pilot users only; technicians have no assistant and see no entry; Knowledge is the technician's main surface; phone sheets never author, review, publish, approve a check or edit a guide (disabled with where it can be done).
- Accessibility (6.6): 2 px brand/green-deep focus ring; Ctrl J moves focus into the composer and back to the opener on close; answers announced politely when complete; citation chips are links with full names; 44 px targets in the assistant on the phone, 48 px elsewhere; contrast proved on ST01 from the PPO colour variables.
- Addendum A3.12 as the story truth: pilot users Ravi Kumar, Dean Fiedler and Taylor Quinn; provider Simulated; the 08:50, 08:52, 08:55 and 09:02 turns; the three proposals; the kept thread at 09:20; the three reviewed check templates and one proposed; sixteen articles SYN-KA-000009 to 000031; learning items SYN-LRN-000027 to 000033; guide.sv.03 reviewed 09:30 and published 10:00 as labelled later frames; SYN-HLP-000014.

## 5. Assumptions and proposed departures

Each item is for Dean's decision. File-wide items come first; each page's own list follows, as drawn on that page's Flows and notes card, where a comparison strip shows each departure beside the accepted page design. † marks a proposed capability and ◇ a role assumption.

### 5.1 File-wide

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A-F-1 | **File name.** Dean created the file as "PPO - Assistant, Knowledge & Help". The brief names it "PPO - Assistant, Knowledge and Help (proposal)", and the [design-to-build standard](../standards/design-to-build-standard.md) places the Assistant in "PPO - Workspace & Assistant" and Knowledge in "PPO - Records & Documents". Nothing was renamed | Keep Dean's name; the grouping is Dean's to decide |
| A-F-2 | **Local copies.** The shell and kit are local components rebuilt by script from PPO - Shell (accepted) and PPO - Sales module (accepted), because the Plugin API cannot copy nodes between files. Every colour is bound to the same-named "PPO colour" variable | Swap to PPO - Library when it is published |
| A-F-3 | **Host pages as skeletons.** The work order SYN-WO-000062, the request SYN-TKT-000212, Hillview Growers and the Deals register are labelled "Host page · …" skeletons drawn from their module files, never a second design of the module page | Keep |
| A-F-4 | **Collapsed docked strip corrected.** The builds first drew the collapsed docked workspace strip at 80 px with content from x 160. Dean flagged it as too wide on 13 November 2026. The accepted strip is 12 px at x 80, with content from x 92 at 1300 px on the desktop and 884 px on the tablet. 76 sheets were repaired, and no instance remains at 80 px | Keep the accepted geometry |
| A-F-5 | **Guide coverage corrected.** At `origin/main` bdcdd347 the register holds 393 entries (232 routes, 157 scopes, 4 systems). Read from `guides.json` and `docs/guides/*.md` together, they show Draft 369, In review 21 (16 of them shown before review) and No guide yet 3 (`system:theme`, `system:guidance`, `system:offline`). The brief's and A3.12's "367 guides, all Draft" counted `guides.json` only. HG08, TB10, HG09, HG03, PH29 and the HG Flows card carry the corrected reading | Keep; correct A3.12's row in its own change |
| A-F-6 | **Melbourne in place of Brisbane.** Working days come from the company's Working hours policy (Melbourne), and story times are AEDT. The accepted pages' Brisbane times and Queensland holidays are earlier fixtures. Northbank Farm · Block C keeps its own Brisbane site time zone (A3), and Mallee Fresh's capture reads ACDT. Tue 3 Nov 2026 is Melbourne Cup Day, which the check rule's "2 working days or more" tolerates (A-RC-2) | Keep |
| A-F-7 | **Proposed menu views and the More entry.** The Assistant and Knowledge workspaces sit under More, with More current on the rail and the accepted docked menus (Q22, R108). Views nested under a page that the accepted menus do not list are captioned "Proposed views". On the phone, More › Ask Carl appears for the pilot users only | Keep as proposed |
| A-F-8 | **Signed-in person per page.** Ravi Kumar (Service coordinator) is the default. Dean Fiedler signs in for the sales journeys on AI-01 and AI-02, for coverage and publication on DK-07, and for Administration. Each DK-05 sheet is signed in as the person who acts (author, reviewer, safety and audience approver, publisher). Casey Ward signs in for the technician's phone on DK-04, Jesse Moore for the Help Centre, Lee Nakamura for view-only states, and Taylor Quinn for the backup check and empty states. Every sheet label names its person (counts in section 6) | Keep |
| A-F-9 | **Tablet rail.** The accepted rail's scroll area (583 px for 600 px of items) clips More at 768 px. Item spacing is set to 0 inside the tablet rail instances only (11 sheets); the accepted component is unchanged | Fix in the Shell file (R1) |
| A-F-10 | **Proposed capabilities †.** `assistant.use`, own recurring checks, approve team checks, `knowledge.read`, author, review, safety review, audience approve, publish and guide review. None exists: `permissions.ts` holds only `conversation.read`, `conversation.post` and `conversation.agent.ask` | Decide when a build is planned, through an ADR and the permissions change |
| A-F-11 | **Role assumptions ◇.** Dean publishes reviewed guides as documentation owner. Jordan Kim approves Ravi's team check, withdraws service articles and reviews Service guides. Sam Jordan owns triage for Pumps. Drew Collins is the workshop lead. Sensors is a product family. Alex Morgan reviews knowledge rule and intake changes. Taylor Quinn reviews nudge changes and runs the access review for duty grants. Riley Tran reviews Climate control. The customer-publishable refusal is dated Mon 19 Oct. Dean adds the Dispatch held row to the guide at 09:22 and leaves one of the week's two guide comments | Confirm or name the people |
| A-F-12 | **Addendum A3.12 applied as the story truth:** pilot users Ravi Kumar, Dean Fiedler and Taylor Quinn (the AI-06 page notes' "service coordinator only" and AI-01 Q4's account manager are earlier readings); the refined shell's placements; Ravi's turns at 08:50, 08:52, 08:55 and 09:02; the 09:10 reply sent with SV-02's own Send; the 09:15 voice note saved at 09:17; the three proposals; Dean's 08:58 summary and the 09:20 thread; the three reviewed check templates and one proposed; the sixteen articles SYN-KA-000009 to 000031; learning items SYN-LRN-000027 to 000033; the lesson SYN-KA-000020 validated at 09:20, safety-confirmed at 09:40 and published at 10:05; `guide.sv.03` reviewed at 09:30 and published at 10:00 as labelled later frames; SYN-HLP-000014. The one A3.12 fact corrected is the coverage reading (A-F-5) | Keep; align the My Work, Settings, Service and Customer portal files where A3.12 says |
| A-F-13 | **Earlier fixtures superseded, recorded on each Flows card and not used:** the accepted pages' 23 October to 1 November stories in Brisbane time; the AI-01 and AI-02 opportunity stories (Jamie Park, Tue 13 Oct, SYN-PPO-ORG-000007, SYN-PPO-OPP-000118 and others); AI-07's Sasha Clarke story with Queensland holidays; DK-04's and DK-05's `SYN-PPO-KA-000001` to `000008`, `SYN-KA-000013`, `000015`, `000016`, `SYN-LRN-000019` to `000026`, and Alex Nguyen and Sasha Cole as publishers; the Shell drawer's stand-ins; DK-07's "368 = 216 + 152" | Keep |
| A-F-14 | **Stale notes recorded and not fixed here:** the design register lists AI-01 as unbuilt although the assistant core is built; DK-07's coverage total; the misspelled `knowlege-base` duplicate folder; DK-07's citation of the retired `src/shell/guide.ts`; the Shell file's workspace menus page header still reads "Proposal · awaiting Dean's acceptance" although the page name and the shell record say accepted; ADR-0062's provisional model pin contradicts AI-06's "Model · Not selected" (the conflict is recorded, not resolved) | Fix each in its own change |

### 5.2 Per page

**Assistant · AI-01.**
- A-AW-1: Ravi's phone tab bar reads My Work · Requests · Work orders · Schedule · More.
- A-AW-2: on the phone, More › Ask Carl is the record header's More menu, a bottom sheet that also holds Page guide.
- A-AW-3: citations use a record's revision where it has one, and its version otherwise. Dean's chips show the reference and read time only.
- A-AW-4: Dean's opportunity search at 09:12 keeps 3 turns by 09:10 (9.9). The 09:20 thread holds 2 questions and 2 answers.
- A-AW-5: Deals rows follow A3.8 where it names deals; the other rows are placeholders for the Sales file's 38.
- A-AW-6: at 1024 the Assistant opens as the overlay drawer; Expand to reading view gives AI-01 D15's 720 px column.
- A-AW-7: the desktop Overview is a proposal. AI-01 Q5 kept `/assistant` for phones.
- A-AW-8: a kept thread is visible to the deal's readers, replacing "participants only".
- A-AW-9: Report a problem creates a `SYN-AIF-` flagged answer. No number beside SYN-AIF-000002 is invented.
- A-AW-10: the turn-limit figures come from the accepted AI-01 states capture.
- A-AW-11: every what-if frame is labelled, and none changes the 9.9 counts.
- A-AW-12: SYN-TKT-000212's Open chip, the 06:50 phone log and the message texts are assumed. Jess Wong approves Update 4 (A3.11).

**Answer evidence · AI-03.**
- DEP-EV-1: AI-03 D3's 440 px drawer with a scrim becomes evidence inside the 432 px Assistant tab, with the full view in the page (R66, R67, D2).
- A-EV-2: records without issued revisions are cited by synthetic versions: SYN-WO-000040 v9, the SYN-RPT-000036 r01 response v2, SYN-WAR-000012 v4, SYN-TKT-000209 v6 and the motor M-4 equipment record v5.
- A-EV-3: "2 reports" means SYN-RPT-000036 r01 plus SYN-RPT-000038 (read, not used), which makes 6 sources.
- A-EV-4: EV06 uses the 08:50 read time from 9.1; the new message is a what-if at 08:58.
- A-EV-5: EV07 (08:53), EV09a and EV09b are what-ifs outside the 09:00 counts.
- A-EV-6: the evidence is opened at 08:51, before the 08:52 proposal.
- A-EV-7: Jordan Kim issued SYN-RPT-000036 r01, and Noah Patel responded.
- A-EV-8: "Open full view" replaces D15's "View all evidence".
- A-EV-9: the tablet uses the collapsed strip (12 px since A-F-4) with section pills in a row.
- A-EV-10: the Data quality dialog's primary is "Prepare finding in Data quality…", and the note is the person's own words.

**Proposal review · AI-02.**
- A-AP-1: the deterministic duplicate check runs on Create activity…, before Confirm (D6), as a panel that never blocks.
- A-AP-2: the brief's A$85,000 case is drawn as D8's value that Create opportunity cannot store, on Dean's Off target, as a what-if.
- A-AP-3: SYN-WO-000039 and SYN-WO-000056 are host skeletons; hashes and operation IDs are synthetic.
- A-AP-4: five views are captioned "Proposed views".
- A-AP-5: Your proposals uses a Type column.
- A-AP-6: frames outside the story are labelled.
- A-AP-7: AP09 is drawn at 09:00, and AP05 after 09:04.
- A-AP-8: the panel's More menu keeps a Your proposals link.
- A-AP-9: pilot users may review proposals on the phone (D11).
- A-AP-10: "changed since prepared" is a what-if built on the real 08:58 check.
- DEP-AP-1: the 400 px push panel becomes the 432 px drawer tab.
- DEP-AP-2: Your proposals becomes a register under More › Assistant.
- DEP-AP-3: the tablet shows the drawer over the work order.

**Drafting and domain help · AI-04.**
- A-DR-1: Draft with Carl opens a short confirm dialog (DX01); the accepted design drafted in one click.
- A-DR-2: the thread wording before 08:20 is drafted here. Where the Service file's SV-02 or the Customer portal's SU05 and SU06 differ, they win.
- A-DR-3: drafting a customer reply in SV-02 waits for ADR-0059's E-S2 stage and is drawn as the target.
- A-DR-4: Ravi adds a greeting and sign-off and keeps Carl's sentence.
- A-DR-5: the seven steps and stop rule of SYN-KA-000014 r03 are placeholders, shared word for word with KN03 and PH21.
- A-DR-6: SYN-KA-000018 is drawn as Applies 5 of 5.
- A-DR-7: the SV-08 field names and entries are drafted here; the case number comes on save.
- A-DR-8: DR07 reuses Noah Patel's Wed 4 Nov 15:30 email, as EV08 does.
- A-DR-9: DR08 is drawn from SYN-DSP-000061, with Sam Okafor as recipient and Jess Wong as approver.
- A-DR-10: Morgan Lee's initials (ML) are added locally.
- DEP-DR-1: the push panel becomes the drawer tab.
- DEP-DR-2: reply drafting moves from the Emails page (EC-01) to SV-02's Reply to customer (D8, S-13).
- DEP-DR-3: domain help moves from the Equipment record to the work order's drawer (D15).

**Voice capture · AI-05.**
- A-VC-1: the desktop sheets show the desktop form of the phone flow.
- A-VC-2: on the phone, the scope chip reads Request SYN-TKT-000212, because page memory is per tab.
- A-VC-3: Keep as a note, if ticked, opens SV-02's own Add internal note. In the story it stays unticked.
- A-VC-4: 14:00 reads back as a time only, and V3 is checked through its own dialog.
- A-VC-5: voice reserves nothing while the provider is Simulated; VC06c and VC06d are what-ifs.
- A-VC-6: the accepted label "Stop and check" is kept, and Cancel and Stop are 56 px.
- A-VC-7: Ravi's phone tabs are as in A-AW-1.
- A-VC-8: PH16 is drawn full length. At 1024 the transcript folds behind "Show and edit".
- A-VC-9: the browser's permission prompt is drawn for context.
- A-VC-10: the SV-02 host is a skeleton.
- A-VC-11: "too quiet" is drawn here.
- DEP-VC-1: the push panel becomes the drawer.
- DEP-VC-2: the icon-only microphone becomes the Microphone part, with its state in words.
- DEP-VC-3: Confirm and Fix become ticks plus Check "V3".

**Recurring checks · AI-07.**
- A-RC-1: checks are due on weekdays at 07:00. Ravi has 8 runs this month (Mon 2 Nov 07:41 and 15:24, Tue 3 Nov 16:31, Wed 4 Nov 07:48, Thu 5 Nov 07:52), and Taylor has 4.
- A-RC-2: "2 working days" excludes public holidays; Melbourne Cup Day is not counted.
- A-RC-3: Job packs looks 1 working day ahead.
- A-RC-4: the fourth template, "Requests with no service owner", is proposed, and its setting is assumed.
- A-RC-5: a run belongs to one check.
- A-RC-6: Taylor's three other backup gaps follow from "Out of date 4"; no backup references are invented.
- A-RC-7: "Already in your My Work" matches the record and the reason, and clears at 09:33 and 09:50.
- A-RC-8: Plan follow-up uses the proposal-field tags, with Due reading "Needs input".
- A-RC-9: Jordan Kim approves from My Work, with the assistant hidden.
- A-RC-10: RC08 is a what-if.
- A-RC-11: the views are captioned "Proposed views".
- A-RC-12: runs use the record header's Closed variant.
- A-RC-13: run timings are synthetic.
- DEP-RC-1: the check list moves from My Work to the Assistant workspace under More (AI-07 D1).
- DEP-RC-2: Run now becomes "Run now…", disabled with "Runs when you open PPO; no scheduler yet" (D4, D10).
- DEP-RC-3: the phone suggestions move to the Suggestions view, with Open in My Work (D12).

**Knowledge · DK-04.**
- Change made on the page: KN03 and PH21 use DR04's seven steps word for word. SYN-KA-000021 r02 reads Applies: Unknown (it records no firmware range), so KN11 shows exactly two applying articles.
- A-KN-1: the technician tab bar reads My Work · Jobs · Calendar · Conversations · More.
- A-KN-2: the context strip holds five values. Firmware 2.4.2 comes from SYN-AST-000214 and is assumed.
- A-KN-3: SYN-DOC-000112 resolves when the article is read.
- A-KN-4: SYN-KA-000019 r01 does not apply (configuration r1).
- A-KN-5: SYN-KA-000018 came from SYN-LRN-000025 on SYN-TKT-000209.
- A-KN-6: dates not given in section 9 are filled in: r03 published Tue 20 Oct; audience refused Fri 30 Oct; SYN-KA-000021 r02 published Mon 26 Oct; SYN-KA-000009 on a 12-month interval; SYN-TKT-000215 is the LS-200 request.
- A-KN-7: the primary reads "Check now" when the phone already holds the revision.
- A-KN-8: KN09, KN10 and KN13 show Casey's phone acts in desktop form.
- A-KN-9: each sheet uses the strip or the docked menu, as noted on it.
- A-KN-10: suspected-fix commands are hidden for viewers.
- A-KN-11: r04 is a Draft while SYN-LRN-000033 is still New.
- DEP-KN-1: DK-04 D1 (the Service rail and a phone tab slot) against shell Q22 (under More for everyone).

**Knowledge authoring · DK-05.**
- A-KA-1: "Hand to another owner" and "Decline with a reason" are drawn as "Dismiss it"; the four outcome names come from the r01 triage capture.
- A-KA-2: there are five applicability fields, and three read "Any · not dependent" with reasons.
- A-KA-3: SYN-KA-000020 is on 12 months because it carries a safety note, against DK-05 Q3's 24 months for lessons.
- A-KA-4: safety, step and learning texts are labelled placeholders.
- A-KA-5: the returned primary reads "Resubmit for review…".
- A-KA-6: triage owners are Alex Lee for Screen drives and Sam Jordan for Pumps ◇; Climate control is unassigned.
- A-KA-7: r04 exists before SYN-LRN-000033 is triaged.
- A-KA-8: the customer-publishable refusal is dated Mon 19 Oct ◇.
- A-KA-9: no checkbox column.
- A-KA-10: view counts appear only in 09:00 frames.
- A-KA-11: Jordan Kim withdraws service articles ◇.
- A-KA-12: on PH25 a sticky bar replaces the header bar (D12).
- A-KA-13: supersede is drawn as publishing the successor.
- A-KA-14: the technician tab bar is relabelled.
- A-KA-15: Drew Collins is the workshop lead ◇.
- A-KA-16: the KA-ST2 source hold is a what-if.
- DEP-KA-1: the Service rail becomes More › Knowledge › Authoring & review.
- DEP-KA-2: the 560 and 640 px side panels become dialogs.
- DEP-KA-3: Accept, Return and Decline become Validate and Return with findings.
- DEP-KA-4: the r01 shell becomes the C5 top bar and the A1 header.

**Help Centre and page guides · DK-07.**
- A-HG-1: HG01 shows `guide.sv.03` as the carried-over case. In `guides.json` it is Draft without "shown before review"; HG-S2 shows both readings.
- A-HG-2: the route's own Draft guide gives way to `guide.sv.03`, as the brief says.
- A-HG-3: the 13 sections come from `guide.sv.03`; `page-guide-template.md` has 12 headings.
- A-HG-4: guide wording on the sheets is layout text.
- A-HG-5: Dean adds the Dispatch held row at 09:22 ◇, and the content hash is synthetic.
- A-HG-6: owners outside Service and Sales read "Dean Fiedler (interim)".
- A-HG-7: HG03 and PH29 are what-ifs: at bdcdd347 no registered page lacks a guide, and the three entries without one are systems.
- A-HG-8: the Deals guide is drawn as A3.12 reads it.
- A-HG-9: Jesse Moore's tab bar is the Service staff bar.
- A-HG-10: What's new shows counts only.
- A-HG-11: SYN-DOC-000112's revision and owner are not stated anywhere.
- A-HG-12: the 16 workspace groupings are proposed.
- A-HG-13: coverage counts the 4 systems.
- A-HG-14: the Superseded guide chip is grey, because the kit has none.
- A-HG-15: HG09 sits under Knowledge › Page guide coverage.
- A-HG-16: Open Help Centre stays the shell's icon button.
- DEP-HG-1: DK-07 D2's 600 px help panel becomes the Page guide tab.
- DEP-HG-2: DK-07 D15's placement.
- Decision open: the fallback wording and the carried-over exception.

**Interaction states · AI · DK.**
- A-ST-1: run result tones are Completed with suggestions Neutral; Partial and Paused by budget Warning; Failed Danger; Not run Grey.
- A-ST-2: buttons have hover, disabled-with-reason and the 2 px focus ring.
- A-ST-3: the drawer does not trap focus; Ctrl J and Escape return focus to the opener.
- A-ST-4: registers never sort by header, and Alt ← → resizes columns in 16 px steps.
- A-ST-5: empty-state people and searches are illustrative.
- A-ST-6: the version conflict is a what-if at 09:12.
- A-ST-7: Thinking, Stopped, turn limit and panel closed are what-ifs in AI-01's accepted wording.
- A-ST-8: 200 % zoom is drawn once, and the 720 px top bar is proposed.
- A-ST-9: the offline states are what-ifs.
- A-ST-10: the permission changes are what-ifs.
- A-ST-11: "source changed" uses Ravi's 09:10 reply.
- DEP-ST-1: AI-05 D15's keyboard text becomes focus markers.
- DEP-ST-2: AI-03's focus-holding evidence drawer moves inside the Assistant tab.
- DEP-ST-3: DK-07 D2's help panel becomes the Page guide tab.

**Administration · AI · DK.**
- A-AD-1: the hub sits in Settings beside Assistant settings, and is also reached from the Assistant workspace's SETTINGS group. No link is added to the accepted menus.
- A-AD-2: no route is invented.
- A-AD-3: there are six product families (Sensors ◇); Climate control has no author; Site safety SOPs live in the Document library.
- A-AD-4: per-family review interval overrides are proposed. X1, S1 and X2 are an example and a what-if.
- A-AD-5: the 13 guide sections follow `guide-library.json` and HG.
- A-AD-6: the three first templates come from 9.5 and A3.12.
- A-AD-7: "Hand to another owner" and "Decline" read as "Dismiss it with a reason".
- A-AD-8: Alex Morgan publishes.
- A-AD-9: other guide owners read "Not yet nominated".
- A-AD-10: the nudges are 30 days, 7 days and 2 working days, with a stale flag at once.
- A-AD-11: the phone reads only, and the tablet uses two-column cards.
- DEP-AD-1: where Assistant settings is reached from.
- DEP-AD-2: where the AI-07 template library lives.

## 6. Verification

Run on 13 November 2026 over the 11 scope pages (304 sheets and 11 Flows and notes cards), after the fixes listed in section 9.1. Each builder rendered and inspected its sheets and fixed what the renders showed. The audit then re-rendered sample sheets, the Read me cards and every repaired sheet.

- **Structural pass.** Every direct child sits inside its sheet; the 14 AW panel sheets no longer count their stroke in layout. No register cell text runs past one line. Roboto is the only font family on every page. Every sheet has a label with its code and its signed-in person; HG-S1 and DP say no one is signed in. No sheet code is duplicated within its size.
- **Position audit.** Every sheet and label sits inside its section. No sections, sheets, labels or Read me cards overlap on any page. Nothing is loose, labels are truncated to the sheet width, and the separator pages "— Accepted —" and "— Proposals —" are empty. No collapsed strip remains at 80 px.
- **Authority scan.** 330 distinct button and menu labels were read from every sheet, and none is on the forbidden list. Approve, Publish, Accept change and Mark reviewed appear only for the named manager, publisher, reviewer or documentation owner. Run now… is disabled with its reason. Create activity, Save case and Send are the owning page's command, run once by the person. The assistant is hidden, not disabled, for everyone outside the pilot; DR08 shows it under "Later pilot role · project managers have no assistant yet".
- **Evidence scan.** Every sheet with a Carl answer carries "Simulated answer · no AI used"; the Live frames are labelled what-ifs. No left-out line names a record. Citation chips name the record, its revision or version, and the read time. Drafts carry "Drafted by Carl · review before sending". The eight guide-profile rule lines appear verbatim on the scope pages' Flows cards and on sheets.
- **Counts and story scans.** Dates read "Thu 5 Nov" with 24-hour times. Stale names and Brisbane times appear only inside "Earlier fixtures" notes. No gendered pronoun remains. Coverage was re-read from both guide sources (A-F-5).
- **Contrast.** 19 pairs were computed from the PPO colour variables, and all pass (table on ST01e). The lowest text pair is accent/knowledge-ink on accent/knowledge-surface at 4.89:1; the lowest non-text pair is line/control on white at 3.32:1.
- **Signed in.** Ravi Kumar 197 sheets, Dean Fiedler 35, Jordan Kim 14, Casey Ward 14, Alex Lee 8, Taylor Quinn 7, Casey Quinn 5, Alex Morgan 5, Jesse Moore 5, Lee Nakamura 4, Sam Jordan 2, Riley Tran 2, Pat Rowe 2, Jamie Park 1, Morgan Lee 1, no one 2.
- **Repository checks:** `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Limits:
- This is a visual proposal, with no prototype links, screen-reader run or comparison with application pages.
- A few sheets were not rendered on their own after their last edit: APS02, APS04, APS05, APS06, APX05, AP08c, HG10b, HG12, HG-S2, HG-S3, HG-S5 and the 390 px PH27. They share their construction with sheets that were, and they pass the scripted scans.

## 7. Not drawn and open questions

**Not drawn.**
- 320 px variants for the DR, KA, ST and AD phones.
- Keyboard-only completion of every flow and 200 % reflow of every page; each is drawn once as a pattern (ST01d, ST02).
- DK-07 journeys (D12) and the print layout (Q11).
- A check's Runs and History tabs, its Actions menu, and delivery by email or push.
- The By owner and By product family authoring views, KA06's Return with findings variant, and "Publication not confirmed".
- Knowledge's per-type browse lists, "Did this help?" with a comment, and the print preview.
- Proposal review's Preparing state, Focus review F3, and phone Saving and Expired.
- A 1280 px desktop frame.
- A shell sheet for the 720 px compact top bar.
- AI-06 Assistant settings and AD-10 Onboarding and support, which the Settings file draws.
- Conversations threads beyond Keep as a thread, which the My Work file draws.
- The customer portal's CP-05.
- The Document library DK-01 and DK-02.

**Open questions** (the drawn default in brackets):

| ID | Question |
|---|---|
| Q-AW-1 | Keep the desktop Assistant Overview, or `/assistant` on phones only? (Overview as a proposal) |
| Q-AW-2 | Is a kept thread visible to the deal's readers or to participants only? (deal's readers) |
| Q-AW-3 | At 1024, the overlay drawer or a full-width surface? (overlay with Expand to reading view) |
| Q-AW-4 | Versions for Dean's cited records? (reference and read time until the Sales file states them) |
| Q-EV-1 | EV06 read time: 08:15 (inventory) or 08:50 (9.1)? (08:50) |
| Q-EV-2 | Who assigns Supported and Partly supported? |
| Q-EV-3 | Does a report's response record carry its own version or read as part of the report revision? |
| Q-EV-4 | The AD-03 finding form and the owner of an equipment-versus-report difference (Settings file) |
| Q-AP-1 | Are service requests the next proposal record type (AI-02 Q1, N-K6)? |
| Q-AP-2 | Should the duplicate check also show inline when a proposal is prepared? |
| Q-AP-3 | Who holds Proposal review, with no `assistant.*` capability (AI-01 Q4, D-020)? |
| Q-AP-4 | AIA-08 to AIA-15 and AIA-19 are Not run; AIA-12 and AIA-14 gate Opportunity creation |
| Q-DR-1 | The Assistant menu lists "Drafting & domain help" though AI-04 Q6 says `/assistant/drafts` is not a page (no page drawn) |
| Q-DR-2 | Is a reply posted to the portal bound by ADR-0059 E-S2? (yes) |
| Q-DR-3 | DR08 depends on D-027 and AI-06's pilot roles |
| Q-DR-4 | The 09:10 reply was checked against 9.3 and A3.12, not against the SU06 frame |
| Q-VC-1 | The speech-to-text service has no ADR ("To be decided") |
| Q-VC-2 | The driving policy (threads Q11) |
| Q-VC-3 | Keep as a note through SV-02's command, or a note kind of its own? |
| Q-VC-4 | A spoken request to an AI-02 draft (AI-05 D9) against "Create isn't done by voice": which wins? |
| Q-RC-1 | Does a due check run on a public holiday when its owner opens PPO? (yes) |
| Q-RC-2 | The fourth template needs review by the assistant's owner and Dean's acceptance |
| Q-RC-3 | The scheduler (N-K7) and the reply-by reminders proposal |
| Q-RC-4 | Who reviews and publishes check templates? ("the assistant owner") |
| Q-RC-5 | The proposed "Own recurring checks" † and "Approve team checks" †, and Jordan Kim's route to the approval |
| Q-KN-1 | May a published revision's safety note resolve SYN-DOC-000112 when read, or must a successor cite it? |
| Q-KN-2 | May r04 start before SYN-LRN-000033 is triaged? |
| Q-KN-3 | A suspected fix can be saved offline; confirm it never enters a job pack |
| Q-KN-4 | "May be out of date" after 7 days without a check, rather than whenever offline (accepted Q5)? |
| Q-KN-5 | The technician tab bar, with the My Work file |
| Q-KA-1 | The CP-05 and DK-05 story mismatch (SYN-KA-000016 against SYN-KA-000021 r02) |
| Q-KA-2 | SYN-KA-000020's review interval: 12 or 24 months? |
| Q-KA-3 | Should "Hand to another owner" become a fifth triage outcome? |
| Q-KA-4 | Adopt N-K9 (knowledge matching inside a finding), and on which page? |
| Q-KA-5 | Who holds the Climate control author duty? |
| Q-KA-6 | Keep D8's "Decline" as a third review outcome? |
| Q-HG-1 | Coverage reading: resolved (A-F-5) |
| Q-HG-2 | The Deals guide: A3.12 reads Draft, `crm-deals.md` is In review and not shown before review, `guides.json` has none |
| Q-HG-3 | Should a record page show its scope guide or its exact route's guide? |
| Q-HG-4 | The guide review capability † and the feedback store |
| Q-HG-5 | Journeys (D12) are not redrawn |
| Q-ST-1 | Should the Assistant tab hold focus like AI-03's evidence dialog? (no) |
| Q-ST-2 | Alt ← → for column resize is not in the shell rules |
| Q-ST-3 | The run result tones against the Library's chip register |
| Q-ST-4, Q-AD-4 | The guidance contract's fallback wording and carried-over exception (Dean's open decision; brief Q7) |
| Q-ST-5 | No shell sheet for the 720 px top bar |
| Q-AD-1 | The hub as a Settings configuration area (drawn) or a SETTINGS entry in the Assistant and Knowledge menus? |
| Q-AD-2 | Alex Morgan and Taylor Quinn as reviewers of knowledge rules and nudge day counts? |
| Q-AD-3 | Per-family review interval overrides, or DK-05 Q3's intervals by type only? |
| Q-AD-5 | The fourth check template (Q-RC-2) and the Climate control author (Q-KA-5) |
| Q-AD-6 | Align `PPO-HELP-TPL` to the 13 sections, or keep both readings? |

**Cited and not resolved:**
- the live provider switch and its five pre-call checks;
- the model pin (ADR-0062 against AI-06);
- D-027;
- the speech-to-text service;
- the driving policy;
- the reply-by reminders proposal;
- a scheduler for checks (N-K7);
- Carl's agreement to the name (C2) and the About Carl card;
- the guidance contract's fallback wording and carried-over exception;
- the CP-05 and DK-05 mismatch;
- the proposed capabilities †;
- the assistant acceptance cases AIA-01 to AIA-20, all Not run.

## 8. Boundary and next steps

This record is design only. It authorises no application code, route, migration, permission or capability, provider connection, model, speech-to-text service, scheduler, external knowledge source or integration, and no business transaction or customer communication.

The design register and page guidance for `/assistant`, `/assistant/proposals`, `/assistant/evidence`, `/assistant/automations`, `/knowledge`, `/knowledge/review` and `/help` follow in their own reviewed change, with exact sheet references. Where A3.12 corrected them, the My Work, Settings, Service and Customer portal files align their rows: Carl's answer and the kept thread; the provider state, budget, flagged answer and help request; the 09:17 internal note and the SV-08 case; and the customer articles. A3.12's coverage row is corrected to the two-source reading (A-F-5).

On acceptance, Dean (or the agent on Dean's word) drags the scope pages above "— Accepted —", which keeps every node ID, and Dean saves a named version (suggested title "Assistant, Knowledge and Help refined — accepted"). A named version is Dean's to save, and any later design change needs a new one.

## 9. Audit — 13 November 2026

Run after the build by brief sections 11.5 and 11.6, and shown on the Read me audit card. Items are for Dean's decision unless marked as corrected.

### 9.1 Corrections made in the file (C)

- **C1:** collapsed docked strip returned to the accepted 12 px (76 sheets; A-F-4).
- **C2:** tablet rail More item clipped at 768 px (11 sheets; A-F-9).
- **C3:** guide coverage figures re-read from both sources (HG08, TB10, HG09, HG03, PH29 and the card; A-F-5).
- **C4:** the shared Deals register rows corrected to A3.8.
- **C5:** the Assistant was visible to Alex Morgan on AD02-X2; now hidden.
- **C6:** a read-back time "2:00 pm" corrected to 14:00 (six sheets and the VC card).
- **C7:** three gendered pronouns replaced.
- **C8:** 14 AW panel drawers sat 1 px outside their sheets.
- **C9:** two labels lacked the signed-in person.
- **C10:** four duplicate 320 px sheet names; codes normalised to TB-DR02, TB-KN01, TB-KN03 and PH19a.

### 9.2 Coverage matrix

All 30 scenarios of the brief's section 4.3 are drawn on their primary sheets:

| Scenario | Sheets | Scenario | Sheets |
|---|---|---|---|
| S-01 | AW01 | S-16 | VC01 to VC04b, PH14 to PH17c |
| S-02 | AW02, EV01 | S-17 | VC05a to VC05c |
| S-03 | EV02, EV03, EV05 | S-18 | RC01, RC06 |
| S-04 | EV08 | S-19 | RC03, RC09 |
| S-05 | AW06 | S-20 | RC07, RC10 |
| S-06 | AP01, AP02, AP05 | S-21 | KN01, KN10, PH20 |
| S-07 | AP03, AP05 | S-22 | KN03, KN09 |
| S-08 | AP06a, AP06b, AP07a, AP07b, AP09 | S-23 | KN06, KN07 |
| S-09 | AP10 | S-24 | KN04, KN08 |
| S-10 | AW04 | S-25 | KA02 to KA07, KA09 |
| S-11 | AW05, AW10 | S-26 | KA01, KA12 |
| S-12 | AW07, AW07b | S-27 | KA02, KA03 |
| S-13 | DR01 to DR03 | S-28 | HG01 to HG03, HG06, HG07 |
| S-14 | DR04, DR05 | S-29 | HG04, HG09 |
| S-15 | DR06, DX03 | S-30 | HG08, HG11, HG12 |

Module touchpoints:
- **My Work:** Keep as a thread (AW07, AW07b); Already in your My Work (RC06, RC17); review items (KA01); check approval (RC09, PH19a).
- **Settings:** provider and budget (AW09, PH10, PH11, AD07); flagged answer (AW-D04); help request SYN-HLP-000014 (HG09); Data quality (EV10).
- **Service:** SV-02 drafting (DR01 to DR03); SV-08 case (DR06, DX03); voice note (PH17b, PH17c).
- **Reporting:** no scheduler (RC14, PS19).
- **Customer portal:** customer audience (KA08, KA-ST4); the reply as read in SU06 (DR03).
- **Customers, sites and equipment:** Applies from SYN-AST-000214 (KN01, KN11).
- **Engineering:** SYN-ECR-000014 (KA01).
- **Sales:** the Deals register (AW10); Create opportunity Off (AP10).

The capability check against section 4.2 passes for every persona row.

Candidates:
- N-K1 to N-K4 are integrated: citations built by PPO (AW02, EV01), the deterministic duplicate check (AP03), Applies from five fields (KN01, KN06), and Already in your My Work (RC06, RC17).
- The proposals are drawn: N-K5 as AW09's provider states, N-K6 and N-K8 on Flows cards, N-K7 (RC01, RC14), N-K9 (KA02), N-K10 (HG03), N-K11 (HG11, AD06) and N-K12 (KN10, PH22).

### 9.3 Critique

The one-glance test asks whether a person can tell at once what the assistant was asked, what it used, what it left out, that the provider is simulated, and that nothing is saved, sent or decided until a named person chooses.

- **AI-01:** passes. The AW03 conflict card is the strongest element. Answers with four or more statements become dense in the 432 px tab.
- **AI-03:** support and currency are in words; the full view is the clearest sheet. The four missing-evidence reasons look alike.
- **AI-02:** field provenance and the locked command make the person's act explicit. Several what-if states differ by one line.
- **AI-04:** the draft label and gap row make authorship and the missing fact obvious. The tick-to-draft affordance depends on the SV-02 skeleton.
- **AI-05:** the read-back with ticks is the strongest safety pattern. Cancel and Stop sit side by side on the phone.
- **AI-07:** "Scheduling not yet available" and the disabled Run now… are honest. A run and a check differ mainly by the Closed header.
- **DK-04:** status facts in words and the SAFETY band read well on the phone. The suspected fix needs a stronger divider on KN01.
- **DK-05:** independence is visible in the refusals. The safety confirmation dialog is tall.
- **DK-07:** status and reviewed date are always shown. The 16 Help Centre groups are long, and the carried-over case waits on Dean.
- **Interaction states:** contrast, keyboard order and the register standard are drawn. ST01a and ST01b are dense.
- **Administration:** every editor shows who reviews; nothing applies silently. The hub's location is open.

### 9.4 Refinements (R)

- **R1:** fix the accepted rail's scroll area in the Shell file (A-F-9).
- **R2:** a phone record header variant without the 120 px body placeholder and bar.
- **R3:** account initials as a property of the 1024 top bar.
- **R4:** a Superseded guide chip and Morgan Lee's initials in the kit.
- **R5:** run result tones against the Library chip register.
- **R6:** long answers fold their citations to "n sources · Open evidence" after three chips.
- **R7:** separate Cancel and Stop on the phone recorder.
- **R8:** one tablet code scheme; the brief mixes TB01 to TB10 with TB-AW02.

### 9.5 Gaps (G)

The items in section 7's "Not drawn" list (G1 to G9 on the audit card).

### 9.6 New features (N)

N-K5 to N-K12 as proposals; the desktop Assistant Overview (AW08); the Administration hub (AD01); per-family review interval overrides (AD02); the fourth check template; the "Already in your My Work" matching rule; offline copies marked "may be out of date" after 7 days.

### 9.7 Polish (P)

- **P1:** AW10 sits after AW12 in AW's reading order.
- **P2:** the overlay drawer truncates host reason lines at 1440.
- **P3:** "Proposed views" captions used consistently.
- **P4:** phone tab bars differ by role; confirm them with the My Work file.

### 9.8 Recommended order

1. Read the Read me cards and accept or redirect A-F-1 to A-F-14.
2. Decide the authority questions: pilot roles (brief Q4), Q-VC-4, Q-RC-1, Q-RC-4, Q-KA-3, Q-KA-6, Q-HG-3, the guidance fallback and carried-over case, and Q-AD-1.
3. Settle the data-shape questions that touch many sheets (Q-EV-3, Q-AW-4, Q-KA-1, Q-KN-1, Q-HG-2), then run one story pass.
4. Make Shell refinements R1 to R3 in the Shell file, and swap the local copies to PPO - Library when it is published.
5. Draw a second batch for the gaps and refinements R4 to R8.
6. Accept, move the pages above "— Accepted —" and save a named version.
