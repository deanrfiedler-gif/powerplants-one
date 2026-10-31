# Sales briefs queue — implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. PR [#702](https://github.com/deanrfiedler-gif/powerplants-one/pull/702). Functional proof and visual inspection are recorded below; owner acceptance, independent exact-head review, merge and deployment remain separate.

## Scope and provenance

CR-02 receiving queue at `/estimating/intake`, navigation ID `intake`, label Sales briefs. [Page contract](../../../design/development/pages/route-estimating-intake.md). The 25 October work is retained in preservation commit `25590474e87b10d872742b20105601ff28e26b05`; current main was merged before continuation. No migration, capability, seed, grant, dependency, live adapter or Discovery creation is added.

The accepted Figma version and nodes were inspected during the original work. Current implementation comparison uses the [retained five icon-free design captures](../../../reference/ui/estimating/sales-briefs-design-r01/README.md) and adopted shell/phone amendments. No private file link/key or Font Awesome Pro artwork is retained. Application captures use repository fallback SVGs and synthetic fixtures, with the Kit unset.

## Functional proof

Validation used Node 24.22.2, npm 11.19.0, PostgreSQL 16 and Chrome 156.0.8078.80 / Playwright 1.64.1. `npm ci --no-audit --no-fund` passed on the repository pin; no engine override was used. Runtime configuration stayed outside the repository. The task-owned preview used `PPO_PORT=3037`, and database suites used only a disposable `ppo_synthetic_test` on the task's own local PostgreSQL server.

| Check | Result |
|---|---|
| Queue, navigation, module workspace, shared-style and component-binding unit tests | 30 passed |
| `tests/database/sales-briefs.test.ts` | 1 native journey passed: clarification/resolve, source drift, draft successor, receiver/company scope, counts/paging, stale basis and revoked snapshot/export |
| Selected native tests in `sales-estimating-binding.test.ts` and `sales-workflows.test.ts` | 6 passed: exact acceptance binding/original recovery after successors; stale source/workspace and wrong Deal/receiver; revoked LC-13 reads/replay; full CR-02 clarification cycle; stale/source-changing drafts; current workspace/company/site/history/receipt authority |
| `tests/browser/sales-briefs.spec.ts` | 8 passed; 6 intentional desktop/phone project skips. Fixture-driven UI: exact snapshots, clarification/evidence, selection/CSV, oldest-update sequence, filters, full counts and paging, stale/partial/denied/failed/loading/empty recovery, keyboard and 320 px |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` | Passed |
| `npm run lint` | Passed |
| `npm run studio:check` | Passed; review records remain pending, not accepted |
| `python3 scripts/check_foundation.py` | Passed, including final evidence links |
| `python3 scripts/check_naming.py` | Passed |
| `python3 scripts/build_status.py --check` | Passed |
| `tests/http/sales-briefs.test.ts` | 1 native HTTP journey passed: receiver scope and hidden/missing equivalence, full counts/paging, exact snapshot/CSV, stale basis, clarification/resolve/accept and draft successor |
| `npm run build` | Passed on the final application source |
| Native browser journeys (targeted runs) | All 13 applicable cases passed across focused runs; 1 deliberate phone-navigation skip. Includes both viewport projects for clarification/acceptance, Won receiving, exact historical submissions and draft successors, LC-13 creation/recovery, and navigation. This is not a claim that the earlier broad batch passed. |

Commands used the existing test runner with `--test-concurrency=1`; the selected native database pattern was `LC-13 exact acceptance|LC-13 stale source|LC-13 revoked native|CR02 draft/submission|CR02/03 source drift|Sales detail, queues`. Browser runs used a task-local Playwright config with one worker, Chrome, en-AU, the task-owned origin, desktop 1440×900 and phone 390×844/touch projects; the capture test also sets 1024×768 and 320×844.

Early local database attempts hit the disposable server's lock-table limit and a seed timeout during host memory pressure. The successful reruns used `max_locks_per_transaction=1024` and `jit=off` on that isolated server. No application timeout, authority, migration or fixture grant was changed. Interrupted typecheck/lint attempts were rerun successfully. These earlier attempts are not reported as unrelated code failures.

The initial expanded browser runs had failed assertions and database-connect timeouts. An unmodified source archive of main `1402c87b9069def4dcd4d82f291cd991cff40ca5`, compiled and served on the same task-owned origin/database, passed nine applicable native browser cases with one intentional phone-project skip. Only a separate copy of its CR-02 test adapted the hard-coded request Origin to port 3037; application source stayed unchanged. This comparison does not support calling the branch failures unrelated. The branch tests now await the preparation, accepted/reloaded and historical Draft reads, Discovery creation context and deliberately aborted LC-13 response, and use the snapshot's actual text structure. The expanded CR-02 journey (full clarification cycle, four viewport captures, receiving queue, successor draft, historical entry and both Sales lists) uses a three-minute overall test budget, matching the dedicated native queue journey; the expanded Won-list and full LC-13 creation/recovery/reload journeys also have three-minute overall budgets. The five-second render assertions and application timeouts are unchanged.

A native queue trace then exposed a real starvation defect: a full permitted read taking 28.6 seconds was discarded when each 15-second timer poll superseded it. The queue opts into serialized timer/focus reads in the shared hook. The native CR-02 journey exposed the same success-but-still-loading symptom in HandoverList, so its list read also opts in for the two existing Sales lists. Native record reads/commands and the remaining consumers retain the default. The focused regression failed against the previous compiled application (extra concurrent reads) before the fix. No database or application timeout was increased. The rebuilt queue passed the regression. A later broad native run remained mixed (7 passed, 6 failed, 1 skip), including connection/query timeouts and initial/reload assertions made before their reads. The focused reruns disabled trace recording and refreshed planner statistics with ANALYZE on the task-owned synthetic database, without changing fixture rows or application settings. The LC-13 creation cases passed in both projects, followed by both recovery cases and both Won cases. After the HandoverList fix, the four list journeys produced three passes and a desktop CR-02 overall-budget timeout at the preparation read. Its focused rerun exposed an initial historical-read assertion while the page still showed Loading handover. After explicitly awaiting that native Draft read, the unchanged three-minute journey passed in 2.5 minutes. The dedicated native queue and navigation cases had already passed on the queue fix. These targeted results close the selected functional checks; the mixed batches and host-sensitive timing remain part of the evidence, and CI must still pass on the published head.

Not run: every repository-wide unit/database/HTTP/browser suite, the populated-upgrade suites for unchanged migrations, physical-device or screen-reader testing, a production-scale load benchmark, owner/business acceptance or deployment. The read deliberately establishes correctness from the full permitted submitted population; its repeated native authorization reads still need scale measurement before any production-capacity claim.

## Visual inspection

Codex inspected all nine application captures on 31 October 2026 against the five retained accepted references and the adopted phone/shell amendments. The register preserves the 240 px rail and secondary menu, 60 px toolbar, 40 px desktop rows, horizontally scrollable columns and fixed selection/action edges. The 1440 px snapshot preserves its large two-column composition and the selection panel is 360 px. At 390 px the list has one compact header and the snapshot has a separate record header and sticky footer; at 320 px the content wraps without page overflow and the step controls move into More. Browser assertions exercise keyboard focus restoration/Escape, compact menus, paging and selection recovery.

The [capture manifest](captures.json) records dimensions and SHA-256 hashes. Captures use deterministic synthetic read fixtures, not native database responses. Native behaviour is covered separately above. After the polling fix, the rebuilt application reproduced all nine retained PNGs byte-for-byte. Inspection does not grant visual acceptance.

| Width | Inspected application captures |
|---|---|
| 1440 | [Register](desktop-register.png), [two selected](desktop-selection.png), [snapshot](desktop-snapshot.png) |
| 1024 | [Register](desktop-1024-register.png), [snapshot](desktop-1024-snapshot.png) |
| 390 | [List](phone-list.png), [snapshot](phone-snapshot.png) |
| 320 | [List](phone-320-list.png), [snapshot](phone-320-snapshot.png) |

## Bounded design adaptations

- The current shared top bar and compact phone header replace the historical capture's breadcrumb and duplicate phone toolbar under their adopted amendments.
- The register adds explicit as-at/completeness and paging. Counts use the whole matching permitted population; partial totals say “at least”.
- At 1024 px the shared menu becomes an overlay and the table scrolls horizontally. No accepted 1024 px drawing exists.
- At 320 px the state/date line wraps, increasing phone row height; search/filter combine and record previous/next move into More. No accepted 320 px drawing exists.
- Phone multi-selection uses press-and-hold plus an explicit Select briefs control and labelled checkboxes. The selected panel stacks in a shared dialog.
- Participant/customer/site labels and the submitted activity reference’s current Sales-action summary/owner/due date accompany the frozen brief. Native events do not freeze those activity fields. Evidence, outcome/assumptions/unknowns, full native history, source-change recovery and historical-revision handovers retain more information than the single illustrated snapshot. These states have no complete accepted drawings.
- Returned and Accepted remain all-time views. Other permitted receivers' briefs remain visible; terminal source movement is shown in the snapshot, not the open Source changed view. The unresolved rail badge is absent.
- Application fallback SVGs differ from the icon-free capture placeholders. No licensed artwork is committed. Shared tokens supply current control text colours and focus treatments.
- Synthetic fixture IDs, persona initials, some update dates and the rendered timezone detail differ from the illustrative capture. Source/state values are derived from the fixture read and its as-at time; they are not hard-coded into the application. The shared shell controls and unrelated rail badges follow current shared-shell data.
