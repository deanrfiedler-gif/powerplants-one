# PL-04 Changes and follow-up implementation evidence

Owner visual review: **pending**. Design authority: [accepted PL-04 decision](../../../decisions/changes-follow-up-figma-design.md). Implementation boundaries and open questions: [implementation record](../../../decisions/changes-follow-up-implementation.md).

Live Figma frames were inspected for every desktop, tablet, phone and state frame listed in the page contract, including the notes and index. The named version is **Changes and follow-up — accepted** in **PPO - Design**. Retained icon-free references remain unchanged.

## Execution

Verification snapshot: 21 October 2026. Delivery PR #649 contains the implementation; merged PR #644 contained only the early claim/status entry. Owner review is not inferred from either PR.

| Check | Result |
|---|---|
| `npm run browser:check` | Passed: Chrome 155.0.8059.85, Node 24.22.0, Playwright 1.64.0. |
| Focused unit tests | Final run: 10 passed across `changes-follow-up`, `navigation-safety` and `component-catalogue`. |
| `tests/browser/changes-follow-up.spec.ts` | Final run at `242b6e9`: all 6 passed in 1.5 minutes against the running app with synthetic API fixtures. Desktop compact geometry and responsive controls are asserted. |
| `python scripts/check_naming.py` | Passed; all 78 parent scope IDs retained. |
| Foundation | CI passed at `0313e682`; local run interrupted under memory pressure. |
| Full unit suite | Interrupted under local memory pressure. The four observed operator CLI/CPQ timeout failures reproduced in a targeted unchanged-main run (21 passed, 4 failed). The catalogue failure was an implementation defect, subsequently corrected. No full-suite pass claimed. |
| Database tests | Blocked by connection refusal on the configured local test endpoint, also reproduced on unchanged main. No server test pass claimed. |
| `npm run studio:check` | Passed locally after correcting the catalogue dependencies; CI also passed at `0313e682`. |
| `npm run typecheck` | Local runs found and led to corrected own errors; final local run interrupted. CI's merged-tree typecheck passed at `0313e682`. The subsequent code change is CSS and a browser geometry assertion. |
| `npm run lint` | Initial full run found three own errors, corrected. Full local rerun interrupted; final ESLint run over every changed TypeScript/TSX file passed. Full CI result remains pending. |
| `npm run build` | Failed on this branch and unchanged main: Turbopack rejects the external `node_modules` junction. Pinned production build proof remains with CI; no local build pass claimed. |
| Status and build sequence | `python scripts/build_status.py` and `python scripts/build-ui-sequence.py` ran successfully. Build sequence outputs remain generated under ignored `tmp/`, as the repository workflow specifies. |

The unchanged-main comparison used `0685e30c99d3146005f7699345623d5c5476942d` in a separate worktree. The local dependency junction supplies Next 16.4.0 and Playwright 1.64.0, behind the lockfile's 16.4.2 and 1.64.1. CI uses the pinned install. Local memory pressure interrupted broad checks; they are not reported as passes.

The configured local synthetic database port refused the connection. No database outcome is inferred from browser fixtures. Browser fixtures use the running application with synthetic API responses and block the licensed icon Kit; they do not establish server authority or business acceptance.

The broader [compiled-application CI job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39509143440/job/118926473204) stopped during browser installation, before its build/test proof: stable Chrome was `156.0.8078.47`, whereas the existing runtime guard permits reviewed majors 153–155. The guard also rejects that recorded version on unchanged main; this is a direct guard reproduction, not a rerun of the complete CI job. The browser guard and installer are unchanged in this PR. Browser runtime approval remains a separate maintenance change. Full CI success is not claimed.

## Visual comparison

Application captures are in [images](images/), made from source commit `242b6e9` with `tests/helpers/changes-follow-up.ts` and the real application shell. The browser spec blocks Kit requests, asserts no licensed icon nodes and waits for fonts before capture. These are current implementation evidence, not replacements for the accepted reference. The final set includes the compact-cell and toolbar corrections.

| Accepted frame/state | Application capture |
|---|---|
| `1326:4561`, desktop queue 1440 × 900 | [Queue](images/queue-1440.png) |
| `1326:4656`, selected request 1440 × 900 | [Review](images/review-1440.png) |
| `1331:3860`, stale request with reason missing | [Stale](images/stale.png) |
| `1334:315770`, exact Travel handover | [Exact visit](images/exact-1440.png) |
| `1332:1465`, customer follow-up | [Follow-up](images/followup-1440.png) |
| `1334:315082`, accepted decision | [Saved decision](images/accepted-1440.png) |
| `1333:1881`, Policy impact | [Policy impact](images/policy-1440.png) |
| `1333:313396`, tablet 1024 × 900 | [Queue](images/queue-1024.png); [undrawn tablet review composition](images/review-1024.png) |
| `1333:313870`, phone list 390 × 844 | [390 list](images/queue-390.png); [additional 320 list](images/queue-320.png) |
| `1333:313910`, review 390 × 1933 | [390 review](images/review-390.png) |
| `1334:2974`, review 320 × 2225 | [320 review](images/review-320.png) |
| `1334:7420`, loading | [Loading](images/loading-390.png) |
| `1334:7477`, empty | [Empty](images/empty-390.png) |
| `1334:7519`, could not load | [Error](images/error-390.png) |
| `1334:314921`, view only | [View only](images/view-only.png) |

The shell/menu, ruled snapshot sections, request comparison, consequences and phone stacking were compared with the live frames and the retained icon-free evidence. Automated assertions cover horizontal page overflow, readable decision controls without overlap, focus restoration, view-only actions, failed-read evidence clearing, independent exact/period counts, policy input invalidation and unchanged-operation retry. CSS-width reflow does not establish native-device, assistive-technology or 200% zoom acceptance.

## Known differences and questions

- P4 displays a gated, unconfirmed state because it is not built; the design’s illustrative confirmation is not treated as evidence.
- The shared compact phone header replaces the earlier drawn phone shell.
- Checkbox bulk actions and column settings are unspecified and omitted. No operation has been invented.
- Existing saved policy publication, discovery and holds are retained in a separate disclosure; exact saved-record links open it.
- Actual record versions, people, dates and evidence determine copy and counts. Missing source evidence is labelled rather than filled with design examples.
- Manual requests retain the source-neutral “Change request” label: the existing data does not establish that the requester is the customer. The grid has horizontal access to Requested, Customer, Follow-up and Site; long evidence stays on one compact row and is fully available in the snapshot.
- Tablet snapshot, Policy impact phone/tablet, Cancel request menu and detailed uncertain-send artwork are not supplied. Existing shared controls apply, pending owner review.

Code delivery, source presence, functional proof, owner visual review, native-device acceptance and deployment remain separate. No reviewer, review date or fingerprint is adopted.
