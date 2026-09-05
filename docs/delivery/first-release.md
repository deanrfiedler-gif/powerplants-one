# Proposed first release — Planned service workflow

**Status:** Recommended design scope, not an approved operational pilot. Source: Master Blueprint v02 Sections 24–26.

The objective is one complete journey: identify customer/site/equipment, triage the request, authorise work, prepare an issued pack, book/rearrange attendance, capture field evidence, review the report and complete an owned Finance handoff.

| Slice | Minimum outcome | Critical dependencies |
|---|---|---|
| A1 | Reliable customer/site/asset context and relevant history | D-011, DAT-01–DAT-03, document references |
| A2 | Triage, scope/coverage and authoritative work-order linkage | D-007/D-018/D-019, DAT-04/DAT-05 |
| A3 | Checked/issued job pack, exact revisions and acknowledgement | D-012/D-024, DAT-07/DAT-11 |
| A4 | Visual planner, constraints and controlled concurrent changes | D-015, DAT-06, TR-03/TR-08 |
| A5 | Approved mobile/offline scope, time/parts/evidence and report | D-016, DAT-08/DAT-09, AT-10/AT-11/AT-34 |
| A6 | Reviewed manual or proven API Finance handoff and follow-up | D-017, DAT-10, FD-10, AT-31 |
| A7 | Access, audit, support, recovery, training and transition | D-020–D-023/D-026, NFR requirements |

A synthetic prototype can make workflow decisions reviewable while external-system facts are still being collected. Mark all fixtures as synthetic. An unverified read, stock balance, agreement or ERP operation must not be presented as a working integration.

The release does not depend on full CRM cutover, every CREMS formula, complete project scheduling, native CAD automation, a customer portal or customer OT access. Basic financial, technical, material and document controls still apply.

Produce BP-02 and BP-07 with the minimum BP-09 Finance/document detail, then test the authorised prototype scope. Any operational pilot needs explicit cohort, source authority, support, acceptance and recovery decisions; repository setup does not satisfy those gates.
