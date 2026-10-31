# Travel review PL-05 implementation and evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation and capture inspection: Codex, 31 October 2026. Branch: `codex/travel-review`; [PR #806](https://github.com/deanrfiedler-gif/powerplants-one/pull/806). Accepted source: [Travel review decision](../../../decisions/travel-review-figma-design.md), D1–D5/Q1/Q2 and [six retained r01 captures](../../../reference/ui/service/travel-review-design-r01/README.md). Existing scheduling parent IDs and interfaces remain unchanged.

## Functional proof

| Check | Result |
|---|---|
| Focused Travel plus existing Scheduling model tests | 16 passed, including signed-in/conflict/default choice, permission-scoped choices, half-open per-segment block/closure overlap, zero allowances, immutable comparison, reset and non-adjacent reversals |
| Final Travel browser scenarios | 10 passed across desktop and mobile Chrome; keyboard comparison, zero API writes, exact handover, 320 px containment, empty/limited resources, failed/denied refresh, retry and stale reads |
| Existing Scheduling browser specs, unchanged | Final unchanged 24-case run: 17 passed, 7 failed (9.3 minutes). Both existing Travel-specific scenarios passed on desktop/mobile. Main comparison and exact remaining failures are below; full regression proof is not green |
| Typecheck with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` | Passed after final visual and test refinements; earlier full and incremental runs also passed |
| Lint | Passed after final source and test refinements |
| `npm run studio:check` | Passed after final source refinements: zero errors; 346 unreviewed and 26 stale records remain explicitly unaccepted |
| Foundation, naming, status fragment checks | Passed: foundation (14,078 links, 7,400 text files), naming (804 records) and status (182 fragments); zero errors |

The browser proof used the repository Chrome/PDF guard, desktop and mobile project settings, one worker and unchanged existing assertion deadlines. Twenty exercised page/API routes were warmed with the repository warm-routes helper (zero unreachable); the global warm-up dependency was replaced locally with that bounded preparation. Earlier full warm-up attempts were interrupted while compiling unrelated document pages under Windows memory pressure. The first browser setup attempt could not reach the copied local database configuration; a task-owned disposable PostgreSQL cluster running `ppo_synthetic_test` then received the existing migrations and synthetic seeds. No migration or seed was authored.

Earlier focused runs passed before final polish. One later new-test run hit the initial identity-loading state; the new Travel tests now explicitly establish identity and shell permissions before testing the synthetic route. A malformed nested error fixture was corrected to the existing top-level API error contract, and the actual unavailable/denied alert text is asserted. The final ten-case run passed in 5.8 minutes. This setup change did not modify either existing Scheduling browser spec.

Real npm ci completed without engine override or junction (Node 24.22.2 / npm 11.19.0). No capability, grant, dependency, endpoint, booking command or production connection was added. The task owned loopback dev port 62986; the baseline used 49769. Both servers and the task-owned PostgreSQL cluster were stopped after proof. Synthetic response fixtures are presentation proof, not operational rules.

## Unmodified-main comparison

Current main remained `1402c87b9069def4dcd4d82f291cd991cff40ca5`. A detached reference inside the task's ignored temporary directory has its own real npm ci and clean tracked files at this SHA. The same 20 routes warmed successfully on its own port 49769. The 12-case main comparison finished with 9 passed and 3 failed in 6.3 minutes. All six desktop cases passed. Mobile Field Team timezone reload (line 80), change-request Rejected status (line 235) and the initial capacity Scenario comparison heading (line 245) failed. The timezone and rejection failures match the original Travel-run mobile failures exactly; the capacity assertion matches the original desktop failure but occurred on mobile on main. Both unchanged specs were then rerun on Travel; their final results follow. Initial mixed-run failures:

| Existing scenario | Desktop | Mobile |
|---|---|---|
| Field Team date/site/timezone reload and return | Review timezone control absent while identity loaded | UTC selection reverted to Australia/Melbourne after reload |
| Changes queue and selected appointment handover | Initial selection control absent | Initial selection control absent |
| Native viewport/zoom-width reflow | Loading indicator remained at assertion deadline | Passed |
| Travel exact handover and return | 45-second test deadline exceeded | Passed |
| Change-request comparison and reasoned decision | New request comparison absent | Rejected state absent at assertion deadline |
| Failed/denied capacity reads | Initial scenario heading absent | Passed |

The final Travel-branch rerun warmed all 20 routes successfully again and ran both unchanged specs in full. It passed 17 and failed 7. The earlier mobile timezone failure passed on this rerun. Current failures are:

| Project and scenario | Exact failed assertion | Main comparison |
|---|---|---|
| Desktop Changes return | `#scheduling-review-heading` after Back to scheduling review, refinement line 138 | Main follow-up failed earlier at initial selection (line 118); exact return-heading failure remains unconfirmed |
| Desktop native reflow | `.changes-read` remained Current results unconfirmed, workspaces line 54 | Main passed twice; remains unconfirmed |
| Desktop resource detail | Competence and evidence heading, workspaces line 106 | Main follow-up passed; remains unconfirmed |
| Desktop change request | Rejected status, workspaces line 235 | Reproduced at the same assertion on unmodified main desktop and mobile |
| Mobile Changes queue | Initial selection absent, refinement line 118 | Reproduced at the same assertion on unmodified main desktop and mobile |
| Mobile change request | Rejected status, workspaces line 235 | Reproduced on unmodified main mobile |
| Mobile capacity failed/denied setup | Initial Scenario comparison heading, workspaces line 245 | Reproduced on unmodified main mobile |

A further four-case desktop main probe passed native reflow and resource detail, and failed Changes initial selection (line 118) and Rejected status (line 235), in 2.1 minutes. The final one-case main mobile probe also reproduced Changes initial selection (line 118, 11.5 seconds). Four of the seven final failures therefore reproduce at the same assertion/project on main; the exact desktop return-heading, reflow-read and resource-heading failures are not classified as unrelated.

The Resource and Changes implementations and both existing specs are byte-identical to main. That observation does not classify an unconfirmed failure as unrelated. Low Windows free memory was observed during validation, but causation is not established. Raw browser traces remain ignored local artifacts; no session-bearing trace is committed.

## Native captures and visual inspection

Codex inspected the six accepted source images and the retained native views at 1440, 1024, 390 and 320 px, including scrolled visit/summary content, comparison and empty/error states. The native captures are viewport-sized views of the application's own scroll region, not stitched full-route images. [Capture dimensions and SHA-256 hashes](travel-review/captures.json) identify the 17 retained PNGs. Font Awesome kit loading was disabled before this capture run; only local fallback icons are present. One live Figma design-context read timed out; no design edit or asset download was performed.

| Accepted frame | Native route | Later visit | Summary |
|---|---|---|---|
| Desktop 1440 × 900, 1371:3524 | [Route](travel-review/travel-route-1440.png) | [Visit](travel-review/travel-route-end-1440.png) | [Summary](travel-review/travel-summary-1440.png) |
| Tablet 1024, 1371:3653 | [Route](travel-review/travel-route-1024.png) | [Visit](travel-review/travel-route-end-1024.png) | [Summary](travel-review/travel-summary-1024.png) |
| Phone 390, 1371:3722 | [Route](travel-review/travel-route-390.png) | [Visit and return](travel-review/travel-route-end-390.png) | [Summary](travel-review/travel-summary-390.png) |
| Phone 320, 1373:1604 | [Route](travel-review/travel-route-320.png) | [Visit and return](travel-review/travel-route-end-320.png) | [Summary](travel-review/travel-summary-320.png) |

Comparison 1373:1001: [start](travel-review/travel-compare-1440.png) and [reversal warning](travel-review/travel-compare-end-1440.png). Phone states 1371:3758/1371:3800: [no visits](travel-review/travel-empty-390.png), [could not load](travel-review/travel-failure-503.png), and the undrawn [denied read](travel-review/travel-failure-403.png).

The inspection found and corrected a wrapped tablet toolbar and oversized failed-read controls. The final tablet controls stay on one row; phone actions remain in two rows; 320 px uses the short Travel title, wrapped visit header and no visible read clock. Route content and summary remain readable without horizontal page/workspace overflow. Visual acceptance is not claimed.

## Differences from the accepted frames

- **Navigation and shell:** current Scheduling tabs/navigation remain under the authorised initial-preflight fallback. No Service planner branch/PR existed at that check; [Service planner #808](https://github.com/deanrfiedler-gif/powerplants-one/pull/808) opened at 09:44:50 UTC, after Travel's claim at 09:42:20 UTC. Its optional side-navigation prop preserves the default; [shared-file overlap was notified](https://github.com/deanrfiedler-gif/powerplants-one/pull/808#issuecomment-6542684131). The captured shell retains the expanded primary rail at 1024, horizontal Scheduling tabs, grey workspace background, current top-bar actions and four-item phone bar with Schedule selected, rather than the proposed side menu/More selection. These alter usable width, vertical spacing and visible route length. No shared CSS root-ID list was extended; no SecondaryMenuFrame opt-in is needed for this retained layout.
- **Source facts:** no depot identity is returned, so endpoints explicitly say depot not supplied and a note identifies boundary times as allowance boundaries, not confirmed departure/arrival. Inter-site labels describe the compared order, not a provider result. Blocks supply a kind and interval, not the frame's toolbox-talk name; closures additionally expose any supplied reason. The heading uses the returned Technician type rather than inventing a lead role.
- **Controls and fixture:** native date and IANA timezone controls replace the frame's abbreviated day/AEST controls. Site filtering uses a disclosure; phone timezone also lives in Filters. Refresh is text on desktop and a fallback glyph at tablet/phone widths. Read metadata uses the returned observation time and hides its visible clock at tablet/320 widths. The synthetic fixture uses 22 September 2031, an explicit customer, Casey as the assigned crew and missing customer windows, rather than copying unsupported story fields into live data.
- **Card and summary detail:** cards retain customer, crew, site timezone and full source dates outside the selected local day. These labels and missing-source notes make the route taller. Gaps show duration without asserting route sufficiency. The summary separately lists closures, counts overlapping blocks/closures and reservation overlaps, and exposes unreviewed bases/reversals. Paired buffers are called allowances rather than measured trips. Busy intervals occupy separate lines. Original/compared positions appear below the retained source details.
- **Shared presentation:** current shared status chips, warning tokens, borders, control variants and fallback icons differ from the frame's neutral status tags and placeholders. Travel bands reuse the actual planner's `tl-travel` tint. No Font Awesome Pro artwork is copied.
- **Empty and failed reads:** the empty card contains the planner link and no route/summary; the day remains in the toolbar instead of repeating it in the body. Failed reads withhold person choices and show compact date/filter controls, the source error in the shared focused alert and Retry loading. This differs from the frame's retained person selector and generic error copy. Loading, denied and unavailable-explicit-person states use the same existing read controls.
- **Default fallback:** if no permitted conflict or linked signed-in technician exists, choose the first permitted person. An unavailable explicit selection stays unavailable. This completes the coordinator/no-conflict case without name matching or an all-resource comparison.

## Separate statuses

Functional proof: 16 unit and 10 focused Travel browser cases passed; required repository checks passed. The unchanged Scheduling run is not green (17 passed, 7 failed), and exact unmatched failures remain open. Hold merge until those failures have a verified disposition and the full merge gates hold. Visual comparison: native captures inspected against retained accepted frames, with differences above; no visual acceptance. Owner acceptance: accepted design only, implementation not accepted. Physical-device, assistive-technology and native-browser 200% zoom review: not performed. Full database/upgrade/HTTP suites and a production build were not run for this client-only change. Deployment: not performed. Claude exact-head review and every merge gate remain required.
