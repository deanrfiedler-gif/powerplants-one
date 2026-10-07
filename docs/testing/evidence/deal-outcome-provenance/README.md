# Deal outcome evidence execution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 7 October 2026 by the implementation agent. Review: local synthetic functional proof; paired visual, owner, physical-device and screen-reader acceptance pending.

LC-15 completes the outcome-command part of increment 3 in the [lead-to-delivery programme](../../../contracts/lead-to-delivery-continuity.md), under the [outcome evidence decision](../../../decisions/deal-outcome-evidence.md). Parent source is PR #362 at `96a7701`. The manifest identifies the tested source and retained evidence. Receiving and later programme work remain open.

## Result and proof

New Deal outcome forms require an explicit native quotation comparison or a separate evidence narrative. The native path compares the current quotation head, exact latest issued revision/output and response event/sequence. Accepted with native response holds cleared supports Won; Declined supports Lost. Existing Deal stage, Won evidence and structured Lost reason rules remain unchanged. Ordinary stage progression after quotation issue does not change the issued document or require its recipient/version hash to be rewritten. ES-05 issue checks and frozen source hashes are unchanged.

The source companion, outcome, Won handover due, audit, receipt and publication commit together. A successor quotation, stale response, mismatched outcome or unavailable source rejects the new intent. Historical absent-source payloads and hashes remain unchanged and are not backfilled. Current access governs history and original recovery. Later response correction is displayed separately from the saved outcome and its original source. No native quotation, conversion, delivery or customer-authority decision is inferred.

Environment: Windows, Node 24.21.0, PostgreSQL 16, isolated `ppo_synthetic_test`, compiled loopback application on port 3000, Playwright 1.63.0 and Chrome 154.0.8037.98. Migration 0075 adds one immutable companion. No seed, capability, grant, user, dependency or external service is added.

| Check | Result |
|---|---|
| Final LC-15 database cases | 7/7 pass: stage progression after issue; exact recovery after correction; separate/legacy evidence; stale, wrong-Deal and outcome mismatch refusal; real quote permission revocation; quotation successor; late rollback; populated 0074 upgrade |
| Earlier combined database run | 58/58 pass: 52 retained Deal/ownership cases plus the original six LC-15 cases; the final focused run adds the explicit quotation-successor case |
| Compiled desktop/phone | 10/10 pass: six new native/source scenarios and four retained outcome persistence/recovery scenarios |
| Migration-registry units | 3/3 pass |
| Build, TypeScript, lint | Pass; final issued-basis build and targeted lint follow the source comparison adjustment |
| Selected populated upgrades | 12/12 pass: Estimating identities, Field timer/grants, previous Leads/Sales versions, Leads/Projects registries, policy ledger and hosted-demo Windows/runtime upgrade paths |
| Foundation, prototype, naming, studio | Initial checks pass; final packaging results are retained in the final check logs |

The first focused database run passed five of six cases. Its late-publication fixture used SQLSTATE 23514, which the application correctly maps to a relationship error, so the fixture's exact custom-message predicate failed. The fixture now uses its own unmapped P0001 exception; the exact-message assertion and full atomic snapshot are retained. The earlier TypeScript run also caught the migration-75 versus reviewed-demo-gate-74 mismatch during implementation; the gate was reviewed, documented and tested with the new additive companion. Both initial logs are retained.

The early implementation recomputed live release-source freshness. Code review identified that routine Deal stage changes would alter its frozen recipient/version comparison. The final implementation compares the exact issued source and current quotation/response identities. Both final database and browser fixtures issue during Quoting, progress through Negotiation/Closing and then record the outcome. An actual new quotation revision still refuses the earlier reviewed outcome; no historical hash or native issue rule is weakened.

The browser uses actual native issue and response commands. It loses the successful outcome HTTP response, records an actual Declined correction, and recovers exactly one original Won receipt. A different test proves that refresh leaves the old reviewed response in the submitted payload and the server returns 409 with no outcome effect; deliberate discard/review then succeeds. Denied-refresh UI is mocked, while actual backend permission removal and hidden source identities are proved separately in PostgreSQL.

The agent inspected the desktop deliberate-review capture and phone original-evidence capture. The former retains the fixed comparison and actionable save footer; the latter wraps the original Accepted and latest Declined reports as separate facts. Four captures are retained. This is limited functional/layout inspection, not paired visual approval. Exact new-state mockup images remain missing; no accepted fingerprint is assigned.

No standalone HTTP suite, exact app/PostgreSQL restart or complete local application regression was run. Real HTTP commands are exercised through the compiled browser scenarios; selected upgrades are reported separately. Keyboard/200% zoom, physical-device, screen-reader, owner/business acceptance, final-head CI, merge and deployment remain open. Programme increments 4–6 remain separate work.
