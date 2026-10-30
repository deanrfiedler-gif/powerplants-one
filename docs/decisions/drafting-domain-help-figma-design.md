---
document_id: PPO-AI04-DRAFTING-DOMAIN-HELP-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Drafting and domain help AI-04 design — owner decision

On 24 October 2026 Dean asked for the design of the assistant's drafting and domain flows: "Your task is to design and build the "Domain assistance and drafting flows (AI-04)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." He named three flows:
- an email reply drafted from the messages a person selects;
- a project update drafted in Stakeholder updates PJ-08;
- equipment help for a technician, answered only from reviewed Knowledge articles that apply to the unit.

Claude drew the page from these sources:
- the design register page [scope-ai-04](../design/development/pages/scope-ai-04.md);
- the [assistant specification](../blueprints/ppo-assistant-specification.md) sections 6, 7 and 9, slices AI3 and AI4;
- the decision [PPO-AI-DEC](ppo-assistant-direction.md), A1 and A2;
- the [naming and communication assistance blueprint](../blueprints/naming-and-communication-assistance.md) sections 4.5 to 4.7;
- the accepted [Emails EC-01 design](emails-figma-design.md) and its amendment A1, and [ADR-0059](ADR-0059-email-sending-from-ppo.md);
- the accepted [Stakeholder updates PJ-08 design](stakeholder-updates-figma-design.md);
- the [knowledge search and article design](knowledge-search-article-design.md);
- the accepted [Escalations SV-08 design](escalations-figma-design.md);
- the accepted [Assistant AI-01 design](assistant-figma-design.md), whose panel and parts it reuses;
- [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

On 31 October 2026 Dean accepted the design by choosing the offered answer "Accept, lock it in". The question on screen was "Do you accept the AI-04 design with D1–D14 and the recommended answers to Q1–Q8?" That adopts D1–D14 and the recommended answers to Q1–Q8.

Scope:
- `scope:AI-04` "Domain assistance and drafting flows". No new scope is added.
- Parent requirements CRM-03, OUT-17, PRJ-07, OUT-11, DOC-04, DOC-06, SVC-06, NFR-01 and NFR-03, within D-027, with specification acceptance AIA-07. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, provider call, mailbox connection, sending, real data or deployment. Every record, version, time, article, email and answer shown is synthetic. The steps and values in the frames are design placeholders, not validated technical instructions.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AI-04 as a proposal, with three flows | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D14 | Accepted, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Customer emails in the pilot, or internal only | Resolved as recommended | Customer replies are allowed as correspondence, because the person reads, edits and sends them from their own mailbox (ADR-0059). They wait for ADR-0059's E-S2 stage; until then drafts are synthetic only. Customer notices (M1–M4) are never drafted into a person's mailbox |
| Q2 A visible "assistant drafted" note to the customer | Resolved as recommended | No. It is recorded internally on the send receipt and in History ("drafted with Carl, edited and sent by Jamie Park"). The customer receives the person's email |
| Q3 Which knowledge Carl may use for technicians | Resolved as recommended | Steps only from validated procedures that apply 5 of 5. Reviewed references (lessons, current product notes) show as reference without steps. Hypotheses show as "Not validated" without steps. Overdue, superseded, expired or withdrawn articles are not used |
| Q4 Who reviews assistant-drafted project updates | Resolved as recommended | PJ-08 unchanged: the drafter checks each statement against its source and prepares; a second person with the customer send duty approves and sends. No extra AI reviewer |
| Q5 Story clashes with drawn pages | Resolved as recommended | Corrected when those pages next change. Section 6 |
| Q6 Whether `/assistant/drafts` is a page | Resolved as recommended | Not in the pilot. Drafts live in their host editors: an unsent email draft stays in the composer (no saved drafts, ADR-0059 section 3) and PJ-08 lists its own revisions. Revisit if drafts must outlive a session |
| Q7 Drafting from a message a colleague shared | Resolved as recommended | Yes, only on the record it was shared to (EC-01 D5), and only when the person ticks it |
| Q8 Whether Carl fills in the SV-08 case | Resolved as recommended | It prefills a new case form only (unit, request, the person's label reading, articles checked). The person reviews and saves it; SV-08's rules are unchanged |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Saved, 31 October 2026 | "Drafting & domain help — accepted", at Dean's "Yes, save it". Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Drafting & domain help · AI-04" `2393:864503`, under "— My Work —" after Proposal review · AI-02. The page header `2393:864504` holds the conformance declaration; the notes card `2398:887814` in Flows and notes holds D1–D14, Q1–Q8, the story, the flows and what is not drawn. File index: the row "Row / Drafting & domain help · AI-04" `2915:438773` in the My Work group, after Proposal review · AI-02 |
| Desktop 1440 | D1 Emails, 2 of 3 messages ticked `2394:4952`; D2 draft in the composer, sources and one gap `2394:870315`; D3 Stakeholder updates, Update 6 drafted with each statement's source and two facts not found `2395:871158`; D4 equipment help, checks from a validated procedure `2395:875515`; D5 hypothesis, conflicting evidence and a past fix `2395:878368`; D6 escalate `2395:878833`; D7 an instruction in a ticked message ignored `2394:873258` |
| Tablet 1024 | The email draft with the rail and side menu collapsed `2394:874031` |
| Phone 390 and 320 | 390: My jobs visit with the Ask Carl sheet `2396:872168`, answer `2396:872460`, scrolled `2396:872662`, escalate `2396:872847`. 320: answer `2396:873027`, escalate `2396:873230` |
| States | Before drafting `2397:3293`; thinking in the composer `2397:3155` and the panel `2397:3339`; no permitted messages selected `2397:3164`; edited by you `2397:3312`; discard asks first `2397:3322`; provider unavailable `2397:3257`; source changed `2397:3200`; budget reached `2397:3278`; nothing applicable `2397:3219` |
| Parts | Moved at acceptance to the Components page, section "Components · Drafting & domain help" `2915:13899`: Drafting / Selectable message `2393:871250`, Provenance banner `2393:871281`, Source line `2393:871282`, Gap row `2394:871519`; Domain help / Article card `2393:871290`, Check step `2393:871301`, Past fix row `2393:871307` |
| Prototype | Flows "AI-04 — desktop" (D1 to D2 and back; ticking message 1 to D7), "AI-04 — desktop, equipment" (D4 to D5 to D6) and "AI-04 — phone" (the visit to the answer, scrolled and escalate, and Back). 12 links |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Jamie Park replies to Priya Shah (Hillview Growers) on `SYN-PPO-PRJ-000014`, where no training date is recorded. Jamie Rossi drafts Update 6 "October progress" for `SYN-PPO-PRJ-000024`, recipient Jo Lin. Casey Ward asks about Shade screen motor M-3 `SYN-AST-000145` after request `SYN-TKT-000105`, and gets the checks of `SYN-KA-000012` r02, the lesson `SYN-KA-000011`, the hypothesis `SYN-KA-000013` and the failed fix `SYN-WO-000027`. New story facts: Priya's thread and its three messages, M-3's recorded firmware 2.2.0, the work order `SYN-WO-000027`, and Jo Lin's address |
| Retained captures | [Drafting and domain help design r01](../reference/ui/my-work/drafting-domain-help-design-r01/README.md): fifteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-04`, register destination `/assistant/drafts`, not drawn as a page (Q6). Specification slices AI3 and AI4. Parent requirements as listed above, unchanged. No capability added: every entry point is hidden without the AI-01 assistant capability |
| Page type (r20) | Record detail with the AI-01 assistant side panel (Equipment; `/assistant` on phones from My jobs), plus amendment frames on a work queue and persistent detail (the Emails composer) and a record editor (the PJ-08 draft). Review inside each draft: every statement beside its source |
| Reused components | Shell v2 (Rail · Sales, Projects and Service; the top bar with Conversations and the AI-01 Ask Carl action; Shell / Phone header · compact). AI-01 parts: panel header, scope chip, prompt, answer header, composer. Emails EC-01 thread row, record chip and the A1 composer. PJ-08 record layout, facts bar and sections. My jobs FI-01 phone visit. Button, Tag, Record / Field, Section heading, View tab, Grid / Checkbox, Conversations / Avatar. New: the seven parts in section 2. The Gap row is modelled on AI-03's Missing row, not an instance of it |
| Incoming handovers | Email: only the messages the person ticks in a thread they can read, and the permitted records linked to it. PJ-08: the project's key dates, stage readiness, training and as-built, and customer questions. Equipment: the unit's record, validated or reviewed Knowledge articles with applicability, and permission-filtered service history for that unit |
| Outgoing handovers | Email: an editable draft in the normal composer; Send is the person's ordinary send (ADR-0059 correspondence, A1 tracking unchanged). PJ-08: a draft revision in the editor; Prepare to send and second-person approval unchanged. Equipment: links to the articles, the unit, the service history and SV-08 (a prefilled new case the person saves). It never sends, approves, prepares, saves, changes settings, issues a quotation, orders parts, gives technical approval or makes a financial commitment |
| Source authority | The sources listed above |
| Proposed departures | D1–D14 in section 4, accepted |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Drafting & domain help — accepted", saved 31 October 2026 |

## 4. Decisions, accepted

| ID | Decision | Basis |
|---|---|---|
| D1 | Each flow lives in its host page: the Emails composer, the PJ-08 editor, and the AI-01 panel (desktop) or `/assistant` (phone). There is no separate drafts page (Q6) | Specification section 9 |
| D2 | Tick messages, then "Draft a reply with Carl". A selection bar states the count and "Selected messages only": Carl reads the ticked messages and the linked records the person can open, nothing else in the mailbox | Specification section 9, AI3; EC-01 D5 |
| D3 | The draft opens marked "Drafted by Carl · review before sending", with the time, what was read and what each source was used for. A fact Carl can't find is a gap row, and the draft marks it in its text rather than guessing | Specification section 6 |
| D4 | Send is the ordinary Send. The A1 composer is unchanged, the email carries no assistant note, and edits update the banner | ADR-0059 sections 1–5; A1-D4 |
| D5 | Retrieved text is untrusted. An instruction in a message is only message text: the draft ignores it, a banner quotes it, the message is listed as "Not used", and nothing is attached, opened or read because a message asks | Specification section 6; AIA-07 |
| D6 | "Draft with Carl" is offered beside "Write it myself" on an empty PJ-08 revision. It never touches a revision the person has changed | PJ-08 D2, D3 |
| D7 | Every customer statement shows its source: record, value used and read time. Facts not found are listed above the editor, and what is never copied is stated. Dates stay typed from key dates, read only | PJ-08 D3, D5; specification section 6 |
| D8 | PJ-08 approval is unchanged. Carl can't prepare, approve or send. A source that changes after drafting marks the draft stale, and Prepare waits until the statement is checked | PJ-08 D4, D5; D-025 |
| D9 | "Ask Carl" about one unit: the AI-01 panel on the equipment record, or on a My jobs visit More › Ask Carl lists the job's equipment, then opens `/assistant` | AI-01 D1–D3 |
| D10 | Strictest evidence first: steps only from a validated procedure that applies 5 of 5, each citing its article and step, then the stop rule; reviewed references; "Not validated · hypothesis" articles without steps; conflicts left unresolved; past fixes on this unit that didn't work; open requests; and articles not used, with the reason | Specification section 9, AI4; SVC-06; DOC-04; DK-04 decisions 1–3 |
| D11 | Nothing applies: Carl gives no checks from general knowledge. It says what it checked and offers "Escalate in SV-08" and "Correct the record" | Specification section 6; SV-08 |
| D12 | Phone: `/assistant` under the compact header, the AI-01 composer at 16 px, and a sticky full-width "Escalate in SV-08" at 48 px when the answer hands over | AI-01 phone; specification section 4 |
| D13 | States in words: thinking, no permitted messages selected, provider unavailable, budget reached, source changed, nothing applicable, edited by you, and Discard asks first | AI-01 states |
| D14 | Seven new parts, moved to Components at acceptance | Components page rule |

## 5. Corrections made at lock-in

Dean accepted the design as presented on 24 October. Claude made these corrections on 31 October before capturing it, and they are on the page and in the captures:

- **Reference form.** The new work order was drawn as `SYN-PPO-WO-000027`. [PPO-REFERENCE-NAMESPACES-DEC](readable-reference-namespaces.md) requires new references to take the new form, so it is now `SYN-WO-000027`. Existing references are unchanged.
- **Stale reference on the 320 frames.** The two 320 frames still showed AI-01's `SYN-PPO-ORG-000007` under the scope chip. They now show `SYN-AST-000145`.
- **ADR-0059.** The page called it proposed. It was accepted on 26 October, after the drawing, so the header, D4 and Q1 now say so. Q1's substance is unchanged, except that the wait for ADR-0059's acceptance has gone.
- **AI-03 parts.** The page header and Claude's summary of 24 October said the page used AI-03's Missing row and Notice. It uses neither; the Gap row is modelled on the Missing row. The header and notes now say so.

## 6. Not decided and not drawn

- **Building the page.** No build order is decided. AI3 depends on the Email and Calendar journey and ADR-0059's stages; AI4 depends on curated references and permission-filtered service evidence (specification section 9).
- **Story clashes, Q5, to correct when those pages next change:**
  - Stage 2 training belongs to `SYN-PPO-PRJ-000024` (Riverbend, PJ-09, held Mon 12 Oct), so Priya asks about training on `SYN-PPO-PRJ-000014`, which records no training date. Dean's brief said "stage 2 training" at Hillview.
  - CP-4 is installed on Thu 15 Oct (EQ-01), so on Tue 13 Oct M-3 is drawn on CC-4. Dean's brief said "the CP-4 system".
  - My jobs places `SYN-PPO-WO-000040` at Glasshouse 3; Equipment and CP-04 put its motors at SYN Glasshouse 4, which is drawn. The phone visit frame's reference line was changed to match.
  - CP-03 shows a different Update 5 for `SYN-PPO-PRJ-000024` than PJ-08; PJ-08 is followed.
- **Not drawn:** the SV-08 new-case form, the Equipment record's other tabs, Reply all and Forward with Carl, drafting on phone (PJ-08 Q3), voice (AI-05), authoring an article from an escalation (DK-05), tablet equipment help and 200% zoom.
- **Known limit:** the Escalate and action buttons inside the phone answer are the shared 40 px Button; the sticky Escalate is 48 px. The 44 px target needs checking when the page is built.
- **Data in the frames** is synthetic and sets no operating rule.

## 7. Audit

Before acceptance, on 24 October 2026, Claude screenshotted the main frames inside Figma. A scan found 1,342 visible texts, all in Roboto, no overlaps and nothing outside its section; 13 copied links to other pages were removed and 12 prototype links set. That scan did not catch the stale reference in section 5. Claude found it by viewing capture 14 at lock-in, then scanned every frame and capture copy for it.

## 8. Verification

- The fifteen captures are copies on the "Captures (icon-free)" page from y = 1,020,000 (`2915:438782` to `2915:448871`). Prototype links were removed and every Font Awesome instance was swapped for `Icon/placeholder`; a final scan found none left and no link on any copy. The three flow starting points the copies added to that page were removed.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/my-work/drafting-domain-help-design-r01/README.md). Claude viewed captures 05, 13 and 14 after export; capture 15's content was viewed inside Figma. The others were not viewed individually after export.
- Claude did not play the flows in Present mode.
- The named Figma version "Drafting & domain help — accepted" was saved in the Figma desktop app on 31 October 2026 at Dean's "Yes, save it", in answer to "Shall I save the named version "Drafting & domain help — accepted" in Figma?", and confirmed at the top of version history. The page header and File index row were updated first, so the version carries the accepted wording.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
