# Return-journey timer boundary verification

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Executed:** 28 September 2026 (Sydney; CI timestamps are UTC). **Status:** Focused synthetic fixture correction verified locally; no runtime, policy, owner-acceptance or deployment change.

## Original post-merge failure

After the protected integration of #322/#323/#324, the `main` push at `a3b5d49e47d70e85840594cb4259a595d24b125c` recorded a new mobile failure in [run 36326775139, job 108640939566](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36326775139/job/108640939566). This is distinct from the [corrected CR05 record-read races](../cr05-reload/README.md). The reviewed PR heads and the same focused lane on documentation PR #325 passed; those passes do not erase this later failure.

The return helper waited five seconds for `Saved completion draft v1`, but the retained page showed **Stopped**, **zero saved intervals**, and **Record your time evidence or explicitly declare None**. The final completion POST returned HTTP 422 in 40.44 ms, after the Stop command returned HTTP 201 in 30.99 ms. This was a validation refusal, not a slow completion response. The gateway paths are redacted and the CI archive excludes raw trace ZIPs; the full original command timestamps are not available from that archive.

`timerInstant` rounds the initial instant up past millisecond arrival. The timer deliberately creates no Time entry when Stop has that same whole-second instant. Fast automation can finish the intervening photo/checklist actions before the next representable second. The helper nevertheless selected `AllRecorded` and assumed one time entry. Existing zero-second database coverage confirms that the server is enforcing the intended contract.

## Controlled reproduction and correction

A diagnostic copy of the original helper used the real compiled application and disposable database, fixing only the return page's clock to the saved timer start immediately before Stop. Start and Stop were both `2026-09-27T16:08:11.000Z`; Stop returned 201/Stopped, and completion returned 422/`DeclarationConflict`. The unchanged heading assertion failed. This reproduces the invalid fixture without modifying the server's time rules or substituting a successful completion. Its clock intervention is private diagnostic code, not committed test behaviour.

Correction `e38c1f76d9c0a5bc4e391013371233367703e6e8` waits, within the existing assertion budget, until the browser's real clock can capture a positive whole-second interval. It then requires one visible server-saved time row and one attributable persisted Time entry with positive elapsed seconds. Completion saving uses the existing exact POST/receipt helper before the unchanged heading assertion. Retained return evidence now includes the exact timer entry, endpoints and elapsed seconds. No sleep, timeout increase, synthetic quantity, declaration waiver or application change is introduced.

The first corrected run completed the phone journey with a seven-second saved interval. Its desktop case stopped earlier in the unchanged initial preparation helper: no acknowledgement POST followed the pointer click. The retained local trace records `data-compact="0"` at the click and `data-compact="1"` immediately afterward. Playwright measured the button before its automatic scroll changed the timer header layout. Correction `02fd842ee9c18d6cafd9050adff88c3fde07d3e8` applies the existing return-visit pattern to that initial step: explicitly scroll, observe compact layout, then perform the same pointer click and exact response check. No geometry assertion or business check is removed.

## Verification boundaries

- Four existing timer units and three real PostgreSQL boundary/upgrade cases passed, including the intentional zero-second/no-entry contract.
- The original same-second control failed as intended; the first corrected phone journey passed. The separate initial desktop acknowledgement failure remains retained.
- Both final desktop/phone journeys passed on helper source `02fd842`, preserving the exact earlier outputs and completing separate return reports. The [manifest](manifest.json) retains their actual positive timer intervals, private evidence hashes and source/build pins. Fresh PR CI remains a separate integration gate.
- Matching-source type checking, full lint, foundation/prototype/naming and design-register assurance passed. The register retains 321 entries, 167 routes and 29 components, with all 321/29 reviews pending and no stale records. The return helper passes formatting. The initial preparation helper has a pre-existing full-file Prettier warning, confirmed against its unchanged committed source with an empty ignore file; unrelated formatting is preserved.

Runtime and database source still match `89faa078a22525653e6e8f07cb82425372385b07`; the retained compiled build is `UZPI1x18dLnHDUDBsGSWz`. The control listener was PID 33060, the first corrected listener PID 34180, and final verification uses PID 37580. Each executed browser run followed HTTP 200 readiness and ownership verification; local Playwright configuration has `webServer: undefined`. An early final-launch readiness probe refused to proceed before the listener was available; testing began only after readiness succeeded. No development fallback was started.

Only this task's loopback port-55440 `ppo_synthetic_test` and private document directory were reset, with its application stopped first. Earlier return/update proof environments, issued snapshots and unfinished worktrees remain intact. Logs, raw traces and complete synthetic journey captures remain private and distinguish original failure, diagnostic control, intermediate results and final proof. Functional proof is separate from visual review, owner/device acceptance and production readiness. PT-27, complete PT-28/PT-30 and the planned API-C26/EVT-12 publication increment remain open.
