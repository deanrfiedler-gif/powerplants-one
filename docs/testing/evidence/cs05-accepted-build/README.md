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

## Verification record

| Check | Result |
| --- | --- |
| npm ci | Passed; lockfile and dependencies unchanged. |
| npm run studio:check (same checker invoked directly with Node/tsx) | Passed after correcting contract headings and source dependency paths: 366 entries, 49 components, no errors. Visual review remains separate. |
| Focused ESLint on all changed TypeScript/TSX files | Passed. Full npm run lint was attempted but did not return a result during local resource pressure. |
| npm run typecheck / tsc --noEmit | Two reported type errors were fixed. A subsequent Windows run was stopped without a result under memory pressure; no passing typecheck is claimed. |
| Focused Facilities unit tests | Passed: 5 tests, including Q3 counts, null/zero measurements, filtered hierarchy and conflict proposal carry-forward. |
| Full unit suite, serial equivalent of npm run test:unit | Partial run stopped after two operator CLI subprocesses exceeded their 15-second startup deadline. The two comparison tests passed in the primary checkout, but the isolated-branch retry timed out again. No passing full suite or confirmed non-regression is claimed. |
| npm run build | Not run locally while the shared machine is under memory pressure; required in Application assurance. |
| python scripts/check_naming.py | Passed. |
| python scripts/check_foundation.py | Started; no result yet. |
| python scripts/build-ui-sequence.py | Completed. |
| python scripts/build_status.py | Completed; generated status refreshed from the new fragment. |
| git diff --check | Passed before the implementation and refinement commits. |
| Focused accepted-design browser check | Passed: view-only record at 1440/390/320 px, no horizontal overflow, no correction grant, Equipment groups and site/record handovers. |
| Complete accepted-design browser suite | Latest completed run: 5 passed, 4 failed. Register/snapshot/hierarchy/tablet, view-only/equipment, loading, no matches and denial passed. Three form cases had an incorrect Season label selector, now corrected; Chromium also crashed/closed. The error-state case closed before its assertion. A final rerun is pending. |
| Native database/browser suites | Database-backed proof not run locally. The app's local session endpoint returned a connection failure; the shared synthetic test database was not reset. This was not compared with main and is not attributed to this change. |
| CI | [Application assurance run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39358076214) ran at 34dac8c7 and failed the already-corrected design-contract headings/dependency paths. It cannot prove the refinement commits. |

The local machine had about 1 GiB free of 16 GiB while several unrelated sessions were active. The task's own cold route compile took 112 seconds. Other sessions' processes and databases were left alone. Do not treat a local timeout, a queued workflow or a documentation check as a passing application proof.

## Visual comparison and remaining differences

Initial 1440 px record and 320 px phone comparisons confirmed the full-width shell, 380 px details column, card wrapping and reachable fixed phone action. Extra space above the view-only notice and missing Equipment status chips were found and corrected. The snapshot was changed from the full table to the compact summary shown in the accepted frame. These refinements still need the complete capture pass and owner review.

- The later accepted compact phone-header amendment is used. The existing permission-aware rail shows only the synthetic identity's allowed destinations and available counts; it does not invent the complete Figma rail's badges.
- Source names, crop names, dimensions, history length, IDs and dates follow the synthetic fixture or actual permitted read. Existing site-time Stamp formatting is retained; observation dates remain ISO dates. Data differences are separate from layout conformance.
- The create lookup highlights exact names and lists the other permitted site areas. The accepted frame's closest-name ranking has no documented rule.
- Record position and previous/next controls are omitted until their query/order context is defined. Tab badges use complete permitted totals projected by the workspace read.
- Sources/History at full size, pin review and service-link commands retain native controls. Manage service links discloses those existing commands; the undrawn dialogs were not redesigned. Additional correction fields remain disclosed below the drawn measurements/context groups.
- Native modal focus and Escape/return focus are used for the snapshot. The close control sits inside the modal; no floating previous/next control is invented.
- The create form uses the existing exact Site picker and reason field inside the three groups. Additional native fields remain available; tablet record/mobile create adaptations are undrawn and await owner review.
- Complete desktop/tablet/phone/state capture comparison and physical-device/accessibility review remain outstanding. No claim of pixel equivalence or full visual acceptance is made.

## Questions for Dean

1. What matching and ranking rule should “closest name” use in Check before creating?
2. Should previous/next follow the originating filtered register, and how long should that context survive a direct link or reload?

Reloading an unsaved or uncertain proposal still loses in-tab recovery context; no durable offline draft or queued mutation is claimed.
