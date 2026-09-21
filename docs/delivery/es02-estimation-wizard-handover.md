---
document_id: PPO-ES02-HANDOVER
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented for synthetic review; final CI and owner acceptance tracked separately
---

# ES-02 Estimation Wizard — implementation handover

Dean requested execution of the [prompt r03](../reference/ui/estimating/PPO-ES-02-Estimation-Wizard-VS-Code-Implementation-Prompt-r03.md)
and [refinement plan r04](../reference/ui/estimating/PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md).
Branch: `feat/es02-estimation-wizard`; clean starting source `0b3669c`, subsequently
fast-forwarded to `origin/main` `8ed8b0c` (identical application tree after #271).
[ADR-0033](../decisions/ADR-0033-es02-structured-discovery.md) records the selected
contract, alternatives and limits. Scope stays ES-02 / PPO-010 / EST-01–EST-09;
all 78 parent requirements and issued source bytes remain unchanged.
Core data commit: `f65d4fb`; native UI commit: `071a864`. The final assurance
commit adds tests, CI routing and the retained evidence manifest.

## Delivered packages

| Package | Implementation |
|---|---|
| W01 | Inspected live PostgreSQL 16.15; chose immutable optional configuration JSON, stable child ownership ledger, explicit schema dispatch, bounded exact reads and existing native command infrastructure. |
| W02 | Native five-step workspace, Alternatives/Revisions, family overview, typed editors, evidence inspector, shared r22 menu/header/summary and one in-memory working proposal. |
| W03 | Strict schema 1 configuration, readiness findings, source review fingerprints, actual native evidence/Activity links, eligible owned unknowns and additive migration 0030. |
| W04 | Fresh/copy alternatives, deterministic allocated child IDs, exact lineage and remapping, immutable paged history, exact saved-source comparison and guarded historical starting points. |
| W05 | Independent permitted saved-cost projection, per-option estimates, explicit comparison cost versions and unchanged manual basis adoption / Draft output paths. Discovery edits do not reprice. |
| W06 | Unit, PostgreSQL, direct HTTP, compiled browser and documentation assurance; native captures, bounds and measured geometry retained. The existing required Estimating CI job now includes structured tests and actual app/database restart proof. CI execution and owner acceptance remain distinct from local checks. |

The route is `/estimating/discovery/[id]`, retaining `#ppo-estimate-wizard` and the
existing create/register/costing/estimate deep links. Main new components are
`estimation-wizard`, `configuration-editor`, `discovery-navigation` and presentation
preferences. Reused components include SecondaryMenuFrame, native fields/dialogs,
RecordTabs, the actual logo, Roboto, and command receipt recovery. Shared edits are
bounded scope selectors and navigation callbacks for shell search/installed Reload.
My Work, Engineering materials and shell regressions remain in the compiled proof.

Incoming handovers: permitted Opportunity/customer/Site, Facility/Asset evidence
and optional existing Activity references. Outgoing handovers: an immutable
Discovery revision, separately reviewed manual costing basis and existing Draft
quotation output. CS-08, ES-03, ES-08, supplier price refresh and automatic delivery
routing remain unavailable. MYOB remains ERP authority, SharePoint business-document
owner and native CAD tools author drawings. No production integration, issue,
approval, customer communication, release, stock reservation or deployment is made.

## Data and authority

The ten r01 questions, work tags, absent-configuration DTO/hash behaviour and prior
Complete cost bases remain unchanged. Optional `configuration` uses
`PPO-ES02-CONFIG-r01` / schema 1; unknown versions and explicit null fail safely.
Confirmation tokens are separate from question IDs and bind current exact context.
Migration 0030 adds immutable child identity ownership and exact lineage checks;
there is no new grant, seed, dependency or identity-table ALTER. All migration
registry assertions and the reviewed hosted-demo migration gate advance to 30;
seed/grant/user expectations stay unchanged.

New workspace reads: `summary`, `history`, `cost-versions`, `evidence`; read-only POST
`compare` selects two exact revisions and optional exact cost versions. Each route
rechecks current/historical authority; source denial is non-disclosing. History
pages contain at most 20 items plus one authority-checked lookahead. Counts use one
ACL aggregate, with inaccessible histories withheld. Candidate lookups expose a
100-row page and explicit truncation/search; permitted selected references can be
hydrated outside that page without increasing the ten-Facility saved limit.

`CopyDiscovery` still refuses an edited body. An allocation UUID deterministically
remaps every child and membership, with exact source lineage. It copies no money,
quote or Activity and downgrades confirmations. Optional initial `option_label`
supports the specified fixture; omission preserves legacy A and canonical commands.
Actual equipment external references are presentation labels, not replacement IDs.

Navigation within a viewed alternative retains edits, filters and selected editors.
Record departures offer Stay / Save revision then continue / explicit Discard;
unknown outcomes reconcile the original operation. Chrome's same-document history
uses this review, and cross-document departure uses its native unsaved-work warning.
No business draft is written to browser storage. Other browser families and recovery
after closing a tab are not claimed by this proof.

## Evidence and verification

[Retained evidence](../testing/evidence/es02-native-r01/README.md) identifies local
runs, source fingerprints, snapshots, failed checkpoints and the current CI route.
Node 24.21.0 / npm 11.19.0 / PostgreSQL 16.15 / Chrome 153.0.8010.53 on Windows.
Local application proofs use a compiled build on owned loopback port 3012 and only
`ppo_synthetic_test`. Native page captures cover 1920, 1440, 1280, 1024, 768, 390
and 320 CSS px, including archived/read-only costs and maximum supported area/system
cardinalities. No outer horizontal overflow was observed in these cases.

The exact source HTML and r22 board are loaded independently by the design helper.
Their hashes, measured tokens and geometry are recorded. Search/quick-add centre
stays within 2 CSS px at 1920/1440/1280 with menu expanded/collapsed and summary
open/closed. More's right edge aligns at 316 px within 1 px without reflow; collapsed
menu width is 24 px and hover alone does not expand it. Owner visual and broader
accessibility acceptance are pending; the generated mockup image was not supplied.
No new accepted UI baseline is registered.

Maximum-cardinality fixture: 20 areas, 40 systems, 40 typed facts. One local sample
used a 44,066-byte complete create envelope. Per-entity ceilings are 20 areas,
40 systems, 160 facts, 120 evidence entries, 80 responsibilities and 160 follow-ups;
the complete canonical UTF-8 envelope still must fit 65,536 bytes. Independent
maxima cannot all be combined. Unit proofs accept exactly 65,536 and reject 65,537
bytes for both Discovery and costing. Native API rejects the oversized multibyte
fixture without truncation. Timings and request/response counts are retained as
observations, not a production SLA.

Local full-unit runs have four Windows/path failures reproduced on unchanged
`origin/main` `8ed8b0c`: two document-store cases, private recovery path semantics
and the slash-sensitive warm-route inventory. These are not attributed to ES-02.
Focused new unit tests, exact source/cost/receipt regression, direct HTTP and native
browser cases pass as recorded in the evidence ledger. Forward-upgrade and repeated
seed tests include legacy estimates and receipts. The restart extension additionally
checks structured r01/r02/r03, fresh/copied options, Estimate v04 on r02 and original
HTML/PDF bytes through separate application and PostgreSQL processes.

Automatic approval review blocked the isolated local PostgreSQL creation/restart
command with “blocked by policy” and no further reason. No shared PostgreSQL service
was restarted. Actual database restart execution is assigned to the existing CI
job's disposable container; do not treat authored restart code as a local pass.

## Acceptance disposition

The following links are the executable evidence index, not business acceptance.
U = [configuration units](../../tests/unit/estimating-configuration.test.ts);
D = [configuration database tests](../../tests/database/estimating-configuration.test.ts);
L = [legacy/workspace database regression](../../tests/database/estimating-workspaces.test.ts)
and [estimating regression](../../tests/database/estimating.test.ts);
C = [context/authority database tests](../../tests/database/estimating-discovery-context.test.ts);
H = [direct HTTP tests](../../tests/http/estimating-configuration.test.ts);
B = [native wizard browser proof](../../tests/browser/estimating-wizard.spec.ts);
J = [discovery journeys](../../tests/browser/estimating-discovery.spec.ts);
K = [cost-basis journey](../../tests/browser/estimating-cost-basis.spec.ts);
R = [real restart harness](../../scripts/estimating-restart-proof.ts), CI execution required.

| Acceptance | Evidence and disposition |
|---|---|
| ES02-T01 | J, K, H — native create/register/workspace/cost/output routes and context. |
| ES02-T02 | B — one shell and breadcrumb; retained native captures. |
| ES02-T03 | B design helper — measured ≤2 CSS px across 12 desktop compositions. |
| ES02-T04 | B — 240/24 menu contract, hover refusal and keyboard expansion. |
| ES02-T05 | B — right edge 316 ±1 CSS px; unchanged workspace geometry. |
| ES02-T06 | B — contained tables at seven widths; readable detailed differences. |
| ES02-T07 | B — visibility, reorder and keyboard width survive reload; parser rejects stale preference keys/widths. |
| ES02-T08 | B, J — step/tab presentation, guarded alternative viewing, explicit selection. |
| ES02-T09 | L, C, H — canonical identities, context and current owner authority. |
| ES02-T10 | L — immutable ten-question definition, activation and readiness regression. |
| ES02-T11 | L, U — source states, NoneDeclared, blank/zero and assumptions remain distinct. |
| ES02-T12 | J, L — retained hidden answers and copy reactivation/reconfirmation. |
| ES02-T13 | D, B — stable multi-area native scope and one-Site evidence. |
| ES02-T14 | U, D — unique systems and explicit coverage memberships; no cost duplication. |
| ES02-T15 | D — 101 Facility fixture: bounded candidates, retained selected ID and scoped search. |
| ES02-T16 | U, D — collection, option, saved-reference and complete-envelope bounds. |
| ES02-T17 | U, B — requirement/capability/model roles and explicit units. |
| ES02-T18 | D, L — owned unknowns and separate follow-up records; no implicit Activity command. |
| ES02-T19 | B — actual Not configured routing and unavailable integrations. |
| ES02-T20 | D, J — atomic first workspace/A/r01/selection and valid incomplete save. |
| ES02-T21 | D, J — independent fresh/copy alternatives, exact provenance and no copied costing. |
| ES02-T22 | L, J — selected archive refusal, cap, reopen and whole-group guards. |
| ES02-T23 | D, H, B — exact sources, explicit uncosted state and denied reads. |
| ES02-T24 | U, D, B — self-empty and stable-ID/lineage comparisons, readable before/after. |
| ES02-T25 | D — 23 revisions page as 20 + 3; immutable legacy reads remain explicit. |
| ES02-T26 | C, D, J — changed context/source versions and required acknowledgments. |
| ES02-T27 | L, C, J — stale expectations refuse and retain the working proposal. |
| ES02-T28 | D, L, J — original operation replay/conflict and lost-response reconciliation. |
| ES02-T29 | C, D, H, L — current/historical authority on reads, compare, receipt and quote recovery. |
| ES02-T30 | L, K — existing selected/Active/Complete/owner/Draft adoption guards retained. |
| ES02-T31 | D, K, B — per-option saved versions keep their exact historical basis. |
| ES02-T32 | L and existing arithmetic units — unchanged decimal arithmetic; Pricing uses shared calculate. |
| ES02-T33 | D, B — exact saved totals; comparison never aggregates alternatives into a forecast. |
| ES02-T34 | K, B — independent manual prices and unavailable source integrations. |
| ES02-T35 | L, C — quote-safe permission without internal costs; denied sources remain denied. |
| ES02-T36 | L, H and existing HTTP — exact saved cost output and immutable prior files; R extends this across restart. |
| ES02-T37 | L — concurrent saves/selection/archive/first costing under aggregate locks. |
| ES02-T38 | D, L — direct invalid IDs/history mutation refused and atomic rollback. |
| ES02-T39 | D, L — forward upgrade/reseed preserves old hashes, DTOs, receipts and exact output. |
| ES02-T40 | B — reload; R — separate app/database restart execution tracked in required CI. |
| ES02-T41 | B, J — desktop/tablet/phone/320 captures, reachable controls and local scroll. |
| ES02-T42 | B, J — labels, keyboard menu/columns, focus return, modal Escape and textual statuses; owner accessibility acceptance pending. |
| ES02-T43 | B, J — bound resource paths/preview signatures and uncertain outcomes; no false acknowledged revision. |
| ES02-T44 | Compiled suite — My Work, Engineering desktop/phone and shell consumers pass. |
| ES02-T45 | B — four families, separate infrastructure, neutral counts, filter and Add controls. |
| ES02-T46 | U, B — 4 unique systems/2 growing areas/3 locations; filtered counts remain global. |
| ES02-T47 | U, B — growing/ancillary distinction and explicit All areas coverage. |
| ES02-T48 | B — filtering clears the editor and retains unsaved system edits; one shared draft. |
| ES02-T49 | U, D, B — typed editors, coverage, native references and read-only inspection. |
| ES02-T50 | C, D, B — separate evidence/equipment targets and retained proposal; denied evidence is rechecked. |
| ES02-T51 | U, B — required 8 zones distinct from unknown capacity; 2 findings without false global readiness. |
| ES02-T52 | B — real Northbank A r01–r03, B/C and saved v04/r02 AUD 58,400 before/after save. |
| ES02-T53 | B design helper/captures — native labels, actual logo/Roboto, navy actions and one marker. |
| ES02-T54 | J, B — no navigation revision; acknowledgment/reconciliation controls saved state. |
| ES02-T55 | B and path-bound resource reads — viewed identity owns summary; B has no saved amount. |
| ES02-T56 | U, D, L — extension dispatch/readiness and legacy hashes/bases preserved. |
| ES02-T57 | D — edit permission revoked but saved-cost read allowed; B — archived/unselected/incomplete read-only summary. |
| ES02-T58 | B, J — editors remain mounted; dirty Stay/Save/Discard and identity loss journeys. |
| ES02-T59 | B — held old preview cannot override a newer invalid numeric draft; saved costs unchanged. |
| ES02-T60 | U, D — separate families/work tags and versioned evidence/follow-up fields. |
| ES02-T61 | U, D — independent copied IDs, exact lineage and no false copied membership differences. |
| ES02-T62 | D, H — real counts and bounded permitted history/comparison; no revision allocation. |
| ES02-T63 | U, B, J — save-blocking versus readiness findings and explicit costing holds. |
| ES02-T64 | B plus boundary script — payload/request/timing manifest and native maximum/read-only/dirty captures. |
| ES02-T65 | B — same-document Back/Forward, native cross-document warning, shell router, breadcrumb, selectors and installed Reload. |
| ES02-T66 | U, D — explicit membership does not expand when a new area is added; invalid coverage fails. |
| ES02-T67 | U, D — no edited CopyDiscovery body, stable allocated graph, original replay. |
| ES02-T68 | U, D, L — separate tokens, source/value/unit binding, future schema refusal and captured compiler paths. |
| ES02-T69 | U and boundary script — exact whole Discovery/costing UTF-8 byte edges and distinct lookup/reference limits. |
| ES02-T70 | J — initially blank proposal saves only after explicit work/scope/owned unknown entries. |

## Review and remaining work

Review the draft PR and its exact required CI run, including restarted PostgreSQL
and hosted-demo upgrade gates. A failing checkpoint is not completion; retain it
and correct or reproduce it against main. Owner review should accept or request
changes to native visual/accessibility behaviour and business policy separately.
The next domain integrations (survey, source pricing and calculators) remain
separate scoped work. This branch does not merge or deploy itself.
