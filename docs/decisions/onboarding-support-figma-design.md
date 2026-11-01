---
document_id: PPO-AD10-ONBOARDING-SUPPORT-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; building the page, its route, the entry points, requests, exercises and the practice records are separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# User onboarding, learning and support design — owner decision

On 31 October 2026 Dean asked Claude to design and build "the 'User onboarding, learning and support (AD-10)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/help/onboarding` is registered but not built, so the composition is new. Claude drew the page and presented it with its recommended answers.

Asked "Do you accept AD-10 with the recommended answers?", Dean answered on 1 November 2026: "Accept as recommended". That adopts D1–D15, the six departures and the recommended answers to Q1–Q10.

Claude drew the page from these sources:

- the accepted [user guide direction](user-guide-direction.md) (PPO-USER-GUIDE-PROP), sections 3, 6, 7, 9 and 10, which gives the Help Centre to DK-07 and onboarding and What's new to AD-10;
- [contextual help](contextual-help.md) (PPO-HELP-DEC r01);
- [BP-01](../blueprints/BP-01-master-blueprint.md) sections 22.1 (KPI-15), 22.2 and 25.7;
- the [AD-10 page reference](../design/development/pages/scope-ad-10.md);
- the My Work, My account, Help Centre, Operational health, Users and access, Migration & cutover and Conversations Figma pages, read only.

Scope: `scope:AD-10` "User onboarding, learning and support", route `/help/onboarding`. No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, grant, email, deployment or guide content. Stage 5 of the user guide direction still needs its own go-ahead.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AD-10 in Figma | User decision, 31 October 2026 | Dean's request quoted above |
| D1–D15 and departures X1–X6 | Accepted as recommended, 1 November 2026 | "Accept as recommended". Section 4 |
| Q1 PPO support owner during the pilot | Resolved as recommended | Dean, as product owner, with one named back-up, until a business owner exists. **The back-up is not yet named.** BP-01 25.7 still requires support coverage to be approved before G3; this answer does not give that approval. The frames keep "to be named" because they were accepted that way |
| Q2 Practice space | Resolved as recommended | Scripted in-app exercises as drawn, with the hosted demo for free exploration. No practice copy of the database |
| Q3 Required before access | Resolved as recommended | No, tracked only. Access stays with AD-01 |
| Q4 How What's new reaches people | Resolved as recommended | In-app only (menu count and My Work strip) until email delivery exists under [ADR-0058](ADR-0058-outbound-customer-email.md) |
| Q5 Where the support owner answers | Resolved as recommended | A request queue on this route, using the same register. The answer also said to draw it after acceptance. It is not part of this acceptance (section 5) |
| Q6 Who ticks a task as done | Resolved as recommended | The person. Ticks are a personal aid, not evidence of competence |
| Q7 Who approves the KPI-15 definition | Resolved as recommended | The Product owner, before the G3 baseline. Until then the page shows S5 and no figure |
| Q8 Very small groups in the Owner view | Resolved as recommended | Show "Fewer than 3" for any job function under three people. F8 shows no such group |
| Q9 Screenshot default | Resolved as recommended | Off until the person ticks it. F5 shows Robin's choice. Storage and retention go to AD-08 |
| Q10 Who writes task paths and exercises | Resolved as recommended | Written in the repository with each module's guide chapter and reviewed by that module's business reviewer, under stage 5 of the direction |
| Named Figma version | Awaiting Dean's yes | "Onboarding & support — accepted" (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

Desktop frames are coded F, because the notes card uses D for decisions.

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Onboarding & support · AD-10" `3022:2348`, under "— Administration —", directly before "— Customer portal —". The page header `3022:2349` holds the conformance declaration; the notes card `3036:38175` lists D1–D15, Q1–Q10, the flows and what is not drawn. File index row `3093:538372` |
| Desktop 1440 | F1 Getting started `3027:123`; F2 Task path `3027:497`; F3 Practice in progress `3029:17411`; F4 Practice finished `3029:17752`; F5 Ask for help `3029:18070`; F6 My requests `3029:18396`; F7 What's new `3031:306762`; F8 Owner view `3031:307122`; F9 Feedback `3031:307680`; F10 Proposed entry points `3031:307939` |
| Tablet 1024 | T1 Getting started `3031:775689` |
| Phone 390 and 320 | Getting started `3031:775989` and `3031:776450`; Practice exercise `3031:776198` and `3031:776679`; Ask for help `3031:776297` and `3031:776778` |
| States | S1 Loading `3036:31203`; S2 No practice space `3036:31394`; S3 Support owner not set `3036:31590`; S4 Request sent `3036:31834`; S5 Adoption definition pending `3036:32056`; S6 Incident routed to Operational health `3036:32326`; S7 Uncertain send, phone `3036:32589`; S8 Offline, phone `3036:32690` |
| Parts | No new main component. Page-only groups (progress blocks, practice banner, task rows) stay on the page. No component binding file is needed |
| Prototype | Flows "AD-10 — desktop" (from F1) and "AD-10 — phone" (from the 390 Getting started). The paths are on the notes card |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Robin Hale, supply coordinator, is new to Receiving and Material demand, with 3 of 7 tasks done; last visit Thu 8 Oct. "Can't find where to release quarantine" (`SYN-HLP-000012`, asked Mon 12 Oct) was answered at 08:25 with a guide link. Jesse Moore, a technician, practises recording a test result on Practice panel PR-4. Taylor Quinn holds the Owner view. What's new lists the Receiving and Returns pages in `SYN-REL-000003`, Fri 9 Oct. Every count and figure is fictional, and none measures a benefit |
| Retained captures | [Onboarding & support design r01](../reference/ui/administration/onboarding-support-design-r01/README.md): 25 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AD-10`, `/help/onboarding`, guide `guide.ad.10`. Parents DOC-04, NFR-05, NFR-07 and NFR-08 and measure KPI-15 are unchanged. One proposed capability for the Owner view and queue, named when built; learners need none |
| Page type (r20) | Form / guided workflow (Getting started, Practice, Ask for help, Feedback), Register / worklist (Task path, My requests, What's new) and Overview / dashboard (Owner view) |
| Reused components | Shell / Top bar `35:138` (linked), Rail · Supply chain with Workshop `1690:455107`, Rail · Service `198:3778`, v2 Menu heading and item, v2 Menu strip, Shell / Phone header · compact `1530:110`, v2 Tab bar `107:149`, Tag `3:13`, Button `3:41`, Grid / Header cell, Cell, Checkbox cell and Row actions cell, Grid / Done cell `408:430`, Grid / Group band `2651:7352`, Grid / List row `2651:7385`, Controls / Form field `2649:7479` and Choice option `2648:7409`, all proposed in the file audit, and the Account menu cloned from My account `2112:682290`. DK-07 `3015:123` was an empty template when this page was drawn, so no DK-07 part is reused |
| Source authority | The opening list. This record separates Dean's decisions, the accepted direction, the proposed composition and the synthetic story |
| Incoming handovers | The page and task the person came from (prefilled, editable); the job function set by an administrator, in plain words, because AD-01 roles are only proposed; published guides from DK-07; released changes from the release record AD-09 holds, read-only; the KPI-15 definition and its status from the Product owner |
| Outgoing handovers | A request goes to the PPO support owner; a possible incident goes to Operational health AD-09, with a notice; a guide gap goes to the Help Centre DK-07; feedback goes to the Product owner. The page never changes a business record, records competency, restricts access or sends email |
| Exceptions and recovery | The eight states in section 2. An uncertain send keeps the words, sends the person to check first and retries as the same request. Offline, ticks and requests wait on the phone and say so |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

| ID | Rule | Basis |
|---|---|---|
| D1 | One route family with its own side menu: Getting started, My task path, Practice, Ask for help, My requests, Feedback, What's new. Help Centre is a link out, not a copy | Direction section 3 |
| D2 | Paths follow a job function in plain words, set by an administrator and changeable by the person. It never changes access | Direction section 6; AD-01 roles are proposed only; D-020 open |
| D3 | Progress is "3 of 7 tasks done", ticked by the person. No score, percentage, rank or per-person view anywhere | Dean's brief; BP-01 22.2 |
| D4 | Practice is a scripted exercise on fixed made-up records inside AD-10, not a copy of the database. Banner reading "Practice: synthetic records, nothing is saved to real work", violet treatment and a Practice tag on every record. PRACTICE- references, never SYN- or real ones. Retries are not kept; only the person's tick is saved | Dean's brief |
| D5 | The test exercise uses a limit of 0.5 Ω labelled as made up, and tells the person to use the job's test sheet. It states no engineering rule. Readings echo the Workshop story | AGENTS: no proposed calculation shown as an operating rule |
| D6 | The form asks what kind of help is needed, then routes: request to the support owner, possible incident to AD-09 with a notice (S6), guide gap to DK-07. People need no AD-09 access; PPO hands it on | Dean's brief; AD-09 is an administrator page |
| D7 | With no support owner named, Send is not offered and the draft is kept (S3). PPO does not pretend a request reached someone | Dean's brief; NFR-05 |
| D8 | Requests are a new record type with readable references, `SYN-HLP-000nnn`. Replies show who answered by role. The named person appears once one is named | Readable reference rule; no existing reference rewritten |
| D9 | An uncertain send keeps the words, sends the person to check first, and retries as the same request (S7). Offline, ticks and requests wait on the phone and say so (S8) | NFR-07; direction section 7 |
| D10 | Feedback is separate from requests. The product owner sees it linked to the page and the person's name, and no reply is promised | Dean's brief |
| D11 | What's new lists released changes only, by release and job function, with the updated guide and "Since your last visit". `SYN-REL-000003` is the story's current release; `SYN-REL-000004` is Not ready in AD-09, so it is absent. Readiness stays in AD-09 | Dean's brief; Operational health story |
| D12 | Owner view shows counts only. KPI-15 uses the BP-01 wording with its definition status, read with feedback and correction effort, and says plainly that it is not a benefit. F8 assumes an approved definition so the layout can be judged: that approval is story only. Today's true state is S5, with no figure | BP-01 22.1, 22.2, 25.7; Dean's brief |
| D13 | Entry points are departures (F10). The Page guide crop is a sketch of the footer only; DK-07 owns the panel | Dean's brief |
| D14 | Phone frames show full length, except practice and uncertain send, which keep actions fixed at the bottom. Inputs use 16 px text and main buttons 48 px. Quick add is left out here, as these pages create no business record | Page reference; phone header amendment |
| D15 | Story: Robin Hale as on My account; Jesse Moore from the Workshop story; Taylor Quinn as on AD-09. The support owner is a role with no name | Dean's brief; other pages' stories |

| ID | Departure | Today |
|---|---|---|
| X1 | The route `/help/onboarding` and its side menu | Registered, unbuilt |
| X2 | A new row in the account menu, "Getting started and help" | My account `2105:638399` has no such row. That page is unchanged |
| X3 | A footer under the Page guide: Ask for help, Practise this task, Tell us what would help | Not in DK-07 or the built panel. That page is unchanged |
| X4 | A quiet, dismissible strip on My Work for an unfinished path or unread changes | My Work `404:2` has none. That page is unchanged |
| X5 | A new reference type `SYN-HLP` for help requests | No such record exists |
| X6 | The rail shows nothing selected, because the route is not on a rail | Rail items are normally selected |

## 5. Not decided

- **Building.** The route, side menu, entry points, requests, feedback, exercises, What's new and Owner view each need a go-ahead and pull request. Stage 5 of the direction governs guide content.
- **The back-up support owner.** Dean names them. Until an owner is set in the built app, S3 applies.
- **The KPI-15 definition, baseline and target.** None is approved by this record.
- **The request queue.** Q5 places it on this route and says to draw it after acceptance. Claude drew it on 1 November 2026 as F11 `3107:3789`, labelled "drawn after acceptance, awaits review". It is not in these captures or this acceptance. If Dean accepts it, this record is amended and a capture folder added.
- **Not drawn:** a list of all practice exercises (My task path carries the links, S2 is the empty state); where the support owner is named (Settings AD-02, an amendment); tablet beyond Getting started; a customer guide, which the direction keeps separate.

## 6. Consequences

- The `scope:AD-10` register entry and page reference cite this design and its captures. Visual status stays "Needs review": nothing is built.
- Later changes receive a new named version and a new capture revision folder.
- No parent requirement ID changes.

## 7. Verification and limits

- Claude checked the frames with screenshots taken inside Figma and with scripted checks for overlaps, frames outside their section and section spacing. The last run, on 31 October, found none. Those scripts did not measure clipped text; it was checked by eye in the screenshots.
- **Present mode was not run**, so the 100 prototype links are untested in play. Keyboard order, screen reader and 200% zoom were not checked.
- The 25 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A scan of the copies found no Font Awesome instance and no prototype link. They sit on the Captures page at y = 1,530,000.
- After the owner's acceptance Claude changed the page's status wording, the notes card's wording and the Decision record and Named version fields in the header, and added the File index row. No accepted frame changed. F11 was added beside them (section 5), and the notes card's Q5 row and "not drawn" list now say so.
- Nothing is built by this record, so there is no application or device evidence, and no UI baseline.
- The named version "Onboarding & support — accepted" has not been saved. Claude cannot save it through the Figma plugin.
