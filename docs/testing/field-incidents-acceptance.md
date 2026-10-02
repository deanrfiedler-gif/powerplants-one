# FI-06 acceptance matrix and owner walkthrough

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Technical execution is recorded in [evidence](evidence/field-incidents/README.md); independent human acceptance is pending. Local FI06-* case labels below are test identifiers, not new parent requirements.

Sources: [FI-06 decision](../decisions/field-incidents.md), [contract](../contracts/field-incidents.md), retained Quality r01 sections 8–9, [product quality requirements](../requirements/product-quality-register.md), BP-01 Service/QHSE and D-019. FI-06 does not implement the F03 bulletin feature. AT-17 is commissioning failure/retest/phased handover and cannot alone prove incidents.

| Case | Requirement/source | Observable result |
|---|---|---|
| FI06-01 | SVC-03/06/10; F02-A/F08-A | Real work/appointment/equipment/configuration and exact scope; factual report under failed readiness/hold, server reporter/time, retained original and correction |
| FI06-02 | NFR-01; Q01-A | Scoped read/report/review/close/sensitive duties; wrong company/site/scope, direct URL, changed identity/assignment/permissions and revoked receipt authority refuse |
| FI06-03 | NFR-01; DOC-01/02 | Restricted canaries excluded from lists, ordinary record/history/evidence, Activities, counters, generic diagnostics/audit/recovery and operational output |
| FI06-04 | SVC-10; NFR-09 | Two reporters and concurrent reviewers, expected-version conflicts, unchanged original retry, lost response; no duplicate report, action or Activity |
| FI06-05 | D-019; F08-A | Unknown/unassessed remains held; triage owner/due/priority, retained reason; similar reports remain distinct and explicit repeated-report links close neither |
| FI06-06 | F02-A; SVC-06/10 | Real owned corrective Activity; completion alone clears no incident/defect; return/clarification, corrected original evidence, assignment changes and independent acceptance |
| FI06-07 | ENG-07; PRJ-06/08; bounded AT-17 | Linked inspection correction/fresh retest/independent acceptance stays in its engine; a passing independent inspection cannot clear incident holds |
| FI06-08 | F08-A; NFR-07/09 | Exact scope controls readiness/Start/release; active attendance retained; offline Start replay revalidated; factual capture/recovery remains possible |
| FI06-09 | DOC-01/02/03; Q05-A | Exact outcome scope/review/evidence/exclusions, remaining work and actual receiving status; reopening changes current applicability, never earlier bytes |
| FI06-10 | Q01/Q02/Q05 | Failed upload, inaccessible evidence, source/configuration changes, stale reviews, overdue/incomplete actions; missing sources fail closed |
| FI06-11 | NFR-09; Q05 | Reload, interrupted connection and actual app/PostgreSQL restart preserve observations, corrections, receipts and issued originals |
| FI06-12 | NFR-08; Q03/Q04 | Complete compiled keyboard journey, focus return/errors, 1440/1024/390/320 layouts, actual 200% zoom, readable evidence and one content scroll owner |

## Fresh inspection dependency walkthrough

Execute equipment/appointment → approved preparation → failed inspection → return/clarification → owned correction → fresh retest → independent review → exact scoped output. Current merged-main run: all five database cases and four compiled desktop/phone inspection/reference cases passed on main `4ecef7f`. Retain #334's original restart and calibration/source evidence where unchanged; FI-06 must freshly prove hold interaction and affected regressions. No owner participated in this automated execution. It provides no physical-device, assistive-technology or visual acceptance.

## Concrete human acceptance checklist

- Service owner and a field technician select the fictional equipment/visit and explain preparation and work authority before reporting.
- Technician enters a factual event and restricted detail, corrects an error without losing the original, and distinguishes saved, unsaved, conflict and uncertain-result states.
- A separate authorised reviewer assesses the exact scope, returns evidence, assigns owned work and confirms the Activity source link. They explain why task completion, inspection acceptance and incident closure differ.
- Action owner completes the task, appends exact corrective evidence and performs a linked fresh retest where required. Reviewer accepts only the intended evidence and closure scope.
- Affected user sees the minimum hold information. A read-only user demonstrates that private details and commands are inaccessible, including direct file URLs.
- Reviewer opens the exact HTML/PDF, explains exclusions and remaining work, reopens the incident and confirms the old document is retained as historical.
- On representative physical phones, complete the journey with touch and keyboard occlusion. At actual 200% zoom inspect long labels, evidence and focus. With a screen reader verify field names, errors, save status, history disclosure and focus return.
- Record participants, device/browser/assistive-technology versions, source/build, dates, observed failures and decisions. Missing participation stays pending; neither screenshots nor passing automated tests grant owner approval.

Operational policy, statutory applicability, notification/emergency processes and equipment control remain outside this synthetic acceptance. No offline incident command or unavailable receiving-domain completion should be described as saved or delivered.
