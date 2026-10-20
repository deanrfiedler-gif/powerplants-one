# SV-06 native build verification

Date: 20 October 2026. Source base: `8f5ad31b69643d50a3d333ebad7314b128831512`. Contribution: draft PR #633. All fixtures are synthetic. This record is technical evidence, not Dean's visual review, business acceptance or deployment.

## Source and scope

PPO - Design, **Service review and reports — accepted**, page **1265:53**. Register **1266:190**, snapshot **1267:929**, Evidence **1269:1621**, review **1269:2112**, ready report **1270:2196**, response **1271:2457**, tablet **1271:2894**, phone **1271:3948**, 320 register **1271:13017**, phone Evidence **1271:9242**, response sheet **1271:12493**, states **1271:13201**, **1271:13297**, **1271:13383**, **1271:13460**, **1271:13592**; notes **1271:299637**, parts **1265:122**, index **630:2**. Live metadata, design context, variables and screenshots were inspected. Retained icon-free references remain unchanged.

The existing reports routes and embedded FI-07 are refined, not duplicated. No migration, grant, dependency, external integration or customer communication is added. The original latest-200 candidate window is retained.

## Executed checks

- Initial `npm run typecheck`: passed.
- `npm run lint`: passed before final documentation/fixture edits; final pass is recorded below.
- Focused `tests/unit/report-register.test.ts`: 3 passed (queue semantics, recorded attention and bounded/formula-safe CSV).
- `npm run test:unit`: failed locally. Observed failures: operator CLI upgrade/verify timeouts, CPQ execution-budget timeout, document-store Windows private-path cases, launcher timeout and recovery-directory expectation. These are not classified as non-regressions until compared with unmodified main.
- `npm run build`: failed before application compilation: Turbopack refuses the worktree's dependency junction because its target leaves the filesystem root. The original dependency checkout has Next 16.4.0 / Playwright 1.64.0, while the lockfile requests newer patch versions; CI must install the lockfile.
- Local page server: Webpack diagnostic fallback on loopback, with no committed launcher/configuration change.
- Persisted browser login: refused with `DependencyUnavailable`; direct configured synthetic database connection returned `ECONNREFUSED`. No database suite was run and no schema/data was changed to bypass that failure.
- UI browser fixtures intercept reads and commands explicitly; they are not persisted permission or renderer proofs. Desktop and phone checks exercise exact original response binding, review draft retention/refusal, view-only controls, loading, empty/error/retry, snapshot focus return and 1440/1024/390/320 layouts.

Final check results and main comparisons are appended before handover. No failed or unexecuted check is a pass.

## Visual comparison and limits

Application captures are local-only test artefacts, outside Git, under the temporary `ppo-sv06-browser` folder. No Font Awesome Pro artwork is retained in the public repository. The immutable source captures are the existing icon-free files under `docs/reference/ui/service/service-review-design-r01/`.

Observed composition: the flush register, secondary queues, two-column snapshot, ruled details, five desktop tabs, phone Details tab, inline review and exact response sheet replace the previous card list / stacked forms. Fixture screenshots are comparison material, not owner acceptance. Native owner visual review remains **pending**.

Known differences from the accepted sample: synthetic fixture names/row counts and evidence density differ; current state derives only from recorded facts, not a new numeric “looks wrong” evaluator; original DraftEvidence is labelled separately from newly rendered IssuedReport; follow-up due dates remain “Due date needed” until the Activity changes them. Original evidence, output-recovery/correction and Finance controls remain on their respective tabs. Missing tablet-record, Work outcome, History-detail and correction frames are not invented acceptance targets. See the [page contract](../../../design/development/pages/scope-sv-06.md) for the open questions.

The fixture browser run does not establish database command completion, the production renderer, physical-device keyboard occlusion, screen-reader acceptance, offline review/issue or deployment. CI and owner paired visual review remain required.
