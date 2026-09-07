---
document_id: PPO-012-SRC
revision: r01
date: 2026-09-07
status: Bounded read-only source assessment; migration and operational validation open
owner: Dean Fiedler - private prototype
---

# Projects — Smartsheet source assessment

[BP-06](BP-06-projects-commercial-delivery.md) · [Master transition register](BP-01-master-blueprint.md#275-smartsheet-asset-transition-register)

## Evidence boundary

Connected Smartsheet US access confirmed Dean as OWNER of workspace `5845693727303556`, [PPA - Project Delivery System - PROTOTYPE](https://app.smartsheet.com/workspaces/wWV3m8qxCHfxfx6GPXx7PcjGQX5XM2QRmPRr5c31). Initial structure was read on 6 September; column metadata and selected template rows were refreshed on 7 September 2026 UTC. Reads do not certify configuration, licences, enabled workflows or operational completeness.

Inspected columns on MIG-01, MIG-02, MIG-07, MIG-08, both MIG-10 sheets and the folder MIG-11 register. Selected content reads filtered Status = Template Baseline: 25 plan rows, 15 deliverable rows and 18 readiness rows, all returned without sampling according to connector metadata. These are counts of template rows, not active projects or implementation tests. Master operational rows, real contacts, live amounts, files, comments and history were not read. Template names/statuses classify the inspected examples only; they do not classify every workspace record.

## Current-source mapping

| Source / stable asset ID | Observed fact | Proposed treatment / boundary |
|---|---|---|
| MIG-01 Master Project Register / 7193972341428100 | Separate Project ID, Customer Account ID, Opportunity ID, Project Quote Number; independent MYOB Status, Delivery Stage, Stage Gate, coordinator and health; target/forecast/actual dates | J1 typed local project/customer/site with manual stage, health and forecast. ERP identity/status remain source-owned, no J1 import. Do not copy name-based display formula as an identity |
| MIG-02 Plan & Milestones / 5570243312177028 | 47 columns; native Predecessors (PREDECESSOR) and text Predecessor Ref; 25 Template Baseline rows | J1 manual milestones only; J2 reconstruct approved graph by stable row IDs/type/lag/calendar, preserving parallel branches |
| MIG-03 Conflict Rules / 8359937850691460 | Prior master assessment only: eight Design Only disabled rules | Retain as future test candidates; not freshly inspected or adopted |
| MIG-04 Scheduling Intake / 8199519882661764 | Prior master identity reference; no current content read | J3 request mapping after current scheduling ownership validation |
| MIG-05 Competency / 850335441571716 | Prior master reference; no current content read | Service owns competence verification; do not create qualifications from template roles |
| MIG-06 Assignments / 97019921125252; Availability / 506845163638660; Capacity / 5010444791009156 | Prior master metadata only | Reuse actual PPO booking guards; separate source classification/authority before migration |
| MIG-07 Deliverables / 5758727951961988 | 18 columns, 15 Template Baseline rows; Submitted/Accepted/Rejected and evidence/approval fields | J5 exact deliverable/reviewer/acceptance records; generic template acceptance sentence is insufficient for technical approval |
| MIG-08 Readiness / 401447739936644 | 16 columns, 18 Template Baseline rows; verification/evidence, blocking flag and customer confirmation | J5 with BP-05: job-specific criteria, competent reviewer, hold/retest and exceptions; no automatic adoption of checkbox rules |
| MIG-09 Finance Definitions / 4967587594063748 | Prior master assessment only, not re-performed | J4 requires actual definitions and reconciled examples; no copied totals or calculated margin |
| MIG-10 Contacts / 8168684836048772 | 27 columns; classification, consent, Do Not Notify, approval and delivery status distinct | Later communication policy must retain suppression and current recipient validation |
| MIG-10 RAID / 1463606037139332 | 20 columns; risk/assumption/issue/decision/dependency/change; score and priority formulas | J1 simple blockers/Activities, J2 richer RAID. Scores/thresholds are observed template behaviour, not PPO policy |
| MIG-11 root / 3484607864328068 and folder / 1028436326829956 | Two assets with same display name. Folder register has 48 columns, exact-issue approval, delivery evidence and workflow-enabled marker | Retain both identities; determine authoritative writer and history before migration. J4 controlled customer update; neither asset is deleted/merged by title |
| MIG-12 legacy stock/schedule copies | Earlier immediate workspace metadata only | Inventory source/copy/owner and archive use separately; no presumed stock or booking authority |

Source permalinks: [Master](https://app.smartsheet.com/sheets/5PPgrmXp3QJj3GF6m9q8RXgRWrwQXQQqQVq6vPc1), [Plan](https://app.smartsheet.com/sheets/RqCmhPmwW794MV2w4q52gqQw2P5PpP7WMHRFH3x1), [Deliverables](https://app.smartsheet.com/sheets/7jxqMXFvFv6jGv6MpV3M5wrJ82hj4MV9qQ2wRfg1), [Readiness](https://app.smartsheet.com/sheets/5m6mHcJqJjJGfjR34qFj5wR6gM48JPGcXM8phXV1), [Contacts](https://app.smartsheet.com/sheets/q2cwvxpCHVPW7CHJx33Fc9gQJqprXFvjcwvc4fh1), [RAID](https://app.smartsheet.com/sheets/HRPhxvPWX3gFQF225rVhVVvRhF849JqG62q3Rvg1), [Folder update register](https://app.smartsheet.com/sheets/f7j6m6MhVc7Wh88pwHwpGCR93j7W4MM7W47g4Vx1).

## Material semantic findings

1. **Dependencies:** external template PT-0006 displays native `4FS, 5FS`, whereas its Predecessor Ref is PT-0005. PT-0011 displays `10SS`; PT-0015 displays `13SS`. These observations reconfirm the master warning. The connector returned no predecessor index in this response. Do not infer a validated row-ID graph from sorted row order; calendar settings, lag and recalculation still need a separate read/rehearsal.
2. **Dates:** source MYOB Start/End, Target/Forecast/Actual Finish and task Gantt/actual dates have different owners and meanings. J1 only owns manual coordination dates and records changes; it makes no ERP or baseline claim.
3. **Approval:** source Stage Gate, Commissioning Ready, Handover Complete and customer-update approval are separate controls. A stage label or a template checkbox must not replace technical, commercial or customer evidence.
4. **Cadence:** MIG-01's update interval formula uses 7/14/30 days by tier. Retain as an observed source rule; J1 shows last update date without adopting an SLA or auto-stale policy.
5. **Health:** source Green/Yellow/Red/Gray and separate procurement/resource/Finance indicators must not become a single opaque score. Proposed PPO labels use words and preserve unknowns. Risk-score thresholds remain unadopted.
6. **Customer outputs:** both a master narrative/gate and a distinct issue-level register exist. J1 internal notes never become a customer feed. Later customer-safe content needs exact revision approval and distribution evidence.
7. **Record classification:** master may contain mixed operational/prototype history. Its schema was read, not its row content; no whole-workspace synthetic classification or 83-project audit is claimed.

## Gaps and owners

| Gap | Needed evidence | Blocks |
|---|---|---|
| G01 Source ownership/classification | Dean/data steward classifies selected assets/rows, duplicate-name registers and writable owner | Source import/cutover; not synthetic J1 |
| G02 Native dependency mapping | Stable predecessor row IDs, FS/SS/lag units, calendar/baseline and accepted recalculation examples | J2 engine/migration |
| G03 Engineering authority | BP-05 criteria, technical release/review and hold/retest ownership | J5 technical gates; not manual J1 milestones |
| G04 Commercial and Finance | Accepted handover criteria, contract policy, financial definitions/source examples | J3 conversion/J4 commercial features |
| G05 Project policy | Confirm proposed stage vocabulary, coordinator model, known-site limit and J1 sequencing at invocation | J1 contract acceptance; defaults here are reviewable proposals |
| G06 Communication ownership | Master versus issue register relationship, recipient validation/suppression, exact output approval and portal projection | J4 customer publishing |
| G07 Scope/Activity integration | Add typed Project target, all current visibility/receipt paths, owner eligibility and change handling | J1 implementation; no existing Project target claimed |
| G08 Transition | Approved historical detail, attachments/comments/history, deltas, reconciliation, rejected rows and fallback | Any source migration or retirement |

D-010/D-014/D-026 remain open. Later migration maps source workspace/sheet/row IDs and provider/company/entity keys to internal UUIDs; names and row positions never serve as keys. Preserve source histories and approved file permissions, rehearse duplicates/deltas/rejected rows, reconcile relations and dates, then retire only the accepted capability with an explicit decision. This package makes no source writes.
