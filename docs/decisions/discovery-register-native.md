---
document_id: PPO-ES02-DISCOVERY-REGISTER-NATIVE-DEC
date: 2026-10-20
owner: Dean Fiedler
status: Implementation proposed; owner visual review pending
versioning: git
---

# Discovery register native implementation

Dean requested the accepted ES-02 Discovery register in the running prototype on 20 October 2026, with the register, guide and status in the same pull request. This authorises the page build and the bounded list-read extensions proposed by the [accepted design](discovery-register-figma-design.md); it does not grant native UI acceptance, business approval or deployment. That historical decision remains unchanged.

## Scope and authority

The existing `/estimating/discovery` route becomes a register with a desktop snapshot and phone list. It retains `scope:ES-02`, PPO-010 and EST-01–EST-09 under ADR-0035, the accepted wizard handover, existing capabilities and all parent IDs. Page type: r20 register/worklist with large snapshot. MYOB remains the intended ERP authority; no external integration or business transaction is added.

Source: Figma file **PPO - Design**, named version **Discovery register — Pipedrive pattern, accepted**, live page `1400:345306` and notes `1402:350109`. The build follows the later SYN-PPO-OPP number correction. The [page contract](../design/development/pages/route-estimating-discovery.md) enumerates frames and retained icon-free references. The private file key, links and Pro artwork are excluded.

## Existing data resolves Q2

The current `DiscoveryWorkspace` type and live `ppo.estimating_workspaces` schema record `owner_id`. The register therefore labels the workspace owner **Estimator**, rather than inferring ownership from the latest revision author. Customer is the opportunity organisation. Changed is the workspace's saved `updated_at`.

`listDiscoveryWorkspaces` retains its existing bounded selection of up to 100, ordered by last change, and `workspaceAuthority` / `currentGroup` checks. It projects customer and owner identities, option ordinal and kind, and a selected-option cost summary using the existing authorised `savedOptionCost`. No estimate lines are returned. The read time and existing `estimating.edit` check drive the count context and create action. No migration, capability, grant, dependency or service is added.

D3 counts cover the returned permitted window, not a global total. Views can overlap; archived alternatives count. Readiness comes from the selected current revision. Unavailable cost data cannot imply ready or not costed. The saved estimate always names its own version and basis; an existence check for a basis on the authorised current revision distinguishes whether that revision has ever been costed. Amounts are never summed across alternatives.

## Shared controls and states

Reuse `SecondaryMenuFrame`, the compact phone header, `Button` / `ButtonLink`, `RegisterTable` / `RegisterChip`, `WorklistChoice` / `WorklistPanel`, and `RecordTabs` / `RecordPanel`. Existing icon loading is retained through named mappings in `font-awesome-icons.ts`. Page-local row, snapshot and icon adapters do not create a new shared component API. The shared styles only gain this route as a consumer.

Loading, no results, no workspaces, failed read, denied read, view only and unavailable cost basis are explicit. Failed refresh clears the list and counts. The desktop snapshot focuses on open, returns focus on close and keeps the obscured list inert. Phone rows open the existing wizard directly. The page is online-only under the existing [offline contract](../design/development/systems/offline.md); no local read cache or offline write is added.

## Adaptations and unresolved design

- Bulk selection, toolbar more and column settings have no accepted behaviour. Their placeholders are disabled or informational; no bulk command is invented.
- The existing history read provides revisions for a selected option. Recent activity is labelled **Saved discovery · selected option** and does not manufacture the reference's estimate/alternative events. A combined activity read remains open for Dean.
- The selected-basis facts describe recorded follow-ups, systems and facilities. They do not translate facility IDs into an unsupported count of growing areas or systems needing confirmation.
- Full Revisions-tab layout, denied rows, desktop loading/error, hover and 200% zoom have no separate accepted captures. Shared controls and explicit read states are used; owner review remains pending.
- No phone snapshot is added. The existing shell already provides Conversations, Estimation wizard rail selection and identity-menu guidance.
- Test stories reproduce the synthetic composition without seeding or modifying business records. App data need not match the eight Figma stories.

The open questions are whether to add a combined activity read, and what (if anything) bulk actions and column settings should do. They are not silently adopted as product decisions. [Verification evidence](../testing/evidence/discovery-register-native/README.md) keeps checks, source presence and owner review separate.
