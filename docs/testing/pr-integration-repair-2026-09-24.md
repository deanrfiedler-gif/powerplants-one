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

## Performance sample response ownership

The [fresh Equipment performance job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35952532608/job/107483935296) retained one failed development sample out of 320. Its phone Customers wave received a 200 response 71 ms after observation began, with zero matching requests started in that wave; Chromium then refused its body after navigation. The URL-only waiter had selected a late response from the preceding wave. The waiter now accepts only responses belonging to GET request objects observed after that sample starts. It retains the 120-second deadline, real browser request, declared network rule, HTTP-error assertion, raw samples and timing boundary; no retry, interception or timing exclusion is added.

A controlled delayed-response regression returned the previous wave with the old predicate on both desktop and phone. After the correction, all four browser cases passed, including preservation of a current 503 response, exclusion of POST, and a bounded timeout when no request starts. Focused lint and TypeScript checks passed. This proves response ownership, not production performance. The separate [original-failure replay](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35952532608/job/107483935192) received an external runner shutdown during warm-up; its application journeys did not run. Fresh CI on the corrected head is required for both lanes.

## Optional Job Pack access boundary

Fresh CI at `8155cd1` exposed two invited-user demo failures ([run 35947481361](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35947481361)). The saved appointment loaded correctly, but its new optional JobPackEntry showed a page error for an identity without pack.read. The panel now distinguishes a denied read from a failed request: permission denial shows an access-unavailable status, while server/transport errors retain the error alert. Both hide old links; refresh remains available. No permissions, endpoints or server policy change. Consumer fixtures cover 403, 404 and 500, and the invited-user journeys explicitly wait for the unavailable status and assert no pack link. Fresh CI remains required.

## Combined migration and Scheduling reconciliation

The integrated sequence assigns Equipment 0045, Sales 0046, Engineering 0047 and Cost Sources 0048. The unmerged Cost Sources SQL is byte-identical after renumbering; seed order, exact migration lists, upgrade counts, grant allowlists and the 92-capability access-review contract are reconciled. No existing database is renumbered and no issued identity is changed.

Scheduling's Contacts source review is recorded in `docs/design/contacts/README.md`. Local verification passed: byte-identical issued Contacts HTML; all 103 Contacts model groups; all 62 native Chrome browser groups; TypeScript; design register (309 entries, 28 components); foundation, prototype and naming checks. Visual/owner review remains pending in the register. Fresh CI and combined database upgrade proof remain required.

The combined application build and lint pass. The full local unit run passes 410 of 414 cases; all four Windows path/private-storage failures reproduce in an untouched `854db10` main checkout (the same seven focused cases pass 3/fail 4 there). GitHub's supported Ubuntu checks remain authoritative for those cases; no assertion or storage safeguard was relaxed.

The compiled optional-pack boundary proof on `992dbb4` passes both desktop and phone consumers (3/3 including warm-up). Final review also restored the issued access-review r01 snapshot to main's exact bytes: Engineering had regenerated that historical file before the Cost Sources branch moved the live generator to the versionless working master. Current working capability data remains 92; historical evidence is retained.

## Combined local verification

Application tree `c354575` (the following commits only retain documentation and historical reference bytes) passed the normal production build and lint. Against the isolated PostgreSQL 16.15 `ppo_synthetic_test`, ten selected database upgrade/reseed cases passed, including the upgrade across 0026 with existing estimates and the exact whole-grant snapshots. The unfiltered demo-upgrade suite and Scheduling workspace database suite passed **10/10** (five each), including CRLF ledger preservation and rollback after a late privilege failure. An earlier filtered demo run ended on its deliberately invalid migration-ledger fixture and failed the suite teardown because the final rollback case was excluded; the complete unchanged suite then passed.

The compiled application passed **23/23**, with no skips, in three minutes: all seven Scheduling browser cases, CRM permission revocation, Planner conflict/uncertain recovery, both Job Pack entry consumers and Engineering page guidance on desktop and phone. Warm-up reached all 519 discovered routes. Node 24.21.0, Chrome 154.0.8037.58 and Playwright 1.63.0 were used. These focused checks supplement the full GitHub lanes, whose actual per-head results and merge records remain authoritative.

## Sales upgrade ledger assertion

The fresh [CRM lane on Engineering](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35949089469/job/107473512663) exposed another combined-migration assumption in the new Sales test: it removed only the final ledger row and expected Sales 0046 to be last. Equipment 0045 and later Engineering/Cost Sources make that assumption false. The proof now compares every original row through its actual 0044 baseline, including checksums/timestamps, and requires exactly one Sales 0046 receipt. Existing whole-registry proofs cover the complete sequence. The corrected case passed against the combined 0048 tree (1/1, no skips); no migration or application code changed.

## Issued access snapshot preserved throughout the merge sequence

The versionless access-review generator was also carried back to the Engineering foundation before its merge, so every integration step retains main's issued r01 bytes. The 91-capability Engineering working master passed all 107 model groups and 40 native Chrome browser groups; the combined 92-capability master passed all 107 model groups after reconciliation. Existing reference captures and owner-review status remain unchanged. Generated model evidence now writes to `verification-evidence/` rather than overwriting the issued r01 evidence record.

## Disposable setup boundary

The [fresh Equipment Finance lane](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35949089864/job/107473514763) failed seven `beforeEach(reset)` hooks at schema disposal, before the Finance assertions. Reset inherited the application's ten-second PostgreSQL statement deadline. Scheduling already separates fixture seeding and synthetic schema disposal with a transaction-local 120-second setup bound; that existing correction is now carried forward from Equipment rather than arriving only in the final PR. It changes no application query, migration SQL, assertion, retry or workflow test deadline.

The new database regression passes on the combined tree (1/1): after reset and repeated seed, the same single pooled connection still reports the normal ten-second statement timeout. Disposal still requires `ppo_synthetic_test` and the explicit reset flags in this proof. The original Finance lane remains failed evidence; corrected-source CI must execute the full lane.
