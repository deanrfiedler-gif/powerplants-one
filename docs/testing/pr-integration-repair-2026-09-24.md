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

## Combined migration and Scheduling reconciliation

The integrated sequence assigns Equipment 0045, Sales 0046, Engineering 0047 and Cost Sources 0048. The unmerged Cost Sources SQL is byte-identical after renumbering; seed order, exact migration lists, upgrade counts, grant allowlists and the 92-capability access-review contract are reconciled. No existing database is renumbered and no issued identity is changed.

Scheduling's Contacts source review is recorded in `docs/design/contacts/README.md`. Local verification passed: byte-identical issued Contacts HTML; all 103 Contacts model groups; all 62 native Chrome browser groups; TypeScript; design register (309 entries, 28 components); foundation, prototype and naming checks. Visual/owner review remains pending in the register. Fresh CI and combined database upgrade proof remain required.
