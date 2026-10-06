# Products native programme handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. PD-01–05 completion authorised on 7 October 2026. Branch: `codex/products-completion`, based on refreshed main `58679be`. Verification in progress; owner acceptance and deployment remain separate.

The original unfinished `feat/products-catalogue-native` checkout at `cad98aca` remains unchanged. Its source, tests and retained captures were copied with a file-hash inventory and reconciled with current main. This work retains all newer Scheduling, Field, Supply and Estimating changes.

Native routes cover catalogue/detail, authoring/review/publication, exact ES-03 pricing, compatibility/replacements and staged synthetic JSON import. The detail-to-pricing handoff now preserves the selected revision through reload. Published-basis navigation is explicit; long identifiers remain available in a phone-friendly disclosure. Technical and commercial access remain separate.

Migration **0052** replaces only the unpublished Products 0049 proposal. Installed migrations are unchanged. Current-main schema through 0071 was inspected in a separate task-owned loopback cluster. Upgrade proof covers 0025 (pending identity events across 0026), 0048 and an already-installed 0071 ledger with missing 0052. Exact original rows, ledgers, receipts, grants, users and repeat-run stability are asserted. The hosted-upgrade gate remains at 71 and includes an explicit review of the reserved-gap addition.

Seed 52 adds four named local synthetic identities and 22 exact Company A grants. Reader, author, independent reviewer and publisher have separate duties. The current coordinator and hosted invitations gain no Products authority. See the [decision](../decisions/ADR-0048-products-native-catalogue.md#completion-decision--7-october-2026) and [contract](../contracts/products-catalogue.md).

## Verification and design

The [evidence ledger](../testing/evidence/products-native/README.md) records current executed results, earlier failures and the paired design observations. New tests cover historical pricing navigation/reload, actual seeded access, and both migration installation orders. Design register, guides, component fixture and access-review contract are maintained together. Proposed native layouts and owner acceptance remain distinct.

The retained original implementation reported four units, six domain cases and a build passing; its final HTTP/browser/upgrade/restart record was unfinished. Those observations do not establish current-main compatibility. The completion ledger records fresh proof separately.

## Boundaries and later work

Catalogue publication does not approve installation, release Engineering substitutions or reprice saved estimates/quotes. ES-03 owns costs and deliberate refresh; Engineering and Equipment own application/installed impact. MYOB, SharePoint and CAD retain their authority. Import supports bounded synthetic JSON only. Production imports, live supplier/stock connections, FX/landed-cost policies, pagination and a new product-to-estimate selection journey remain later work.

No merge, deployment, business acceptance or physical-device acceptance is claimed by this contribution.
