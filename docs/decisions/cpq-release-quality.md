# CPQ release quality and exact impact review

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 15 October 2026. Status: bounded backend implementation authorised; operational and visual acceptance remain separate. Scope BC-04 / ES-02 / ES-03, preserving EST-01–EST-09.

## Decision before implementation

Continue the published Product, governed cost and explicit rebase increments. Existing fixtures, semantic comparison, immutable revisions, schema-3 rule members and table coverage are reused. This slice adds an exact, independently reviewed impact report for deliberately enrolled release roots. It does not create another calculation language, price book, package owner, or automatic estimate update.

Use a version-1 quality workflow independent of definition schemas 1–4. Store accepted assessments and reviews in the existing immutable `CpqRelease` audit evidence with the existing operation receipt and outbox transaction. An assessment is an accepted command with an immutable report and hash, not a mutable document. Read the live amended schema and prove retained evidence/repeat seeding. A new table, migration or service would duplicate that lifecycle; a definition schema change would alter historical calculation hashes for a publication concern. No dependency, capability, grant or migration is added.

Creating the first assessment deliberately and permanently enrolls that release root. All later revisions of the same root require current independent impact approval at activation. There is no disable command. Legacy roots with no assessment keep their existing review/publication contract, including original receipts. Enrollment is explicit and visible in the quality read; merely reading a report does not enroll a release. This compatibility boundary must be visible in the API and delivery record.

## Report and bounds

The report binds the exact candidate revision/hash, current company activation/revision, immutable member inventory and existing Product/Cost Source evidence. Member keys and hashes describe the actual frozen definition; schema-3 native rule version IDs are retained where present. This is not separately owned package authoring. Reuse executed saved fixtures, replay the active release's fixtures against the candidate, expose semantic changes, conflicts, observed rule contributions and schema-3 table coverage. Observed coverage is not a proof over all possible inputs; expected negative fixtures are valid regression cases. Changed baseline expectations and unexercised rules remain explicit review evidence.

Identify every currently open CPQ-backed native estimate in the candidate's company, including manually edited successors of an adoption. Open means an Active option in a Draft estimating workspace whose whole commercial group remains Draft, matching the existing receiving contract. Authorize each exact current estimate/version and source run before returning any report; an inaccessible member refuses the complete assessment without exposing hidden counts or details. Do not silently present a scoped subset as company-wide impact. Cap the population at 25 and refuse overflow explicitly. Limit the combined worker input to 2 MiB and report to 2 MiB; retain the existing isolated worker's five-second and memory budgets.

Simulate the candidate with the saved run's original inputs and overrides. Bind current native estimate version/hash/lines, original adoption/run and simulated result, line differences and totals. A simulation does not receive lines, resolve stale overrides, replace manual edits, approve a price or claim stock availability. All affected estimates still require the existing explicit rebase/adoption workflow. Return blocked calculations and conflicts visibly. Candidate fixture failures or incomplete/conflicting table partitions prevent impact approval. Estimate-specific blockers remain reviewable impacts, not silent substitutions.

## Exact review, publication and recovery

Assessment saves require the exact preview hash and expected release version under the shared workspace mutation lock. Increment the release's command version without changing its revision or ordinary review state. Review accepts an exact assessment operation ID/hash and expected release version. The reviewer must have current `cpq.review` authority, differ from both revision author and assessment author, and authorize all retained source evidence. Approval re-derives the current report and refuses changed activation, source authority, estimate population or current versions. Rejection is immutable; reassessment is an explicit new operation.

Activation of an enrolled root requires the latest assessment of its current revision, a subsequent independent Approved review and the unchanged current report. The publisher must also differ from the impact reviewer and assessment author. Recheck the reviewer's current duties and source access. A newer assessment supersedes approval only for future use; history is retained. All state/evidence/receipt/outbox changes commit atomically. Original command replay and receipt reads authorize the accepted historical sources before returning the original result, without requiring yesterday's population or publication state to remain current.

## Verification and limits

Test regression deltas, expected-negative fixtures, coverage/conflicts, exact member identity, manual/native impact, scoped denial, stale and changed populations, independent duties, enrollment inheritance, rejected/superseded assessment, source revocation, immutable history, rollback, concurrent/repeated commands, original recovery, compiled routes, real application/PostgreSQL restart and quotation privacy. Record local execution, CI, independent automated review and human acceptance separately.

Separately owned rule/table/book packages, operational fixture ownership, representative performance targets, UI/Figma work, broader fact mapping, solver policy and live integrations remain open. This increment measures bounded synthetic workloads only. Do not merge or deploy.
