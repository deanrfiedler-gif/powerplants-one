# Documentation index

Start with [current status](STATUS.md) and the [First Prototype Definition & Architecture package](prototype/README.md). The [working master](blueprints/BP-01-master-blueprint.md) retains the complete seven-domain direction.

| Area | Entry point |
|---|---|
| Standards | [Naming](standards/naming-conventions.md), [adoption](standards/naming-adoption.md), [ChatGPT instructions](standards/chatgpt-project-instructions.md), [shared UI](standards/ui-style-specification.md) |
| Prototype package | [Scope, specifications, contracts, tests and ordered plan](prototype/README.md) |
| Blueprint set | [Master and module index](blueprints/README.md) |
| CRM UI | [Board/Grid preview](blueprints/crm-board-grid-mockup.html), [I2 guidance](delivery/crm-i2-ui-guidance.md), [handover](delivery/crm-ui-design-handover.md) |
| CRM application | [I1 owned opportunity handover](delivery/crm-i1-handover.md), [I2 scoped Board/Grid handover](delivery/crm-i2-handover.md), [worklist decision](decisions/crm-i2-worklist.md); actual runtime/publication evidence remains separate from design originals |
| Contextual Page guides | [Design r01](blueprints/contextual-help-design.md), [CRM pilot guide](guides/crm-deals.md), [interactive preview](blueprints/contextual-help-preview.html), [template](standards/page-guide-template.md), [acceptance/pilot](testing/contextual-help-acceptance.md), [decision/handover](decisions/contextual-help.md); prepared for review, app implementation pending |
| PPO Assistant | [Pilot specification](blueprints/ppo-assistant-specification.md), [direction/architecture](decisions/ppo-assistant-direction.md), [handover](delivery/ppo-assistant-handover.md); design only, runtime/model acceptance pending |
| Estimating | [BP-04](blueprints/BP-04-estimating-quotation.md), [CREMS evidence](blueprints/estimating-evidence.md), [preview](blueprints/estimating-workspace-mockup.html), [handover](delivery/estimating-discovery-handover.md) |
| Engineering | [Accepted r02 decision](decisions/engineering-r02-integration.md), [intake implementation handover](delivery/engineering-intake-handover.md) |
| Projects | [BP-06](blueprints/BP-06-projects-commercial-delivery.md), [screens](blueprints/projects-screen-specification.md), [sequence](delivery/projects-implementation-plan.md), [handover](delivery/projects-discovery-handover.md) |
| Customer portal | [Design](blueprints/customer-portal-design.md), [walkthrough](blueprints/customer-portal-mockup.html), [stages](delivery/customer-portal-implementation-plan.md), [handover](delivery/customer-portal-handover.md) |
| Architecture | [BP-02](architecture/BP-02-platform-architecture.md) |
| Service | [BP-07](blueprints/BP-07-service-operations.md), [approved field technicians design](decisions/field-technicians-design.md), [approved Job Pack r02](decisions/job-pack-design.md), [integration handover](delivery/field-technicians-handover.md) |
| Finance workspace | [Interactive r02 HTML](reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html), [design and handover](decisions/finance-workspace-design.md), [preserved r01](reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html); proposed design, visual browser validation and application integration pending |
| Contracts | [Data](contracts/service-data-dictionary.md), [API](contracts/service-api.md), [Finance](contracts/finance-handoff.md), [documents](contracts/document-issue-distribution.md) |
| Sources | [Reference register](reference/README.md) and [hash manifest](reference/source-manifest.json) |
| Decisions | [ADR index](decisions/README.md), [29 decisions](decisions/decision-register.csv), [PP-01 evidence](prototype/decisions-and-evidence.md) |
| Requirements | [78-parent register](requirements/requirements.csv), [prototype disposition](prototype/traceability.csv) |
| Acceptance | [Master test guidance](testing/README.md), [30 prototype procedures](testing/prototype-acceptance.md) |
| Delivery | [P01–P12 implementation plan](delivery/prototype-implementation-plan.md), [P12 recovery handover](delivery/p12-handover.md), [P04 handover](delivery/p04-handover.md), [P05 starter](delivery/p05-starter-prompt.md), [discovery backlog](delivery/backlog.md) |
| Assurance | [Package review/check evidence](prototype/assurance.md), [foundation handover](delivery/foundation-handover.md) |

Frozen issued references remain evidence. Stable working documents evolve through commits/PRs and explicit decision records. Tests/specifications do not silently turn proposals into implemented business capabilities.

[Controlled opportunity handover design](delivery/crm-handover-design-handover.md) — proposed authority/eligibility/history/recovery contract, synthetic canonical form, future verification and conditional implementation starter; H-01–H-03 remain unresolved.

[Private Prototype Demo package](delivery/private-prototype-demo.md) defines the bounded demonstration journeys, fictional dataset recipe, tester access proposal, sourced hosting estimate and deployment/reset runbooks. Hosted execution is not implemented by this package.
[Azure demo connection setup](delivery/azure-demo-connection.md) — portal steps and a manually triggered read-only GitHub connection check; live Azure setup and hosted application access remain pending.

[Azure private demo runtime](delivery/azure-private-demo.md) — individual sign-in, cloud configuration, deployment and reset preparation; live acceptance pending.

The adopted E2 persistence increment is governed by [ADR-0026](decisions/ADR-0026-e2-option-persistence.md). The [workspace handover](delivery/estimating-e2-workspace-handover.md) records the implemented additive migration/API and remaining runtime, browser and receiving work.

The [audit continuation handover](delivery/audit-continuation-handover.md) records the authorised next-ten sequence, current verification and remaining delivery boundaries.

## Audit continuation receiving packages

- [E3 source, arithmetic and review choices](delivery/estimating-e3-decision-pack.md) — concrete examples and a bounded manual-source proposal; unresolved pricing/approval choices stay explicit.
- [J1 coordination reconciliation](delivery/projects-j1-reconciliation.md) — extend existing Project/Gantt identities with shared Activities and manual health; preserve forecast-milestone meaning.
- [Supply Chain readiness contract](contracts/supply-chain-readiness.md) — SCM-01–08 candidate demand, promise, allocation, quarantine and owned-impact semantics; no ERP mapping or executed acceptance.

## Adopted product quality and capability scope

[Adoption decision](decisions/product-quality-adoption.md), [quality and gap register](requirements/product-quality-register.md), [ordered delivery plan](delivery/product-quality-plan.md). All eight refinements and five standards are adopted; existing capability plans continue. First increments: persistent personal/team views, equipment/inspection, readiness/change impact. Runtime and acceptance remain separately tracked.


[Equipment and Installed Base workspace r02](decisions/equipment-workspace-design.md) — refined standalone design with retained review decisions, preparation snapshots, horticulture hierarchy, validated evidence and recoverable sessions; 69 model/DOM checks passed. r01 is preserved; browser visual review and application integration remain pending.

## Customers, sites and growing areas

[Workspace r03](reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) contains only the customer/location workspace using the supplied r20 theme, with Google Maps links, directions, address copying and optional arrival/facility pins. [Map extension](decisions/customers-sites-maps-r03.md) records the behaviour and 98 model/DOM checks; [r02 audit](decisions/customers-sites-workspace-audit-r02.md) retains the 18 earlier findings; [current handover](decisions/customers-sites-workspace-design.md) records boundaries. R01 and r02 references are preserved.
