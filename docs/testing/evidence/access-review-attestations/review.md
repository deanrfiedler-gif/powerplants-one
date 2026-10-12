# Source review and delivery boundary

Agent source review, 12 October 2026, runtime/test source `041402f`. This is not independent security or owner acceptance.

- The server derives the snapshot from the exact workspace/team/member/grant join; client content cannot substitute a snapshot. The actor must be local, active, separately authorised and different from the subject. Initial membership supplies context only.
- Workspace/operation serialization and authority-table locks surround revalidation. Grant time can still advance under a lock, so the command compares the basis again after writing evidence and rechecks current duties. Evidence is committed with the record or rolled back together.
- Identical original replay checks current actor duties before returning the immutable receipt. It does not revalidate or reapply the historical grant; changed payload and other-actor recovery remain refused.
- The database checks original row/snapshot/audit/receipt agreement at insertion. The historical grant ID has no foreign key to the live grant, allowing future grant removal without deleting evidence. Record and operation update/delete are refused.
- Review of timestamp handling found that a JavaScript Date would truncate the PostgreSQL observation instant to milliseconds. The final service carries the UTC instant with six fractional digits through storage and detail reads; focused proof checks its exact database representation.
- Hosted replacements withhold the snapshot and free-text reason. All review services refuse hosted mode; the local seed adds one explicit existing-identity duty. Hosted upgrade and the PP-01 role matrix retain their own proof obligations.
- Component implementations, host fixtures and bindings are unchanged. The existing catalogue gains one capability label; the working retained design is regenerated from the LF capability source. Issued HTML and all parent IDs are unchanged. There is no new native review surface or visual acceptance claim.

Keep means a reasoned synthetic observation of a current recorded row, not effective access, business suitability, extended validity or campaign completion. Native controls, assigned campaigns, the other decisions, review-origin requests and their independent reviewer rule, membership lifecycle, D-020, cadence/retention, devices and owner/security acceptance remain open.
