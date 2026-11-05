---
document_id: PPO-CX02-WORKSHOP-SETTINGS-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; workshop settings model, duties, native implementation and UI baseline acceptance separate
source_commit: c879180921687b5e7031545a74ff7eedb5e3d510
versioning: git
---

# Workshop settings design — owner decision

On 19 October 2026 Dean made the workshop a full module and listed "workshop settings, once designed" among the Settings hub's areas ([WS-D2, WS-D6](workshop-settings-preferences-scope.md)). On 31 October 2026 Dean asked: "Your task is to design and build the "Workshop settings" configuration area (CX-02) in Figma as a proposal for my review." Claude drew the page, flagged two places where the brief disagreed with the accepted Workshop builds frames, and asked: "Do you accept the Workshop settings CX-02 design with my recommendations?" On 1 November 2026 Dean answered: "Accept and lock in". That adopts D1–D12 and the recommended answers to Q1–Q9, including the relabelling in Q6 and Q7.

Scope:
- `scope:CX-02/settings`, a page within `scope:CX-02` ([PPO-UI-SCOPE-ID-MAPPING-DEC](ui-scope-id-mapping.md)), at `/admin/settings/workshop` with `/admin/settings/workshop/{area}` (both proposed), opened from the Workshop card on the [Settings hub](settings-hub-figma-design.md).
- Traced to the master blueprint's workshop scope ([BP-01](../blueprints/BP-01-master-blueprint.md) §14.4). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, MYOB connection or deployment. Every limit, person, date and record shown is synthetic; no limit is a real standard or a manufacturer's figure, and none is an operating rule.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Workshop settings in Figma as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| Accept the design | User decision, 1 November 2026 | "Accept and lock in", answering the question quoted above |
| Departures D1–D12 | Accepted as recommended | Section 4 |
| Q1 Who publishes | Resolved as recommended | The workshop lead publishes every area except release rules, with Dean or another second person reviewing. Dean publishes release rules, with the lead reviewing, because they limit the lead's own authority. Every publication involves two people, as [AD-02 Q1](settings-hub-figma-design.md) requires |
| Q2 Source of test limits | Resolved as recommended | Limits are PPO's to set, with a source recorded on every version: Workshop choice, Manufacturer or Standard. A manufacturer or standard source names its document in the Document library. Real limits need someone competent to enter them |
| Q3 Serial numbers each year | Resolved as recommended | No reset. The year digits change and the number stays the build number, so a serial leads back to its build and is never issued twice |
| Q4 MYOB serial tracking | Open with the MYOB partner | Unknown, so nothing assumes it. Dean is to ask the MYOB partner about dosing units and control panels. Until then PPO keeps its own sequence and sends the serial with the finished unit. The page says "MYOB serial tracking: to be confirmed with the MYOB partner" |
| Q5 Lead built the unit | Resolved as recommended | A named stand-in lead, set in Settings. Until one is named the release waits. This extends Workshop builds Q3, which didn't cover the case |
| Q6 CP-4's limit | Resolved as recommended | The brief had the old limit at 1.0 Ω; accepted frames `1690:870` and `1690:1015` print 0.5 Ω. The page now reads at most 0.5 Ω to at most 0.2 Ω, so the accepted frames and retained captures stay true |
| Q7 WI-FDU-4's revision | Resolved as recommended | The brief said revision 3; accepted frame `1690:208` has SYN-PPO-BLD-000042 on revision 5. The page now has revision 5 in force and revision 6 next, and reads "Builds in progress keep revision 5" |
| Q8 Forcing adoption | Resolved as recommended | A tighter limit doesn't force builds in progress to adopt it. Affected work names each such build so the workshop lead decides. A safety-related limit that should force adoption would need its own decision |
| Q9 Reference | Resolved as recommended | SYN-TDF-000nnn for test definitions under the [20 October rule](readable-reference-namespaces.md). Proposals take no reference, as AD-02 Q5 decided |
| Named Figma version | Saved by Dean, 1 November 2026 | "Workshop settings — accepted". Dean: "I have saved the named version as Workshop settings — accepted". Claude did not open the version history to check it. |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Workshop settings · CX-02" `3016:6710`, under "— Administration —", after Settings amendments · AD-02. Its header `3016:6711` holds the conformance declaration and its notes card `3036:30408` is in Flows and notes |
| Desktop 1440 | Overview `3018:871`; work instruction template, WI-FDU-4 revision 5 `3024:2099`; test definitions register `3020:1010`; test record, Earth continuity, History `3026:2445`; release rules `3022:1599`; serial numbering `3022:1957`; propose a limit change `3029:3406`; review, Dean's view `3029:3983`; publish with affected work `3029:4855` |
| Tablet 1024 | Overview, rail and side menu collapsed `3031:10585` |
| Phone 390 and 320 | Overview `3031:73199` and `3031:73661`; review sheet, Dean's view `3031:308074` and `3031:308211` |
| States | Loading `3031:538497`; no proposals `3031:538888`; could not load `3031:539478`; read-only, Jesse Moore's view `3031:539844`; proposer is the reviewer, refused `3031:540317`; review out of date `3031:540608` |
| Page parts | Section "Page components (proposed)" `3016:6779`: Workshop settings card `3016:12850`, Test definition grid header `3016:12873` and row `3016:13001`, Work instruction step row `3016:13003`. They stay on the page |
| Prototype | Flows "Workshop settings — desktop" (overview, cards and tabs to each drawn area, the register or attention row to the test record, Propose, Review, Publish, then no proposals) and "Workshop settings — phone" (390 overview to the review sheet and back) |
| Story | Synthetic, as at Thu 22 Oct 2026, 10:00 Brisbane time, signed in as Drew Collins (workshop lead). Drew saved Earth continuity version 2 (at most 0.5 Ω to at most 0.2 Ω, SYN-TDF-000001) on Wed 21 Oct, 16:20, and it waits for Dean's review. CP-4, SYN-PPO-BLD-000040, keeps its two results under 0.5 Ω: 1.4 Ω failed on Mon 12 Oct, 14:30, rework RW-1, and 0.08 Ω passed on Tue 13 Oct, 08:30, both by Jesse Moore with SYN-MEG-002. WI-FDU-4 is at revision 5, with SYN-PPO-BLD-000042 in build on it. Later frames say so in their labels: reviewed 11:05, publish 14:10, published 14:12, or revision 2 saved 14:32 |
| Retained captures | [Workshop settings design r01](../reference/ui/settings/workshop-settings-design-r01/README.md): twenty icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CX-02/settings`, a page within `scope:CX-02`, at `/admin/settings/workshop` (proposed). No capability exists; the duties shown are a later permission decision. Parent IDs unchanged |
| Page type (r20) | Overview / dashboard for the eight areas. Register / worklist for test definitions. Record detail for a work instruction template and a test definition. Form for Propose and Publish. Review / comparison for Review |
| Reused components | Shell / Top bar `35:138` (linked), Rail · Supply chain with Workshop (More selected), the AD-02 side menu, Attention row, Term list header and Term row, Record / Header, Readiness bar, Field, Section heading, View tab, Banner and History item, Grid / Header cell, Cell, Checkbox cell, Row actions cell and Group band, Tag, Button, Controls / Form field and Choice option, Shell / Phone header · compact, Grid / List row (phone), v2 / Tab bar, Quick add. New: the parts in section 2 |
| Incoming handovers | The Settings hub Workshop card (AD-02). Released materials and intended configurations stay with Engineering (EN-06, EN-08). Welder qualifications come from Field team (PL-02), the controlled inspection form from FI-03 and FI-04, instrument classes and calibration from Test instruments (EQ-09), and MYOB mappings from Mappings & reconciliation (AD-05) |
| Outgoing handovers | Published versions and revisions to Workshop builds, Kitting & controllers and Bench testing & returns, from the next build started. Affected work to the workshop lead. History to Audit history (AD-07). Nothing goes to MYOB from this page |
| Source authority | [WS-D2 to WS-D6](workshop-settings-preferences-scope.md); [Workshop builds](workshop-builds-figma-design.md) Q2, Q3 and D3 to D7; [Settings hub](settings-hub-figma-design.md); [scheduling-policy publication](scheduling-policy-publication.md); [Template management](template-management-figma-design.md); [MYOB book of record](ppo-workspace-myob-book-of-record.md) EI-1 to EI-10. The Settings amendments, Kitting, Bench testing, Test instruments and AD-05 pages are proposals, read and not accepted by this record |
| Exceptions and recovery | Loading, no proposals, could not load, read-only, proposer is the reviewer (refused) and review out of date are drawn |
| Proposed departures | D1–D12 in section 4, accepted |
| Verification | Section 5 |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Workshop settings — accepted", saved by Dean, 1 November 2026 |

## 4. What the design shows

| ID | Departure | Basis |
|---|---|---|
| D1 | Place: More › Administration & support › Settings › Workshop. The side menu is AD-02's with Workshop selected. The rail keeps the person's department with More selected: Supply chain for Drew, as Test instruments does, and Service for Dean, as AD-02 does | WS-D6, AD-02 D1 and D2 |
| D2 | Overview: eight cards, each with status in words, version in force, proposals waiting and owner, under a Waiting for a decision list. Tabs reach each area; four sit behind More ▾ | AD-02 overview pattern |
| D3 | Work instruction template: the shared record layout with a Template state bar, steps with evidence, test references and weld steps, then revisions with the builds on each. Step wording is the accepted WI-FDU-4 steps | Workshop builds D5 |
| D4 | Test definitions: a grouped grid with test, status, value type, limit, unit, instrument class and version in view, then source, used by and reference scrolling in. The result still follows from the value and the limit | Workshop builds D5 |
| D5 | A limit change is a new version. A work instruction revision names the test versions it uses, so publishing raises a new revision for new builds. Builds in progress keep their revision; the workshop lead can adopt a newer one for one build. Recorded tests keep their limit and are never worked out again | Brief; Workshop builds D5 |
| D6 | Release rules and serial numbering in plain words, as accepted in Workshop builds Q3 and Q2. Dean owns release rules rather than the workshop lead | Q1 |
| D7 | Propose, Review and Publish: centred dialogs on desktop, full-height sheets on phone. A review by the proposer is refused and the publisher can't be the reviewer. A new proposal revision makes the review out of date, and publish refuses in plain words | AD-02 Q1 and D6 |
| D8 | The MYOB mapping card is read-only and links to AD-05. Publishing sends nothing and changes nothing in MYOB; only booking out and release reach MYOB, from the build record | Option A, EI-1, EI-3, Workshop builds D7 |
| D9 | What stays elsewhere: presets hold preparation steps only, and released configurations stay with Engineering. Parts lists stay with released materials. Qualifications are read from Field team, not copied. Calibration stays in Test instruments | WS-D4 |
| D10 | Whose view: most frames are Drew's. Review is Dean's, because Drew can't review their own proposal. Read-only is Jesse Moore's | AD-02 D7 pattern |
| D11 | CP-4's limit difference, resolved by Q6. The EQ-09 proposal also puts the failed test at 14:25; this page follows the accepted 14:30 | Accepted `1690:870`, `1690:1015` |
| D12 | WI-FDU-4's revision difference, resolved by Q7. That build was due Thu 15 Oct on the accepted page and is still in build on 22 Oct, so no step count is shown for it | Accepted `1690:208` |

## 5. Verification

- Claude checked the frames with screenshots taken inside Figma and read one export by eye; the rest were checked by scan and PNG header. An audit measured every truncating text against its box and fixed the two that clipped. Grid columns that scroll under the fixed settings column are as designed.
- After acceptance every limit and revision label was re-read against Q6 and Q7. A first pass changed instance-bound labels twice and turned WI-CP-4's next revision into revision 5; a list of every limit and a look at the capture caught both, and both were corrected before export.
- All 16 top bars are linked instances of `35:138`. No frame overlaps another or sits outside its section. All 60 prototype links point to frames on this page.
- The twenty captures are copies on the "Captures (icon-free)" page at y = 1,580,000 (`3093:615012` to `3093:621177`). Overlay layers were removed. Each visible icon instance was swapped for `Icon/placeholder`, and a re-scan found no Font Awesome instance, stray vector or prototype link left.
- PNG dimensions match their frames. Exported at scale 1 with the Figma connector; hashes are in the [captures README](../reference/ui/settings/workshop-settings-design-r01/README.md).
- Claude did not play the flows in Present mode. No owner device, keyboard, screen reader or 200% zoom review is recorded. The captures are design compositions and set no UI baseline.

## 6. Not decided and not drawn

- **Building the page.** Not decided. No route, read model or capability exists.
- **Prerequisites for a build:** a versioned settings model for work instructions and test definitions, with revisions that name test versions; review and publish duties and their capabilities; the stand-in lead (Q5); the MYOB partner's answer on serial tracking (Q4); and the Acumatica tenant contract (DEC-CCE-10) before anything is sent.
- **Not drawn:** area pages for Welding requirements, Controller presets & kitting, Bench test procedures and MYOB mapping (cards only); the Version 2 proposal and Affected work tabs at full size; Compare versions; Add a test definition; the publish receipt; the phone Propose and Publish sheets; how a build shows that a newer limit exists; a build of several units.
- **Neighbouring pages:** the proposals this page draws on stay proposals. Accepting it doesn't accept them.
