# Department navigation destination coverage

Derived from the current destination catalogue and ordered rails against the supplied [prompt r01](../reference/ui/application-shell/PPO-Department-Navigation-Icons-VS-Code-Implementation-Prompt-r01.md) and [register r02](../reference/ui/application-shell/PPO-Department-Navigation-Icon-Register-r02.md). This supplements the [handover](department-navigation-icons.md); readiness is separate from permission and owner acceptance.

57 canonical positions; 33 wired positions (My Work repeats across six departments); 24 withheld. All positions have outline/active artwork. Refresh with scripts/build-navigation-coverage.ts.

| Department (short name) | Order | Destination | Route | Semantic glyph | Existing access source | Readiness | Active parent ID | Evidence / missing dependency |
|---|---:|---|---|---|---|---|---|---|
| Sales | 1 | Pulse | /sales/pulse | nav-pulse | activity.read AND (crm.opportunity.read OR crm.lead.read) | Working route / adapter | pulse | Navigation unit + department browser rail; exact record guards retained |
| Sales | 2 | Leads | /sales/leads | nav-leads | crm.lead.read | Working route / adapter | leads | Navigation unit + department browser rail; exact record guards retained |
| Sales | 3 | Deals | /sales/opportunities | nav-deals | crm.opportunity.read | Working route / adapter | deals | Navigation unit + department browser rail; exact record guards retained |
| Sales | 4 | Activities | /calendar | nav-activities | activity.read | Working route / adapter | calendar | Navigation unit + department browser rail; exact record guards retained |
| Sales | 5 | Tasks | /sales/tasks | nav-tasks | activity.read AND (crm.opportunity.read OR crm.lead.read) | Working route / adapter | tasks | Navigation unit + department browser rail; exact record guards retained |
| Sales | 6 | Sales Inbox | /email | nav-mail | email.read | Working route / adapter | mail | Navigation unit + department browser rail; exact record guards retained |
| Sales | 7 | Contacts | /contacts | nav-contacts | shared.read | Working route / adapter | contacts | Navigation unit + department browser rail; exact record guards retained |
| Sales | 8 | Products | Withheld | nav-products | No capability invented | Unavailable | None | No authorised shared catalogue list/read service. Equipment is a different entity. |
| Sales | 9 | Insights | Withheld | nav-insights | No capability invented | Unavailable | None | No Sales analysis landing or agreed KPI projection. Deal Forecast remains inside Deals. |
| Estimating & quotation | 1 | My Work | /work | nav-work | activity.read | Working route / adapter | work | Navigation unit + department browser rail; exact record guards retained |
| Estimating & quotation | 2 | Intake | Withheld | nav-inbox | No capability invented | Unavailable | None | No estimating intake queue. Saved Discovery workspaces do not implement receiving intake. |
| Estimating & quotation | 3 | Estimation wizard | /estimating/discovery | nav-wizard | estimating.read | Working route / adapter | wizard | Navigation unit + department browser rail; exact record guards retained |
| Estimating & quotation | 4 | Estimates | /estimating | nav-estimates | estimating.read | Working route / adapter | estimates | Navigation unit + department browser rail; exact record guards retained |
| Estimating & quotation | 5 | Specialist configurations | /estimating/configurations | nav-configurations | estimating.read | Working route / adapter | configurations | Navigation unit + department browser rail; exact record guards retained |
| Estimating & quotation | 6 | Supplier pricing | Withheld | nav-pricing | No capability invented | Unavailable | None | Supplier-pricing design exists; no native price-source register/service. |
| Estimating & quotation | 7 | Quotations | /estimating/quotes | nav-quotation | estimating.quote.read AND estimating.read | Working route / adapter | quotations | Navigation unit + department browser rail; exact record guards retained |
| Estimating & quotation | 8 | Reviews & approvals | Withheld | nav-approval | No capability invented | Unavailable | None | No native estimate review/approval queue; general work reviews are not a substitute. |
| Engineering | 1 | My Work | /work | nav-work | activity.read | Working route / adapter | work | Navigation unit + department browser rail; exact record guards retained |
| Engineering | 2 | Engineering workload | /engineering | nav-workload | engineering.read | Working route / adapter | engineering | Navigation unit + department browser rail; exact record guards retained |
| Engineering | 3 | Design basis & interfaces | Withheld | nav-interfaces | No capability invented | Unavailable | None | No native design-basis/interface register; package fields are not an index. |
| Engineering | 4 | Drawings | Withheld | nav-drawings | No capability invented | Unavailable | None | No controlled drawing register or authorised general drawing list. |
| Engineering | 5 | Materials & substitutions | /engineering/materials | nav-materials | engineering.read | Working route / adapter | materials | Navigation unit + department browser rail; exact record guards retained |
| Engineering | 6 | Change review | /engineering/changes | nav-changes | engineering.read | Working route / adapter | changes | Navigation unit + department browser rail; exact record guards retained |
| Engineering | 7 | Technical reviews | Withheld | nav-approval | No capability invented | Unavailable | None | Engineering review workspace is a placeholder, not a technical-review queue. |
| Engineering | 8 | Commissioning & as-built | /engineering/commissioning | nav-commissioning | engineering.read | Working route / adapter | commissioning | Navigation unit + department browser rail; exact record guards retained |
| Projects | 1 | My Work | /work | nav-work | activity.read | Working route / adapter | work | Navigation unit + department browser rail; exact record guards retained |
| Projects | 2 | Projects | /projects | nav-projects | project.read | Working route / adapter | projects | Navigation unit + department browser rail; exact record guards retained |
| Projects | 3 | Programme | /projects/programme | nav-programme | project.read | Working route / adapter | programme | Navigation unit + department browser rail; exact record guards retained |
| Projects | 4 | Delivery readiness | Withheld | nav-readiness | No capability invented | Unavailable | None | Delivery-readiness design only; no native assessment landing. |
| Projects | 5 | Risks & issues | Withheld | nav-risks | No capability invented | Unavailable | None | No native project risk/issue register. |
| Projects | 6 | Variations & obligations | Withheld | nav-variations | No capability invented | Unavailable | None | No native variation/obligation register. |
| Projects | 7 | Site assurance | Withheld | nav-assurance | No capability invented | Unavailable | None | Site-assurance design only; no native inspection/assurance register. |
| Projects | 8 | Acceptance & closeout | /projects/acceptance | nav-acceptance | project.read | Working route / adapter | acceptance | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 1 | My Work | /work | nav-work | activity.read | Working route / adapter | work | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 2 | Service requests | /service/tickets | nav-requests | service.ticket.read | Working route / adapter | tickets | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 3 | Work orders | /service/work-orders | nav-orders | service.work_order.read | Working route / adapter | orders | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 4 | Schedule | /schedule | nav-schedule | schedule.read | Working route / adapter | planner | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 5 | Field team | /service/technicians | nav-team | schedule.read | Working route / adapter | technicians | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 6 | Job packs | /service/packs | nav-packs | pack.read | Working route / adapter | packs | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 7 | Service review | /service/reports | nav-service-review | report.read | Working route / adapter | reports | Navigation unit + department browser rail; exact record guards retained |
| Service operations | 8 | Equipment | /equipment | nav-equipment | shared.read | Working route / adapter | equipment | Navigation unit + department browser rail; exact record guards retained |
| Supply chain | 1 | My Work | /work | nav-work | activity.read | Working route / adapter | work | Navigation unit + department browser rail; exact record guards retained |
| Supply chain | 2 | Material demand | Withheld | nav-demand | No capability invented | Unavailable | None | No native material-demand list or receiving workflow. |
| Supply chain | 3 | Purchasing | Withheld | nav-purchasing | No capability invented | Unavailable | None | No native purchasing register or order workflow. |
| Supply chain | 4 | Inbound shipments | Withheld | nav-inbound | No capability invented | Unavailable | None | No native inbound-shipment register. |
| Supply chain | 5 | Receiving | Withheld | nav-receiving | No capability invented | Unavailable | None | No native receipt/inspection workflow. |
| Supply chain | 6 | Stock & reservations | Withheld | nav-stock | No capability invented | Unavailable | None | No native stock/reservation register; equipment is not stock. |
| Supply chain | 7 | Dispatch & delivery | Withheld | nav-dispatch | No capability invented | Unavailable | None | No native dispatch/delivery register. |
| Supply chain | 8 | Returns & claims | Withheld | nav-returns | No capability invented | Unavailable | None | No native return/claim register. |
| Finance | 1 | My Work | /work | nav-work | activity.read | Working route / adapter | work | Navigation unit + department browser rail; exact record guards retained |
| Finance | 2 | Finance handoffs | /finance/handoffs | nav-inbox | finance.read | Working route / adapter | finance | Navigation unit + department browser rail; exact record guards retained |
| Finance | 3 | Customer accounts | /finance/accounts | nav-accounts | finance.account.read AND shared.finance.read AND finance.read | Working route / adapter | accounts | Navigation unit + department browser rail; exact record guards retained |
| Finance | 4 | Project performance | Withheld | nav-performance | No capability invented | Unavailable | None | No project-performance projection; D-017 financial definitions remain open. |
| Finance | 5 | Claims & obligations | Withheld | nav-claims | No capability invented | Unavailable | None | No Finance claims/obligations register. |
| Finance | 6 | Cash outlook | Withheld | nav-cash | No capability invented | Unavailable | None | No native cash-outlook projection. |
| Finance | 7 | Reconciliation | Withheld | nav-reconciliation | No capability invented | Unavailable | None | Handoff reconciliation is a record action; no distinct reconciliation register. |
| Finance | 8 | Exceptions | Withheld | nav-exceptions | No capability invented | Unavailable | None | Shared /admin recovery does not provide a finance-scoped exception list. |

Specific child routes take precedence. Fertigation selects Specialist configurations; Engineering materials, changes and commissioning retain their own destination. Programme view is consumed by the project schedule and supplies a return to its chooser. Sales task drawers keep Tasks selected; People/Organisation details select Contacts in Sales.

More retains My Work for Sales, People, Organisations, Sites, Facilities, Equipment, My jobs, Priva Fertigation, Approvals & handovers, Integrations & recovery and local Foundation checks when permitted. Documents and Settings remain withheld without general landings. The catalogue includes Blinds for existing Screen Systems context; no geometry route, calculation or schema is added. Context-only symbols do not manufacture More entries.

Full departments: Sales; Estimating & Quotation; Engineering & Design Control; Projects & Commercial Delivery; Service Operations; Supply Chain Management; Finance & Commercial Controls.
