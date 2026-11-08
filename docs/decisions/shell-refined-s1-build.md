# Refined shell S1 build adaptations

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Build owner:** Codex. **Scope:** S1 tokens and top bar, synthetic application only. Implementation review and owner visual/device acceptance remain separate.

## Authority

Dean requested the staged implementation on 8 November 2026, with one dedicated worktree and draft pull request per stage. S1 is [PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874). Its sources are PPO-SHELL-REFINED-FIGMA-DEC and the full R1–R115/D1–D41/Q1–Q22 export in [design-record PR #873](https://github.com/deanrfiedler-gif/powerplants-one/pull/873), read from that branch because those files were not on main when S1 began. S2 waits for Dean to merge S1. This record does not alter the decided design questions.

## Two bounded adaptations

The build instruction required a referral before departing from a decided question or adding a store. Codex identified two gaps and recommended these existing-data adaptations. Dean answered Yes and subsequently “Proceed however you believe is the most professional” to each question in the task chat.

- **Q13, tenant mapping:** retain the existing grant-filtered SYN-A/SYN-B company names and All companies. The existing working-company API and store narrow access; no new mapping to Powerplants Australia or Demo company is invented. The two named design tenants and amber demo indication require their real mapping in later work.
- **R104, account metadata:** use the existing synthetic identity description and working-company name, with “Last sign-in details unavailable”. The current context contains no role or sign-in device. No role, timestamp or device is fabricated. The footer uses the validated deployment commit when provided, otherwise Local build.

No migration, new database store, route, capability, permission or grant is added. The new browser preference is expressly part of Dean's rollout instruction: schema 1, per `preference_scope`, with a visit-memory fallback. `PPO_SHELL_REFINED=1` forces it on for CI, `0` forces the legacy shell, and an unset value follows the identity preference. It affects desktop presentation at 768 px and wider only.

## Source measurements and bounded omissions

The [shell master](../design/development/systems/shell.md#refined-concept-s1) records the measurements inspected in sheets A, G, I, N and T and the 1280/1024/1920 reference bars. At 834 the frame's search zone is 262 px but its nested field is 360 px; the decision record's 262 px governs. Old component descriptions still mention a 400 px desktop search and older rail dimensions; the rendered frames and later record govern.

R110 governs every New entry: server-supplied creation actions must also resolve to a ready destination the identity can open. There is no registered quotation-create action or ready Assistant entry; neither is invented. The four available utility controls share the twin spacers. The account's Help and page guide opens the existing guide, and Notification settings opens the existing Notifications workspace where Preferences is available. Popover heights follow the actual permitted rows and full synthetic names rather than padding in unavailable actions. These are implementation limits, not new routes or a claim of complete design alignment.

## Shortcut audit and recovery

Codex searched existing key/code handlers before enabling N, ?, and the New-menu letters. No existing global N or ? handler was found; Ctrl/Cmd K retains the existing search handler. Creation letters are handled only inside the open New menu. N and ? ignore editable fields, prevented events, repeats, modifier chords and open dialog contexts. Entering a create form remains subject to the existing unsaved-work review and never creates a record itself. The remaining R48 shortcuts belong to their later stages.

Turn off Refined desktop shell in Account → Preferences to return that identity to the legacy version; a CI override takes precedence. Revert code through a reviewed successor PR if needed. The phone code, navigation authority and data contracts remain unchanged. Browser rendering, physical devices, screen readers, owner acceptance and the required independent Claude review are not inferred from source checks.
