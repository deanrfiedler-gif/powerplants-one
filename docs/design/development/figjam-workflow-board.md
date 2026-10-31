# Workflow diagrams FigJam board

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: working design reference. Sections 09–11 were drawn on 24 October 2026 on Dean's instruction and have not been reviewed by him; no section is accepted. Scope: business workflows across the existing scope IDs. The board adds no requirement, rule or scope ID.

## Board and citation rule

The board is the private FigJam file "Powerplants One configurator workflows", in Dean's Figma team. Cite it by name, section name and node ID only, never by file link. This follows the rule for the private "PPO - Design" file ([ADR-0053](../../decisions/ADR-0053-figma-page-design.md), [component maintenance contract](components/README.md)). Git and the decision records stay the authority; the board illustrates them and is not another source of truth.

The board header is three text nodes: the title (9:380), the coverage line (9:381) and the colour legend (9:382). Amber marks a pending review or decision gate, pale red corrective work and green a saved outcome. Since 24 October a dashed outline marks a step that is proposed or open.

## Sections

| Section | Node ID | Covers | Basis |
|---|---|---|---|
| 01 Screen configuration | 9:364 | Screen route from a saved Discovery or Express: configure, calculate quantities, review, save the run and ready an unpriced proposal | Estimating and quotation implementation plan (O1–O15, DP1–DP8; private, not reproduced), [estimating hub and workbench model](../../decisions/estimating-configurator-model.md) |
| 02 Priva configuration | 9:368 | Priva fertigation workbench: nine sections, exact unit configuration, scope review and an unpriced proposal | As 01 |
| 03 Shared CPQ and quotation | 9:372 | Receiving, evaluation and explicit Use, then ES-04 review and ES-05 approval and issue | As 01 |
| 04 Changes and reapproval | 9:376 | Shared change classification, stale runs, successor versions and reapproval | As 01 |
| 05 Delivery profiles, labour and quotation content | 18:447 | Delivery profiles, installation and commissioning hours, controlled quotation content | As 01 |
| 06 Express route | 32:605 | Shorter Express intake on the shared controls | As 01 |
| 07 Corrected labour example | 32:710 | Synthetic six-drive labour fixture | As 01 |
| 08 Response and handover | 32:767 | Customer response, acceptance checks and explicit delivery conversion | As 01 |
| 09 Delivery and service handover | 61:802 | Accepted quotation through conversion, project setup, supply, field readiness, site visit, commissioning, staged acceptance and maintenance set-up | BP-01 §6.5 and §6.7; [BP-06](../../blueprints/BP-06-projects-commercial-delivery.md), [BP-07](../../blueprints/BP-07-service-operations.md); [quotation conversion](../../decisions/quotation-conversion-native.md), [won delivery continuity](../../decisions/won-delivery-continuity.md), [field readiness gate](../../decisions/field-readiness-gate-proposal.md), [staged acceptance](../../decisions/ADR-0033-staged-acceptance.md), [commissioning and as-built](../../decisions/engineering-commissioning-as-built-design.md), [stakeholder updates](../../decisions/stakeholder-updates-figma-design.md), [customer communications](../../decisions/customer-communications-d025.md), [maintenance and warranty](../../decisions/maintenance-warranty-native.md) |
| 10 Lead to estimate | 65:1010 | Enquiry, lead capture and qualification, conversion to a deal, Sales brief, effort declaration and the saved Discovery workspace that 01, 02 and 06 start from | [BP-03](../../blueprints/BP-03-crm.md); [CRM pipeline stages](../../decisions/crm-pipeline-stage-model.md), [lead customer context](../../decisions/lead-customer-context.md), [Sales briefs](../../decisions/sales-briefs-design.md), [derived routing](../../decisions/estimating-derived-routing.md), [create discovery workspace](../../decisions/create-discovery-workspace-figma-design.md), [site surveys](../../decisions/site-surveys-figma-design.md) |
| 11 Service: planned or reactive | 69:1181 | BP-01 J-02: request capture and triage, work-order authority, booking, visit, inspections, report review and the Finance handover | BP-01 §6.3; [BP-07](../../blueprints/BP-07-service-operations.md); [request capture and triage](../../decisions/service-request-capture-and-triage.md), [request lifecycle (proposed)](../../decisions/ADR-0043-service-request-lifecycle.md), [work scope readiness](../../decisions/ADR-0009-p04-work-scope-readiness.md), [service reports](../../decisions/ADR-0014-p09-service-reports.md), [closed-visit guidance](../../decisions/field-closed-visit-guidance.md), [Finance handover contract](../../contracts/finance-handoff.md) |

The board header records an audited alignment of 01–08 on 22 October 2026; this record did not repeat that audit. Sections 09, 10 and 11 are syntheses of the listed records. Each cites its scope IDs on the steps, shows unbuilt or unaccepted steps with a dashed outline, and lists its open items and boundaries in footnotes on the board.

## Open items

- **Not yet drawn:** journeys J-01 (product and spare-parts sale) and J-05 (warranty, return or supplier recovery) from BP-01 §6.
- **Open on the board:** 09 shows support owner (D-028), asset identity (D-011), warranty rules (D-018) and the project-level Finance handover as open. 10 shows the deal on-hold reason and review date and DR-03 to DR-06 as open. 11 shows portal requests, an urgent-breakdown command, project service demand, quoting a chargeable repair and request closure (TR-15) as open.
- **Not reconciled:** the board has not been compared with the issued journey maps in `docs/reference/ui/module-workflow-maps/`. The CRM and Sales, Service Operations, Projects and Commercial Delivery, and End-to-End Customer Journeys maps cover some of the same ground. Those files stay unchanged.

## Change rule

Add or change a section only from repository records or a current owner instruction, and add a status fragment. Keep its node ID stable, and update this table in the same pull request. Record an owner review here with its date and verdict only when Dean gives one. A drawn section is not acceptance, and a solid outline does not mean that a step is deployed.
