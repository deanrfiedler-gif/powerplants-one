# Access & readiness native verification

Date: 20 October 2026. Branch: `codex/cs06-access-readiness`. Scope: CS-06. Owner visual review: **pending**. Independent review: **not performed**. No deployment or operational acceptance is asserted.

The [page contract](../../../design/development/pages/route-sites-id-readiness.md) maps every frame in PPO - Design, Access & readiness — accepted. Live metadata, notes, design contexts, variables and screenshots were inspected, including notes `1400:347414` and File index `630:2`. [Icon-free reference captures](../../../reference/ui/site-access/access-readiness-design-r01/README.md) were cross-checked and stay unchanged. No Pro artwork or private file locator is retained here.

## Functional proof

Checks were executed in the dedicated CS-06 worktree on Windows. The full CI run remains a separate result on PR #629; a green documentation check does not establish application acceptance.

| Check | Executed result |
|---|---|
| `npm run studio:check` | Passed: 366 entries and 48 shared components. Corrected the disallowed test-fixture dependency binding and required Desktop/Mobile headings. |
| `npm run lint` / `npm run typecheck` | Passed; affected TypeScript and ESLint checks were repeated after the visual/focus changes. |
| `npm run test:unit` | Initial serial run: 943/951 passed. The register failure and two local operator CLI timeouts were corrected; the CLI's eager Scheduling import is now lazy. Focused reruns passed 16 readiness/CPQ tests and both operator CLI tests. |
| Unmodified `main` comparison | 14/18 focused baseline tests passed. Four failures reproduced without this change: CPQ package execution budget, two document-store path/permission expectations and recovery path expectations on Windows. The additional CPQ exact test passed on baseline and on the changed branch when rerun. This is not a claim that the full local unit run passed. |
| Database | All 12 tests passed in `access-readiness.test.ts`, `customer-location.test.ts` and `field-readiness.test.ts`, using a task-owned disposable PostgreSQL 16 cluster and only `ppo_synthetic_test`. |
| Naming / foundation | Both passed. Status and UI build sequence were regenerated with their scripts. |
| Standard local build | Could not complete: Turbopack rejects the existing dependency junction outside the worktree filesystem root. No dependency or build configuration was changed. CI compiled application retained proof passed at `a981429f`. |
| Native browser | All five tests passed, including the delayed-read regression: desktop, collapsed-rail tablet, 390/320 phone, review, acknowledgement, stale/empty, read-only, denied and failed-read paths. These use synthetic API fixtures and real local shell authentication. See the comparison below. |
| Persisted CS-06 browser journey | Passed after the refresh fix: creates a real preparation, acknowledges the refreshed check, retains the event in History and shows no granted authority. |

The configured local database port was initially unavailable; the same connection refusal occurred on unmodified `main`. A disposable loopback PostgreSQL cluster resolved that limitation. The local visual server used Next's existing Webpack option in an ignored launcher because of the junction limitation. Development compilation required a 30-second assertion budget in an ignored local Playwright config; the committed CI assertion budget is unchanged.

The persisted browser journey also exposed a save/read race: the old check could briefly be selected after a successful save. Further actions now wait for the refreshed record version, and saving a preparation selects its visit basis. A delayed-read browser regression covers that interval. The longer Field/inspection browser journeys were attempted locally; cold development compilation exceeded their budgets. Their complete compiled results remain CI evidence, not a local pass.

New database proofs cover draft isolation, contributor independence, return/publication, stale draft rejection, publication retry, retired IDs, visit binding, schedule invalidation and acknowledgement without authority. Existing Customer/location, Field, equipment and inspection fixtures use independent publication. Browser fixtures exercise accepted view families, exact command payloads, reason retention, keyboard tabs, empty/read-only/denied states. Mock responses prove presentation behaviour, not persistence.

## Visual comparison

The browser spec requests Overview at 1440×1234, tablet at 1024×900, and phones at 390×844 and 320×844. Desktop Requirements uses 1440×1034, evidence review 1440×1159 and acknowledgement 1440×1716. Every tab family is also exercised at each width. Runtime captures stay in ignored test output and CI artifacts; `.ppo-fa` and SVG glyphs are hidden before capture. No licensed glyph artwork is committed.

The builder inspected native Overview at all four widths against the retained/live frames, plus Requirements, Evidence review, acknowledgement, changed-source and no-requirements states. Corrected the redundant phone navigation bar, page title, visit picker placement, tab spacing, row actions, P4 headings and form-first review composition. The 390 px Overview card starts at y=154; the sticky action footer reaches the viewport edge. Browser assertions check no application-wide horizontal overflow, the reachable scrolling tabs, 44 px primary action, keyboard tab navigation and review-form focus/return.

| Reference | Remaining difference and reason |
|---|---|
| Desktop / tablet Overview | The live shell retains its current Sites breadcrumb and permitted Service menu. The facts column uses returned records and a bounded visit picker, not the static story's customer/contact/visit list. Row heights vary with the server's complete blocker explanation and actual evidence count. |
| Requirements | Uses the real active requirement revisions, whole-Site/area group bands and evidence states. Authoring actions use the existing toolbar; on phone the semantic table scrolls locally. |
| Evidence review / acknowledgement | Facts are read only and exact; notes use the existing multiline Field and command-status/recovery controls. Source dates do not imply an unrecorded signed timestamp. Area/activity/revision facts remain explicit even where this makes the form taller. |
| Phone / empty / changed source | Uses the current 56 px compact header. Unknown requirements are distinct from blockers retained in History. The empty state links to requirements and work windows. Changed sources retain the saved check and display the current-source warning; an actual refused acknowledgement preserves its reason. |
| P4 | Four accepted headings remain, explicitly Not available. No historical customer answer, time window, contact or operating rule is fabricated. P4 is omitted from the no-requirements composition as drawn. |

Shared token/radius values remain in use. Undrawn authoring, History, Work windows, loading/error/partial and permission states adapt existing controls. Physical devices, owner visual acceptance and an independent review have not been completed.
