# Scheduling & Resources — verification evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 24 September 2026 · **Review:** implementation evidence; owner acceptance pending.

Original main: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. Reconciled main: `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb` (#299, #300 and #304).
Verified Scheduling runtime: `de1fcb65581f3e0bbdfd8b8e27bfa4f8ef05ca0a`; screenshot test/helpers: `8a717d0`.
Merge `44420ad50ebfc18352a33a94b4195c25d6e4469a` preserves Service I4 and changes no Scheduling runtime.
Implementation, automated proof, visual inspection, owner acceptance and deployment are separate.

## Environment

Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 and maintained Chrome 154.0.8037.58. Repository browser/PDF guard passed. Task-owned loopback clusters used only `ppo_synthetic_test`: regression port 55475, browser fixtures 55476; compiled preview 3134. No production data or external services.

The private document store uses its canonical Windows path with the existing guard enabled. Turbopack rejected a node_modules junction, so the worktree received its own offline installation from the unchanged lockfile.

## Executed checks

| Check | Actual result |
|---|---|
| Focused Scheduling units | 6 passed, 0 failed |
| New Scheduling database suite after final read-contract fixes | 5 passed, 0 failed; 162.8 seconds |
| Planner, Quality/Planner, demand and new Scheduling database suites | Initial 34 cases: 28 passed, 6 setup-timeout failures. After bounded setup correction all 6 affected cases passed in a targeted rerun. All 34 have observed passes across runs; not one clean 34-case run |
| Compiled browser: scheduling-workspaces, planner, pl01, field-technicians | 36 passed, 0 failed, 3.0 minutes, desktop/phone at `240308863b14a45d6c3bafb1fd06b8ef7d66d604` |
| Final scheduling-workspaces desktop/phone rerun | 14 passed, 0 failed, 2.3 minutes; compiled runtime `de1fcb6`, capture assertions `8a717d0` |
| Required npm run check | Studio, lint and TypeScript passed. Units: 391 total, 384 passed, 7 failed; chain stopped before build |
| Separate npm run build | Passed on final Scheduling runtime `de1fcb6`, then passed again after main reconciliation at `44420ad` |
| Final foundation / prototype / naming / studio | All passed after reconciliation and evidence publication; foundation preserves all 78 parent requirements. Studio: 277 entries, 25 components, 19 runnable examples, 123 routes; 277 unreviewed, 0 stale |
| Reconciled lint / TypeScript | Both passed |
| Native Chrome 200% zoom | Five pages: outer 1440 × 960, inner 711 × 432 CSS px, devicePixelRatio 2, visualViewport.scale 1, no document horizontal overflow |

New database coverage includes resource/site permissions, anonymous busy reservations, calendar/skill evidence, denied identity, actual cross-domain fixtures/provenance, unknown effort, deduplication, analytical no-write behaviour, proposed-window requests, exact selected-resource focus, accept/retry/history, changed contact consequences and stale writes. Existing scheduling suites supply booking, conflict, request lifecycle and recovery regression.

Local browser runs used the maintained Chrome projects, one worker, explicit compiled-server ownership, port 3134, and 90-second test / 15-second assertion allowances on this loaded Windows host. The viewport loop has its own 180-second bound. Application controls and browser version gates were not weakened. The final 14-case attempt initially started before the external preview was ready: seven desktop connection refusals then seven phone passes. After readiness, all 14 passed. The failed start is not counted as an application pass.

## Baseline failures and corrections

All seven required-unit failures reproduced in a separate unmodified worktree of inspected main `ca006fb1`. Their relevant source/test files remain unchanged through reconciled main:

- Two Azure demo operator CLI startup tests exceeded 15-second subprocess deadlines.
- Two P06 document-store tests encountered Windows canonical-path/filesystem expectations.
- One P12 recovery test encountered the private-path guard's Windows behaviour.
- One route-warmup test expects POSIX path separators.
- One launcher guard test exceeded its five-second subprocess deadline.

Baseline comparison: 20 cases, 14 passed / 6 failed; separate foundation comparison: 4 cases, 3 passed / 1 failed. Together these reproduce all seven. **The required command is not green.** No path guard or security assertion was removed.

Synthetic seed originally exceeded the ten-second query limit while reading PostgreSQL timezone data; unchanged main reproduced this. A later reset also exceeded it under load. `scripts/database.ts` now sets a transaction-local 120-second statement limit only for explicit synthetic reset/seed administration; application queries retain ten seconds. Local database proof used a 300-second test bound. Reset name/consent guards, atomicity, durability and migrations are unchanged. Disabling JIT was investigated, did not solve this and was reverted.

Initial browser checks exposed ambiguous test selectors, a short read assertion and a local deadline after confirmation had already committed. Retrying without reset correctly encountered the existing reservation guard. A clean synthetic reset preceded the successful 36-case run. Visual review found a phone shell utility overlap; scoped containment and a header geometry assertion now cover the Scheduling pages. Final read-model review added captured appointment skills and verified selected site/resource against exact focused requests.

No full repository database, HTTP, browser or demo-upgrade sweep was run locally. Focused local evidence and PR CI are distinct.

## Visual evidence

[Manifest](manifest.json) records 44 original PNG captures, 22 explicitly marked as manually inspected, with dimensions, SHA-256, source and actual manual inspection. Images are browser output, not edited composites. All five pages were captured at 1440 × 960, 1024 × 768, 390 × 844 and 320 × 844. A separate 720 × 480 reflow exercise is not called native zoom.

[Capture helper](capture-zoom.mjs) reproduces actual 200% Chrome zoom in an isolated synthetic profile using its default partition preference, then validates CSS/device metrics. [Chromium's implementation](https://chromium.googlesource.com/chromium/src/+/114.0.5735.90/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc) identifies the preference. CDP captures the native surface to avoid Playwright cropping at this zoom; retained images are 1422 × 864 physical pixels.

Review checks shell/scroll ownership, controls, wrapping, phone comparisons, long labels, source-state wording, explicit travel and Unknown effort. Browser tests separately prove keyboard actions, focus return, failed/denied reads, exact handover and non-mutating scenarios. Physical-device, screen-reader and independent accessibility acceptance were not performed.

Retained source: `docs/reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html`, SHA-256 `def8ebed4adc4f41b41bbfe954f8286e1162a23bf0f734fc3007c9aef78cf6d5`. Bytes unchanged; desktop capture inspected. This is a proposed module reference, not an accepted whole native shell baseline. Current authorised work-order demand supersedes its Proposed-appointment lane. PL-02 full detail, PL-03 and PL-05 have no exact issued mockup. Existing Field Team and native shell remain authoritative.

## Review and delivery limits

Affected register visual statuses remain Needs review, guides Draft, review fingerprints unset, deployment Not verified. Tests and captures do not grant owner approval.

Effort, net capacity/utilisation, certificate/renewal evidence and unconfigured route estimates remain Unknown. Reservation totals count whole included buffered reservations once per crew member; they are not horizon-clipped labour estimates. Cross-domain owner-to-resource mappings are not invented. Bounded Project/Engineering reads disclose partial/unavailable source state. Calendar/competence editors remain out of scope.

No migration, grant, live routing/integration, customer message, merge or deployment is delivered. Exact final PR head and CI status are reported in the handover response and GitHub. Local evidence does not replace required CI or business review.
