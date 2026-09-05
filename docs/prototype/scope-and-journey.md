# PP-01 — Prototype scope and service journey

**Edition:** v01 · **Status:** Selected scope for the requested design package; synthetic implementation planned.

Sources: Master Sections 06–08, 13, 15–21 and 24–26; DAT-01–DAT-11; SVC-01–SVC-12; user-confirmed service problems. [Package index](README.md).

## 1. Product outcome

Powerplants One should give a coordinator a dependable view of work readiness and technician commitments, and give a technician the correct information before attending a horticultural site. The completed visit must leave useful equipment history, attributable evidence and a Finance-ready record.

The prototype will demonstrate a planned maintenance/inspection visit to synthetic greenhouse control equipment, including a return visit after an unresolved fault. It must work across desktop coordination and a phone-sized technician experience. It will not claim to diagnose equipment, certify technical work or operate a customer control system.

## 2. Why begin with service?

| Starting point | Benefit | Dependency/cost consideration | Disposition |
|---|---|---|---|
| Planned service | Directly addresses missing packs, difficult scheduling and missing history; exercises shared records and Finance/documents | Offline, state and revision controls need explicit design | Selected for this package following the user's instruction to proceed |
| Full CRM replacement | Strong relationship benefits and shared account foundation | Actual Pipedrive feature/history parity remains incomplete | Retain in roadmap; build only shared customer/contact/context now |
| Estimating replacement | Preserves CREMS commercial workflows | Hidden Screen Systems/calculation/questionnaire rules require controlled source evidence | Later BP-04; no invented estimating engine in this prototype |
| Major-project delivery | Supports high-value greenhouse projects | Broad contract, design, procurement and scheduling scope; active Smartsheet transition work exists separately | Later BP-05/BP-06; expose a project reference/change-request boundary only |

This ordering is a product-design judgement, not a quantified ROI result. Baseline observations, benefits and operational staffing are not yet measured.

## 3. Scope boundary

| Slice | Included in the first complete synthetic prototype | Acceptance evidence |
|---|---|---|
| A1 Shared context | Organisations, people, sites/operators, asset identity/configuration, previous work and owned follow-up | PT-01/PT-02/PT-03/PT-25 |
| A2 Service preparation | Ticket triage, scope items, coverage review, work authorisation and multiple appointments | PT-04/PT-05/PT-14 |
| A3 Job packs | Required sections, readiness, source manifest, check/return/issue, crew acknowledgements and amendments | PT-06/PT-07/PT-18/PT-23 |
| A4 Planning | Day/week planner, unassigned work, crews, travel buffers, conflicts, customer windows and controlled moves | PT-08/PT-09/PT-10/PT-26 |
| A5 Field and review | Downloaded job context, durable capture queue, labour/materials/findings, report revision and customer response | PT-11–PT-16/PT-24 |
| A6 Finance | Reviewed handoff, source-line consumption, manual/simulated processing, returned references, reconciliation and account fixtures | PT-17/PT-19/PT-20/PT-21 |
| A7 Platform controls | Server permissions, scoped documents/search, audit, error states, recovery, accessible workflow and release evidence | PT-01/PT-22/PT-27/PT-28/PT-29/PT-30 |

Included manual coverage/follow-up does not include automatic recurrence, contract billing, supplier warranty recovery or renewals. Material readiness includes explicit verified/unknown/shortage/exception status and evidence; purchasing, receiving, allocation and stock posting remain source-system responsibilities.

## 4. Users and decisions

| Prototype role | Main responsibility | Important boundary |
|---|---|---|
| Coordinator | Intake, shared operational context, draft scope, packs and follow-up | Cannot independently override mandatory controls or mark ERP work processed |
| Dispatcher | Confirm/move/cancel future appointments and record contact outcomes | Cannot silently rewrite project dates, actual labour or scope authority |
| Service reviewer | Authorise permitted work, check packs, review evidence and issue reports | Delegated limits/technical competence are policy inputs; no assumed commercial threshold |
| Technician | Read assigned context, acknowledge pack, capture own work and submit findings | No default account balances, internal margin or other technicians' private records |
| Finance reviewer/processor | Determine financial treatment, accept handoffs, record target references and reconcile | Operational completion/customer signature does not automatically approve an invoice |
| Systems administrator | Configuration delivery, access support and diagnostics | No automatic business approval powers |
| Customer representative | Acknowledges an exact presented report through attended capture | No customer login/portal in this release |

The synthetic test set can give Dean different test identities. Any single-person demonstration of multiple roles is labelled as such; it does not establish operational separation of duties.

## 5. Demonstration narrative

Use only fictional names, addresses, contacts and equipment. The main fixture is **SYN Greenhouse Demonstration**, site **SYN-Q01**, timezone **Australia/Brisbane**, with a synthetic irrigation-control asset **SYN-A01**. A second ERP company has a similarly named account to exercise mapping mistakes.

1. The coordinator opens the customer/site context. A previous report records an intermittent sensor fault, an unsuccessful cable replacement and a pending OEM query. Those facts retain their original author, date and source; suspected cause is labelled.
2. A planned inspection request is entered. The coordinator establishes the customer impact, access window, asset identity and coverage basis. Unknown chargeability remains reviewable rather than defaulting to free work.
3. A reviewer authorises an inspection-only scope. Crop-sensitive shutdown and electrical isolation prerequisites are explicit synthetic policy inputs. The technician cannot expand into unapproved live-system work.
4. The dispatcher proposes a two-person visit. Availability, competency validity, working hours, travel buffers and parts readiness are evaluated. The booking can be confirmed with a permitted outstanding preparation item, but dispatch remains blocked until the pack/readiness conditions are satisfied.
5. The pack is checked, generated and issued with an exact manifest. Both assigned recipients acknowledge that issue. Issue, availability/download and acknowledgement are separate records.
6. A customer access change requires a move. The dispatcher previews effects and confirms a new booking version. Old values remain in history. A stale concurrent request fails without overwriting the new booking.
7. A material technical instruction change creates a new pack revision and an acknowledgement requirement. An offline technician's old pack displays its last-known status; the coordinator records direct-contact attempts and outcome.
8. The technician records travel, labour, a consumed part, readings and observations. A browser restart preserves committed local entries. Reconnect deduplicates retries and sends stale-assignment evidence to restricted review.
9. The visit ends with one unresolved fault. The reviewer accepts the completed attendance and assigns a return visit/follow-up. The work order and ticket remain open where appropriate.
10. A reviewed customer report excludes internal commercial notes. The customer records a reservation against the exact presented revision. Any later material report change requires a new revision and response handling.
11. Finance reviews time/material treatment, processes the synthetic manual handoff and records simulated target references. Reconciliation compares mapped quantities and outcomes; it cannot close on a missing/unknown outcome.
12. The next technician can see the prior visit, who did it, work attempted, parts, findings, unresolved issue, report and appropriate acknowledgement context.

## 6. Prototype acceptance versus operational readiness

**Design completion:** the package defines every included screen family, state transition, required-stage data gate, interface boundary and independently described PT scenario; unresolved facts have explicit treatment.

**Synthetic prototype completion:** P01–P12 implemented; included PT cases pass with commit/environment evidence; demonstration data persist through restart; permission/concurrency/revision/duplicate/recovery failures are tested; no known critical access or data-loss defect remains.

**Operational pilot readiness:** separate decision covering real cohort, service/ERP ownership, users, authority, equipment controls, data mapping, device policy, Finance definitions, document retention, support, restore and actual integration proofs. Synthetic pass does not satisfy it.

## 7. Success measures and baseline questions

| Measure | Exact prototype definition | Operational evidence later |
|---|---|---|
| Pack preparation coverage | Appointments due to start in selected period with a valid issued pack / appointments in scope; show numerator/denominator and exclusions | Current proportion of technicians receiving usable packs before work |
| Crew acknowledgement coverage | Required recipient assignments acknowledging the applicable pack issue / required recipient assignments | Actual communications and urgent-change practices |
| Preparation blockers | Count of appointments with at least one unresolved mandatory blocker; no duplicate per blocker | Frequency and reason work starts unprepared |
| Review turnaround | Elapsed calendar time from submission to first review decision; separate returned work | Representative current reporting delay |
| Finance queue | Count/age by handoff state; OutcomeUnknown and overdue policy exceptions separate | Current labour/parts-to-ERP processing and delay |
| Open follow-up | Unclosed actions by owner and due date; unknown due date shown separately | How prior faults and promised actions are currently tracked |

Do not claim time savings, ROI, utilisation or revenue improvement from synthetic demonstrations. Do not compute utilisation without an approved denominator for working time, travel, leave and non-service work.

## 8. Deliberate exclusions and future hooks

No live ERP writes, customer messages, source migration, payment collection, stock ledger, native CAD authoring, OT/telemetry control, payroll, customer portal, AI diagnosis or automatic dispatch optimisation. No 24/7 response commitment is assumed.

Retain stable optional links for opportunity, estimate, project, contract, ERP item/equipment and document references. These are extension points, not placeholder screens presented as implemented features. Full CRM relationship development and Pipedrive parity remain explicit later work; this prototype includes customer contacts, history and owned activities needed for service.

## 9. Update and scope control

A new scope request is assessed against affected data, authority, issued evidence, tests, delivery dependencies and cost. Record it in GitHub and the decision log. Ordinary design corrections can be made in stable files. Issued records and original evidence retain their identity/version.

Before P01 begins, read the current [implementation plan](../delivery/prototype-implementation-plan.md) and [decisions](decisions-and-evidence.md). The unresolved corporate/tenant facts can remain open for synthetic development; do not relabel them as verified to make the backlog appear complete.
