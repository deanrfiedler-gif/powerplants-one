# Blueprint register

[Working master](BP-01-master-blueprint.md) uses a stable filename. Its r04 working amendment adds the authorised private portal direction to the r03 naming/ownership metadata while preserving requirement scope; the [frozen issued baseline](../reference/baselines/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md) remains hash-protected. Current direction and later design choices appear in [STATUS](../STATUS.md) and ADRs. See [ADR-0002](../decisions/ADR-0002-stable-specification-filenames.md) for the original stable-file decision, superseded in naming details by [ADR-0005](../decisions/ADR-0005-project-naming-adoption.md).

| ID | Specification | Current status |
|---|---|---|
| BP-01 | Master Business & Build Blueprint | Working r04 portal-direction supplement; issued v02 source preserved |
| BP-02 | [Platform Solution Architecture](../architecture/BP-02-platform-architecture.md) | PP-01 design recommendation authored; feasibility/implementation pending |
| BP-03 | [CRM Functional & Build Blueprint](BP-03-crm.md) | r01 proposed journeys/shared integration; bounded [Pipedrive parity](crm-parity.md), [synthetic screens](crm-screen-specification.md), [branded Board/Grid](crm-ui-mockups/README.md) and [implementation sequence](../delivery/crm-implementation-plan.md); account parity and acceptance remain open |
| BP-04 | [Estimating & Quotation Functional & Build Blueprint](BP-04-estimating-quotation.md) | r01 proposed; [26-row CREMS evidence](estimating-evidence.md), [synthetic preview](estimating-workspace-mockup.html) and [handover](../delivery/estimating-discovery-handover.md); configuration/policy and acceptance remain open |
| BP-05 | Engineering & Design Control Functional & Build Blueprint | Planned; native CAD boundary retained |
| BP-06 | Projects & Commercial Delivery Functional & Build Blueprint | Planned; Smartsheet transition separate |
| BP-07 | [Service Operations Functional & Build Blueprint](BP-07-service-operations.md) | Selected planned-service prototype specified; extended lifecycle scope deferred |
| BP-08 | Supply Chain Management Functional & Build Blueprint | Planned; first-release material readiness boundary included in BP-07 |
| BP-09 | Finance & Commercial Controls Functional & Build Blueprint | [Minimum service/account subset](../contracts/finance-handoff.md) authored; full Finance specification planned |

The [prototype package](../prototype/README.md) links the data, API, document, acceptance and delivery contracts. A partial module contract is never described as full enterprise implementation.



The [customer portal design](customer-portal-design.md) is a shared customer channel across the existing domains, with a [clickable synthetic walkthrough](customer-portal-mockup.html) and [bounded CP1–CP5 plan](../delivery/customer-portal-implementation-plan.md). It is not an additional BP domain or a runtime release.
