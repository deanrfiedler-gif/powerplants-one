# BP-03 — Five-stage pipeline implementation plan (increment A)

**Revision:** r02 · **Date:** 13 September 2026 · **Owner:** Dean Fiedler · **State:** Plan for review. **r02 corrects two material errors in r01** — see §3.0. No migration, seed, code or fixture change is performed by this document. Implementation requires its own branch and pull request.

**Work:** [#143](https://github.com/deanrfiedler-gif/powerplants-one/issues/143), closing [#135](https://github.com/deanrfiedler-gif/powerplants-one/issues/135) and [#136](https://github.com/deanrfiedler-gif/powerplants-one/issues/136), under [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9).

[Stage model decision](../decisions/crm-pipeline-stage-model.md) · [CRM sequence](crm-implementation-plan.md) · [Shared UI specification](../standards/ui-style-specification.md) · [Demo package](private-prototype-demo.md).

## 1. What this increment is, and what it is not

The stage work was split into three increments on 13 September 2026 because the six changes previously grouped under #9 have three different blockers and three different risk classes.

| | Increment | Issue | Blocked by |
|---|---|---|---|
| **A** | Five stages, bidirectional movement, general stage-change event, reseed | #143 | Nothing. This plan. |
| **B** | Won and Lost outcomes | #144 | The Won handover contract with Projects (BP-06) |
| **C** | Owner transfer | #145 | H-01, H-02 and H-03 |

A changes a stage catalogue and a transition rule. C changes an authorisation surface. Reviewing them in one diff means the permission change is read alongside a column rename, which is the specific way a permission change gets less scrutiny than it warrants. B reaches into a domain that is deliberately deferred, so bundling it would make the unblocked work wait on the deferred one.

**Not in A:** `close_outcome` stays constrained to `'Open'`. No owner change. No bulk stage change. No reopening. No commercial value, forecast or close date. No live Pipedrive, import or operational migration.

## 2. Decisions this plan applies

The [stage model](../decisions/crm-pipeline-stage-model.md) was accepted on 11 September 2026 and amended on 12 September 2026. It left two dependencies open. Both were resolved by the owner on 13 September 2026.

**Ordinal scheme.** Stages may now be entered more than once and in either direction, which breaks the current one-ordinal-per-stage pairing and the meaning of `stage_entered_at` on re-entry.

*Resolved:* drop the pairing constraint. `ordinal` becomes display order on the stage definition and nothing else. Stage entry is recorded as an event, and time-in-current-stage derives from the latest stage-change event to the current stage. The event table already carries `from_stage` and `to_stage`, so this needs no new column.

*Consequence for `stage_entered_at`.* The column is `NOT NULL` on an existing table, so dropping it is a destructive change to live structure and is not proposed. It is instead **redefined as a cached projection** of the event log — the timestamp of the most recent stage-change event — maintained by the same command that writes the event, never independently. A test asserts the two agree after every movement, including re-entry. This is stated as a deliberate compromise rather than presented as a derivation: the column remains physically capable of disagreeing with the log, and the test is what prevents it.

**Existing Enquiry records.** An Enquiry row has no qualification note by construction, so relabelling it Qualified would require inventing qualification evidence — which is exactly what the constraint exists to prevent.

*Resolved:* reseed under a new database and storage epoch. Moving the records to Leads was rejected because it relocates the same invention rather than avoiding it: a lead record would need provenance that was never captured. The data is entirely synthetic and the reseed is cheaper and more honest.

## 3. Inventory found by inspection

Evidence base for r02: a PostgreSQL 16.15 database migrated through all nineteen migrations and seeded, inspected with `pg_get_constraintdef` and `pg_get_functiondef`, plus line-level reading of `src/` at `0f0db4e` on 13 September 2026. These are observations, not a migration design.

### 3.0 Two corrections to r01

r01 of this plan, and the schema-consequences section of the stage model decision it drew on, both inspected **`db/migrations/0010-crm-opportunities.sql`** rather than the live schema. `0017-crm-ui-refinements.sql` has since amended the same objects. Two claims were wrong in consequence.

**Correction 1 — the general stage-change event already exists.** r01 §4.1 item 6 proposed adding `OpportunityStageChanged`. `0017` added it, together with `OpportunityInformationEdited` and `OpportunityScopeEdited`, a `record_snapshot` column, and the reverse `Qualified` to `Enquiry` edge in `protect_opportunity()`. The live event CHECK already reads `event_type='OpportunityStageChanged' AND from_stage <> to_stage AND opportunity_version > 1 AND record_snapshot IS NOT NULL`, and `crm_event_guard` already requires the snapshot to equal `ppo.crm_record_snapshot(NEW)`.

Bidirectional stage movement is therefore **already implemented and in use** — the board's drag path runs through it. What is missing is not the mechanism but the stages: a catalogue of five, an ordinal rule instead of an enumerated pair, and the entry stage.

**Correction 2 — there is no `Qualified` naming collision.** r01 §3.3 claimed `Qualified` names both the opportunity stage and a Leads qualification outcome, and that a find-and-replace would break Leads. That is false. `ppo.lead_candidates.status` is constrained to `New`, `Contacting`, `Nurturing`, `Disqualified`, `Converted`. Leads has no `Qualified` value. Every one of the twenty-four occurrences in `src/` is the opportunity stage.

The hazard is the **opposite** of what r01 described, and worse. `src/crm/leads/service.ts:457` sets `stage_id='Qualified'` on the *opportunity* at conversion. r01 told an implementer to presume the `src/crm/leads/` files were lead-outcome and leave them alone. Following that presumption would have left Leads converting new deals straight into a retired stage.

Root cause of both: reading a migration file as though it described current state, and inferring a classification from file paths instead of reading the lines. r02 is written from the running database and from the lines.

### 3.1 The transition rule is in PL/pgSQL, not in a CHECK

This finding from r01 survives correction, and is the most important one. `ppo.protect_opportunity()` is named in no prior record of this work, and it is where movement is actually gated. As it runs today, after `0017`:

```
IF NEW.stage_id<>'Enquiry' OR NEW.version<>1 THEN RAISE EXCEPTION 'Create only at Enquiry version one'
IF NOT ((OLD.stage_id='Enquiry' AND NEW.stage_id='Qualified')
     OR (OLD.stage_id='Qualified' AND NEW.stage_id='Enquiry')) THEN
  RAISE EXCEPTION 'Unsupported opportunity progression'
```

The permitted edges are an enumerated pair, not a rule. Widening the table CHECKs alone would leave that pair in force and the increment would fail at runtime with a message that reads as unrelated to stages.

The same function also contains an `ELSIF` branch — *"Only qualification changes qualification facts"* — that assumes qualification is a transition, which under the accepted model it no longer is.

### 3.2 Full schema surface

| Object | What pins the current model |
|---|---|
| `ppo.crm_pipeline_definitions` | `definition_key='SyntheticEnquiryI1'`; `label='Fictional sales enquiry — I1'`; `definition_immutable` blocks UPDATE and DELETE |
| `ppo.crm_stage_definitions` | `stage_id IN ('Enquiry','Qualified')`; the ordinal pairing CHECK; `stage_immutable` blocks UPDATE and DELETE |
| `ppo.opportunities` | `stage_id` DEFAULT `'Enquiry'`; the qualification CHECK naming both stages; `stage_entered_at`; `close_outcome CHECK(close_outcome='Open')` |
| `ppo.opportunity_events` | A **five**-branch CHECK after `0017`. `OpportunityCreated` pins `to_stage='Enquiry'`; `OpportunityQualified` pins the `'Enquiry'` to `'Qualified'` edge. The `OpportunityStageChanged` branch is already general and needs no change |
| `ppo.protect_opportunity()` | Creation stage, the enumerated edge pair, the qualification-facts branch, the owned-identification-action check |
| `ppo.check_opportunity_event_chain()` | Exact preceding version and stage — must continue to hold under re-entry |
| `ppo.check_opportunity_graph()` | Requires an exact event for every opportunity version |
| `outbox_jobs.ck_outbox_kind` | Union of event kinds; already extended by `0017` |
| `ppo.crm_event_guard()` | Requires `record_snapshot` to equal `ppo.crm_record_snapshot(NEW)` on every stage change, and refuses a stage change that alters `need_summary` |

Both definition tables are immutability-triggered. That is a constraint and an opportunity: the five-stage pipeline **must** be a new definition row rather than an amendment, which means the I1 definition and its two stage rows survive untouched and existing history stays readable.

### 3.3 Code

Fourteen files carry the literal, not four. **All twenty-four occurrences are the opportunity stage** (see §3.0, correction 2). The ones that matter:

| Location | What it does | Change |
|---|---|---|
| `crm/context.ts:37`, `crm/worklist.ts:17` | Type is the union `"Enquiry" \| "Qualified"` | Widen to the five stages |
| `crm/worklist.ts:58` | Asserts `stages.length !== 2` and positional stage names, and throws otherwise | **Hard two-stage assertion.** Must become count-agnostic |
| `crm/worklist.ts:36` | `choice(...)` validator allow-list | Widen |
| `crm/opportunities.ts:232` | `UPDATE … SET stage_id='Qualified'` on qualify | Reworked per §4.3 |
| `crm/leads/service.ts:457` | Sets the **opportunity** to `'Qualified'` at lead conversion | Must set the entry stage, `Discovery` |
| `crm/refinements.ts:107,189`, `refinement-validation.ts:106,122,126` | Stage-conditional evidence rules | Re-express against the stage catalogue |
| `components/crm-deal-controls.tsx:31` | `stageRequiresEvidence = stage === "Qualified"` | Re-express per §4.3 |
| `components/crm-deal-controls.tsx:525`, `crm-screens.tsx:465` | Hard-coded stage option lists | Read from `data.stages` |
| `components/leads-workspace.tsx:569` | Displays `Qualified / Open · Fictional sales enquiry — I1` | Follows the new definition label |
| `components/business-ui.tsx:235` | Badge tone list | Widen |

`OpportunityQualified` as an **event type** is history and must not be renamed anywhere.

## 4. Proposed change set

### 4.1 Migration 0021

`0020` is the highest applied; `0016` is reserved for the Assistant branch. `0021` is free at `0f0db4e` and is reconciled against `scripts/migration-registry.ts` at implementation time, not reserved by this document.

Additive throughout. No existing row is rewritten, no issued bytes change, no history is rebuilt.

1. **Relax the definition CHECKs** on `crm_pipeline_definitions` so `definition_key` and `label` admit the five-stage values alongside the I1 values, following the existing `DO $$` pattern in `0010` that extends a constraint rather than replacing it.
2. **Insert one new pipeline definition row** for the five-stage pipeline. The I1 row is untouched.
3. **Relax `crm_stage_definitions.stage_id`** to admit Discovery, Scoping, Quoting, Negotiation and Closing alongside Enquiry and Qualified.
4. **Replace the ordinal pairing CHECK** with `ordinal > 0` plus `UNIQUE(workspace_id, pipeline_definition_id, ordinal)`. Ordinal becomes display order, scoped per definition.
5. **Insert five stage definition rows**, ordinals 1 to 5, under the new definition.
6. ~~Add event type `OpportunityStageChanged`.~~ **Already present from `0017`. No change.**
7. **Widen the `OpportunityCreated` branch** of the event CHECK so it admits the first ordinal of its own definition instead of the literal `'Enquiry'`. The `OpportunityQualified` and `OpportunityStageChanged` branches are left exactly as they are: the first so historical rows stay valid, the second because it is already general.
8. **Rewrite `ppo.protect_opportunity()`** — creation at the first ordinal of the row's own definition; movement permitted when the target ordinal is exactly one greater, or any value lower, than the current ordinal, read from `crm_stage_definitions` rather than from an enumerated pair; the qualification-facts branch reworked per §4.3.
9. **Leave `close_outcome` alone.** Increment B owns it.

Ordinal comparison rather than an edge table is proposed deliberately: with five stages and a forward/backward rule expressible as arithmetic, an edge table would be more structure than the rule needs. If later stages require non-adjacent forward jumps, an edge table becomes the right answer and this decision should be revisited rather than patched.

### 4.2 Transition rule

| Movement | Rule | Enforced by |
|---|---|---|
| Create | At ordinal 1 of the row's own definition | `protect_opportunity()` |
| Forward | Target ordinal = current + 1 | `protect_opportunity()` |
| Backward | Target ordinal < current, any value | `protect_opportunity()` |
| Same stage | Permitted for action planning and the two edit events, as today | Existing branches, unchanged |
| Won, Lost | Refused | `close_outcome` CHECK, unchanged |

Re-entry is a consequence of backward movement, not a separate case. `check_opportunity_event_chain()` continues to require the exact preceding version and stage, which remains satisfiable because each movement writes one event at one version.

### 4.3 Qualification facts under the new model

Under the accepted model, qualification happens in Leads and every deal on the board is already qualified. The current CHECK makes `qualification_note` null at Enquiry and non-null at Qualified.

*Proposed:* the five-stage branch requires `qualification_note` to be present, and `primary_person_id OR identification_activity_id` to be present, **at every stage including Discovery** — the evidence arrives with the deal from Leads rather than being produced by a transition. The Enquiry and Qualified branches are retained verbatim so historical rows remain valid.

This is the one place where the change is interpretive rather than mechanical, and it is the item most worth arguing with at review.

### 4.4 Reseed

A new database and storage epoch, as resolved. Existing opportunity rows are not deleted — `opportunity_retained` blocks DELETE, correctly — they simply do not exist in the new epoch.

**Consequence already identified:** [`private-prototype-demo.md`](private-prototype-demo.md) DEMO-02 walks six prepared opportunities and states *"Actual stages are Enquiry and Qualified"*. That script must be revised in the same pull request. The hosted Azure demo runs a materially older `main` and will match neither the old nor the new script until it is redeployed; that is recorded, not resolved here.

## 5. Acceptance and verification

Component evidence only. Executed acceptance and business approval remain separate claims.

| | Case | Evidence required |
|---|---|---|
| SA-01 | Five stage rows exist under the new definition; I1 definition and its two rows unmodified | Direct SQL against a migrated database |
| SA-02 | Create lands at Discovery; creation at any other stage refused with no state change | Server test |
| SA-03 | Forward one stage accepted; forward two stages refused | Server test |
| SA-04 | Backward from Closing directly to Scoping accepted | Server test |
| SA-05 | Re-entry to a previously occupied stage accepted; history shows both entries; `stage_entered_at` equals the latest stage-change event | Server test plus direct SQL |
| SA-06 | Existing event rows unmodified; immutability trigger still refuses UPDATE and DELETE | Direct SQL challenge |
| SA-07 | Drag path on `VersionConflict` — optimistic placement dropped, card not left in an unconfirmed column (#135) | Browser test |
| SA-08 | Drag path on lost response and on undo-after-refusal (#135) | Browser test |
| SA-09 | Keyboard-only stage change on the board itself (#136) | Browser test, desktop and 390 px |
| SA-10 | Leads qualification unchanged; Leads to opportunity conversion still produces a Discovery deal | Server and browser test |
| SA-11 | Won and Lost still refused | Server test |
| SA-12 | Board renders five columns from `data.stages.length` without layout change | Visual inspection plus the design baseline check |

Plus every then-current accepted suite. No assertion is waived to make the new command pass.

## 6. Assumptions and open items

**Verified, not assumed, in r02:** every `Qualified` occurrence in `src/` is classified in §3.3, read line by line.

**Still assumed:** that `Enquiry` has no consumers beyond the same fourteen files. It was not searched separately and must be at implementation time.

**Environment limitation:** the r02 evidence base ran under Node 22.22.2, not the pinned 24.20.0, which the sandbox cannot reach. Schema observations are engine-level and unaffected; anything runtime-sensitive must be confirmed in CI.

**Open, and not blocking A:** the Won handover contract (#144) and H-01 to H-03 (#145).

**Not resolved by this increment:** #9 remains open as a discovery record blocked on account evidence that the connector cannot currently supply. Shipping 0021 satisfies none of its four acceptance criteria. This is why the implementation work was given its own issue.

## 7. Limits

Synthetic data and adapters only. This plan authorises no runtime change by itself; implementation needs its own branch, pull request and checked merge. No production change, business transaction, customer message, paid service or source-system cutover follows from it. All 78 parent requirements, issued baseline bytes and accepted history remain preserved.
