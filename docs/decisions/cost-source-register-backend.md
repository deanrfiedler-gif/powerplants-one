# Cost sources register backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Status: bounded synthetic backend authorised by Dean's instruction to proceed with the recommended ES-03 increment. Author verification, independent review, page implementation, owner acceptance and deployment remain separate.

Traceability: BC-01, PPO-010, EST-01/04/05/07, ES-03, AT-01/03/26, ADR-0027. Sources: [accepted Cost sources design](cost-sources-design.md), [native cost-source contract](../contracts/estimating-cost-sources.md) and [backend plan](../delivery/backend-completion-plan.md). Preserve all parent IDs and issued evidence.

## Bounded outcome

Add `GET /api/v1/estimating/cost-sources/register` for the accepted register's reads. Return one current revision per source, its lowest-minimum quantity tier and exact cost, source owner, revision author, review eligibility, and explicit expiry facts. Retain the existing list/detail DTOs and source/review/estimate-refresh commands. The existing exact detail API supplies the record window's revision evidence, predecessor, history and permitted estimate bindings; this increment does not redefine their scope or completeness.

Reuse TypeScript, Next.js, PostgreSQL, existing source contexts and hashes, and the native workspace lock. No new technology, dependency, migration, seed, capability or stored price calculation is needed. An additive endpoint avoids silently changing existing list/count semantics. A separate stored register would duplicate the native source authority; client-side counts over the old 100-row response would misstate the complete permitted population.

## Query and response contract

| Field | Meaning |
|---|---|
| `q` | Literal case-insensitive substring over reference, title, supplier label and item. At most 100 characters; control characters rejected |
| `supplier` | Literal case-insensitive substring over the recorded supplier label, at most 100 characters. This is not a canonical supplier identity |
| `company_id` | Optional explicit company UUID, intersected with current source permissions and working-company context |
| `view` | `all` (default), `mine` (source owner), `awaiting_my_review` (currently Submitted, independent owner/author and source-review duty) |
| `state` | `all` (default) or the five native states Draft, Submitted, Reviewed, Returned, Rejected |
| `validity` | `all` (default), `unknown` (no recorded expiry), `past` (expiry before the response's Brisbane date) |
| `limit`, `offset` | Canonical whole-number strings, default 25/0; limit 1–100, offset 0–1,000,000. Newest source update first, UUID tie-break |

Unknown keys/choices and malformed values return 422. Reads are private/no-store, use the existing authenticated gateway and provide no write handler. Offset paging describes the current result, not an immutable cross-request snapshot; concurrent source updates can reorder later pages, so refresh after changes.

`counts_scope: AllAuthorisedSearchMatches` means menu counts cover all currently permitted matches for `q`, `supplier` and `company_id`, irrespective of page size, offset or selected view/state/validity. `counts_filters` identifies that basis. `counts` contains all, mine, awaiting_my_review, each native state, and unknown/past expiry. These views overlap and must not be summed. `matching_count` applies every selected filter; `next_offset` comes from one permitted lookahead row. Empty and beyond-end pages still return their applicable full counts. Counts describe current source metadata, not a verification of every unpaged revision's evidence hash.

Rows retain stable source/revision IDs, header version, content hash, company, reference, owner/author IDs, native state, source facts, update time and `tier_1` with `minimum_quantity` and `unit_cost` decimal strings. This is the first recorded tier, including explicit zero cost and a minimum greater than one; it is not a quotation for quantity one. Units, AUD and ExcludingTax are explicit. Each returned revision is validated through the native content/hash reader. No rounding, pricing, FX or unit-conversion rule is added.

`your_submission` applies only to Submitted rows owned or authored by the actor. `can_review` additionally requires current company-scoped `estimating.source.review`; a missing review grant never labels somebody else's submission as the actor's. The actual review command still enforces state, exact version/revision and independence. The endpoint does not approve a source, refresh an estimate or add cost sources to the separate ES-04/05 review queue.

`as_of`, `validity_date` and `validity_timezone: Australia/Brisbane` make expiry comparison explicit. Expiry equal to today is not past; unknown expiry is never perpetual validity. These display facts add no eligibility rule: native pricing continues to validate the caller's explicit pricing date against the recorded effective/expiry dates. No expiring-soon threshold or operational supplier policy is invented.

## Authority, concurrency and failure

Both `estimating.read` and `shared.read` must currently reach the source's company. Workspace/company grants, active users, validity dates and working-company narrowing follow the native permission rules. A site-only grant does not grant company-level source access. Hidden sources contribute no rows, counts or continuation hints. Owner and author UUIDs are existing source attribution, not a new user-directory lookup.

Use one READ COMMITTED transaction and the same workspace row lock as native source commands. After resolving exact returned revisions, repeat the permission-scoped metadata/count/window query, including the lookahead and source version/revision/review eligibility, and recheck both read capabilities. If it differs, return 409 `CostSourceRegisterChanged` and require refresh rather than publishing stale counts or affordances. Complete duty loss returns the existing Forbidden error; exact-source denial/integrity errors fail the read without evidence. There is no receipt, audit event, outbox event, estimate change or other business effect from these reads.

## Verification and remaining work

The [execution ledger](../testing/evidence/cost-source-register/README.md) records actual checks and limits. Database and HTTP cases join native creation, submission, independent decisions and immutable revision recovery; cover exact tier values, filters, date boundaries, counts beyond 100, denial/revocation and unchanged business effects. The relevant existing ES-03 suites remain in their established CI lanes.

Accepted Figma page/shell implementation, supplier-identity adoption, broader evidence/Used-in UI, selection/export, source-review queue integration, independent visual/device/business review and deployment remain separate. No current visual review fingerprint is changed. This read-only backend implements the documented display needs; it does not resolve the accepted design's remaining policy questions.
