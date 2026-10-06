# Completed conversion disposition

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Implementation decision under the authorised ES-07 follow-up; business policy and owner acceptance remain separate. ES-07 / EST-03/08/09 / SCM-01/08 / BR-07 / IF-03 / AT-05/26. All parent IDs and issued references remain unchanged.

## Reconciled basis

Refreshed `origin/main` is `a32b3b53c45bdc74061f3612c15d71c0544504d8`, the merge of #342. GitHub confirms its final head `2edcf91dab9245c4ead866920463ce902fabe267` and all 25 successful checks. ES-04 #338, ES-05 #340 and ES-06 #341 are integrated. Earlier pre-merge records retain their checkpoint meaning. No open PR or competing disposition contribution was found. Work uses isolated `codex/quotation-disposition`; original checkouts, Excel import and retained proof databases are preserved.

## Bounded actions and alternatives

`SYN-ES07-02` permits an attributable review of one originally created Forecast target at a time. **Retain** explicitly keeps the reviewed native record. **ReviseQuantity** uses the existing `Supply:Revise` contract for an exact positive six-place quantity on an eligible Forecast. **Hold** records owned follow-up without resolving the exception. Review and application are separate immutable facts; recording a review or note never clears an exception.

BP-08 and native Supply already support positive quantity revisions, retained versions and automatic MaterialAction/Impact evidence. This increment reuses that command implementation within the quotation transaction. It changes only quantity; stable identity, item, unit, company/entity keys, source links and all other record content remain exact. It cannot set zero, cancel, delete, replace, approve, purchase or release work. Quantity revision is held for Approved demand, active allocations, child records or consequential demand facts. Existing Impact and Assessment records remain evidence and do not themselves forbid revision. Retain may acknowledge the exact current downstream state but grants no authority to act on it or resolve its separate Supply holds.

A mutable resolved flag would hide later exceptions. A receipt without native mutation would not implement disposition. New target creation would violate the quotation's one-execution contract. These alternatives are rejected. Keep the existing TypeScript/Next/PostgreSQL architecture, workspace lock, shared permission checks, native command receipts and actor-bound journal. No dependency, service, framework, capability, grant or seed is added.

## Selective evidence and immutable decisions

Append subordinate decision/application events beneath the original quotation revision, completed execution and exact target. Each target has its own sequence and review predecessor. Bind original execution/plan/issue/output/response/preparation/receiving/source line, current issue and response applicability, current receiving, that line's mapping, site timezone, target version and permitted downstream dependencies. Sibling mappings/targets, unissued drafts and unrelated Supply records do not invalidate a decision. Changed source evidence, target versions, dependencies or required permissions hold an unexecuted action.

Each review retains actor/server time, reason, evidence, owner/due date/next action, exact basis and proposed native command. Corrections name the preceding review and preserve its effects. Application atomically retains the original decision, target mutation when applicable, native receipt/revision/Impact/Activity and disposition receipt. A unique application per decision and the workspace lock prevent competing effects. An applied decision resolves only its exact resulting source/target/dependency fingerprint; later relevant changes expose a new exception. A later Hold or replacement review reopens review until explicitly applied.

Receipt recovery checks current original source and target authority before disclosure. Replay bypasses new applicability checks only to recover an already committed original result. Missing receipts are inconclusive; the browser holds replacement actions and keeps the exact original operation through reload. There is no partial database execution or offline command.

Operational authority, signing, validity/expiry, withdrawal, commercial terms, item-master governance and ERP mappings remain Not configured. Retention or synthetic quantity revision is not commercial approval, supplier cancellation, procurement authority or authority to begin work. MYOB, SharePoint and native CAD retain their responsibilities.
