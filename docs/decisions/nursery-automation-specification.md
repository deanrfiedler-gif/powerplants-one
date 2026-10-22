# Nursery Automation Configurator specification scope

<!-- versioning: git; committed history is authoritative -->

Document ID: PPO-NURSERY-AUTOMATION-SPEC-DEC. Owner: Dean Fiedler.
Date: 22 October 2026. Status: documentation scope authorised; detailed design proposed and not yet reviewed.

Dean requested a workbench specification and equipment-data template for the Nursery Automation Configurator, starting with Javo potting lines and following the shared CPQ handover model. This authorises the documentation package, not application implementation, supplier data approval or deployment.

The package follows the adopted [estimating hub and workbench model](estimating-configurator-model.md). During preparation Dean directed alignment with the parallel **Powerplants One estimating and quotation implementation plan**, specifically the workbench/Products treatment of labour, commissioning and related information carried to CPQ. The plan read on 22 October records adopted O1–O15 and DP1–DP8; its private link and original content are not reproduced in this public repository. This newer user-provided direction takes precedence over the older open-item wording in the proposed [shared parts-proposal contract](../contracts/workbench-parts-proposal.md).

The Nursery design therefore consumes unpriced material proposals plus a separate versioned technical-fact/delivery-scope projection. Products links reusable delivery profiles and approved content; CPQ resolves activity coverage, person-hours, costs and sell through one shared engine. Labour charges are not inserted into material schema 1. Supplier-included work, installed versus purchased quantities and project-wide activities retain explicit ownership. The parallel session owns shared-contract implementation and reconciliation; this contribution does not rewrite its files or publish its private Page.

Deliverables: [workbench specification](../blueprints/nursery-automation-configurator.md), [equipment-data template](../templates/nursery-automation/README.md), [design note](../design/development/nursery-automation.md) and [acceptance catalogue](../testing/nursery-automation-acceptance.md). Existing EST parent IDs and ES scope IDs remain unchanged. No new technology is selected; future persistence, permissions and calculation implementation require the repository's normal ADR and reservation process.

The contribution claims the new Nursery Automation specification, equipment-data template and supporting design/acceptance documentation, with narrow links in the documentation index, maintained project instructions and design register, and one status fragment. It does not change application source, migrations, existing workbench engines or the shared handover contract.
