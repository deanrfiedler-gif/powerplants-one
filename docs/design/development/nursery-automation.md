# Automation Configurator working design note

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: proposed design with N1 native capture and N2 technical assessment implemented below; no accepted visual baseline or deployment. Scope: existing ES-02 discovery, ES-03 CPQ handover and ES-05 output. Basis: [specification](../../blueprints/nursery-automation-configurator.md) and [scope decision](../../decisions/nursery-automation-specification.md).

## Views and actions

| View | Main work and visible result |
|---|---|
| Overview | Exact customer/site/alternative/source, dirty/saved state, scenario and next owned actions. Separate technical, receiving, costing and quotation readiness. |
| Requirements | Conditional questionnaire, input provenance, samples and unanswered questions. |
| Production scenarios | Crop/container/media matrix, gross/net rates, shifts/changeovers and manual stages. |
| Process and equipment | Ordered stage diagram with equivalent accessible table; new/existing/reused/customer-supplied dispositions and candidate comparison. |
| Interfaces and site | Connection register, utilities, clearances, enabling works and responsible party. |
| Delivery scope | Profiles, activities and separate applicability/selection/responsibility/review; installation, commissioning, training and supplier coverage. |
| Quantities and handover | Parts plus separately labelled labour facts; exact run/source versions, mappings, findings and receiving preview. Shared CPQ preview, if available, is labelled provisional until accepted. |
| Outputs and history | Exact eligible documents, saved revision comparison and source/profile changes. |

Reuse the application shell, SecondaryMenuFrame, shared Button, register/table, form, validation, dialog/drawer, status, evidence and history patterns already used by the specialist workbenches. Reuse the shared CPQ receiving preview and review flow. N1 binds Button, Field and ErrorNotice in the component register; the other planned consumers remain reference-only.

Incoming: saved Discovery/Express, exact Products/profile references and authorised evidence. Outgoing: unpriced material proposal, shared versioned labour-fact/delivery projection, findings and sealed output manifests. CPQ prices and resolves one activity ledger. Quotations consume exact saved scope/content. No editable cost/rate/margin master in this workbench.

Delivery scope distinguishes installed equipment from test/session/project drivers. Show inherited-profile exceptions, publication separately from review, and imported-versus-profile activity coverage. Handover preview is read-only and shows stale source/target conflicts before Accept or Use; it cannot silently overwrite concurrent edits. Quotation review exposes exact clause/template versions, bound fields and local amendments alongside non-labour deliverable coverage and scope/price reconciliation.

## Desktop and phone

Desktop targets: 1440 × 960 and 1024 × 768. Keep one content scroll owner, stable source/alternative context and one primary action. Candidate comparison separates mandatory failures from missing evidence. Diagram nodes link to their stage forms; all tasks work from the table without dragging.

Phone targets: 390 × 844 and 320 CSS px. Use a section picker, scenario selector and stacked records; dense comparisons become labelled detail views. Inputs use 16 px text and shared 44 px touch targets. Required scope/coverage decisions remain visible, with no page-wide horizontal scroll. Keep Save, finding navigation and return focus reachable at 200% zoom.

Required states: loading, empty, filtered-empty, unknown data, conflicting source, outside limits, read-only/denied, dirty, saving, saved, uncertain result, stale source/profile, unmapped, receiving conflicts, missing required labour, covered-by-supplier, offered/selected options, required-output failure and completed receipt. Use words/icons alongside colour. Opening evidence/help preserves drafts; cancellation returns focus.

## References and registration

Accepted Figma design, 22 October 2026: [Automation Configurator design decision](../../decisions/automation-configurator-figma-design.md) and [design r01 captures](../../reference/ui/estimating/automation-configurator-figma-design-r01/README.md) (twenty-one icon-free PNGs at desktop, tablet and phone, with twelve states). Before that date, exact Automation mockups, HTML, desktop and phone images were **not supplied; missing**. Existing Screen/Priva patterns are reuse references, not accepted Automation visuals. No fingerprint or reviewer attribution is created.

The N0 reference-only note was linked from `scope:ES-02` through its maintained design contract and register dependency. N1 now has an actual registered route, page-specific guide, component fixtures and evidence below. Future stages must update these alongside implementation. Any HTML package must select the applicable r20 page type under the existing conformance standard before baseline adoption.

## N1 native implementation

The first native capture route is now /estimating/discovery/[id]/nursery. Its [page contract](pages/route-estimating-discovery-id-nursery.md) records source binding, saved scenarios, conflicts and delivery decisions. The earlier no-route statements describe the N0 reference-only package. N2 is implemented below; N3–N4 remain open. This addition grants no accepted visual baseline.

## N2 native assessment

The Automation technical assessment now extends N1 through the [N2 page contract](pages/route-estimating-discovery-id-nursery-assessment.md). Existing source IDs and nursery paths remain stable. N3–N4 and owner visual acceptance remain open.
