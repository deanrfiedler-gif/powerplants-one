# ES-04 r01 verification record

Source baseline: main `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`. The [design record](../../../decisions/estimate-review-pricing-exceptions-design.md) and [detailed report](../../../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-Report-r01.md) retain scope and receiving boundaries. Published for owner review in [draft PR #225](https://github.com/deanrfiedler-gif/powerplants-one/pull/225).

## Verified artifact

| Evidence | Exact result |
|---|---|
| Tested source | `a4bd33ab76d56df285f8a87b434a02f9ca7f4fbf` |
| HTML SHA-256 | `ae0c87ab33d6995c9b382c6247c4cacaaae0a1b327753ff5e6d8ab92ee2dfa99` |
| Focused workflow | [35171162512](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35171162512), job `105042926517` — passed |
| Runtime | Node 24.21.0; npm 11.19.0; Playwright 1.63.0; Chrome 153.0.8010.47 |
| Model | 20 groups passed; [original results](model-results.json) |
| Native browser | 14 groups passed; no page or console errors; [original manifest](native-results.json) |
| Widths | All six views at 1440, 1024, 820, 390 and 320 px; page overflow and summary text containment checked |
| Source integrity | Deterministic rebuild matched the committed HTML; focused ESLint passed |
| Documentation | Foundation, prototype and naming checks passed; [Documentation assurance 35171162445](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35171162445) passed |
| Original archive | [Artifact 10476298973](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35171162512/artifacts/10476298973), 2,553,153 bytes |
| Archive SHA-256 | `73edfa72f23284c0a3ec05effba8bbcb79e2da33582a3413c86bdf36a0a839e5` |

The archive hash and all 17 screenshot hashes were verified after download. The archive contains the native and model manifests, exact synthetic handover export and original captures. GitHub reports its expiry as 1 October 2026; the manifests and reproducible source/scripts are retained here. Subsequent publication changes only this evidence, report and status; the tested HTML bytes and executable sources remain unchanged.

## Behaviour and visual inspection

Native execution covered queue/search recovery, complete independent review and separate approval, one prepared handover, exact exported content/hash, immutable approved predecessors, corrected draft/response/resubmission/acceptance, unconfigured policy, read-only controls, failed-save retry, corrupt/concurrent storage, distinct source states, responsive layout, dialog focus/Escape restoration, tab keys and stale revision links.

Final original captures inspected: `1440-basis.png`, `phone-source-snapshot.png`, `desktop-revision-comparison.png`, `390-queue.png`, `390-basis.png` and `desktop-approved-handover.png`. The desktop cost summary is readable with vertically stacked totals; phone source evidence scrolls inside a full-width drawer with a fixed close action; revision comparisons use readable field labels and values; queue/detail and labelled cost rows stack on phones. The separately recorded review, approval and Prepared-only handover remain visible. Earlier responsive captures additionally supplied inspection of pricing, findings, history and unconfigured policy.

## Findings corrected during verification

- Initial run [35169972635](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169972635), source `16f7f4d`, passed nine native groups before the reset test selected a background button behind a dialog. Scoping the helper to the active dialog corrected the test. Initial archive hash: `bcf1e6bfdea70ad3983cee86dda02ec5cbefe3c2305258adb923a51b760388eb`.
- Responsive run [35170549509](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35170549509), source `54eba9a`, passed twelve groups and all view/width page checks. Repeated Tab exposed focus escape from the snapshot; an explicit first/last control wrap corrected it. Visual inspection found overlapping sidebar totals despite no page overflow; the final layout stacks them and verifies text containment. Responsive archive hash: `c83ef6ff9758a92811db8e5e2c7273bc3f39ab5164babce375a6a5933c2ce6a6`.
- Supporting corrections include readable comparison money/dates, exact event times, focus fallback after replaced controls, hidden skip-link containment, unique finding IDs across successors, retained preparation reasons, valid source dates and matching successor scope/brief revisions.

The final successful run supersedes the partial runs for component verification. Local Chrome installation was unavailable and managed browser navigation was denied; no local native or visual pass is claimed. Visual findings above refer to the hash-verified GitHub originals.

## Acceptance limits

HTML/model verification is component evidence. Owner design acceptance, physical-device and screen-reader review, server permission/concurrency enforcement, real source/policy evidence, ES-05 receiving integration and business acceptance remain separate. Broader application workflows were still running or queued when this evidence was recorded; no full-PR merge-readiness claim is made. No merge, deployment or customer/ERP operation is included.
