# Inspections accepted-design build verification

FI-03 capture and FI-04 review in PR #647. [Design acceptance](../../../decisions/inspections-figma-design.md) is separate. Owner visual review is **pending**; no deployment or business acceptance is claimed.

## Sources and viewport comparison

Source: **PPO - Design**, named version **Inspections — accepted**, page `1339:4184`, notes `1345:2979`, File index `630:2`, row `1396:355197`. Live metadata, screenshots, design context and variables were inspected. The [retained icon-free references](../../../reference/ui/quality-site-assurance/inspections-design-r01/README.md) are unchanged.

The [presentation fixture](../../../../tests/fixtures/inspections-accepted.ts) contains synthetic examples, not operating rules. [Presentation browser tests](../../../../tests/browser/inspections-design.spec.ts) intercept data while rendering the real application; database and real HTTP/browser tests separately prove authority.

| Reference nodes | Application comparison |
|---|---|
| `1339:4220`, `1339:4792` | Register 1440 × 900 and 1024 × 900; tablet rail explicitly collapsed to match the reference; filters, empty and denied states |
| `1339:4442`, `1339:4542`, `1339:4684` | Retest awaiting review, returned original and prepared outcome at 1440 × 900 |
| `1339:317844` | Draft capture 1440 × 900, plus the undrawn tablet record at 1024 |
| `1339:317656` | My inspections 390 × 844 |
| `1339:317680`, `1344:3577` | Capture 390 × 1550 and 320 × 1772; extra scrolled captures expose Evidence and Findings |
| `1343:3284`, `1339:4851` | Failed-check submit sheet and reviewer retest history, 390 × 844 |
| `1344:3746`, `1344:3909`, `1344:4086` | Disconnected, uncertain original and missing attendance, 390 × 844 |

Application captures block the Kit and suppress SVG/Font Awesome icons. They are implementation evidence, never replacement references. Tests check horizontal overflow, visible phone sections, labelled controls, keyboard Escape/focus and disabled commands. Physical-device, screen-reader and 200% zoom acceptance were not performed.

## Environment and schema

The configured local synthetic database on port 5433 was unavailable. An isolated PostgreSQL 16.15 process used the installed runtime on loopback port 5547, with **ppo_synthetic_test** only. Existing databases and Windows service configuration were unchanged. Credentials, database files and raw logs stay outside tracked sources.

Current-main migrations through 0113 were applied before inspecting live inspection-result, instrument-use, Service-event and output columns and constraints. That confirmed no per-reading attribution. Reserved migration 0115 then applied, without a seed, capability or grant. The disposable cluster required `max_locks_per_transaction=512` to reset the complete synthetic schema.

Browser proofs used the local-identity launcher, approved Chrome 155.0.8059.85 and Next webpack development mode. Turbopack cannot follow this worktree's shared dependency junction outside its filesystem root. Installed Playwright reports 1.64.0 while the lock specifies 1.64.1; no dependency changes were made.

## Executed checks

| Check | Result |
|---|---|
| `npm run studio:check` | Passed: 366 entries, 48 components; existing unreviewed/stale records remain visible |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| Full unit suite, serial execution | 965 tests: 961 passed, 4 failed; baseline findings below |
| Focused Service inspection and CPQ units | 7 passed on rerun |
| Service inspection DB suite and populated 0113→0115 upgrade | 7 passed: immutable attribution, recovery, calibration, permissions, correction/retest, preparation/issue and repeated upgrade |
| Accepted-design browser scenarios | 4 passed, including desktop, tablet, 390, 320 and drawn states |
| Real desktop HTTP/browser workflow | Passed: original recovery, correction, retained retest, independent review, exact prepared/issued hashes and cross-company denial |
| Real phone HTTP/browser workflow | Final run pending |
| Production build | Final run pending |
| `npm run browser:check` | Passed, approved Chrome renderer |
| Naming, foundation, migration/open-PR numbering and generated status checks | Passed; all 78 parent requirement IDs retained |
| `git diff --check` | Passed |
| Status and build sequence generators | Ran; generated status/index and sequence were not edited by hand |
| Full database/demo suites and Linux compiled browser matrix | Not run locally; CI remains separate |

The full unit command used the package script's Node runner with `--test-concurrency=1` to limit host contention. Two document-store tests and the recovery-directory assertion fail identically on unmodified main `0685e30c99d3146005f7699345623d5c5476942d`. The fourth failure was a CPQ five-second calculation timeout under load; it passed on both unmodified main and the focused branch rerun. The full local suite is **not** reported green.

Initial browser checks exposed hidden phone Evidence/Findings, competing bottom navigation, a cramped recovery notice and loss of the entered reason after outcome preparation. These were corrected. The shared More control retains menu access and focus return beside the capture dock. Cold receipt lookup is awaited before saved-confirmation assertions. A local phone setup on a weekend was refused by the existing published working-interval rule; subsequent runs use available weekdays.

## Differences and open questions

- Current shared compact phone header/More menu and permission-filtered rail are retained. Conversations and compare actions are excluded. Tablet comparison selects the existing collapsed-rail preference.
- Per-reading capture times are absent from the model. Actual attempt save/test/submission times are shown; historical instrument attribution is explicitly unrecorded.
- Test-time editing, reason/observation, calibration detail and exact evidence remain accessible. This makes phone capture taller than the composition. Evidence and Findings share its scrolling form. Desktop Save/Submit sit at the capture pane's bottom edge.
- Retest cards group retained reviews and correction details by attempt. Existing evidence/history/clarification controls remain; their new tab compositions were not drawn.
- Exact prepared HTML/PDF open through links with hashes rather than a new embedded document renderer. The outcome reason remains an editable required control.
- Bulk selection and column settings have no adopted behaviour and are omitted. Rows/counts reflect bounded authorised data rather than six illustrative records.

Open questions for Dean: separate contracts for per-reading timestamps and column/bulk actions; owner review of the retained-control/layout differences. Compare attempts and JPEG remain separate decisions. No capability, dependency or integration is inferred.

A different-model migration review is still required before merge under CONTRIBUTING; none is claimed. Source presence, functional proof, code delivery, owner visual review and deployment remain separate.
