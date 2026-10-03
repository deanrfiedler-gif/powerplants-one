# Closed-visit and separate-visit guidance acceptance

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Working acceptance matrix; execution not implied. [Decision and state matrix](../decisions/field-closed-visit-guidance.md). Parent traceability: SVC-02/03/05/06/07/08/10/11, NFR-01/07/09; API-C12–18, API-C24/C26, TR-09–13 and existing FI-01/FI-02/FI-05/FI-07 scopes.

| ID | Required observable proof | Evidence/disposition |
|---|---|---|
| CV-01 | Confirmed and InProgress; no own start versus own immutable attendance; another crew member never counts as self | Fresh persisted cases required |
| CV-02 | CompletedPendingReview, Completed and Cancelled refuse new arrival; retained own captured/received/accepted end and report state remain distinct | Fresh persisted/compiled cases required |
| CV-03 | Unknown/non-startable and changed scope; no unsupported Superseded/ReturnRequired state invented | State projection and server refusal required |
| CV-04 | Existing Unknown/Blocked proposal, Preparing proposal, confirmed assigned visit and controlled cancellation/new proposal retain original; no guessed lineage | Fresh compiled receiving journey required |
| CV-05 | Repeated proposal, concurrent writers, lost response/reload and unchanged receipt recovery produce one appointment/effect; correctable input survives stale/validation | Fresh persisted/compiled cases required |
| CV-06 | Wrong company/site/order/scope, direct URL, read-only duty and inaccessible receiving record reveal no hidden identifiers/counts/details | Fresh scoped-read cases plus retained server regressions |
| CV-07 | Changed owner/assignment/permission/scope/pack/policy; current read and command revalidation, no broad grants | Fresh affected cases and retained P07/P09/Scheduling proofs |
| CV-08 | Current/new incident hold or inspection restriction remains independent of closure/customer response/Activity | Retained FI-06/FI-03/04 proof plus affected regressions |
| CV-09 | Old downloaded visit; delayed Start refused; original accepted start receipt recovered; timer/evidence original stays old-visit-bound | Fresh P08 replay cases and unchanged offline regressions |
| CV-10 | Complete original Service/Finance/reservation journey → separate second technician arrival/timer/evidence/report/review; original records/outputs unchanged | Fresh compiled continuous journey required |
| CV-11 | Actual app/PostgreSQL restart preserves original rows, receipts, reports, responses/marks, Activities, Finance and issued bytes | Fresh exact comparison required; optional mark evidence separately identified |
| CV-12 | 1440/1024/390/320, actual browser 200%, keyboard/focus return, readable IDs/history, one scroll owner, failure/recovery | Fresh technical inspection; human acceptance separate |

The six actual appointment states are Proposed, Confirmed, InProgress, CompletedPendingReview, Completed and Cancelled. General supersession is not implemented. A cancelled predecessor remains history; no schema relationship is invented. Preparing is not readiness or booking acceptance.

## Human acceptance checklist

- [ ] Dean follows both crew identities from closed original facts to the existing receiving records, confirms wording is understandable and records owner acceptance separately.
- [ ] Service owner/coordinator checks proposal reuse and explicit cancellation/replacement reasoning, scope/readiness/contact/booking/pack duties and unresolved owned work.
- [ ] A technician uses a physical phone and desktop keyboard: closed-state guidance, long IDs/history, 320/390 layout, reachable actions and recovery without losing input.
- [ ] Representative screen-reader user checks headings, status/error announcements, link purposes, labels and focus return; record browser/device/assistive-technology versions.
- [ ] Independent visual reviewer compares retained timer r05 and shared controls at 1440/1024/390/320 and actual 200% zoom; explicitly adjudicates the proposed host guidance. Missing accepted closed-visit mockups remain recorded.
- [ ] Owner completes remaining full PT-30 demonstration/prior-case closure and cross-domain Field Work narrative. Step 6's bounded written PT-28 pass remains source-specific; this increment is not a new complete PT-28 update/rollback execution.
- [ ] Record baseline and follow-up task completion time, misdirected arrival attempts, repeated preparation attempts and user comprehension for benefit measurement. Automated success is not measured business benefit.

Unsupported receiving actions: offline preparation/scheduling/review/issue/inspection/incident workflow, general return lineage, automatic replacement/assignment/closure, transfer of old customer or pack acknowledgement, external notifications, production integration, merge and deployment.
