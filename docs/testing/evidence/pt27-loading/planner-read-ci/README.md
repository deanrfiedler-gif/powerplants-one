# Planner read correlation in PR #391

Owner: Dean Fiedler. Review: working verification record, not owner acceptance.

## Observed failure

At `31d54d3da6469f08cc377e00a2f85a8cfa3a4710`, the [P11 diagnostic replay](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38096447153/job/114343213348) fails SC-07 in the fifteen-screen PT-29 phone matrix. Its populated read starts on Monday 3 November 2031, while the first read observed after the accepted Systems identity change starts on Thursday 6 November. The comparison fails at `from`: `1951394400000` versus `1951653600000`. The other replay scenarios pass. This is a request-selection failure, not an observed session HTTP 503.

The planner and matrix test are byte-identical between this PR head and main `0e1045903ce335020abf8efd11b09154345c5013`. The [unchanged-main replay, attempt 2](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38090474110/attempts/2) passes. That pass does not disprove the race or reproduce it on main. Source inspection identifies the timing dependency: SC-07 initially mounts with the wide layout, then its media-query effect selects the phone layout. Phone Day reads the entire Monday–Sunday week for the day chips. An accepted identity change remounts the business content, repeating that transition. Selecting the first response by endpoint can therefore compare different windows.

## Bounded repair

The test selects the declared planner window for the initial populated read, recovery and current denial: 3–10 November on phone, 5–6 November on desktop, in Australia/Brisbane. It proves the selected-day fixture appointment is both in that response and rendered, rather than assuming the first appointment in a weekly result belongs to the selected day.

The denial still has to come from a request started after the accepted identity POST. Exact query comparison, HTTP 403/404, private/no-store, the real rendered error, loading completion and absence of protected data remain asserted. There are no extra requests, retries, sleeps, changed deadlines or application changes. A missing intended read still fails the test. This does not resolve the original PT-27 availability or cold-load questions.

## Validation

Local compiled desktop/phone validation and updated-head CI are recorded separately below. Original failure artifacts and the successful main replay remain retained by their Actions runs; raw browser traces and local connection configuration are not copied into Git.

Build `w7yNzdcE5qEferSyV8Nga`, standalone typecheck, changed-file lint, foundation, naming and whitespace checks pass on Windows with Node 24.21.0, PostgreSQL 16.15 and Chrome 155.0.8059.40. The local compiled attempt passes all 672 warm-up routes, then both matrix cases fail during fixture preparation before reaching any screen step. The machine reports zero free disk space and Playwright reports `ENOSPC`; this attempt is not browser verification of the repair. Its log and partial artifacts remain in the private task files named `pr391-planner-browser*`. Updated-head CI must supply the browser result. The original PT-27 availability and performance conclusions are unchanged.
