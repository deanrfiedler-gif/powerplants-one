# Automation technical assessment — N2 design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: route:/estimating/discovery/[id]/nursery/assessment. Scope ES-02; EST-02/03/06. Owner Dean Fiedler. Proposed native composition; owner visual acceptance pending. Exact Automation Figma frames, HTML and approved images are missing. The retained nursery route, NAC rule IDs and database names are compatibility identifiers.

## Workflow and handovers

Page type: r20 Form / guided workflow with Record detail and immutable history. Enter from saved Automation discovery for an exact alternative. Javo Standard 2.0 and Plus are the initial candidates; the Automation name also covers equipment used outside nurseries. No approved manufacturer limits are seeded.

Review the saved source, add ordered equipment/manual stages, record phase and independent selection/disposition, exact configuration evidence, separate equipment/installation/spare/waste/pack quantities, and scenario-qualified rates, dimensional limits, qualitative checks and manual operator allocations. Directed interfaces separately cover mechanical, electrical, air, control/data and stop/restart. Unknown values remain unknown.

Save and assess creates one immutable revision containing exact source, rule edition, inputs, result and two hashed HTML outputs: internal technical study and internal owned clarifications. Both are estimating studies, not fabrication or customer quote documents. Internal review is distinct from supplier approval. Products publication, paired shared parts/facts receiving, installation/commissioning labour costing and quotation content remain N3/shared work.

## Shared controls and layout

Reuse PageHeader, Field, Button, ErrorNotice, useCrmResource/useCrmCommand, shell and unsaved-navigation guard. Extracted local FactFields/Pick are identical N1 controls, now shared with N2. Component APIs and theme tokens are unchanged. Native labelled details and fieldsets provide progressive disclosure; every reorder has explicit earlier/later buttons, never drag-only controls.

## Desktop

1440 × 960 and 1024 × 768: one bounded content scroll, source context, history/actions, ordered process, scenario evidence, interfaces and saved results.
## Mobile

390 × 844 and 320 CSS px: stack fieldsets; retain 16 px inputs, 44 px actions, wrapping narratives/IDs and every task. Long engineering inputs are disclosed by stage and scenario rather than compressed tables. The ordered list is the initial accessible concept diagram; a spatial layout, site drawing and approved Figma design remain future work.

## State and recovery

Explicit history is read-only, including the latest revision. Current assessment permits a successor when authorised. A changed Nursery source requires explicit Start new assessment from latest source; no automatic remapping of removed scenarios or silent reuse of old ratings. Prior outputs stay byte-identical. Changed Discovery requires refreshing the Automation discovery first.

Transient refresh retains draft and original operation, blocks a new save, and offers retry. Definitive read denial clears protected content; identity/edit-authority changes clear the editor. Source changes or commercial holds preserve the draft and uncertain operation while blocking new acceptance. An uncertain save freezes inputs and offers original outcome recovery. A saved result shown during editing is explicitly labelled as the earlier revision's result.

ChecksSatisfied means only the recorded technical checks satisfy this rule edition. NeedsConfirmation and NotSuitable remain distinct. Missing stages, unsupported topology, missing manual allocations, assumed counts and unresolved compatibility cannot confirm capacity. Purchase quantity blockers are separate from technical findings. A future phase cannot satisfy a current target.

## Evidence

Functional fixtures: tests/unit/nursery-assessment.test.ts, tests/database/nursery-assessment.test.ts and tests/browser/nursery-assessment.spec.ts. N1 extraction regression: tests/browser/nursery-automation.spec.ts. Execution and outstanding acceptance are recorded in docs/testing/evidence/nursery-automation-n2/README.md. No accepted fingerprint, deployment or supplier sign-off is inferred.
