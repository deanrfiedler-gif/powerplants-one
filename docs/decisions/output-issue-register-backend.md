# DK-03 consolidated output register backend

**Owner:** Dean Fiedler. **Status:** implementation decision; business and visual review remain separate. **Date:** 13 October 2026.

Dean authorised proceeding with the next Documents backend increment after DK-01/DK-02. This implements the first receiving step in [the DK-03 design decision](output-issue-distribution-design.md): shared reads over existing Job Packs (OUT-09) and Service Reports (OUT-10). It traces to DK-03, DOC-03/DOC-05, AT-20/AT-36 and [the existing output contract](../contracts/document-issue-distribution.md). Existing parent IDs remain unchanged.

Reuse the current TypeScript/PostgreSQL service stack, domain contexts and exact bundle readers. There is no new technology, table, migration, seed, grant or writer. A duplicate output registry would create competing issue identities and recovery state; a new generic publication service would prematurely replace domain review authority. Both alternatives are deferred. This contribution continues from DK-01/DK-02 PR #467.

The API exposes a permission-filtered register and exact issue detail. Generated/durable preparation, issued identity, current source applicability, recorded distribution, opened/downloaded events and recipient responses are separate facts. A queued or durable job is never an issue. Simulated sending is never delivery. Attendance acceptance is not report-content acceptance. Old issue bytes and responses stay attached to their original identity.

Native pack/report contexts enforce workspace, working company, site, assignment and owner rules. Pack crew see their permitted current issue in discovery and their own recipient evidence. Explicit historical pack requests must pass the native exact-issue context. Internal preparation records stay restricted to native staff. Report content responses use the exact issue presentation and exclude AttendanceFacts.

Register discovery retains at most 200 visible outputs per selected family, ordered by update and stable ID. Coverage and window counts are explicit; truncated windows have no claimed complete total. Paging is live, not a frozen export. Exact detail verifies retained bytes without recording an open/download event; unavailable bytes retain their original metadata and never trigger regeneration. Private storage keys, snapshots and worker leases are excluded.

Shared reads use the workspace serialization boundary and recheck native authority before returning. Domain failures are not silently presented as empty coverage. Native pages and exact file endpoints remain the receiving handovers; commands continue to enforce current authority themselves.

This is backend delivery only. The DK-03 page, additional output families, generic issue/distribution commands, actual delivery-provider evidence, SharePoint and DK-06 template administration remain separate work.
