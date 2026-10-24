---
document_id: PPO-AD02-SETTINGS-HUB-FIGMA-DEC
date: 2026-10-22
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 612ebecbfc328a20a035b71c363729f3223efe7f
versioning: git
---

# Settings hub design — owner decision

On 19 October 2026 Dean adopted a Settings hub: the Administration menu's "Settings" entry becomes a hub whose main content is business configuration and policy publication (`scope:AD-02`), with links to every configuration area ([WS-D6](workshop-settings-preferences-scope.md)). On 22 October 2026 he asked for its design: "Your task is to design and build the UI page for the Settings hub (built around AD-02, WS-D6) in Figma." Claude drew the page in Figma covering:
- the Settings hub at the proposed route `/admin/settings` (More › Administration & support › Settings), with a Needs attention list and nine configuration-area cards;
- the Business policies register at `/admin/policies`, the destination already recorded for AD-02;
- the policy record at `/admin/policies/[id]`, with its Terms and Version 2 proposal tabs and the Propose change and Publish dialogs;
- the publish refusal when a review no longer covers the latest proposal revision;
- the Readable record references policy record.

Claude drew the page from these sources:
- the AD-02 design register page [scope-ad-02](../design/development/pages/scope-ad-02.md);
- the decisions [workshop, Settings and preferences scope](workshop-settings-preferences-scope.md) (WS-D6, WS-D7), [scheduling-policy publication](scheduling-policy-publication.md), [scheduling-policy impact review](scheduling-policy-impact-review.md), [readable record references](readable-reference-namespaces.md) and [PPO as the daily workspace, MYOB as the book of record](ppo-workspace-myob-book-of-record.md) (EI-9);
- the built scheduling-policy commands and screens in `src/scheduling/` (`policy-commands.ts`, `policy-persistence.ts`, `components/client/policy-publication.client.tsx`), with the capabilities `schedule.policy.review` and `schedule.policy.publish` in `src/platform/permissions.ts`;
- the seeds `db/seed-scheduling-policy-publication.sql` (SYN P05 conservative planning policy), `db/seed-p04.sql` and `db/seed-field-readiness.sql` (service readiness SYN-PPO-P04, versions 1 and 2) and `db/seed-p05.sql` (the two 07:00–18:00 working calendars);
- the `settings` entry in `src/shell/navigation.ts` (readiness `unavailable`, no page);
- copies of the accepted Users and access AD-01 frames, the adopted compact phone header and the Field team phone row.

Before deciding, Dean asked for an audit: "Give the Settings · AD-02 page an audit and polish before I decide." He then accepted the design: "I accept the Settings AD-02 design with your recommendations, including D1–D8 and Q1–Q6." That adopts D1–D8 and the recommended answers to Q1–Q6. On 23 October 2026, at his "Yes, save the named Figma version "Settings — accepted" and finish locking in the AD-02 design.", the named version was saved (section 7).

Scope:
- `scope:AD-02` "Business configuration and policy publication", with `/admin/policies`, and the hub of WS-D6. No new scope is added; the hub is AD-02's entry page.
- No parent requirement ID is added or renamed. The scheduling-policy traceability (SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04/API-C26, EVT-12, PT-08/09/28, AT-35) is unchanged.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, operational policy value or deployment, and it changes no hosted authority. Every policy value shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Settings hub around AD-02 | User decision, 22 October 2026 | Dean's request quoted above; WS-D6 of 19 October 2026 |
| Audit and polish before acceptance | User decision, 22 October 2026 | Quoted above. Section 6 |
| Departures D1–D8 | Accepted as recommended, 22 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Proposer and reviewer | Resolved as recommended | A review by the proposer is refused, as well as a publication by the reviewer, so every publication involves at least two people. The built commands refuse only a publisher who is also the reviewer (`IndependentPublisherRequired`), so this is a build prerequisite (section 5) |
| Q2 Routes and permission | Resolved as recommended | The hub is `/admin/settings`; Business policies is `/admin/policies`, the register's recorded destination; a policy record is `/admin/policies/[id]`. The hub has no capability of its own and shows only the areas the person may open |
| Q3 Other policy families | Resolved as recommended | Field readiness and working hours move onto the same propose, review and publish path one family at a time, before new families are added. Until then they are read-only and say "Seed only, no editor" |
| Q4 Primary action | Resolved as recommended | "Publish version N" is the record's primary action only for a current publisher when a complete review of the latest revision exists. Otherwise "Propose change" is primary for holders of a policy duty, and anyone else sees no action |
| Q5 References | Resolved as recommended | Policies and proposals take no readable reference. People quote the policy name, its version and the proposal revision; the UUID stays the technical identity |
| Q6 Next frames | Resolved as recommended | The History and Affected work tabs, the field readiness record and the phone propose and publish sheets are drawn after this page as AD-02 amendments. The Integrations area and My account and preferences (WS-D7) are separate designs |
| Accept the design | User decision, 22 October 2026 | Quoted above |
| Named Figma version | Saved, 23 October 2026 | "Settings — accepted", at Dean's yes quoted above. Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Settings · AD-02" `2049:11645`, under "— Administration —", after Users and access and before "— Evidence —". The page header `2049:11646` holds the conformance declaration; the notes card `2049:13083` is in Flows and notes. File index: the row "Row / Settings · AD-02" `2055:505200` in the Administration group, after Users and access |
| Desktop 1440 | Settings overview, full length (1440 × 1230) `2049:11682`; Business policies register `2049:11796`; SYN P05 policy, Terms (1440 × 1021) `2049:11910`; Version 2 proposal, reviewed, full length (1440 × 1705) `2050:510998`; Propose change dialog (1440 × 980) `2052:506644`; Publish version 2 dialog (1440 × 980) `2052:507029`; revision 2 saved, publish refused, full length (1440 × 1814) `2052:505135`; Readable record references (1440 × 1505) `2050:511240` |
| Tablet 1024 | Settings overview with the side menu collapsed `2049:12799` |
| Phone 390 and 320 | Settings overview, areas grouped `2049:12895`; SYN P05 policy, version 2 waiting to publish, at 390 `2049:12910` and 320 `2049:12961` |
| States | Phone 390: loading `2049:13013`; no policies match `2049:13045`; could not load `2049:13062`; no configuration area permitted `2049:13072` |
| Page parts | Section "Page components (proposed)": Settings area card `2050:5686`, Attention row `2050:5701`, Policy grid header `2049:13111` and row `2049:13125` (variant set), Term list header `2050:509992` and Term row `2050:509984`. They stay on the page, as the AD-01 parts do |
| Prototype | Flows "AD-02 — desktop" (from the overview) and "AD-02 — phone" (from the phone overview): the attention row and the Business policies card to the policy and register, the side menu, the register row to the record, the Terms and proposal tabs, Propose change and Publish to their dialogs and back, Save proposal to the refusal, the breadcrumb back, and on phone the attention row to the policy record |
| Story | Synthetic, as at Thu 22 Oct 2026, 10:00 Brisbane time, signed in as Dean Fiedler, who holds `schedule.policy.publish`; Jordan Kim holds `schedule.policy.review`. Saved proposals and reviews are shown only to holders of one of those duties, so every frame is Dean's view. SYN P05 conservative planning policy version 1 (maximum visit 480 minutes, from Sat 5 Sep 2026) is in force. Dean saved version 2 (420 minutes from Mon 2 Nov 2026, 00:00) on Tue 20 Oct, 16:05; Jordan reviewed it on Wed 21 Oct, 15:10: 14 confirmed, unstarted bookings on or after Mon 2 Nov, or crossing it, were checked; 11 fit and 3 need review (SYN-APT-000061, SYN-APT-000064, SYN-APT-000067), with Sam Patel as impact owner. In the refusal frame Dean saved revision 2 at 10:02, moving the start to Mon 9 Nov. Field readiness SYN-PPO-P04 version 2, the two working calendars and the references decision come from the built seeds and decisions; Riley Tran's SYN-PPO-ACR-000004 is from the accepted AD-01 story |
| Retained captures | [Settings hub design r01](../reference/ui/settings/settings-hub-design-r01/README.md): thirteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AD-02` at `/admin/policies` and `/admin/policies/[id]`, with the Settings hub of WS-D6 at `/admin/settings` (More › Administration & support › Settings). No new scope; parent requirement IDs unchanged. Capabilities unchanged |
| Page type (r20) | Hub or overview for Settings. Register or worklist for Business policies. Record detail for a policy. Form for Propose change and Publish |
| Reused components | Shell v2 (Rail · Service with More selected, the top bar with the proposed Conversations action, side menu), Grid header and cells, Toolbar search, Record / Header, Record / Readiness bar and Check item, Record / Field, Section heading, View tab, Tag, Button, Planner / Input (proposed), Work order record / Blocker row, Technician list row (phone, proposed), the phone tab bar and quick add, and the adopted Shell / Phone header · compact. The dialogs copy the accepted AD-01 Propose dialog. New, proposed: Settings area card, Attention row, Policy grid header and row, Term list header and Term row |
| Incoming handovers | More › Administration & support › Settings; Needs attention links; links from the PL-04 policy review to the policy record |
| Outgoing handovers | Users and access (AD-01), Integrations & recovery (AD-04, AD-09), Template management (DK-06), Data quality (AD-03), owned booking reviews in Changes and follow-up (PL-04), and My account and preferences (WS-D7, a separate page) |
| Source authority | The decisions and built sources listed above; the AD-02 design register page |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 22 October 2026 |
| Decision record | This file |
| Named version | "Settings — accepted", saved 23 October 2026 |

## 4. What the design shows

### Settings overview (the hub)

- **Place (D1, D2):** Settings stays under More › Administration & support, with no rail of its own. One side menu: Settings (Overview), Business policies (All policies, Waiting to publish, Record references), Configuration areas (Users and access, Integrations, Templates, Assistant, Data quality, Retention, Workshop) and Support (Exceptions & recovery, Foundation checks). Each area keeps its own page and permission; the hub links to it.
- **Needs attention:** the scheduling policy's version 2 waiting to publish, Riley Tran's access request waiting for Jordan Kim's decision, and MYOB Acumatica not connected (the tenant contract DEC-CCE-10 is open; the first connection is read-only, EI-9). Each row opens its page.
- **Configuration areas:** nine cards, each with its owning scope and its status in words: Business policies (AD-02), Users and access (AD-01), Integrations (AD-04, AD-05), Templates (DK-06, design accepted, screens not built), Assistant (AI-01, Claude provider, decision A1), Data quality (AD-03, design recorded, not built), Retention (AD-08, not designed), Workshop (CX-02, workshop builds accepted, settings not designed) and Health and recovery (AD-09, built).
- **Personal settings:** a note sends people to My account and preferences, opened from their initials in the top bar (WS-D7). Settings changes apply to everyone in the workspace.

### Business policies register (D3, D7)

- **Grid:** policy, area, in-force version, scope, proposal state and next version in view; since, waiting on, how it changes and last change to the right. The checkbox and settings columns are fixed, and a column ends at the visible edge at 1440.
- **Rows:** SYN P05 conservative planning policy (Scheduling, version 1, waiting to publish version 2 from Mon 2 Nov), SYN-PPO-P04 service readiness (version 2 from Fri 16 Oct), the two SYN weekday 07:00–18:00 Brisbane calendars (SYN-A and SYN-B) and Readable record references (adopted Tue 20 Oct).
- **Coverage:** a note says that only the scheduling policy changes through a saved proposal, an independent review and a separate publisher today; the readiness and working-hours versions were installed by seed, and record references follow an owner decision.

### Policy record (D4, D5)

- **Layout:** the accepted record layout. The header shows the name, "Version 1 in force", "Scheduling · workspace-wide", the viewer and read time, and the position in the list. Its actions are Publish version 2 (primary, Q4), Propose change and "…".
- **Policy state bar:** version 1 in force since Sat 5 Sep, version 2 waiting to publish, 3 future bookings to review on publication, publication head version 1, runs to Fri 2 Jan 2032.
- **Details column:** the policy (area, scope, in force, runs to, source as at, publication head); who can change it (proposes: review or publish duty; reviews: Jordan Kim; publishes: Dean Fiedler), with the rule that the publisher is not the reviewer and the duty gives no booking or dispatch authority; and where it is used (Schedule PL-01, Changes and follow-up PL-04).
- **Tabs:** Terms, Version 2 proposal, Affected work, History and Used by.
- **Terms:** a callout for the waiting proposal, then a terms table that says what each term controls: maximum visit length 480 minutes, initial date agreement required, changed date contact allowed with dispatch held, all crew competent, effective from and to. Times show in Brisbane time, stored in UTC. A note says publishing never re-pins or rewrites a booking, an appointment revision or an issued document.
- **Version 2 proposal:** every term version by version with a Changed or Same tag; the frozen independent review (bookings checked, fit, need review, left out, impact owner and binding to proposal revision 1 and publication head version 1); and the three bookings that will need review with how far each exceeds 420 minutes.

### Propose and publish (D6)

- **Propose version 2:** a dialog with the proposed terms, the Brisbane start with its UTC reading, the checks before saving and a required reason. Saving changes nothing in force.
- **Publish version 2:** a dialog that says what publishing does (a new version 2 record, an owned review for each affected booking, dispatch and start held until each is resolved, no booking or issued pack changed) and checks again that the publisher holds a current duty and is not the reviewer, that the review is complete, unchanged and unused, and that the publication head is still version 1. An optional note is kept with the receipt.
- **Refusal:** after Dean saves proposal revision 2, Publish is refused in plain words; nothing is published, no booking is flagged and version 1 stays in force. The review is marked out of date and the affected bookings are shown for reference only.

### Readable record references (D7)

- A read-only policy record of the owner decision of 20 October 2026: the format rules (pattern, the SYN and PPO namespaces, the number, the sequence, existing references kept) and the record types in use (SRV, TKT, WO, APT, OPP, SITE, ACR, RPT) with their new references. Existing SYN-PPO- references stay as issued.

### Phone (D8)

- **Overview:** the adopted compact header and a grouped list: Needs attention, Business policies, Configuration areas and Support.
- **Policy record:** a compact record header, then the name, the version 2 summary, the terms in force, and Publish version 2 as the one main action. Propose change, history and the proposal open from More.
- **States:** loading; no policies match, with the active filter chips; could not load; and no configuration area permitted. States clear all policy data.

### Departures, accepted

| ID | Departure | Built pattern |
|---|---|---|
| D1 | A Settings hub with Needs attention and nine configuration-area cards, each naming its scope and status in words | "Settings" is listed with readiness `unavailable` and has no page |
| D2 | One side menu for Settings, Business policies, Configuration areas and Support; each area keeps its own page and permission | Users and access, Exceptions & recovery and Foundation checks are separate menu entries |
| D3 | A Business policies register across every policy family | The scheduling publication workflow sits only inside the PL-04 Review / comparison page |
| D4 | The accepted record layout with a Policy state bar, details and five tabs; terms as a table that says what each controls | A policy summary inside PL-04 |
| D5 | The proposal tab compares terms version by version, shows the frozen review and lists each booking that will need review | The same facts as stacked sections in PL-04 |
| D6 | Propose and Publish as dialogs with the server checks listed; a stale review refuses in plain words | Inline forms and messages in PL-04 |
| D7 | The register says how each policy changes today; record references show as a read-only policy record | Not shown |
| D8 | Phone: grouped Settings list; policy record with one main action; four states | Stacked sections on narrow screens |

## 5. Not decided and not drawn

- **Building the page.** No route exists for the hub or the register. The build order is not decided.
- **Prerequisites for a build:**
  - refusing a review by the proposer (Q1);
  - the `/admin/settings`, `/admin/policies` and `/admin/policies/[id]` routes and a read that lists every policy family with its in-force version and proposal state (Q2, D3);
  - read-only records for the seeded readiness and working-hours policies until their editors exist (Q3);
  - the Needs attention items, each read under its own area's permission.
- **The Conversations action** is part of the proposed top-bar shell amendment, as on the AD-01 page.
- **Not drawn (Q6):**
  - the History and Affected work tabs and the Waiting to publish view;
  - the field readiness and working-hours records;
  - the Integrations, Templates, Assistant, Data quality, Retention and Workshop area pages, which belong to their own scopes;
  - the publish success state and receipt recovery;
  - the phone propose and publish sheets;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the policies, terms, proposals, reviews and bookings are synthetic. They are not adopted operating rules and grant no authority.

## 6. Audit and polish

At Dean's request Claude checked every frame for text left from the AD-01 copies, measured truncation and clipping, checked the story against the built policy rules and seeds, and checked layout and links.

- **Corrected:** the hidden "…" record menu in six frames offered AD-01 actions; it now offers Open history, View affected work, Open scheduling review (PL-04) and Copy link, and on the references record Open record types, Open Site surveys (CS-08) and Copy link. The overview, register and tablet became Dean's view, because the built rules show saved proposals only to a review or publish duty holder. The review counts only bookings on or after the new start or crossing it, as the built publication does. The area cards say which designs are accepted, recorded or built.
- **Polished:** two card details that truncated were shortened; the no-match state shows its two filter chips; the refusal frame reads 10:03; layer names left from AD-01 were renamed.
- **Left as designed:** register columns beyond the visible edge scroll sideways, the 320 header position truncates, and phone lists continue under the tab bar.

The audit is recorded on the notes card `2049:13083`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit, and measured every visible truncating text against its rendered width. After the audit no text is truncated or clipped except the cases left as designed.
- The thirteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 360,000. Image 13 is a frame holding copies of the four phone state frames. The prototype reactions on 176 layers were removed and each of the 518 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,352 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and the Captures page keeps its 105 flow starting points.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/settings/settings-hub-design-r01/README.md).
- The named Figma version "Settings — accepted" was saved in the Figma desktop app on 23 October 2026 at Dean's yes and confirmed at the top of version history. The page header and notes card were then updated with the lock-in details.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
