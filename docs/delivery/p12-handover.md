---
document_id: PPO-PP01-P12-HO
revision: r02
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Implemented on integration branch; exact-source restore and main publication pending
source_commit: 6d46e0e5ef236a11066cda19ef67f961ec16a24d
---

# P12 recovery and demonstration handover

[Issue #165](https://github.com/deanrfiedler-gif/powerplants-one/issues/165) and [integration PR #166](https://github.com/deanrfiedler-gif/powerplants-one/pull/166) follow the completed [P11 bounded publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/54#issuecomment-5567364667). Dean’s ongoing instruction authorises this work. [ADR-0024](../decisions/ADR-0024-p12-isolated-recovery.md) records the implementation choice before runtime. The [operator runbook](p12-recovery-runbook.md) provides install, checkpoint, inspect, isolated restore, original-operation recovery, reset and deterministic demonstration commands.

## Delivered implementation

The operator checkpoints one stopped local synthetic PostgreSQL 16 database, its immutable documents/media and an explicitly selected closed browser profile. It captures one exported database snapshot, exact table/sequence/definition and migration fingerprints, independent file membership/hash/size, release identity and the server snapshot instant. Private files remain outside Git; symlinks, hardlinks, non-private roots, active clients and overlapping paths are refused. A child directory beginning with two dots remains a child and is refused as an overlapping destination.

Restore requires a second empty PostgreSQL instance, checked by both endpoint and system identifier. A different address for the source does not qualify. One SQL transaction restores the archive; all database and original file comparisons finish before workers resume. Occupied targets, corrupt/missing originals and incompatible ledgers fail closed. Partial destinations remain for investigation instead of being reset automatically. Measured duration/checkpoint age are observations, not operational loss or availability promises. The utility neither downgrades schemas nor performs an operational integration.

The isolated test constructs an OutcomeUnknown Finance original, exact issued report/photo and a stored-but-interrupted Draft quote lease. It challenges invalid targets/checkpoints, restores originals, requires Finance original lookup before simulation, reconciles one target and recovers the stored quote without permitting regeneration. A final independent read confirms the source remains unchanged.

The extended profile component uses the retained P08 UI capture and actual accepted-response-loss procedure, then adds one supported pending original and one explicitly unsupported-version fixture. It restores the closed profile, compares all eight originals/PNG bytes, expects six exact recovered receipts, one newly accepted original and one retained review item, and exercises the actual saved-workspace lock before identity change. Execution evidence is still required; authored assertions are not a completed procedure.

The private DEMO-02 preparer freezes the actual Brisbane date, source and migration epoch, all operation IDs and the quote source before commands run. File and directory entries are flushed when saving the plan. Six scenarios reach the prescribed 2/1/1/1/1 stages with five active Activities and one completed Activity. O2’s explicitly authored format-2 fallback estimate is A$9,900.00 cost/A$12,750.50 sell. Rerunning must recover all 19 exact business receipts; an old reset epoch is refused. The test saves the exact Ready Draft HTML/PDF for review. These are fictional inputs and no actual owner acceptance is implied.

## Evidence and procedure disposition

Final exact source/tree, run IDs/attempts, logs, artifacts, original visual review, normal merge and actual-main results belong in #166 and the authoritative #165 publication. This avoids a repository document claiming its own later commit. Earlier failed attempts and repairs stay linked. Current local integrated lint/types, 90 unit tests, build and documentation checks passed before the final filesystem refinement; its focused guard tests/lint/types also passed. Local Node was 24.20.0; maintained CI targets 24.21.0 and the guarded Chrome from #163. No local PostgreSQL/browser run is claimed.

The first integration source `da92832331d8ca653aeff88657c80f47840c517c` failed the Full Application database job `103823023762`: 392 of 393 database cases passed. P12 failed before checkpoint/restore because the test incorrectly expected a private manifest in the public report-issue projection (`TypeError` reading `job_id`). The correction retrieves the original IssuedReport presentation through the existing permission-checked `presentationBytes` service and compares the same presentation after restore. It does not add a manifest to the public DTO or regenerate the report. The second disposable PostgreSQL readiness probe now requires TCP, so the temporary initialization socket cannot qualify as the final server. Focused lint and types passed; actual corrected restore execution remains pending. The original failure is retained, not attributed to restore.

| Procedure | Implemented evidence | Remaining condition |
|---|---|---|
| PT-22 | Complete snapshot/isolated restore comparisons, exact document lease, original Finance lookup/replay and target conservation; timing and checkpoint-age capture | Actual test execution and original evidence review before a full result is published |
| PT-28 | Original supported/unsupported payload and closed-profile restoration component; immutable output and migration-version refusal | Actual compatible application-update/scheduling-rule publication, future-booking impacts and complete written procedure remain unexecuted; no routing/scheduling rule is invented |
| PT-30 | Deterministic six-opportunity preparation plus prior P11 selected service/Finance and restart components | Complete one recorded scope narrative through return-visit/history/report reservation/Finance reconciliation, all P01–P12 prerequisites and dispositioned earlier findings; Dean’s demonstration acceptance remains separate |
| PT-27 and device/accessibility | P11 raw load and original review evidence retained | Candidate three-second p95 was missed in all 16 measured groups; physical-device and screen-reader review remain absent |

P12 component delivery does not close the complete PP-01 acceptance boundary. Current main’s maintenance and the CRM/E1 originals are preserved; no workflow content is authored by this integration. No hosted deployment/reset, operational data migration, ERP/SharePoint effect or customer distribution is included.
