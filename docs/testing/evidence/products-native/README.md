# Native Products verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Automated verification and visual inspection in progress; no owner acceptance or deployment claimed.

## Completion run — 7 October 2026

Source branch `codex/products-completion` starts at main `58679be` (registry through 0071). The original unfinished checkout and its earlier evidence remain preserved. Current verification is in progress; results below will be replaced by the final source-specific ledger before handover.

Completed so far: nine focused Products/navigation units; TypeScript check; design-register integrity (336 entries, 182 routes, 37 component entries); actual main schema materialisation (333 tables); ascending upgrade across 0026 with existing estimates and exact original receipts.

Retained failed attempts: the first fresh-reset proof reached PostgreSQL's default lock-slot limit while dropping the actual-main schema, before applying Products. The task-owned disposable cluster was configured to the repository's existing 256 lock slots. A subsequent test overlapped the completion of that cluster restart and lost its setup connection; its result is not counted as a pass. Fresh serial proof is required after the cluster settles. Initial access-model assurance identified a missing Products group label in the reconciled model; its repair must pass the same check.

The actual current-main schema, source-transfer hashes and full local command logs remain in the task's ignored private `tmp` folder. They contain no production data. Public proof summaries retain no session credentials or connection configuration.

Source baseline: main `cad98aca42cb233f142029d11601a78d7d4b521e`; dedicated `feat/products-catalogue-native`. [Implementation contract](../../../contracts/products-catalogue.md), [handover](../../../delivery/products-native-handover.md).

Executed so far: four Products unit cases and six fresh-reset PostgreSQL domain cases pass. The integrated application build succeeded with the local locked dependencies. Final lint/type/build, owner-adjacent regression, HTTP/browser, cross-0026/current-schema upgrade and actual restart checks are still being completed. Early failures are retained in the handover and are not counted as passes.

Browser captures use exact compiled application states at 1440×960, 1024×768, 390×844, 320×844 and 720 CSS px (effective 200% desktop reflow). Capturing an image is separate from inspecting it. The final manifest will list actual inspected images, state, source and hashes; none is an accepted UI baseline.

Workflow-map proofs retain these distinctions: ambiguous external identity needs explicit disposition; unknown interfaces have owners; missing/expired/mismatched source evidence stays uncertain; catalogue updates retain estimates/quotes; source refresh uses deliberate comparison; installed successors retain original identity and separate owner review; uncertain commands recover original receipts; absent stock observation stays Unknown.
