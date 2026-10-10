# PT-29 screen-state verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Recorded 10 October 2026 (Australia/Brisbane). Status: authorised synthetic verification; independent review and owner acceptance pending.

Dean authorised the next PT-29 increment alongside Claude's UI work. The isolated `codex/pt29-screen-states` branch starts at main `caa0d9c699edc672a2600a4941e16e56878a9856`. It uses the existing Playwright, Chrome and PostgreSQL stack. No technology, schema, grant, page or component contract is adopted by this test contribution.

[PT-29](../testing/prototype-acceptance.md#pt-29--honest-empty-error-and-partial-states) derives from AT-23 and NFR-05/NFR-08/NFR-11. Its fifteen screen families are the original [BP-07 section 3 catalogue](../blueprints/BP-07-service-operations.md#3-screen-catalogue), not the later Supply module's SC page keys. [BP-01 section 20](../blueprints/BP-01-master-blueprint.md) requires honest state and recovery behaviour. Parent IDs, authored procedures, issued snapshots and catalogue status remain unchanged; execution is recorded separately.

The existing P11 matrix already traversed fifteen families. A successful read alone did not prove populated content, SC-07's empty collection was treated as an unavailable detail, SC-13 omitted the no-extraction state, and SC-15 depended on another test to supply a recovery case. The continuation asserts records visible from the actual browser response, owns its fixtures, visits an explicit populated planner date and records the request's real query. Empty collections, unavailable detail records and missing account observations now have separate assertions.

Existing shared validation and uncertain-disposition tests are reused. Additional cases exercise failed upload with the original selected file retained, exact-byte recovery, partial/failed account extractions and a real stale Finance command after concurrent cancellation. Read/transport failure injection proves presentation; actual commands, receipts and byte retrieval prove only the named persistence boundaries. The [screen-state checklist and evidence](../testing/pt29-screen-states.md) separate these kinds of proof.

This is bounded PP-01 synthetic verification. It does not approve every current application route, operational accounting, a real ERP/document provider, accessibility conformance, physical devices, performance, independent visual review, owner acceptance or deployment. Those remain their own procedures and review records.
