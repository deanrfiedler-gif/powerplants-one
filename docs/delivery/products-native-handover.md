# Products native programme handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. PD-01–05 completion authorised on 7 October 2026. [PR #358](https://github.com/deanrfiedler-gif/powerplants-one/pull/358), branch `codex/products-completion`, was based on main `58679be` and is reconciled with current main `fbf2ed3`. Local implementation and integrated Products proof are complete. Head `4033004` passed native Products and 42 other checks; its four failed checks are repaired as recorded below. The PR remains draft pending fresh repair-head CI. Earlier Chrome setup failures remain historical. Owner acceptance and deployment remain separate.

The original unfinished `feat/products-catalogue-native` checkout at `cad98aca` remains unchanged. Its source, tests and retained captures were copied with a file-hash inventory and reconciled with current main. This work retains all newer Scheduling, Field, Supply and Estimating changes.

Native routes cover catalogue/detail, authoring/review/publication, exact ES-03 pricing, compatibility/replacements and staged synthetic JSON import. The detail-to-pricing handoff preserves the selected revision through reload and recovery of an uncertain source-binding save. The original receipt returns to that exact revision without duplicate effects. Published-basis navigation is explicit; long identifiers remain available in a phone-friendly disclosure. Technical and commercial access remain separate.

Migration **0052** replaces only the unpublished Products 0049 proposal. Installed migrations are unchanged. Current-main schema through 0071 was inspected in a separate task-owned loopback cluster. Upgrade proof covers 0025 (pending identity events across 0026), 0048 and an already-installed 0071 ledger with missing 0052. Exact original rows, ledgers, receipts, grants, users and repeat-run stability are asserted. The hosted-upgrade gate remains at 71 and includes an explicit review of the reserved-gap addition.

Seed 52 adds four named local synthetic identities and 22 exact Company A grants. Reader, author, independent reviewer and publisher have separate duties. The current coordinator and hosted invitations gain no Products authority. See the [decision](../decisions/ADR-0048-products-native-catalogue.md#completion-decision--7-october-2026) and [contract](../contracts/products-catalogue.md).

## Verification and design

The [evidence ledger](../testing/evidence/products-native/README.md) records current executed results, earlier failures and the paired design observations. New tests cover historical pricing navigation/reload, actual seeded access, and both migration installation orders. Design register, guides, component fixture and access-review contract are maintained together. Proposed native layouts and owner acceptance remain distinct.

Local proof includes 10 focused units, 12 Products database/access/integration/upgrade cases, compiled HTTP routes, 12 browser journeys across the original run and unchanged isolated rerun, and all eight affected command journeys after the final pricing-recovery repair. Actual restart proof retains 15 operations and 13 exact table projections across three application processes and two PostgreSQL restarts. The ledger distinguishes each tested source/build and retains the screenshot failure, broader regression results and three Windows unit failures reproduced on unchanged main. Build, lint, access-model, design-register and documentation checks pass.

The paired visual review retains 45 captures and names the 17 inspected images. It covers all six desktop surfaces, phone layouts and focused identifier disclosures against issued Products r04, Supplier Pricing r01 and shared r22 references. Native cards and the publication/compatibility/import forms remain proposed adaptations. No accepted design fingerprint or owner review has been inferred from these checks.

The retained original implementation reported four units, six domain cases and a build passing; its final HTTP/browser/upgrade/restart record was unfinished. Those observations do not establish current-main compatibility. The completion ledger records fresh proof separately.

## CI integration repair — 7 October 2026

The Leads and second database-shard failures shared one omitted seed-52 expectation. The CRM presentation job found six Products workspace entries pointing to an absent design-record ID and explicit rail/More lists that still assumed Products was unavailable. The repair adds the exact seed, binds each route to its existing proposed record and checks the eighth Sales destination and department-preserving Products link. Current-main comparison uses the identical Git tree of checked diamond head `14102dc` and main `fbf2ed3`, plus main's successful visual execution. All original checks and issued references remain.

Main now contains migration 0072. Combined assertions retain both 0052 and 0072; the reviewed hosted gate stays at 72. The Products suite retains 0025/0048/0071 upgrade cases and adds missing-0052 installation after 0072. The [repair record](../testing/evidence/products-native/ci-repair.json) separates failed-head, local repair and fresh-CI results; it retains the local shell deadline failure and unchanged successful rerun.

## Boundaries and later work

Catalogue publication does not approve installation, release Engineering substitutions or reprice saved estimates/quotes. ES-03 owns costs and deliberate refresh; Engineering and Equipment own application/installed impact. MYOB, SharePoint and CAD retain their authority. Import supports bounded synthetic JSON only. Production imports, live supplier/stock connections, FX/landed-cost policies, pagination and a new product-to-estimate selection journey remain later work.

No merge, deployment, business acceptance or physical-device acceptance is claimed by this contribution.
