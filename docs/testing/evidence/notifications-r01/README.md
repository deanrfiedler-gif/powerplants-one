# Notification workspace r01 verification

Baseline: main `07eb34d5df5ea430c365da78e160cb6aa0b76f20`. Attachment matches main r20, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.

## Completed locally

- 17 model groups passed: read/action separation, archive protection, per-person scope, groups, duplicate retry, dates, quiet hours, preference validation, delivery eligibility and saved-state integrity.
- JavaScript syntax and deterministic HTML assembly checked.
- Native visual review is performed through the focused repository workflow. The session's Cloud browser refused the local HTML URL; that browser policy was not bypassed.

## Original finding

Run [35051625281](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35051625281), source `4974357f43ed75724c475f4703848d906097fd35`, stopped at focused ESLint: a side-effect ternary in checkbox selection violated `no-unused-expressions`. Replaced it with explicit if/else; no rule or assertion was weakened. Browser tests had not started in that run.

## Native verification

Run [35051908896](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35051908896), source `98a8198344eed15d4a32cecc7360a1f119a214ca`, passed focused lint, all 17 model groups and all 14 native browser groups on Chrome `153.0.8010.47`, with no page/console errors. HTML SHA-256 `0a3076aa9caae405fd51003e3e8f4a3ce34c845414a17978bb651f0542369bdf`.

Downloaded artifact `10429536462` was verified against ZIP SHA-256 `4671c7788aa2f4c67a5265512b0c8c285682af1add4a4007b14848611de80472`; all 18 original image hashes matched the manifest. Seven originals were visually inspected: desktop inbox, grouped changes, escalations and preferences, 390 px inbox, 320 px preferences, and phone source preview.

Visual review found clipped quiet-hour/grouping checkbox labels because a full-width form-input rule also sized checkbox inputs. The CSS now explicitly fixes checkbox width and gives the label the remaining row width. The responsive test now verifies both checkbox width and label containment at every viewport. Forward-action arrows were corrected, source revision labels normalised to rNN and Job Pack design navigation advanced to its accepted r03 reference. Captures now wait for transient toasts to dismiss; an additional phone-dialog viewport capture is retained. Final corrected-source verification is pending.

 The workflow records source head, exact HTML SHA-256, browser version, every result, page/console errors and original screenshot hashes. It covers all four views at 1440, 1024, 820, 390 and 320 px and retains original captures for visual inspection. Final results and any corrections will be recorded here before handover.

These checks are standalone design evidence, not application integration, independent owner acceptance, complete WCAG conformance, physical-device acceptance or real delivery verification.
