# Automation N2 execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic software evidence; supplier, owner visual, physical-device, screen-reader and production acceptance remain separate.

Implementation: [ADR-0061](../../../decisions/ADR-0061-nursery-technical-assessment.md) and the [merged Automation specification](../../../blueprints/nursery-automation-configurator.md). N2 covers NAC-R01–09 and bounded technical portions of NAC-AT01–07, 19–22 and 28. N3 shared delivery, Products publication, paired CPQ receiving/pricing and NAC-AT23 complete quotation journey are not delivered by N2. No manufacturer limit is approved or seeded. The fixtures' rates, geometry and review names are synthetic evidence only. Exact technical HTML outputs are internal study snapshots, not released CPQ manifests.

## Executed checks

Initial checks executed on 22 October 2026 against the N2 implementation at 97d5580a9d01d0216376c534171792d8efd487b5, with documentation and browser-harness corrections through d7543ea1. The subsequent pre-merge rule correction and its validation are recorded separately below. Local environment: Windows, Node 24.22.0, Playwright 1.64.1 and Chrome 156.0.8078.48. Database cases use a dedicated loopback-only ppo_synthetic_test cluster.

- All ten N2 unit cases passed, including exact independent rate/quantity cases, known-bound failure precedence, source-qualified counts and simultaneous manual staffing.
- Full local unit suite: 1,030 passed, three failed. The same three private-document/recovery filesystem failures reproduced on the unchanged merged N1 tree (b7b4336f; no tree difference from origin/main e9f28b69). These Windows environment failures are not attributed to this change; the full suite is not reported as a local pass.
- Initial N1/N2 database run: six passed. Final N2 run after permission and staffing fixes: four passed, covering original receipts, exact source/output bytes, cross-company refusal, mixed opportunity/source-site authority and populated 0116→0117 ledger/grant/seed preservation.
- Late reserved migration cases at 117: four passed (Products 0052, assistant 0110, service finding 0111 and intake 0112); repeated migration/seeding is inert.
- Ten compiled browser cases are covered by two executed runs: the initial combined N1/N2 run passed eight cases; the remaining desktop/phone edit-history cases passed in a focused rerun after correcting a case-sensitive output-text assertion and the history-dropdown locator. Application code did not change between those runs. Coverage includes editing, target shortfall, retained output hash, read-only history, 320 CSS-pixel overflow, transient refresh, uncertain original-save recovery and permission denial clearing protected content.
- Normal npm run build, type check and lint passed. Design register, foundation, naming, status-source and migration-number checks passed. The final browser test edit also passed focused lint.

The local build initially rejected an out-of-worktree dependency junction; an attempted webpack fallback stalled. The normal build passed with identical locked dependencies installed inside this worktree. No dependency or lockfile was changed. Browser startup needed a longer local timeout; this does not alter the committed CI timeout or waive a browser assertion.

## Independent review

Independent gpt-6-astra review of 97d5580a9d01d0216376c534171792d8efd487b5 found no remaining actionable defects. The reviewer independently executed all ten N2 unit cases. Preliminary findings were corrected before that head: known-bound failure precedence, assumed counts, exact-source edit/receipt authority, stale draft retention and simultaneous manual operator allocation. The reviewer confirmed the documentation-only 287ac568 delta preserves that conclusion. A final read-only review of the documentation, screenshots and browser-harness delta found no actionable defects or material test weakening and confirmed the clean implementation review remains valid. No defect comments were posted after the clean final review.

## Runtime visual evidence and limits

The [desktop](assessment-desktop.png), [390-pixel phone](assessment-phone.png) and [320-pixel phone](assessment-320.png) screenshots show the read-only saved-history view from the passing focused browser run. These were visually inspected for text wrapping, control placement and visible overlap. The browser assertion also confirmed no document-wide horizontal overflow at 320 pixels. The shell owns the content scroll, so these images show the visible top of the page rather than every lower field. They are runtime evidence, not an accepted Figma baseline or a comprehensive accessibility review.

Owner visual review, 1024-pixel/200% zoom review, physical-device and screen-reader acceptance remain open. See PR #665 for live CI results; local results here do not imply that every remote check has completed. No deployment, supplier sign-off or business acceptance is asserted.

## Pre-merge completeness review

Review of d7543ea1 against the merged N2 specification and the updated O1–O15 / DP1–DP8 plan found one P2 classification defect: confirmed minimum/maximum bounds in an inverted interval could mark equipment NotSuitable before recording the conflicting range. The correction checks a confirmed contradictory interval first and retains NeedsConfirmation with a blocking clarification. Known failures with an unknown opposite bound, valid out-of-range failures and unrelated established incompatibilities still retain NotSuitable.

The new regression failed before the correction and passed afterward across diameter, height and filled mass. All eleven N2 unit cases then passed. Independent gpt-6-astra follow-up reviewed the correction, independently passed all eleven N2 unit tests and found no additional actionable findings. Final committed-head confirmation and CI remain merge gates; the earlier clean review is evidence for its recorded head, not a waiver for this correction.

The review found no missing N2 Products/CPQ handover requirement: technical, installation, spare, waste and pack bases remain separate; no authoritative labour, price or service-coverage calculation is duplicated here. Shared parts/facts receiving, exact published Variant/unit bindings and the activity ledger remain explicit N3 dependencies.

History loading currently reads and verifies every full assessment revision, so work increases with revision count and retained output size. The reviewer recorded this as a nonblocking prototype scaling limitation without an established latency failure. Future bounded metadata history, exact selected-revision reads and latest-only save lookup must preserve current source authority and immutable evidence. This is not production capacity acceptance.

## CI completeness corrections

Integrated head `567ffc459c82c3989e61d8b9634039198bd72feb` passed the complete Estimating workflow, Products, specialist, dependency audit, documentation/design and the supply workflow. It did not pass all CI: the broad database-8 group exposed three missed current-ledger expectations in `policy-persistence.test.ts`, while an HTTP-isolation job timed out downloading Ubuntu browser prerequisites before tests and the compiled mobile job exhausted its existing limit while cases were still executing.

The policy correction changes only the latest-version assertion and two complete ledgers from ending at 116 to ending at 117. Every earlier version, original row/hash, grant, seed receipt and replay assertion remains. All eleven policy-persistence tests passed in a fresh loopback-only synthetic PostgreSQL 16 database, and focused lint passed. The independent reviewer confirmed these assertions and audited the remaining written/computed migration expectations without another omission; the application implementation review remains clean.

The [compiled browser isolation decision](../../../decisions/ci-compiled-browser-suite.md) extends the existing native desktop-shard pattern to two mobile shards, preserving every browser assertion and deadline. Local exact discovery confirms the complete 620-case mobile population equals the union of 312 and 309 cases, with only warm-up repeated. This is selection proof only. A new committed head must pass all applicable CI; previous passes and the retained cancellations do not waive that gate.
