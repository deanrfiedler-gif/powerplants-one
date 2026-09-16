# CR-03 Sales-to-Delivery Handover r01 — verification

The [workspace](../../../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html), [detailed report](../../../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-Report-r01.md), [design source](../../../design/sales-delivery-handover/README.md) and [decision and receiving handover](../../../decisions/sales-delivery-handover-design.md) form one review package.

## Verified source

| Item | Identity |
|---|---|
| Repository baseline | `main` `0769a16dd842e9dc1c349a853036ab71949e7807`, tree `57e788526e1521b839fd0ec6c2ef6f973d4dd406` |
| Branch | `design/sales-delivery-handover-r01` |
| Workspace HTML SHA-256 | `1e47efa70938127b644a9e5dda9a61d1d4f929b548610d515ec21d1d09ed30a5` |
| Companion report SHA-256 | `c7602951005b1037ee2242da48e7eed48071bd7ade0bef8ffda4e3b60a2a283d` |
| Upstream quotation r03 SHA-256 (build guard) | `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a` |
| Theme board r20 SHA-256 (font provenance) | `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` |
| Embedded Roboto source SHA-256 | `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef` |
| Pinned references, not build dependencies | ES-05/ES-06 draft PR #212 head `8d821e9d764737ab41a753c6fb72342b399428a2`; ES-07 draft PR #213 head `b6ef1342aa62eec87f2c4557ce7d1649fd246530` |

## Results

| Verification | Actual result |
|---|---|
| Model behaviour | **25 groups passed**, 0 failed — [original results](model-results.json) |
| Native browser interaction | **29 groups passed**, 0 failed, **0 page or console errors**, 31 original captures — [original results and capture hashes](results.json) |
| Generated HTML | Rebuilt from source and compared to the committed file; identical, and the upstream quotation hash guard was satisfied |
| Foundation, prototype and naming checks | Passed; 78 parent requirements preserved |
| Merge-conflict marker scan over `docs` | Clean |
| `git diff --check` | Clean |
| Responsive containment | All six views at 1440, 1024, 820, 390 and 320 pixels; no horizontal overflow in any view at any width |
| Visual inspection | Desktop register, accepted commercial basis, responsibility chain and the 390 px register were inspected directly from the original captures |

## What was exercised

The complete demonstrated workflow runs return → correct → compare → resubmit → accept on the Riverbend Project handover, then supersedes its accepted quotation to show renewed acceptance with the original decision retained. Alongside it: a parts-order handover accepted in one pass with a release prerequisite surviving; a Service handover already accepted with two open obligations that prevent work release; a Won opportunity with missing acceptance evidence and no approved routing source; and a partially confirmed ES-07 conversion that blocks fulfilment acceptance and refers reconciliation to ES-07.

The checks also cover exact source and revision binding, stale-review refusal both during review and after acceptance, original-operation recovery with its three refusals (different content, different handover, different identity), the separation of commercial, conversion, receiving and work-release states, preservation of unresolved obligations across acceptance, customer and identity isolation, restricted-identity exclusion from counts, search and snapshots, functional filters and summary cells that open their exact contributing records, accurate quantities and source-defined totals, keyboard and dialog focus behaviour, reload persistence, JSON export fidelity, failed-save preservation and damaged-session preservation.

## Disclosed limits

- **The native browser was Chromium 141.0.7390.37**, launched through `PPO_CHROME_PATH`, not the repository's pinned Chrome 153 channel, which is not installed in the environment used for this package. The results manifest records the version actually used and how it was launched. A run on the repository's pinned Chrome remains outstanding.
- **Playwright 1.63.0 — the repository pin — was installed outside the repository tree**, because the repository's `engines` field requires Node 24.21.0 / npm 11.19.0 and the environment provides Node 22.22.2. No repository dependency, lockfile or version pin was changed. A run on the pinned Node remains outstanding.
- No CI workflow was added for this package in this contribution.
- Screen-reader output, physical device testing, 200 % zoom reflow, forced-colours mode and print pagination are **not** verified.
- Captures were written to the ignored `verification-evidence/sales-delivery-handover/` directory. `results.json` retains each capture's name and SHA-256 so the review can be reproduced; the PNG files themselves are not committed.
- These are design checks. Code delivery, executed acceptance, owner visual approval and production readiness remain four separate claims, and none is made here.

## Reproducing

```sh
python3 scripts/build-sales-delivery-handover.py
node scripts/check-sales-delivery-handover-model.mjs
node scripts/check-sales-delivery-handover-browser.mjs   # PPO_CHROME_PATH=... where the chrome channel is absent
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs
git diff --check
```
