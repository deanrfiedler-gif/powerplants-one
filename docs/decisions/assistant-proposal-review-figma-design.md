---
document_id: PPO-AI02-PROPOSAL-REVIEW-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Proposal review AI-02 design — owner decision

On 24 October 2026 Dean asked for the design of the assistant's review page: "Your task is to design and build the "AI proposal review and saved outcomes (AI-02)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma, covering:
- the review form inside the accepted AI-01 panel at 1440, the full-width surface at 1024 and the full-screen phone view at 390 and 320;
- field provenance, the Needs input block, the not-saveable value and the changed-since-prepared comparison;
- the outcomes Saving, Saved, Rejected, Outcome unknown and Expired;
- Your proposals, the saved outcomes list;
- six panel states.

Claude drew the page from these sources:
- the design register page [scope-ai-02](../design/development/pages/scope-ai-02.md);
- the [assistant specification](../blueprints/ppo-assistant-specification.md) §3–§7 and §10, and the [assistant direction](ppo-assistant-direction.md) (PPO-AI-DEC r03: the model has no confirmation capability and there is no privileged AI identity);
- the accepted [Assistant AI-01 design](assistant-figma-design.md) and its hand-off frame, whose panel and parts this page reuses;
- the [pipeline stage model](crm-pipeline-stage-model.md), the [Deals design](deals-figma-design.md), the [Deal record design](deal-record-page-design.md) and the [readable reference rule](readable-reference-namespaces.md);
- Dean's instruction on 24 October, once AI-01 existed: "use the AI-01 source chips and note the AI-03 reuse as pending."

On 31 October 2026 Dean accepted the design by choosing the offered answer "Accept with recs". The question on screen was "Do you accept the AI-02 proposal?" The answer was offered as "I accept the Proposal review · AI-02 design with D1–D19 and your recommended answers to Q1–Q7. Record my words and follow the lock-in protocol." That adopts D1–D19 and the recommended answers to Q1–Q7.

Later on 31 October Dean asked: "Give the pages an audit and polish to determine the following: 1. If any improvements or refinements can be applied. 2. If any new and innovative features could be included. 3. If they could be made more professional. 4. If there are any gaps." Claude polished this page and proposed features. Dean then chose the offered answer "Accept, draw F1–F3" to "Do you accept the polish and want features F1–F3 drawn?" That accepts the polish in section 7 and asked for F1–F3 as a proposal. Claude drew them, and Dean chose the offered answer "Accept F1–F3" to "Do you accept F1–F3 with the recommended answers to Q8–Q10?" That adopts F1–F3 and the recommended answers to Q8–Q10 (section 9).

Scope:
- `scope:AI-02` "AI proposal review and saved outcomes", at `/assistant/proposals` for Your proposals. The review itself sits inside the AI-01 panel, or `/assistant` on phones. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain. The design elaborates CRM-01, CRM-02, NFR-01, NFR-05, NFR-08 and NFR-09, as the specification's acceptance table does. Acceptance procedures AIA-08 to AIA-15 and AIA-19 remain Not run.

This is a design decision. It authorises no application code, route, proposal store, migration, permission, capability, grant, provider request, paid use or deployment. Every record, reference, time and operation identifier shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the proposal review page AI-02 | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D19 | Accepted as drawn, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which record types come next | Resolved as recommended | An activity on an existing deal or organisation next (the same Activity command, few fields, low risk), then service requests once SV-01's create command is built and accepted. Nothing that issues a quotation, moves a stage, sends a message or changes equipment settings |
| Q2 Proposal expiry | Resolved as recommended | 15 minutes for a ready draft, as the specification proposes, with the expiry time shown and the person's edits kept on Prepare again. Revisit with the review times measured in the AI1 evaluation. Unsubmitted payloads are removed within 24 hours; an unresolved save never expires |
| Q3 Proposals in My Work | Resolved as recommended | Only Outcome unknown, as one "needs attention" item linking to Your proposals. A saved opportunity and its follow-up already appear there as real records; rejected and expired drafts stay in Your proposals only |
| Q4 Preparing for other owners | Resolved as recommended | Only when the person names an eligible owner, resolved through the normal owner choices and tagged Your request; never by default. PPO checks eligibility at save, the person who confirms is the creator, and existing records' owners are never transferred |
| Q5 First stage label | Resolved as recommended | Enquiry until the accepted stage model is built. The field shows what the server returns, so it becomes Discovery with no design change |
| Q6 Align AI-01's D5 prompt with this story | Resolved as recommended; applied | A text-only change to AI-01 D5 and D6, made at this lock-in. Section 6 |
| Q7 Who can see Your proposals | Resolved as recommended | Only the person who prepared them. Administrators see the business audit and receipts, not drafts or chat |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Audit and polish | Accepted, 31 October 2026 | Dean's answer, quoted above. Section 7 |
| F1–F3 | Accepted, 31 October 2026 | Dean's answer, quoted above. Section 9 |
| Q8 How F1 decides what is similar | Resolved as recommended | PPO compares title and need words against the customer's open deals, so it works with the provider off and gives the same answer every time. Carl may explain a match but cannot add or hide one. "Not a duplicate" stays on the proposal, not on the deal |
| Q9 Whether F2 keeps your words after a reload | Resolved as recommended | No. Chat stays in page memory (specification §7), so after a reload the popover says "From your request" without the quote. The saved command keeps only the field values |
| Q10 Whether F3 is the default | Resolved as recommended | The full form stays the default in the AI1 evaluation, with Focus review as a choice. It becomes the default only if the evaluation shows no rise in corrections (specification §10) |
| Named Figma version | Not yet saved | "Proposal review — accepted" waits for Dean. Section 8 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Proposal review · AI-02" `2389:278889`, under "— My Work —", after Answer evidence · AI-03. The page header `2389:278890` holds the conformance declaration; the notes card `2393:871314` in Flows and notes holds D1–D19, Q1–Q7, the flows, what is not drawn and the checks. File index: the row "Row / Proposal review · AI-02" `2847:388971` in the My Work group |
| Desktop 1440 | Request typed `2393:141`; review form, full length (1440 × 2749) `2393:747`; Ready `2866:439554`; not saveable `2393:854230`; changed since prepared `2393:854941`; Saving `2393:856956`; Saved `2393:857489`; Outcome unknown `2393:858060`; Expired `2393:858597`; Your proposals `2393:859919` |
| Tablet 1024 | Full-width surface with the review form in one 640 px column, full length (1024 × 2489) `2393:861117` |
| Phone 390 | Review form full screen, full length `2393:862389`; Saved `2393:862770`; Outcome unknown `2393:862977`; not saveable `2866:443452`; changed since prepared `2866:443788`; Your proposals `2866:444187` |
| Phone 320 | Review form scrolled to the follow-up `2393:863725`; Saved `2393:864108`; Outcome unknown `2393:864317` |
| States | Fourteen panel-width cards in section "States": validation errors `2393:865525`; permission denied `2393:865829`; duplicate click `2393:866121`; access changed `2393:866419`; rejected `2393:866711`; superseded `2393:867004`; Due date needed chosen `2866:440125`; no matching contact `2866:440409`; still not confirmed `2866:440722`; an earlier save blocking a new one `2866:441024`; Discard draft `2866:441330`; changing the customer `2866:441628`; Your proposals nothing to show `2866:441926`; Your proposals failing to load `2866:442230` |
| Components | Moved at acceptance to the Components page, section "Components · Assistant" `2388:6065`, keeping their node IDs and instances: AI-02 / Provenance tag `2391:3917`; Review field `2391:3982`; Comparison row `2391:3983`; Outcome card `2391:4077`; Proposal row `2391:4114`; Compact field row `2877:6283` |
| Prototype | Flows "AI-02 — desktop" (from Request typed) and "AI-02 — phone" (from the 390 review), with no links off the page. Send to the review; Due time to Ready; Ready's Create opportunity to Saving; Saving to Saved; Saved to Your proposals; Keep, Leave out, Refresh preview and Prepare again back to the review; Check save status to Saved. Flow "AI-02 — focus review" starts on F3: Go to due time to Ready, Show all fields to the full form. On the phone flow, Create opportunity stands in for "after a time is chosen" because the phone has no Ready frame |
| Story | Synthetic, Tue 13 Oct 2026 from 09:05 Brisbane time, signed in as Jamie Park on Hillview Growers SYN-PPO-ORG-000007. The request: "Create an opportunity for Hillview Growers to extend climate screens to Glasshouse 5. Assign it to me. I spoke to the head grower by phone; follow up on 21 October." The head grower resolves to Priya Shah. Sites on record are SYN Glasshouse 4 and SYN Hillview Growers, so Glasshouse 5 stays unknown with Jamie's reason. The due time is asked for. The opportunity saves as SYN-OPP-000357, the next number after Deals' 000351–000356. A branch changes the owner to Sam Patel. Your proposals also shows Coastal Berry Farms (SYN-PPO-ORG-000023) drafts, which created no records. Existing references are unchanged |
| Retained captures | [Proposal review design r01](../reference/ui/my-work/assistant-proposal-review-design-r01/README.md): twenty-one icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-02` AI proposal review and saved outcomes. The reviewed-creation part of PPO-AI-SPEC §3 AI1: one opportunity and its initial follow-up through the existing `createOpportunity` command. No new scope; parent requirement IDs unchanged |
| Page type (r20) | Form / guided workflow, with Review / comparison for "Changed since prepared" and Register / worklist for Your proposals. Hosted in the AI-01 panel (Work queue + persistent detail variant) |
| Reused components | The AI-01 panel and parts (Panel header, Scope chip, Source chip, Prompt, Composer, Answer header), Shell v2 Rail · Sales, the top bar with the Conversations action, Shell / Phone header · compact, a copy of the Hillview Growers record, Button, Tag, Record / Field, Record / Filter chip and the icon set. The Review field follows Job pack / Form field. New: the six components listed in section 2 |
| Incoming handovers | From AI-01: "Create an opportunity…" gives Carl's `prepare_opportunity` result, a persisted Draft proposal with no business record. Choices come from permitted reads made as the person signed in |
| Outgoing handovers | Create opportunity confirms with the proposal ID, its version and the hash of the exact displayed command; PPO runs `createOpportunity` as that person. Saved links to the opportunity on Deal record CR-01 and Deals CR-04 and to the follow-up activity. Check save status goes to the receipt service. Prepare again starts a new Draft. Never: a save by Carl, a privileged AI account, a calendar invitation, a customer message, or a value or expected-close field |
| Source authority | The decisions and specification listed above. Carl's drafts are proposals, never authority |
| Proposed departures | Five, accepted: section 4 and F3 in section 9 |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Proposal review — accepted", not yet saved |

## 4. What the design shows

| ID | Decision | Basis |
|---|---|---|
| D1 | The review replaces the conversation inside the AI-01 panel, with "← Conversation" to go back. **Departure:** not a separate desktop page, so the record stays beside it | Specification §4; AI-01 D9 |
| D2 | Every field shows Your request, Existing record, Proposed default or Needs input, in words and an icon. **Departure:** a new part beside each label | Specification §4 |
| D3 | Customer context, then opportunity, then initial follow-up. Opportunity owner and follow-up owner are separate fields. A short list says what Create opportunity will do | Specification §5 |
| D4 | An unknown site or contact needs the person's own reason. Carl asks in the conversation and never drafts it | Specification §5 |
| D5 | Source channel is one of five, with a basis. Asking Carl is not the source | Specification §5 |
| D6 | The due time is never invented: type one or choose Due date needed. Create stays disabled, with the reason in words | Specification §5; AIA-09 |
| D7 | PPO chooses the pipeline and first stage, shown read-only. **Departure:** it reads Enquiry, the runtime stage, until the accepted stage model is built | Specification §2, §5; stage model |
| D8 | What can't be saved is named, with Keep and Leave out, and Create waits for the choice | Specification §5; AIA-10 |
| D9 | A changed source or selection shows a comparison, with Refresh preview. Create stays disabled until then; edits are kept; the refreshed preview supersedes the old one | Specification §7 |
| D10 | Confirming locks the exact command. A second click, tab or retry reuses the same operation | Specification §7; AIA-11, AIA-14 |
| D11 | Phones: full screen, 16 px inputs, 48 px controls. **Departure:** a sticky bottom bar of full-width buttons, with Discard draft in More and the outcome card's buttons moved into the bar | Specification §4; phone header amendment |
| D12 | Every outcome comes from PPO. Saved needs the receipt's real reference and links. Rejected shows PPO's reason and keeps the draft. Permission denied is generic | Specification §4, §7 |
| D13 | Outcome unknown shows "The save result is not yet confirmed" and Check save status, which reconciles and never re-creates. It stays in Your proposals across restarts | Specification §7; AIA-14, AIA-15 |
| D14 | A ready draft lasts 15 minutes. Expiry never blocks checking a save already submitted | Specification §7 |
| D15 | Your proposals lists the person's own proposals from the last 30 days, with one action per outcome, from the panel's More menu and `/assistant/proposals` | Dean's brief; specification §7 |
| D16 | Access that changes during review clears the draft, with generic wording | Specification §6, §7; AIA-06, AIA-13 |
| D17 | The story and references in section 2 | Reference rule; synthetic fixtures |
| D18 | AI-03 was accepted the same day and keeps AI-01's Source chip as its way in, so no part here is replaced: a source chip on this page opens AI-03's evidence view | Dean, 24 October, quoted above; AI-03 decision |
| D19 | The request text is Dean's brief, not AI-01 D5's. Q6 aligned AI-01 | Dean's brief |
| Rule added in the polish | A value the person edits is tagged Your request | Accepted polish; specification §7 (editing creates a successor) |

## 5. Not decided and not drawn

Building the page is not decided. The specification's proposed HTTP surface, proposal store and migration remain proposals. A capability for AI-01 (its Q4) would apply here too and brings the access-review chain in `AGENTS.md` when built.

Not drawn: the microphone (AI2); the panel More menu itself, which AI-01 draws and to which Your proposals is added; Your proposals at 1024; a phone Ready frame, and phone Saving and Expired, which use the same outcome card; keyboard focus order and 200% zoom; hosted demo use; offline.

## 6. Amendment to AI-01

Q6 adopted a text-only change to two frames of the accepted AI-01 page, recorded in [its decision](assistant-figma-design.md):
- D5 `2371:1628`: the visible message is now Jamie's reason at 09:06, Carl answers at 09:06, and the draft card reads Needs details · 1, title "Glasshouse 5 climate screen extension" (Proposed default), follow-up "Call Priya Shah on Wed 21 Oct", still needed "The follow-up time".
- D6 `2371:2224`: Needs details · 1, and the hint reads "Create opportunity unlocks when the follow-up time is added."

AI-01's r01 captures keep their bytes. Images 15 and 16 in this page's captures show the amended frames.

## 7. Audit and polish

When the page was drawn, Claude screenshotted most frames inside Figma and checked fonts, text overflow, overlaps and section bounds. At Dean's request on 31 October, after acceptance, Claude audited it again.

- **Corrected:**
  - the exact-command cards abbreviated the command; they now show the full reason, need summary, source basis, pipeline and follow-up summary;
  - the source basis held a call date Jamie never gave; it now reads "Jamie Park spoke to Priya Shah, head grower, by phone.";
  - Saved worded the follow-up differently from the review;
  - two character counts (93 and 68);
  - Expired repeated Create and Discard in its footer;
  - the scope row on Your proposals, which lists every customer;
  - the duplicate Conversation link on phones;
  - the Superseded card promised a list row that does not exist.
- **Added:** Ready, the only frame with Create opportunity enabled and the expiry time Q2 adopted; eight state cards; phone not saveable, changed since prepared and Your proposals.

After the polish, all visible text is Roboto, no text overflows its container, and no frame or label overlaps another or leaves its section. The notes card `2393:871314` records this.

## 8. Verification

- The twenty-one captures are copies on the "Captures (icon-free)" page: images 01, 15 and 16 at y = 800,000 (`2849:8718`, `2849:14839`, `2849:15517`), which the polish did not change; images 02–11 at y = 806,000 (`2882:115` to `2882:5890`); images 12–14 at y = 900,000 and x from 100,000 (`2882:6450`, `2882:7622`, `2882:8166`); images 17–21 at y = 900,000 from x = 105,000 (`2892:8568`, `2892:9202`, `2892:9941`, `2892:12548`, `2892:13157`). Every Font Awesome instance was swapped for `Icon/placeholder`. A scan found no icon instance and no prototype link on any copy. Claude viewed images 03, 12, 18 and 20 after export; images 01, 15 and 16 keep their earlier export.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/my-work/assistant-proposal-review-design-r01/README.md).
- The Captures page held 6 flow starting points when the copies were finished; a copied flow start was removed where one appeared. Other lock-in sessions were writing to that page at the same time.
- The named Figma version "Proposal review — accepted" has not been saved. It waits for Dean's yes.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 9. Additions F1–F3, accepted

Drawn and accepted on 31 October 2026, in the section "Additions F1–F3". The answers to Q8–Q10 are in section 1. The notes card holds their detail.

| ID | Addition | Frames |
|---|---|---|
| F1 | Possible duplicate check: open deals at the customer that look like the same work, with Open deal and Not a duplicate. It never blocks Create, covers only deals the person can open, says how many it compared and says so if the check fails. It needs the organisation-linked read the specification already plans (§2, §6) | Desktop `2877:6291`; phone `2877:7070`; states `2877:6801`, `2877:6891`, `2877:6980` |
| F2 | Why this value: a provenance tag opens where the value came from, as a popover on desktop and AI-03's bottom sheet on phones, with Open evidence for records | Desktop `2878:10765`; phone `2878:11526`; states `2878:11329`, `2878:11426` |
| F3 | Focus review: only Needs input and Proposed default fields stay open; other values collapse into a summary that still shows them, and open into one-line rows. The desktop form is 1,834 px against 2,749 px. **Departure:** offered as a choice beside the specification's full form of normal labelled editable fields (§4), under Q10 | Desktop `2878:12023`; phone `2878:12793`; state `2878:416921` |

Not drawn: F1–F3 at 320 and 1024, and F1 and F2 links beyond those in section 2.
