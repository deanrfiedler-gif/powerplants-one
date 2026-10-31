# PJ-05 commercial record

Stable scope: `scope:PJ-05`. Owner: Dean Fiedler. Application visual review: pending. The [accepted design](../../../decisions/project-commercial-figma-design.md) and [retained captures](../../../reference/ui/projects/project-commercial-design-r01/README.md) govern this page.

## Tasks and native authority

Open `/projects/[id]/commercial/[entry]` from a permitted register row. Inspect Overview, linked Activities and retained History; Basis also offers Sources. On phone, Details contains the desktop facts column. All writes use native commercial commands and exact versions. Refer to the [contract](../../../contracts/project-commercial-controls.md#native-page-contract--pj-05) and the Draft `guide.pj.05` guide.

## Desktop

Desktop composes SharedRecord with a title/action header, source facts strip, left details column and right tabbed workspace. Its full-bleed root opts in using `data-ppo-workspace="shared"`; no page IDs are added to shared CSS lists. At 1440 and 1024, retain separate requested, priced and approved amounts and wrap actions without hiding authority explanations.

## Mobile

At 390 and 320, move the facts column into the Details tab. Overview, Activities and History remain keyboard-accessible; amounts stack with their labels. Header actions wrap; decisions use the shared dialog with a bottom-sheet presentation. Inputs use 16px text. The 320 record is an adaptation because only the register has an accepted 320 frame.

## Components, handovers and adaptations

Incoming: permitted Project, exact received Sales handover, accepted quotation, reviewed document and native Activities. Outgoing: exact native review decisions and the synthetic Finance read. No schedule, invoice, MYOB or customer-message effect.

The [consumer binding note](../component-bindings/2026-10-31-project-commercial-ui.md) names shared controls. The [evidence chapter](../../../testing/evidence/project-commercial/README.md) separates checked behaviour, visual comparison, owner acceptance and deployment. PR #698 is unmerged: the Project record Commercial view remains excluded. G8 prospective values are omitted as instructed. No readable record numbers, cross-project reviewer queue, notice links/kinds/attachments, offline use or My Work items.

Undrawn notice records, other-record History and Activities tabs, basis Sources, Revise, Withdraw, Reopen, Request waiver and signed adjustments reuse the shared record/dialog pattern. Tablet/phone Obligations, Notices, Basis and Value breakdown and the 320 record remain adaptations requiring review. Selection supports previewing one selected record; no bulk commercial command exists. Previous/next navigation follows the complete permitted register within the same record kind, and stays disabled during a stale or partial read. Preview and Open record are available row actions. Phone records keep Open basis and a decision or satisfaction action in a bottom action area; More actions contains navigation and other native commands. Value breakdown groups approved changes, pending, disputed and excluded records and explains the server-provided reconciliation without a second calculation engine. The retained basis amount also requires both Finance duties. The phone values card condenses the same server measures and preserves the known subtotal when the requested total is incomplete. Decision dialogs reuse the shared modal with a phone bottom-sheet presentation. These differences are not visually accepted.
