# Facilities accepted-design build evidence

Scope: CS-05. Builder: Codex. Owner visual review: **pending**. Draft delivery: [PR #627](https://github.com/deanrfiedler-gif/powerplants-one/pull/627). No deployment or business acceptance is claimed.

## Source and scope

Source: **PPO - Design**, page `1415:357158`, named version **Facilities and growing areas — accepted**. Notes `1415:358266` and index `630:2` / `1423:376950` were read. D1–D7 and Q1–Q4 follow the [accepted decision](../../../decisions/facilities-figma-design.md).

Live screenshots and design contexts covered desktop register `1415:357195`, snapshot `1416:363644`, hierarchy `1416:365147`, Overview `1415:357445`, Equipment `1416:366300`, correction `1416:366753`, review `1416:367175`, create `1416:367649`, tablet `1415:357718`, phone list `1415:357952`, Overview 390 `1415:357991` and 320 `1416:369291`, phone review `1416:369765`, loading `1415:358128`, no matches `1415:358186`, failure `1415:358229`, conflict `1418:362899`, uncertain `1418:363291`, view only `1418:363685` and the notes card. Grid parts: `1415:358287`, `1415:358302`.

Private Figma material stayed outside the repository. [Retained icon-free references](../../../reference/ui/customers/facilities-design-r01/README.md) were not changed. New application captures suppress icon artwork and use UI-only synthetic fixtures.

## Implementation and reused controls

The existing four routes now use a compact register, permission-scoped view counts, read-only snapshot, explicit hierarchy, record cards, current/ended Equipment groups and in-record correction/review. Existing schema, capabilities, command identities, version checks and original-operation recovery remain in use. No migration, dependency, seed or new integration was added.

Reused: SecondaryMenuFrame, usePhoneHeader, usePublishRecordIdentity, RegisterTable, RegisterChip, RegisterSortHeader, Button/ButtonLink, ShellIcon/ProductIcon and the mapped My Work refresh Icon, PageHeader, RecordTabs/RecordPanel, Field/SelectField, LookupField, ValidationFields, ReadState/ErrorNotice, useCrmResource/useCrmCommand, SourceField, SitePicker, ParentPicker and CopyId. The page-local FacilityRecordLayout and snapshot composition are documented as the facility-workspace host in the component register.

Five page contracts, register entries and guides describe the actual controls, data scope and recovery limits. Component consumers/states and alignment gaps were updated in the same change. Build sequence and status were generated with their scripts; the build-sequence report is an ignored generated artefact. Owner review fields remain pending without copied fingerprints.

## Initial implementation verification record

| Check | Result |
| --- | --- |
| npm ci | Passed; lockfile and dependencies unchanged. |
| npm run studio:check | Passed again after merging main at 06395e10: 366 entries, 49 components, no errors. Visual review remains separate. |
| Focused ESLint on all changed TypeScript/TSX files | Passed. The subsequent full npm run lint also completed with exit code 0 after the merge. |
| npm run typecheck / tsc --noEmit | Passed after the merge: npm run typecheck completed with exit code 0. The earlier interrupted attempt and its two corrected errors are superseded by this completed run. |
| Focused Facilities unit tests | Passed again after merging main: 5 tests, including Q3 completeness, null/zero measurements, filtered hierarchy and conflict proposal carry-forward. |
| Full unit suite, serial equivalent of npm run test:unit | Partial run stopped after two operator CLI subprocesses exceeded their 15-second startup deadline. The two comparison tests passed in the primary checkout, but the isolated-branch retry timed out again. No passing full suite or confirmed non-regression is claimed. |
| npm run build | Not run locally while the shared machine is under memory pressure; required in Application assurance. |
| python scripts/check_naming.py | Passed again after merging main; no errors. |
| python scripts/check_foundation.py | Passed after the merge: 78 parent requirements, 68 status fragments, 12,924 local links checked, no errors. |
| python scripts/build-ui-sequence.py | Completed. |
| python scripts/build_status.py | Completed; generated status refreshed from the new fragment. |
| git diff --check | Passed before the implementation and refinement commits. |
| Focused accepted-design browser check | Passed: view-only record at 1440/390/320 px, no horizontal overflow, no correction grant, Equipment groups and site/record handovers. |
| Complete accepted-design browser suite | Passed: all 9 tests in 4.5 minutes at d30e9fb3, before the documentation conflict resolution. Covers register/snapshot/hierarchy/tablet, view-only/equipment, editable record/create/review, loading/no matches/error/denial, changed-version carry-forward and exact original-operation replay. Local one-worker configuration uses 300-second test and 60-second assertion deadlines because of Windows resource pressure. The standard CI deadlines were not changed. |
| Native database/browser suites | Database-backed proof not run locally. The app's local session endpoint returned a connection failure; the shared synthetic test database was not reset. This was not compared with main and is not attributed to this change. |
| CI | [Final-head Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39495537502) failed at browser installation on 903256d3, before application proof. Its installer supplied Chrome 156.0.8078.47, which the existing major guard rejects. The same refusal was reproduced from unchanged main 4c1097cc; source/installer/dependency files are identical. [PR #643](https://github.com/deanrfiedler-gif/powerplants-one/pull/643) owns the shared runtime fix. Merged-tree TypeScript, design register, naming/foundation and dependency-audit CI passed on 903256d3. The older run at 34dac8c7 failed design-contract issues already fixed. |

The local machine had about 1 GiB free of 16 GiB while several unrelated sessions were active. The task's own cold route compile took 112 seconds. Other sessions' processes and databases were left alone. Do not treat a local timeout, a queued workflow or a documentation check as a passing application proof.

## Visual comparison and remaining differences

Initial 1440 px record and 320 px phone comparisons confirmed the full-width shell, 380 px details column, card wrapping and reachable fixed phone action. Extra space above the view-only notice and missing Equipment status chips were found and corrected. The snapshot was changed from the full table to the compact summary shown in the accepted frame. The subsequent nine-test run produced 22 icon-free captures, retained here and listed in captures.json. Builder inspection is separate from owner review. These captures precede the merge of main; they are not evidence of the newly merged shell changes.

- The later accepted compact phone-header amendment is used. The existing permission-aware rail shows only the synthetic identity's allowed destinations and available counts; it does not invent the complete Figma rail's badges.
- Source names, crop names, dimensions, history length, IDs and dates follow the synthetic fixture or actual permitted read. Existing site-time Stamp formatting is retained; observation dates remain ISO dates. Data differences are separate from layout conformance.
- The create lookup highlights exact names and lists the other permitted site areas. The accepted frame's closest-name ranking has no documented rule.
- Record position and previous/next controls are omitted until their query/order context is defined. Tab badges use complete permitted totals projected by the workspace read.
- Sources/History at full size, pin review and service-link commands retain native controls. Manage service links discloses those existing commands; the undrawn dialogs were not redesigned. Additional correction fields remain disclosed below the drawn measurements/context groups.
- Native modal focus and Escape/return focus are used for the snapshot. The close control sits inside the modal; no floating previous/next control is invented.
- The create form uses the existing exact Site picker and reason field inside the three groups. Additional native fields remain available; tablet record/mobile create adaptations are undrawn and await owner review.
- Correction and recovery retain native validation, parent IDs, operation controls and disclosure groups. The form is taller than the accepted correction frame; the comparison has three columns rather than the drawn four, and the conflict shows the existing validation summary above its recovery notice. These are visible layout deviations requiring review, not approved exceptions.
- When creation is opened with a site_id handover, the existing form keeps the site fixed and shows its name above the groups; a fresh create route uses SitePicker. This differs from the editable Site control in the drawn create frame.
- Desktop/tablet register and record cards, phone wrapping and all captured states were inspected. The complete paired comparison at every exact reference height, plus physical-device/accessibility review, remain outstanding. No claim of pixel equivalence or full visual acceptance is made.

## Questions for Dean

1. What matching and ranking rule should “closest name” use in Check before creating?
2. Should previous/next follow the originating filtered register, and how long should that context survive a direct link or reload?

Reloading an unsaved or uncertain proposal still loses in-tab recovery context; no durable offline draft or queued mutation is claimed.

## Conflict resolution

Merged current main (4c1097cc) in 06395e10. Preserved the Facilities, People, Service review and Discovery costing component consumers and alignment items. Regenerated status from all 68 fragments and regenerated the build-sequence report. No application source conflicted. GitHub reported the PR mergeable after the push.

## CI failure diagnosis — 21 October 2026

The application jobs at 903256d3 failed during `Install pinned controlled PDF renderer`, before their static, build, database or browser proof. The compiled-browser and Leads workflows showed the same Chrome 156 refusal. This was the unchanged reviewed-major policy from main, not a Facilities-specific assertion. The browser module from main 4c1097cc was copied unchanged into ignored temporary storage and its `assertSupportedBrowser("156.0.8078.47")` produced the same error. The runtime module, installer and package files had no branch diff.

The separate runtime repair in PR #643 retains earlier reviewed majors and adds the observed 156 floor. At diagnosis the repair was not part of this branch; rerunning the unchanged branch would encounter the same installation failure. Owner review and deployment remain separate.

## Landed runtime integration — 21 October 2026

PR #643 was repaired separately and merged at 00:12 UTC (10:12 am Brisbane). Its final head e89b6bbf passed documentation foundation and the merged-tree check with no failed or pending checks reported at integration. This session did not repair or merge that PR.

Facilities now integrates main 78795dd6, retaining both PRs separately. The sole textual conflict was generated docs/STATUS.md; the main copy was selected and regenerated from all fragments. Shared component and page-register additions merged without conflict. No Facilities application source changed during this integration. Fresh Facilities branch checks and CI results are recorded below as they complete; the passing runtime-PR checks do not substitute for Facilities proof.

On the integrated tree, `npm run studio:check`, `npm run typecheck`, `python scripts/build_status.py --check`, `python scripts/check_naming.py`, the seven browser-policy/Facilities unit tests and `git diff --check` passed. Foundation also passed: 72 fragments and all 78 parent requirements.

The PR-triggered [Application assurance run at ade97e72](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39522061070) passed Chrome 156.0.8078.47 installation and `npm run check` (design register, lint, typecheck, full unit suite and build). Its compiled Facilities step failed seven of fourteen cases. The completed mobile job separately passed all nine accepted-design cases but failed three native Facilities cases; its full browser result was 488 passed, 3 failed. These failures are addressed below. The earlier duplicate manual run 39521132392 was cancelled after partial installation/static proof and is not a workflow pass.

## Facilities browser repair — 21 October 2026

Signed-in live logs exposed the compiled-step errors while the job-log API was unavailable; the completed mobile job logs later became downloadable. The hierarchy test expected a name without its depth label, phone assertions targeted hidden desktop controls, and a non-waiting checkbox count skipped the asynchronous required review acknowledgement. Repeated desktop/mobile execution also reused one synthetic long name. Locators now target the actual controls, parent handovers assert the exact saved ID, review waits for acknowledgement, and each long-name fixture is unique. Route handlers finish before removal. The native pin review retains its existing confirmation contract, which has no acknowledgement checkbox.

A real phone defect remained: the secondary-menu flex layout constrained the record height, leaving its final Sources control underneath the fixed action footer. The Facilities-only record host now uses natural-height block content with scrolling, preserving footer clearance. Normal clicks open and close Record location pin at 390 and 320 px before saving and reading back the zero-valued pin. No forced pointer action, increased timeout, skipped assertion, shared-shell change, runtime change, dependency or migration is used.

Repair validation uses Windows, Node 24.22.0, Playwright 1.64.1 and installed Chrome 155.0.8059.85 against the development server. An isolated temporary PostgreSQL 16 cluster contains only `ppo_synthetic_test`; no shared database was reset. Initial local attempts exposed and corrected selectors, then exhausted the temporary cluster's deliberately low connection limit. Restoring its normal 100-connection setting and restarting only the task's server removed that environmental failure. The final native run passed all fourteen cases in 2.2 minutes using the repository's 45-second test and 5-second assertion deadlines, one worker and both desktop/phone projects. The nine accepted-design cases then passed in 29.6 seconds, exercising their desktop, tablet, 390 and 320 px viewports and all drawn state fixtures. Earlier timed-out attempts are not counted as passes.

The [390 px](browser-repair/sources-controls-390.png) and [320 px](browser-repair/sources-controls-320.png) icon-free captures show the final Sources control above the footer. Captured from the repair working tree based on ade97e72, with the CSS/test changes in this same commit; viewport heights are 844 px. Builder inspection confirms footer clearance. This retained native Sources view is undrawn and is not a new design acceptance. The original 22 captures and reference files remain unchanged.

`npm run studio:check` passed (366 entries, 49 components), as did focused ESLint, full `npm run lint`, `npm run typecheck`, all five Facilities unit tests, naming, foundation (73 fragments, all 78 parent requirements, 12,951 local links), generated-status consistency and `git diff --check`. Status and the build sequence were regenerated using their scripts. Linux compiled-browser CI remains separate from these local results. A local full build, full unit suite and standalone database suite were not rerun for this CSS/test repair; the new CI run must supply those results. Owner visual review remains pending.
