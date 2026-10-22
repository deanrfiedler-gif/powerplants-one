# Automation N2 execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic software evidence; supplier, owner visual, physical-device, screen-reader and production acceptance remain separate.

Implementation: ADR-0061 and the merged Automation specification (stable nursery-automation filename). N2 covers NAC-R01–09 and bounded technical portions of NAC-AT01–07, 19–22 and 28. N3 shared delivery, Products publication, paired CPQ receiving/pricing and NAC-AT23 complete quotation journey are not delivered by N2.

Validation is in progress. Record final executed results here before marking the PR ready. Initial nine pure rule cases passed; later independent review added manual staffing and source-authority regressions. PostgreSQL runs use a dedicated loopback-only ppo_synthetic_test database. The old temporary N1 cluster could not start (missing pg_notify); no application regression was inferred and a fresh isolated cluster was created.

No manufacturer limit is approved or seeded. The independent fixtures' rates, geometry and review names are synthetic test evidence only. Exact technical HTML outputs are internal study snapshots, not released CPQ manifests.

## Executed checks and independent review

- Independent gpt-6-astra review of 97d5580a9d01d0216376c534171792d8efd487b5 found no remaining actionable defects. The reviewer independently executed all ten N2 unit cases using native TypeScript transform. Preliminary findings were corrected before this head: known-bound failure precedence, assumed counts, exact-source edit/receipt authority, stale draft retention and simultaneous manual operator allocation. No defect comments were posted after the clean final review.
- Local full unit suite: 1,030 passed, three failed. The same three private-document/recovery filesystem failures reproduced on the unchanged merged N1 tree (b7b4336f; no tree difference from origin/main e9f28b69). They are Windows environment limits, not attributed to this PR.
- Initial N1/N2 database run: six passed. Final N2 run after permission and staffing fixes: four passed. Preserves original receipts, exact source/output bytes, cross-company refusal, mixed opportunity/source-site authority and populated 0116→0117 ledger/grants/seeds.
- Late reserved migration cases at 117: four passed (Products 0052, assistant 0110, service finding 0111 and intake 0112); repeated migration/seeding is inert.
- Type check, lint, design register, foundation, naming, status-source and migration-number checks passed. Naming initially exceeded the 8,000-character project-instruction limit; the corrected copy is 7,997 characters. CI on the earlier head reports that same corrected naming issue.
- Local build/browser validation remains in progress. Turbopack rejected the out-of-worktree dependency junction; the webpack fallback stalled and was stopped. The unchanged locked packages were copied into this worktree for a normal build. No dependency or lockfile change was made.
