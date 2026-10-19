# People register — application verification

<!-- versioning: git; committed history is authoritative -->

Scope **CS-02**. Owner: Dean Fiedler. Contributor: Codex. Branch `codex/accepted-ui-build`, draft PR #624, based on main `d512bd38`. Owner visual/device review **pending**. Application deployment is not claimed.

The accepted source is **PPO - Design**, page `1395:150275`, named version **People — accepted**: desktop `1395:150312` (1440 × 900), tablet `1395:150835` (1024 × 900), phone `1395:151069` (390 × 844), loading `1395:151245`, empty `1395:151303`, error `1395:151346` (390 × 844), notes `1395:151383`. Read live metadata, design context, variables and screenshots. Shell sources: top bar `35:138`, Service rail `198:3778`, compact phone header `1530:110`, named **Phone header amendment — accepted**. The [retained captures](../../../reference/ui/customers/people-design-r01/README.md) remain unchanged.

## Fixture and test boundaries

`tests/helpers/people-register.ts` contains the eight fictional frame contacts, `.example` addresses, ACMA fictional-range phone numbers and stable internal fixture IDs. Browser composition tests intercept only the People read; the shell runs in the application. A separate browser case uses the actual read and opens the exact receiving record. The test-database suite executes the real SQL and existing commands against `ppo_synthetic_test` only. No operational data or Pro icon artwork is retained.

Application captures use the repository's local fallback icons with the Kit unavailable on 127.0.0.1. Font Awesome drawing differences are expected; the existing Kit mapping supplies Pro Light only under the repository's opt-in runtime contract. No reference capture is rewritten.

## Results

- Database: **2/2 passed** on 20 October 2026. Permitted rows/counts/options, stable bounded pages, actor/company/filter-bound cursor refusal, invalid filters, current affiliations, primary contacts, latest notice preference and restricted history. Uses only existing migration 0109 and earlier test history; no new migration or capability.
- Initial typecheck found two invalid icon names; corrected to existing mapped icons. Final check pending.
- Initial dev launch rejected the node_modules junction (Turbopack filesystem root). Removed only the verified junction, installed the unchanged lockfile into this worktree, and restarted successfully on loopback port 3034.
- The existing `ppo_synthetic` database lacks 0109's notice-preference table. It was not upgraded. Application verification uses the disposable `ppo_synthetic_test` database after its normal test setup.
- Browser comparison, studio, lint, final typecheck, unit, build and documentation results are being collected. No pending check is claimed as passed.

## Recorded differences and questions

The [page contract](../../../design/development/pages/route-people.md#recorded-gaps-and-open-questions) owns the complete list. In particular P9 removes two old phone toolbar rows, shifting the first list row from the retained frame's y=166 to y=56. The inherited tablet overlay replaces the drawn 20 px strip. The old saved-view workflow remains reachable separately; the accepted page draws no replacement. Owner review is independent of test results.
