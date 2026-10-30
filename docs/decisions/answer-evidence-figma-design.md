---
document_id: PPO-AI03-ANSWER-EVIDENCE-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Answer evidence AI-03 design — owner decision

On 24 October 2026 Dean asked for the design of evidence inspection: "Your task is to design and build the "Source and answer evidence inspection (AI-03)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." The AI-01 panel the brief relied on did not yet exist, so Claude stopped and asked. Dean answered: "Yes. Start AI-03 once the Assistant · AI-01 page and its panel parts exist in Figma. Reuse its proposal parts and carry over any changes I make to AI-01 at review." Claude then drew the page in Figma, at the register destination `/assistant/evidence`, covering:
- source chips on every factual statement of an answer;
- an evidence drawer for one statement, beside the assistant panel;
- a full evidence view for the whole answer;
- missing and conflicting evidence;
- the stale, access-changed and untrusted-instruction cases;
- tablet, phone and six states.

Claude drew the page from these sources:
- the design register page [scope-ai-03](../design/development/pages/scope-ai-03.md);
- the [assistant specification](../blueprints/ppo-assistant-specification.md) sections 3 to 7 and 10;
- the decision [PPO-AI-DEC](ppo-assistant-direction.md);
- the [Conversations T2 scope](conversations-t2-scope.md) (T2-3 to T2-5) and [T2b design](conversations-t2b-design.md) (section 5 envelope, section 6 citations, P1 hidden claims);
- the [knowledge search and article design](knowledge-search-article-design.md), rule 1;
- the [Assistant AI-01 design](assistant-figma-design.md), whose frames and parts it copies and reuses;
- [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

On 31 October 2026 Dean accepted the design by choosing the offered answer "Accept, recommended". The question on screen was "Do you accept the AI-03 proposal with the recommended answers to Q1–Q7?" That adopts D1–D18 and the recommended answers to Q1–Q7. Dean's offered answer did not separately name D1–D18; they are the proposal the question refers to.

Scope:
- `scope:AI-03` "Source and answer evidence inspection". No new scope is added.
- Page-register coverage under CRM-06, NFR-01, NFR-02, NFR-03 and NFR-05, within D-027, with specification acceptance AIA-04 to AIA-07 and AIA-16. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, provider call, real data or deployment. Every record, version, time and answer shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AI-03 as a proposal | User decision, 24 October 2026 | Dean's request quoted above |
| Reuse AI-01's parts and carry over its review changes | User decision, 24 October 2026 | Quoted above. AI-01 was accepted as drawn, so no review change needed carrying |
| Decisions D1–D18 | Accepted, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Field excerpts or links only | Resolved as recommended | Show the permitted field values as read: allowlisted fields only, never contact details or excluded notes. A link shows the record as it is now, not what Carl read |
| Q2 How long evidence is kept | Resolved as recommended | Page memory only, like the conversation; cleared on reload, sign-out or identity change, with nothing stored. Thread answers (A2) already keep their sources as rows |
| Q3 Data quality findings from conflicts | Resolved as recommended | Only on request. "Report to Data quality…" prepares a finding the person checks and saves on AD-03. Nothing is created automatically |
| Q4 A simpler phone view for technicians | Resolved as recommended | Not now. Field staff are not in the AI1 pilot, which is CRM only. One sheet with the same words. Revisit with AI4 field knowledge, showing applicability as Knowledge DK-04 does |
| Q5 A rejected citation | Resolved as recommended | In the panel, only that statement is removed, with a note. Threads keep T2-5 and post nothing, because thread messages are stored and shared |
| Q6 Access changed | Resolved as recommended; amends AI-01 | Only the affected statements are withdrawn (specification section 6, T2b P1), and AI-01's access-changed state now matches. Section 5 |
| Q7 Where the full view opens | Resolved as recommended | In the same tab at `/assistant/evidence`, with Back to the answer reopening the panel where it was. A new tab would start without the page memory |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Saved, 31 October 2026 | "Answer evidence — accepted", at Dean's "Yes, save it". Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Answer evidence · AI-03" `2389:273553`, under "— My Work —" after Assistant · AI-01. The page header `2389:273622` holds the conformance declaration; the notes card `2393:872138` in Flows and notes holds D1–D18, Q1–Q7, the flows, the story additions, what is not drawn and the audit. File index: the row "Row / Answer evidence · AI-03" `2845:19549` in the My Work group, after Assistant · AI-01 |
| Desktop 1440 | Answer with source chips, in the AI-01 panel, full length (1440 × 1794) `2391:849391`; evidence drawer, two activities, full length (1440 × 1342) `2392:645`; full evidence view, full length (1440 × 3418) `2393:851975`; missing evidence `2393:853032`; conflicting evidence `2393:853567`; stale answer (1440 × 984) `2393:855684`; access changed, full length (1440 × 1936) `2393:856378`; untrusted instruction, full length (1440 × 1472) `2393:859206` |
| Tablet 1024 | Full evidence view, rail collapsed, sections as a row, full length (1024 × 3546) `2393:860450` |
| Phone 390 | Answer with source chips `2393:863174`; evidence bottom sheet `2393:863416`; full view at Missing evidence `2393:864650` |
| Phone 320 | The same three: `2393:867820`, `2393:868056`, `2393:868322` |
| States | Six cards in section "States": loading sources `2393:869898`; a source that couldn't be read `2393:869927`; a rejected citation `2393:869972`; partial coverage `2393:870004`; chips and support words `2393:870034`; evidence cleared after a reload `2393:870092` |
| Components | Moved at acceptance to the Components page, section "Components · Answer evidence" `2845:19512`, keeping their node IDs and instances: Evidence / Source card `2390:87`; Evidence / Notice `2390:207` (Changed, Withdrawn, Information only, Removed, Unavailable, Checking); Evidence / Missing row `2390:208`; Evidence / Missing card · phone `2393:864641`; Evidence / Statement row `2390:219`; Evidence / Source row `2393:851960`; Assistant / Summary block · with evidence `2391:849248` |
| Prototype | Flows "AI-03 — desktop" (from the answer) and "AI-03 — phone" (from the 390 answer). Desktop: chip Activity · Call the grower to the drawer; chip SYN-PPO-OPP-000118 in Recorded facts to the untrusted case; View all evidence to the full view; Missing, Conflicting and Coverage between the full-view frames; Back to the answer and drawer ✕ to the answer. Phone: the chip to the sheet, View all evidence to the full view, ✕ and Back to the answer |
| Story | Synthetic, as at Tue 13 Oct 2026, signed in as Jamie Park on Hillview Growers SYN-PPO-ORG-000007, consistent with AI-01. Carl's Customer CRM summary at 09:01; the evidence opened at 09:20. Follow-ups: Sam Patel's Call the grower about Thursday and Jamie's Quarterly account review. Stale: SYN-PPO-OPP-000131 saved again at 09:12. Partial coverage: 10 of 23 of Jamie's open opportunities |
| Story additions | New field values on existing records, with no new reference: deal SYN-PPO-OPP-000118 names Noah Clarke as its primary contact (People and the organisation list Priya Shah); deal SYN-PPO-OPP-000131's qualification note holds the quoted instruction, and version 4 at 09:12 by Sam Patel changes its next action. Versions and times for the deals, activities and Priya Shah are synthetic |
| Retained captures | [Answer evidence design r01](../reference/ui/my-work/answer-evidence-design-r01/README.md): eighteen icon-free PNGs with hashes, two of them AI-01's amended frames |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-03` at `/assistant/evidence`, and the evidence drawer inside the AI-01 panel. The AI1 pilot of the assistant specification section 6. Parents CRM-06, NFR-01, NFR-02, NFR-03 and NFR-05 unchanged |
| Page type (r20) | Document & evidence workspace (variant): a right-side inspection drawer for one statement beside the assistant panel, and a full-page evidence view for the whole answer. On phones, a bottom sheet and a full-screen view |
| Reused components | From Assistant AI-01, as linked instances: Panel header, Scope chip, Source chip (Current, Changed, Can't open), Answer header, Prompt, Composer. The Customer CRM summary block is copied and extended. From Components: Rail · Sales, Button, Tag, Shell / Phone header · compact and the Icon set. From Conversations T2: the "A record you can't open" wording. The detached top bar with the proposed Conversations action. New: the parts in section 2 |
| Incoming handovers | A source chip or View evidence on a Carl answer in the AI-01 panel or on `/assistant`; Open evidence in the AI-01 evidence popover; from AI-06, a flagged answer's evidence. Carl's thread answers (T2c) are not drawn here |
| Outgoing handovers | Open record to the source's own page; Refresh answer and Ask again to the AI-01 panel; Report to Data quality… to a prepared finding on AD-03, only when the person chooses it. The page saves, resolves and sends nothing |
| Source authority | The sources listed above. Carl's answers are evidence, never authority |
| Proposed departures | Four, in section 4, accepted: D2, D3, D11 and D13 |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Answer evidence — accepted", saved 31 October 2026 |

## 4. Decisions, accepted

| ID | Decision | Basis |
|---|---|---|
| D1 | Every factual statement carries source chips, naming the record type and reference (an Activity by its summary, a person by name). PPO draws them from the evidence stored with the answer, never from model text. A statement without a valid source is not shown | Specification sections 4 and 6; T2-5; T2b section 6; AI-01 D8 |
| D2 | A statement shows all its sources together. The two follow-ups are one statement citing both activities. **Departure:** this rewords AI-01 D4's two Next action items into one (section 5) | The brief; specification section 6 |
| D3 | The evidence drawer is a 440 px inspection drawer on the right, over the record with a light scrim, so the answer stays visible for comparison. ✕ or Esc closes it and returns focus to the chip. **Departure:** it stacks beside the AI-01 panel | PPO-UI-CONFORMANCE; specification section 4 |
| D4 | A source card shows type, title and reference; support in words with a one-line reason; fields used; the permitted field values as read; version, source time, retrieved time and whether it is still current; and Open record. Support is shown apart from currency | Specification section 6; knowledge search rule 1 |
| D5 | The full evidence view holds coverage, numbered statements with their support, sources grouped by record, missing evidence, conflicting evidence, and definitions and general knowledge, with an on-page index, Back to the answer and Refresh answer | The brief; specification section 6 |
| D6 | Coverage says what was read, what came back, what isn't covered, what is never given to Carl, and when access was checked. Never "all history", counts beyond the page or "no problems" | Specification section 6; AIA-05; T2b section 5 |
| D7 | Missing evidence has a reason in words: Not covered, Not permitted, Not recorded, and Beyond the page, shown even when nothing was left. Each says where to look | The brief; specification sections 3 and 6 |
| D8 | Conflicts sit side by side with both values as recorded, version, read time, a "Records disagree" marker and Open buttons. Carl doesn't choose; the owning record is corrected on its own page | The brief; specification section 6; AIA-04; Stakeholders CS-03 |
| D9 | PPO definitions such as "Next action: Needed", and any general knowledge, have their own section and tag and never a record chip | Specification sections 3 and 6 |
| D10 | A source changed after the answer: a notice in the answer and the drawer, chips switch to Changed, and the card shows the values as read and which field changed. Refresh answer asks Carl again | Specification section 6; AI-01 stale state |
| D11 | Access changed withdraws only what it affects: T2b P1's wording replaces the statement, its chip reads "A record you can't open", a notice gives the time, and that record is cleared from the conversation. **Departure:** from AI-01's whole-answer state (section 5) | Specification section 6; T2b P1 |
| D12 | Untrusted text is quoted exactly, labelled untrusted and marked "This text was treated as information only". It never selects a tool, widens access or confirms anything | Specification section 6; AIA-07; T2b section 5 |
| D13 | A statement citing a record outside the answer's evidence is removed before display, with a note. The reason is logged as a code, not the text. **Departure:** T2-5 posts no answer at all in threads; the panel removes only the statement (Q5) | Specification section 6; T2b section 6 |
| D14 | Evidence shows only after the access recheck. A source that can't be read is "Not checked", never "unsupported", with Try again for that source alone | Specification section 6; AIA-16 |
| D15 | On phones the drawer becomes a white bottom sheet with a light grey heading row, stacked cards and a full-width 48 px View all evidence. The full view is a full screen with the compact record header and 44 px section pills | Phone header amendment; Dean's 19 October sheet rule |
| D16 | Evidence stays with its answer in the tab and clears on reload, sign-out or identity change; `/assistant/evidence` then says it is no longer available | Specification section 7; AI-01 D16 |
| D17 | Chips are named buttons; the drawer is a dialog that holds and returns focus; status is announced once; support always has words | Specification section 4; AIA-19 |
| D18 | New parts moved to the Components page at acceptance, and AI-01's parts are used as linked instances | The Components page rule of 17 October 2026 |

## 5. Changes carried into the accepted AI-01 page

D2 and Q6 change frames of the accepted [Assistant AI-01 design](assistant-figma-design.md). That decision has a pointer to this section. Its r01 captures stay unchanged as the record of what was accepted on 24 October 2026.

- **Summary block `2368:812083`:** "Next actions (recorded)" is now one statement citing both activities. This is the shared component, so it changes every instance: the AI-01 frames and the two instances on the still-open Voice capture AI-05 page. The 13 capture copies on the Captures page were detached first, so they did not change.
- **Access-changed state `2379:886801`:** the notice now reads "Your access to 1 source changed at 09:20", followed by the withdrawn statement. The frame grew from 536 to 614 px high, and nothing in its section overlaps.
- **AI-01 notes card `2380:9379`:** a line records the amendment.
- **Captures:** images 17 and 18 in [design r01](../reference/ui/my-work/answer-evidence-design-r01/README.md) show the amended AI-01 frames.

The AI-01 named version "Assistant — accepted" predates these changes. "Answer evidence — accepted" is the first named version to contain them.

## 6. Not decided and not drawn

- **Building the page.** No route exists, and the build order is not decided.
- **Prerequisites for a build:** the AI1 panel and its organisation-scoped evidence envelope (AI-01 decision), per-claim support wording, and an access recheck when evidence opens. The support words are a design requirement: who or what assigns "Supports" or "Partly supports" is not decided, and valid source membership alone does not prove a claim (specification section 6).
- **Not drawn:** evidence for Carl's thread answers (T2c, each reader's own access); the Data quality finding form (AD-03); the deal and activity pages themselves; 200% zoom and keyboard-only views.
- **AI-02 reuse:** the Proposal review AI-02 proposal notes that it will reuse these parts. It is not changed here.
- **The Conversations action** is part of the proposed top-bar shell amendment, as on the other pages.

## 7. Audit

Before acceptance, on 24 October 2026, Claude screenshotted every frame and state inside Figma. A scan found 2,387 texts, all visible ones in Roboto, no leftover placeholder words, no text overflowing or clipped outside a scroll viewport, no overlaps and nothing outside its section. 22 prototype links were set and 16 copied links to other pages removed. Frames that show a long page or answer at 960 px simulate scrolling by offsetting their content.

## 8. Verification

- The eighteen captures are copies on the "Captures (icon-free)" page at y = 745,000 (`2845:24753` to `2845:26637`). Prototype links were removed and every Font Awesome instance was swapped for `Icon/placeholder`; a final scan found none left and no link on any copy. The Captures page's five flow starting points were kept.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/my-work/answer-evidence-design-r01/README.md). Claude viewed captures 04 and 16 and did not view the others individually.
- After the AI-01 changes Claude viewed the summary block and the access-changed state inside Figma. The other AI-01 frames using the block were not viewed again.
- The named Figma version "Answer evidence — accepted" was saved in the Figma desktop app on 31 October 2026 at Dean's "Yes, save it", in answer to "Shall I save the named version "Answer evidence — accepted" in Figma?", and confirmed at the top of version history. The page header and File index row were updated first, so the version carries the accepted wording.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
