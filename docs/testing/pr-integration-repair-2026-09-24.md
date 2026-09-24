# Open pull-request integration repair — 24 September 2026

Owner: Dean Fiedler. Review: repository integration authorised; business and visual acceptance remain separate.

## Scope and ordering

Eight open PRs were inspected against main `854db10`. Incorporate the preceding repaired head in this order: #309, #311, #302, #303, #305, #307, #308, #310. Merge only after the preceding contribution is on main and the current head passes all applicable checks. Existing local field-quality planning and Engineering edits remain untouched.

Equipment allocates migration 0045, Sales 0046 and Engineering 0047. Estimating's concurrent, unmerged 0045 must be reconciled after those foundations, including all migration, seed, grant and generated access-review consumers. Issued reference snapshots remain unchanged.

## Initial failure evidence

- #303: [compiled browser](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35939447966/job/107443874755) matched two record-refusal alerts in the real permission-revocation scenario. All private-content and unchanged-Activity assertions must remain.
- #307: [Engineering/Estimating regression](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35941479924/job/107450077948) expected the former Engineering page-guide title. The maintained guide is now Engineering workload & deliverables. Both broad browser lanes also report this mismatch.
- #309: [application browser](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35938777692/job/107441776472) exhausted the overall 45-second Planner move/recovery case while awaiting its schedule refresh. Its compiled sibling passed; diagnosis and any correction are recorded below.
- #307/#310: retained-read forwarding raised ECONNRESET in SH responsive navigation. This is separate from an HTTP rejection or failed business assertion.
- #310: [Contacts contract check](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35939625767/job/107444420579) rejected changed hashes for Projects, Scheduling and Reports services; source changes require review before regeneration.
- Diagnostic replays for [#310](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35939625789/job/107444421046), [#308](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35942899566/job/107454503332) and [#311](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35943129913/job/107455205066) explicitly report a GitHub runner shutdown signal before warm-up reports unreachable routes. No application journey ran. Fresh CI is required; these interrupted runs are not passing evidence.

## Protection observed

The live protection endpoint reports no required approving reviewer and seven required contexts: documentation foundation; CRM persistence/interaction; CRM header/board visuals; compiled desktop/mobile browser; Estimating E1 output/restart; Email/Calendar persisted journey; and aggregate P01–P11/CRM PostgreSQL application proof. Strict base freshness is disabled. All applicable reported checks remain integration gates; no protection bypass is used.

## Verification

### Shared browser repair on #309

The retained Planner failure snapshot already contains the saved appointment in its target day. The test now checks that exact appointment link in the target lane/day and its absence from the original day, retaining the receipt, assignment-version, customer-contact, pack-review and unchanged-retry assertions. It no longer waits indefinitely for a separate network event after the visible refresh. The original 45-second test and ordinary assertion deadlines are unchanged.

Retained GET forwarding now requests `Connection: close`, so each navigation-independent read owns its connection instead of reusing a socket at the server keep-alive boundary. Commands remain untouched; no retry or error suppression is added. The controlled connection test failed before the change and passed after it, checking three distinct connections, exactly three GETs and one POST. This establishes the forwarding mechanism; it does not reproduce GitHub's precise socket scheduling.

Local results on the integrated #309 tree: production build passed; fresh migration/seed into an isolated `ppo_synthetic_test` on loopback port 55524 passed; all eight read-drain regression cases passed; the compiled Planner recovery and full SH sequence passed **13/13**, no skips, in 3.3 minutes with 452 reachable warm-up routes. Focused lint, foundation, prototype, naming, register integrity and whitespace checks passed. Runtime: Node 24.21.0, PostgreSQL 16.15, Chrome 154.0.8037.58, Playwright 1.63.0. An initial dependency junction was rejected by Turbopack; copying the existing locked dependencies into the isolated checkout allowed the normal build. No application or database timeout changed.

Fresh CI remains required for every integrated head. Synthetic test evidence does not establish owner/device acceptance, production readiness or deployment.

## Equipment migration receipt in a combined upgrade

The [Sales database lane](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35956024809/job/107494423163) exposed an Equipment test that asserted the newest applied migration was always 0045. It failed with 0046 after Sales was integrated; the same original assertion reproduced locally as 0048 versus 0045 on the complete integration tree. The upgrade now preserves every original migration receipt through 0025, requires exactly one Equipment 0045 receipt, and verifies the entire upgraded ledger remains unchanged after repeated migration/seed. The existing exact original-Asset comparison remains. Whole-registry assertions in the other upgrade suites remain independent and unchanged.

The corrected combined 0048 tree passed all 27 cases across the complete Equipment, Sales, Engineering control and Cost Source database files, with no failures or skips. Focused lint and whitespace checks passed. This is an integration-test correction; no migration, application behavior, deadline or runtime dependency changes. Fresh CI remains required on each affected dependent head.

## Performance sample response ownership

The [fresh Equipment performance job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35952532608/job/107483935296) retained one failed development sample out of 320. Its phone Customers wave received a 200 response 71 ms after observation began, with zero matching requests started in that wave; Chromium then refused its body after navigation. The URL-only waiter had selected a late response from the preceding wave. The waiter now accepts only responses belonging to GET request objects observed after that sample starts. It retains the 120-second deadline, real browser request, declared network rule, HTTP-error assertion, raw samples and timing boundary; no retry, interception or timing exclusion is added.

A controlled delayed-response regression returned the previous wave with the old predicate on both desktop and phone. After the correction, all four browser cases passed, including preservation of a current 503 response, exclusion of POST, and a bounded timeout when no request starts. Focused lint and TypeScript checks passed. This proves response ownership, not production performance. The separate [original-failure replay](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35952532608/job/107483935192) received an external runner shutdown during warm-up; its application journeys did not run. Fresh CI on the corrected head is required for both lanes.

## Optional Job Pack access boundary

Fresh CI at `8155cd1` exposed two invited-user demo failures ([run 35947481361](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35947481361)). The saved appointment loaded correctly, but its new optional JobPackEntry showed a page error for an identity without pack.read. The panel now distinguishes a denied read from a failed request: permission denial shows an access-unavailable status, while server/transport errors retain the error alert. Both hide old links; refresh remains available. No permissions, endpoints or server policy change. Consumer fixtures cover 403, 404 and 500, and the invited-user journeys explicitly wait for the unavailable status and assert no pack link. Fresh CI remains required.
