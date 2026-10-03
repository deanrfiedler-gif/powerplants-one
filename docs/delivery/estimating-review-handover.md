# Saved-estimate review implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 3 October 2026. Source implementation and automated evidence are separate from owner/visual/device acceptance, merge and deployment.

## Reconciliation and delivered increment

Started from fetched `origin/main` `6e8b898` after #337, with no open PRs, in the isolated managed worktree `codex/estimating-review`. Main now includes scheduling 0053/0054, inspections 0055, incidents 0056 and response evidence 0057. Older Estimating handover statements ending at 0044 or proposing 0045 are historical; cost sources are integrated at 0048. Reserved 0051/0052 remain untouched.

ES-04 now has the native `/estimating/estimates/[id]/review` page, exact current-revision submission, separately scoped completeness/source-price/technical decisions, immutable returned findings, attributable correction responses and successor submission. Earlier unchanged decisions remain explicitly linked to their original evidence. Changes invalidate only the applicable fingerprints. Reviewed is separate from commercial approval, which remains Not configured. The existing saved-estimate page links the review and now honours exact `version_id` entry links so history opens its original cost version.

Migration/seed 0058 and the migration/grant/access-review consumers are updated together. The original Estimate identity remains the receipt target. Recovery checks current authority for the original revision/duty and retains the original command after a lost response. E1 output and all existing specialist/cost-source identities remain unchanged. The [contract](../contracts/estimating-review.md) and [decision](../decisions/estimating-review-native.md) specify the bounds.

## Verification ledger

Local runtime: Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and repository-pinned Playwright/Chrome. A task-owned loopback PostgreSQL instance contains only `ppo_synthetic_test`; unrelated checkouts, databases and worktrees are preserved. Live 0057 constraints were inspected before allocating 0058. Private configuration, logs and exact output bytes remain outside Git.

Initial focused evidence: 15 unit cases pass; six new database cases pass, including concurrent distinct submissions/decisions, original replay, changed-key conflicts, corrections, selective invalidation, later source revisions, independent/current authority, immutable originals and rollback after an injected final outbox failure. Production build and type checking pass. The final observed-basis guard subsequently passes the same 15 unit cases and production build/type checking. Seven compiled HTTP cases covering E1, sources and ES-04 pass. The earlier ES-04-only compiled desktop/mobile run passed all six cases plus warm-up; the final combined browser and broader upgrade runs are in progress. Actual restart verification is still pending. This draft PR does not claim those pending checks passed.

Foundation, prototype, naming and AD-01 model/browser checks pass. Studio validation passes with 327 entries, 173 routes, 34 components and 19 runnable component fixtures; review/owner acceptance remains pending. Final lint is being completed. Agent inspection of desktop history and 320px screenshots found no horizontal clipping; this is not owner or physical-device acceptance. Final evidence will be appended to this ledger before handover.

## Remaining programme and decisions

| Scope | Current reconciliation and next concrete work |
|---|---|
| ES-05 | Extend the existing DraftQuote/revision/renderer; exact terms, recipient/options/template binding, commercial approval, issue and synthetic distribution must remain separate. The user has delegated synthetic policy selection: the next increment will record separate local preparer, approver and issuer duties, no self-approval, and a versioned demonstration template with no commercial validity. Real operative terms and thresholds remain Not configured. ES-04 itself grants no commercial authority. |
| ES-06 | Exact issued-offer response and controlled successor negotiation follow ES-05; no acceptance may transfer to changed content. |
| ES-07 | Accepted exact issue, exceptional item/target-line review and independently received Sales/Projects/Service handover precede idempotent conversion. No MYOB endpoint or write authority is established. |
| Excel import | `tmp/estimating-excel-import` / `feat/estimating-excel-import` retains its uncommitted package pins, native ADR and `src/estimating/import` parser work. Do not overwrite or duplicate it. Reconcile that branch with current main, verify its bounded OOXML/parser dependencies and contract fixtures, then add controlled upload, immutable source retention, full validation/rejected-line review, section/provenance sidecars and reviewed estimate creation. Allocate storage/migration only after that reconciliation. Manual review needs none of it. |
| ES-02 | Five-step structured discovery, multiple areas/systems, historical definitions and saved-cost guards already exist. Category/family adoption and usability proposals need a current-code finding and explicit adoption evidence before changes; no historical configuration is relabelled. |
| ES-08 | Retained accepted geometry programme begins at WP-G00: reconcile current specialist schemas, source/axis mapping, live constraints and concurrent work. No competing geometry contribution was found. The new review sidecar does not change recovered quantities; geometry studies remain distinct from authoritative calculation. |
| ES-09/10 | Subsequent estimate-to-actual comparisons, reference cases and calibration need reliable comparable evidence and separate proposal review. |
| ES-01/03 | Preserve delivered workload, versioned sources and refresh. The demonstrated exact-history link gap is fixed here; no rebuild of those workspaces. |

No merge, deployment, external message, production integration or business transaction is included. MYOB, SharePoint and native CAD retain their boundaries. Owner/device/screen-reader/visual review and commercial policy are still open.
