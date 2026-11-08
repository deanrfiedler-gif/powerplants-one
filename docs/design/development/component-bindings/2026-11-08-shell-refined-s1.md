# Refined shell S1 consumers

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Build owner: Codex. Delivery: draft PR #874; independent review and owner visual/device acceptance pending.

## application-shell

The real ProductHeader/ShellControls/BusinessSession host adds the refined desktop header behind the identity preference and `PPO_SHELL_REFINED` override. The [shell master](../systems/shell.md#refined-concept-s1) records the measured widths and source differences; the [build decision](../../../decisions/shell-refined-s1-build.md) records the two existing-data adaptations. The [guide](../../../guides/pages/guide.system.shell.md) retains the carried-over legacy instructions and its parity fixture; the proposed refined instructions below await release review. Retiring that guide now would remove general-user help before the final switch-over.

Host tests are `tests/browser/shell-refined.spec.ts` and the added case in `tests/ui/desktop-shell.spec.ts`; the latter uses actual React controls with the existing synthetic transport fixture and opt-in `?mode=local&refined=1&conversations=1`. Widths: 834, 960, 1024, 1199, 1200, 1280, 1366, 1440 and 1920, both rail states, with a 390 px phone check. The browser journey includes New accelerators, utility roving focus, Esc/history, tenant cancellation and persistence, account-to-tenant handoff and preference isolation. These authored cases are not recorded as executed here: cloud setup and the browser guard reported missing Chrome. No new captures are available.

The source's New/account/tenant heights are 372/405/177 px at width 280; actual content follows permitted actions and full names. There is no registered quotation create action or ready Assistant destination. Help uses the existing page guide; Notification settings reaches Preferences through the existing Notifications page. Rail/menu/drawer replacements, search modes, further layers and situations remain in S2–S7. The accepted phone component remains unchanged. Existing review fingerprints are retained and stale reviews must remain visible.

### Refined desktop instructions — pending release

If you enable Refined desktop shell in your account profile, the desktop header shows a navy bar with Home, a company chip, centred search, the white New circle, utilities and your account. The preference follows this identity in this browser. Open Account → Preferences to turn it off. Your phone header stays the same.

Use the company chip or Account → Switch tenant to choose among your existing companies or All companies. Changing it still reviews unsaved work and narrows existing access. New shows available actions for the current workspace, then shared records; All record types reveals other permitted actions. Press N outside a field to open New; inside the menu D/L/A/C/O/S open an available deal/lead/activity/contact/organisation/site form. No record is saved until you review and save that form.

Tab reaches the utilities as a group; use Left/Right to move within it. Menu arrows and typing find entries, and Escape closes the menu and returns focus. Account → Keyboard shortcuts opens help; Help and page guide opens this page's guidance. Notification settings opens Notifications, where Preferences holds the settings. If sign-in details are unavailable, the account says so.

## foundations

`src/app/styles/shell-refined-tokens.css` maps all 66 PPO colour variables: 30 core, 12 person and 24 workspace accents. Extra translucent white and shadow tokens express the measured field and layer states. Header components use tokens and the existing Font Awesome Light kit; neither supplied logo artwork, Pro artwork nor the private design link is added. `tests/unit/shell-refined.test.ts` checks the actual header/menu text and marker pairings, including the composed translucent placeholder, independently of visual acceptance. Workspace accent tokens are not used as small text without separate contrast evaluation.
