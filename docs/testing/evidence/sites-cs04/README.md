# Sites CS-04 verification

<!-- versioning: git; committed history is authoritative -->

Owner visual review: **pending**. Synthetic fixtures only. Source: PPO - Design, named version **Sites — accepted**, nodes listed in the [page contract](../../../design/development/pages/scope-cs-04.md). The retained design captures are unchanged. No private file link, key or licensed artwork is included.

The current [build record](../../../delivery/sites-cs04-build.md) records executed checks and limitations. Tests are `tests/database/sites-register.test.ts`, `tests/unit/site-reference.test.ts` and `tests/browser/sites-native.spec.ts`. Browser comparisons use deterministic, explicitly synthetic API fixtures in `tests/helpers/sites-native.ts` plus a real API/reference journey. Fixtures never assert P4 confirmation or work authority.

Target viewports: desktop 1440 × 900, tablet 1024 × 900, phones 390 × 844 and 320 × 844; loading, no matches and error at 390. Owner/device acceptance and deployment are separate from these checks.
