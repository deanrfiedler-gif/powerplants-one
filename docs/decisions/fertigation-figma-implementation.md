---
document_id: PPO-FERT-FIGMA-IMPLEMENTATION
date: 2026-10-13
owner: Dean Fiedler
status: Implementation in review; owner visual acceptance and deployment recorded separately
versioning: git
---

# Priva Fertigation Workbench — Figma implementation

On 13 October Dean requested implementation of the Priva Fertigation Workbench in the live PPO application, matching the supplied Figma page. This request authorises application implementation and supersedes the earlier design-only boundary in the [design decision](fertigation-figma-design.md). The accepted page `408:4`, its named frames and retained icon-free captures remain the appearance reference. The existing native engine and exact saved scope remain the content authority.

## Scope and conformance

The existing `ppo-fertigation` workspace and `/estimating/fertigation/[id]` route retain EST-02, EST-03 and EST-06. The r20 page type is a **record workspace**, with subordinate registers and evidence/review regions. The primary and secondary menus use the accepted Shell v2 composition for this detail route. Saved primary-rail preferences take precedence over its expanded initial presentation. No external record is renamed.

Incoming handover: authorised Discovery alternative, exact source revision and captured site/customer context. Outgoing handovers: exact JSON/valve CSV export, saved customer report, recorded technical review and controlled Discovery scoping handover. Existing API, idempotency, permission, stale revision and recovery contracts remain authoritative.

Reused components: `ApplicationFrame`, `ProductNavigation`, `RecordIdentity`, `SecondaryMenuFrame`, `RecordTabs`, `RegisterTable`, `WorklistMenu`, the existing fertigation presentation kit, dialogs, charts and command/resource hooks. The phone section sheet is a native modal bound to the same nine-view navigation and severity counts. No new framework, dependency, service, calculation, migration, seed or capability is selected; ADR-0038, ADR-0050, ADR-0051 and ADR-0053 continue to apply.

## Implemented presentation

- Record title/status, History and Save revision, with secondary actions in the record menu; reference, state, binding and saved time on the meta line.
- Scope-register breadcrumb, expanded 240 px primary rail by default, flush 240 px secondary menu, pastel count badges and no empty-view check except Scope review.
- Overview next actions first, outputs/declarations side by side, then metrics and engineering evidence. Headings sit outside cards.
- Compact filtered registers with selected-tab counts, label-to-edit and fixed right-hand action menus. The phone valve list exposes phase, allocation, flow and master.
- Pastel chart fills with dark outlines, named candidate failures, aligned chart scales, Shortlisted status with an explicit removal action, full-width review metrics and centred History.
- Phone section sheet, compact record context, two-column metrics and Report/Save above the icon-only navigation with More current.

Integration with main `ad9f2eb` adopts the shared Shell v2 rollout from PR #459. The module reuses its primary rail, initial expanded preference and phone navigation; only the fertigation header, secondary menu and record interior have scoped styling. Discovery retains its content-width threshold for a docked menu, so its entry test also exercises the desktop drawer trigger. Controls remain conditional on real permissions and state; the reference sample does not create business authority. The original design's Q8 system SVG export and device-to-channel allocation remain open. r02 engine proposals remain outside the r01 implementation. Font Awesome Pro artwork and private Figma URLs are not committed.

## Evidence and review

[Execution evidence](../testing/evidence/fertigation-figma/README.md) records actual checks and limits. The live design register, component host and draft guide identify the new composition without granting an accepted visual fingerprint. Code delivery, automated proof, owner visual acceptance and hosted deployment remain separate facts.
