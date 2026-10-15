# DK-03 output register API

Owner: Dean Fiedler. Implementation contract, 13 October 2026. [Decision and traceability](../decisions/output-issue-register-backend.md). Existing native output commands retain authority.

## Register

`GET /api/v1/document-outputs` accepts only:

| Query | Meaning |
|---|---|
| kind | Optional `JobPack` or `ServiceReport`; absent selects both |
| q | Literal case-insensitive reference, appointment or work-order search; at most 200 characters |
| company_id, site_id, organisation_id, owner_id | Optional exact UUID filters; owner means Service owner |
| view | all, issued, unissued, preparing, exceptions |
| offset, limit | Live offset 0–400; limit 1–50, default 25 |

Each family scans in descending native update order with ID tie-breaks, retaining at most 200 currently visible records. Filters operate within these visible windows. The combined page sorts by update descending, family, ID. `matching_in_window` and `has_more_in_window` are permission-filtered. `total_matching` is null if any selected family is truncated. Family coverage is Complete, BoundedWindow, NotPermitted or NotSelected; complete totals describe permitted selected families only. No hidden-record total is exposed. Pagination is live and may move after native changes.

`issued` means a retained current-issue pointer, including withdrawn or review-required records; it does not mean approved/current for use. Preparing covers Queued/Running/Durable native preparation. Exceptions covers returned/withdrawn sources, pack review flags, Failed/StaleSource preparation. Preparation-based filters can only use jobs the caller may see. Missing report review flags are null, not invented false facts.

List availability is NotChecked or NotIssued. Pack crew without a permitted issue receive NotProvided, not a claim that no issue exists, and are excluded from the unissued view. The register does not read every bundle. Read the exact detail to verify availability.

## Exact revision and recipient facts — 15 October 2026

The [register-facts decision](../decisions/output-register-facts.md) adds `current_revision_number`, `current_issue.revision_number` and `preparation.revision_number` from their exact retained revision IDs. Internal readers can see the current draft number while an earlier issue remains current. Crew receive only the revision of their accessible issue; a hidden draft's number is null.

`recipient_summary` contains `visibility`, `recipient_count`, `acknowledged_count`, `required_recipient_count` and `required_acknowledged_count`. Job Pack internal readers receive AllRecipients; crew receive OwnRecipient, with every count restricted to their own exact issue recipient. Acknowledgement counts distinct recipients with matching actor and issued hash, not event count. Required counts describe only that same visible denominator. Simulated sends, opens and downloads do not count as acknowledgement. These facts grant no dispatch or sending authority.

Internal unissued outputs use NotIssued; hidden crew issues use NotProvided. Both have null counts. An issued Service Report uses FrozenReportRecipient and the exact issued recipient count; its acknowledgement and required-recipient counts are null. ReportContent responses remain distinct from pack acknowledgements and attendance acceptance. Withdrawal preserves recorded counts; successor issues do not inherit them. Family/window coverage, ordering, totals, query limits and no-store responses are unchanged.

## Exact detail

`GET /api/v1/document-outputs/:id?kind=JobPack|ServiceReport[&issue_id=UUID]`

Kind is mandatory. An explicit issue must belong to that native output in the current workspace. Absent issue ID chooses the currently permitted issue; an unissued record returns no selected issue. There is no latest-file alias or substitution.

The response separates native source status/current revision, internal preparation history, immutable issue history, selected revision/template/source/PDF/HTML hashes, preparation and issue times, current-issue/current-revision booleans, and native pack applicability. Reports receive no new generic approval/applicability decision. Template data is frozen issue data, not current template policy.

Issue-history and preparation-history entries include `revision_number` bound to each entry's own revision ID. The shared `output` row describes the current visible record; an explicitly selected older issue retains its separate exact revision and per-recipient history.

Available means the retained bundle passed native byte/hash checks at read time. ExactUnavailable preserves the selected identity and exact metadata; storage failure never creates a replacement. Native file links still enforce current permission and exact presentation/issue binding on retrieval. A metadata read records no Opened or Downloaded event.

Pack distribution is SimulatedOnly: TaskCreated, SimulatedSent, Opened, Downloaded and exact per-recipient acknowledgements remain distinct. Real sent/delivered times are null. Internal staff see permitted recipients; crew see their own recipient facts and selected issue history. Explicit old-issue access uses the native exact recipient/assignment context.

Report distribution is NotRecordedBySource. Its issued recipient is the frozen recipient ID. Only ReportContent responses to that exact IssuedReport presentation appear; draft responses and AttendanceFacts are excluded. Response subject, presented hash and supersession provenance remain visible. A recorded response grants no additional work, technical or Finance authority.

Private storage keys, worker snapshots, leases, signatures and raw output bytes are absent. Native page links receive preparation, review, issue, response and recovery work. Shared reads neither call writers nor grant new actions.

## Refusals and limits

Unknown fields/enums, invalid UUIDs and out-of-range windows return 422. No permitted selected family returns 403; inaccessible or mismatched exact records return 403/404 under the existing source rules. A detected authority change while building list counts returns 409 OutputReadChanged. Database failures propagate instead of becoming empty coverage. GETs use private/no-store responses; no command method is added.

The source permissions, working company and current assignment remain authoritative. Workspace read locking shares the native writer boundary, and authority is rechecked after storage and before return. No new schema, grants or cache is introduced. No new UI or actual distribution provider is included.
