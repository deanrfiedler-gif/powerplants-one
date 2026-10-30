---
document_id: PPO-AI01-ASSISTANT-FIGMA-DEC
date: 2026-10-24
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 0691b661bf00ee8ce1c71d247ecf472ff93142ec
versioning: git
---

# Assistant AI-01 design — owner decision

On 24 October 2026 Dean asked for the design of the assistant's page: "Your task is to design and build the "Assistant workspace and docked/mobile conversation (AI-01)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma covering:
- the Ask Carl action in the top bar and the docked 400 px side panel on desktop at 1280 px and wider, drawn at 1440;
- the full-width surface below 1280 px, drawn at 1024;
- the full-screen phone view at the proposed route `/assistant`, at 390 and 320;
- the AI1 pilot tasks of the [assistant specification](../blueprints/ppo-assistant-specification.md) §3: customer search, opportunity search, the Customer CRM summary, and the entry to reviewed opportunity creation with its hand-off to the review (AI-02);
- scope changes, Keep as a thread, provider and budget states, and fifteen panel states.

Claude drew the page from these sources:
- the AI-01 design register page [scope-ai-01](../design/development/pages/scope-ai-01.md);
- the [assistant direction](ppo-assistant-direction.md) (PPO-AI-DEC r03): Amendment A1 (the direct Claude API as the first live synthetic provider, a US$30 monthly ceiling enforced in PPO, failing closed) and Amendment A2 (side-panel chat stays in page memory until a person chooses "Keep as a thread");
- the [assistant specification](../blueprints/ppo-assistant-specification.md) §1–§11, especially §3 (pilot scope), §4 (surfaces), §6 (retrieval and coverage), §7 (persistence) and §8 (budget);
- the [AI and internal communications threads decision](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP), its rules R2, R3, R7, R9 and C3–C7, and its answers Q2 and Q3;
- [Conversations T2 scope](conversations-t2-scope.md) (rules T2-6 to T2-8; answers W1, W2 and W7) and the accepted Carl message, avatar and record link components;
- the [shell top bar amendment](shell-top-bar-amendment.md) (R9) and the [phone header amendment](phone-header-amendment.md) (P3 note, P7, P8);
- the T2 assistant core on `main` (`src/assistant/`: the evidence envelope with its returned, limit and "more" coverage, the budget reservations and the adapters);
- copies of the Hillview Growers record on Organisations CS-01 and of the Deal record CR-01.

Before deciding, Dean asked for an audit: "Give all the pages an audit and polish to ensure the are correct, there are not gaps, and they are as professional as possible.  I will then accept." He then accepted the design: "I accept the Assistant AI-01 design as drawn, with D1–D18 and the recommended answers to Q1–Q7. Proceed with the lock-in." That adopts D1–D18 and the recommended answers to Q1–Q7. On 25 October 2026 Dean saved the named version "Assistant — accepted" himself and confirmed it: "I have saved it." (section 8).

Scope:
- `scope:AI-01` "Assistant workspace and docked/mobile conversation", with the proposed route `/assistant`. No new scope is added. AI-02 (proposal review) and AI-03 (evidence inspection) are reached from this page and are designed on their own pages.
- No parent requirement ID is added or renamed; all 78 remain. The pilot elaborates CRM-01, CRM-02, CRM-06, NFR-01, NFR-02, NFR-03, NFR-05, NFR-08, NFR-11 and NFR-12, as the specification's acceptance table does.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, provider request, paid use or deployment, and it changes no hosted authority. Every record, answer, time and budget figure shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the assistant page AI-01 | User decision, 24 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 24 October 2026 | Quoted above. Section 7 |
| Decisions D1–D18 | Accepted as drawn, 24 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Where the assistant action sits | Resolved as recommended | Immediately left of the Conversations action, so Conversations keeps its accepted place by the information icon. For builders, who also see Design and build, the right zone needs 48 px more; at 1440 with the labelled rail the centred search then narrows to about 310 px under R9's narrow-bar rule |
| Q2 Memory across pages | Resolved as recommended | The conversation stays in page memory for the tab: it survives moving between pages and is never retargeted by a page change. Reload, tab close, sign-out and identity change clear it. Nothing goes to browser storage |
| Q3 Keep as a thread | Resolved as recommended | Offered only on request, from the panel's More menu, once the conversation has an answer; never on each answer |
| Q4 Who may use the assistant in the pilot | Resolved as recommended | Holders of a new assistant capability, granted only to local synthetic profiles that already read organisations and deals. The action is hidden for everyone else. Hosted testers get none until the hosted credential decision (W7). The capability brings the access-review chain in `AGENTS.md` when it is built |
| Q5 The phone route | Resolved as recommended; amends PPO-AI-THREADS-PROP Q2 | `/assistant` stays as the phone form of the side panel (quick help on a record, page memory); stored threads stay in `/conversations`. Section 5 |
| Q6 Keep as a thread on an organisation | Resolved as recommended; keeps PPO-AI-THREADS-PROP Q3 | Threads belong to deals and projects first. On an organisation the sheet lists that customer's deals the person can open, and organisation threads wait for their own decision |
| Q7 The rail while the panel is open | Resolved as recommended | At 1440 the rail collapses to icons while the panel is open, so a record keeps about 964 px, its tablet width; closing the panel restores it |
| Accept the design | User decision, 24 October 2026 | Quoted above |
| Named Figma version | Saved by Dean, 25 October 2026 | "Assistant — accepted": "I have saved it." Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Assistant · AI-01" `2367:85`, under "— My Work —", after Conversations and before My account and preferences. The page header `2367:86` holds the conformance declaration; the notes card `2380:9379` in Flows and notes holds D1–D18, Q1–Q7, the flows, what is not drawn and the audit. File index: the row "Row / Assistant · AI-01" `2388:6067` in the My Work group, after Conversations |
| Desktop 1440 | Hillview Growers record, panel closed, with the Ask Carl tooltip `2369:814129`; panel open at the start `2369:814476`; opportunity search with its interpretation `2370:820498`; Customer CRM summary with the evidence popover, full length (1440 × 1640) `2370:821082`; the draft opportunity card `2371:1628`; the AI-02 hand-off `2371:2224`; the scope-change prompt on Deal SYN-PPO-OPP-000326 `2371:822871`; Keep as a thread `2374:2964`; budget reached `2375:3322`; provider unavailable `2375:3899` |
| Tablet 1024 | Full-width surface with the Customer CRM summary `2378:4080`; customer search from Search PPO with the simulated adapter `2378:4449` |
| Phone 390 | Record with More open at Ask Carl `2379:861166`; `/assistant` start `2379:4401`; summary `2379:4458`; keyboard open `2379:4658`; budget reached `2379:861397`; the record Back returns to `2379:861292` |
| Phone 320 | Start `2385:5574`; summary `2379:861543`; keyboard open `2379:861677`; the record Back returns to `2385:5715` |
| States | Fifteen panel-width cards in section "States": thinking `2379:886482`; stopped `2379:886534`; partial `2379:886583`; read failed `2379:886644`; zero results `2379:886693`; source changed `2379:886740`; access changed `2379:886801`; cancelled when the panel closed `2379:901249`; turn limit `2379:901300`; provider states `2379:901355`; kept as a thread `2379:901444`; couldn't keep as a thread `2386:5660`; More menu `2379:901492`; scope menu `2379:901550`; switching with a draft `2386:5710` |
| Components | Moved at acceptance to the Components page, section "Components · Assistant" `2388:6065`, keeping their node IDs and instances: Shell / Top bar action · Assistant `2367:809432`; Assistant / Panel header `2367:809489`; Scope chip `2367:809503`; Source chip `2367:809517`; Prompt `2367:809518`; Composer `2367:809562`; Answer header `2368:812066`; Result row `2368:812074`; Summary block · Customer CRM summary `2368:812083` |
| Prototype | Flows "AI-01 — desktop" (from the record with the panel closed) and "AI-01 — phone" (from the phone record): Ask Carl to the panel; the suggestions to the summary, the search, the draft and the provider-unavailable state; Send between answers; Review draft to the hand-off and back; More to Keep as a thread; the rail's Deals to the scope change; the wider search to budget reached; Close to the record. On phone: the record's More to Ask Carl, the start, the summary, the keyboard and budget reached, with Back to the record |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 Brisbane time, signed in as Jamie Park, account manager and relationship owner of Hillview Growers SYN-PPO-ORG-000007 (version 5, changed Wed 7 Oct). Deals as on Organisations CS-01: SYN-PPO-OPP-000118 Glasshouse 4 shade screen upgrade (Proposal, expected close Fri 30 Oct), SYN-PPO-OPP-000131 Propagation house irrigation review (Qualification) and SYN-PPO-OPP-000097 Glasshouse 4 climate sensors (won Tue 4 Aug). Activities: Sam Patel's call to the grower about Thursday, due today at 15:00, and Jamie's quarterly account review on Tue 27 Oct. One new story fact: SYN-PPO-OPP-000131's next action is Needed; no other drawn page shows its next activity. The scope-change frame is 15:50 the same day on Sasha Clarke's Deal SYN-PPO-OPP-000326, shown read-only to Jamie as CR-01 state S5 does. Existing references are unchanged |
| Retained captures | [Assistant design r01](../reference/ui/my-work/assistant-design-r01/README.md): fifteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-01` Assistant workspace and docked/mobile conversation: a shell side panel on every desktop page and `/assistant` on phones. The AI1 pilot of PPO-AI-SPEC §3. No new scope; parent requirement IDs unchanged. A capability is proposed (Q4), not created |
| Page type (r20) | Work queue + persistent detail (variant): a docked conversation panel beside the current page at 1280 px and wider, a full-width surface below 1280 px and a full-screen phone view. Supporting: Review / comparison for source evidence (AI-03) and the draft review (AI-02), both on their own pages |
| Reused components | Shell v2 (Rail · Sales with More selected on the organisation and Deals on the deal page, collapsed to icons while the panel is open), the top bar with the proposed Conversations action, Shell / Phone header · compact, Record / Header, Record / Readiness bar, Record / View tab, Record / Filter chip, Button, Tag, Conversations / Message (Author=Carl), Conversations / Avatar (Kind=Carl), the icon set, and copies of the Organisations CS-01 and Deal record CR-01 pages. New: the nine components listed in section 2 |
| Incoming handovers | The top-bar action on any desktop page, with the page's record as the scope or Search PPO where the page has none; on phones, a record's More › Ask Carl. Answers use only permitted, projected PPO reads made as the person signed in |
| Outgoing handovers | Open to the record's own page; a source chip to evidence inspection (AI-03); "Create an opportunity…" to the draft review (AI-02) inside the panel, where only a person confirms; Keep as a thread to a stored thread in Conversations (A2); suggested actions open ordinary pages and never run by themselves |
| Source authority | The decisions and specification listed above. Carl's answers are evidence, never authority |
| Proposed departures | Five, accepted: section 4 |
| Status | Owner-accepted design, 24 October 2026 |
| Decision record | This file |
| Named version | "Assistant — accepted", saved by Dean on 25 October 2026 |

## 4. What the design shows

### Entry and the panel (D1–D5, D16)

- **Ask Carl (D1, Q1):** a sparkles action labelled "Ask Carl, AI assistant", immediately left of the Conversations action, selected while the panel is open and hidden for people without the assistant capability. Jamie is not a builder, so Design and build is not shown and the right zone keeps its width.
- **The panel (D2, Q7):** 400 px, docked under the top bar on the right, pushing the page rather than covering it. At 1440 the rail collapses to icons while it is open, so a record keeps about 964 px; record view tabs that no longer fit move into a More tab, and on the deal page the stages share the width and History filters move into More.
- **Header and scope (D3):** Carl's avatar, "Carl · AI assistant" (C3; "PPO Assistant" if C2 fails, C7), the provider state in words, More and Close. Under it, "About" and the scope chip: the record with its reference, which never truncates, or Search PPO. The chip opens the scope menu.
- **Start (D4):** the four AI1 tasks as suggestions; what Carl does (answers from records the person can open, shows where each fact comes from, prepares an opportunity for review) and never does (save or confirm a change); what it can't do yet (equipment troubleshooting, email, ERP, projects); and a note that the conversation lives only in the tab.
- **Layout (D5):** questions, answers and source cards scroll together; the composer stays at the bottom. Answers use the full panel width, with Carl's name row on top.
- **Page memory (D16, Q2):** the conversation survives moving between pages and clears on reload, tab close, sign-out or identity change.

### Asking (D6–D8)

- **Opportunity search (D6):** "Show my opportunities needing a next action" shows the filters as chips (Owner: you, Organisation: Hillview Growers, Next action: Needed), says what Needed means and that Date needed and Unavailable are different states, lists SYN-PPO-OPP-000131 with Open, and states "1 deal · complete for these filters". Searching all of Jamie's deals is a visible link. Pages hold up to 20 results; when more exist the answer says "First 20 shown · more exist" with Show the next 20, never a total.
- **Customer search:** "Find Hillview" from Search PPO lists Hillview Growers with Open and Use this customer, which sets the scope, and says that organisations in companies the person can't see are not shown or counted.
- **Customer CRM summary (D7):** labelled, with generated and as-at times; a coverage box (the 10 most recent opportunities and 20 activities the person can open; 3 and 4 returned, no more to load; not covered: quotations, service, projects, sites, email and ERP accounts); recorded facts, unresolved items and recorded next actions, each with source chips; "Suggested by Carl · not done", where each suggestion opens the ordinary page; and the notice to check sources before relying on the summary.
- **Source chips (D8):** each chip names one source by its reference and is built by PPO from the turn's evidence. Selecting it opens a popover with the source's version, read time, fields used and a fresh access check, then Open evidence (AI-03) and Open record. Changed and Can't open are chip states.

### Preparing a change (D9)

"Create an opportunity…" returns a draft card: not saved, Needs details · 3, each field with its provenance (Existing record, Your request, Needs input), and Review draft. The review (AI-02) opens inside the panel with a way back to the conversation. Only the review has Create opportunity, and it stays unavailable until the missing details are given. This page draws the entry and the hand-off only.

### Keep as a thread and scope (D10, D11)

- **Keep as a thread (D10, Q3, Q6):** from More, once there is an answer. A sheet asks which of Hillview Growers' deals to keep it on, lets the title be edited, and states that the thread is visible to its participants: today only Jamie, and anyone added later sees the whole thread, with sources they can't open shown as "A record you can't open". Afterwards the panel starts a new conversation and links to the thread. If keeping fails, nothing is stored and the conversation stays.
- **Scope (D11):** opening another page leaves the conversation where it was and shows "Still about Hillview Growers. Switch to SYN-PPO-OPP-000326 · Potting machine and take-off?" with Switch and Stay. Switching starts a new conversation; with an unsaved draft it asks first, and Keep the draft is the main button.

### Provider, budget and failure states (D12–D14)

- **Provider (D12):** "Live AI · Claude · synthetic data", "Simulated · no AI used" (and every simulated answer tagged "Simulated answer · no AI used"), "Paused · monthly budget reached" and "Unavailable · AI service not responding". Colour is never the only signal.
- **Budget reached (D13):** when the reservation against the US$30 ceiling can't be made, nothing is sent. A strip says "Monthly assistant budget reached: the assistant is paused until 1 November."; the question shows "Not sent" and that nothing was charged; the composer is disabled with its reason; earlier answers stay readable; records, search and Conversations work as usual.
- **Other states (D14):** thinking, announced once ("Carl is answering", "Answer ready"), with Stop; stopped, with nothing unchecked shown; a partial read that says which source failed and that it doesn't mean there are none; a failed read that is not "no results"; zero results; the turn limit; a source that changed after the answer, with Refresh answer; changed access, with the answer discarded; and closing the panel while answering, which cancels the answer and says that text already sent can't be recalled. None retries by itself or switches model.

### Below 1280 px and on phones (D15)

- **1024:** the assistant takes the workspace under the top bar, in a 720 px reading column; Close returns to the page, and the breadcrumb shows the current page alone.
- **Phones:** `/assistant` is full screen with the compact header (Back · "Carl · AI assistant" · More), the provider and scope under it, and the composer above the keyboard with 16 px text and 44 px targets. It opens from the record's More menu ("Ask Carl", after Open menu and Conversations), which is the record's only More; the footer keeps just its main action. Back returns to the same record and scroll position. At 320 the reference moves under the scope chip, aligned with its name, rather than truncating.

### Accessibility and components (D17, D18)

Controls have names ("Ask Carl, AI assistant", "Close assistant"); opening moves focus to the question field, and Close or Esc returns it to the action; status is announced politely once; every state has words. The nine new components moved to the Components page at acceptance.

### Departures, accepted

| ID | Departure | Accepted pattern it changes |
|---|---|---|
| D1 (Q1) | An Ask Carl action beside Conversations in the top bar | The top bar with the proposed Conversations action ([shell top bar amendment](shell-top-bar-amendment.md), Conversations D1 and D7) |
| D2 (Q7) | The rail collapses while the panel is open; record tabs and deal-page filters that no longer fit move into More | Records are drawn with the labelled rail at 1440 |
| D15 (Q5) | `/assistant` kept as the phone form of the panel | PPO-AI-THREADS-PROP Q2: "No. Carl's threads live in `/conversations`; the side panel stays on desktop" |
| D15 | "Ask Carl" added to the phone record's More menu after Open menu and Conversations | The [phone header amendment](phone-header-amendment.md) P3 note lists Open menu and Conversations, then the record's actions |
| D10 (Q6) | Keep as a thread on an organisation picks one of its deals | The brief's "a stored Conversations thread on the record"; PPO-AI-THREADS-PROP Q3 is kept |

## 5. Earlier records this amends

| Record | What changes |
|---|---|
| [AI and internal communications threads](ai-communications-threads-proposal.md) Q2 | Amended by Q5: `/assistant` stays on phones as the page-memory form of the side panel, and Carl's stored threads stay in `/conversations`. A dated pointer is appended to that record |
| [Shell top bar amendment](shell-top-bar-amendment.md) and the Conversations top-bar action | The Ask Carl action joins the proposed Conversations action in the top bar. The shared `Shell / Top bar` component changes only when the assistant is built, as the Conversations action does |
| [Phone header amendment](phone-header-amendment.md) P3 note | The record's More menu adds Ask Carl after Open menu and Conversations, where the person holds the assistant capability |
| [Assistant specification](../blueprints/ppo-assistant-specification.md) §4 | Unchanged. This design adds the rail collapse at 1440 (Q7) and keeps the §4 rule that a narrower window uses a full-width surface |

## 6. Not decided and not drawn

- **Building the page.** No route, panel or capability exists for it. The build order is not decided.
- **Prerequisites for a build:**
  - the assistant capability and its grants (Q4), with the access-review chain;
  - an evidence envelope built from an organisation scope as well as a thread anchor, the AI1 search tools (`search_customers`, `search_opportunities`) and a panel turn that needs no thread;
  - the proposal store and the AI-02 review (specification §7);
  - Keep as a thread, which converts page-memory turns into a stored thread under A2;
  - the shared top-bar and phone-header changes.
- **Not drawn:**
  - the AI-02 review fields and the AI-03 evidence page (their own pages);
  - the About Carl card, which waits for Carl's agreement and his approved words (C2, C6);
  - the microphone (AI2);
  - exactly 1280 px (drawn at 1440 and 1024);
  - a search with more than 20 results, because fewer than 20 synthetic records match any question (the rule is in D6);
  - offline, the stored thread after keeping, and hosted demo use.
- **Data in the frames:** the organisation, deals, activities, people, times, provider labels and budget are synthetic. Carl's answers are design text, not model output, and grant no authority.

## 7. Audit and polish

At Dean's request Claude screenshotted every frame at readable size, checked text overflow, fonts, overlaps and section bounds, and checked the story against the drawn pages.

- **Corrected:**
  - the rail's Leads icon, left in its selected style after the rail swap on eleven frames;
  - the 1024 breadcrumb, which now shows the current page alone so the search keeps one line;
  - on the deal page, the stage bar and History filters that ran past the panel;
  - a duplicated line in the paused composer;
  - a second More button on the phone record;
  - a clipped row on the 320 record;
  - the wording of the summary's first fact, and the 320 reference alignment.
- **Added:** the 320 start and record frames, Find a customer on the phone start, and the "Couldn't keep as a thread" and "Switching scope with a draft" states. State cards keep the composer at the bottom.
- **Left as designed:** scrolling content on the phone records continues under the sticky footer, as on the accepted record pages.

After the polish no text overflows its container (2,383 text layers, all Roboto), no frame or label overlaps another or leaves its section, and no state card is clipped. The audit is recorded on the notes card `2380:9379`.

## 8. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit. The prototype links copied from the Organisations and Deal record pages that pointed off this page (145) were removed, and 36 new links were added.
- The fifteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 460,000. Images 13–15 are frames holding copies of several frames. The prototype reactions on 73 layers were removed and each of the 978 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 2,184 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and the Captures page keeps its 115 flow starting points.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/my-work/assistant-design-r01/README.md).
- Dean saved the named Figma version "Assistant — accepted" in the Figma desktop app on 25 October 2026 and confirmed it: "I have saved it." Claude did not open the version history to check it. The page header, the notes card and the File index row were updated afterwards to record it, so those three text changes post-date the named version.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 9. Amendment, 31 October 2026

Dean's acceptance of [AI-02](assistant-proposal-review-figma-design.md) adopted its Q6: a text-only change to two frames so both pages tell the same story. D5 `2371:1628` now shows Jamie's reason at 09:06 and a draft card reading Needs details · 1, with the title "Glasshouse 5 climate screen extension" and the follow-up "Call Priya Shah on Wed 21 Oct". D6 `2371:2224` reads Needs details · 1, and its hint says "Create opportunity unlocks when the follow-up time is added." The r01 captures keep their bytes; images 14 and 15 in [proposal review design r01](../reference/ui/my-work/assistant-proposal-review-design-r01/README.md) show the amended frames. The page header status and the notes card D9 record the change. The named version "Assistant — accepted" predates it.
