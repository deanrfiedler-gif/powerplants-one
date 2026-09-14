---
document_id: PPO-010-E2-SCREENS-HO
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Saved screens and process proof implemented; exact-source runtime verification pending
source_commit: 9976b44721a5db0d3ff2b8a38966675513e5274f
---

# E2 saved discovery screens and recovery handover

This contribution follows the API/migration in [#169](https://github.com/deanrfiedler-gif/powerplants-one/pull/169), the definition/context foundation [#168](https://github.com/deanrfiedler-gif/powerplants-one/pull/168), [ADR-0026](../decisions/ADR-0026-e2-option-persistence.md) and [issue #167](https://github.com/deanrfiedler-gif/powerplants-one/issues/167). The adopted E2-D02/D03, DR-02, EST-01–EST-09 and receiving contract boundaries remain unchanged. This stacked contribution must reach actual main after its dependencies; merging into the API feature branch does not establish delivery.

## Implemented journey

`/estimating/discovery` lists current permitted workspaces. The new-workspace page starts from an existing opportunity and creates selected option A only after a current-context preview and explicit acknowledgements. Detail screens show the selected basis, alternatives, Active/Archived state, current scope readiness, immutable revisions, exact predecessor history, source attribution and retained hidden answers. Original manual workbooks and draft-file recovery remain linked for LegacyManual revisions.

The scoped form-options read exposes only currently permitted related Sites, same-selected-Site Facilities/equipment, and eligible follow-up owners. It returns at most the first 100 candidate Sites, Facilities and equipment, explicitly reports truncation, and preserves an explicitly permitted selected Site outside that page. The aggregate still accepts at most ten Facilities, 100 equipment and ten options; candidate pages do not grant authority. Preview and save recheck every selected reference independently. No-site and unknown-site modes return no Facility/equipment candidates. A selected equipment reference preserves recorded identity/lifecycle uncertainty and does not verify technical configuration.

The immutable definition and pure visibility predicate are shared with the server; the browser cannot publish or replace definitions. Forms record scope membership, work-system Facility subsets, Full/Express or owned unknown effort, active typed answers, sources and owned follow-ups. Incomplete but attributed discovery remains saveable. Changed and reactivated Confirmed answers require explicit acknowledgements in the exact comparison. Saved hidden answers reappear as proposals when their system becomes active; their previous attribution is not silently reconfirmed.

Fresh alternatives start without prior answers; copied alternatives use the server's exact saved source and downgrade confirmations. Both remain unselected. Selection, archive and reopen have separate reasoned commands; reopening remains unselected. Whole-group Draft and current-owner holds apply. Scope changes do not import costing, update a CRM forecast or regenerate a quotation. Delivery routing remains Not configured, and the screen explicitly says manual costing import is unavailable.

The existing command hook retains each uncertain original operation. It freezes other local mutations and offers receipt reconciliation with the original request. The new-opportunity selector remains frozen while its creation outcome is uncertain; refreshing the candidate list after an accepted lost response cannot unmount that original. A stale successor retains its draft until explicit comparison against the current predecessor. Identity changes unmount business content through the existing session boundary; denied refreshes clear restricted content. Ordinary transient refresh errors retain the local proposal.

## Verification and review boundary

On maintained Node 24.21.0/npm 11.19.0, full lint, TypeScript, all 103 unit cases and the compiled application build passed locally. The immutable definition content/hash remains covered by the retained compiler tests. This environment has no usable PostgreSQL/controlled browser runtime; static results are not evidence of saved-browser, migration or restart execution.

Four browser cases are authored for both existing desktop and mobile projects: complete scoped creation/reload with explicit confirmation and lost-response candidate refresh; competing saved predecessor with retained proposal and original successor reconciliation; hide/reactivate/copy/select/archive/reopen; and identity clearing with keyboard controls at 320px. A scoped HTTP case checks candidate metadata, no-site lists, unrelated company/Site and malformed query refusal without advancing the workspace. These run under existing unmodified workflow/test globs; their results remain pending at this source checkpoint.

The retained E1 restart harness now invokes a separate E2 scenario alongside its unchanged schema-1/schema-2 original-output assertions. It records three exact E2 revisions, selected B/archived A, five original operation receipts, no generated Estimate, and independent application PIDs/PostgreSQL postmaster start times over write/recover/verify. After each real process restart it reads exact history, looks up and replays the original accepted commands, including originals for archived A. It captures the actual saved UI. A pool close is not used as evidence of a PostgreSQL process restart. Workflow definitions, timeouts and original gates are unchanged.

Browser screenshots and restart evidence include source head, executed checkout/tree, run/attempt, viewport, byte count and SHA-256. Exact-source CI, inspection of original captures/diagnostics, normal integration and actual-main verification are still required. Physical device, screen-reader, owner acceptance and the complete E2 acceptance catalogue are separate from these bounded cases.

## Next receiving step

The append-only manual-estimate basis and selected-Site/output contract in ADR-0026 remains the next implementation boundary. Existing one-Estimate-per-Opportunity and fixed-Site constraints are preserved until that receiving change is designed and verified as a whole. DR-03–DR-06, five container propositions and E3/E4 pricing/source/approval/terms policy remain unresolved; this UI adds none of them.
