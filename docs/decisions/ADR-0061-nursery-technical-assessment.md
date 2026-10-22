# ADR-0061: Nursery technical assessment and retained studies

<!-- versioning: git; committed history is authoritative -->

Status: implementation choice for the user-authorised N2 increment; independent review and business validation pending.
Date: 22 October 2026. Owner: Dean Fiedler. Builder: Codex.

## Context

The user requested N2 after N1 merged in PR #662. The [Nursery specification](../blueprints/nursery-automation-configurator.md) defines NAC-R01–R09 and N2 stages, checks and outputs. The shared plan retains O1–O15 / DP1–DP8; Products publication and paired CPQ receiving are separate dependencies. No manufacturer rating, operating standard or supplier approval is supplied by this instruction.

## Decision

Reuse TypeScript, PostgreSQL, existing estimating read/edit authority, shared operations and the existing exact Rational arithmetic helper. Add immutable assessment revisions bound to an exact N1 revision and its Discovery source. Keep N1 bytes unchanged. Save computes results on the server and retains the rule edition, source snapshot, exact fractions, findings and two hash-bound HTML outputs: an internal estimating study and a separate internal clarification list. Downloads recheck current source authority. These are bounded internal N2 outputs, not published shared CPQ manifests or customer quotation documents.

Support explicitly phased sequential stages. Branches, shared operators, recirculation and asynchronous cycles remain captured but unassessable by this edition. Stage rates describe the complete stage; multiple processing machines require a supported topology model rather than multiplying an individual rate. Missing required stages/rates/interfaces never become capacity passes. Current and Future are evaluated separately, and Both is an explicit stage choice.

Use NAC-R02–R05/R09 exact arithmetic without display-rounding acceptance. Gross and net-good rates cannot be mixed in one minimum-rate comparison. Stops and changeovers are deducted once; net-good rates do not apply quality loss again. Zero buffer demand is not applicable. Known mandatory violations remain Not suitable; missing/conflicting/unreviewed equipment evidence remains Needs confirmation. A recorded internal review is not manufacturer approval. The starter Javo catalogue retains unconfirmed limits and unmapped Variants.

Keep technical, installation, spare, waste and purchase-pack counts separate. Pack conversion has a recorded review and source; no quantity is emitted to Products/CPQ. Reused/customer/stock/retained/manual dispositions do not create purchase demand. Installation work is independently recorded; labour, standards, rates and scope coverage remain shared CPQ responsibilities.

Bound proposals to 256 KiB, 20 stages, 20 scenarios and 40 directed connections. Preserve stable child identities and reject excess without truncation. These are N2 study limits, not a replacement for the shared 100-active-line receiving contract. Numeric source inputs retain the existing nonnegative 100,000 / three-decimal envelope, with whole-count and fraction constraints. Unsupported or uncertain inputs can be saved with findings; invalid input structure is refused.

## Alternatives and consequences

Extending the N1 JSON schema would rewrite its existing discovery contract and blur exact historical meaning. Browser-only assessment would lose recoverable evidence. A new calculation or document service adds unnecessary infrastructure. An additive child revision table and existing exact arithmetic preserve history and require no framework, dependency, permission or seed.

Migration 0117 was reserved in the draft claim. Validate populated upgrades and all pinned migration ledgers, exact expected arithmetic, technical failure precedence, phase isolation, authority/concurrency/original receipts, immutable outputs, old N1 preservation and desktop/phone workflows. Different-model review is required for the new estimating rules and migration before merge. N3/N4, operational review and deployment remain separate.
