---
document_id: PPO-ES02-CREATE-WORKSPACE-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: b9c21732f5edd413a3da7794e6d3031cdbb82b3d
versioning: git
---

# Create discovery workspace design — owner decision

On 18 October 2026 Dean accepted the [Discovery register design](discovery-register-figma-design.md) with its recommendations, including Q4: draw Create discovery workspace (`/estimating/discovery/new`) next. The built page (`NewDiscovery`, `NewDiscoveryContext` and `ProposalEditor` in `src/components/discovery-screens.tsx`) is one long form: an opportunity select, every discovery field, "Compare discovery proposal", then "Create discovery workspace". When it is opened from a Sales handover (`?sales_handover=`), the select is locked and `CreatingFromSalesBrief` (`src/components/sales-estimating-link.tsx`) shows the brief above the editor.

Claude drew the page from these sources:
- the [ES-02 Estimation Wizard design](es02-wizard-figma-design.md), accepted 12 October 2026, whose Requirements step, Save discovery revision dialog, tablet rail and phone frames it reuses;
- the accepted Discovery register, whose shell and primary action lead here;
- the accepted [Sales briefs](sales-briefs-design.md) page, whose accepted brief the story follows;
- [ADR-0035](ADR-0035-es02-structured-discovery.md) structured discovery, and the built reads `estimatingOptions` (`src/estimating/reads.ts`) and `discoveryFormOptions` (`src/estimating/discovery-form-options.ts`);
- the shared Record / Banner, Job pack / Disclosure, Toolbar search and Job pack / Select row components. No accepted frame or main component was edited.

Before deciding, Dean asked: "Give the page an audit and polish to ensure it is as professional as possible." He then accepted it: "I accept the Create discovery workspace ES-02 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 as drawn and the recommended answers to Q1–Q4. Dean then asked for the named version: "Yes, save the named version "Create discovery workspace — accepted" in the Figma desktop app." The design reference is that named version.

Scope:
- `route:/estimating/discovery/new` "Create discovery workspace", under `scope:ES-02` "Estimation Wizard · discovery, alternatives & revisions".
- Parent requirements PPO-010 and EST-01–EST-09 under ADR-0035. No parent requirement ID is added or renamed; all 78 remain.
- Capabilities are unchanged: creating a workspace needs `estimating.edit`.

This is a design decision. It authorises none of the following:
- application code, including restyling the built form;
- a change to `estimatingOptions`, `discoveryFormOptions`, the create or preview commands, a migration or a data model change;
- a route, permission or capability;
- an amendment to ADR-0035, the ES-02 wizard decision or the Discovery register decision;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw Create discovery workspace next | User decision, 18 October 2026 | Q4 of the Discovery register, accepted: "I accept the Discovery register ES-02 design with your recommendations, including D1–D7 and Q1–Q4." |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as drawn, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Accepted brief shortcut | Resolved as recommended | Choosing an opportunity that has an accepted Sales brief attaches that brief automatically, with the D3 banner, so the link is never forgotten. Today the link exists only when the flow starts from the Sales handover |
| Q2 When create is allowed | Resolved as recommended | Create is allowed from any step once the built minimum is met: one work tag, a Site declaration, and an owner and reason for each unknown. All five steps are not required first |
| Q3 Opportunity numbers | Resolved as recommended | The app and the accepted Sales briefs page use `SYN-PPO-OPP-…`. The Discovery register frames, which show `OPP-…`, are corrected at that page's lock-in. This page already uses the app format |
| Q4 Estimating owner | Resolved as recommended | The estimating owner defaults to the person creating the workspace and can be changed to another eligible estimator before create. The owner becomes the register's Estimator |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named Figma version | User decision, 18 October 2026 | "Yes, save the named version "Create discovery workspace — accepted" in the Figma desktop app." Saved in the Figma desktop app by this Claude session on Dean's yes (Ctrl+Alt+S, title checked in the dialog) and seen at the top of version history as Dean Fiedler's entry, "just now". Afterwards only the page header's Status, Named version and Decision record fields and the notes card's Accepted paragraph changed; no frame changed |
| Q1 and Q2 behaviour | Build work, not decided | Section 5 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053), at the named version "Create discovery workspace — accepted" |
| Page | "Create discovery workspace · ES-02" `1414:356570`, after Discovery register `1400:345306` and before Estimation Wizard `383:2`. The page header `1414:356571` holds the conformance declaration; the notes card `1416:366159` is in Flows and notes. File index row "Row / Create discovery workspace · ES-02" `1419:5693`, after the Discovery register row |
| Desktop 1440 | Choose opportunity `1415:1065` (1440 × 1000, flow start); first discovery from the accepted Sales brief, Requirements, full length `1414:356639` (1440 × 2049); review and create dialog `1416:2974`; needs attention before create, full length `1416:359389` (1440 × 2119); no eligible opportunities `1416:359903` |
| Tablet 1024 | First discovery with the summary behind its button `1416:361254` (1024 × 768) |
| Phone 390 and 320 | Choose opportunity at 390 `1416:361934` and 320 `1416:364983`; first discovery, Requirements, at 390 `1416:363399` and full length `1416:364882` |
| States | Dialog states: creating `1416:7553`; outcome not confirmed `1416:7630`; workspace already exists `1416:7715`; not permitted `1416:7799`. Phone 390: loading eligible opportunities `1416:365050` |
| Page parts | Section "Parts (proposal)" `1415:360239`: Opportunity choice row (proposed) `1415:360253`, Default and Selected. It stays on the page, as the Sites, People and Discovery register parts do |
| Flow | "Create discovery workspace — desktop (proposal)", starting at `1415:1065`: Continue to discovery opens the first discovery, Create discovery workspace opens the dialog, and Cancel or Close returns |
| Story | Synthetic, Tue 13 Oct 2026 09:12, signed in as Dean Fiedler. SYN-PPO-OPP-000026 Substrate store dosing review for SYN Isolation Nursery at SYN Isolation House, from the accepted Sales brief r1 (receiving owner Jamie Park, 7 October), as on the Sales briefs page. Q01 comes from the brief as Answered, Q02 has an owned follow-up, Q03 is Assumed; one Water system (fertigation dosing) is to confirm. Jordan Kim appears only in the "already exists" state |
| Retained captures | [Create discovery workspace design r01](../reference/ui/estimating/create-discovery-workspace-figma-design-r01/README.md): eleven icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md), as on the page header.

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-02` Estimation Wizard; route `/estimating/discovery/new` (register entry `route:/estimating/discovery/new` "Create discovery workspace"); parents PPO-010, EST-01–EST-09 (ADR-0035); capabilities unchanged: `estimating.edit` to create |
| Page type (r20) | Form or guided workflow: choose the opportunity, then the wizard's five steps for the first discovery, then a review-and-create dialog. One scroll owner per view; the summary scrolls on its own |
| Reused components | Shell v2 rail (Estimation wizard current), the top bar with the Conversations action (proposed amendment), the accepted wizard parts (Wizard / Step, Context header, Family card, Summary panel, Working-copy bar), the Save discovery revision dialog pattern, Grid cells, Tag, Button, Record / Banner, Job pack / Disclosure and Toolbar search. New, proposed, on this page: Opportunity choice row |
| Incoming handovers | Eligible opportunities from `estimating/options` (visible, `estimating.edit`, no estimate and no workspace); an accepted CR-02 Sales brief through `?sales_handover=`, with the opportunity locked; form options for sites, facilities, equipment and owners |
| Outgoing handovers | Creates the workspace with Option A and immutable discovery r01, then opens `/estimating/discovery/[id]`, or returns to the Sales handover to review the link. It never confirms Sales statements as answers, and never costs or prices |
| Source authority | ADR-0035; [es02-wizard-figma-design.md](es02-wizard-figma-design.md) (accepted 12 October); [discovery-register-figma-design.md](discovery-register-figma-design.md) (accepted 18 October); Sales briefs (accepted); `NewDiscovery` and `ProposalEditor` in `src/components/discovery-screens.tsx`; `CreatingFromSalesBrief` in `src/components/sales-estimating-link.tsx` |
| Proposed departures | The built page is one long form (picker, all fields, Compare, then Create). The design has a choose step, the wizard layout for the first discovery and a review dialog; D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Create discovery workspace — accepted", saved 18 October 2026 |

## 4. What the design shows

### Choose the opportunity

- **List:** single-choice rows, newest first, up to 100, with a search field. Each row shows the title, number, customer, site where known, and the Sales brief state (D2).
- **Note:** a footnote counts the eligible opportunities and says why one may be missing: it already has an estimate or a workspace, or the user lacks estimating edit access for its company or site.
- **Summary:** the selected opportunity, Not saved, readiness Not recorded and Not estimated.
- **Footer:** Cancel and Continue to discovery.

### First discovery

- **Sales brief context:** an info banner names the accepted brief and offers Return to Sales handover; "Reported Sales problem and scope" opens below it (D3).
- **Wizard:** the accepted wizard's Discovery view for Option A — Base scope, at Requirements. Alternatives and Revisions show 0. Opportunity and site come from the records, the brief shows each answer's state and source, and the equipment families show one Water system to confirm. Shared infrastructure is grey with "None yet", because green means confirmed (D4).
- **Summary:** New workspace with the Not saved tag; readiness Incomplete; Not estimated; the two owned follow-ups to confirm; a warning that leaving the page discards the entries.
- **Footer:** Create discovery workspace and Continue.

### Review and create

The accepted Save discovery revision dialog, titled "Create discovery workspace" (D5):
- what will be saved: opportunity and site; work and areas; the brief; the Water system;
- owned follow-ups that keep scope Incomplete;
- the required discovery change reason;
- Confirm reviewed values, which here says no answer is marked Confirmed;
- the footer: "The server assigns the number and time.", Cancel and Create discovery workspace.

### States

- **Creating:** the dialog is frozen and the primary reads "Creating…".
- **Outcome not confirmed:** "Confirm original save outcome" checks the original request and never creates a second workspace.
- **Workspace already exists:** created by someone else meanwhile; Open existing workspace, and nothing is copied.
- **Not permitted:** estimating edit access was lost; nothing was created, and the entries stay until the page is left.
- **Needs attention before create:** a warning banner with "Go to first", red fields and a message under each field saying what to fix.
- **No eligible opportunities:** Open Discovery register and Open CRM Sales.
- **Loading (phone):** placeholder rows and a disabled Continue.

### Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | One flow in two steps. Choose the opportunity, then author the first discovery in the accepted wizard layout, then review and create in a dialog | One long page with the picker, every field, "Compare discovery proposal", then Create |
| D2 | Eligible opportunities only. Single-choice rows (the new proposal part Opportunity choice row: radio, title, number, customer, site and Sales brief state), newest first, up to 100, with search. The rule is the built read: visible to you with estimating edit, no estimate and no workspace. A note says why one may be missing; when none is eligible the page links to CRM Sales | A select of "number · title · customer", and a sentence with a CRM Sales link when none is eligible |
| D3 | From an accepted Sales brief. Arriving with `?sales_handover=` skips the choose step: the opportunity is locked, an info banner names the brief and offers Return to Sales handover, and "Reported Sales problem and scope" opens below it. Sales statements arrive as Answered, never Confirmed. When the brief needs renewed review the banner turns Warning with the built wording | A disabled select above a "Sales brief for this workspace" panel |
| D4 | The first discovery is the wizard. Option A — Base scope with all five steps; Requirements first; Alternatives and Revisions show 0 until created. The summary says New workspace with Not saved and Not estimated, lists owned follow-ups, and warns that leaving discards the entries (the built rule). Footer: Create discovery workspace (primary) and Continue | Every discovery field in one "Create option A" panel |
| D5 | Review and create. The accepted Save discovery revision dialog: what will be saved, owned follow-ups that keep scope Incomplete, the required reason, and Confirm reviewed values only for Confirmed answers. The primary keeps the built label "Create discovery workspace" | An inline "Review the proposed saved basis" panel after Compare |
| D6 | Outcomes. Creating… freezes the dialog; an unconfirmed result offers "Confirm original save outcome", which checks the original request and never creates twice; an existing workspace created meanwhile is offered instead; lost permission says nothing was created. Required blanks block create with a warning banner, red fields and "Go to first". On success the workspace opens at Requirements, or the Sales handover reopens when the flow started from a brief | A status line, an error notice and "Confirm original save outcome" under the form |
| D7 | Tablet and phone. Tablet keeps one column with the summary behind its button. Phone follows the accepted wizard phone: back, status, tabs, step navigation, stacked fields, and a footer with Summary and Create workspace. Choose is a scrolling list with a full-width Continue | The same long form at every width |

## 5. Not decided and not drawn

- **Building the page.** The built `/estimating/discovery/new` keeps the long form. The build order is not decided.
- **Q1 and Q2 behaviour.** Attaching an accepted brief when its opportunity is chosen, and allowing create from any step once the minimum is met, change how the built page and its commands behave. They are build work, not confirmed behaviour; the create command's validation is unchanged by this decision.
- **Not drawn:**
  - the Configuration, Scope & delivery, Pricing and Review steps for a new workspace (they follow the accepted wizard frames);
  - the renewed-review Warning banner;
  - the Sales handover page after returning;
  - 200% zoom.
- **The Conversations action** is part of the proposed top-bar shell amendment. Task-style phone headers follow the accepted wizard phone, which has none.
- **Data in the frames:** the opportunities, customers, sites, briefs and people are synthetic. They are not operational records.

## 6. Audit and polish

Claude checked the page twice: once before presenting it, and again at Dean's request. The checks covered fonts (Roboto only), text left over from the cloned wizard frames, measured truncation, 16 px phone insets, the Conversations action on every desktop and tablet top bar, and prototype links.

- **Fixed while drawing:**
  - checkboxes replaced by single-choice radio rows;
  - the Shared infrastructure bar is grey, not green, when nothing is confirmed;
  - button icons match their actions, and follow-up badges are amber;
  - the breadcrumb drops its parent at 1024 so the search placeholder stays on one line;
  - phone rows grow with wrapped text;
  - 35 copied links that pointed at the wizard page were removed.
- **Changed in the second pass:**
  - the choose step gains Cancel beside Continue;
  - the Sales brief link appears once, in the banner, not again in the summary;
  - the summary says "New workspace" once, with the Not saved tag;
  - Shared infrastructure reads "None yet";
  - the review dialog also lists work tags and areas;
  - Create uses the plus icon rather than the save icon;
  - required-field errors say what to fix under each red field;
  - the empty state offers Open Discovery register beside Open CRM Sales;
  - the phone banner action reads "Handover".

The audit is recorded on the notes card `1416:366159`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and both audits.
- The eleven captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 233,000. Image 10 is a frame holding copies of the four dialog states side by side. Interactions were removed from 66 layers, and each of the 296 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance was left;
  - none of 937 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link or a flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/estimating/create-discovery-workspace-figma-design-r01/README.md).
- The page has one prototype flow. Claude did not play it in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
