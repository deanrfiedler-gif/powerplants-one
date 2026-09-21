# EN-07 Engineering Change-Impact Review: local evidence r01

Captured on 20 September 2026 from a task-owned local server (`127.0.0.1:3107`) running branch `feat/en07-change-impact-review`, against the synthetic development database with migration 0030 and seed 30 applied. **Every capture was taken again after the screen was brought to desktop mockup r03**, the updated design Dean supplied that day ([retained here](../../../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png)); the earlier set, against mockup r02, is in this folder's history at commit `0504a6f`. Every record shown is fictional and was built through the application's ordinary API by `scripts/engineering-changes-scenario.ts`. These are implementation captures for owner review. They are not the mockup, not a registered UI baseline, and not visual, device or business acceptance. Decisions, departures and the case-by-case status are in [the integration record](../../../decisions/engineering-change-impact-review-design.md).

| Capture | Viewport | Identity | What it shows |
|---|---|---|---|
| `register-r03-1586.png` | 1586×992, mockup r03's own | SYN Sam Jordan | The comparison state for r03: pills for review state and attention, full due dates, one "Package / project" cell, the two chips, Technical basis, the zone-labelled check time, "Pending review" in the caution colour, whole-row follow-through, the amber strip beneath it, and the primary, outlined and link actions. All eight columns in view beside the real 220px menu and a 368px inspector |
| `register-expanded-1672.png` | 1672×941, mockup r02's own | SYN Sam Jordan | The same state with the 400px inspector: real 220px My Work menu docked, eight rows, SYN-EN07-003 inspected, no box ticked, `8 changes · 0 selected`, all eight default columns in view, table flush to the menu and inspector dividers |
| `register-collapsed-1920.png` | 1920×1080 | SYN Sam Jordan | First-use state: menu hidden with no residual track, destination named in the header, 448px inspector with all three follow-through lines and the derived overlap note |
| `register-1366.png`, `register-1280.png` | 1366×768, 1280×800 | SYN Sam Jordan | Menu docked; the inspector overlays because the register would fall under its usable width. At these heights r03's order leaves the follow-through and the amber strip below the fold of the inspector's scrolling body; "Pending review" and the pinned primary action stay in view |
| `register-zoom200-960.png` | 960×540 (1920 at 200%) | SYN Sam Jordan | Overlay menu and overlay inspector; controls reflow and stay reachable |
| `register-phone-390.png` | 390×844 | SYN Sam Jordan | Flush stacked summaries with labels in words; the eight-column grid is not shrunk |
| `impact-1440.png` | 1440×960 | SYN Sam Jordan | Current and proposed comparison, exact sources as reviewed against current, affected items |
| `impact-returned-1440.png` | 1440×960 | SYN Alex Lee | SYN-EN07-005 returned for scope clarification, with its reason, owner and the successor-revision action |
| `reviews-1440.png` | 1440×960 | SYN Casey Reviewer | The assigned discipline review of SYN-EN07-001 |
| `handovers-commercial-1440.png` | 1440×960 | SYN Coordinator | Where "Open commercial review" lands: the in-module synthetic prerequisite, known cost with the unknown component named as not zero |
| `verification-failed-1440.png` | 1440×960 | SYN Taylor Commissioning verifier | SYN-EN07-007: the retained failed attempt, its corrective work, and closure blocked |
| `history-1440.png` | 1440×960 | SYN Quinn Materials viewer | Revisions, decisions, source checks and events, read-only |

Persistence across a restart was shown by a digest of record identities, versions, stages, attention, menu counts, the recorded source-check time and 41 history events: `ebd7ba7b…1cb92b` before the server was stopped, after it was started again, and after the scenario was rerun.

Not captured or reviewed: keyboard-only operation, a screen reader, a physical device, the compiled build, and print output.

## CI repair, 21 September 2026

On PR #266 head `00cd6f4`, [Application assurance run 35537679132, job 106149520115](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35537679132/job/106149520115) failed only its focused CRM I2 step: CA-13 checked for the Home/My Work greeting while the demonstration identity was still loading. The original run passed all 459 database tests and 233 retained browser tests; the other 16 check runs passed. The [original CI screenshot](ci-repair-2026-09-21/ci-identity-loading.png) records the actual loading state. The artifact's selected screenshot and error context were inspected; a complete Playwright trace was not present in that retained artifact. A full artifact download failed at transport level; selected members were successfully retrieved using byte ranges.

The maintained CA-13 test now awaits the streamed `/` → `/work` navigation and identity readiness (`aria-busy=false`) using the same 15-second limit as the test's actions. It then performs the original five-second one-heading/title and visibility assertions. It changes no production identity code, grants, retries or failure handling. Comparison with main `b4806af` found the same CA-13 and My Work responsive source; EN-07's identity component differs only by three synthetic profile choices. This is source comparison, not a claim that a new full main suite was run.

Main `b4806af` is incorporated with EN-06's refined workspace entry/grid and EN-07's r03 flex layout kept separate by their actual scope selectors. `engineering-review-base.css` retains EN-07's composition; the new EN-06 breadcrumb trail is scoped to EN-06. EN-06's duplicate status entry and document-register status are reconciled; all EN-07 parent/document IDs remain. The original r03 captures above are unchanged.

Local verification uses an isolated `powerplants-one-en07-fix` checkout, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and the pinned Chrome channel, application port 3012 and a new task-owned `ppo_synthetic_test` cluster at 55440. Existing development/test clusters and the original EN-07 checkout were not reset or modified. Fresh additive migrations through 0030 and registered seeds completed through the normal runner; no old migration bytes or grants changed.

- A temporary harness held the real first identity responses for 6.5 seconds: the unchanged test reproduced the missing-heading failure ([negative-control log](ci-repair-2026-09-21/identity-before.txt)). With the readiness fix, the same delayed-response case passed on desktop and phone, **2 passed in 45.1s** ([result](ci-repair-2026-09-21/identity-after.txt)). The artificial delay lives only in the local proof, not the maintained test.
- The full CRM I2 suite passed against the development server, **16 passed in 3.3m**, including revocation, identity switching, same-query List/Board equivalence and the repaired Home transition ([log](ci-repair-2026-09-21/crm-dev.txt), [Home ready](ci-repair-2026-09-21/home-ready-desktop.png)).
- `npm run typecheck` and `npm run lint` passed. EN-07 policy/preview and migration-registry unit suites passed, **16 tests** total. The deterministic source-order preview regression remains intact.

Browser commands use `npx playwright test -c tmp/en07-ci.config.ts` and temporary copies of the existing specs, changing only the origin from 3000 to 3012 and their relative helper paths. Project names, Chrome channel, 1440×1000 desktop and 390×844 phone sizes, and all assertions remain. The negative control additionally appends the described identity delay. No global assertion timeout is increased. Final compiled checks are recorded below; corrected-head CI, business approval, physical-device and hosted evidence remain separate.


Final compiled build **`sNZNl7m9_eQwWNHpwsjby`** passed (`npm run build`; [log](ci-repair-2026-09-21/build.txt)). It emitted a dynamic filesystem tracing warning from the unchanged `src/reports/template.ts`; no renderer or template guard was changed to suppress it. On this build:

- The repaired CA-13 test passed on desktop and phone, **2 passed in 14.1s** ([log](ci-repair-2026-09-21/crm-compiled.txt)).
- EN-06, EN-07, My Work desktop/mobile and shared shell suites passed, **35 passed, 29 intentional platform skips, 3.0m** ([log](ci-repair-2026-09-21/compiled-regressions.txt)). These include the refined EN-06 register, retained r03 EN-07 composition, exact-preview/lost-response recovery, menu parity, phone containment, identity refusal and source-owned My Work actions.
- Foundation and naming checks passed: `python scripts/check_foundation.py` (78 requirements, 17 issued sources, no errors) and `python scripts/check_naming.py` (318 document records, no errors). `git diff --check` passed after normalising trailing whitespace in the copied local logs.

The broad PostgreSQL/HTTP/restart suites were not rerun for this test-readiness and layout-merge repair; their previous CI results are identified above. The task-owned test server and PostgreSQL cluster are stopped after verification with their data retained. PJ-09 remains available on port 3001. This repair does not merge the draft PR, alter hosted state or claim corrected-head CI has completed.
