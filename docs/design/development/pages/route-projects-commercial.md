# PJ-05 commercial workspace implementation

Stable scope: `scope:PJ-05`. Owner: Dean Fiedler. Application visual review: pending. The [accepted design](../../../decisions/project-commercial-figma-design.md) and [retained captures](../../../reference/ui/projects/project-commercial-design-r01/README.md) govern this page.

## Tasks and native authority

Use `/projects/commercial` to choose a project and inspect Variations, Obligations, Notices, Commercial basis and Value breakdown. Open `/projects/[id]/commercial/[entry]` for Overview, Activities, History and Details; Basis also offers Sources. All writes use native commercial commands and exact versions. Refer to the [contract](../../../contracts/project-commercial-controls.md#native-page-contract--pj-05) and the Draft `guide.pj.05` guide.

## Desktop

Desktop composes SecondaryMenuFrame, the shared RegisterTable and SharedRecord. The root opts in using `data-ppo-workspace="shared"`; no page IDs are added to shared CSS lists. At 1440 and 1024, keep one scrolling content owner, grouped rows, the project picker and unknown-safe control values. 

## Mobile

At 390 and 320, use stacked list rows, labelled amounts, a view picker and a Details tab; forms use 16px inputs and reachable actions. Compare the actual captures and inspect keyboard focus, wrapping and stale/error states before claiming review.

## Components, handovers and adaptations

Incoming: permitted Project, exact received Sales handover, accepted quotation, reviewed document and native Activities. Outgoing: exact native review decisions and the synthetic Finance read. No schedule, invoice, MYOB or customer-message effect.

The [consumer binding note](../component-bindings/2026-10-31-project-commercial-ui.md) names shared controls. The [evidence chapter](../../../testing/evidence/project-commercial/README.md) separates checked behaviour, visual comparison, owner acceptance and deployment. PR #698 is unmerged: the Project record Commercial view remains excluded. G8 prospective values are omitted as instructed. No readable record numbers, cross-project reviewer queue, notice links/kinds/attachments, offline use or My Work items.

Undrawn notice records, other-record History and Activities tabs, basis Sources, Revise, Withdraw, Reopen, Request waiver and signed adjustments reuse the shared record/dialog pattern. Tablet/phone Obligations, Notices, Basis and Value breakdown and the 320 record remain adaptations requiring review. Selection supports previewing one selected record; no bulk commercial command exists. Previous/next record navigation is not implemented. Preview and Open record are available row actions. The phone values card retains six labelled measures rather than the reference's condensed prose. Decision dialogs reuse the shared modal with a phone bottom-sheet presentation. These differences are not visually accepted.
