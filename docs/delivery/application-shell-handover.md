---
document_id: PPO-SHELL-HO
title: Application Shell implementation handover
revision: r01
date: 2026-09-17
status: Implementation prepared; PR checks and owner review pending
owner: Dean Fiedler
source_commit: e1b705acc5457dab6fc0b6a2f0c977132cbd2215
---

# Application Shell implementation handover

**Increment:** Integrate Application Shell r17. **Branch:** `feature/application-shell-r17`. The [decision](../decisions/application-shell-integration.md) records scope, exact design bytes and runtime adaptations. This is the shared frame around the existing application, not a replacement static site.

## Delivered

- 76px rail, intact centred 54px logo, bottom More, single-line route breadcrumbs.
- Global search and real permission-aware Quick add, positioned to its right.
- Searchable grouped More with independently fixed title/footer and retained working routes.
- Seven remembered preview workspaces inside the actual account popup; server-derived navigation visibility and truthful planned/denied states.
- Contextual mobile tabs; mobile global search, guide and More utilities. Existing Leads phone exception preserved.
- Page guide information icon and shell journey; concise Quick Help; truthful notification placeholder.
- Shared context invalidation on identity lock without changing existing identity, tenant or record access enforcement.

## Validation record

Pinned tools: Node **24.21.0**, npm **11.19.0**. Locked dependencies installed with `npm ci --ignore-scripts`; repository engine pins, package lock and dependencies unchanged.

| Check | Result |
|---|---|
| TypeScript | Passed, including final rerun. |
| Unit tests | 111 passed, zero failed/skipped. Includes permission-derived navigation, nested route precedence, preference validation and menu discovery. |
| Lint | Passed with no errors or warnings. |
| Production build | Passed. Retains the existing report-template dynamic filesystem tracing warning. |
| Actual-component bundles | CRM and Projects review bundles both built successfully; no browser execution implied. |
| Foundation, prototype and naming | All passed: 78 parent requirements retained; 2,751 links checked; 249 registered documents; copy-ready instructions 7,971 characters. |
| Database and native browser | Not run locally. Existing PR workflows run disposable database, compiled app and component checks. No local visual or interaction pass is claimed. |
| Native visual/device acceptance | Pending. The earlier local browser policy block was not bypassed through another browser or preview surface. |

The updated component assertions cover 1366×768, 1920×1080, 800×500 and 960×540, centred search, 12px Quick add spacing, fixed More frames, searchable Sales destinations, guide context, retained page content and remembered planned selection. The existing late-response identity-lock test remains. Compiled application coverage adds real route navigation via preview, Engineering phone tabs, mobile search dismissal/focus, context-specific guides and shared-record navigation. The disposable database check now also asserts that grant revocation removes the Deals navigation destination.

The original CRM and Projects geometry expectations are updated for the explicitly changed rail and More selection. Existing data, persistence, board scrolling and permission assertions are retained. No timeout, retry, required workflow or business acceptance criterion is relaxed.

## Review and rollout

1. Review PR checks against its final commit, including the six enforced contexts and any additional applicable suites. A component screenshot run is not owner acceptance.
2. Inspect captured desktop/phone layouts; exercise More scrolling, Escape/focus, page guides and actual account controls. Check 200% browser zoom and a real phone separately; a small viewport is not zoom proof.
3. Confirm current working Sales, Estimating, Engineering, Projects, Service, Finance and shared-record pages retain their content and save flows. Confirm a restricted identity gains no access through Preview workspace.
4. Once approved and merged through normal protection, use the existing **Update Azure private demo** workflow for the merged main commit. This PR changes neither that workflow nor Azure configuration. It performs no hosted deployment, migration or reset.
5. After deployment, verify the resulting revision/health, Microsoft sign-in, expected route/content and one labelled synthetic save/reload journey. Record the actual deployed commit and evidence separately.

Notifications, business-page guides/SOPs, planned business modules and full owner acceptance remain receiving work. Rollback of this frame is a normal reviewed application commit/redeploy; there is no schema rollback dependency.
