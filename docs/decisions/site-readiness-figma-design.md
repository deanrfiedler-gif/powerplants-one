---
document_id: PPO-FI05-SITE-READINESS-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; named Figma version saved; rebuilding the page, its data changes and operational rules separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Site readiness design — owner decision

On 24 October 2026 Dean asked Claude to "design and build the "Site induction, risk and biosecurity review (FI-05)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew and audited the page and asked "Do you accept the FI-05 design with the recommended answers?". On 31 October 2026 Dean answered: "Accept as recommended". That adopts departures D1–D12 and the recommended answers to Q1–Q6.

FI-05 is part of Dean's field-readiness pain point. It is the technician's own review of what a site requires. It is distinct from the customer site-readiness confirmation (P4) in the [field readiness gate](field-readiness-gate-proposal.md).

Claude drew the page from these sources:
- the built `/my-jobs/site-readiness` and its read model (`src/field/readiness.ts`, `src/shared/cs/readiness.ts`, `src/shared/cs/model.ts`), and the [FI-05 implementation decision](field-readiness-native.md);
- the design register entry `scope:FI-05` and [scope-fi-05](../design/development/pages/scope-fi-05.md);
- the accepted [Access & readiness design](access-readiness-figma-design.md) (CS-06), whose story and requirements this page reads exactly;
- the accepted [field readiness gate](field-readiness-gate-proposal.md), with amendment A06 of the [Job pack design](job-pack-figma-design.md) and A07 of the [My jobs design](my-jobs-figma-design.md);
- the accepted phone header amendment;
- the earlier direction in the [Quality, Safety & Site Assurance design](quality-site-assurance-design.md) and its r01 HTML.

Scope:
- `scope:FI-05`, route `/my-jobs/site-readiness`, with a proposed coordinator view (D7).
- Parent requirements SVC-03, SVC-06, SVC-10, NFR-01, NFR-07 and NFR-09 are unchanged. No parent ID is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, offline change or deployment. An acknowledgement grants no entry, induction, isolation, work, dispatch, report or Finance authority, and the page never declares a site safe.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design FI-05 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| Departures D1–D12 | Accepted as recommended, 31 October 2026 | "Accept as recommended". Section 4 |
| Q1 Acknowledge every visit, or only on change | Resolved as recommended | Standing rules (induction, risk controls, biosecurity, access) once per revision, carried forward while unchanged and, for an induction, while valid. Visit-specific approvals each visit and again after a move. A new site, area or activity always asks again. Each visit still records which acknowledgements it relied on |
| Q2 Does an open condition block or warn | Resolved as recommended | Block dispatch, not the technician. An open site condition or a missing acknowledgement keeps "Current site and isolation controls" unmet, so dispatch stays held until it is resolved or the service owner records a permitted exception. Reading and acknowledging are never blocked |
| Q3 Who maintains biosecurity rules | Resolved as recommended | The readiness owner records them in Access & readiness from the customer's own documents, cited with issue date and kept in SharePoint, with another editor reviewing each revision. The customer does not edit Powerplants One; a change from the customer becomes a new revision and asks for fresh acknowledgements |
| Q4 Should the customer see acknowledgements (CP-01) | Resolved as recommended | Not in this increment. Later at most a per-visit summary on the portal visit, never individual records or internal conditions. That needs its own CP decision and a privacy check |
| Q5 Story clashes on accepted pages | Recorded, as recommended | Section 5. No accepted page was changed. Fix them in the planner story when those pages are next changed |
| Q6 An explicit group on each requirement | Resolved as recommended | Yes. The readiness owner sets it in Access & readiness, defaulted from the kind. Powerplants One never infers a group from wording |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Saved 31 October 2026 at Dean's instruction | "Yes, save it". Section 7 |
| Rebuilding the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Site readiness · FI-05" `2336:85`, under "— Service operations —", after My jobs · FI-01 `845:44`. The page header `2336:86` holds the conformance declaration; the notes card `2347:807493` is in Flows and notes. File index row `2836:385003` in the Service operations table, after My jobs |
| Desktop 1440 | Coordinator review `2340:3414`; Casey Ward's readiness, full length `2342:799545`; requirement detail, Riley Tran's induction `2342:800060` |
| Tablet 1024 | Technician view with the changed rule selected `2343:801979` |
| Phone 390 | Readiness list, full length `2338:816`; requirement detail with Acknowledge `2338:1021`; biosecurity rules `2338:1090`; changed since acknowledged `2339:363`; all acknowledged, one condition open `2339:423`; offline `2339:539` |
| Phone 320 | The same six: `2339:798453`, `2339:798667`, `2339:798742`, `2339:798839`, `2339:798909`, `2339:799040` |
| States (phone 390) | Loading `2346:805888`; no requirements recorded `2346:805952`; could not load `2346:806028`; source withdrawn `2346:806108`; queued offline `2346:806143`; uncertain `2346:806196`; condition overdue `2346:806239` |
| Page parts | Section "Page components (proposed)" `2336:154`: Site readiness / Requirement row (five states) `2337:797397`, Condition card `2337:797398`, Gate summary `2337:797410`. They stay on this page until a build needs them |
| Prototype | Flows "FI-05 — phone" (from `2338:816`) and "FI-05 — desktop" (from `2340:3414`); 17 links set, none off the page |
| Retained captures | [Site readiness design r01](../reference/ui/service/site-readiness-design-r01/README.md): 23 icon-free PNGs with hashes, from copies `2836:394387`–`2836:401270` on Captures at y = 678,000 and 680,300 |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, matching Access & readiness: SYN Glasshouse 4 (Hillview Growers, Gatton), SYN-PPO-APT-000052, electrical work in bay 4 by Casey Ward and Riley Tran, moved at 08:51 to Thu 15 Oct 08:00–11:00; readiness owner Sam Patel; revision 3 with seven requirements, reviewed Fri 2 Oct by Jordan Kim; inductions 1 of 2; the shade screen isolation approval covers Tuesday only. Sasha Cole is the signed-in coordinator.

- **Casey Ward:** 5 of 7 acknowledged. The induction is acknowledged; "No plant material between houses" changed to revision 2 (a bay 5 crop-restriction zone); the isolation approval is still to acknowledge for this visit.
- **Riley Tran:** 6 of 7 acknowledged, with the induction outstanding; the induction evidence, captured at 08:40 by Sam Patel, needs another editor's review.
- **Open condition:** the isolation approval, owned by Sam Patel, the readiness owner.

New synthetic facts:
- Casey's six acknowledgements at revision 1, Thu 24 Sep 2026 07:42, on an earlier visit.
- Revision 2 of the movement plan: bay 5 restricted until Fri 30 Oct, reach bay 4 by the east corridor.
- The source texts for the isolation approval and the induction.
- Riley opening the page at 08:55.
- SYN Coastal Berries Glasshouse 1 (SYN-PPO-WO-000038, Wed 14 Oct) having no readiness record.
- Morgan Lee not having opened SYN-PPO-APT-000061.
- A state example in which revision 5 (Wed 14 Oct 15:40) withdraws the spray re-entry requirement.

These source texts and rules are not Hillview Growers, Powerplants or regulatory rules.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FI-05`, `/my-jobs/site-readiness`; coordinator view `/my-jobs/site-readiness?view=team` proposed (D7). Parent IDs above, unchanged |
| Page type (r20) | Phone: Register / worklist with Record detail and a guided acknowledgement. Desktop: Review / comparison and Record detail. Tablet: Work queue + persistent detail |
| Reused components | Shell v2 (Rail · Service `198:3778`, detached on desktop for one proposed menu item; top bar with the Conversations action `1175:2205`), Shell / Phone header · compact `1530:110`, v2 / Tab bar (phone) `107:149`, Record / Readiness bar `239:1800` with Check item `239:1799`, Visit / Crew row `848:103`, Record / Field `224:12`, Record / History item `224:19`, Tag, Button. New parts as in section 2 |
| Incoming handovers | My jobs FI-01; the exact appointment, assignment and schedule version; Access & readiness at its exact revision, read-only; Sites access and biosecurity notes, read-only; Field team PL-02 induction competence, read-only (proposed link, D10) |
| Outgoing handovers | A personal acknowledgement per requirement revision; the readiness summary to the field readiness gate; owned conditions stay with Access & readiness. It never clears a condition, edits a requirement, verifies evidence, declares a site safe, grants work authority, books, dispatches or contacts the customer |
| Source authority | The sources listed above |
| Proposed departures | D1–D12 in section 4, accepted |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Site readiness — accepted", saved 31 October 2026 |

## 4. What the design shows

| ID | Departure, accepted | Basis, or what exists today |
|---|---|---|
| D1 | Phone first. The list for the next visit uses the compact List header (its view chooser is the visit chooser) and My jobs' tab bar. Requirement, group and comparison screens use the Record header, no tab bar and one 48 px action. Desktop and tablet use the Service shell | Phone header amendment. Built: a desktop-style card stack with a visit chooser and an explicit facility and activity selection |
| D2 | One acknowledgement per requirement revision (name, time, requirement revision, source revision, visit) | Built: `acknowledgeFieldReadiness` stores one Acknowledged event per snapshot and presented hash, for the whole source. Per-requirement records need a model change |
| D3 | The CS-06 kinds shown in five groups: Induction, Risk controls, Biosecurity, Isolation and approvals, Access | "Site approval" covers both a hazard control and access, so the group needs its own field (Q6) |
| D4 | Standing rules carry forward while unchanged; visit-specific approvals are acknowledged per visit and after a move | Q1. Built: acknowledgements are bound to the appointment, assignment and schedule version |
| D5 | Changed since you acknowledged shows the two revisions and an Unchanged / Added / Removed comparison; the earlier acknowledgement stays with its revision | PPO-UI-CONFORMANCE; the built `SourceChanged` refusal keeps the old review |
| D6 | Unresolved conditions come first, each with its owner and next step. The technician can't clear one; an escalation is a retained note | scope-fi-05; the owner on the CS-06 blocker |
| D7 | Coordinator review: a proposed "Site readiness" menu item under Field and inspections, all technicians on visits in the next 14 days, with counts, induction evidence, conditions and gaps, linking owners to Access & readiness. Read-only | Needs a cross-visit read model and a read-permission decision. Built: the route serves only the signed-in technician |
| D8 | Gate summary line "Site readiness: n of m acknowledged, k condition(s) open". Never "safe", "ready to work" or "cleared" | Field readiness gate, Job pack A06, My jobs A07 |
| D9 | Offline: acknowledgements queue with their original request and count on the gate only once saved; a changed revision refuses the save | ADR-0013 and the FI-02 protocol. Built: online only |
| D10 | Induction evidence is read from Field team PL-02 competence linked to the person, beside the CS-06 evidence review. Until that link exists the page says "Not verified"; a name match or an acknowledgement never counts | `field-readiness-native.md`: no canonical Person link today |
| D11 | "What you must do" is a short separate field written by the readiness owner, beside the exact source text. Powerplants One never paraphrases the source | Built: a requirement has only title, kind and source |
| D12 | A zone sketch the readiness owner attaches to a biosecurity requirement revision, labelled "not to scale and not a site map". Never generated from text | Not built |

States: no requirements recorded is shown as a gap, never as ready; could not load shows nothing rather than an old copy; a withdrawn source keeps the earlier acknowledgement; an uncertain save rechecks its original request and counts as not acknowledged; an overdue condition stays with its owner and dispatch stays held.

## 5. What this does not decide or build

- **Rebuilding `/my-jobs/site-readiness`** to this design, and each model change it needs: per-requirement acknowledgements (D2), the group field (Q6), the action field (D11), the zone sketch (D12), the coordinator read and its permission (D7), the PL-02 person link (D10) and offline queueing (D9). Each needs its own go-ahead.
- **Q2 in the gate build.** The gate's "Current site and isolation controls" criterion doesn't read FI-05 today. The answer is recorded for that increment, and the [gate record](field-readiness-gate-proposal.md) carries a note. Job pack and My jobs frames are unchanged.
- **Not drawn:** the visit chooser sheet, the note to the coordinator, the filters panel, denied or view-only states, a coordinator on the phone, desktop states and 200% zoom.
- **Q5 story clashes, for those pages' next change:**
  - My jobs (Mon 12 Oct) gives Casey Ward "Dosing pump follow-up", Thu 15 Oct 10:00–12:00, which overlaps SYN-PPO-APT-000052 after its move.
  - My jobs and Job pack put SYN-PPO-WO-000040 at Glasshouse 3 (SYN Greenhouse Demonstration), while Field team links SYN-PPO-APT-000052 to it at SYN Glasshouse 4, so this page shows no work-order number for that visit.
  - Glasshouse 4 is Hillview here and on Access & readiness but Riverbend on some other proposed pages.

## 6. Verification

Audit of 24 October 2026, by script and screenshots: Roboto only; status always in words; no placeholder or leftover copied text; no off-page prototype link; "safe" appears only in "never declares … safe"; no overlap and nothing outside a section. The story was checked against the accepted Access & readiness frames.

**The flows were not played in Present mode.** The 17 links were set by script and each returned success.

The 23 captures are copies on the "Captures (icon-free)" page `115:2`. A scan after the swap found no Font Awesome instance, no prototype link, and no visible vector outside a placeholder or the logo. They were exported at scale 1 and match their frames' sizes; samples were inspected by eye. The hashes are in the [captures README](../reference/ui/service/site-readiness-design-r01/README.md).

Design acceptance is not functional, business or deployment acceptance. No device, accessibility or operational review is recorded. The register's visual status stays "Needs review", and no review fingerprint was copied.

## 7. Named version

Asked "Shall I save the named version "Site readiness — accepted"?", Dean answered: "Yes, save it". Claude saved it in the Figma desktop app on 31 October 2026 and saw it at the top of the file's version history, marked "just now", after reopening the panel. The page header's Named version field was updated just after the save; that is a text-only change after the named version.
