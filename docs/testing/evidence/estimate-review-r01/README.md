# ES-04 r01 verification record

Source baseline: main `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`. The [design record](../../../decisions/estimate-review-pricing-exceptions-design.md) and [detailed report](../../../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-Report-r01.md) retain scope and receiving boundaries.

## Local verification

- Twenty model groups passed: exact arithmetic/unknowns, roles, source/revision guards, immutable originals, complete correction flow, separate review/approval, missing policy, discount dispositions, duplicate prevention and recovery schema checks.
- Model/controller JavaScript syntax and deterministic standalone generation passed.
- Foundation, prototype and naming checks passed at initial source validation; final publication results follow below.
- The local Chrome download failed; the managed browser rejected the local URL with `ERR_BLOCKED_BY_CLIENT`. No local native or visual pass is claimed.

## Native browser verification

The dedicated workflow runs the pinned repository Chrome/Playwright, focused lint, model groups and native interaction script. It retains original screenshots, download evidence and a hashed manifest. The procedure covers all six views at 1440, 1024, 820, 390 and 320 px; complete review/approval/handover, correction, source and save recovery; keyboard tabs and snapshot focus.

Initial run [35169972635](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35169972635), source `16f7f4d`, passed nine native groups including the complete review/approval journey, exact export hash, correction and failed-save retry. Its reset helper selected a background recovery button while a dialog was open; the test now scopes that action to the active dialog. Original archive SHA-256 `bcf1e6bfdea70ad3983cee86dda02ec5cbefe3c2305258adb923a51b760388eb` and all five screenshot hashes were verified. Desktop queue, prepared handover and revision comparison captures were inspected.

That inspection led to readable comparison labels/money/dates, exact event times, improved focus fallback and hidden skip-link containment. Additional model review retained unique finding IDs across successors, preparation reasons, valid source dates and matching successor scope/brief revisions. Final native execution is still pending; the initial run is not a full native pass.

## Acceptance limits

HTML/model verification is component evidence. Owner design acceptance, physical-device and screen-reader review, server permission/concurrency enforcement, real source/policy evidence, ES-05 receiving integration and business acceptance remain separate. No deployment or customer/ERP operation is included.
