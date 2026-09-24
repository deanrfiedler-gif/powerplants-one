# Native estimating workload evidence

Owner: Dean Fiedler. Implementation/visual inspection by Codex, 24 September 2026. Owner acceptance and deployment pending.

The [manifest](manifest.json) identifies the compiled build, exact LF-normalised source hashes, browser and original image hashes. The fixture is a newly created synthetic Sales brief without discovery. No source or customer information is operational.

| Native capture | Inspected result |
|---|---|
| [Desktop](desktop-workload.png), 1440 × 1000 | Canonical brief, estimating/Sales ownership and next action have separate columns; status and unknown response remain explicit. |
| [Phone](phone-workload.png), 390 × 844 | Extra filters collapse behind a keyboard-operable disclosure. The first card begins in the initial viewport; shell controls no longer overlap the secondary navigation. |
| [Phone next action](phone-next-action.png) | Scrolling reaches the discovery action and policy explanation above the fixed navigation. |
| [320 px](phone-320.png) | Long synthetic title wraps and the focused search/action controls stay within the viewport. |
| [200% CSS enlargement](desktop-css-zoom-200.png) | Cards stack by available container width and the header controls no longer overlap the breadcrumb. CSS zoom is not physical-device or browser-UI zoom acceptance. |

The final compiled workload suite passed all four desktop/phone cases, including data-ready assertions, readiness filtering, URL history/reload, exact discovery entry, retained saved estimates, guide Escape/focus return, and loading/failed/revoked reads. The existing navigation suite passed the changed seven-rail assertion and nine other desktop cases; its first Sales read timed out once, then passed on an unchanged focused rerun. The eleven mobile entries in that suite are intentionally skipped because its desktop tests set their own phone/reflow viewports.

At parent `f929312`, [Estimating CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35919319365) passed: 385 units, 89 database cases, 12 HTTP cases, the application/browser/PostgreSQL restart proofs, 17 E1/workload browsers, 29 ES-02/shared regressions, 10 ES-08 cases and 14 fertigation browsers. Both full browser jobs otherwise passed 354 cases and failed only their old Estimating rail-name/order expectation; this increment updates that assertion to the implemented navigation. Final-commit CI remains a separate merge gate.

Exact ES-01 design imagery is missing, so these captures document native inspection rather than a paired-source visual acceptance. No review fingerprint, owner approval, full programme completion, production readiness or deployment is inferred. See the [programme handover](../../../delivery/estimating-programme-handover.md) for scope and local environment limits.
