---
document_id: PPO-EN06-HO
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: Local synthetic increment, merged to main as PR #265 (5d54c4e) on 20 September 2026; visual and business acceptance pending
source_commit: 99c32aed5032393b7658713cca53aa4c1a2ab2dd
---

# EN-06 Released Materials & Substitutions: local handover

Branch `feat/en06-released-materials`, from `main` at `99c32ae` with `main` at `1a69e93` merged in. On Dean's authority of 20 September it was pushed and opened as draft PR [#265](https://github.com/deanrfiedler-gif/powerplants-one/pull/265), which Dean merged to `main` the same day as `5d54c4e` after its CI passed on head `49c7bcc`. Nothing is deployed. Decisions and departures are in the [integration record](../decisions/engineering-materials-substitutions-design.md); commands and results are in the [evidence record](../testing/evidence/engineering-materials-local-r01/README.md).

## 1. Open it

1. `npm run db:migrate` then `npm run db:seed` (already applied to the local `ppo_synthetic` database on 20 September: migration 0029 and seed 29).
2. `npm run dev`, or reuse the server already on `http://127.0.0.1:3000`.
3. `node --env-file=.env.local --import tsx scripts/engineering-materials-scenario.ts` builds the r04 review scenario through the API and prints its address. It is already built; a rerun replays the same operations and changes nothing.
4. Open **`http://127.0.0.1:3000/engineering/materials`**, or from Engineering choose *Released materials & substitutions*. Pick "SYN Nursery irrigation upgrade". The demonstration package is `/engineering/6460fa8c-ba7f-4830-897b-29592943ebe4/materials`.

Choose an identity from the account menu. Changing identity clears what is on screen.

| Identity in the picker | Does |
|---|---|
| Alex Lee — materials author | Adds and corrects requirements, proposes bindings, prepares release sets and handovers |
| Sam Jordan — materials engineer | Same duties; proposed the two alternates |
| Casey — technical reviewer | Decides alternates; reviews release sets |
| Drew — material release authority | Authorises, issues, withdraws current use |
| Robin — Supply Chain coordinator | Accepts or returns a payload addressed to them |
| Quinn — materials viewer | Reads only; restricted bytes and recipient details withheld |
| Coordinator | Synthetic upstream adapter (sources), verifies item bindings, records commercial decisions |
| Company B | Sees none of it: the package is indistinguishable from a missing one |

## 2. The six destinations

| Destination | What works |
|---|---|
| **Materials register** | Flush register of the set; All / Ready for review / Needs attention with server counts; search, discipline, Add condition (owner, mapping, readiness, alternate), sort, columns, paging; every criterion in the URL. Opening a line inspects it without ticking it; ticks are a separate selection with an indeterminate page checkbox. Inspector: specified and proposed product, comparison, next action and review due, *Material required by* with "Date needed" when unknown, exact source with purpose and currentness, technical acceptance and handover shown apart. Add, correct and remove a requirement; CSV export |
| **Item & unit mapping** | One binding per line for the package's own entity; Verified, Proposed, Ambiguous, Missing, Unavailable, Restricted, Changed and Not required kept distinct; exact conversion with a live preview; whole-pack overage needs a recorded decision. Only the item owner (coordinator) can verify, and never for another company |
| **Substitution review** | Proposal list with lineage; criterion-by-criterion comparison with no score; independent Accept, Return, Hold or Reject; acceptance blocked by any failed, unknown or set-aside mandatory criterion; corrected successor with the returned one retained; explicit adoption into the next content revision; commercial decision recorded only by the commercial coordinator |
| **Review & release** | Choose lines and quantities with a live server preview of what stops the scope and what is left out; prepare and freeze; submit; independent review; authorise; issue; cancel; withdraw current use; successor. Review, release operation and current use are shown as three separate states. Issue distinguishes issued, failed with no effect, and outcome unknown |
| **Supply handover** | Payload built on the server from the exact issued release; Forecast or separately evidenced Approved demand; named receiver; required-by date or "Date needed"; send; whole-payload accept or return by the receiver only; corrected revision with a readable difference |
| **Changes & history** | Append-only events by record type or for one record; owned follow-ups with resolution; retained source snapshots with their bytes and SHA-256, and for the coordinator the synthetic upstream adapter (observe a source, observe a new revision, withdraw) |

## 3. A ten-minute walk through the main journey

1. **Alex**: register → tick 020, 050, 060, 070 → *Prepare release set*. Set valves to 4. Try ticking 010: the preview refuses the split pump-and-control pair. Untick it, prepare, then *Submit for review*.
2. **Casey**: Review & release → *Review this set* → Accept.
3. **Drew**: *Authorise this exact set*, then *Issue technical release*. Tick *Exercise recovery* to see Outcome unknown, then *Recover the original result*.
4. **Alex**: *Prepare supply handover* → Procurement-ready, Approved, `SYN-DA-001`, receiver Robin → *Send to receiver*.
5. **Robin**: Supply handover → *Record receiving decision* → Accept.
6. **Coordinator**: Changes & history → Exact sources → H-102 → *Observe a new revision* (revision C). The release stays Issued and the acceptance stays Accepted; current use becomes *Reassessment needed*, line 020 shows it, and Follow-ups holds one owned item.

Other journeys: Casey returns CI-120 on line 030, Sam creates the corrected successor and supplies the firmware evidence, Casey accepts, Sam adopts. Casey accepts FA-220 on line 080 and the line stays *Scope decision* until the Coordinator records the commercial decision. Material set B rests on a coordination-only issue: it can be prepared and inspected and cannot be submitted for procurement.

## 4. Files

| Area | Path |
|---|---|
| Rules, parsers, access, reads, commands | `src/engineering/materials/{model,validation,context,reads,commands}.ts` |
| Screens | `src/engineering/materials/components/client/` |
| Shared menu primitive | `src/shell/secondary-menu.tsx`; `src/activities/components/client/my-work-shell.tsx` refactored onto it |
| Routes | `src/app/(business)/engineering/materials/`, `src/app/(business)/engineering/[id]/materials/`, `src/app/api/v1/engineering/**/materials/` |
| Styles | `src/app/styles/engineering-materials.css`; shared selectors widened in `src/app/styles/my-work.css` |
| Header, navigation, receipts, identities | `src/components/product-navigation.tsx`, `src/shell/navigation.ts`, `src/shared/receipts.ts`, `src/platform/{identity,permissions}.ts`, `src/components/business-session.tsx` |
| Database | `db/migrations/0029-engineering-materials.sql`, `db/seed-engineering-materials.sql`, `scripts/migration-registry.ts`, `scripts/demo-upgrade.ts` |
| Scenario | `scripts/engineering-materials-scenario.ts`, `tests/helpers/engineering-materials.ts` |
| Tests | `tests/unit`, `tests/http`, `tests/browser`, `tests/database` `engineering-materials.*` |

## 5. What remains open

- **Run by CI, 20 September.** On head `49c7bcc` all 17 checks of the PR passed. The database step ran 454 tests with none failed or skipped, the six EN-06 database tests among them; the application built; and the five EN-06 browser tests passed against the compiled application (four desktop, one phone). CI found three defects first, all corrected on the branch and recorded in the PR: a stale AD-01 capability catalogue, the 0029 correction below, and two Estimating upgrade proofs that snapshot `ppo.permission_grants`. A green CI is component evidence, not acceptance.
- **Not run locally:** the database suite, `npm run build` and the compiled-application browser suite. The first needs `ppo_synthetic_test`, which this machine cannot create; the build cannot run beside the dev server. The draft PR's CI is their first run, and the registry edits in eight existing suites are likewise unexecuted locally. Read the EN-06 suites' own per-test results there: the fixture-date expiry of ADR-0030 can turn the PostgreSQL job red for unrelated reasons.
- **Not built:** a kit parent chooser in the line form; impact entry in the alternate form; pointer drag column resize; a focused full-detail route for the inspector (it overlays instead).
- **Not decided:** real technical competence and release authority (D-002, D-019), the operational issue-purpose contract, MYOB items and units, commercial routing and thresholds, source currentness policy, the live receiving contract, external distribution (DK-03).
- **Not registered:** the mockup is not in the repository, so no UI baseline is registered.
- **Migration 0029 was corrected after it was applied locally.** CI on the draft PR failed two Estimating upgrade tests with `cannot ALTER TABLE "business_identities" because it has pending trigger events`: the runner applies all pending migrations in one transaction, 0026 backfills identities for existing estimates, and 0029 was the first migration since to alter that table. The failure was reproduced locally and the fix proven in rolled-back transactions. 0029 now runs `SET CONSTRAINTS ppo.identity_target IMMEDIATE` before its ALTERs and `DEFERRED` after them. It produces the same schema; only the file's bytes changed.
- **Local ledger, Dean's decision.** `public.ppo_migrations` holds version 29 under the first checksum (`c9484a1e75d1…`); the corrected file is `a4f348864915…`. Nothing runs migrations automatically and the running application is unaffected, but `npm run db:migrate` will answer "Migration checksum mismatch" until the row is updated, and since the merge that is true on `main` and on every branch taken from it: `UPDATE public.ppo_migrations SET sha256='a4f348864915c24262a2819cf9da33bb5171f7e04bdb7b1e04f045017d41d2b4' WHERE version=29 AND sha256='c9484a1e75d1425117604b0b730017c2e17e2f9b0b9be4e72f72196c5e333d8a';`. It was deliberately not run: the EN-07 worktree still carries the first bytes, so updating the row before that branch merges this one would move the refusal there instead. Recommended order: merge this branch into EN-07, then update the row once.
- **Coordination:** branch `feat/en07-change-impact-review` was started from this branch at `60004ed`, adds migration 0030 on top of 0029 and has applied it locally. It needs this correction merged, or its own CI will meet the same failure. Its seed also adds grants (four `engineering.change.*` rows are already in the local database), so it will meet the next one too: the two Estimating upgrade proofs snapshot the whole of `ppo.permission_grants`, and since `49c7bcc` they allow exactly seed 29's 31 additions, stated once in `tests/helpers/engineering-materials-grants.ts`. A later seed that adds grants must extend that set.
- **Restart:** `npm run dev` from the repository root. `npm start` is deliberately refused.
