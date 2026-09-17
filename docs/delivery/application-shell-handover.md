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
- Contextual mobile tabs; mobile global search, guide and More utilities. Existing Leads phone exception and CRM phone page-filter header slot preserved.
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

## Initial CI corrections

[Initial component job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169245645/job/105037085746), source `1b8bdbe3`, passed 22 cases, skipped eight desktop-only cases on phone projects, and failed three. Desktop geometry, global search/Quick add and stale-response lock protection passed. Two failures found the existing CRM phone page filter hidden by the new header rules; `548c2c2` restores its established second-row slot. The third found the new preview select lacked an unambiguous label because the wrapping label included option text; the follow-up uses an explicit label/control association. Assertions and timeouts are unchanged. Final-source CI must verify these fixes; earlier passing counts do not certify the correction.

## Retained navigation regression repair

On `4037c881`, [CRM component checks](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169617515/job/105038243544) passed, including the phone filter and workspace-label corrections. The [retained CRM journey](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169617515/job/105038243410) passed 16 I2 cases and failed the shared-brand phone case because its locator still required the predecessor menu title, Powerplants One. The wider [P11 diagnostic replay](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169617489/job/105038243217) also found an outdated generic Service heading assertion and the inadvertently renamed Service review tab.

The repair binds both retained phone-menu cases to r17's visible More title, sets up an authenticated coordinator before checking permitted home-page links, and checks the actual Service planner breadcrumb while retaining the active-tab assertion. The application restores the established Service review tab name independently of the global Service reports destination, and restores Exceptions and recovery in More. This preserves the Service-to-Finance and recovery journeys. No access grant, save behaviour, timeout, retry or assertion is removed. Lint, TypeScript and existing shell unit checks are run before publication; final-source CI must verify the repaired integration.

The completed [compiled desktop/phone run on 4037c881](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169617519/job/105038243304) passed 175 cases and reported 11 failures (three platform-inapplicable skips). Eight failures were the retained navigation issues above. Two more concerned the diagnostic label's new More-footer location; the remaining desktop failure concerned a reload-time storage selector matching both the active page and content outside main. The follow-up opens More to verify the exact diagnostic label, then closes it before the existing scoped-data proof, and binds the storage control to its unique panel inside main. The synthetic-data, permissions, keyboard, save and reload assertions remain. Both new r17 preview journeys passed in that run, but final-source CI remains the verification gate.

PR #222 merged into main as `aa94dcdc` while the repaired browser suites were running. The branch incorporates that existing supplier-pricing design without changing its files; the document-register append conflict retains all four Shell entries and both Supplier Pricing entries. Main and Shell status/index entries are both preserved. Documentation assurance is rerun on the combined branch before publication.

## Azure visual alignment follow-up

Dean reports r17 is deployed and working. The supplied paired screenshots show that the React integration still inherits the old application's typography and uses different panel dimensions, anchors and content. Branch `fix/shell-r17-visual-alignment` corrects the implementation against the retained r17 HTML; the reference file is unchanged.

- Extracts the exact embedded Roboto 400/500/700 WOFF2 assets into `public/brand/shell-roboto-{weight}.woff2`, covered by the existing `public/brand/Roboto-OFL.txt`. The scoped `PPOShellRoboto` family and original SVG geometry apply to the shell only. In particular, global search no longer inherits a bold label's weight.
- Restores 40px search, 16px product heading (14px at the reference breakpoint), 344px utility/More panels, 560px guide, 320px Quick add, reference anchors, close controls, shadows, spacing and fixed footers. Existing phone page filtering remains.
- Restores the authored guide sections, jump controls, journey styling, Quick Help tips/shortcuts, centred disconnected notification state, account profile and preview reset. Names/initials come from the signed-in identity. The accessible native preview select retains its keyboard operation with the reference's closed styling. Live sign-out and local identity controls remain additional runtime content.
- Restores More's 20 resting destinations, including Help, with seven business workspaces. Existing module pages remain discoverable through menu/global search and permitted workspace tabs. Planned and denied destinations remain truthful. The development Foundation checks page is searchable locally, not exposed in the hosted demo.
- Adds permitted page suggestions to global search while retaining live record search, real creation forms, server enforcement, session invalidation and rejection of late responses after sign-out. Runtime copy describes these working features rather than the HTML preview's disconnected controls.
- Replaces the introductory `/` screen with a redirect to the existing authenticated `/work` activity list. [My Work & Action Centre r01](../decisions/my-work-action-centre-design.md) is the appropriate existing HTML design for the eventual landing workspace, but its six views and source-owned workflows are **not** claimed as integrated by this correction.

The native component suite compares actual shell typography and panel geometry with the independent retained HTML at 1536×864 and retains paired screenshots for search, Quick add, help, notifications, guide, account and More. Existing viewport, menu scrolling, permission, identity-lock, focus, save/reload and mobile checks remain. Home/diagnostic assertions follow the new route and Account disclosure location without removing their underlying checks. Local validation passed: lint, TypeScript, all 111 unit tests, production build, actual-component bundle, foundation and naming checks. CI must pass on the final PR source. No workflow timeout, retry, access grant, migration or Azure setting is changed. The earlier local browser policy block is respected; native execution is through the existing CI workflows.

The initial follow-up native component run on `b425c8e6` passed 24 cases (ten desktop-only cases skipped on phone projects) and caught two defects: a more-specific legacy CRM heading rule still reduced the product name to 14px, and Chrome's native Escape action could clear the search field and reopen its panel through `onChange`. The correction explicitly sets the shell product font and prevents that native Escape default while retaining the shared close/focus handler. The final PR run must verify both; the assertions remain unchanged. Additional scoped fixes retain the product heading on compact desktops, prevent legacy account flex wrapping, mark the parent workspace when a child page is open, and avoid a misleading empty-state message when a menu search finds Help.

The corrected component run on `847a9d6f` passed all 26 applicable cases, with ten desktop-only cases skipped on phone projects, including the independent reference comparison. Manual inspection of its paired screenshots found that the legacy `button:hover:not(:disabled)` rule still overrode some shell hover colours. The next scoped CSS correction and reference-based hover assertions cover utility buttons, guide links/jumps and preview reset. Search-result secondary text also uses the reference's line height and spacing. Final-source verification remains the gate.

## Review and rollout

1. Review PR checks against its final commit, including the six enforced contexts and any additional applicable suites. A component screenshot run is not owner acceptance.
2. Inspect captured desktop/phone layouts; exercise More scrolling, Escape/focus, page guides and actual account controls. Check 200% browser zoom and a real phone separately; a small viewport is not zoom proof.
3. Confirm current working Sales, Estimating, Engineering, Projects, Service, Finance and shared-record pages retain their content and save flows. Confirm a restricted identity gains no access through Preview workspace.
4. Once approved and merged through normal protection, use the existing **Update Azure private demo** workflow for the merged main commit. This PR changes neither that workflow nor Azure configuration. It performs no hosted deployment, migration or reset.
5. After deployment, verify the resulting revision/health, Microsoft sign-in, expected route/content and one labelled synthetic save/reload journey. Record the actual deployed commit and evidence separately.

Notifications, business-page guides/SOPs, planned business modules and full owner acceptance remain receiving work. Rollback of this frame is a normal reviewed application commit/redeploy; there is no schema rollback dependency.
