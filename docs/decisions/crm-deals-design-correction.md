# Deals design correction and Sales routes

**Scope:** PPO-009 / CR-01, the existing opportunity worklist and saved workflows. **Authority:** Dean supplied the expected/live screenshots, Deals r38 and Theme r22, specified Sales URLs, and authorised applying the fixes to the live app. Prepared on `fix/sales-deals-design-conformance`, restored against main `39daaf5` on 18 September 2026 after workspace maintenance removed the earlier uncommitted checkout.

## Cause and correction

The first integration retained a 42px Sales navigation strip and introduced a 16px margin, border and rounded module frame. The labelled pipeline select inflated its toolbar; legacy CSS altered cards and controls. Menus had 8px corners and the 650px snapshot was modal. Earlier tests verified the implementation without comparing the issued design. The requested Sales route was unavailable.

The Deals module now declares `#ppo-deals` and `data-module-layout="full-bleed"`. The shell supplies the viewport once; two toolbar rows lead directly into one scrolling board. The additional Sales strip is omitted on this worklist. Leads remains discoverable through workspace navigation/search and View options. Other modules retain their existing composition until explicitly adopted.

Card dimensions use r38's final rem-based cascade. Stage headers show monetary totals and deal counts, with header menus. Unknown values remain distinct from zero and totals describe the permitted result page. Pipeline and Sort use keyboard-operable, viewport-bounded r22 choice cards. Snapshots are modeless, square, right-docked at 448px (480px on wide screens); mobile inspection fills the width. Filters and editing use top-centred full-height forms with scrollable bodies. Short decisions remain modal with 10px corners. Saved permissions, stage evidence, ownership, uncertainty and undo retain their existing authority.

## Sources and adaptations

| Area | Authority or explicit adaptation |
|---|---|
| Host composition | Dean's expected screenshot. Omit standalone demo host padding/frame when embedding the module. |
| Module design | [Deals r38](../reference/ui/crm/ppo-deal-pipeline_r38.html), SHA-256 `eb16502a8cb6cb235a4abbc5ed56e836eaa31d7d2ecba81e594c66a37b1a3b65`, unchanged. |
| Shared controls | [Theme r22](../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html), SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`, unchanged. Its 14px choice cards and 7px rows supersede the older module menu corners. |
| Global shell | Retain accepted application shell r17; older shell examples embedded in the theme are not a supersession. |
| Page type | Register/worklist with persistent inspection. Board, List, Forecast and closed-outcome Archive share permitted records. |
| Incoming/outgoing | Existing scoped, versioned opportunity/activity reads and commands. The Won handover obligation remains separate from delivery release and ERP conversion. |
| Search | Desktop opportunity search is in Filters; compact search stays in the shared header. Global search remains independent. |
| Functional adaptations | Card shortcuts open the implemented activities, documents, stage and edit workflows. Separate Tasks, outbound email, deletion, probabilities and manual archive remain unavailable; illustrated controls do not manufacture operations. |
| Synthetic content | Do not replace live records with the design's illustrative population. Independent geometry checks and paired screenshots distinguish data differences from layout differences. |

## Page routes

| Previous | Canonical |
|---|---|
| `/crm/opportunities` | `/sales/opportunities` |
| `/crm/opportunities/new` | `/sales/opportunities/new` |
| `/crm/opportunities/:id` | `/sales/opportunities/:id` |
| `/crm/leads` | `/sales/leads` |
| `/crm/leads/:id` | `/sales/leads/:id` |

Permanent redirects preserve path segments and query strings. Navigation, Quick add, global search results, related-record links and the successful sign-in landing now use Sales. APIs, database names and permission identities remain `crm`; no data migration is involved. The existing fixed post-sign-in destination remains deliberate; caller-supplied return URLs are not trusted.

## Required design checks

The [baseline register](../standards/ui-baselines.json) records this integration separately from older token-only baselines, and must match the runtime [host registry](../../src/shell/module-workspaces.ts). New integrations declare route, scope, layout/scroll owners, retained source hashes, shared edition, adaptations, component proof and compiled-app proof.

Component previews read the complete root application CSS import order. Required tests load the retained r38 and r22 files independently, compare card measurements, fonts and choice-card geometry, assert the shell boundary and capture source/application screenshots at 1920, 1440, 1280, 1024, 820, 390 and 320 CSS pixels. Negative controls restore the old outer margin and incorrect menu radius and must fail. The required compiled browser suite also checks Sales redirects, full-shell geometry, menus and reloads. Existing persistence, permissions, keyboard and recovery suites continue to run.

Paired full-page screenshots contain different synthetic record content and are review evidence, not an exact whole-page pixel-diff claim. Viewport coverage does not by itself establish physical-device or native browser-zoom acceptance. The cloud browser rejected local file previews; CI captures provide predeployment visual evidence and the signed-in live app remains the postdeployment target.

## Release status

The [PR #239 verification repair](../testing/pr-239-ci-repair.md) records the failed route/control checks, compact reference comparison, visible-header measurement and denied-search timing correction. Required CI results remain tied to the current PR head.

Code checkpoint is published. Local lint, type checks, all 115 unit tests, production build and documentation checks pass. Required CI verification, screenshot review, final merge and Azure revision are pending. Do not describe the live app as corrected until the deployed revision has been inspected.

Use the existing **Update Azure private demo** workflow from protected main after required checks and compatibility review. This change introduces no migrations, reset, tester reconciliation, infrastructure or outbound integration. Verify the source/image revision, health and anonymous-access refusal, then inspect the authenticated Sales worklist and old-link redirects with Dean's authorised personal Microsoft account.
