# Receipt correction execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Source presence is distinct from successful execution, independent visual review, business acceptance and deployment.

## Starting evidence

Refreshed main: `24f3f461da8d2046e53c34eddd1a685e05c1b316`, merged #345. Checked PR head: `bd9be0fe8cdeb82724144c36de01f4871be5550b`, all 31 checks successful across 16 workflows. Its retained ledger records 585 unit / 59 HTTP / 763 PostgreSQL cases (455 + 308), both broad browser runs 582 passed / 79 retained skips, 18 compiled retained cases, dedicated Supply 22 PostgreSQL / five HTTP / 19 compiled cases and actual restart recovering 30 original receipts, 778 snapshot rows and four unchanged output files. Historical failed heads and explanations remain in the reservation ledger. All 27 observed post-merge assurance checks completed successfully; [exact independent evidence](main-postmerge-verification.json) retains URLs and completion times. No deployment claim.

## Local development checkpoints

A new isolated task cluster on loopback port 5664 uses only `ppo_synthetic_test`. No retained proof database is reset or repurposed. Live main schema 0064 was inspected before selecting migration 0065. New tables preserve original rows; there are no seeds, users or grants.

The first database proof refused a valid proposal because JS timestamp serialization lost PostgreSQL precision; supplemental receipt snapshots now use exact database JSON. The next proof exposed missing parentheses in a JSON subtraction guard; repaired before final proof. These failures are retained as development failures, not passing evidence. Raw task logs are outside the repository under the private task proof directory.

Local checks: production build, typecheck, studio, foundation, prototype and naming passed. Focused Receipt/Supply unit cases passed. The full Windows unit run had 583 passed / four failed (operator CLI timeout and existing private-path semantics); the unchanged-main comparison below reproduced the three private-path failures, while its CLI checks passed. The combined Receipt database case reached a valid native review but exceeded the unchanged 120-second local limit; a separate diagnostic applied the real native successor and receipt. This is not a passing full proof. Repeated within-request historical authority reads were reduced without caching across requests or bypassing original receipt checks.

Final-head unit, database shards, HTTP, both broad browser runs, both compiled groups, dedicated Supply, actual application/PostgreSQL restart and populated-upgrade results remain to be recorded. No retries, assertion weakening or extended deadlines are adopted.

## Visual and policy limits

Accepted native Receipt correction images are missing. Browser screenshots are execution captures, not owner acceptance. Device, screen-reader and paired source/reference review remain pending. Operational policy remains Not configured; no production, physical reversal, stock adjustment or external reservation authority is claimed.

## First published head b2e46c9

The dedicated compiled HTTP group passed all six cases, including the new Receipt journey. The restart write failed at native correction because the new immutable business-content guard also compared native audit metadata (`updated_by` and `last_reason`) as unchanged. Native `touch` legitimately replaces those with the current actor and correction reason. The repair continues to compare all business content exactly and separately requires those audit fields to equal the actual applying actor and frozen command reason. The test now deliberately uses a different reason. This failed head does not establish restart or final-head success.

Unchanged main at `24f3f46` reproduced all three Windows private-path unit failures in both the focused comparison and the full 585-case baseline run (582 passed / three failed). The contribution's extra operator CLI timeout remains separate; baseline CLI checks passed. No test deadline or assertion is relaxed.

Authority inspection also narrowed the receiving action to source/linked reads plus coordination on the independently owned Demand. Native application still requires authority over all actual effects. A site-scoped second owner fixture checks that receiving grants no ability to modify the converted Demand.

The contribution operator-CLI probe passed both operations in a focused diagnostic after the permission-read change (nine cases passed); the earlier full-run timeout remains recorded. The long Windows affected-owner scenario also exceeded the unchanged 120-second test limit after reaching independently owned receiving; it is not a full passing proof. Linux CI remains mandatory.

## Second published head 1c0160b

The first head's dedicated PostgreSQL group completed 27 passed / two failed without a timeout. Both failures were attributable: the new scoped-owner fixture omitted the native update flag, and the Stock case encountered the audit-metadata guard above. Both were repaired at this head; earlier results remain failures.

All six compiled HTTP cases passed again. Restart write recorded 37 receipts, actual PostgreSQL restarted, and a new application process recovered all original receipts and compared the exact retained snapshot and four output files. Verification then failed on a stale expected Demand version (6, now 8 after the initial Receipt and its correction). This is not a completed restart proof. The repaired proof explicitly checks nine main events, all three Receipt events, both receiving decisions, predecessor/successor data and each affected Demand's exact version increase, while preserving original reservation receipt checks.

## Proof responsibilities

These are test-source responsibilities, not a claim that a queued or failed run passed. Final execution is reported separately.

| Proof | Coverage |
|---|---|
| `tests/database/quotation-receipt-correction.test.ts` cases 1–3 | Exact decimal effects; independent receiving required; replay/payload conflicts; concurrent Apply; reserved operation/target/family refusal; immutable predecessor/successor and review; unchanged allocations/unrelated Demand; corrected acceptance and proposals; return/hold; fresh disposition; source/Receipt selective invalidation. |
| Cases 4–5 | A separate site-scoped owner receives only their own Demand; revoked receiving/read permissions; reassignment lineage; late-failure atomic rollback and inconclusive original lookup followed by exact retry. |
| Cases 6–7 | Populated 0064→0065 upgrade preserves every prior row (apart from explicit new nullable/default columns), grants, histories, allocations, old receipts and Draft/issued output bytes; Stock capacity stays independent; incomplete/unresolved observations and native Unknown-outcome hold. |
| Cases 8–9 | New zero-quantity shared allocation introduces a required owner; competing active referrals are refused; material identity relabelling is refused; explicit returned work allows replacement; corrected response and successor quotation hold pending action. |
| HTTP and compiled browser cases | Real proposal/receiving/review/Apply routes, authority refusal, desktop/mobile controls, unchanged separate ES-07 review boundary, lost committed response/reload recovery and inconclusive unsent operation/exact retry. |
| Restart script | Native correction follows retained allocation/reservation actions; actual PostgreSQL and application restart; exact original receipt replays, all retained snapshot rows and four output files; original and successor facts and affected versions. |
| Existing assurance groups | Original #343–345, both isolated broad PostgreSQL shards, both complete broad browser runs, retained compiled group, dedicated compiled Supply/shared-control group and mandatory aggregate gates remain required. |

The second head's combined database job reached its unchanged 25-minute limit: eight new Receipt cases passed and the competing-referral case failed before cancellation; the final retained Supply case was incomplete. The [CI isolation decision](../../../decisions/ci-retained-suite-isolation.md#es-07-owned-receipt-correction-proof-budget) makes the Receipt file a separate required matrix group with its own existing disposable database. No command, assertion, test/job deadline or mandatory broad suite is removed or relaxed.

The competing-referral fixture failure was reproduced locally without a timeout: it attempted to change a converted Demand's immutable item identity to match a different quotation's OneOff item. The native `supply_record_guard` correctly refused it. The repaired test explicitly asserts that refusal, adds a matching native Demand through the existing creation/allocation commands, then proves zero-link invalidation, refused competing referral, explicit return/replacement lineage, fresh required decisions and the retained original operation reservation. No native identity guard changes. Current independent OneOff conversions cannot be made to share material by relabelling; cross-target reservation checks remain defensive and are not claimed as a demonstrated multi-quotation catalogue journey.

## Third published head 9be269c

[Dedicated runtime job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37253667513/job/111586212182) passed all six HTTP and 25 compiled desktop/mobile/shared-control cases. Actual PostgreSQL/application restart recovered 37 exact original receipts, preserved 997 snapshot rows and four unchanged Draft/issued HTML/PDF files. [Machine verification](9be269c-restart-verification.json) binds the source head, restart times, native receipt, predecessor/successor, both affected receiving decisions and retained reservation receipt. This precedes the database-fixture/isolation repair and is not final-head proof.

Desktop and 320px execution captures were inspected: no horizontal overflow was present. The completed proposal still displayed its now-changed comparison as stale receiving. The final UI labels those acceptances as retained evidence of the completed action and removes renewed-receiving controls for that applied proposal; current operational holds remain. The host browser assertion covers this distinction. This inspection grants no independent paired visual, physical-device, screen-reader or owner acceptance.

Exact final-head check URLs and completion are maintained in [PR #346](https://github.com/deanrfiedler-gif/powerplants-one/pull/346). Earlier failed/cancelled heads remain above; passing earlier-head proof does not establish the final head.

The third head completed all 31 dedicated PostgreSQL cases: 30 passed and the same immutable-item fixture failed. All 22 retained #344/#345 cases passed. Its aggregate correctly failed; the later fixture repair still requires fresh complete proof.
