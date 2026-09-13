# BP-03 — Five-stage pipeline implementation plan (increment A)

**Revision:** r01 · **Date:** 13 September 2026 · **Owner:** Dean Fiedler · **State:** Plan for review. No migration, seed, code or fixture change is performed by this document. Implementation requires its own branch and pull request.

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

Inspected `db/migrations/0010-crm-opportunities.sql` and `src/` at `0f0db4e`, 13 September 2026. These are observations, not a migration design.

The previously published summary — "four check constraints, and the four code literals" — understates the surface in two material ways.

### 3.1 The transition rule is in PL/pgSQL, not in a CHECK

`ppo.protect_opportunity()` is not named in any prior record of this work. It contains the two statements that actually gate movement:

```
IF NEW.stage_id<>'Enquiry' OR NEW.version<>1 THEN RAISE EXCEPTION 'Create only at Enquiry version one'
IF OLD.stage_id<>'Enquiry' OR NEW.stage_id<>'Qualified' THEN RAISE EXCEPTION 'Unsupported opportunity progression'
```

A plan that changed only the table CHECKs would leave the single permitted edge hard-coded in the trigger, and the increment would fail at runtime with a constraint that reads as unrelated. The same function also contains an `ELSIF` branch — *"Only qualification changes qualification facts"* — that assumes qualification is a transition, which it no longer is.

### 3.2 Full schema surface

| Object | What pins the current model |
|---|---|
| `ppo.crm_pipeline_definitions` | `definition_key='SyntheticEnquiryI1'`; `label='Fictional sales enquiry — I1'`; `definition_immutable` blocks UPDATE and DELETE |
| `ppo.crm_stage_definitions` | `stage_id IN ('Enquiry','Qualified')`; the ordinal pairing CHECK; `stage_immutable` blocks UPDATE and DELETE |
| `ppo.opportunities` | `stage_id` DEFAULT `'Enquiry'`; the qualification CHECK naming both stages; `stage_entered_at`; `close_outcome CHECK(close_outcome='Open')` |
| `ppo.opportunity_events` | `event_type` CHECK; the three-branch CHECK hard-coding `to_stage='Enquiry'`, `'Enquiry'` to `'Qualified'`, and `from_stage=to_stage` |
| `ppo.protect_opportunity()` | Creation stage, the single permitted edge, the qualification-facts branch, the owned-identification-action check |
| `ppo.check_opportunity_event_chain()` | Exact preceding version and stage — must continue to hold under re-entry |
| `ppo.check_opportunity_graph()` | Requires an exact event for every opportunity version |
| `outbox_jobs.ck_outbox_kind` | Union of the three current event kinds |

Both definition tables are immutability-triggered. That is a constraint and an opportunity: the five-stage pipeline **must** be a new definition row rather than an amendment, which means the I1 definition and its two stage rows survive untouched and existing history stays readable.

### 3.3 Code, and a naming collision

Fourteen files under `src/` carry the literal `Qualified`, not four:

`crm/leads/service.ts`, `crm/leads/reads.ts`, `crm/leads/context.ts`, `crm/refinements.ts`, `crm/refinement-validation.ts`, `crm/worklist.ts`, `crm/opportunities.ts`, `crm/context.ts`, `crm/receipt-authority.ts`, `components/crm-screens.tsx`, `components/leads-workspace.tsx`, `components/crm-deal-controls.tsx`, `components/business-ui.tsx`, `app/leads.css`.

**`Qualified` names two different things.** It is the retired opportunity stage, and it is the Leads qualification outcome — which survives this change unaltered, because qualification remains the Leads module's responsibility and the board's entry condition. A find-and-replace across `src/` would break Leads.

Every occurrence must be classified as opportunity-stage or lead-outcome before it is touched, and the classification recorded in the implementing pull request. The `src/crm/leads/` files are presumed lead-outcome, and the `components/crm-deal-controls.tsx` and `crm/opportunities.ts` occurrences presumed opportunity-stage, but presumption is not classification.

## 4. Proposed change set

### 4.1 Migration 0021

`0020` is the highest applied; `0016` is reserved for the Assistant branch. `0021` is free at `0f0db4e` and is reconciled against `scripts/migration-registry.ts` at implementation time, not reserved by this document.

Additive throughout. No existing row is rewritten, no issued bytes change, no history is rebuilt.

1. **Relax the definition CHECKs** on `crm_pipeline_definitions` so `definition_key` and `label` admit the five-stage values alongside the I1 values, following the existing `DO $$` pattern in `0010` that extends a constraint rather than replacing it.
2. **Insert one new pipeline definition row** for the five-stage pipeline. The I1 row is untouched.
3. **Relax `crm_stage_definitions.stage_id`** to admit Discovery, Scoping, Quoting, Negotiation and Closing alongside Enquiry and Qualified.
4. **Replace the ordinal pairing CHECK** with `ordinal > 0` plus `UNIQUE(workspace_id, pipeline_definition_id, ordinal)`. Ordinal becomes display order, scoped per definition.
5. **Insert five stage definition rows**, ordinals 1 to 5, under the new definition.
6. **Add event type `OpportunityStageChanged`** to the `opportunity_events` CHECK and to `outbox_jobs.ck_outbox_kind`.
7. **Re-express the three-branch event CHECK** so `OpportunityCreated` admits the first ordinal of its own definition, the existing Enquiry and Qualified branches remain valid for historical rows, and `OpportunityStageChanged` requires `from_stage IS NOT NULL AND to_stage IS DISTINCT FROM from_stage`.
8. **Rewrite `ppo.protect_opportunity()`** — creation at the first ordinal of the row's own definition; movement permitted when the target ordinal is exactly one greater, or any value lower, than the current ordinal, read from `crm_stage_definitions` rather than from literals; the qualification-facts branch reworked per §4.3.
9. **Leave `close_outcome` alone.** Increment B owns it.

Ordinal comparison rather than an edge table is proposed deliberately: with five stages and a forward/backward rule expressible as arithmetic, an edge table would be more structure than the rule needs. If later stages require non-adjacent forward jumps, an edge table becomes the right answer and this decision should be revisited rather than patched.

### 4.2 Transition rule

| Movement | Rule | Enforced by |
|---|---|---|
| Create | At ordinal 1 of the row's own definition | `protect_opportunity()` |
| Forward | Target ordinal = current + 1 | `protect_opportunity()` |
| Backward | Target ordinal < current, any value | `protect_opportunity()` |
| Same stage | Permitted for action planning only, as today | Existing `OpportunityActionPlanned` branch |
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

**Assumed, stated rather than verified:** that no consumer outside `src/crm/` and `src/components/` reads an opportunity stage literal. The fourteen-file list is a search for one literal, not a call-graph analysis; `Enquiry` should be searched the same way at implementation time.

**Open, and not blocking A:** the Won handover contract (#144) and H-01 to H-03 (#145).

**Not resolved by this increment:** #9 remains open as a discovery record blocked on account evidence that the connector cannot currently supply. Shipping 0021 satisfies none of its four acceptance criteria. This is why the implementation work was given its own issue.

## 7. Limits

Synthetic data and adapters only. This plan authorises no runtime change by itself; implementation needs its own branch, pull request and checked merge. No production change, business transaction, customer message, paid service or source-system cutover follows from it. All 78 parent requirements, issued baseline bytes and accepted history remain preserved.
