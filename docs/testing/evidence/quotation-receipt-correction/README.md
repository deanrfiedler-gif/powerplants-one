# Receipt correction execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Source presence is distinct from successful execution, independent visual review, business acceptance and deployment.

## Starting evidence

Refreshed main: `24f3f461da8d2046e53c34eddd1a685e05c1b316`, merged #345. Checked PR head: `bd9be0fe8cdeb82724144c36de01f4871be5550b`, all 31 checks successful across 16 workflows. Its retained ledger records 585 unit / 59 HTTP / 763 PostgreSQL cases (455 + 308), both broad browser runs 582 passed / 79 retained skips, 18 compiled retained cases, dedicated Supply 22 PostgreSQL / five HTTP / 19 compiled cases and actual restart recovering 30 original receipts, 778 snapshot rows and four unchanged output files. Historical failed heads and explanations remain in the reservation ledger. All 27 observed post-merge assurance checks completed successfully; [exact independent evidence](main-postmerge-verification.json) retains URLs and completion times. No deployment claim.

## Local development checkpoints

A new isolated task cluster on loopback port 5664 uses only `ppo_synthetic_test`. No retained proof database is reset or repurposed. Live main schema 0064 was inspected before selecting migration 0065. New tables preserve original rows; there are no seeds, users or grants.

The first database proof refused a valid proposal because JS timestamp serialization lost PostgreSQL precision; supplemental receipt snapshots now use exact database JSON. The next proof exposed missing parentheses in a JSON subtraction guard; repaired before final proof. These failures are retained as development failures, not passing evidence. Raw task logs are outside the repository under the private task proof directory.

Local checks: production build, typecheck, studio, foundation, prototype and naming passed. Focused Receipt/Supply unit cases passed. The full Windows unit run had 583 passed / four failed (operator CLI timeout and existing private-path semantics); comparison against unchanged main is in progress. The combined Receipt database case reached a valid native review but exceeded the unchanged 120-second local limit; a separate diagnostic applied the real native successor and receipt. This is not a passing full proof. Repeated within-request historical authority reads were reduced without caching across requests or bypassing original receipt checks.

Final-head unit, database shards, HTTP, both broad browser runs, both compiled groups, dedicated Supply, actual application/PostgreSQL restart and populated-upgrade results remain to be recorded. No retries, assertion weakening or extended deadlines are adopted.

## Visual and policy limits

Accepted native Receipt correction images are missing. Browser screenshots are execution captures, not owner acceptance. Device, screen-reader and paired source/reference review remain pending. Operational policy remains Not configured; no production, physical reversal, stock adjustment or external reservation authority is claimed.

## First published head b2e46c9

The dedicated compiled HTTP group passed all six cases, including the new Receipt journey. The restart write failed at native correction because the new immutable business-content guard also compared native audit metadata (`updated_by` and `last_reason`) as unchanged. Native `touch` legitimately replaces those with the current actor and correction reason. The repair continues to compare all business content exactly and separately requires those audit fields to equal the actual applying actor and frozen command reason. The test now deliberately uses a different reason. This failed head does not establish restart or final-head success.

Unchanged main at `24f3f46` reproduced all three Windows private-path unit failures in both the focused comparison and the full 585-case baseline run (582 passed / three failed). The contribution's extra operator CLI timeout remains separate; baseline CLI checks passed. No test deadline or assertion is relaxed.

Authority inspection also narrowed the receiving action to source/linked reads plus coordination on the independently owned Demand. Native application still requires authority over all actual effects. A site-scoped second owner fixture checks that receiving grants no ability to modify the converted Demand.

The contribution operator-CLI probe passed both operations in a focused diagnostic after the permission-read change (nine cases passed); the earlier full-run timeout remains recorded. The long Windows affected-owner scenario also exceeded the unchanged 120-second test limit after reaching independently owned receiving; it is not a full passing proof. Linux CI remains mandatory.
