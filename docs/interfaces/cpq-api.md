# Native CPQ API and UI handover

<!-- versioning: git; committed history is authoritative -->

Status: native backend and CPQ UI implementation contract, expanded by Dean's 13 October instruction. Read with [delivery plan](../delivery/cpq-backend-plan.md), [design decision](../decisions/cpq-figma-ui.md) and [UI handover](../delivery/cpq-ui-handover.md). All paths below start with `/api/v1`. All DTOs are internal commercial data; never expose them in a customer portal. Existing session, working-company selection, origin checks and private/no-store responses apply.

## Routes

| Method | Path | Input | Output / purpose |
|---|---|---|---|
| GET | `/cpq/releases?company_id=UUID` | Company ID | Up to 100 releases, active revision and caller duties |
| POST | `/cpq/releases` | Command envelope, `id`, `company_id`, `expected_version`, `definition` | Create a release at version zero; otherwise append a revision and return it to Draft |
| GET | `/cpq/releases/:id` | None | Current revision, revision/review history and active company release |
| GET | `/cpq/revisions/:id` | None | Exact immutable definition |
| GET | `/cpq/revisions/:id/tests` | None | Execute saved fixtures; return expected/actual results and evidence hashes |
| POST | `/cpq/releases/:id/review` | Envelope, `expected_version`, `revision_id`, `content_hash`, `outcome` | Independently approve/reject exact content; approval requires passing fixtures |
| POST | `/cpq/releases/:id/activate` | Envelope, `expected_version`, `revision_id`, `content_hash`, `expected_activation_version` | Third-person publication and company activation; zero activation version means none yet |
| GET | `/estimating/workspaces/:id/cpq/preview?option_id=UUID&revision_id=UUID` | Selected saved option/revision | Exact binding, binding hash, release definition, discovery and current estimate |
| POST | `/estimating/workspaces/:id/cpq` | Envelope, run `id`, `option_id`, `revision_id`, `binding_hash`, `parent_id`, `input` | Save a Ready or Blocked run; `parent_id` is null on first calculation |
| GET | `/estimating/workspaces/:id/cpq` | None | Latest 50 authorised runs, totals and diagnostic counts |
| GET | `/cpq/runs/:id` | None | Frozen inputs, release/discovery binding, result, explanations and hashes |
| GET | `/cpq/runs/:id/compare?with=UUID` | Another authorised run in this workspace | Before/after lines, totals and diagnostics |
| GET | `/cpq/runs/:id/adoption` | None | Exact preview hash, retained manual costs, generated costs and current title/scope |
| POST | `/cpq/runs/:id/adoption` | Envelope, `preview_hash`, `result_hash`, `estimate_id`, `title`, `scope` | Atomic native estimate version and CPQ provenance; never accept client-calculated cost lines |
| GET | `/estimating/estimates/:id/cpq-products?version_id=UUID` | Exact saved native version | Internal exact adoption/run/hash and per-line Product provenance, or NoCpqAdoption; native estimate plus CPQ/Products read authority |
| GET | `/operations/:operation_id` | Original operation ID | Existing authorised command recovery contract |

Commands include `schema_version: 1`, a caller-generated UUID `operation_id`, and a meaningful `reason`. Mutations return the existing OperationReceipt (`record_id`, `record_version`, `state`, `accepted_at`, `receipt_id`, `task_ids`, `warnings`). HTTP 201 is a first accepted write; 200 is an exact replay. Retain the original payload and operation ID when the response is uncertain. Reuse with different content returns `OperationConflict`. All current permission and source checks happen before recovery returns a receipt. `CpqChanged` outbox events contain identifiers, never pricing or rule payloads; no external dispatch is added.

## Permissions and state transitions

All CPQ calls require `shared.read` and `cpq.read` in the current company; `cpq.read` includes costs and rules. `cpq.author` creates immutable draft revisions; `cpq.review` records review; `cpq.publish` activates an approved release; `cpq.calculate` creates/adopts calculations. Only Company/Workspace grants are accepted. No seed grants these duties. Use the existing independent local access-request workflow to assign approved test roles. Hosted users gain no CPQ duty from the migration.

Calculation and adoption also require current native estimating ownership, `estimating.read`/`estimating.edit`, source visibility and a selected Active option with Complete discovery. An independent reviewer cannot edit the estimate merely because they have a CPQ review duty.

Schema-1 release roots retain Draft → Reviewed or Rejected → Published. Design schema 3 adds an explicit Sealed state: Draft → Reviewed → Sealed → Published; Rejected content must be revised. Seal requires the exact independently approved revision and a third actor. Sealing does not change the company head; activation is a separate command. Appending a revision returns the root to Draft and never rewrites the active historical revision. A run is permanently Ready or Blocked. Later edits produce a new run with a parent pointer. A Ready run can become stale without changing its historical result; adoption rechecks the current basis.

## Definition and input shape

Authoritative TypeScript DTOs are `src/cpq/types.ts`; strict semantic validation is `src/cpq/validation.ts`. Executable synthetic examples are `tests/helpers/cpq.ts`. Unknown fields are rejected.

- Definition: schema 1, label, currency AUD, fact dictionary, component/price definitions, material/labour rules, constraints, and at least one independent expected-result fixture. A release is limited to 60 KB; HTTP commands to 64 KiB.
- Facts: stable lowercase key, meaningful label/unit, Decimal/Boolean/Choice type, explicit required flag, allowed choices. Decimal values are strings. Missing values normalize to null; null never means zero or false. Stable instance UUIDs keep generated target identities across recalculation.
- Conditions: ALL/ANY with items, NOT with item, or EQ/NE/GT/GTE/LT/LTE with a registered fact and typed literal. Conditions are bounded to eight levels and 100 nodes. Boolean and choice values support EQ/NE only.
- Parts: key, description, category, unit, resolver, explicit source, validity interval and strictly increasing minimum-quantity price tiers. Validity is checked against the explicit pricing date, not a claim of current market freshness. No live ERP lookup is implied.
- Rules: stable key, description, phase, condition, part, quantity expression and integer priority. Expressions allow registered numeric scalar names, literals, parentheses and `+ - * /` only. Labour may use `bom_<part_key>` for the resolved quantity of that material part, preserving its declared unit; quantities in different units are never implicitly summed. Result quantities use the native three-place quantity contract; money uses exact decimal arithmetic and native rounding.
- Constraints: a typed applicability condition, required condition and actionable diagnostic. Unknown applicability or requirement is a blocker.
- Calculation input: pricing date, one to twenty labelled instances with fact values, and up to 100 overrides. Each override has stable target, exact generated basis hash, Quantity/SellPrice/Suppress kind, value (null for suppression), and reason. A changed basis or missing target blocks adoption. Revoke an override by omitting it from an explicitly reasoned new run; history retains the previous run.

Expose the restricted quantity editor only to rule authors. Estimators should receive labelled controls, optional/unknown states, units and choices. Keep UUIDs/hashes in evidence drawers and API state, not ordinary user-facing input fields.

## Error and recovery UX

### Design schema 3 additions

Schema 1 retains its accepted fields and serialised results. Schema 2 is the opt-in published Product profile described below; it retains schema-1 arithmetic. Schema 3 does not accept Product bindings. A combined design/mapping profile remains separate. Schema 3 adds the following explicit fields; unknown fields still fail validation.

- Facts: Integer/Text, description, System/Global/Shared scope, authored source, minimum/maximum and optional registered discovery `binding.question_id`. Bound values are read from the selected discovery and cannot be overridden by the browser. Integer rejects fractions. Instance `not_applicable` lists only optional null facts; it is distinct from unknown.
- Conditions: `ALWAYS`, `KNOWN`, `NOT_APPLICABLE` and typed `IN`, plus the existing boolean/comparison operators. Empty groups remain invalid. Formulas add exact `ceil(x)`, `floor(x)`, `min(a,b)`, `max(a,b)` and `round(x,places)` with an integer precision of 0–12 (omitting places retains whole-number rounding); signed ties round away from zero. All arguments count toward the existing token, depth and evaluation budgets. Per-rule parameters have stable keys, labels, exact values and units. Arbitrary code/external lookups remain impossible.
- Parts: optional scope `{kind: System|Shared|Configuration, group_fact}`. Shared requires a Text/Choice grouping fact and resolves once per group; Configuration resolves once. Shared facts that disagree become unknown, never an arbitrary first value. Labour BOM references must use material parts in the same output scope. Decision tables govern System rules only. Missing shared groups block. Frozen `price_context` records book, policy, source currency, source-currency units per AUD and recorded instant; each tier includes source unit cost and validates its rounded AUD conversion. Future/expired price evidence blocks use.
- Design: option sets and typed availability, acyclic component structure, shared capacity grouped across systems, UNIQUE/PRIORITY decision tables and pricing policy. Known-value table coverage enumerates exact boundaries, valid integer/range partitions and equality classes, capped at 256 partitions. Unknown runtime inputs still block; coverage is not a general satisfiability proof. Explicit milestone proposals retain condition, anchor, signed offset (±365 days) and BusinessDays/CalendarDays. No calendar date is fabricated.
- Results: condition/rule traces, resolution contributions (including non-winners), calculated/effective quantity, excluded/conflicting/needs-review line states, selected price tier, options, capacities, table outcomes, pricing basis and milestone proposals. Separate configuration, pricing and adoption readiness explains why a proposed price can require ES-05 approval while the saved estimate handover is available. All original evidence is hashed.
- A stale schema-3 adjustment remains effective and visibly Needs review, blocking use. Explicit rebase resubmits its value/reason with the current basis hash; restore removes it in a newly saved evaluation. Schema-1 stale behaviour remains unchanged. Missing targets retain orphan diagnostics.

| Method | Additional path | Contract |
|---|---|---|
| GET | `/cpq/configurations?company_id=UUID` | Latest authorised evaluation per option, up to 100 candidates; totals and calculator duty |
| GET | `/cpq/rules?company_id=UUID` | Current saved and active rule members, exact revision, immutable rule version, `is_current`, `is_active` and author duty; active rows first, limit 100 |
| POST | `/cpq/validate` | Company and definition; validate and test without saving, return fixture results and table coverage |
| GET/POST | `/cpq/drafts` | Scoped draft list / receipt-backed CAS save; Rules or Configuration |
| GET | `/cpq/drafts/:id` | Current draft plus immutable history metadata; hash verified |
| GET | `/cpq/revisions/:id/compare?with=UUID` | Same-release semantic differences by stable keys |
| POST | `/cpq/releases/:id/seal` | Envelope, expected version, revision ID and content hash; third-person exact seal |
| POST | `/estimating/workspaces/:id/cpq/preview` | Option/revision/binding hash/input; same authoritative calculation as Save with no write |

Draft commands contain `id`, company, kind, label, raw `content`, expected version and nullable source bindings. Rules bind release/base revision; Configuration binds estimating workspace, option, discovery revision, base release revision, optional base run and binding hash. Every binding is authorised; company/kind/option cannot be moved. Content is bounded to 60 KB, 24 levels and 6,000 nodes. No raw draft becomes executable until validated. A Rules draft can be attached once to a new release by version creation. Release save accepts optional `draft:{id,expected_version}` and atomically records the normalised version in that draft's history. Identical earlier rule bytes reuse their immutable rule version when composing a release.

Calculate accepts optional `draft:{id,expected_version,label}` and atomically saves the run and matching draft revision. A draft version conflict rolls back the run, audit and receipt. Exact run reads add stable evaluation number and binding hash; list history includes saved time/author/input. Release reads add seals, activation history, rule versions, membership and caller duties. Adoption previews add `milestone_proposals`; the immutable adopted run and native estimate audit retain them as proposals, without creating scheduled dates. Existing customer quotation projection excludes this internal calculation evidence.

| Code / state | Required UI behaviour |
|---|---|
| `InvalidData` | Show field errors; retain the unsaved proposal |
| `CpqReleaseRequired` | Explain that this company has no active reviewed release; link permitted users to the studio |
| `CpqFixturesFailed` | Show test bench expectations versus actual results; no approval button bypass |
| `CpqIndependentReview` / `CpqIndependentPublication` | Name the required independent duty, without guessing who holds it |
| `VersionConflict`, `CpqRevisionChanged`, `CpqBasisChanged`, `CpqPreviewChanged` | Retain edits, refresh the current source, show differences and require a new deliberate command |
| Ready / Blocked | Show all diagnostics and line explanations; only a current Ready run can receive an adoption preview |
| `OverrideRebaseRequired` / `OverrideOrphaned` diagnostic | Present the changed/missing target and recorded reason; require explicit rebase or removal |
| `CpqOwnedLineChanged` | A previously adopted line was manually changed. Keep it and report the conflict; no automatic overwrite. Dedicated conflict-resolution workflow is P1 |
| `CpqReceivingLineLimit` | Explain generated plus retained lines exceed 100; never truncate |
| `CalculationLimit` | Calculation did not finish safely; simplify/retry. No accepted run or estimate is written |
| `RecordUnavailable` / revoked permission | Stop protected reads and commands; do not reveal historical commercial content through retries |
| Network/unknown response | Keep original operation ID/payload and use receipt recovery. Do not create a fresh operation until the first outcome is resolved |

Adoption preserves existing scope wording unless the caller explicitly supplies new wording, retains unrelated manual lines and creates a native estimate version. It does not approve, issue, distribute or convert a quotation. Continue through existing ES-04–ES-07 screens and APIs. No customer messages, orders, payment actions or provider calls are authorised by this endpoint.

## Published Product profile — schema 2

The [architecture decision](../decisions/cpq-published-products.md) adopts the reserved schema 2 after inspecting the unfinished local proposal and current main. Use the schema-1 definition/input contract with `schema_version: 2` and an optional `parts[].product` on selected Product components. At least one component must be bound. Schema 1 and schema 3 keep their original strict shapes and hashes; schema 2 does not accept schema-3 design fields. No UI authoring change is included.

A Product binding is `{product_id, revision_id, content_hash, relationships}`: native Variant UUID, exact immutable revision UUID/hash, and zero to ten distinct optional relationship references `{id, content_hash, review_id}`. Omitted relationships normalise to an empty list. Labels, Family/Model identities, latest aliases, mismatched units and bindings on Labour/Freight/Engineering/Subcontract parts are refused. Unbound parts retain authored provenance only. No quantity conversion or Product price lookup occurs.

Products `products.read` plus existing company/workspace authority is required alongside CPQ/native permissions. Save/approval/activation, calculation basis/live preview/save and new adoption recheck every bound component against the exact current published revision, including components that produce no line. Draft successors leave the previous publication valid. Withdrawn, unpublished, inaccessible or superseded sources cannot support new use. The same workspace transaction lock serialises Product commands and CPQ calculation/adoption. Restoring publication never silently substitutes a different revision.

Selected relationships must connect this component's exact revision to another explicitly bound revision, in the same company, with exact retained content hash and independent Conditional review. The catalogue's existing criteria validation applies. CandidateReplacement, Unresolved, Rejected or missing review is refused. Any relationship successor requires a new deliberate reviewed mapping. Conditions, limitations, criterion evidence/owner, source revision/date and review remain explicit; the backend does not infer application suitability from these conditional statements.

Saved `binding.products` contains technical content, stable provider/entity and parent IDs, exact revision, publication event/purpose/audience/effective-context date and relationship evidence. The run content hash covers this snapshot; result/override basis hashes also cover the authored exact binding through the definition/part. Run reads, live previews and adoption previews expose `product_provenance` keyed by exact native line ID/target/basis hash. `availability` and `supplier_lead_time` are always Unknown; `compatibility` is NotAssessed or ConditionalEvidence. Publication, lifecycle and a Ready calculation are not stock or installation approval.

Native adoption keeps cost-line and quotation shapes unchanged. Its immutable adoption row links exact run/result and generated lines to the exact estimate version, and its audit retains Product provenance. The exact-version internal provenance endpoint verifies that chain and rechecks current native/CPQ/Product access. Manual successors are not automatically assigned a new adoption; inspect the original adopted version. Customer-safe quotation output excludes catalogue/source/relationship evidence and internal prices.

`CpqProductVariantRequired`, `CpqProductUnitMismatch`, `CpqProductEvidenceChanged`, `CpqProductPublicationChanged`, `CpqProductRelationshipMismatch`, `CpqProductCompatibilityReviewRequired` and `CpqProductRelationshipSuperseded` are explicit HTTP 409 review/refusal outcomes. `RecordUnavailable` remains the non-disclosing access/missing/cross-company outcome. Retain the proposal, show the exact reason and require a newly authored/reviewed release and calculation when mapping changes. No automatic remap or silent price refresh occurs.

Historical reads and original completed-command recovery recheck current access but do not require current publication. A completed calculate/adopt/save/review/activate replay returns its original receipt after withdrawal; it does not repeat adoption. Access loss blocks both reads and recovery. Existing override rebase, manual-owned-line conflict, receiving limit, original operation ID and atomic rollback contracts remain in force.


## Governed cost and labour profile — schema 4

[Decision](../decisions/cpq-governed-costs.md) records the opt-in schema and existing persistence choice. Schema 4 combines schema-1 calculation rules with optional schema-2 Product bindings and at least one `parts[].cost_source`. Schemas 1/2/3 are unchanged. This profile does not combine schema-3 design authoring. All command envelopes remain schema 1.

A Product or Labour part may carry `cost_source` with native `source_id`, exact `revision_id`, `content_hash`, `review_event_id`, positive `source_version`, native `reference`, positive revision number `revision`, and normalized `content` from the existing exact Cost Source read. The server verifies all evidence against the same-company immutable revision and independent Reviewed event. No label/latest lookup grants provenance. Existing Cost Source `estimating.read` company authority is required alongside CPQ duties on save, fixture preview, review, activation, run reads and receipt recovery; Products read remains required when technical Product references are included.

Bound parts keep the existing authored sell tiers and sell-validity interval. Every authored `tiers[].unit_cost` must be `0.00`, an explicit unused marker; no fallback is permitted. The source supplies unit cost using the resolved native three-decimal quantity, including quantity overrides. Direct synthetic AUD/ExcludingTax source content only; no unit conversion, FX or landed-cost adaptation. Source effective/expiry dates are checked against the explicit calculation `pricing_date`, not a moving clock. Unknown expiry stays a visible warning, matching the existing source contract. Below-minimum, expired/not-yet-effective and below-cost selling prices produce Blocked results with the native diagnostic.

New-use checks compare the exact source header version at save, approval, activation, basis preparation and adoption, including declared sources not generated in this run. A draft/review/successor change yields `CpqCostSourceChanged`; mismatched evidence yields `CpqCostEvidenceChanged`; absent exact independent review yields `ReviewedSourceRequired`. Current access loss yields the native unavailable response. No withdrawal state is invented for Cost Sources. Explicit historical reviewed selection remains supported when a new binding acknowledges the current source header. Historical reads and original-operation retries do not require freshness; they retain current authority and exact hash checks.

Schema-4 calculations report engine `PPO-CPQ-4`. The immutable run's `binding.cost_sources` retains each exact source snapshot plus part key and review attribution. Each generated `result.lines[].cost_source` records native line/source/revision/review IDs, pricing date, selected minimum quantity/unit cost and validity warning. Live preview, saved run reads and adoption preview also return `cost_provenance`, joining the selection to its full retained source snapshot. Customer output must never expose this internal evidence.

Adoption writes the exact native `estimate_cost_source_bindings` in the same transaction as the new version, CPQ adoption, audit, outbox and receipt. Existing estimate reads return these typed `source_bindings`. Manual lines and their bindings are retained; generated bindings are replaced explicitly, including when a source or quantity changes. Current saved Product and Cost Source evidence is checked before comparing the active basis. Original-operation recovery still runs before freshness checks.

To refresh, author/review/activate an explicit successor release, then calculate with `parent_id` referencing the original run. `/compare` shows exact source selections in before/after lines and cost, sell, difference, margin and markup totals. Source changes invalidate override basis hashes; the caller must review or revoke those overrides. Adopt only the exact new preview. There is no automatic price refresh, new selling policy or new UI in this increment.

Governed schema-4 calculations must use a pricing date in the native binding range 0001-01-01 through 9998-12-31. `CpqCostPricingDateRange` blocks out-of-range results before adoption readiness. This reuses the existing persisted source-binding constraint; it does not change schemas 1–3 or historical result bytes. Source effective/expiry checks still apply independently.

Governed source validity dates also require year 0001 or later (`CpqCostSourceDateRange`), because the native binding guard casts these retained JSON dates to PostgreSQL dates. Year-zero source validity blocks calculation readiness independently of the selected pricing date.
