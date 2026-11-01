---
document_id: PPO-DK07-HELP-CENTRE-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Help Centre and page guides DK-07 design — owner decision

On 31 October 2026 Dean asked for this design: "Your task is to design and build the Help Centre and page guides (DK-07) in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma, covering:
- the non-modal guide panel from the information icon, over a real page;
- the Help Centre home at `/help`, guide search, a journey and the full-width reading view;
- the development draft section for authorised users, and "No guide for this page yet" with Report a gap;
- coverage of every register entry, gaps as a worklist, and guide review against the current page;
- tablet 1024, phone 390 and 320, and ten state frames.

Claude drew the page from these sources:
- [User guide direction](user-guide-direction.md) (PPO-USER-GUIDE-PROP, Q1–Q11 accepted 23 October 2026) and the [contents outline](../guides/user-guide-contents.md) (PPO-USER-GUIDE-TOC);
- [Contextual help direction](contextual-help.md) (PPO-HELP-DEC r01), the [contextual help design](../blueprints/contextual-help-design.md) (PPO-HELP-DES) and its preview;
- the [page guide template](../standards/page-guide-template.md) (PPO-HELP-TPL) and the design register page [scope-dk-07](../design/development/pages/scope-dk-07.md);
- the [phone header amendment](phone-header-amendment.md), rule P4 in particular;
- `src/shell/guide.ts` and `src/components/shell-page-guide.tsx`.

On 1 November 2026 Dean accepted the design by choosing the offered answer "Accept as recommended". The question on screen was "Do you accept DK-07 with D1–D15 and the recommended Q1–Q11 answers?" That adopts D1–D15 and the recommended answers to Q1–Q11.

Scope:
- `scope:DK-07` "Page guides and contextual help coverage", destination `/help`. No new scope is added. The sub-routes the design implies (`/help/search`, `/help/journeys/[id]`, `/help/guides/[key]`, `/help/coverage`) are proposals for the build and are not registered here.
- `scope:AD-10` keeps onboarding, What's new and support. `scope:SH-04` keeps global search.
- No parent requirement ID is added or renamed; all 78 remain. The design elaborates DOC-04, NFR-01, NFR-05, NFR-07 and NFR-08. HELP-01 to HELP-14 and T1 to T6 remain Not run.

This is a design decision. It authorises no application code, route, capability, grant, migration, SOP connection, feedback store, guide content or deployment. It writes no chapter: guide wording on the page is layout text. Stage 3 of the user guide direction, the build, still needs its own go-ahead. Every record, person, SOP and count shown is synthetic, except the register totals (216 routes, 152 scopes and 4 systems at `1402c87b`).

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Help Centre and page guides | User decision, 31 October 2026 | Dean's request quoted above |
| Decisions D1–D15 | Accepted as drawn, 1 November 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Who owns guides | Resolved as recommended | Module owners own each guide's accuracy. One documentation owner (Dean, for now) owns the standard, the template and coverage. Every guide names one owner |
| Q2 How stale before flagged or hidden | Resolved as recommended | Flag at once when the page changes after the last review, and list it on Gaps. Staleness never hides a guide; only Withdrawn does. No calendar limit, because PPO-HELP-TPL forbids inventing an expiry rule |
| Q3 SOPs in the Document library, only linked | Resolved as recommended | Yes. SharePoint stays the authority, the Document library shows revision and owner, and a guide links and never copies |
| Q4 Own guide content for the customer portal | Resolved as recommended | Yes, a separate customer guide when the portal is built. Coverage shows CP as a separate group |
| Q5 Where Mark reviewed writes | Resolved as recommended | To the guide's front matter through a pull request (reviewer, date, release, review hash), because Git is the authority. The screen shows Reviewed once that lands |
| Q6 Who may review | Resolved as recommended | The owner, for content; the module's business reviewer before publication. A guide's last editor cannot review that edit |
| Q7 Generated stubs | Resolved as recommended | A stub in `guides.json` counts as No guide until it is rewritten in Markdown, so coverage doesn't overstate. `guide.pl.03` is one such stub |
| Q8 Who sees Coverage and Guide review | Resolved as recommended | A guide review capability at build, because module owners are not design-workspace users. Until then it follows design-workspace access. No capability is added by this record |
| Q9 The Deals toolbar's own Guide icon | Resolved as recommended | Remove it when Deals is next changed, keeping one entry per page. Deals is not edited by this record |
| Q10 Later dates on Bench testing copies | Resolved as recommended | Left as drawn. Those copies show Thu 15 Oct, after this story's as-at date, and the dates don't affect the guide |
| Q11 Print layout | Resolved as recommended | Draw the A4 layout with the first written chapter. Only the Print button is drawn. The direction paper's stage 2 names a print layout, so this part of stage 2 stays open |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Not saved yet | "Help Centre & page guides — accepted" waits for Dean. Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Help Centre & page guides · DK-07" `3015:123`, under "— Shared records —", after Knowledge authoring · DK-05. The page header `3015:124` holds the conformance declaration; the notes card `3031:538196` holds D1–D15, Q1–Q11, what is not drawn and the checks; the flow card is `3031:538285`. File index: the row "Row / Help Centre & page guides · DK-07" `3093:640321` in the Shared records group |
| Desktop 1440 | Deals, guide closed (flow start) `3020:1841`; panel open at the current task `3020:3333`; Help Centre home `3022:12454`; guide search `3022:13064`; journey J1 `3024:7519`; task section with SOP `3020:4856`; reading view `3024:7920`; development draft `3026:8153`; no guide `3026:9246`; coverage `3027:12054`; gaps `3027:12939`; guide review `3026:11461`; marked reviewed `3026:12138`; More panel with the Help entry `3031:74749` |
| Tablet 1024 | Panel as an overlay `3027:13764`; Help Centre home `3027:15315` |
| Phone 390 | Deals, menu closed (flow start) `3031:538055`; menu `3029:15823`; contents `3029:16107`; task section `3029:16179`; search `3029:16278`; Help Centre home `3029:16801` |
| Phone 320 | Menu `3029:16326`; contents `3029:16586`; task section `3029:16658`; search `3029:16753` |
| States | Loading `3031:74143`; no guide, unregistered route `3031:74200`; a draft stays hidden `3031:74267`; stale against release `3026:9981`; SOP unavailable `3031:74334`; no search results `3031:74410`; offline with a cached date `3031:74686`; contents open `3031:74478`; could not load `3031:74559`; edited after review `3031:74625`. Feedback saved and not saved are variants of Guide / Helpful |
| Components | Moved at acceptance to the Components page, new section "Components · Help Centre" `3093:640319`, keeping node IDs and instances: Guide / Panel header `3018:124`; Tools `3018:141`; Contents row `3018:167`; Helpful `3018:215`; Panel footer `3018:216`; Current task `3018:233`; Result row `3018:237`; Journey row `3018:245`; Journey step `3018:256`; Review check `3018:288`; Step `3020:1835`; SOP row `3022:11886`; Coverage grid header `3018:289` and row `3018:323` |
| Prototype | Three flows, with no links off the page. "DK-07 — desktop": Deals, information icon, panel, current task, reading view and Back, Help Centre, search, J1, More. "DK-07 — desktop, upkeep": starts at Coverage, because ordinary users have no entry to it. Gaps, a stale or no-guide row, a Bench testing row to the draft, then review. Its Mark reviewed jumps ahead to the result, as if all 13 sections matched. "DK-07 — phone": Deals, menu, Page guide, contents, Main tasks, search, Help Centre. The 320 frames are not linked. The brief asked for two flows; the third is added because of that entry limit |
| Story | Synthetic, as at Tue 13 Oct 2026 09:00 AEST, release of Mon 12 Oct 2026. Deals guide: Published, last reviewed Mon 5 Oct, owner Morgan Hale. Work orders guide: Published and stale, last reviewed Tue 8 Sep, page changed Mon 12 Oct, owner Jordan Kim. Bench testing guide: Draft, `guide.cx.02.bench-testing`, last edited Fri 9 Oct, owner Dean Fiedler. Capacity review: no guide, no owner nominated. My jobs guide: Published, saved on the phone Mon 12 Oct 07:42. New synthetic SOPs: SYN-DOC-000214 r04 and SYN-DOC-000231 r02. Coverage counts: Published 41, Reviewed 5, InReview 7, Draft 306, No guide 9, Stale 3, total 368. Home counts chapters: 24 of 139 published. The release's date stands in for a release name, because the repository has no release naming convention |
| Retained captures | [Help Centre design r01](../reference/ui/help-centre/help-centre-design-r01/README.md): nineteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:DK-07` Page guides and contextual help coverage, `/help`. No new scope; parent requirement IDs unchanged; capabilities unchanged |
| Page type (r20) | Overview (Help Centre home) · Register / worklist (coverage and gaps) · Document & evidence workspace (reading view, journey) · Review / comparison (guide review, in the panel over the running page). The panel is a shared shell surface |
| Reused components | Shell / Top bar `35:138` (linked on every desktop and tablet frame), Shell / Phone header · compact `1530:110`, Rail · Sales `190:20238` and the rails on copied pages, v2 Menu item, heading and strip, v2 / More panel `79:51` (detached on one frame to show the Help entry), Button, Tag, Record / Banner, Record / View tab, Grid / Header cell, Cell, Checkbox cell and Row actions, Grid / Group band and List row (phone) (proposed in PR #694), Knowledge / Group heading and Topic tile, the phone menu from My account `2114:689887`. Copies of Deals `549:3`, Work orders `196:24111`, Capacity review `2245:762282` and Bench testing `2083:119`, `2083:576`; their sources are untouched. New: the fourteen components in section 2 |
| Incoming handovers | The information icon on every page, carrying the exact route and section. Page guide in the phone menu (P4). More › Help › Help Centre (proposed). The panel footer link. A guide's links between guides and journeys |
| Outgoing handovers | Open in Document library (DK-01), showing the SOP's revision and owner; SharePoint stays the authority. Report a gap and What's new (AD-10). Go to page links. Knowledge (DK-04). Top bar search (SH-04). Mark reviewed: a review bound to the text and release, published later by a release |
| Source authority | User decisions: the brief, PPO-USER-GUIDE-PROP and PPO-USER-GUIDE-TOC, PPO-HELP-DEC r01. Prepared detail adopted by Q11 of that direction: PPO-HELP-DES, PPO-HELP-TPL. Accepted 1 November 2026: D1–D15 |
| Proposed departures | Five, accepted: marked in section 4 |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Help Centre & page guides — accepted", waiting for Dean |

## 4. What the design shows

| ID | Decision | Basis |
|---|---|---|
| D1 | "Published" on screen where the brief says Released. The six words are the template's: Draft, InReview, Reviewed, Published, Superseded, Withdrawn. Stale is a separate flag beside the status, not a seventh state | PPO-USER-GUIDE-PROP 4.3, Q11 |
| D2 | Panel 600 px, overlay, non-modal, no scrim or focus trap, with Return to page. It keeps its size through every state | PPO-HELP-DES 2.2, 2.3 |
| D3 | **Departure:** tablet 1024 uses the same overlay, as the brief asks. PPO-HELP-DES 2.2 has a full-screen reader below 1100 px | Brief |
| D4 | **Departure:** the expand icon opens a full-width reading view, not a centred modal, so one reader serves the panel and the Help Centre. Back returns to the page with the panel open. If the page holds unsaved work, it opens in a new tab instead | Brief item 3; PPO-HELP-DES 2.4 |
| D5 | Panel search covers this guide. Help Centre search covers published guides the reader may see. Neither searches records or drafts | PPO-HELP-DES 2.4 |
| D6 | The current task comes from the page registration (route and section), never from scraping the screen | PPO-HELP-DES 2.1 |
| D7 | **Departure:** SOP links open in the Document library as the brief asks, where PPO-HELP-DES 2.4 opens a direct link in a new tab. The row shows title, reference, revision, owner, source status and link check. Restricted titles stay hidden | Brief; PPO-HELP-DES 4.2 |
| D8 | **Departure:** ordinary users see "No guide for this page yet" for anything not Published, replacing "being prepared". Report a gap goes to AD-10 support with the page and route. Section 6 records how this meets the carried-over guides | Brief; direction paper 9 |
| D9 | The development draft section shows only with design-workspace access. Drafts never reach Help Centre search, journeys or module counts | Design README |
| D10 | Coverage counts register entries: 216 routes + 152 scopes = 368. The 4 system entries have no guide key. Home counts chapters from the contents outline. The two totals are labelled so they are not confused | Register; PPO-USER-GUIDE-TOC |
| D11 | Gaps are No guide (9) and Stale (3). Drafts are not gaps until the page is built, or 306 rows would bury the work | Brief item 6 |
| D12 | A journey shows Ready only when every module it crosses has a published guide. Only J1 is Ready. Others stay visible as Being prepared | Direction paper 9 |
| D13 | **Departure:** guide review runs in the panel over the running page, so the owner checks the live page and no screenshot is needed. Mark reviewed needs all 13 sections matched, binds to this text and release, and does not publish. Any edit returns the guide to Draft | Brief item 7; design README |
| D14 | Reading text is 16 px in the panel, reading view and phone. Phone inputs are 16 px with 44 px targets. No screenshot appears inside any guide | PPO-HELP-DES 2.2; direction paper 5.3 |
| D15 | Help entry: More › Help › Help Centre, the panel footer and the phone menu. No second Help button in the top bar. Help Centre frames keep the reader's rail with nothing selected. Coverage collapses the rail to fit its grid | PPO-HELP-DES 2.1; P4 |

## 5. Not decided and not drawn

Building the page is not decided. The feedback store behind "Was this helpful?", the SOP metadata connection and the guide review capability are not chosen. Each needs its own decision when the build is requested.

Not drawn: the print layout (Q11); AD-10's support form, What's new and onboarding; the Document library's SOP record (DK-01); phone coverage and guide review, which are desk tasks; help opened over a business modal, which keeps the PPO-HELP-DES 2.4 rule.

## 6. Differences found at lock-in

PR #817 merged the [guidance contract](../design/development/systems/guidance.md) on 1 November 2026, after this page was drawn. Nothing in this record changes that contract, which describes the running application. A build must reconcile these points, and the [component binding](../design/development/component-bindings/2026-11-01-dk07-help-centre-design.json) lists them as gaps:

| Point | Accepted design | Guidance contract | How to read it |
|---|---|---|---|
| Fallback wording | "No guide for this page yet" (D8) | The existing "being prepared" fallback | The wording changes when DK-07 is built, in the contract and the guide render together |
| Guides not yet Published | Ordinary users see none (D8) | Twenty guides carried over from TypeScript stay visible while InReview, marked `shown_before_review` | The carried-over exception stands until each guide is reviewed, so nobody loses help they already have. D8 applies to everything else. Claude's reading at lock-in; Dean has not ruled on it |
| After an edit | The guide returns to Draft (D13) | A content change displays Changes awaiting review, with the recorded review kept in history | Both mean the old review no longer counts and ordinary users stop seeing the guide. The build picks one word, in the contract and the panel together |
| Panel markup | New header, tools, current task and footer | The released panel's markup is an accepted design, and a unit test compares it with the retired guides | Building D2 deliberately changes that accepted markup and its test |

On main, the rewritten Deals guide is InReview, no guide is Published, and the story's statuses are synthetic. Stage 1 of the user guide work is delivered on main, and the Help Centre design is its stage 2.

## 7. Verification

- Claude viewed every desktop, tablet and phone frame and every state in screenshots inside Figma when drawn or after each fix.
- The audit found all text in Roboto apart from one Roboto Mono code line, no overlaps, nothing outside its section, no truncated text in the eighteen frames re-measured on this page (the copied pages keep their own truncation), a linked top bar or compact phone header on every full page, and no prototype link off the page.
- The fourteen parts moved to Components with their instance counts unchanged: Panel header 16, Tools 16, Current task 3, Step 27, SOP row 9, Helpful 5, Panel footer 14, Journey row 24, Result row 11, Journey step 5, Review check 13, Coverage grid header 2 and row 24, Contents row 39. Claude viewed one panel after the move, and its button labels were intact.
- Nineteen capture copies were made on the "Captures (icon-free)" page. 2,514 Font Awesome instances were swapped for `Icon/placeholder`. A separate scan found none left and no prototype link. They were exported at scale 1 with the Figma connector; sizes and hashes are in the [captures README](../reference/ui/help-centre/help-centre-design-r01/README.md).
- Those copies were deleted from Figma after export, on Claude's judgement, because the file is at about 80% of Figma's memory limit and that page is its largest. Earlier pages keep their copies. The retained PNGs are the evidence, and Figma's version history keeps the copies.
- The flows were wired and not played in Present mode.
- Nothing is built, so there is no application, keyboard, screen-reader, zoom or device evidence. The captures are design compositions, not application captures, and set no UI baseline.
- The named Figma version has not been saved. It waits for Dean's word, and this pull request stays a draft until then.
