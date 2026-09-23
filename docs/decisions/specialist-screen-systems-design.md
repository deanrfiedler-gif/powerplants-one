---
document_id: PPO-ES08-WORKSPACE-DES
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; specialist acceptance and application integration separate
source_commit: 0602db2b82013b5869b41bd1b88c623a9bc81f6b
versioning: git
---

# Specialist Configuration Workbench — design and receiving handover

Dean requested **ES-08 Specialist configuration workbench**, starting with the agreed **Screen Systems** family. Delivery continues the r20 standalone HTML and detailed Markdown report pattern.

Open the [r01 HTML](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r01.html), [detailed report](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Report-r01.md) and [verification evidence](../testing/evidence/specialist-r01/README.md).

## Scope and evidence decision

BP-04 section 8, G06, CRE-13–CRE-17 and E5 require executable definitions, ranges, units, rounding, parts mappings and accepted examples before implementing a Screen Systems engine. The reviewed v05 catalogue does not provide that pack. The design therefore records those gaps and uses two authored reference fixtures, not inferred engineering formulae, to demonstrate inputs, parts, overrides, reconciliation and recovery.

Retractable Shade is illustrated. Blackout and Replacement are visible variants without generated outputs. Other families remain unavailable pending separate definitions. Arbitrary engineering changes suppress outputs. Live arithmetic is limited to illustrative E1-style decimal price extension and explicit direct reference quantity overrides.

The work stays within EST-06 / E5 and traces to EA-16/17, AT-04/28, G06 and D-009. It does not add a sequence or close full acceptance, issue #10 or the evidence gap. Issued source snapshots remain unchanged.

## Architecture and receiving boundaries

The established self-contained HTML, embedded r20 fonts, plain CSS/JavaScript, deterministic Python assembler and pinned native browser checks are reused. This keeps the design reviewable without a new application framework or service. An application route, database or deployed calculator needs validated definitions and a separately scoped integration contract.

All customer, facility, estimate, part, price and run examples are authored synthetic fixtures. Private source documents are not copied to the public repository. No application estimate write, quote, asset, purchase request, financial transaction or external business-document upload occurs.

Rerun uses stable rule identities, preserves generated baselines, requires manual/removal decisions and retains unmatched edits pending disposition. Cancel leaves staged lines intact. A lost response recovers its receipt; stale totals are repaired from saved lines without regeneration. An earlier issued illustration remains immutable.

Current permissions, scope and locks are local scenarios. Future services must enforce current grants and exact preview/record/definition versions. MYOB, SharePoint and native engineering authoring remain intended authorities.

## Delivery status

Five views, every implemented field, logical evidence ownership, receiving references, recovery and walkthrough are documented in the report. 27 model groups and 23 native Chrome groups pass. Fourteen original desktop/phone captures were reviewed; focused lint, deterministic assembly and documentation checks pass. Verified source 0c5e60868b6651e9eee55742fa04bb722cbf894a, [run 35048234854](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35048234854), HTML SHA-256 52c59d94b8a743eb6e521917c3db88564e3aaaaaea5f2f29959f40a4deae5639. Published for review in [draft PR #210](https://github.com/deanrfiedler-gif/powerplants-one/pull/210). Owner design acceptance, approved mathematical outcomes and application integration remain separate.

## r02 source audit and refinement

Dean supplied a normalized historical screen estimator workbook and an explanatory Word report and requested an audit and standout refinement. [r02 HTML](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r02.html) and the [r02 report](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Report-r02.md) are the current review targets; r01 remains unchanged.

Executable source expressions are now available, so r01's blanket absence statement is historical. A bounded recovered quantity port replaces the fixed A/B-only behaviour. Six views provide 61 primary controls, five additional-screen slots, live geometry and numeric working, all 143 source positions, 14 manual quantities, six explicit line gates, a recovered-policy price illustration, comparison and immutable review runs. The complete 478-field inventory and 26 source/audit findings are searchable.

The saved workbook differs from its report: 142 reconciliation Match cells and one #VALUE!, plus 3,106 formula-display #NAME? caches. Private parity execution matches 141 of 143 saved quantities; two quote-specific additions are outside the public example. Those matches include zero positions and manual values. Cached-price arithmetic independently matches the historical bridge. Ten prior changed-input scenarios supply 13 matching numeric outputs; these do not validate every branch.

Raw operational source files and historical quote values stay outside the public repository. All displayed customer context, manual allowances and rates are synthetic. Approved engineering ranges, parts/units/MYOB mappings, motor capacity and full branch examples remain open. Per-line exclusions are a disclosed proposed correction to inconsistent legacy gating. Historical unrounded pricing remains separate from E1's money contract.

The existing plain JavaScript/CSS, self-contained HTML and native Chrome verification approach is retained: no new dependency, route, database, external write or deployment. G06 formula evidence is received but not accepted as a complete approved definition pack; EST-06/E5 and all existing parent/acceptance identities remain unchanged.

See [r02 verification](../testing/evidence/specialist-r02/README.md) for exact source, hashes, checks and visual review. Publication continues [draft PR #210](https://github.com/deanrfiedler-gif/powerplants-one/pull/210).
