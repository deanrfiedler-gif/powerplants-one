# FI-07 acceptance matrix

Owner: Dean Fiedler. Status: synthetic technical delivery; independent human acceptance pending. [Contract](../contracts/field-customer-response.md), [decision](../decisions/field-customer-response.md), [execution ledger](evidence/field-customer-response/README.md). Preserve all 78 parent IDs; these cases derive from existing SVC-09/10/11, DOC-01/02/03, NFR-01/07/09, DAT-08/09, API-C16/17/18, TR-11/12/13 and AT-10/11/12/13/14/34/36.

| Case | Observable acceptance | Executable proof |
|---|---|---|
| FI07-01 | Every choice and no response; distinct attendance acknowledgement/report response/internal acceptance/Finance; exact issued/draft association, unavailable identity absent, repeats one receipt | field-customer-response.test.ts FI07-01; native browser |
| FI07-02 | Two actors competing successors yield one successor; correction reuses open owned action; owner/due/outcome retain history; similar independent response stays independent | FI07-02; native browser |
| FI07-03 | Current service owner, recipient/person, company and response authority rechecked; read-only does not grant capture; old permitted receipt retains fact after source change | FI07-03; existing reports scoped/revoked receipt cases |
| FI07-04 | Existing/new incident hold permits factual response only; incident state/holds and other authority unchanged; sensitive canaries absent | FI07-04; FI-06 retained/fresh regressions |
| FI07-05 | Actual failed Service inspection, partial internal review and accepted customer response leave defect and independent acceptance unchanged; other attendance still pending | FI07-05; Service inspection / EN-08 suites |
| FI07-06 | Legacy queue hash preserved; new subject replay exactly once; correction/subject mark reassociation refused; changed report cannot receive old queued response | FI07-06; reports-offline suite |
| FI07-07 | Populated 0056→0057 upgrade preserves attendance, entries, internal acceptance, responses, receipts, issued HTML/PDF, grants/users/templates and ledger; reseed idempotent | FI07-07; exact migration registry/populated upgrade suites |
| FI07-08 | Damaged original evidence, revoked field access, wrong presentation hash and signature-byte mismatch save no response or obligation | FI07-08; P09 missing/corrupt controlled-output tests |
| FI07-09 | Offline source/audience change and revoked authority refuse original without rewriting it | FI07-09; P08/P09 replay suites |
| FI07-B1 | Actual attendance → factual completion → authorised review → draft acknowledgement → lost response/reload recovery → controlled issue → issued reservation → explicit clarification → actual Activity due/outcome → original history | reports.spec.ts FI07 native journey, desktop/phone |
| FI07-B2 | Retained r02/theme loaded independently; native token/adaptation comparison; exact presentation visible with no internal notes | reports.spec.ts FI07 reference comparison; P09 customer-safe projection suite |
| FI07-R1 | Original tables, receipts, synthetic marks, HTML/PDF survive actual application and PostgreSQL restart | field-customer-response-restart-proof.ts write/verify |
| FI07-V1 | 1440/1024/390/320 layout, readable exact content, one content scroll owner, actual Chrome 200% zoom, keyboard guide/focus return | field-customer-response-zoom-proof.ts and native browser |
| Retained P09 | Multiple attributable attendances; factual correction and successor review/issue/fresh response; original bytes/marks unchanged; return proposal not confirmation | reports.test.ts, reports.spec.ts complete UI journey |
| Retained boundaries | Wrong site/scope/direct URLs, assignment/identity changes, response/review/issue duties, rejected bytes, changed source during render, Finance and scheduling non-effects | reports/field/offline/finance/planner/policy/inspection/incident/controlled-output suites; exact execution in ledger |

No automation pass is owner or business acceptance. Original failures and corrections are retained in the ledger, with source/run identity. Fresh execution is distinguished from historical PR evidence.

## Concrete human acceptance checklist

- Owner: walk two actual synthetic attendances, attendance acknowledgement and issued report dispute; confirm language and whether post-review acknowledgement meets the bounded need.
- Owner: clarify a reservation, change the actual Activity owner/due date, complete contact, then verify the dispute and technical restrictions still exist.
- Owner: compare r02 proposed issued-only composition with preserved native DraftEvidence/IssuedReport and correction/recovery modes.
- Physical phone/tablet: test 390/320-equivalent task, touch targets, long exact evidence, file choice, keyboard occlusion, poor connection and tab closure.
- Screen reader: test heading/presentation entry, explicit response choice, validation announcement/focus, saving/uncertain/saved states, guide focus return, and exact iframe content.
- Independent visual reviewer: inspect paired source/native captures at 1440/1024/390/320, actual 200% zoom and one content scroll owner; record findings and only then any accepted fingerprint.
- Receiving owners: confirm proposed return remains preparation and no customer response grants work, technical release, billing, warranty or project acceptance.

Pre-review attendance signatures, authenticated customer portal, external delivery/notifications, offline correction/review/issue/incidents and broader Service orchestration are unsupported. Next concrete bounded increment: closed-visit arrival and return-visit entry guidance, followed by the complete PT-28/PT-30 Field Work walkthrough and human acceptance.
