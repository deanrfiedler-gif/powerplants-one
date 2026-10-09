---
document_id: PPO-UI-REVIEW-00-R01
title: Phase 00 UI review, session 1 — captures, automated checks and pre-review findings
revision: r01
date: 2026-10-09
owner: Dean Fiedler
status: Pre-review prepared by Claude; owner verdicts pending; no owner review recorded
source_commit: a52cb01c2249cc60bbf5a7d4f65c4899995bd8da
---

# Phase 00 UI review, session 1

Dean adopted the [UI build and review sequence](../../../decisions/ui-build-sequence.md) rules SD-01 to SD-05 on 9 October 2026 and asked to start the phase 00 review. This record holds the pre-review material for that session: the captures, the automated checks and Claude's findings, with a proposed verdict for each entry.

**These are proposals. The owner verdicts are Dean's to give.** No register entry records an owner review as a result of this file, and no review fingerprint is copied.

The same material is shown on the navigation canvas (version 29): the *Phase 00 review · summary and verdicts* and *Phase 00 review · captures and findings* boards.

## Method

- **Source:** a compiled build of `claude/serene-tesla-w6ud4q` at `a52cb01`, served by `npm run serve:compiled`.
- **Data:** a freshly reset, migrated and seeded `ppo_synthetic_test`, plus one synthetic lead created with the test fixture `leadCreate()` so the lead record could be captured. The leads register was also seen empty before that lead existed.
- **Browser:** Playwright headless Chromium 1194, locale en-AU, time zone Australia/Brisbane. Viewports 1440 × 900 and 390 × 844 (touch). Desktop captures are clipped at 2400 px; phone captures at 2600 px.
- **Profiles:** `coordinator` for office pages, `assigned-technician` for field pages, signed out for `/login`.
- **Accessibility:** axe-core 4.10.2 (WCAG 2.0/2.1 A and AA rules), injected for testing only and not added to the repository. The sign-in page's content security policy was bypassed for that injection.
- **Other checks:** horizontal overflow (scroll width minus client width), console errors, page errors, failed API calls (4xx/5xx), load time from navigation to settled content, and a scan for phone targets under 24 px.
- **Findings:** Claude inspected every capture and compared it with the shell contract, the record page pattern (AU-04), the navigation rules and the design tokens.

## Automated results

| Entry | View | Profile | HTTP | Load ms | Overflow | axe violations | Console | Failed calls | Small targets | Capture | SHA-256 |
|---|---|---|---:|---:|---:|---|---:|---:|---:|---|---|
| `route:/` | desktop | coordinator | 200 | 2344 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [home-desktop.png](captures/home-desktop.png) | `d5d43031ff60e6f3…` |
| `route:/` | phone | coordinator | 200 | 2193 | 0 | none | 0 | 0 | 0 | [home-phone.png](captures/home-phone.png) | `b2d925a9e7dbc441…` |
| `route:/login` | desktop | signed out | 200 | 1778 | 0 | none | 0 | 0 | — | [login-desktop.png](captures/login-desktop.png) | `e97abae2cdffe3ab…` |
| `route:/login` | phone | signed out | 200 | 1771 | 0 | none | 0 | 0 | 0 | [login-phone.png](captures/login-phone.png) | `3902b594f81ee9de…` |
| `route:/my-jobs` | desktop | assigned-technician | 200 | 2235 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [my-jobs-desktop.png](captures/my-jobs-desktop.png) | `1af06c6c85c80637…` |
| `route:/my-jobs` | phone | assigned-technician | 200 | 2078 | 0 | none | 0 | 0 | 1 | [my-jobs-phone.png](captures/my-jobs-phone.png) | `a1e746e777348d0a…` |
| `route:/my-jobs/[id]` | desktop | assigned-technician | 200 | 2004 | 0 | color-contrast (serious, 2) | 0 | 0 | — | [my-job-record-desktop.png](captures/my-job-record-desktop.png) | `27d548cd2c9763f8…` |
| `route:/my-jobs/[id]` | phone | assigned-technician | 200 | 2104 | 0 | color-contrast (serious, 1) | 0 | 0 | 3 | [my-job-record-phone.png](captures/my-job-record-phone.png) | `c3a8001e80a068c6…` |
| `route:/my-jobs/site-readiness` | desktop | assigned-technician | 200 | 2178 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [site-readiness-desktop.png](captures/site-readiness-desktop.png) | `17ecbf3c0df952e9…` |
| `route:/my-jobs/site-readiness` | phone | assigned-technician | 200 | 2160 | 0 | none | 0 | 0 | 1 | [site-readiness-phone.png](captures/site-readiness-phone.png) | `20fb8aefa818ee64…` |
| `route:/offline/index.html` | desktop | assigned-technician | 200 | 2036 | 0 | none | 0 | 0 | — | [offline-desktop.png](captures/offline-desktop.png) | `1da3f5f40ebe68fa…` |
| `route:/offline/index.html` | phone | assigned-technician | 200 | 1953 | 0 | none | 0 | 0 | 0 | [offline-phone.png](captures/offline-phone.png) | `50615d2be6c77fb2…` |
| `route:/sales/leads` | desktop | coordinator | 200 | 2193 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [leads-desktop.png](captures/leads-desktop.png) | `7b4f8e2a99a9ec5f…` |
| `route:/sales/leads` | phone | coordinator | 200 | 2130 | 0 | none | 0 | 0 | 0 | [leads-phone.png](captures/leads-phone.png) | `9f78223f21e8a577…` |
| `route:/sales/leads/[id]` | desktop | coordinator | 200 | 2187 | 0 | none | 0 | 0 | — | [lead-record-desktop.png](captures/lead-record-desktop.png) | `c222ae6d3d5ce0cd…` |
| `route:/sales/leads/[id]` | phone | coordinator | 200 | 2140 | 0 | none | 0 | 0 | 0 | [lead-record-phone.png](captures/lead-record-phone.png) | `3f1574ecd46b667d…` |
| `route:/sales/opportunities/new` | desktop | coordinator | 200 | 2082 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [opportunity-new-desktop.png](captures/opportunity-new-desktop.png) | `46db2b55e58bc7d5…` |
| `route:/sales/opportunities/new` | phone | coordinator | 200 | 2133 | 0 | none | 0 | 0 | 2 | [opportunity-new-phone.png](captures/opportunity-new-phone.png) | `8dfa17456cfc286e…` |
| `route:/sales/tasks` | desktop | coordinator | 200 | 2116 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [sales-tasks-desktop.png](captures/sales-tasks-desktop.png) | `229e45f635a0c6b1…` |
| `route:/sales/tasks` | phone | coordinator | 200 | 2124 | 0 | none | 0 | 0 | 0 | [sales-tasks-phone.png](captures/sales-tasks-phone.png) | `b127f2bd00371995…` |
| `route:/schedule` | desktop | coordinator | 200 | 2404 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [schedule-desktop.png](captures/schedule-desktop.png) | `07c0cfba4e5d5302…` |
| `route:/schedule` | phone | coordinator | 200 | 2157 | 0 | none | 0 | 0 | 8 | [schedule-phone.png](captures/schedule-phone.png) | `71ad3886923214e0…` |
| `route:/service/appointments/[id]` | desktop | coordinator | 200 | 2049 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [appointment-record-desktop.png](captures/appointment-record-desktop.png) | `be9e512bc26c15fe…` |
| `route:/service/appointments/[id]` | phone | coordinator | 200 | 1983 | 0 | none | 0 | 0 | 4 | [appointment-record-phone.png](captures/appointment-record-phone.png) | `59ec3b46e910cad6…` |
| `route:/work` | desktop | coordinator | 200 | 2255 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-desktop.png](captures/work-desktop.png) | `d5d43031ff60e6f3…` |
| `route:/work` | phone | coordinator | 200 | 2194 | 0 | none | 0 | 0 | 0 | [work-phone.png](captures/work-phone.png) | `b2d925a9e7dbc441…` |
| `route:/work/[id]` | desktop | coordinator | 200 | 2368 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-record-desktop.png](captures/work-record-desktop.png) | `a8b930688ef28779…` |
| `route:/work/[id]` | phone | coordinator | 200 | 2317 | 0 | none | 0 | 0 | 7 | [work-record-phone.png](captures/work-record-phone.png) | `4cf430ef8a1e61c3…` |
| `route:/work/actions` | desktop | coordinator | 200 | 2182 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-actions-desktop.png](captures/work-actions-desktop.png) | `09d1b3a6ebbf9ffa…` |
| `route:/work/actions` | phone | coordinator | 200 | 2237 | 0 | none | 0 | 0 | 0 | [work-actions-phone.png](captures/work-actions-phone.png) | `abd969df4a637364…` |
| `route:/work/new` | desktop | coordinator | 200 | 2145 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-new-desktop.png](captures/work-new-desktop.png) | `eea811d334b912e7…` |
| `route:/work/new` | phone | coordinator | 200 | 2041 | 0 | none | 0 | 0 | 2 | [work-new-phone.png](captures/work-new-phone.png) | `bc79d392bf5b93e1…` |
| `route:/work/reviews` | desktop | coordinator | 200 | 2217 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-reviews-desktop.png](captures/work-reviews-desktop.png) | `4996e2a65e789806…` |
| `route:/work/reviews` | phone | coordinator | 200 | 2151 | 0 | none | 0 | 0 | 0 | [work-reviews-phone.png](captures/work-reviews-phone.png) | `2bd55e94cda42c48…` |
| `route:/work/team` | desktop | coordinator | 200 | 2212 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-team-desktop.png](captures/work-team-desktop.png) | `9b2881210aba77c8…` |
| `route:/work/team` | phone | coordinator | 200 | 2094 | 0 | none | 0 | 0 | 0 | [work-team-phone.png](captures/work-team-phone.png) | `8e549b2d7aced16f…` |
| `route:/work/waiting` | desktop | coordinator | 200 | 2178 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [work-waiting-desktop.png](captures/work-waiting-desktop.png) | `b6f8d0bf3fc50cc4…` |
| `route:/work/waiting` | phone | coordinator | 200 | 2110 | 0 | none | 0 | 0 | 0 | [work-waiting-phone.png](captures/work-waiting-phone.png) | `05c5c0108a65dfca…` |
| `system:guidance` | desktop | coordinator | 200 | 2413 | 0 | color-contrast (serious, 3) | 0 | 0 | — | [guidance-desktop.png](captures/guidance-desktop.png) | `c2bee028237f064e…` |
| `system:guidance` | phone | coordinator | 200 | 2226 | 0 | color-contrast (serious, 2) | 0 | 0 | 3 | [guidance-phone.png](captures/guidance-phone.png) | `0b3931ae3b759c0b…` |
| `system:shell` | desktop | coordinator | 200 | 3155 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [shell-desktop.png](captures/shell-desktop.png) | `86474addf4dd36bb…` |
| `system:theme` | desktop | coordinator | 200 | 18534 | 0 | color-contrast (serious, 1) | 0 | 0 | — | [theme-desktop.png](captures/theme-desktop.png) | `4a491a6d8b12fd54…` |

Full hashes, axe node targets and the small-target list are in [browser-results.json](browser-results.json).

## Shared findings

| ID | Finding | Detail | Affects |
|---|---|---|---|
| S1 | Search shortcut hint fails contrast | The Ctrl K hint in the header search fails WCAG 1.4.3 contrast (axe: serious) on 18 of 19 signed-in desktop pages. One fix in the shell clears every page. | `system:shell` |
| S2 | Two phone header patterns | My Work and Reviews use a menu button and title; Schedule, My jobs, Leads and record pages use the logo tile, an ellipsis and a smaller title. Use one phone header everywhere. | `system:shell` |
| S3 | Floating add button covers content on phones | On My Work the + button hides the end of the Today empty-state text. Pages with the floating button need bottom padding equal to its height. | `system:shell`, `route:/work` |
| S4 | Standalone links under 24 px tall on phones | Back links (← My Work, ← My Jobs), record number links and guide links are 16 to 23 px tall. WCAG 2.2 2.5.8 needs 24 px for targets outside running text. | `system:shell` |
| S5 | Developer and audit wording shown to users | Version counters (Appointment v3 · Crew v2), 'Server checks all reservations' in every planner cell, storage byte counts, 'Native capture and this link save separately', and source-window notes on Reviews. Keep the rule, say it in plain language or move it to the page guide. | `route:/schedule`, `route:/service/appointments/[id]`, `route:/work/[id]`, `route:/work/reviews`, `route:/work/waiting`, `route:/offline/index.html`, `route:/my-jobs/[id]` |
| S6 | Dates and times are formatted several ways | '4 Sep' and '4 Sept 2026' on one page, a numeric 09/10/2026, same-day ranges that repeat the date, and the raw zone name Australia/Brisbane. Use one formatter: Fri 4 Sept 2026, 10:00 am; same-day range 10:00 am–12:00 pm; 'Brisbane time'. | `system:theme` |
| S7 | Header icons are hard to tell apart | An info icon (page guide) and a question icon (help) sit side by side, a ruler icon opens development tools, and an ellipsis means both 'expand navigation' and 'more'. Give each a distinct icon and a visible tooltip. | `system:shell` |
| S8 | Older forms and record pages predate the record page pattern | Create activity, Add deal and the activity record use the earlier layout: technical fields first (Company visibility context, Content access, Visibility company), native blue checkbox, small primary buttons, no Cancel, raw record numbers instead of names. Rebuild on the record page pattern (AU-04) and theme controls. | `route:/work/new`, `route:/sales/opportunities/new`, `route:/work/[id]` |
| S9 | The My Work page guide is a placeholder | It says the guide 'is being prepared', shows a 'Development draft guide' disclosure and the internal label r17. Home and My Work are the first pages people open; their guide should exist now rather than wait for DK-07 in phase 10. | `system:guidance` |

## Entries, proposed verdicts and owner verdicts

| Rank | Entry | Title | Claude proposes | Findings | Owner verdict |
|---:|---|---|---|---|---|
| — | `system:guidance` | Contextual guidance | Refine | S9: write the Home and My Work guides now. The panel itself works on desktop and phone. | Pending |
| — | `system:offline` | Offline and recovery | Refine | The offline workspace uses its own green palette and type, not the PPO tokens. Technical copy (byte counts, 'only an actual server response proves acceptance') needs plain language; keep the rules. | Pending |
| — | `system:shell` | Application shell | Refine | S1, S2, S4 and S7 are all fixed here once and carry to every page. The new working-company pill and grouped Service rail render as intended. | Pending |
| — | `system:theme` | Theme and shared controls | Own session (component catalogue) | The component catalogue lists 41 components with reviews pending or stale. A theme verdict needs its own catalogue session rather than one capture. S6 (one date and time formatter) belongs here. | Pending |
| 1 | `scope:SH-01` | Role-based home overview | Accept | Home sends this identity to My Work as designed (navigation consolidation rule). Content findings sit under My Work. | Pending |
| 1 | `route:/` | Home → permitted work | Accept | Redirects to /work for an identity with activity.read. | Pending |
| 1 | `route:/login` | Login | Accept | Clear, branded and responsive. Microsoft sign-in is correctly shown as unavailable locally. | Pending |
| 1 | `route:/sales/leads` | Leads | Accept | Empty and populated states are both clear. Phone: the warning triangle on a lead has no visible meaning; add a label. Phone empty-state text failed contrast in the empty run. | Pending |
| 1 | `route:/sales/leads/[id]` | Lead detail | Accept | The drawer over the register keeps context; Convert to deal is clear. The close button's focus ring is a heavy square unlike the theme focus ring. | Pending |
| 1 | `route:/sales/opportunities/new` | Create opportunity | Refine | S8. Deal title should come before Qualification outcome. 'Unsaved' and the pipeline line are plain text with no visual status. | Pending |
| 1 | `route:/work` | My Work · Overview | Refine | Desktop: activity titles wrap to three lines because the Complete and Reschedule buttons take the row width; give the title column priority. The count badge in 'Needs a next activity' drops to its own line, unlike the other cards. Phone: the 'Weather is not connected' card takes prime space for a feature that is not configured; hide it until connected. Phone: the five quick actions are icons without labels. S3. | Pending |
| 2 | `scope:SH-02` | My Work action centre | Refine | Follows its overview, reviews, new-activity and record pages below. | Pending |
| 2 | `route:/sales/tasks` | Sales Tasks | Refine | Pagination buttons show with no tasks. The sub-tabs offer Deals and Leads but not Tasks, so no tab is active. S6: the zone name appears in each count line. | Pending |
| 2 | `route:/work/[id]` | Activity detail | Refine | S8 and S6. An overdue activity does not say it is overdue. Linked records show as raw numbers first, names second. | Pending |
| 2 | `route:/work/actions` | My actions | Accept | Clear grouping by Overdue and Date needed. Only S1 applies. Activity titles do not open the activity record; confirm the drawer or inline detail is the intended route to /work/[id]. | Pending |
| 2 | `route:/work/new` | Create activity | Refine | S8. The My Work side navigation disappears on this page, unlike its siblings. Lead with the purpose and owner; move company and access class later with plain labels. | Pending |
| 2 | `route:/work/reviews` | Reviews and handovers | Refine | The header says 'Approvals & handovers'; the page and navigation say 'Reviews & handovers'. Heading size, breadcrumb and filter control sizes differ from the other My Work pages. Tab counts read '(0+)'. Phone: tabs wrap over three rows. S5 and S6 in the footer note. | Pending |
| 2 | `route:/work/team` | Team queue | Accept | Clear owner summary and consistent filters. | Pending |
| 2 | `route:/work/waiting` | Blocked & waiting | Accept with minor fixes | S5: the dashed note describes implementation coverage ('Sales records no waiting request of its own yet'). Rephrase or move to the guide. | Pending |
| 3 | `scope:SV-04` | Appointment coordination detail | Refine | Follows its appointment page. | Pending |
| 3 | `route:/service/appointments/[id]` | Appointment detail | Refine | The action buttons touch the 'Current crew' heading; add the standard section gap. S5 and S6. | Pending |
| 4 | `scope:PL-01` | Service planner and unassigned demand | Refine | Follows the planner. | Pending |
| 4 | `route:/schedule` | Service planner | Refine | The planner opened on 22 Sept 2031 rather than the current week. Check whether this follows the seeded booking or a default. S5: each day cell repeats 'Server checks all reservations'. Phone: tabs and filters fill the first screen before any booking appears. The date field showed mm/dd/yyyy in the test browser; confirm on a real Australian device. | Pending |
| 5 | `scope:FI-01` | Technician Today and job execution | Accept with minor fixes | Follows My jobs and the job page. | Pending |
| 5 | `route:/my-jobs` | My Jobs | Accept with minor fixes | S6: the same-day visit repeats its date and wraps '12:00 pm' on phones. The Open field job button uses a teal outside the PPO primary colour. | Pending |
| 5 | `route:/my-jobs/[id]` | Technician job detail | Accept with minor fixes | The sticky Start work bar works well. 'Can't start yet' appears twice (chip and bar). S5: the timer explanation is internal wording. | Pending |
| 5 | `route:/my-jobs/site-readiness` | Site induction, risk and biosecurity review | Accept with minor fixes | The header says 'Field site readiness' (truncated); the page says 'Site readiness'. S4 back link. | Pending |
| 6 | `scope:FI-02` | Offline downloads, queue and conflict recovery | Refine | Follows the offline workspace. | Pending |
| 6 | `route:/offline/index.html` | Offline workspace | Refine | See system:offline. Deliberately standalone so it works without the network, but it should still use the PPO tokens. | Pending |
| 7 | `scope:FI-07` | Customer attendance and report response | Later phase (with SV-06, phase 04) | Its pages (/service/reports) sit in phase 04 by their own rank. Review it with SV-06 there. | Pending |

## Limits

- Captures come from one synthetic dataset, one desktop and one phone viewport, and a headless browser. They are not physical-device, screen-reader or operational acceptance.
- axe finds only machine-detectable WCAG failures. Keyboard order, focus visibility across flows and plain-language quality need human review.
- The date input showed mm/dd/yyyy in the test browser. Confirm the format on a real Australian device before treating it as a defect.
- The planner opened on 22 September 2031. Whether that follows the seeded booking or a default is not yet established.
- Load times are local compiled-build figures on a lightly loaded machine, not a performance claim.
