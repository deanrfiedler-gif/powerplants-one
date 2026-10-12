# Native CPQ API and UI handover

<!-- versioning: git; committed history is authoritative -->

Status: backend implementation contract; UI owned separately by Claude. Read with [delivery plan](../delivery/cpq-backend-plan.md). All paths below start with `/api/v1`. All DTOs are internal commercial data; never expose them in a customer portal. Existing session, working-company selection, origin checks and private/no-store responses apply.

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
| GET | `/operations/:operation_id` | Original operation ID | Existing authorised command recovery contract |

Commands include `schema_version: 1`, a caller-generated UUID `operation_id`, and a meaningful `reason`. Mutations return the existing OperationReceipt (`record_id`, `record_version`, `state`, `accepted_at`, `receipt_id`, `task_ids`, `warnings`). HTTP 201 is a first accepted write; 200 is an exact replay. Retain the original payload and operation ID when the response is uncertain. Reuse with different content returns `OperationConflict`. All current permission and source checks happen before recovery returns a receipt. `CpqChanged` outbox events contain identifiers, never pricing or rule payloads; no external dispatch is added.

## Permissions and state transitions

All CPQ calls require `shared.read` and `cpq.read` in the current company; `cpq.read` includes costs and rules. `cpq.author` creates immutable draft revisions; `cpq.review` records review; `cpq.publish` activates an approved release; `cpq.calculate` creates/adopts calculations. Only Company/Workspace grants are accepted. No seed grants these duties. Use the existing independent local access-request workflow to assign approved test roles. Hosted users gain no CPQ duty from the migration.

Calculation and adoption also require current native estimating ownership, `estimating.read`/`estimating.edit`, source visibility and a selected Active option with Complete discovery. An independent reviewer cannot edit the estimate merely because they have a CPQ review duty.

Release root transitions: Draft → Reviewed or Rejected → Published (only Reviewed/Published can activate). Appending a revision returns the root to Draft and never rewrites the active historical revision. A run is permanently Ready or Blocked. Later edits produce a new run with a parent pointer. A Ready run can become stale without changing its historical result; adoption rechecks the current basis.

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
