# Nursery Automation N1 implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Builder: Codex. Scope: [ADR-0060](../../../decisions/ADR-0060-nursery-discovery-foundation.md), N1 of the [merged specification](../../../blueprints/nursery-automation-configurator.md). User selected Standard 2.0 and Plus. Main baseline: 002af00e; delivery PR #662.

## Implemented boundary

Native capture on an exact saved Discovery alternative; source-qualified equipment shortlist; current/future scenarios; attributed unknown/assumed/conflicting observations; independent delivery applicability/selection/responsibility/coverage; immutable saved revisions and history. Existing estimating owner/read/edit authority and original-operation receipts remain in use. A missing or incomplete source is never fabricated as Complete.

Storage is a bounded append-only child of the existing estimating workspace and alternative. No new identity type, capability, seed or grant is required. Save increments the workspace version and stores a separate Nursery revision; original source, catalogue snapshot and hash remain retained. Shared Products/CPQ publication, labour standards, assessment, pricing, handover and quotation are not implemented by N1.

## Verification log

- Nursery unit suite: 4/4 passed for null versus explicit zero, source conflicts, exact scenario identities/phase, limits, strict field rejection and independent delivery dimensions.
- Database: all three cases passed: saved/reopened Express scenarios, immutable prior history, original receipt after successors/rebinding, current-source checks; competing writers, cross-company access, grant revocation and receipt access; populated 0115 to 0116 upgrade preserving original rows/grants/seed receipts/ledger and inert repeat. The permission test initially used the wrong fixture column; corrected to the existing user_id, then passed. The extended source test also proves saved incomplete Discovery stays incomplete; its initial empty-answer fixture was corrected to the existing owned Deferred-answer contract before passing.
- Products regression: the newest-history case (through 0116) installs late reserved 0052, preserves all original rows and receipts and proves repeat migration/seed adds nothing.
- Browser: 4/4 passed against the local development server in Chrome 156.0.8078.48 / Playwright 1.64.1. Desktop and phone capture/reload retain source conflicts, independent supplier commissioning coverage, null demand and a separate future scenario. An accepted POST with its response deliberately lost recovers exactly one original receipt. Concurrent changes retain the draft; denied refresh removes it. Distinct field IDs and no horizontal overflow at 1440/1024/390/320 CSS px are asserted.
- Browser setup initially inherited a deliberately revoked grant from the database suite; an authorised fixture reset corrected that. The first capture attempt then exposed an exact-label locator mismatch on a native select; role/name targeting corrected the test. All four final cases passed without relaxing assertions.
- Typecheck, full lint, final application build, studio:check, foundation, naming, migration reservation and dependency checks passed. No runtime vulnerabilities; the full-tree audit retains the existing documented lint-only braces exception.
- Full local unit run: 1,020 passed, three failed in unchanged document-store/recovery tests because Windows private-path semantics differ. All three reproduced on the clean primary main checkout (9dad9aa5); the four relevant test/implementation files are byte-identical in current origin/main 002af00e. No Nursery test failed. Linux CI remains the integrated gate.
- The final application build passed. Hosted CI results are recorded in PR #662. Different-model migration review has not occurred. No supplier acceptance, owner UI acceptance or deployment claimed.

## Visual evidence

[Manifest](manifest.json) retains normalized source hashes, image hashes, environment and limits. Captures use synthetic records only. The builder inspected [desktop context](nursery-1440.png) and [320px conflict evidence](nursery-conflict-320.png): labels and fields wrap without horizontal clipping. Further captures cover 1024 and 390 widths. These are execution evidence, not approved mockups; the register deliberately retains Needs review and no review fingerprint. Screen-reader, physical-device and 200% zoom acceptance are not claimed.

## Acceptance mapping

This is N1 evidence for saved inputs, unknown/conflicting provenance, current/future scenario separation and exact-source/history/authority boundaries. It supports portions of the specification's saved Discovery and current-access cases (NAC-AT14/20/23/25), not their complete N2–N4 handover/quotation outcomes. Equipment sources remain pending supplier/owner review, so the N1 business exit criterion is not marked accepted.

## Source status and review limits

The Javo Standard 2.0 public product description and technical specifications disagree on minimum pot diameter. Both claims are retained as unreviewed source observations; approved limits and exact Products Variants are null. The user-selected Plus is identified on [Javo’s application catalogue](https://www.javo.eu/en/applications/potting-machines/); exact regional/options and supplier validation remain pending. The Standard reference is its [public product page](https://www.javo.eu/en/product/javo-standard-2-0/). Public pages are identification sources, not operational authority. Synthetic scenario values are invented test evidence.

The current implementation plan was read again on 22 October, after its 04:01 UTC alignment update. O1–O15 and DP1–DP8 remain the governing shared direction. This increment does not amend the shared parts-proposal schema or duplicate CPQ activity calculation.

## Open before subsequent stages

Supplier/Products owner confirmation of exact regional variants and limits; reviewed topology and independent N2 calculation cases; shared paired parts/facts receiver and activity ledger for N3; governed profile/content versions and complete quotation reconciliation for N4. NAC-AT23 complete journey is not executed by this increment.
