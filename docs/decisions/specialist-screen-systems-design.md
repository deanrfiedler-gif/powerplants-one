---
document_id: PPO-ES08-WORKSPACE-DES
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; specialist acceptance and application integration separate
source_commit: 0602db2b82013b5869b41bd1b88c623a9bc81f6b
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

Five views, every implemented field, logical evidence ownership, receiving references, recovery and walkthrough are documented in the report. Twenty-five model groups pass. Native execution and visual review will be recorded before final delivery. Owner design acceptance, approved mathematical outcomes and application integration remain separate.
