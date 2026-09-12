---
document_id: PPO-010-ROUTE-DEC
revision: r01
date: 2026-09-12
owner: Dean Fiedler - prototype owner
status: Direction adopted; rules, taxonomy and runtime pending
source_commit: bfc0eca04fd9ae4da080b9cd7f49843fc3d2e8aa
---

# Derived routing direction — advisory derivation with confirmed binding at acceptance

Dean adopted this direction on 12 September 2026. It settles **how** PPO decides the delivery route for an estimating pursuit. It does not adopt a rule set, a threshold, a migration or a runtime behaviour, and it allocates no ADR number. Those follow under the sequence in section 7.

This record is local to PPO-010 / [issue #10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10) and BP-04. It changes no master parent ID, no P01–P12 order and no operational policy. D-009 and D-010 remain open, as do source gaps G02 and G03 in the [evidence register](../blueprints/estimating-evidence.md#4-open-evidence-and-decisions).

## 1. The decision

> **Derive continuously, advise visibly, bind once, confirm always.**

The system derives a proposed delivery route from observable facts about the estimate, displays it with its decisive reason throughout drafting, and binds it at exactly one moment — the creation of a delivery handover on customer acceptance — where a person with authority confirms it.

Three alternatives were considered and rejected:

| Alternative | Why not |
|---|---|
| Declared routing at enquiry, as documented in CREMS and proposed as `SYN-E2-ROUTE-r01` | Requires a person to declare, at the point of least information, a fact that governs fulfilment months later, and never revisits it. The rule design is sound; the timing is not. |
| Pure automatic derivation with no confirmation | Removes a person from a decision that changes contractual terms and commits capacity, on the strength of thresholds nobody has calibrated. |
| Shadow-mode derivation as the end state | Shadow mode is a calibration technique, not a destination. It is retained in section 7 as scaffolding, then removed. |

## 2. Relationship to E2-D01

[PPO-010-E2-DEC](estimating-e2-rules.md) records three candidate decisions, each marked **Proposed**, under the frontmatter status *"Design authorised; synthetic rule adoption pending"*. E2-D01 — adopt `SYN-E2-ROUTE-r01`, six declared answers evaluated in order, no route override — was therefore never adopted as policy.

This record **decides E2-D01 for the first time**, in a different direction. Nothing is superseded and no adopted decision is reversed. `SYN-E2-ROUTE-r01` is retained unchanged as design history and as the reference declared model against which derivation is calibrated in section 7.

E2-D02 (`SYN-E2-OPTIONS-r01`) and E2-D03 (`SYN-E2-QUESTIONS-r01`) are untouched and remain Proposed. The immutable-snapshot and expected-version disciplines they specify are carried into derivation without change.

## 3. Two decisions, two moments

The declared model collapsed three distinct decisions into one questionnaire at enquiry. They are separated here.

| Decision | When | Why then | Basis |
|---|---|---|---|
| **Estimating effort class** — Full or Express | At enquiry | It allocates people. It cannot wait. | Declared, by the estimating owner. A small residual question set, per section 4. |
| **Customer offer** | On issue | Unchanged | One quote type with route-aware content and terms |
| **Delivery route** — Project, Sales Order, Service Order | At acceptance | The estimate now exists. This is the moment of most information, not least. | Derived from accepted line composition, confirmed by the receiving owner |

Effort class and delivery route are separate facts and may legitimately disagree. A Full discovery may end in a Sales Order; an Express entry may accumulate engineering and end in a Project. Neither constrains the other.

## 4. Derivation inputs, and the prerequisite that blocks them

Derivation classifies from what the estimate records. The [E1 contract](../contracts/estimating-e1.md) states that each saved line requires a **Product, Labour or Freight** category, and that an Estimate binds to an Opportunity, owner, company and optional site.

| Classification signal | Available in E1 today |
|---|---|
| Sell total | Yes |
| Site attached | Yes, optional |
| Product / Labour / Freight mix | Yes |
| Engineering content | **No — no such category** |
| Subcontract content | **No — no such category** |
| Equipment identity and service history | **No — no equipment reference on an Estimate** |
| Lead time | Not in the E1 contract; `lead_time_days` exists in BP-04 section 5 design only |

The signals that most strongly discriminate Project from Sales Order — engineering and subcontract content — **cannot be expressed by the current line model**. Derivation built on today's taxonomy would classify from value, site presence and a three-way category mix, which is too thin to be reliable.

**A line category taxonomy extension is therefore the blocking prerequisite**, not an optimisation. It is also justified on estimating grounds alone: Engineering, Subcontract and Allowance are real cost categories that PPO cannot currently record. Its scope, migration number and contract changes are decided separately.

*Basis: the E1 contract document, authoritative for implemented behaviour. Migration 0012 and `src/` were not read for this record.*

## 5. Advisory and binding

| State | Meaning | Effect |
|---|---|---|
| **Advisory** | A derived classification with its decisive reason, displayed during drafting | None. Informational. Re-evaluated at checkpoints. |
| **Ambiguous** | Signals do not discriminate | Asks rather than guesses. Displayed as an open item, not a classification. |
| **Confirmed** | A person with authority has accepted or overridden the classification at handover creation | Binds. Determines the destination and the terms set. |

Nothing routes without confirmation. This preserves BP-04's existing principle that the receiving owner independently decides; the automation removes the typing, not the judgement.

## 6. Adopted risk controls

Four risks were identified before adoption. The controls below are adopted as design obligations; their parameters are not.

### Threshold brittleness

- Prefer **presence over magnitude** where presence discriminates. "Contains any engineering line" requires no calibration; "more than N engineering hours" does.
- **Three bands, not two.** Clear Project, clear Sales Order, and an explicit ambiguous band that asks. A confident wrong answer is worse than a question.
- **Rules are versioned data, not code.** A rule set carries an ID and version, snapshotted on every classification. Changing a threshold creates a new version; existing classifications never move.

### Classification churn

- Evaluate at **named checkpoints** — estimate version save, submission, quote preparation, acceptance — not on every line edit.
- **Asymmetric thresholds.** Moving to Project at a lower bar than moving back off it, to prevent oscillation across a boundary.
- **Latch on acknowledgement.** Once a reclassification is acknowledged, do not re-prompt for the same signal until it changes materially.

### Explainability

- **Classification snapshot**: rule set ID and version, the full input vector with source record UUIDs and versions, the decisive signal, the outcome, actor, time, and whether derived or overridden. This carries E2's immutable snapshot discipline across unchanged.
- **Decisive reason on screen.** Not "Project" but "Project — contains engineering lines (3 lines, 42 h) from estimate version v03".
- **Counterfactual.** "This would be Sales Order without the engineering lines." Cheap to compute from a first-match rule set; it also catches mis-scoped estimates.
- **Pure and replayable.** Signals in, classification out, no hidden state. Any historical classification re-runs against its snapshot and returns the identical answer. This is a testable property.

### Silent misclassification

- **Override exists**, with a mandatory reason. `SYN-E2-ROUTE-r01` proposed no override at all; that was defensible while the route was declared by a person and is not once a route can arise mid-estimate.
- **Coded reason taxonomy, not free text.** Codes make overrides measurable; free text does not.
- **Override rate is a monitored metric.** If a material share of one route class is overridden, the rule is wrong. This is what makes derivation improve rather than ossify, and what detects override becoming the default path.
- **Override does not silence re-evaluation.** It records that a person disagreed at a point in time. Materially changed signals surface again.
- **Scoped capability.** A dedicated permission, not implied by `estimating.edit`.
- **Divergence after approval or issue is an exception with an owner**, not a routine update.

### Residual risks, accepted

1. Derivation can only classify from what is recorded. If engineering work is not lined out, no control helps.
2. First-of-kind work will misclassify. The ambiguous band catches some, not all.
3. Rules encode how the business works today. Override rate is the early warning, and only works if someone watches it.

## 7. Sequencing

| Step | Output | State |
|---|---|---|
| 1 | Line category taxonomy extension — Engineering, Subcontract, Allowance, and an Estimate-to-equipment reference. Contract and migration change to E1. | Not started; blocking |
| 2 | Shadow-mode derivation — compute alongside the declared `SYN-E2-ROUTE-r01` model, record both, act on neither | Not started |
| 3 | Calibration study — measure disagreement across synthetic estimates; set bands from evidence rather than invention | Not started |
| 4 | Promote to advisory | Not started |
| 5 | Binding confirmation at acceptance handover | Not started |
| 6 | Blueprint covering the full model, and an ADR at implementation | Not started |

Shadow mode is scaffolding, removed after step 3. Running derivation alongside the declared model also means no adopted or proposed design is disturbed until there is evidence.

## 8. Boundary

This record adopts a direction. It does not:

- adopt any threshold, band, rule set or rule version
- change `src/`, `db/`, migrations, grants, runtime tests or deployed code
- authorise the taxonomy extension, which is decided separately
- allocate an ADR number or a migration slot
- close D-009, D-010, G02 or G03
- establish any CREMS parity claim, operational routing policy, approval authority or ERP behaviour
- authorise live integration, migration, customer communication or spend

## 9. Open questions

| Reference | Question | Blocks |
|---|---|---|
| DR-01 | Exact category set for the taxonomy extension, and whether Allowance is a category or a line flag | Step 1 |
| DR-02 | Whether an Estimate references equipment directly or through Site, and what that implies for the Service Operations equipment model | Step 1 |
| DR-03 | Which signals use presence and which use magnitude | Step 3 |
| DR-04 | Where the ambiguous band's boundaries sit | Step 3 |
| DR-05 | Whether route-aware terms sets require the route to be known before issue rather than at acceptance — a commercial question, not a system design one | Step 5 |
| DR-06 | Whether the unambiguous band may auto-confirm, trading the confirmation principle for friction on simple jobs | Step 5, revisit with evidence |

DR-05 is the question most likely to pull the binding moment earlier. It concerns liability exposure across differing job values under a single terms set, and needs a commercial answer before step 5 is designed.
