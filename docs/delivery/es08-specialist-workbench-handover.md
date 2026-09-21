---
document_id: PPO-ES08-HANDOVER
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented; final verification in progress
---

# ES-08 native Specialist Configuration Workbench

Dean requested execution of the two issued r02 documents. Their normative bodies
are identical. Scope is Screen Systems, EST-06/E5, CRE-13–CRE-17, EA-16/17,
AT-04/28, G06 and D-009; no parent requirement is renamed or closed by this work.
[Architecture and precision ledger](../decisions/ADR-0034-es08-specialist-workbench.md).
Branch `feat/es08-specialist-workbench` retains ES-02 prerequisite `ea57344`.
The [field contract](es08-field-contract.csv) records types/technical limits; these
are defensive computation bounds, not approved engineering ranges. The authored
[golden fixture manifest](../../tests/fixtures/es08-golden-r01.json) pins Appendix E.

| Package | Delivered work |
|---|---|
| S01 | Source inventories, exact contracts, authority/writer reconciliation and ADR |
| S02 | Migration/seed 0031, durable raw drafts, immutable runs and resolved sets, scoped APIs |
| S03 | Exact rational engine, 64 fields, five extra screens, 143 positions, 101 catalogue entries, 14 manual allowances, six gates, 12 parameters |
| S04 | Register/create and six native views, shared shell, four accessible schematic diagrams, independent pricing lanes |
| S05 | Configuration and estimate B/C/N comparisons, contribution lineage in every estimate writer, atomic synthetic receiving, source rebase/copy/archive and reload recovery |
| S06 | Unit/database/HTTP/browser/upgrade and independent design-source verification; final result table is maintained below |

## Review and demonstration

Use only the disposable `ppo_synthetic_test` database. The fixture command
`node --env-file=.env.local --import tsx scripts/es08-fixture.ts` installs the named
synthetic example if absent; its explicit `reset` argument destroys only that
disposable database. No production connections or raw workbook prices are used.
Run the existing local server, select the coordinator demonstration identity and
open `/estimating/configurations/e5080000-0000-4000-8000-000000000005/configure`.

1. Inspect Configure, Parts & working, Pricing, Compare & save, Definition review
   and Run history. Parts can show all 143 rows and open source/working inspectors.
2. Change bays from 12 to 13. All fourteen manual allowances retain values but
   require review. Review each displayed value, then save an immutable review run.
3. In Compare & save expand native AUD rates, explicitly choose the authored
   synthetic proposal, review estimate changes and apply. The new estimate version
   retains the unrelated manual line and links each contribution to the exact run.
4. Edit or delete a contributed line through ordinary estimate save, return to
   receiving and choose Keep current / Keep omitted / Restore explicitly. Cancel
   changes nothing. A stale target version requires a renewed comparison.
5. Inspect historical runs and export exact synthetic review evidence. Saving a
   draft/run does not select discovery, change costs or update existing quotations.

Internal UUID and `SYN-PPO-CFG-<UUID>` display references are distinct. Creation
binds a saved alternative/discovery and explicit FacilityScope or defined system
coverage. Existing ES-02 Text/Zones facts are context, not inferred screen dimensions.
Rebase makes a new source binding/draft; copy into another alternative gets a new
identity and no cost ownership. Archived history remains available when permitted.

## Verification checkpoint

Environment: Windows, Node 24.21.0, npm 11.19.0, Python 3.14.7, PostgreSQL 16.15,
Chrome 153.0.8010.53 and Playwright 1.63.0. No new dependency or external service.
The current source tree is uncommitted during final verification; the evidence
record will pin the implementation commit before publication.

| Check | Actual checkpoint |
|---|---|
| Build / TypeScript / lint | Build and TypeScript passed; final lint rerun pending |
| Specialist unit | 16 passed, including independent Appendix E geometry, 28 historical scenarios and three documented exact-decimal differences |
| Specialist database | Expanded suite 13 passed; one invalid test-profile failure corrected and the case passed; final full rerun pending |
| Cross-0026 upgrade | Passed with existing estimates through migration 0031; prior estimates, quotations, hashes and receipts preserved |
| HTTP | Authored full-envelope and exact receiving tests; execution pending |
| Compiled native browser | Initial run passed six-view/design/responsive and permission tests; locator corrections and added conflict/race cases under rerun |
| Retained r03 source | 41 model groups and 35 native browser groups passed |
| Foundation / naming | Passed before final handover edits; final rerun pending |
| Full repository unit | 171/175 passed; four failures reproduced on unmodified main `8ed8b0c` in this Windows environment |

The four baseline failures are two document-store `ExactDocumentUnavailable` cases,
one recovery `UnsafeRecoveryDirectory` path case and one warm-route path assertion.
They are not counted as ES-08 passes. Broad report-renderer and hosted-only identity
suites have not been claimed from this local environment.

## Remaining decisions

Engineering ranges/branches, motor mapping, source catalogue conflicts, stock-unit
conversion, installation/productivity and operational commercial policy remain
unapproved. The receiver is restricted to `SYN-ES08-RECEIVE-01`; general operational
receiving remains blocked. This build adds no ERP endpoint, procurement release,
customer output, production transaction, deployment or owner acceptance.

## Derived verification index

All ES08-T IDs below derive from EST-06/E5, CRE-13–CRE-17, EA-16/17, AT-04/28,
G06 and D-009. The index locates implementation evidence; executed results are
reported in the verification table, not inferred from a test label. U = specialist
unit file; D = specialist database plus relevant existing E2 regressions; H =
specialist HTTP; B = compiled specialist browser; R = code/source/visual review.

| ID | Area | Evidence and bounded interpretation |
|---|---|---|
| ES08-T01 | Scope and source | R — ADR-0034; current ES-02 prerequisite retained |
| ES08-T02 | Native shell | B |
| ES08-T03 | Header/menu | B |
| ES08-T04 | Responsive/accessibility | B — 320/390/960/1024/1280/1440/1920 CSS widths; 960 is 200%-equivalent reflow, not a claimed assistive-technology audit |
| ES08-T05 | Scoped navigation | D / H |
| ES08-T06 | Source context | D / H |
| ES08-T07 | Field completeness | U / B |
| ES08-T08 | Input provenance | U — Source context inherited; incompatible Text/Zones numeric mapping is refused |
| ES08-T09 | Exact lookup | U |
| ES08-T10 | Rounding order | U |
| ES08-T11 | Physical geometry | U |
| ES08-T12 | Drive identities | U — Separate source keys retained; historical scenarios exercise branch identity |
| ES08-T13 | Pipe changes | U |
| ES08-T14 | Source gaps | U — Findings remain review-required; tests do not close source gaps |
| ES08-T15 | Invalid arithmetic | U |
| ES08-T16 | Parts registry | U / B |
| ES08-T17 | Part conflicts | U |
| ES08-T18 | Manual quantities | U / D |
| ES08-T19 | Manual review invalidation | U / B |
| ES08-T20 | Gate semantics | U |
| ES08-T21 | Parameters | U |
| ES08-T22 | Historical parity | U — 28 scenarios; three exact decimal corrections in ADR, no blanket parity |
| ES08-T23 | Pricing unknowns | U / B |
| ES08-T24 | Money policy | U |
| ES08-T25 | Immutable evidence | D — Immutable database snapshots; future catalogue publishing is outside this bundle |
| ES08-T26 | Durable draft | D / B |
| ES08-T27 | Preview authority | D / H |
| ES08-T28 | Run atomicity | D |
| ES08-T29 | Configuration rerun | U / B |
| ES08-T30 | Resolved totals | U — Resolved pricing uses chosen lines and withholds unresolved totals; generic choice arithmetic has authored expected totals |
| ES08-T31 | Cancel | D / B |
| ES08-T32 | Definition successor | U — Exact bundle mismatch is refused; incompatible SKU/unit retention tested; no bundle publishing UI |
| ES08-T33 | Copy/archive | D |
| ES08-T34 | Estimate separation | D / B |
| ES08-T35 | Receiving eligibility | D / H |
| ES08-T36 | Exact cost basis | D |
| ES08-T37 | Line capacity | D |
| ES08-T38 | Precision/units | U / D — Exact native three-decimal constraint; this manifest supports factor-one calculation units only |
| ES08-T39 | Receiving money fields | H |
| ES08-T40 | Target manual edits | U / B |
| ES08-T41 | Contribution ownership | D |
| ES08-T42 | Retained removal | U / D — Dedicated retained-removal/reappearance database proof |
| ES08-T43 | Ordinary estimate save | D |
| ES08-T44 | Adoption transaction | D |
| ES08-T45 | Concurrent adoption | D |
| ES08-T46 | Idempotency | D / H |
| ES08-T47 | Unknown outcome | B |
| ES08-T48 | Permission loss | D / B |
| ES08-T49 | Locked contexts | D — Shared current owner/whole-group Draft checks; existing E2 regression exercises locked-state guard |
| ES08-T50 | Redaction | H — Only sanitized source metadata and authored synthetic AUD 1/2 rates; no raw private source copied |
| ES08-T51 | Snapshot export | H / B |
| ES08-T52 | Freshness/races | B |
| ES08-T53 | Bounds | U / H |
| ES08-T54 | Upgrade/replay | D — Migration 0031; all exact registry consumers updated; cross-0026 estimate upgrade |
| ES08-T55 | Visual evidence | B |
| ES08-T56 | Handover accuracy | R — This handover and pinned evidence manifest; owner acceptance remains separate |
| ES08-T57 | Transport contract | H |
| ES08-T58 | Identity and receipt dispatch | D / H |
| ES08-T59 | Accepted-source authorization | D / H — Exact accepted draft/run/resolved/estimate authorization follows original audit references |
| ES08-T60 | Replay and lock order | D — Original receipt replay precedes current mutable-state gates after current authorization |
| ES08-T61 | Raw incomplete drafts | H / B |
| ES08-T62 | Validation and hashes | U |
| ES08-T63 | Deleted contribution | U / D / B |
| ES08-T64 | Unchanged money/new provenance | D |
| ES08-T65 | Immutable resolved sets | D / H |
| ES08-T66 | Lineage integrity | D |
| ES08-T67 | All estimate writers | D |
| ES08-T68 | Identity/unit override conflict | U |
| ES08-T69 | Source rebase | D — Service integration proves same-alternative rebase and cross-alternative copy; browser dialog authoring is not separately automated |
| ES08-T70 | Synthetic eligibility manifest | H — Server-owned exact fixture/profile/hash; client flags cannot establish eligibility |
| ES08-T71 | Action/state contract | B |
| ES08-T72 | Recovery after reload | B |
| ES08-T73 | Recovery-not-found ambiguity | D |
| ES08-T74 | Downstream quote separation | D — Earlier quote remains pinned; unchanged customer-safe projection excludes specialist internals |
| ES08-T75 | Safe output and cache | H / B — No-store API/export; print re-fetches exact authorized run; existing service-worker network-only API policy reused |
| ES08-T76 | Hand-derived geometry | U |
| ES08-T77 | Rounding boundary pack | U |
| ES08-T78 | Native receiving example | U / D — Authored Appendix E money literals plus real contribution/deletion database and browser flows |
| ES08-T79 | Envelope/security boundaries | U / H |
| ES08-T80 | Date-stable complete fixtures | D / B — Fixtures cover valid/changed/conflict/deletion/rebase/recovery/revocation; historical rate date and relative quote dates |

Evidence files: [unit](../../tests/unit/specialist.test.ts), [database](../../tests/database/specialist.test.ts), [HTTP](../../tests/http/specialist.test.ts), [browser](../../tests/browser/specialist-workbench.spec.ts), [independent design comparator](../../tests/helpers/es08-design.ts).
