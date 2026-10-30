---
document_id: PPO-TS-REGISTER
date: 2026-10-30
status: Working register; TS-01 drafted, all others planned
owner: Dean Fiedler - private prototype
versioning: git
---

# End-to-end business scenarios

Eight business scenarios (TS) and four cross-cutting scenarios (TX) cover the five journeys in [BP-01 section 6](../blueprints/BP-01-master-blueprint.md). Each new scenario copies [TS-01](TS-01-berry-farm-fertigation-project.md)'s structure. The TS and TX catalogues are declared in [PPO-STD-001 section 9.1](../standards/naming-conventions.md). A scenario run marks no AT or PT case passed.

| Run order | ID | Scenario | Journey | Synthetic customer | Builds on | What it tests that earlier scenarios don't | AT links | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TS-01 | Berry farm fertigation and control system: lead to Finance handoff | J-03 / J-04 (small project) | Bellbird Ridge Berries | — | Every departmental handover, a revision, a variation, a failed test, partial acceptance, a return visit | AT-03, 05–09, 12, 14–17, 36, 38 | Drafting |
| 2 | TS-02 | Planned maintenance: first six-monthly service finds a worn dosing pump and leads to a new quote | J-02 planned | Bellbird Ridge Berries | TS-01 agreement | Maintenance occurrences, replayed generation with no duplicates, inspection findings, recommendation to quote | AT-14, 19, 33 | Planned |
| 3 | TS-04 | Weekend breakdown: EC runaway, remote diagnosis fails, urgent visit with van stock, follow-up left open | J-02 reactive | Bellbird Ridge Berries | TS-01 installed base | Urgent pathway without bypassing safety controls, van stock, after-hours labour, visit complete with case open | AT-06, 12, 14 | Planned |
| 4 | TS-05 | Warranty claim: sensor fails four months after handover; replaced before settlement; supplier claim and credit; no-fault-found branch | J-05 | Bellbird Ridge Berries | TS-04 | Warranty entitlement, customer goodwill and supplier recovery kept separate; Finance credit | AT-19, 29, 33 | Planned |
| 5 | TS-03 | Spare parts sale: backorder, two-part dispatch with tracking, one wrong item returned | J-01 | Kestrel Creek Produce, plus a similarly named account in another ERP company | — | Stock and allocation, partial dispatch, dispatch notices, returns, account matching | AT-02, 16, 29, 36 | Planned |
| 6 | TS-06 | Climate computer upgrade: old controller replaced; shutdown interrupted and finished on a second day | J-03 | Silvereye Nursery | — | Existing and proposed configuration kept distinct, software backup, installed-base history, undocumented existing condition | AT-15, 30 | Planned |
| 7 | TS-08 | Lost deal, revived: lost to a competitor with a reason, revived six months later and requoted | CRM | Currawong Hydroponics | — | Lost outcomes and reasons, reopening, old quotation history preserved | AT-03, 25 | Planned |
| 8 | TS-07 | Major glasshouse tender: bid/no-bid to staged handover, subcontractors, design change after procurement | J-04 | Ironbark Glasshouse Development | — | Tender obligations, contract notices, work and specialist packages, Screen workbench, phased commissioning, final commercial review | AT-15, 17, 32, 37, 38 | Planned |
| Branch | TX-01 | Access and roles: walk TS-01 as people without access; revoke a technician mid-job | Cross-cutting | As TS-01 | TS-01 | Permissions, no leaks, revoked access while offline | AT-01, 34 | Planned |
| Branch | TX-02 | A full field day with no phone signal | Cross-cutting | As TS-02 | TS-02 | Offline capture, restart, sync and conflicts | AT-10, 11 | Planned |
| Branch | TX-03 | Month-end Finance: partial payment, applied credit, unapplied cash, reversed entry | Cross-cutting | As TS-01 and TS-05 | TS-05 | Finance reconciliation and money definitions | AT-18, 31 | Planned |
| Branch | TX-04 | Integration outage and restore from backup | Cross-cutting | Any | TS-01 | Queued work, unknown outcomes, recovery | AT-22 | Planned |

Scenarios 2 to 4 reuse Bellbird Ridge Berries on purpose, so they also test that the customer record tells one continuous story. TS-07 runs last because it is the largest and depends most on features still in draft. A branch runs once the scenario it builds on passes. All customer names are fictional.
