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

Visual review found clipped quiet-hour/grouping checkbox labels because a full-width form-input rule also sized checkbox inputs. The CSS now explicitly fixes checkbox width and gives the label the remaining row width. The responsive test now verifies both checkbox width and label containment at every viewport. Forward-action arrows were corrected, source revision labels normalised to rNN and Job Pack design navigation advanced to its accepted r03 reference. Captures now wait for transient toasts to dismiss; an additional phone-dialog viewport capture is retained.

## Final corrected-source verification

Run [35052365179](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35052365179) passed on source `39e8a785925b0422a48734709ffbaa1c0dbb4a8e`, tree `cc9d3e06735886e7772b60ff87ae4c1736c10dce`, with Chrome `153.0.8010.47` and Node `24.21.0`.

- Focused ESLint, all **17 model groups** and all **14 native browser groups** passed. No page or console errors were recorded.
- Final HTML SHA-256: `f7cd88234ceb2653ae21f900804e161284b28c1b2312ce8f87b2e2ca00ad3514`. The downloaded manifest matches the local delivered HTML.
- Artifact `10429346930`, ZIP SHA-256 `4fcf1bea4f1dc7c2f3827bf361dffdcb28473ec0ad02cce8e8e91061f7aedf8b`, was downloaded and verified. All 19 original screenshot hashes match the manifest. The workflow retains these originals for 14 days, with this artifact expiring on 2026-09-30.
- Eight final original captures were visually inspected: all four 1440 px views, 320 px preferences, 390 px grouped changes and escalations, and the phone source-dialog viewport. Checkbox labels are contained, forward navigation points right, and the phone dialog exposes its close control and scrollable content.
- Automated layout checks cover all four views at **1440, 1024, 820, 390 and 320 px**, including page overflow and checkbox-label containment. Keyboard checks cover view navigation, dialog Escape and focus return. Behavioral coverage includes exact deep links, stale/missing/revoked sources, saved preferences, per-person scope, archive protection and storage recovery.

The original machine-readable [browser manifest](native-results.json) and [model results](model-results.json) are committed beside this record. The manifest preserves the tested source SHA and every image hash; this evidence-only follow-up does not change the tested HTML or controller.

Local foundation, prototype and naming checks also passed, along with JavaScript syntax, reproducible assembly and `git diff --check`. These focused results do not assert that every unrelated repository workflow or merge gate has completed. [Draft PR #211](https://github.com/deanrfiedler-gif/powerplants-one/pull/211) provides the review boundary; no merge or deployment has been performed.

These checks are standalone design evidence, not application integration, independent owner acceptance, complete WCAG conformance, physical-device acceptance or real delivery verification.
