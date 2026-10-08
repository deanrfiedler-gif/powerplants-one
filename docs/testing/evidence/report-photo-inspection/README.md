# Report photo inspection evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 8 October 2026. Baseline: draft PR #370, `476dd0598c4aa92b572a03ce3b172d351d1b07a3`. Scope: [submitted photo inspection](../../../decisions/report-photo-inspection.md), current Service review authority and exact immutable revision membership.

## Verified result

The current Service owner can inspect the exact original PNG referenced by a submitted report revision. Inspection preserves unfinished review decisions/reasons; it creates no approval or customer publication. Current permission, assignment, immutable snapshot membership, attachment identity and original bytes are checked. Review authority is rechecked after storage access. Existing technician downloads and coordinator field-download refusal remain unchanged.

| Check | Observed result | Source boundary |
|---|---|---|
| Database | 5/5 passed | Exact server and test content subsequently committed at `4102fc2`; execution preceded that commit. Authority revocation, cross-report/cross-technician refusal, historical revisions, missing/corrupt bytes, storage-time revocation and unchanged business facts covered. |
| Selected unit cases | 5/5 passed | Existing Field and Reports cases; this is not a whole unit-suite result. |
| Compiled selected browser suite | 15/15 passed, no skips/retries | `4102fc235beec194f4495ef82870b99f84510431`: warm-up, desktop/phone photo inspection, large offline handoff, and existing Reports journeys. |
| Final photo browser cases | 3/3 passed, no skips/retries | `24d19b1f158efeb8ad97d62b50e516cbdac4d80e`: warm-up plus desktop/phone; phone also checks 320px. Only photo width and its assertion/spec changed after the selected run. Build `bXz2zLSgUTZhicOrJw-F3`. |
| Application checks | Lint, typecheck, compiled builds and studio check passed | Source content and individual run boundaries in [verification.json](verification.json). Final build includes the width correction. |

Both browser projects prove exact-byte retrieval; refusal for a technician using the review endpoint; coordinator field-download refusal; no preview before Inspect; retained input through missing/corrupt photo recovery; keyboard retry focus; refreshed retrieval; and URL revocation on hide, refresh and identity change. Final screenshots at 1440, 390 and 320px show bounded images and readable controls. These are synthetic browser observations, not physical-device or owner acceptance.

## Retained unsuccessful attempts

- Initial database run: 3/4 passed; the new test expected the wrong error code. Expanded run: 3/5 passed; session creation polluted its no-write baseline and a peer fixture included another technician's entries. Fixtures were corrected; application authority was not loosened. Final 5/5 is retained separately.
- Initial studio check rejected a test-only catalogue dependency and missing Desktop/Mobile specification headings; documentation was corrected.
- After the width fix, the first focused rerun passed warm-up and failed both fixture setups because the preceding run had already reserved their dates. The task-owned disposable database was reset; unchanged source then passed 3/3. This attempt remains separate from the successful run.
- Initial photo screenshots are retained alongside the final width correction. No earlier evidence was overwritten.
- The first final documentation check ran before the artifact manifest had been written and reported its two missing links. After the manifest was created, foundation and naming checks passed; both foundation reports are retained.

## Review and remaining limits

Independent read-only source, hash and screenshot review found no blocking issue; final committed evidence remains separately reviewable. The endpoint accepts exact historical revisions under current review authority; the UI exposes inspection within the current submitted review. Available attachment state is immutable, so unsupported status mutations were not fabricated by disabling triggers. No new grant, migration, general field access or customer-output inclusion was introduced.

The full repository suite is delegated to CI; its eventual result must be read against the exact PR head. The existing Windows whole-unit baseline has three independently reproduced failures documented in [PQ](../product-quality-next/README.md). Owner/device/assistive-technology acceptance, wider SV scope, the Customers page performance target and full PT-30 remain open. This increment is a draft contribution; no merge or deployment occurred.

## Artifact integrity

[verification.json](verification.json) records source Git blobs, SHA-256 hashes and byte counts for each evidence artifact other than this narrative and the manifest itself. Text logs are normalised to LF and private checkout paths replaced with `<checkout>`. Source hashes use Git LF bytes; browser records additionally preserve their originally observed working-file hashes. Initial and final run identities are kept separately. Synthetic IDs and photographs are fixtures; no credentials or operational records are included.
