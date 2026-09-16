# Quality, Safety & Site Assurance r01 verification

The [workspace](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html), [report](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-Report-r01.md) and [handover](../../../decisions/quality-site-assurance-design.md) form one review package in [draft PR #208](https://github.com/deanrfiedler-gif/powerplants-one/pull/208).

## Verified source and results

- Repository baseline: main `a4061c43b11d6a53604ec628cdf370ee72f54f7a`.
- Completed native-review source: `f7240fa65d54804124d452c15267608fa4c27c84`.
- Source tree: `4622f034038888698c67270194dc545c657f770c`.
- HTML SHA-256: `7f0e7531c2f4b8d592e4e269225d45da0d870db4361879465149164eb4cf9db3`.
- Companion report SHA-256: `faf4145f65437e816875bf50e675256643d799fa7058d0936e788afaf9876652`.
- Final evidence/handover updates change documentation only. The delivered HTML, report, model, UI and browser script remain the reviewed versions.

| Verification | Actual result |
|---|---|
| Model behaviour | 27 groups passed; [original model results](model-results.json) |
| Native Chrome interaction | 23 groups passed; no page or console errors; [original results and capture hashes](results.json) |
| Generated HTML | Rebuilt in CI and compared to the committed file; identical |
| JavaScript syntax and lint | Source syntax and repository ESLint passed; final browser-selector edits also checked |
| Foundation, prototype and naming checks | Passed; parent requirements remain 78; 210 document records checked |
| Responsive containment | All six views checked at 1440, 1024, 820, 390 and 320 pixels |
| Visual inspection | Nine original desktop/phone captures inspected; [precise source and findings](visual-review.json) |

[Successful workflow 35040006658](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35040006658) ran the repository-pinned Node 24.21.0, npm 11.19.0 and Playwright 1.63.0 with native Chrome 153.0.8010.47 on Ubuntu 24.04. Job `104617539885` completed successfully on 16 September 2026.

The exercised journey covers source confirmation, exact preparation acknowledgement, failed reading and owned defect, reviewer return, correction, fresh retest, accepted evidence, scoped release and local receiving handover. It also checks invalid/real image handling, original evidence preservation, independent incident review, restricted role display, source invalidation, failed save, lost-response recovery, reload, keyboard/dialog focus, JSON export and damaged saved state.

## Original evidence and visual review

The [final workflow artifact](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35040006658/artifacts/10424203946) contains 25 original PNG captures, the model/browser results and the exported synthetic session. Archive size: 5,458,596 bytes. SHA-256: `a4c86d4a4e858b6fa0aa0390e433c9311f647f3be073983336f9ad593b023887`. Artifact expiry is 30 September 2026; the checked-in result files retain source and image hashes after disposable artifact expiry, and the workflow can reproduce the review.

Visual inspection used the nine originals named in `visual-review.json` from [run 35039599568](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35039599568), whose HTML hash is identical to the successful final run. All six desktop views were represented, plus phone overview/inspection/release. Typography, field spacing, exact equipment/work context, retained history, release boundary and mobile stacking were inspected. No layout clipping was observed. Some originals include transient saved-status toasts; no image was cropped or retouched. This is a design review, not an accepted visual baseline.

Three earlier focused runs stopped on test-selector ambiguity: the role label, a hidden image-dialog check label, and the two guide buttons. Explicit field label association and scoped native selectors resolved them. The third run had already passed the complete business journey and five-width containment group; the final run passed all 23 groups, including keyboard, export and damaged-state checks. Earlier failures are not counted as passes.

Local preview navigation returned `ERR_BLOCKED_BY_CLIENT`. The block was respected. Native review used the repository workflow and existing browser/runtime pins; no alternate local browser or local rendered verification is claimed. GitHub-supplied original artifacts were downloaded for image inspection and byte/hash comparison.

## Limits and acceptance

This completes the requested synthetic interactive design and companion report. Broader repository workflows are reported by the PR and are separate from this focused evidence. No owner acceptance, operational inspection policy, full application integration, assistive-technology conformance, physical phone/photo acceptance or live external integration is inferred. Local client-side record/role guards demonstrate workflow rules; they are not production integrity or access controls. The contribution remains a draft for owner review and has not been merged or deployed.
