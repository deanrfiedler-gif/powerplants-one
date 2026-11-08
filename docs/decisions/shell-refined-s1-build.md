# Refined shell S1 build adaptations

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Build owner:** Codex. **Scope:** S1 tokens and top bar, synthetic application only. Implementation review and owner visual/device acceptance remain separate.

## Authority

Dean requested the staged implementation on 8 November 2026, with one dedicated worktree and draft pull request per stage. S1 is [PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874). Its sources are [PPO-SHELL-REFINED-FIGMA-DEC](shell-refined-concept-design.md) and the [full R1–R115/D1–D41/Q1–Q22 export](../design/development/systems/shell-refined-concept-rules.md), now merged through design-record PR #873. They were read from that branch when S1 began. S2 waits for Dean to merge S1. This record does not alter the decided design questions.

Dean's [staged-build confirmation](https://github.com/deanrfiedler-gif/powerplants-one/pull/873#issuecomment-6727496497) authorises this sequence. His [source direction](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6727550965) pins the Figma named version **“Shell refined concept — accepted”**, saved **8 November 2026**. Build and review use that named design version and the node IDs in the record; repository captures are as-built evidence, not a build prerequisite. A later design change requires a new named version and build step. [PR #876](https://github.com/deanrfiedler-gif/powerplants-one/pull/876) records that handoff amendment.

## Two bounded adaptations

The build instruction required a referral before departing from a decided question or adding a store. Codex identified two gaps and recommended these existing-data adaptations. **Dean’s decision, given in chat in Codex’s session; no [DEAN] comment**: Dean answered Yes and subsequently “Proceed however you believe is the most professional” to each question in the task chat.

- **Q13, tenant mapping:** retain the existing grant-filtered SYN-A/SYN-B company names and All companies. The existing working-company API and store narrow access; no new mapping to Powerplants Australia or Demo company is invented. The two named design tenants and amber demo indication require their real mapping in later work.
- **R104, account metadata:** use the existing synthetic identity description and working-company name, with “Last sign-in details unavailable”. The current context contains no role or sign-in device. No role, timestamp or device is fabricated. The footer uses the validated deployment commit when provided, otherwise Local build.

No migration, new database store, route, capability, permission or grant is added. The new browser preference is expressly part of Dean's rollout instruction: schema 1, per `preference_scope`, with a visit-memory fallback. `PPO_SHELL_REFINED=1` forces it on for CI, `0` forces the legacy shell, and an unset value follows the identity preference. It affects desktop presentation at 768 px and wider only.

## Source measurements and bounded omissions

The [shell master](../design/development/systems/shell.md#refined-concept-s1) records the measurements inspected in sheets A, G, I, N and T and the 1280/1024/1920 reference bars. At 834 the frame's search zone is 262 px but its nested field is 360 px; the decision record's 262 px governs. Old component descriptions still mention a 400 px desktop search and older rail dimensions; the rendered frames and later record govern.

R110 governs every New entry: server-supplied creation actions must also resolve to a ready destination the identity can open. There is no registered quotation-create action or ready Assistant entry; neither is invented. The four available utility controls share the twin spacers. The account's Help and page guide opens the existing guide, and Notification settings opens the existing Notifications workspace where Preferences is available. Popover heights follow the actual permitted rows and full synthetic names rather than padding in unavailable actions. These are implementation limits, not new routes or a claim of complete design alignment.

## S1 bridges and remaining limits after review

**Proposed S1 departure — breadcrumb bridge, not owner-accepted design:** Sheet A has no extra shell band; the accepted end state places breadcrumb and title in the page header. The staged opt-in host currently retains a separate breadcrumb row below the bar until that integration is implemented. It is 32 px on desktop and at least 44 px below 1024 for the hierarchy touch target. The row now preserves Page hierarchy, the full-path title, current-page semantics and hidden separators. This is explicitly a temporary departure for Dean's review, not a change to the accepted design or its decided questions.

Page guide remains a bar utility below 1024 until S4 supplies the right strip; Q19 removes Calendar only. The refined notification badge follows the existing phone policy: arm its inbox projection after ten seconds or the first bell opening, without refresh on window focus. No endpoint or data contract changes.

**Known S1 first-paint limit:** the identity preference is browser-local and its key arrives with asynchronous shell context. With no environment override, a full reload can paint the legacy header before applying the saved refined preference. `PPO_SHELL_REFINED=1` selects the refined desktop presentation server-side; it does not prove the local-preference path has no shift. This remains a rollout limitation for S7 first-paint work and S8 switch-over, with no new cookie/store introduced and no owner acceptance inferred. Existing legacy first-paint evidence must not be relabelled as refined evidence.

## Shortcut audit and recovery

Item 13 continuation on 9 November 2026: **Dean's decision, given in chat in Codex's session; no [DEAN] comment**. Continue from `1cba4d85` following the [released claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6727821679), fix only the [utility roving-tabstop finding](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6727791950), preserve tabindex cleanup and add a fixed-size mount/unhide regression. Push without rebasing or force-pushing, leave timeouts unchanged, run the full suites and request Claude's confirmation of items 1–13 only.

Codex searched existing key/code handlers before enabling N, ?, and the New-menu letters. No existing global N or ? handler was found; Ctrl/Cmd K retains the existing search handler. Creation letters are handled only inside the open New menu. N and ? ignore editable fields, prevented events, repeats, modifier chords, dialog and composite-widget contexts (menus, menubars, listboxes, grids and trees), and any open native popover. Entering a create form remains subject to the existing unsaved-work review and never creates a record itself. The remaining R48 shortcuts belong to their later stages.

Turn off Refined desktop shell in Account → Preferences to return that identity to the legacy version; a CI override takes precedence. Revert code through a reviewed successor PR if needed. The phone code, navigation authority and data contracts remain unchanged. Browser rendering, physical devices, screen readers, owner acceptance and the required independent Claude review are not inferred from source checks.
