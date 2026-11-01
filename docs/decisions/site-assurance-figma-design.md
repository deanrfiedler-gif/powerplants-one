---
document_id: PPO-PJ09-SITE-ASSURANCE-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; application changes and operating rules separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Site assurance design — owner decision

On 31 October 2026 Dean asked Claude "to design and build the Projects 'Site assurance' page in Figma as a proposal for my review", with the scope decision put to him first. Claude drew it the same day. On 1 November 2026 he answered Q1 "Yes, keep it", recorded in PPO-UI-SCOPE-ID-MAPPING-DEC. Asked "Do you accept Site assurance with Option A and the recommended answers?", he answered: "Accept with Option A". That answer adopts D1–D12 and the recommended answers to Q1–Q9.

Claude drew the page from these sources:
- [BP-06](../blueprints/BP-06-projects-commercial-delivery.md), journey J5 and PRJ-06, and [ADR-0033](ADR-0033-staged-acceptance.md);
- the retained, proposed [Quality, Safety & Site Assurance r01](quality-site-assurance-design.md) workspace and its report;
- the accepted [Inspections](inspections-figma-design.md), [Incidents](incidents-figma-design.md) and [Access & readiness](access-readiness-figma-design.md) designs and the Figma page Site readiness FI-05;
- the [EN-08 integration decision](engineering-commissioning-as-built-design.md);
- the Figma pages Commissioning & as-built EN-08, Change review EN-07, Subcontractor packages PJ-06, Delivery readiness PJ-07 and Acceptance & closeout PJ-09. None was edited.

**Accepting Site assurance accepts none of those pages.** Where one of them is still a proposal, it stays one.

Scope: `scope:PJ-09/site-assurance`, under PJ-09, traced to PRJ-06, at the proposed route `/projects/assurance`. No route exists. Parent requirement PRJ-06 is unchanged, none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, migration, capability, grant, adapter, endpoint, customer communication, business transaction or deployment. Dean's instruction was "Do not build the app page". The rail item stays unavailable in the application. Q2–Q9 are adopted as design direction for synthetic rules; none is a verified operating rule. Claude has no evidence that Powerplants formally runs inspection and test plans this way, so that stays to be checked before any build.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| EN-08 owns the commissioning basis and results; PJ-07 asks whether a project is ready for its next step; Site assurance owns the ITP across all installation activities and shows EN-08 results as linked checks | User decision, 31 October 2026 | The boundary in Dean's request |
| Q1 Option A or Option B | User decision, 1 November 2026 | Option A, its own Projects page: "Yes, keep it", then "Accept with Option A". Option B, folding project ITPs into Inspections and removing the rail item, is not taken |
| D1–D12 | Accepted as recommended, 1 November 2026 | "Accept with Option A". Section 4 |
| Q2 Who writes ITPs | Resolved as recommended; design direction | The project manager writes and owns the plan, and engineering reviews its technical criteria. The EN-08 test basis stays with engineering |
| Q3 Which checks are hold points by default | Resolved as recommended; design direction | Isolation before work; a subcontractor's certificate before release; anything the contract or an inspector names. Everything else defaults to Review. If the screen run needs the new circuit energised, the certificate comes before the witness and checks 4 and 5 swap; they are drawn in the order Dean gave |
| Q4 Must the customer witness any checks | Resolved as recommended; design direction | Invitation only, unless the contract names a witnessed test; that check is then a Hold |
| Q5 Can a release exclude a hold point | Resolved as recommended; design direction | No. A hold inside the scope must pass. It leaves only when the work under it is excluded by name |
| Q6 Does PJ-09 need this release before offering a stage | Resolved as recommended; design direction | Yes: PJ-09's checks bar gains "Assurance released". PJ-09 isn't edited here (section 5) |
| Q7 Cross-page differences | Resolved as recommended | Keep the dates on this page, and correct EN-08 and PJ-09 when each is accepted. Existing references aren't rewritten. Section 3 lists them |
| Q8 Defect severity words | Resolved as recommended; design direction | Minor, Major and Critical, with Critical prompting an FI-06 report. Synthetic until Dean sets them |
| Q9 Reference types SYN-ITP- and SYN-ASR- | Resolved as recommended | Design labels for now, with no allocation rule until a build |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Saved by Dean, 1 November 2026 | "I have saved the named version as Site assurance — accepted". Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Site assurance · PJ-09" `2998:123`, under "— Projects —", before Acceptance & closeout · PJ-09 `2097:6900`. The page header `2998:124` holds the conformance declaration; the notes card `3006:13599` is in Flows and notes. File index row `3093:541485` |
| Desktop 1440 | Overview `3000:1199`; ITP record, full length `3001:2855`; Hold point blocking `3002:6546`; Witness `3002:7269`; Failed check, defect and retest `3002:7902`; Plan revision `3004:4127`; Release with exclusions `3004:4815`; Handover to PJ-09 `3004:5457`; Run a check `3004:6032` |
| Tablet 1024 | ITP record `3005:9962` |
| Phone 390 | Today's checks `3005:10744`; Hold point `3005:10871`; Record witness attendance `3005:10919` |
| Phone 320 | Today's checks `3005:10974`; Hold point `3005:11101`; Record witness attendance `3005:11149` |
| States | Loading `3006:3461`; No ITP `3006:3485`; Could not load `3006:3500`; Read-only `3006:3515`; Plan changed since a check `3006:3531`; Release blocked by a hold point `3006:3546`; Subcontractor evidence expired `3006:3580` |
| Page parts | Section "Page components (proposed)" `2999:1172`: Rail · Projects with Site assurance `2999:1173`, Site assurance / Cell `2999:1273` and Tag cell `2999:1274`. They stay on this page until a build needs them, and the shared Rail · Projects `209:515` is unchanged |
| Prototype | Flows "Site assurance — desktop" (from the Overview) and "Site assurance — phone" (from the phone 390 Today's checks) |
| Retained captures | [Site assurance design r01](../reference/ui/projects/site-assurance-design-r01/README.md): 23 icon-free PNGs with hashes, from copies `3093:541494`–`3093:547772` on Captures at y = 1,500,000 |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Jamie Rossi. Three frames are later and say so: Record witness attendance on Thu 15 Oct at 10:05, and Release with exclusions and Handover to PJ-09 on Fri 16 Oct. The Plan changed state is also later.

Glasshouse 4 climate screens, SYN-PPO-PRJ-000024, stage 2 ITP SYN-ITP-000014 plan r2:
1. Isolation verified at MSB-2: Hold, passed Mon 12 Oct, SYN Brightline Electrical.
2. Screen motor current, SM-3, EN-08 test T06: attempt 1 failed at 3.1 A and is kept; attempt 2 passed at 2.1 A against ≤ 2.4 A. Defect SYN-DEF-000027 stays open until Casey Quinn reviews the retest, because Kim Taylor fixed it.
3. Earth continuity on CP-4: passed Tue 13 Oct at 0.09 Ω against ≤ 0.5 Ω.
4. Customer witness of the screen run: Noah Patel invited for Thu 15 Oct, 10:00.
5. Electrician's certificate of compliance: Hold, outstanding.

The release excludes screen drive 3, because change SYN-ECR-000014 (K3 contactor) isn't implemented. Draft plan r3 comes from the same change. The overview's other packages draw on PJ-06 and PJ-09, including SYN Precision Welding's expired qualification.

Every limit here is fictional. Claude added these synthetic values, and no other page holds them: SYN-ITP-000009 to 000014, SYN-ASR-000006, SYN-SVC-INS-21 and 22, SYN-PPO-INC-000021, and the 0.09 Ω reading and 0.5 Ω limit. No existing reference was rewritten.

**Differences from other pages, for those pages' next change (Q7):**
- PJ-09 shows stage 2 "Ready to offer" with 12 of 12 tests and the as-built released Mon 12 Oct, while this story has checks open on Tue 13 Oct.
- EN-08 draws T06 and SYN-DEF-000027 on Thu 15 Oct. This page keeps its values and draws them on Mon 12 Oct, before PJ-09's release.
- PJ-06 shows the certificate received Tue 13 Oct at 08:20 and in review. This page calls it outstanding until Jamie Rossi accepts it there.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md):

| Field | Declaration |
|---|---|
| Scope identity | `scope:PJ-09/site-assurance`, proposed `/projects/assurance`, traced to PRJ-06; all 78 parent IDs preserved |
| Page type (r20) | Overview: Register / worklist. ITP record: Record detail with Review / comparison. Witness, defect review and release: Form / guided workflow in the side panel. Phone: work queue |
| Reused components | Shell / Top bar 35:138 (linked); compact Phone header; v2 menu item, heading, strip and edge; Grid header cell, checkbox cell and row actions; My Work / Group row; Grid / List row (phone, proposed); Record Header, Check item, View tab, Field, Banner and Criterion row; Job pack / Callout; Controls / Form field (proposed); Tag; Button. New, on this page: the three parts in section 2 |
| Incoming handovers | PJ-06 accepted deliverables and evidence validity; FI-03 submitted attempts; EN-08 released test basis and accepted results; FI-06 incidents; an authorised EN-07 change; CS-06 and FI-05 status, read-only |
| Outgoing handovers | A scoped assurance release naming what is included and excluded, handed to PJ-09 as stage evidence. Prepared, reviewed, handed over and received are separate outcomes. A witness invitation is prepared as an Emails (EC-01) draft. No endpoint is assumed |
| Source authority | The sources listed above; Dean's request of 31 October 2026; synthetic fixtures |
| Proposed departures | D1–D12 in section 4. Accepted |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Site assurance — accepted", saved by Dean (section 7) |

## 4. What the design shows

| ID | Rule | Basis |
|---|---|---|
| D1 | Route and rail: `/projects/assurance`, with "Site assurance" shown as available in the design. No scope of its own: traced to PRJ-06 under PJ-09 | Dean's request; BP-06 J5; `src/shell/navigation.ts` has the item as unavailable |
| D2 | The unit is a work package with its own plan revision, not a project or a visit | QA workspace r01 section 3; PRJ-06 |
| D3 | The overview is a grid grouped by release state (Not started, In progress, Ready for release, Released with exclusions), with side-menu views. A package with no plan shows dashes and "Not started", never zeros or "assured" | Pipedrive grid preference; Dean's request |
| D4 | The ITP record drops the left details column, because nine columns don't fit in 820 px; plan facts sit in a strip above a flush grid. This differs from the PJ-09 record layout | Dean's column list |
| D5 | A hold point stops the next step and has no override here. Its tag is red only while open, and every status has words | Dean's request; EN-08 and PJ-09 designs |
| D6 | A witness point invites and doesn't stop work. Outcomes are Attended, Declined and Did not attend. Witnessing isn't customer acceptance. The invitation is an Emails (EC-01) draft, and nothing is sent from this page | Dean's request; ADR-0033 |
| D7 | Checks run where their owner keeps them: the FI-03 runner, EN-08, or PJ-06 for deliverables. The certificate check reads PJ-06's acceptance, so there's no second acceptance. None of those pages is redrawn | Dean's request; PJ-06 design |
| D8 | A failed attempt is kept and raises one defect per check with one retest chain, the same SYN-DEF as EN-08. The reviewer isn't the person who fixed it | [Inspections design](inspections-figma-design.md); [EN-08 D10](engineering-commissioning-as-built-design.md) |
| D9 | A changed plan is a new revision, shown as a comparison, with completed checks kept against theirs | BP-06 J5; Dean's request |
| D10 | A release names what's included and excluded, is reviewed by someone other than the preparer, and is withdrawn from current use if a source changes, keeping its history | QA workspace r01 section 9 |
| D11 | The release goes to PJ-09 as stage evidence. It never accepts for the customer, offers a stage, hands over to Service, makes a claim or closes a project | ADR-0033; BP-06 J5 |
| D12 | The phone is the site supervisor's work queue: today's checks, a hold point and attendance. Inputs use 16 px text and options are 48 px; at 320 they stack. CS-06 and FI-05 show as read-only context | Dean's request |

## 5. What this does not decide or build

- No route, page, navigation change, record type, capability or grant is added. "Site assurance" stays unavailable in the application until a build is separately requested.
- Q6's "Assurance released" check isn't on PJ-09. PJ-09 and any native release rule change only through their own decision.
- Whether Powerplants runs ITPs this way, real hold-point defaults, real limits, and who may review (D-019) stay open. Nothing here is a production claim.
- Not drawn: the Incidents and History tabs in full; writing or editing an ITP; returning a retest with a reason; reviewing a release; tablet versions of other frames; denied access; 200% zoom.

## 6. Verification

Audit of 31 October 2026, by script and screenshots, recorded on the notes card: every frame and state card viewed; 18 links copied from PJ-09 removed; Roboto only; no placeholders; nothing overlapping or outside a section. It fixed the rail tile fill, checks bar clipping, a confusing draft-versus-invited witness state, tablet header clipping and an old action on the handover frame.

At 1440 with the side menu open, the overview's Next step and Owner columns sit past the visible width and scroll into view.

Capture copies, 1 November 2026: 725 Font Awesome instances swapped to `Icon/placeholder` `67:77`. A re-scan found no Font Awesome instance, no visible vector outside a placeholder or the logo, and no prototype link.

Not run: click-through in Figma Present mode, physical devices, keyboard or screen reader. Design acceptance is not functional, business or deployment acceptance.

## 7. Named version

Dean saved the named Figma version on 1 November 2026: "I have saved the named version as Site assurance — accepted". Claude did not open the version history to check it. After the save, Claude updated the Named version field on the page header to say so; that text change isn't in the version.
