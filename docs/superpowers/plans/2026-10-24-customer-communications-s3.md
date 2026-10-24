# D-025 S3 synthetic dispatch and delay communications

<!-- versioning: git; committed history is authoritative -->

Owner: Codex for Dean. Date: 2026-10-24. State: implementation plan; no validation or acceptance claimed.

## Authority and boundary

Dean approved: “Proceed with D-025 S3 as recommended, using the synthetic carrier/platform catalogue and delay reasons. Recheck main and open claims first, and take it through to a review-ready PR without merging or deploying.”

Implement D-025 S3 under [D-025](../../decisions/customer-communications-d025.md), [S2](../../decisions/customer-communications-core-s2.md) and the [communications contract](../../contracts/customer-communications.md). Traceability: CRM-03, DOC-05, SCM-07, SCM-08, OUT-17, TR-03, IF-15, NFR-11, AT-25, AT-36; existing EC-04 and SC-05–SC-07 scope. No operational carrier, provider or delivery rule is inferred from the fictional catalogue.

Backend only: native Dispatch Moved facts, a named customer delivery contact, separately recorded customer ETA, immutable M1/M2 source snapshots, published customer-safe templates, named sender confirmation and the existing synthetic worker. No provider, UI, infrastructure, new dependency, migration of real data, merge or deployment. Preserve historical records and operation payloads, OUT-09 and issued pack bytes. Switches remain Off by default.

## Sequence and ownership

1. Refresh main and open claims; reserve 0121 and open a draft PR. Base observed: 60a7f7b469ab758e9ee99fd7d5d3910b27f2f2ad. S2 (#569) is merged. #688 holds R1/R2 including 0119; #690 holds P4/P5 and 0120. Neither is a schema dependency of S3.
2. Develop unclaimed supply/communications domain files and new focused tests. Before editing overlapping registry, upgrade-test, worker-runner or design-register paths, sequence after the other claim lands or obtain explicit coordination. Never write another branch or rerun its jobs.
3. Create a private PostgreSQL 16 cluster under this worktree's tmp, using a free port other than 5433/55432 and max_locks_per_transaction=1024. Create both synthetic databases, migrate current main, inspect the resulting schema, then implement the migration and catalogue seed. No grants or capabilities are planned.
4. Implement delivery-contact/customer-ETA commands and catalogue reads with current scoped authority, version checks and operation recovery. Extend native Dispatch evidence without changing historical normalized command payloads or generic UI fields. Prepare M1 atomically for native Moved facts; prepare M2 only for a later customer ETA than the last ETA actually sent to the same contact. Supplier ETA never becomes customer ETA.
5. Bind messages to immutable source evidence. Refuse stale source/contact/authority before confirmation and synthetic handover. Preserve exact content and make sent corrections successors. Unknown outcomes reconcile before retry; Off drafts nothing; refusal/failure remains visible through owned follow-ups.
6. Test units, database transactions/constraints/concurrency, populated upgrades retaining original rows/hashes/ledgers, HTTP permission/refusal/recovery and affected compiled browser journeys. Existing fixtures must satisfy the rules rather than weaken them.
7. Maintain existing contracts, append a dated decision note, add status/document-register entries and accurate API consumer guidance. Keep delivery, functional proof, review, acceptance and deployment separate.
8. Merge current main before every push; follow final-head CI. Supply a copyable Claude review prompt with exact base/head. Resolve verified findings; mark ready only after required different-model review is dispositioned and final-head CI is green. Dean merges.

## Migration and validation checklist

Follow the full AGENTS.md checklist, not a fixed file inventory. Search current latest migration and seed versions as whole words under tests; inspect entire assertions, computed ledgers, atVersion cases, seed exclusions, demo bare counts and all historical Products cases plus the late reserved-Products case. Preserve populated quotation, timer, policy and customer-response histories. Read the demo-upgrade guard before changing it. Seed registration must use an existing migration in increasing order. Do not adopt #692's unmerged proposal.

No business_identities alteration is intended. If required, flush identity_target IMMEDIATE before ALTER and restore DEFERRED immediately afterwards, with an upgrade across 0026 containing estimates. No capability/grant/user additions are intended; if that changes, complete the access-review generation and all grant/reseed/user-count obligations before delivery.

Record exact commands/results: check_foundation.py, check_naming.py, check_prototype.py, build_status.py --check, check_migrations.py --open-prs, documentation Python unit tests, studio:check, lint, typecheck with NODE_OPTIONS=--max-old-space-size=8192, test:unit and build; affected database/upgrade, HTTP and browser checks. After committing run check_documentation_scope.py --base origin/main --head HEAD. Confirm unfamiliar failures on unmodified current main. Node observed 24.22.1 against pin 24.21.0; install with npm ci --engine-strict=false if needed and disclose the difference.
