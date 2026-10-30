---
document_id: PPO-CR02-SALES-BRIEF-PAGE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; new fields, notifications, rail count, native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Sales brief page design — owner decision

On 23 October 2026 Dean asked Claude to "design and build the Sales brief page (/sales/handoffs/estimating/[id]) and its decision forms in Figma as a proposal for my review. Draw the page; do not stop at a written brief." The accepted [Sales briefs design](sales-briefs-design.md) had drawn the receiving queue and listed "the brief page and its decision forms" as not drawn.

On 30 October 2026, asked "Do you accept the Sales brief page with the recommended answers to Q1–Q7?", Dean answered: "Accept as drawn." That adopts departures D1–D16 and the recommended answers to Q1–Q7.

Scope:
- Register entry `route:/sales/handoffs/estimating/[id]` and scope `CR-02`. The route and its native implementation already exist.
- Parent requirements CRM-02, CRM-05, EST-01 and EST-02. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, read model, migration, permission, capability, notification, shell change or deployment. The page is built today with a different layout, so this design defines a later change to it.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw the brief page and its decision forms | User decision, 23 October 2026 | Dean's request, quoted above |
| Departures D1–D16 | Accepted as drawn, 30 October 2026 | Dean's answer, quoted above. Section 4 |
| Q1 Rail count for Sales briefs | Resolved as recommended; shell rule not yet built | Yes: a neutral count of "Awaiting my decision" (assigned to me, Submitted or Clarification answered), as Reviews & approvals shows. Recorded once as the shell rule that a rail count means items awaiting my decision. This answers the open question in the [Sales briefs design](sales-briefs-design.md), section 5 |
| Q2 Mandatory checks before Submit | Resolved as recommended | The nine as built, with None allowed for exclusions and assumptions. Evidence stays optional, because some briefs start before any draft quotation. Unknowns should name an owner, as the label asks, without a server change |
| Q3 Who becomes the receiving owner | Resolved as recommended | Sales nominates a permitted estimator before Submit, as built. Reassignment from Intake & workload is a later, separate decision. Not "first to act", which lets two estimators race and blurs accountability |
| Q4 Notify the deal owner on every clarification | Resolved as recommended; not built | Yes, in-app (bell and My Work) for each question, with its due date, and the receiving owner is notified when Sales answers. No email by default |
| Q5 Return items | Resolved as recommended | One owned, dated Deal activity carrying the itemised reasons, as built, rather than one activity per item |
| Q6 "Answer needed by" on Clarify | Resolved as recommended; not built | An optional date shown with the question and in My Work. It is never a customer date |
| Q7 Create discovery | Resolved as recommended | The reviewed creation in the [20 October direction](discovery-creation-journey.md) saves the exact link in the same transaction, and that is the default. This page's return link review applies only when creation saved no link or the link was refused or interrupted |
| Accept the design | User decision, 30 October 2026 | "Accept as drawn." |
| Named Figma version | User decision, 30 October 2026 | Asked whether he had saved it or Claude should, Dean answered: "Please save it". Claude saved "Sales brief page — shared record layout, accepted" in the Figma desktop app and saw it at the top of version history as Dean Fiedler's entry, "just now". Afterwards only the page header's Status and Named version fields changed |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Sales brief page · CR-02" `2245:736961`, directly after Sales briefs under "— Estimating & quotation —". The page header `2245:736962` holds the conformance declaration; the notes card `2263:4217` is in Flows and notes. File index row `2771:438639` |
| Desktop 1440, Sales | Draft with readiness gaps `2245:765658` (full length); submitted, r1 frozen `2245:782145`; answering a clarification `2245:782511`; successor r2 after the return `2245:798807` (full length) |
| Desktop 1440, receiver | Submitted, deciding `2245:764893`; Clarify form `2245:765250`; clarification answered, Resolve `2245:782867`; Return with owned items `2245:798422`; source changed, Accept blocked `2245:799234`; Accept r1 `2248:769346`; link to the existing workspace `2248:769734` (full length); Create discovery, back for the link review `2248:770111` (full length); link not completed `2256:2743`; History `2256:3093` (full length) |
| Tablet 1024 | Receiver, clarification answered `2260:3995` |
| Phone 390 and 320 | Sales answering `2260:4318` / `2260:4381`; receiver accepting r1 `2260:4443` / `2260:4523` |
| States | Loading `2258:3192`; no access, reads as not found `2258:3440`; stale, a newer revision exists `2258:3643`; uncertain save `2258:3930`; owned by another receiver, read only `2258:4222`; earlier link labelled historical, an alternative story as at Thu 15 Oct `2258:4488` |
| Shared parts | Record / Header, Field, Section heading, View tab, History item, Filter chip and Banner; Quotation detail / Lifecycle step and Linked chain row; Tag; Button; Shell / Phone header · compact; the Rail item with `Icon/solid/inbox`. The shell was cloned from accepted Quotation detail frames |
| New on this page only | The decision dialog layout, return-items list, choice rows, comparison tables and phone sheet are built from tokens. No component was added to Components `1:4` |
| Prototype | Flows "Sales brief — Sales", "Sales brief — receiver" and "Sales brief — phone", with 15 links |
| Story | Synthetic, as at Mon 12 Oct 2026. Briefs, owners and references come from Sales briefs `152:1122` unchanged. SYN-PPO-OPP-000030 Nutrient room dosing upgrade (Morgan Hale, Sasha Cole) is clarified, resolved, accepted and linked to its discovery workspace. SYN-PPO-OPP-000027 Mother stock house misting (Morgan Hale, Riley) is returned for a missing site survey and comes back as r2. SYN-PPO-OPP-000028 Packhouse cold room expansion shows Source changed. SYN-PPO-OPP-000031 Boiler house heat recovery study shows Create discovery and Link not completed. New evidence references: SYN-QUO-000196, SYN-QUO-000199, SYN-QUO-000203, SYN-DOC-000041, SYN-DOC-000047 and SYN-DOC-000052. The 000030 workspace and its versions are new story data; the Discovery register frames do not list it |
| Retained captures | [Sales brief page design r01](../reference/ui/estimating/sales-brief-page-design-r01/README.md): 25 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `route:/sales/handoffs/estimating/[id]`, `scope:CR-02`; parent requirements CRM-02, CRM-05, EST-01 and EST-02, unchanged. Capabilities as built: `crm.opportunity.edit` for the Sales owner and `estimating.edit` for the receiving owner |
| Page type (r20) | Record detail, with centred dialogs for short decisions and reasons, and Review / comparison inside Accept, Source changed and the link review. Phone: one record page with the compact record header, a sticky action bar and bottom sheets |
| Reused components | Section 2 |
| Source authority | The [Sales briefs design](sales-briefs-design.md), section 4 state rule; [LC-13](../contracts/lead-to-delivery-continuity.md#lc-13-accepted-estimating-brief-continuity); the [20 October creation direction](discovery-creation-journey.md); `src/sales/handover-model.ts`, `src/sales/handover-service.ts`, `src/components/sales-handover.tsx` and `src/components/sales-estimating-link.tsx`. The story is a synthetic fixture |
| Incoming handover | Sales briefs "Open brief", the Sales preparation list, the Deal record and in-app notifications. The page reads the brief at its exact revision, its evidence revisions, its source fingerprint and its history |
| Outgoing handover | Open opportunity opens the Deal record. After acceptance the receiver links the exact acceptance to the workspace for the same deal, or opens Create discovery workspace. Acceptance creates no estimate, quotation, order, Project, work order or booking. A link never overwrites discovery or cost history |
| Exceptions and recovery | Section 4, States |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. What the design shows

### Rules

- Sales saves a draft, sees readiness by name and submits. Submission freezes the revision with its evidence revisions and source fingerprint. A later draft never replaces it, and a successor starts only after Return or Accept.
- Only the receiving owner decides. Clarify needs Submitted; Sales answers; Resolve needs the recorded answer and puts the brief back to Submitted. Return needs an open, owned, dated Deal activity. Accept needs Submitted and an unchanged fingerprint. Every decision carries a reason.
- Source changed is the only warning colour, Returned is muted, and every state has words.
- A link is an immutable companion keyed to the acceptance event. Earlier links are labelled historical.

### States

Loading; no access, which reads as "Sales brief not found" and shows no identities; stale, where a newer revision exists and r1 is read only; uncertain save, with the app's "Check original result" and "Retry exact original" commands; another receiver's brief, read only and naming who decides; and an earlier link labelled historical.

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | The shared record layout: one-row header, 380 px details column and view tabs | Quotation detail and Deal record CR-01 |
| D2 | Six tabs: Brief, Evidence, Questions, Decisions, Workspace and History. Today: Brief & scope, Review & clarification, History & comparison | Dean's brief |
| D3 | One bar under the header. While Draft it is the checks bar, with nine checks: the eight in `handover-model.ts` plus the receiving owner that Submit requires. After submission it is the state bar: Drafted, Submitted, Clarification, Receiving decision, Workspace link. Missing checks are neutral, with words | Dean's brief; the Sales briefs colour rule |
| D4 | State words follow the accepted page and the app: "Clarification requested". Dean's brief said "Clarification asked" | [Sales briefs design](sales-briefs-design.md), section 4 |
| D5 | Each decision is a centred dialog naming the exact revision and fingerprint, with a required reason. Accept carries a frozen comparison | PPO-UI-CONFORMANCE; Record Won on the Deal record |
| D6 | Receiver frames use the Estimating & quotation rail with Sales briefs selected. Sales frames use the Sales rail with Estimating handovers selected | Dean's brief |
| D7 | A brief has no number of its own. The header and breadcrumb show the opportunity number and revision | The Sales briefs grid |
| D8 | Source changed: Accept stays visible but disabled, with its reason. The primary action is Return for corrected successor, and a comparison shows what changed. There is no separate "mark reviewed" step | `handover-service.ts` refuses Accept until a corrected successor |
| D9 | Return asks for itemised "What Sales must fix" items, each with an owner, plus the owned, dated Deal activity and a reason | Dean's brief; Q5. Itemised entry is new; the code stores one note and one follow-up activity |
| D10 | Clarify adds "Answer needed by", a proposed field | Dean's brief; Q6. The app stores only the question |
| D11 | The successor lists the returned items with their outcome and a "Changes from r1" comparison. The details column shows r1 and r2. r1 stays frozen and linked | Dean's brief; today's History & comparison |
| D12 | Workspace tab: link to the existing workspace or Create discovery, with a frozen comparison, a required reason and an immutable-link note | LC-13; `sales-estimating-link.tsx` |
| D13 | Link not completed: a neutral banner with the recovery commands. The workspace and its creation receipt stay visible | LC-13 |
| D14 | Read only for another receiver says who decides. No access reads as not found | Dean's brief; the app's read rules |
| D15 | Phone: compact record header, flush sections, full-width 48 px actions, a white sheet with a grey heading row and 16 px inputs | [Phone header amendment](phone-header-amendment.md); Dean's 19 October rules |
| D16 | The rail label and new parts stay on this page. Components `1:4` is unchanged | ADR-0053 and the Figma working rules |

## 5. Not decided and not drawn

- **Building the page.** The design needs the six-tab layout, itemised return entry, the "Answer needed by" field and its storage, in-app notifications for questions and answers, and the Sales briefs rail count. Each needs its own go-ahead, and any migration or new read is decided then.
- **The app's labels.** The app still says "Intake" and "Estimating Intake"; this record does not change them.
- **Reassigning the receiving owner** (Q3) is a later decision.
- **Not drawn:** the Evidence and Decisions tab bodies as their own frames; more than one tablet frame; phone tabs other than the record; 200% zoom.

## 6. Verification

- Claude checked every frame with screenshots inside Figma. On 23 October a scripted check found no overlap, nothing outside its section, no link off the page and no clipped text, after fixes to the tablet top bar, the tablet header and the 320 px header width.
- The 25 October [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md) later relinked detached top bars and bound colours across proposal pages, including this one, and the scripted check was not re-run afterwards. At lock-in only frame names, labels, the page header and the notes card's opening changed.
- The prototype was not played in Present mode. Its links were set by script and listed.
- The 25 captures are copies of the accepted frames with 723 Font Awesome icons swapped for `Icon/placeholder`; a check after the swap found none left. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/sales-brief-page-design-r01/README.md).
- The named version was saved on 30 October 2026 and seen in version history. It is a version of the whole file, and another session was also working in the file that day.
- Nothing is rebuilt to this design, so there is no application or device evidence for it. This record implies no visual review of the application and no UI baseline.
