---
document_id: PPO-AI06-ASSISTANT-SETTINGS-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Assistant settings AI-06 design — owner decision

On 24 October 2026 Dean asked for the design of the organisation's assistant settings: "Your task is to design and build the "AI assistance settings and quality review (AI-06)" UI page in Figma as a proposal for my review." Claude drew the page in Figma, covering the Assistant configuration area of the accepted Settings hub at the register destination `/assistant/settings`:
- an overview;
- Provider and budget, with the pre-call checks, and the Switch provider dialog that needs a second person;
- the budget-used-up state;
- Capabilities and sources, with a change panel that needs a reason;
- Data handling;
- evaluation runs, Not run, and a synthetic example run;
- the Flagged answers worklist and a flagged answer record.

Claude drew the page from these sources:
- the design register page [scope-ai-06](../design/development/pages/scope-ai-06.md);
- the decision [PPO-AI-DEC](ppo-assistant-direction.md) (A1 Claude API first, A2 stored threads) and the [assistant specification](../blueprints/ppo-assistant-specification.md) sections 8 to 11;
- the [Conversations T2 scope](conversations-t2-scope.md) (T2-6 budget first, T2-8 labels, T2-11 off by default);
- the [Settings hub](settings-hub-figma-design.md) and [Users and access](users-and-access-figma-design.md) decisions, and the role bundles in `src/access/roles.ts`;
- copies of the accepted Settings overview and tablet shells.

On 30 October 2026 Dean accepted the design by choosing the offered answer "Accept as recommended". The question on screen was "Do you accept the AI-06 design with D1–D8 and the recommended Q1–Q6?" That adopts D1–D8 and the recommended answers to Q1–Q6.

Scope:
- `scope:AI-06` "AI assistance settings and quality review". No new scope is added.
- Page-register coverage under NFR-01, NFR-02, NFR-03, NFR-05, NFR-08, NFR-10, NFR-11 and NFR-12. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, provider call, purchase, real data or deployment. It pins no model or SDK. Every figure shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AI-06 as a proposal | User decision, 24 October 2026 | Dean's request quoted above |
| Departures D1–D8 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Who may switch to live | Resolved as recommended | A holder of the proposed assistant settings duty requests. The billing owner, Dean Fiedler, approves as the second person. Nobody approves their own request. Switching back to Simulated needs one person and takes effect at once |
| Q2 Warning at 80% | Resolved as recommended | One warning at US$24.00 to the billing owner and the settings duty holders, in Needs attention and as a notification. No automatic pause before 100%; the reservation still stops every request at the ceiling |
| Q3 Pilot roles | Resolved as recommended | Service coordinator only, plus Dean and Taylor Quinn for the owner evaluation. Field technician after AI2 voice is tested on real phones. Finance roles and Read-only observer stay out of the pilot |
| Q4 Who reviews flagged answers | Resolved as recommended | The assistant settings duty holder reviews within two working days and records the outcome. Dean, as assistant owner, decides each fix. An Unsafe outcome opens an AD-09 incident and notifies Dean the same day |
| Q5 Story clock | Resolved as recommended | The brief set Tue 13 Oct 2026, 09:00, but A1 (18 October) and the terms check (16 October) come after it. The story moved to Tue 27 Oct 2026, 09:00 and its dates by 14 days. Later-example states sit in November |
| Q6 Pinned model as a check | Resolved as recommended | "Model and SDK pinned by the build" is the fifth pre-call check. The story therefore reads 2 of 5 met and 3 open, not the 2 open of the original brief |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Waits for Dean | Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Assistant settings · AI-06" `2393:852796`, under "— Administration —" after Operational health · AD-09. The page header `2393:852797` holds the conformance declaration; the notes card `2397:873338` is in Flows and notes. File index: the row "Row / Assistant settings · AI-06" `2771:546425` in the Administration group, after Settings · AD-02 |
| Desktop 1440 | Overview (1440 × 1392) `2393:870758`; Provider and budget (1440 × 2021) `2393:873129`; Switch provider dialog (1440 × 2021) `2394:869163`; budget used up (1440 × 2061) `2394:869452`; Capabilities and sources (1440 × 1058) `2394:874868`; Data handling (1440 × 1174) `2394:875627`; evaluation runs, Not run (1440 × 1122) `2395:869362`; synthetic example run (1440 × 1208) `2395:869980`; Flagged answers (1440 × 900) `2395:870599`; flagged answer record (1440 × 1342) `2395:874199` |
| Tablet 1024 | Overview, side menu collapsed (1024 × 1626) `2395:880080` |
| Phone 390 and 320 | Overview `2395:877094` and `2395:877274`; flagged answer, administrator reviewing, full length `2395:877454` (390 × 1337) and `2395:877567` (320 × 1429) |
| States | Phone 390: loading `2396:873417`; simulated only `2396:873476`; pre-call checks incomplete, live switch blocked `2396:873566`; budget near limit `2396:873639`; budget used up `2396:873716`; provider unavailable `2396:873793`; no flagged answers `2396:873909` |
| Page parts | Section "Page components (proposed)": AI-06 / Check row `2393:868430`, Option row `2393:868437`, Capability grid header `2393:868447` and row `2393:868473`, Flagged answer grid header `2393:868500` and row `2393:868530`, Grid group row `2393:868562`, Phone list row `2395:879921`. They stay on the page, as the AD-01 and AD-02 parts do |
| Prototype | Flows "AI-06 — desktop" (from the overview) and "AI-06 — phone" (from the phone overview): the five tabs, Needs attention rows, card links, Switch provider to the dialog and back, the Quality views, a flagged row to its record and back; on phone, the Claude row to the blocked state and Flagged answers to the record and back |
| Story | Synthetic, as at Tue 27 Oct 2026, 09:00 Brisbane time, signed in as Taylor Quinn, systems administrator (the AD-01 persona), holding the proposed assistant settings duty. Dean Fiedler is billing owner and assistant owner. The Simulated assistant is in use and the feature flag is on in the synthetic workspace (default off). The Claude switch is blocked: outbound destinations are not restricted, there is no AIA-18 proof that real data stays out, and the build has not pinned a model. Budget: a synthetic example from an owner evaluation, US$4.10 used and US$0.35 reserved of US$30, 186 tasks, US$0.022 per successful task. Flagged: SYN-AIF-000002 (Sam Patel, wrong source in a Customer CRM summary of Green Valley Nursery — Synthetic, in review) and SYN-AIF-000001 (Riley Tran, equipment question at SYN Glasshouse 4, out of scope, with the owner) |
| Retained captures | [Assistant settings design r01](../reference/ui/settings/assistant-settings-design-r01/README.md): sixteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-06` at `/assistant/settings`, opened from Settings › Configuration areas › Assistant (AD-02). Page-register coverage under the NFR IDs above; parent requirement IDs unchanged. No capability added; two are proposed for a build ("Ask the assistant", assistant settings duty) |
| Page type (r20) | Overview / dashboard for the overview. Form / guided workflow for Provider and budget, the Switch provider dialog and the capability change panel. Register / worklist for Capabilities and sources and Flagged answers. Review / comparison for evaluation runs. Record detail for a flagged answer |
| Reused components | Shell v2 copied from Settings · AD-02 (Rail · Service with More selected, the top bar with the proposed Conversations action, the Settings side menu with Assistant selected), Record / View tab, Filter chip, Banner and Field, Tag, Button, Grid / Header cell, Cell, Checkbox, Checkbox cell and Row actions cell, Toolbar search, Attention row (AD-02 part), Assistant / Source chip (AI-01 part), Shell / Phone header · compact, v2 / Tab bar (phone). New, proposed: the AI-06 parts listed in section 2 |
| Incoming handovers | The Assistant card and side-menu entry in Settings (AD-02); "This answer was wrong" in the assistant panel (AI-01) and on Carl's answers in Conversations, which creates a flagged answer with its question, answer and sources; Needs attention links; budget and outage alerts |
| Outgoing handovers | Answer evidence (AI-03), Users and access (AD-01), Audit history (AD-07), Operational health (AD-09), Integrations (AD-04), My account for personal settings. The page never edits a business record, grants access or buys credit |
| Source authority | The sources listed above |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | Waits for Dean: "Assistant settings — accepted" |

## 4. Departures, accepted

No AI-06 page is built, so each departure is from the register text.

| ID | Departure | Basis |
|---|---|---|
| D1 | One Assistant area with five tabs: Overview, Provider and budget, Capabilities and sources, Data handling and Quality | Settings hub D1–D2; `scope:AI-06` |
| D2 | Provider as a single choice with its status in words. The Simulated assistant is the default and in use; Claude API · live synthetic shows "Blocked" until all five pre-call checks are met; direct OpenAI and Azure OpenAI stay "Not configured". Model reads "Not selected" until the build pins it, and no frame names a pinned model | Specification section 8, A1 |
| D3 | A two-person switch. The requester gives a reason, the billing owner approves, and the request cannot be sent while any check is open | A1 and the section 8 pre-call checks |
| D4 | Budget as a reservation meter: used, reserved and remaining against US$30, tasks this month, cost per successful task, history by month, and a plain list of what happens when it is used up. The assistant fails closed and ordinary screens keep working | Section 8, AIA-17, T2-6 |
| D5 | A capability grid with slice, status, permitted sources and roles. Changes open a side panel with a required reason and are recorded in Audit history. Opportunity creation shows Off until the simulated creation journey passes AIA-12 and AIA-14 | Sections 3, 6 and 9 |
| D6 | Data handling shown as Anthropic's published terms, never as settings, with the check date 16 October 2026 and "Not verified against our account" | Section 8 |
| D7 | Quality: the 40-task set with three repeats and "Not run" results; the pilot target labelled Proposed; a synthetic example run labelled as an illustration; flagged answers as a worklist and a record with the answer, its evidence (AI-03), the reviewer, five outcomes and hand-over to the owner. Unsafe opens an incident in AD-09. Flagged answers take a readable reference `SYN-AIF-000nnn` | Section 10; readable references decision |
| D8 | Phone: a grouped settings list with status words, a flagged-answer record with one full-width 48 px main action and 16 px input text, and seven states. Later-example states show a live provider only after every check is met | Phone header amendment; AD-02 D8 |

## 5. Not decided and not drawn

- **Building the page.** No route exists. The build order is not decided.
- **Prerequisites for a build:**
  - the two proposed capabilities and their access-review chain;
  - the PPO reservation control, which the specification says is not yet built (AIA-17);
  - a flagged-answer store with the `SYN-AIF` reference;
  - the outbound restriction and the AIA-18 inspection, which are open pre-call checks, and the model and SDK pin.
- **The pilot target stays proposed.** Accepting this design does not adopt it as a measured capability or an acceptance result.
- **Not authorised:** a live provider, real or operational data, a paid-use decision or a change to the US$30 ceiling. A1's limits stand.
- **Not drawn:** Dean's approval of a switch; switching back to Simulated; a saved capability or feature-flag change; an evaluation in progress; budget months before September; a closed flagged answer and the Correct and Unsafe outcomes; Carl-specific thread settings; tablet views other than the overview; 200% zoom.
- **The Conversations action** is part of the proposed top-bar shell amendment, as on the AD-01 and AD-02 pages.

## 6. Audit

Before acceptance Claude checked the page for overlaps, frames outside their sections, fonts and links to other pages, and found none of those faults. Clipped text in the flagged-answers and capabilities grids was corrected. Long questions in the flagged-answers grid end in an ellipsis as register text; the record shows them in full.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and after the Q5 and Q6 changes.
- The sixteen captures are copies of the accepted frames on the "Captures (icon-free)" page at y = 480,000 (`2771:560316` to `2771:568816`). Prototype links were removed and 1,122 Font Awesome instances were swapped for `Icon/placeholder`. A scan found no icon instance left and no prototype link on any copy. Claude viewed captures 03, 12 and 16 and did not view the others individually.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/settings/assistant-settings-design-r01/README.md).
- **Captures page flows, open.** The Captures page reported 115 flow starting points at the start of this lock-in and 1 afterwards, while at least two other lock-in sessions were adding captures to it. This session's script read the list and wrote it back after making its copies, and reported 4 at that moment. Claude could not establish which script reduced the list and has not rebuilt it. The accepted pages' own flows are separate and unaffected. An earlier state remains in the file's version history.
- The named Figma version "Assistant settings — accepted" has not been saved. It waits for Dean.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
