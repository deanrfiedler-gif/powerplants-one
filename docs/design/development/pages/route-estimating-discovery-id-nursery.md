# Automation discovery — N1 design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: route:/estimating/discovery/[id]/nursery. Scope: ES-02; EST-02/03/06. Owner: Dean Fiedler. Design status: proposed native composition; owner review pending. Reference: [Nursery specification](../../../blueprints/nursery-automation-configurator.md), [ADR-0060](../../../decisions/ADR-0060-nursery-discovery-foundation.md). Exact Nursery mockups, HTML and approved images are missing.

## Workflow and handovers

Page type: r20 Form / guided workflow, supported by Record detail and revision history. The existing shell owns navigation. Enter from the saved Discovery Actions menu for an exact alternative. The page shows source readiness and effort separately from Nursery revision state. A saved incomplete Discovery/Express source remains incomplete.

Select Standard 2.0 and/or Plus for supplier review. Capture project type/current process, current/future crop/container/media scenarios, sourced observations, owned unknowns/conflicts, site requirements and independent delivery decisions. Save creates an immutable revision, never a technical pass, Products publication or priced estimate. No workbook is required. N2 assessment and N3 paired shared CPQ receiving remain separate.

Reused controls: PageHeader, Field, ErrorNotice, Button, useCrmResource and useCrmCommand; existing shell/identity and unsaved-navigation guard. Native labelled selects, fieldsets and details disclose the local structured evidence. Shared component APIs remain unchanged.

## Desktop

Accepted design: the [Automation Configurator design decision](../../../decisions/automation-configurator-figma-design.md) of 22 October 2026 draws this workbench, under the user-facing name Automation, as ten sections in three groups with separate readiness gates, line capacity with its calculation trace, interface checks, estimating drawings and entry forms (D1–D15). Captures 01–18 in [design r01](../../../reference/ui/estimating/automation-configurator-figma-design-r01/README.md). Nothing new is built; the native N1 page described below remains the built page.

1440 × 960 and 1024 × 768: one content scroll, bounded content width, source context followed by editing/history controls, scenario fieldsets, delivery decisions and clarifications. Evidence sources remain readable and unknown values never display zero. Save and original-operation recovery are distinct. Read-only history uses disabled fieldsets and exact saved catalogue/source references.

## Mobile

Accepted design: captures 19 and 20 in [design r01](../../../reference/ui/estimating/automation-configurator-figma-design-r01/README.md): the phone Overview at 390 and 320, the Process & equipment stage list, the section sheet, and the full-screen scenario and answer editors.

390 × 844 and 320 CSS px: stacked fieldsets and controls, 16 px input text, 44 px action/select targets, wrapping source IDs and narratives, no page-wide horizontal overflow. Every task is available without dragging. Details expose complete source/scenario context and keyboard focus remains visible. Physical-device, screen-reader and 200% zoom acceptance remain pending until evidenced.

## States and recovery

Loading has a status. Transient refresh failures show retry, preserve the draft and original pending save, and block new acceptance until the refresh succeeds. Definitive access denial removes the protected working copy. Permission/identity changes unmount the editor. Edit retains its source/target snapshot even during background refresh. A concurrent save disables new acceptance and retains the entered draft for comparison; Cancel loads current saved evidence. Server refusal also preserves inputs. An uncertain save freezes inputs and offers Confirm original save outcome using the original operation, not a new request. All explicitly selected history revisions are read-only, including the latest; choose Current to edit a successor. Historical revisions retain their exact source site, readiness, effort and system names. Editing a successor separately displays the current Discovery source; a removed system remains visible as a binding requiring explicit replacement or clearing. Historical revisions remain unchanged.

Unknown, Assumed and Conflict remain findings with owner/next action. Conflict requires at least two different attributed values; resolution records a chosen source/value while retaining earlier claims. Delivery applicability, selection, responsibility and coverage evidence stay separate; review is always pending in N1. Catalogue publication is not implied.

## Departures and evidence

Accepted Figma design: [Automation Configurator design r01 captures](../../../reference/ui/estimating/automation-configurator-figma-design-r01/README.md) (twenty-one icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/automation-configurator-figma-design.md). Entry from Discovery moves from the Actions menu item "Nursery Automation discovery" to a confirmed System route card and an "Open in a workbench" menu group (D15). Building it is not decided; the `AUT` record type and equipment geometry fields are prerequisites.

This is a proposed composition using shared controls; it is not copied from an accepted Nursery mockup. No visual fingerprint or approval is assigned. The N1 fixture is tests/browser/nursery-automation.spec.ts; persistence and boundary tests are tests/database/nursery-automation.test.ts and tests/unit/nursery-automation.test.ts. [Execution evidence](../../../testing/evidence/nursery-automation-n1/README.md) records actual runs separately from business acceptance and deployment.
