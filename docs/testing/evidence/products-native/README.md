# Native Products verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Automated verification and visual inspection in progress; no owner acceptance or deployment claimed.

Source baseline: main `cad98aca42cb233f142029d11601a78d7d4b521e`; dedicated `feat/products-catalogue-native`. [Implementation contract](../../../contracts/products-catalogue.md), [handover](../../../delivery/products-native-handover.md).

Executed so far: four Products unit cases and six fresh-reset PostgreSQL domain cases pass. The integrated application build succeeded with the local locked dependencies. Final lint/type/build, owner-adjacent regression, HTTP/browser, cross-0026/current-schema upgrade and actual restart checks are still being completed. Early failures are retained in the handover and are not counted as passes.

Browser captures use exact compiled application states at 1440×960, 1024×768, 390×844, 320×844 and 720 CSS px (effective 200% desktop reflow). Capturing an image is separate from inspecting it. The final manifest will list actual inspected images, state, source and hashes; none is an accepted UI baseline.

Workflow-map proofs retain these distinctions: ambiguous external identity needs explicit disposition; unknown interfaces have owners; missing/expired/mismatched source evidence stays uncertain; catalogue updates retain estimates/quotes; source refresh uses deliberate comparison; installed successors retain original identity and separate owner review; uncertain commands recover original receipts; absent stock observation stays Unknown.
