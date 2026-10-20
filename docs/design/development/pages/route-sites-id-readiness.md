# Access & readiness — CS-06

Stable entry: `route:/sites/[id]/readiness`. Owner: Dean Fiedler. Native owner visual review: **pending**. Route: `/sites/[id]/readiness`. r20 page type: Planning workspace; Review / comparison. Parent requirements PRJ-04, SVC-03, SVC-04, SVC-06, SVC-10 and NFR-02 remain unchanged.

## Authority and sources

The [accepted design](../../../decisions/access-readiness-figma-design.md) records Dean's acceptance of D1–D7/Q1–Q4. Live source: **PPO - Design**, named version **Access & readiness — accepted**. Page `1400:346423`, notes `1400:347414`; File index `630:2` confirms CS-06. The [native implementation decision](../../../decisions/access-readiness-native-build.md) records the 20 October authorisation for supporting backend work.

| Frame | Node | Retained capture |
|---|---|---|
| Desktop Overview, Thu 15 Oct | `1400:346553` | 01 Desktop Overview |
| Requirements | `1400:351900` | 02 Desktop Requirements |
| Evidence, independent review | `1400:353096` | 03 Desktop Evidence Review |
| Acknowledge with a blocker | `1400:353479` | 04 Desktop Acknowledge With Blocker |
| Tablet | `1400:354078` | 05 Tablet Overview |
| Phone 390 | `1400:347071` | 06 Phone Overview |
| Phone 320 | `1400:355748` | 07 Phone 320 Overview |
| Source changed / no requirements | `1400:356261`, `1400:356329` | 08 Phone States |

All files and provenance are in the unchanged [icon-free design r01 evidence](../../../reference/ui/site-access/access-readiness-design-r01/README.md). Live metadata, screenshots, design contexts, variables and notes were inspected. No private file locator or Pro artwork is retained. Generated Figma code is a reference, not application code.

## Desktop

Use the live shell's Service / More context and a full-bleed shared record. The title and readiness tag precede Site, revision, time zone and as-at metadata. Actions open preparation; P4 contact remains disabled with an explanation. The bar meets the record edges. A ruled 380 px facts column contains Site/owner, selected visit, source basis and boundaries; tablet uses 300 px and the shell's collapsed rail. Tabs are Overview, Requirements, Evidence, Work windows, Visit preparation and History.

The check card states the exact interval, activity, areas and requirement revision. Server-produced blockers link to their owning section; met evidence rows use the same server assessment. The browser does not calculate a second readiness result. Changes retain old checks and require a recheck. Requirements use a semantic table grouped by whole-Site/area scope with full-width group bands, kind, activity, source revision and evidence state in words.

Evidence review shows exact capture facts as read-only rows; only the note is editable. Acknowledgement shows visit, check, requirement revision, areas, activity, visitors and blocker count; only the reason is editable. Its five authority outcomes remain explicit. A stale refusal keeps the reason in memory; a new check must be explicitly selected before reusing it.

## Mobile

Use the current 56 px shared compact header at 390 and 320 CSS px. The check precedes gated P4. Overview, Evidence, Windows and History lead the semantic tab order; Requirements and Visit preparation remain in the scrolling strip and More. Facts remain below the workspace, with a Site details handover. The sticky footer has More, gated Record contact and Check again (Add requirement when empty). At 320 px the contact explanation is in More.

Long values wrap; the requirements table has its own labelled horizontal scroll region. Inputs are labelled; tabs support arrows/Home/End, controls retain visible focus and touch targets, errors use the shared focused summary. URL selection and unsaved-work protection remain. This page is online only, without an offline command queue. Revalidation removes inaccessible content; uncertain saves reconcile the original operation.

## Data, components and handovers

Reuse `shared.read`/`shared.edit` and permitted Scheduling reads. No capability, migration, dependency or production integration is added. Requirement drafts use immutable purpose-labelled Submission snapshots. Only the latest draft can be independently published; all contributors remain excluded, including after a return. Active requirements stay in the row for Field consumers. An evidence/window save cannot replace requirements. Retired IDs cannot revive old evidence.

Visit-bound checks retain the server's appointment interval, schedule, assignment and scope basis at the same Site/company. A move or reassignment requires a recheck. Unbound checks are labelled. Acknowledgement grants no work authority, booking, resource reservation, pack issue or dispatch clearance.

Incoming: exact Site and permitted readiness, area, person and appointment records. Outgoing: canonical Site, scoped survey register, exact appointment and owning evidence/window sections. MYOB remains ERP authority; SharePoint owns documents; native CAD retains authoring. No customer message is sent.

Reused: SharedRecord, RecordFactSection, PageHeader, Button, RecordTabs/RecordPanel, Field/SelectField, LocalDateTimeField, MultiChoice, ContentEditor, ReadState, ErrorNotice/ValidationFields, CommandStatus, WorklistMenu, ProductIcon, usePhoneHeader and command/recovery hooks. SharedRecord gains optional source-bar labelling/title status placement, preserving original defaults. CS authoring gains bounded readiness modes. No new shared component is introduced.

## Adaptations and open questions

- P4 is **Not available**, rather than a fabricated Not asked observation. Its form, persistence and planner/job-pack propagation, weekdays and Conversations remain outside scope.
- Real permitted records supply names, visits and dates. No story values, record positions, source-document links or unrecorded contact facts are fabricated. Capture dates are shown without invented signed timestamps.
- Shared token/radius values remain authoritative in code. Differences from Figma remain alignment items; no new legacy exception is claimed accepted.
- Work windows, History, authoring, the check form, desktop loading/error/denied/partial views and 200% zoom have no drawn page-specific frame. Existing controls/recovery supply these states. Owner review of those compositions remains open.
- The future P4 contact journey and weekday rules remain unresolved here, as D3/Q1/Q3/Q4 require. No additional business rule is inferred.

## Verification and acceptance

[Current evidence](../../../testing/evidence/access-readiness-native/README.md) separates source inspection, executed checks and native comparison. Guide: `guide.route-sites-id-readiness`. Figma acceptance grants no native application acceptance, physical-device approval, independent review, deployment or production readiness. Owner visual review stays pending.
