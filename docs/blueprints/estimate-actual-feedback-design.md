---
document_id: PPO-010-FEEDBACK-DES
revision: r02
date: 2026-09-12
owner: Dean Fiedler - private prototype
status: Proposed for review; nothing adopted, no scope widened
source_commit: ff81f9cb376156e0cfb2b8a8daba6fe0915cae62
---

# Estimate-to-actual feedback loop — design proposal

## 1. What this is, and what it is not

An owner-raised proposal: compare what an estimate assumed against what delivery actually consumed, so future estimates improve. This record assesses that idea, proposes how it would work, and states what must be true before any of it can be built.

**Nothing here is adopted.** This record does not widen any authorised increment, does not supersede [BP-04](BP-04-estimating-quotation.md), the [E1 contract](../contracts/estimating-e1.md), [ADR-0017](../decisions/ADR-0017-estimating-e1.md) or the [Finance handoff contract](../contracts/finance-handoff.md), and does not alter any parent requirement ID, the P01–P12 order or any acceptance status. It introduces no technology, migration or ADR sequence slot. D-009, D-010 and D-017 remain open.

It proposes **no new parent requirement**. The [requirement register](../requirements/README.md) directs new scope into child requirements under existing parents; section 12 does that.

## 2. Assessment

**The idea is sound and worth building, in the department that raised it. Two of its assumptions about the platform do not currently hold, and neither is fatal.**

Three findings drive everything below.

| Finding | Consequence |
|---|---|
| **Projects carries both the volume and the learning value.** The owner records roughly three project quotes a day at around $20,000 average — order of 750 quotes a year, of which the won and delivered subset is the population that produces actuals. That is ample for driver-level calibration, and the jobs are homogeneous enough to be genuinely comparable to one another. | Build the loop in Projects. Service follows once the mechanism is proven. |
| **The unit of learning is the cost driver, not the job.** "That project ran 12% over" teaches nobody anything. "Install labour on 6 m gutter-height Venlo runs 1.3× the estimated hours, n=7, range 1.1–1.6" changes the next estimate. | A shared cost breakdown structure that both the estimate and the actual are coded to is the load-bearing element. Without it the loop degenerates into a total-versus-total scoreboard that nobody acts on. |
| **"Actual" is not one number, and PPO's own contracts already say so.** The Finance handoff contract separates captured, reviewed, billable and ERP-processed quantities. FD-05 posted cost and FD-06 open committed cost are both undefined pending D-017, and FD-06 is explicitly flagged so that actual plus commitment does not double count. Acumatica practitioners report the same trap: actual cost excludes received material still in inventory even where it is captured as a committed invoice amount, so the two cannot simply be added. | Every comparison must declare its basis. Where the basis is unknown, the comparison is withheld, not computed — the same discipline as EC-D04's *pending, never zero*. |

### 2.1 What "project" means here

A project at Powerplants is not necessarily a major build. [BP-04 section 4](BP-04-estimating-quotation.md#4-routing-and-scope) already says so: the Project route is selected by whether design or engineering is required, whether dedicated project management is required, or whether significant scope decisions remain open — priorities 1 to 3. **Route is determined by the nature of the work, not by its value.** A $20,000 job needing design input routes to Project exactly as a multi-million greenhouse build does.

That reconciles three quotes a day with BP-04 section 3, whose *Major greenhouse project* journey describes only one end of the population. It also creates a segmentation the loop must respect:

| Population | Character | Treatment |
|---|---|---|
| High-volume project work, order of $20,000 | Repetitive, homogeneous, hundreds a year | Supports ratio calibration with real n. The primary learning population. |
| Occasional major greenhouse builds | Multi-million, few a year, each distinctive | n too small for ratios. Curated reference cases only, never blended into the above. |

Blending them would let a handful of large, distinctive jobs dominate a ratio computed for routine work. The section 9 rule against blending estimate classes covers this; it is named here because at Powerplants it is a live condition, not a hypothetical.

### 2.2 Assumptions that do not currently hold

- *"The projects department generally track all the parts, labour, costs."* They do — in CREMS, MYOB and spreadsheets, not in PPO. `ppo.projects`, `ppo.project_tasks` and `ppo.project_dependencies` carry title, phase, status, dates, progress and dependencies. There is no cost field and no commercial link to an estimate or quotation. FIN-04 is classified **Deferred** in [PP-01 traceability](../prototype/traceability.csv).
- *"Compare the estimate against the actuals."* There is presently nothing to compare them at. E1 estimate lines are JSONB inside an immutable `estimate_versions` row, carrying description, `category` (Product / Labour / Freight only), quantity, unit, `unit_cost`, `unit_sell`, `source` and `effective_date`. Line `id` values are enforced distinct *within* a version; nothing enforces that a line keeps its identity across versions, and lines are not independently addressable rows. Three categories is too coarse to learn a driver from.

Neither is fatal. Both are work items, and they are the first two increments in section 11.

## 3. Keep four questions separate

Most estimate-versus-actual programmes fail by conflating these. They need different data, different owners and different authority.

| Layer | Question | Owner | Output |
|---|---|---|---|
| **Measurement** | What did this job assume, and what did it consume, on a declared basis? | Delivery owner | A variance, with its comparison basis and completeness |
| **Attribution** | Why did it differ? | Delivery owner, with the estimator | Reason codes against the variance |
| **Calibration** | Should a future number change? | Commercial | A *proposed* rule or basis change, with evidence |
| **Governance** | Who may change it, and what does the change invalidate? | Named approval authority | A new rule version, and the dependants it invalidates |

A measured variance is a fact. A reason is a judgement. A calibration is a decision. Recording all three in one field destroys all three.

Note also that **a cost-estimating defect and a commercial outcome are different things**. A job estimated 20% light, sold with enough margin to absorb it, still has an estimating defect worth learning from. A job that lost money because an unpriced variation was never charged is a commercial-control failure and teaches the estimator nothing. Comparing sell price to actual cost — the natural instinct — mixes both and learns neither. The loop must compare **estimated cost to actual cost**, and track commercial outcome separately.

## 4. Preconditions

Ordered by dependency. Each is a genuine blocker for the increment that needs it.

| # | Precondition | Present state | Needed for |
|---|---|---|---|
| P1 | **Commercial lineage.** An estimate version and quote revision reachable from the delivered work order or project. | Absent everywhere. `ppo.projects` has no opportunity, estimate or quote foreign key. `ppo.work_orders` carries `project_reference` and `opportunity_reference` as free text only. No `estimate_id`, `estimate_version_id` or `quote_revision_id` exists in any migration outside `0012-estimating-e1.sql`. | Everything |
| P2 | **Durable line identity or breakdown code.** A stable handle to match an actual against. | Partial. Line `id` exists and is unique within a version; cross-version stability is unenforced. No breakdown code exists. | F2 onward |
| P3 | **Shared cost breakdown structure.** One code set both sides are coded to. | Absent. Estimating has three categories; Finance has service quantity dispositions; Projects has none. | F1 onward |
| P4 | **Declared comparison basis.** Which "actual" is being used, and whether the source is complete. | Partially available. P10 already distinguishes captured / reviewed / billable / processed and records extraction completeness. FD-05 and FD-06 remain undefined under D-017. | F1 onward |
| P5 | **A rule registry to calibrate.** Versioned pricing rules with maturity and provenance. | Proposed only, as [EC-D01](../decisions/estimating-container-propositions.md). E1's runtime is manual entry — there is no rule to adjust. | F5 only |
| P6 | **Approval authority for a commercial change.** | Does not exist. The container record already notes that a margin floor implies a policy record with approval authority that is absent. | F5 only |

P5 and P6 matter: **until a rule registry exists, "improving future estimates" can only mean informing a human, not changing a number.** That is not a weakness. Informing a human at the point of estimating is where most of the benefit lives anyway, and it is available far sooner.

## 5. Reference model

Five concepts. Each is separable, separately useful and separately governable.

| Concept | Definition | Why it is separate |
|---|---|---|
| **Cost breakdown code** | A versioned registry entry naming a cost driver — for example glazing install labour, controls commissioning, inbound sea freight — with its unit basis. | Both sides code to it. It is the join, and it must outlive any individual estimate or project. |
| **Comparison basis** | A declared statement of which estimate version, which actual source, which quantity class and which completeness declaration a comparison uses. | Without it a variance number is uninterpretable and will be quoted out of context. |
| **Delivery outcome record** | The close-out: per breakdown code, what was estimated and what was delivered, with completeness and owner. | It is evidence, owned by delivery, and immutable once reviewed. |
| **Variance reason** | A registry code attributing part of a variance to a cause. | A cause, not a culprit. Multiple reasons may share one variance. |
| **Basis observation** | A derived, append-only aggregate: for this breakdown code in this context, the ratio of delivered to estimated, with n, median and range. | Derived and never authoritative. It informs; it does not price. |

## 6. How it would operate

```
Estimate version  ──► Quotation ──► Accepted ──► Delivery (work order / project)
       │                                                      │
       │                                            actual labour, parts,
       │                                            travel, freight, cost
       │                                                      │
       │                                                      ▼
       │                                          Delivery outcome record
       │                                          (declared basis, per code)
       │                                                      │
       │                                              variance + reasons
       │                                                      │
       │                                                      ▼
       └──────────── surfaced at estimating ◄──── Basis observations
                     (reference cases, ratios, n)             │
                                                              ▼
                                                   Calibration proposal
                                                   (human decision, F5)
```

### 6.1 Close-out

Triggered by service report review (P09) or project handover (PRJ-08). The delivery owner opens a **delivery outcome record** bound to the exact accepted estimate version and quote revision.

The record pre-populates the estimated side from the bound estimate version. The delivered side comes from whichever source the declared basis names — for service, P09-reviewed quantities; for projects, an ERP project-cost read once FD-05 is defined, or manual entry before then.

### 6.2 States

Deliberately modelled on the Finance handoff so it behaves consistently with the rest of the platform.

| State | Meaning | Next |
|---|---|---|
| `Draft` | Editable; may be incomplete | Submit, or cancel |
| `ReadyForReview` | Every code dispositioned; basis declared; completeness declared | Review or return |
| `Returned` | Reviewer identified a problem; submitted revision retained | Revised draft |
| `Reviewed` | Variances and reasons frozen; feeds basis observations | Read only; correction by linked successor |
| `NotComparable` | Basis unavailable or source incomplete; recorded, counted, excluded from aggregates | Terminal until evidence changes |

`NotComparable` is essential. A job whose actuals cannot be attributed is a fact about the data, not a zero variance. Hiding it inflates apparent accuracy.

### 6.3 Attribution

Every variance beyond a declared materiality threshold must resolve to at least one reason code. `ReasonUnknown` is permitted and terminal — it is counted and reported, never hidden. This mirrors `OutcomeUnknown` in the Finance handoff: an unresolved outcome is recorded as unresolved rather than defaulted to something convenient.

### 6.4 Where it changes behaviour

**Inside the estimating workflow, at the moment the estimator enters the line.** Not on a management dashboard. When an estimator adds a breakdown-coded line, the panel shows: prior delivered-to-estimated ratio for that code, n, median, range, and the two or three most recent reference cases with their reason codes.

A dashboard reporting that estimates were 8% light last quarter changes nothing. A panel saying *"the last five commissioning jobs ran 1.4× the estimated hours; three cited controls integration not scoped"* changes the line being typed.

At roughly three quotes a day, **estimating speed may repay the build before accuracy does.** An estimator producing order of 750 quotes a year who reaches a defensible number faster on repeat work recovers substantial time, and that benefit lands on the same population and needs no calibration authority to realise it. The accuracy benefit is real but slower and harder to attribute; the speed benefit should not be treated as a secondary bonus when sequencing the work. Neither benefit is quantified here — doing so needs the owner's actual estimating time per quote, which this record does not have.

## 7. Candidate data model

Proposed logical model, not current SQL. All mutable records would carry UUID, fixed `workspace_id` and `company_id`, `version`, server actor and time, and `synthetic`, consistent with BP-04 section 5 and the existing platform pattern.

| Candidate | Minimum fields | Constraints |
|---|---|---|
| `cost_breakdown_codes` | `code`, `label`, `category`, `parent_code`, `unit_basis`, `active_from`, `active_to`, `version` | Registry. Retiring a code never reallocates it. An estimate line binds the code version current at save. |
| `delivery_outcomes` | `estimate_version_id`, `quote_revision_id`, `delivery_target_type`, `delivery_target_id`, `comparison_basis_id`, `state`, `owner_id`, `completeness_declaration` | One accepted estimate version per outcome. Immutable once `Reviewed`; correction by linked successor. |
| `comparison_bases` | `actual_source`, `quantity_class`, `cost_definition_id`, `currency`, `escalation_index`, `as_at` | Versioned. A basis with an undefined cost definition cannot reach `ReadyForReview`. |
| `outcome_lines` | `breakdown_code`, `estimated_quantity`, `estimated_unit`, `estimated_cost`, `delivered_quantity`, `delivered_cost`, `source_refs`, `line_completeness` | Quantities compare only on like units via a reviewed conversion. Unknown is null and blocks, never zero. |
| `variance_reasons` | `reason_code`, `group`, `label`, `active_from`, `active_to` | Governed registry, owned by Commercial. |
| `outcome_line_reasons` | `outcome_line_id`, `reason_code`, `share`, `note` | Shares sum to 1 across an attributed variance. |
| `basis_observations` | `breakdown_code`, `context_key`, `ratio`, `n`, `median`, `range_low`, `range_high`, `as_at`, `source_outcome_ids` | Derived, append-only. Never a price. Never edited. |
| `calibration_proposals` | `breakdown_code`, `proposed_rule_version`, `evidence_observation_ids`, `proposer`, `reviewer`, `decision`, `reason` | F5 only. Requires P5 and P6. |

Readable references would follow PPO-STD-001: `SYN-PPO-DOR-000001` for a delivery outcome record, subject to the type-code registry amendment section 10.2 of the standard requires. A new type code must be added deliberately, not assumed from this example.

## 8. Variance reason taxonomy

The proposed starting set. Causes, not culprits — see section 10.

| Group | Reason codes |
|---|---|
| **Scope** | Scope added and priced as a variation · Scope added, unpriced · Scope omitted from estimate · Stated exclusion not enforced in delivery |
| **Quantity and technical** | Take-off quantity error · Design changed after estimate · Site condition differed from survey · Existing equipment or compatibility differed |
| **Rate and price** | Supplier price moved after quote validity · Exchange rate movement · Freight or landed cost differed · Labour rate basis differed |
| **Productivity** | Install productivity differed from assumption · Access, crane or weather constraint · Rework or defect correction · Travel and mobilisation differed |
| **Sequencing** | Waiting on materials · Waiting on customer site readiness · Return visits or resequencing |
| **Commercial** | Discount conceded at close · Contingency consumed · Contingency unused |
| **Data** | Actual not attributable to this job · Cost coded to the wrong project or task · `ReasonUnknown` |

The Data group earns its place. On any real dataset a meaningful fraction of variance is miscoding, and a taxonomy without somewhere honest to put it will push that variance into a substantive reason and corrupt the learning.

Powerplants-specific note: exchange rate movement and inbound freight deserve their own codes rather than being folded into supplier price. Imported greenhouse structures, screens and controls make FX and landed cost a distinct, separately manageable driver, and conflating them with supplier pricing hides which one moved.

## 9. Statistical treatment

The honest constraint is **n**. This section exists so that the loop does not manufacture confidence it has not earned.

| Rule | Reason |
|---|---|
| **Report median, n and full range. Never a bare mean.** | Small samples with one bad job produce a mean that misleads in both directions. |
| **Withhold a ratio below a declared minimum n.** Proposed: n ≥ 5 to display, n ≥ 3 to display marked *indicative*, below that show "insufficient data". | An n of 1 dressed as a benchmark is worse than nothing, because it will be quoted. |
| **Normalise before comparing, or exclude.** Escalate to a declared index and date; convert currency at a declared rate and date; record site factor and scale. If any normalisation input is unknown, the observation is excluded, not defaulted. | Comparing 2024 costs to 2026 costs, or AUD to a EUR-denominated supply, without normalisation produces a number that is precisely wrong. This is the substance of AACE RP 114R-20 on project historical databases. |
| **Never blend segments, currencies or estimate classes.** | A concept-stage budget figure and a firm quotation are not the same artefact. AACE RP 17R-97 classifies estimates by the maturity of project definition precisely so that like is judged against like; RP 104R-19 addresses communicating that accuracy. Tagging each PPO estimate with a definition class is cheap and prevents the commonest misreading. |
| **Record the survivorship limit on every view.** | Actuals exist only for jobs won and delivered. Calibrating on won jobs biases toward whatever was underpriced enough to win. This cannot be corrected away; it must be stated. |
| **No regression, no machine learning, no automated fitting.** | At this data volume it would fit noise and forfeit explainability. Deterministic aggregation over a governed registry is sufficient, auditable and defensible to a customer. Revisit only if a segment reaches a volume where a model demonstrably beats the median, and say so explicitly at that point. |

## 10. Risks and failure modes

The technical build is the easy part. These are the reasons such programmes die.

| Risk | Mechanism | Control |
|---|---|---|
| **Blame drift** | Variance becomes an estimator performance measure. Estimators pad; delivery stops recording accurately; the data becomes fiction. | Reason codes name causes, not people. State non-punitive use in policy, and do not attach an individual to a variance record. This is the single largest failure mode and it is behavioural, not technical. |
| **Calibration ratchet** | Ratios raise estimates, win rate falls, the surviving wins are the hardest jobs, ratios rise again. | Never auto-apply. Every calibration is a reviewed proposal with named authority. Monitor win rate alongside accuracy; they are a pair. |
| **Rewarding padding** | An estimator who pads consistently shows excellent "accuracy". | Track signed variance and dispersion, not absolute error alone. A consistently positive variance is a finding, not a success. |
| **Double counting actuals** | Actual posted cost plus open committed cost counts the same money twice — the defect FD-06 already flags and Acumatica users report in practice. | Comparison basis names one cost definition. A basis with an undefined definition cannot be submitted. |
| **Scope-creep hedging** | Estimators widen exclusions to protect the ratio rather than to describe the offer. | Review exclusion changes as commercial content, not estimating hygiene. |
| **Attribution theatre** | Everything lands in one or two convenient reason codes. | Monitor the reason distribution. A code carrying most variance is a taxonomy defect, not an insight. |
| **Late, cold close-out** | A record opened months after completion recalls nothing useful. | Trigger at review or handover, while the work is fresh; make it small enough to complete in minutes. |
| **The loop nobody closes** | Observations accumulate; no estimate ever changes. | The estimating-surface panel in 6.4 is the closing mechanism. Without it, build nothing else. |

## 11. Delivery increments

Bounded, dependency-ordered. Each is separately useful and separately abandonable.

| Increment | Scope | Depends on | Notes |
|---|---|---|---|
| **F1 — Project close-out record** | Structured close-out at project handover: declared basis, breakdown-coded estimated versus delivered, reason codes, narrative, evidence links. Manual delivered-side entry, keyed from the existing CREMS, MYOB or spreadsheet record. | P1 (project scope), P3, P4 | No ERP integration. The delivery target is typed from the outset (`delivery_target_type`), so extending to Service later adds a target, not a second mechanism. |
| **F2 — Commercial lineage and breakdown coding** | Additive migration: estimate and quote references on the delivered object; durable estimate line identity; `cost_breakdown_codes` registry; breakdown code on estimate lines. | P1, P2, P3 | Must reconcile against migration 0020 and the reserved 0016. Extends EST-04's cost provenance rather than replacing it. |
| **F3 — Variance register and read-only comparison** | Persisted variances, reason attribution, derived basis observations with n, median and range, and an explicit insufficient-data state. | F1, F2 | Read-only. Produces no price and changes no estimate. |
| **F4 — Reference cases at the estimating surface** | Prior comparable cases and their ratios surfaced in the estimating workflow at line entry, as described in 6.4. | F3 | This is where the loop actually closes. |
| **F5 — Calibration proposals** | A proposed versioned rule change carrying its evidence, reviewed and adopted by named authority; adoption invalidates dependants. | F3, P5, P6 | Impossible before a rule registry exists. Do not attempt it earlier by writing values into estimates directly. |

Service coverage arrives by adding a delivery target to F1, not as a separate parallel build.

One trade-off is worth stating rather than hidden. Service is the easier proving ground for the mechanism, because PPO already holds reviewed field labour, travel and parts from P07/P09/P10, so F1 could pre-populate the delivered side instead of requiring manual entry. Projects is the harder start and the more valuable one: the delivered side must be keyed by hand until a project cost read is authorised under FD-05. **Projects is still the right start,** because planned service work is frequently not estimated at all — an estimate binds to an Opportunity, while a service work order originates from a ticket and carries only a free-text `opportunity_reference`. A feedback loop built where no estimate exists has nothing to feed back into, which is failure mode *the loop nobody closes* in section 10.

The manual-entry burden is therefore a real cost of starting in Projects, and it constrains F1's design: if close-out cannot be completed in minutes on a $20,000 job, it will not be completed at all.

## 12. Traceability

New scope enters as child requirements under existing parents. **All 78 parent requirement IDs are preserved and unchanged.** Child numbering follows the standard's parent-dot-child convention, as already used by SVC-12.1.

| Proposed child | Under | Statement |
|---|---|---|
| EST-04.1 | EST-04 | Record a versioned cost breakdown code and comparison-relevant basis on each estimate line |
| EST-03.1 | EST-03 | Preserve a durable line identity across estimate versions sufficient to bind a delivered outcome |
| SVC-10.1 | SVC-10 | Capture a structured delivery outcome at service report review, with declared basis and completeness |
| PRJ-08.1 | PRJ-08 | Complete a commercial close-out as part of project handover |
| FIN-04.1 | FIN-04 | Declare and preserve the comparison basis and cost definition used by any estimate-to-actual comparison |
| FIN-07.1 | FIN-07 | Maintain definitions for variance, normalisation and escalation used in derived basis observations |

These are proposals. Allocation is an owner act and does not occur by this record being merged.

## 13. What the owner must decide

| # | Decision | Why it blocks |
|---|---|---|
| 1 | Start in Projects, with Service added later as a second delivery target | Settled in r02 on the owner's volume correction. Recorded because it governs every increment below. |
| 1a | How many of the ~750 annual quotes are won and delivered | That subset, not the quote count, is the real n. It decides whether ratios are displayable per breakdown code or only in aggregate. |
| 1b | Where the boundary sits between routine project work and major builds | Section 2.1 requires the two populations be kept apart. Without a boundary rule they will blend by default. |
| 2 | Who owns the cost breakdown code registry | It outlives every estimate; an unowned registry decays within a year |
| 3 | Who owns the variance reason registry | Same, and it carries the behavioural policy |
| 4 | Non-punitive use, stated as policy | Determines whether the data is truthful |
| 5 | Materiality threshold requiring attribution | Too low and close-out becomes clerical; too high and the learning is lost. At a ~$20,000 average, a 5% threshold is about $1,000 — attribution on smaller movements is unlikely to repay the keystrokes |
| 6 | Minimum n for display, and the indicative band | Governs whether the system can mislead |
| 7 | Escalation index and FX rate source for normalisation | Without it, observations are not comparable across years |
| 8 | Whether estimates carry a definition class | Cheap now, expensive to retrofit |
| 9 | Whether calibration may ever write a value automatically | The recommendation is no, permanently, and that should be recorded rather than left open |
| 10 | Whether FD-05 and FD-06 are resolved under D-017 before Projects coverage | Projects coverage is blocked until they are |

## 14. Verification of this record

Read at `main` head `ff81f9cb376156e0cfb2b8a8daba6fe0915cae62`: the [E1 contract](../contracts/estimating-e1.md), [BP-04](BP-04-estimating-quotation.md), the [Finance handoff contract](../contracts/finance-handoff.md), the [container propositions](../decisions/estimating-container-propositions.md), the [requirement register](../requirements/requirements.csv), [PP-01 traceability](../prototype/traceability.csv) and [PPO-STD-001](../standards/naming-conventions.md). Schema claims about estimate lines, project tables and work-order references were read from the applied migrations `0004-work-scope.sql`, `0012-estimating-e1.sql` and `0019-projects-gantt.sql` at that commit, not inferred from documentation.

External practice references: AACE International RP 17R-97 (cost estimate classification), RP 104R-19 (communicating estimate accuracy), RP 31R-03 (reviewing, validating and documenting the estimate) and RP 114R-20 (project historical database development). These are cited as established practice for historical cost data, normalisation and estimate classification. They are not adopted as project standards and no clause-level conformance is claimed.

This is a design proposal. It is not business acceptance, not engineering sizing, and not a test of application behaviour, which does not exist for this scope.

## 15. Revision record

| Revision | Date | Change | Reason |
|---|---|---|---|
| r01 | 2026-09-12 | Initial proposal. Recommended starting the loop in Service on the basis that Projects delivered single-digit major builds a year and lacked the repetition to learn from. | — |
| r02 | 2026-09-12 | **Recommendation reversed to Projects.** Finding 1 rewritten; section 2.1 added reconciling the Project *route* with the observed volume and separating the two project populations; P1 restated with the free-text `project_reference` / `opportunity_reference` finding; estimating-speed payback added to 6.4; F1 repointed from Service to Projects with the residual trade-off stated; decisions 1, 1a, 1b and 5 revised. | The owner corrected the volume premise: roughly three project quotes a day at around $20,000 average, not single-digit major builds a year. The r01 recommendation rested on that premise and did not survive it. The Service-first case was additionally weak because planned service work is frequently not estimated at all, which r01 did not check. |

r01 is superseded, not deleted. Its reasoning is preserved above so the basis of the reversal remains inspectable.
