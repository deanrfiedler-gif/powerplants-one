# DK-03 exact revision and acknowledgement register facts

Owner: Dean Fiedler. Date: 15 October 2026. Backend implementation authorised by the continuing programme. Operational and visual acceptance remain separate.

## Scope and source

Base main `41c8479a0aa4ff8eeebec5efb66712c95ecc8874`. The [accepted output design](output-issue-figma-design.md) adopts Q4/G3: revision numbers, recipient counts and acknowledgement progress before page implementation. The broader backend instruction authorises delivering this read dependency. Keep DK-03, DOC-01–DOC-06 and OUT-09/OUT-10. This independent branch does not require the separate G1 correction or CPQ #498; no stacked dependency is invented.

## Architecture decision

Extend the existing permission-scoped `src/outputs/reads.ts` projection and PostgreSQL queries. Read numbers from the exact retained revision row, never from the latest revision when displaying an earlier issue or preparation. Aggregate acknowledgements against each exact pack recipient and issue hash. Count a recipient once even if it has several observations. Return required-recipient counts explicitly; do not invent a completion threshold or equate acknowledgement with delivery/technical acceptance.

Reuse current native source authority, workspace read locking, family windows and final authority checks. Do not open stored bundles in a register. A new counter table, materialised summary or cached projection would introduce staleness and persistence obligations for facts already present in indexed native evidence; a new permission would duplicate existing exact detail visibility. None is selected. No framework, service, schema, seed or grant changes.

## Read contract

Add `current_revision_number` alongside its retained ID, `revision_number` to current issue and preparation summaries, and exact revision numbers to issue-history and preparation-history entries. Internal readers see the native current revision; crew see only the revision of an accessible issue. Hidden current drafts never disclose a number.

Add `recipient_summary` with `visibility`, `recipient_count`, `acknowledged_count`, `required_recipient_count` and `required_acknowledged_count`. For an accessible Job Pack issue, visibility is AllRecipients for native internal readers or OwnRecipient for crew. Every count uses only that same visible recipient set. Acknowledgement requires the exact recipient, actor and issued output hash. Unissued internal records use NotIssued with null counts; hidden crew issues use NotProvided with null counts. Service Reports use FrozenReportRecipient with their exact issued recipient count, and all acknowledgement/required counts null: ReportContent responses and attendance acceptance remain separate. No synthetic distribution state increments these counts.

Withdrawn/superseded issues retain their factual history; their counts grant no current applicability. A successor issue starts with its own recipient facts and never inherits earlier acknowledgements. Existing live paging and bounded-family coverage stay unchanged. Other G2/G4/G5 proposals, labels, names and UI controls remain separate.

## Verification

Extend native database and compiled HTTP proofs for both families, exact current/earlier/preparation revisions, partial and complete acknowledgement, successor isolation, crew redaction, no-issue states, withdrawal, current access/company isolation and zero business writes. Preserve existing exact-byte/recovery tests. Read-only projections add no persisted workflow; the existing restart proof remains regression evidence rather than a new migration claim. CI, independent automated review and human acceptance remain separate. No merge, deployment or customer communication.
