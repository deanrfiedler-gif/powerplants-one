# Scheduling successor focus repair

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 3 October 2026. Synthetic application proof is separate from owner, visual, physical-device and screen-reader acceptance.

## Original failure and comparison

[Compiled browser run 37108440454](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37108440454/job/111161435964) on PR #338 head `6ba8b1e` passed 15 of 16 isolated Scheduling cases. The mobile successor/review/publication journey failed its existing five-second `toBeFocused()` assertion for **Unsaved successor edits**. The retained screenshot shows that heading and form present; the assertion records the heading as inactive. Original artifact `11269826301` and its failure context remain unchanged. This is separate from the earlier FI07 upgrade expectation repair.

The relevant Scheduling implementation and original test are byte-identical to fetched main `8c14233`. A separately compiled, detached main checkout passed three ordinary mobile replays. A new focused fixture then held the actual current-head response across browser paints while opening the saved proposal and selecting Edit. Releasing that unchanged response reproduced the same inactive-heading failure on main. Only the new diagnostic test was added to that checkout; application source remained unchanged. No assertion or timeout was weakened.

The saved proposal and current head are independent reads. Edit can be selected when the proposal has arrived but the head is still loading. Previously its one animation-frame callback found no form heading and discarded the focus request. The later form mount did not focus it. This demonstrated ordering explains the intermittent symptom; the original CI artifact does not itself record browser focus-event timing.

## Bounded repair

Retain the explicit focus request in a component ref and fulfil it when the permitted form heading mounts. Another explicit Edit focuses the already mounted heading. The stable callback does not move focus when typing rerenders a field. The intent has only the component's lifetime; it is not a saved record or recovery command.

Only `PolicyPublicationWorkspace` changes. Existing reads, permission checks, immutable proposal/review/publication commands, receipts, migrations and seeds are unchanged. The policy-impact page, guide, component state example, consumer binding and pending alignment record are updated together. No accepted editor mockup or review fingerprint is invented.

## Reproduction and validation

Runtime: Windows, Node 24.21.0, PostgreSQL 16.15, Playwright 1.63.0 and pinned Chrome 154.0.8037.97. The task-owned resettable database is `ppo_synthetic_test`; earlier ES-04/ES-05 restart databases and their issued bytes are preserved. Configuration, original downloaded artifacts, complete logs and failure traces remain outside Git.

- Unchanged main: `npm run build`, then the original mobile publication case with `--repeat-each=3`: **3 passed**. The delayed-head fixture: **1 failed**, at the unchanged heading-focus assertion after the form appeared.
- Candidate: production build, TypeScript, full ESLint, foundation, prototype, naming and studio checks passed. All **18 compiled Scheduling cases passed together**, including both delayed-head regressions, the original mobile/desktop journeys, stale-source refusal, permission/identity changes and exact uncertain-operation recovery. No test retries were used.
- The new `tests/scheduling-browser/successor-focus.spec.ts` checks the real delayed response, focused mounted heading, retained field focus and repeated Edit. Its response body is unchanged, and the server still performs the normal read.

Browser commands use `node --env-file=<private-config> node_modules/@playwright/test/cli.js test --config=playwright.scheduling.config.ts --output=<private-evidence> --reporter=list`. Baseline selection is the original `publication.spec.ts` mobile case and then the separate diagnostic fixture; the candidate runs all Scheduling cases. CI status belongs to the exact pushed head and is not inferred from local results. No PR merge, deployment or live business action is included.

[Exact build/source/test hashes and results](manifest.json) accompany agent-inspected [1440 × 1000 desktop](desktop-successor-focus.png) and [390 × 844 mobile](mobile-successor-focus.png) captures. They show readable content after the passing focus assertion; no paired accepted editor reference exists, and owner/device/screen-reader review remains pending.
