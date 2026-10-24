# ADR-0066: Configuration rule sets built in Powerplants One

<!-- versioning: git; committed history is authoritative -->

Status: proposed for Dean's review. Dean decided on 24 October 2026 to build the module in Powerplants One rather than buy one (quoted below). The model, the amendments and the open questions in this record still await his acceptance. This record adds no code, migration, seed, permission, capability or route.
Date: 24 October 2026. Owner: Dean Fiedler. Builder: Claude.

Related: [estimating hub, CPQ and workbench model](estimating-configurator-model.md) (PPO-EST-CONFIGURATOR-MODEL-DEC, CM1 and build steps B0–B6); [CPQ native runtime](cpq-native-runtime.md); [CPQ rule packages](cpq-rule-packages.md); [CPQ Figma design](cpq-figma-design.md); [rule editor alignment](cpq-rule-editor-design-alignment.md); [ADR-0034](ADR-0034-es08-specialist-workbench.md), which this would amend; [ADR-0048](ADR-0048-products-native-catalogue.md), under which Products keeps part identity; [workbench parts proposal contract](../contracts/workbench-parts-proposal.md); parent requirements EST-02 to EST-07. Design proposal: Figma file "PPO - Design", page "Rules studio · rule sets, derived values & tables · ES-02 · ES-03" (node 2315:792701). It is not yet accepted and has no named version. Usability check: [engineer walkthrough](../testing/rule-sets-engineer-walkthrough.md).

## Context

On 23 October 2026 Dean asked for the rules of a recovered screen estimator workbook to be loaded into the CPQ Rules Registry. The workbook is private and is not in this repository. Recovering it showed the following:

- **Size.** The workbook has 78 named inputs and derived values and a 68-row parts schedule. 59 of those rows carry quantity formulas, and 9 are manual.
- **Building blocks.** Its formulas lean on named intermediate values (total length, drives, light-seal wire counts), on two lookup tables (bay geometry, and a drive-factor matrix by component and drive type), and on conditions over list inputs.
- **Defects nobody had seen.** These included duplicate lines, factors that contradicted their notes, units that disagreed with quantities, and a Pinion branch that omitted most of its parts.

Today's registry (CPQ definition schema 3) could hold those rules only with workarounds:

- **No derived values.** Every intermediate value had to be written out inside every formula that used it.
- **No value lookups.** Decision tables only switch whole rules on or off, so they can't return a value.
- **Limited conditions.** A condition can only compare an input with a fixed value.
- **One fixed part per rule.** A rule can't choose its part.
- **Totals-only tests.** Fixtures assert totals, not individual lines.
- **Size limits.** Expressing the workbook needed 69 rules and about 58 KB of the 60 KB definition limit.
- **Not editable in the app.** The ES-08 workbench, the adopted route for screens (CM1), holds its formulas as hand-written TypeScript. [ADR-0034](ADR-0034-es08-specialist-workbench.md) rejected "a generic formula evaluator", so an engineering change needs a code change.

Dean then asked how such rules should be built, whether they would be editable in the app, and for a professional recommendation. The recommendation was to build one governed, editable rule-set capability on the existing CPQ interpreter, and to have workbenches run published rule sets. Asked whether that was fully satisfactory, the answer named seven gaps:

- choosing parts by range;
- conditions on calculated values;
- labour from quantities;
- a second product family;
- usability with engineers;
- build or buy;
- governance.

Dean replied on 24 October 2026: "Taking into account those areas that you are not satisfied with, proceed with the improvements so you are satisfied. I definitely want to build my on module, and not buy Tacton."

## Decision (proposed)

**Extend the existing CPQ interpreter with a rule set model under a new definition schema.** Workbenches run published rule sets, and engineers edit rule sets in an extended Rules studio.

### The model

A **rule set** is the versioned unit for one product family. It holds:

- **Inputs:** number, whole number, Yes/No and choice, each with a unit, allowed values, a default and its question wording. An input can be asked only when a condition holds.
- **Derived values:** named and worked out in list order. A value may use inputs and earlier values only. A forward or circular reference is refused when the rule set is saved.
- **Lookup tables:** versioned data looked up by one or more keys.
  - Each key matches `exact`, `at or above` or `at or below` (for example, the first row rated at or above a required torque).
  - Rows are checked from the top, and their order is verified for range keys.
  - A lookup that finds no row stops that case with a reason. Nothing is guessed.
- **Parts:** how each part is sold and rounded for ordering (as calculated, whole units, stock lengths, packs) and its installation minutes per unit. Products keeps identity and the MYOB mapping ([ADR-0048](ADR-0048-products-native-catalogue.md)). Parts hold no prices.
- **Rules:** a condition, then either a fixed part or a formula that **chooses** the part (normally a table lookup), then a quantity formula.
  - Conditions may test inputs and derived values.
  - Materials rules run first.
  - Labour rules run next and can read material quantities and total installation minutes. Typed labour remains only where work does not follow quantities.
- **Formula language:**
  - arithmetic, comparisons, `and`/`or`/`not`;
  - `if`, `ceil`, `floor`, `round`, `min`, `max`, `lookup`, and the labour-only `qty` and `minutes`;
  - exact rational arithmetic, and no loops, user functions, files or network.
- **Reference cases:** expected quantities from outside the rules (a recalculated workbook, a past job or a second person), compared line by line.
- **Coverage checks**, run on every save:
  - two rules giving the same part under the same condition;
  - a choice option no case selects;
  - a table row no case reads;
  - a rule that never applies;
  - a derived value nothing reads;
  - a unit mismatch between a rule and its part.

  Blocking findings stop submission unless the rule set owner accepts them with a written reason. The reason is shown on the review.

### Governance

- **Draft, check, review, publish.** A draft is checked automatically, reviewed by someone other than its author, and published by a publisher. These are the existing duties: `cpq.author`, `cpq.review`, `cpq.publish`.
- **Plain-English review.** The reviewer sees each change in plain English, with its effect on every reference case.
- **Immutable versions.** Published versions never change. Estimates, parts proposals and quotations keep the version they used.
- **Excel round trip.** Tables can be exported to Excel and imported back. An import is reviewed value by value, invalid values are refused, the effect on the reference cases is shown, and only the draft changes.

### What does not change

- Rule sets carry no prices. Workbenches send a price-free parts proposal (B0) that records the rule set version, and CPQ prices it.
- CM1 routing is unchanged.
- The interpreter stays restricted and deterministic, inside the existing worker limits ([CPQ native runtime](cpq-native-runtime.md)).
- Definition schemas 1–4, their hashes and saved evidence keep their meaning.

## Amendments if accepted

- **[ADR-0034](ADR-0034-es08-specialist-workbench.md):** the rejection of a generic formula evaluator no longer applies to ES-08 calculations. ES-08 keeps its screens, drawings and evidence, but calculates through a published rule set run by the restricted interpreter. This is the owner's requirement for in-app editing; the interpreter is typed and bounded, not arbitrary code.
- **[CPQ rule packages](cpq-rule-packages.md):** that record found a new calculation schema unnecessary for packages. The rule set model needs derived values, value tables and part selection, which schemas 1–4 cannot hold, so a new schema is needed. It leaves existing schemas and hashes untouched.
- **[CPQ native runtime](cpq-native-runtime.md):** "full no-code rule authoring" moves from tracked work to this design.
- **[Estimating hub, CPQ and workbench model](estimating-configurator-model.md):** the parts proposal (B0) carries the rule set identity and version.

## Options considered

| Option | For | Against | Verdict |
|---|---|---|---|
| Buy a commercial configurator such as Tacton | Mature authoring, solver and support | Licence and integration cost, a second platform beside PPO, and the owner's decision | Rejected by Dean on 24 October 2026 |
| Keep the current registry (schema 3) | Already built and governed | No derived values, value tables, part selection or line-level tests; the workbook hit the size limits | Rejected |
| Hand-written engine per workbench (ES-08 today) | Exact, fast, typed | Engineers cannot change rules; every family costs a code project | Rejected for calculations; workbench screens stay |
| Calculate the workbook itself on the server | Reuses existing spreadsheets | Not reviewable rule by rule; carries spreadsheet defects; needs a spreadsheet engine dependency; no coverage | Rejected |
| A general rules or DMN engine library | Standard notations | A new dependency and a second expression language beside the existing interpreter, when the model needs a small subset | Rejected |
| **Extend the existing interpreter with a rule set schema** | Reuses the worker, exact arithmetic, governance and UI; small language; no new dependency | Engine and editor work to build and prove | **Selected** |

## Evidence: offline proof of the model (24 October 2026)

A prototype evaluator implemented the model with exact fractions. It covered ordered derived values, exact and range lookups, part selection, labour from quantities, line-by-line comparison and the coverage checks. It and the private workbook data stay outside this repository. The proof tests whether the model can express real rules. It does not test the production engine, its performance, storage or screens.

- **Screens (private workbook).**
  - The workbook's rules were expressed in the model with 31 inputs, 13 derived values, 2 tables and 59 rules.
  - The expected values came from eight copies of the workbook recalculated in Excel: the baseline and seven branches the workbook had never exercised (Pinion with two spans, an odd bay, Quad clip with wires replaced, a 4.5 m bay with two motors, a steel leading edge without cutting, labour and travel, and a long house).
  - Result: **544 line comparisons, 0 differences.**
  - A circular derived value and a missing table row were both refused with a reason.
  - The coverage checks independently found an option no case tested and table rows no case read.
- **Second family.** See the section below; it is completed when that proof finishes.

## Consequences and build steps

Each step below is its own pull request with its own acceptance. None is authorised by this record.

1. **R1 Engine.** The rule set schema in the interpreter, the model above, line-level reference cases and coverage checks, with tests ported from the offline proof using synthetic fixtures.
2. **R2 Storage and versioning.** Rule set revisions, reviews and publication on the existing release model. This needs a migration, with a number reserved and every AGENTS.md upgrade obligation met.
3. **R3 Rules studio screens.** The Figma proposal must be accepted first, with design register entries in the same pull request.
4. **R4 Excel export and import review.**
5. **R5 ES-08 on rule sets.** Parity on its reference cases before the hand-written formulas are retired.
6. **R6 A second product family** on the same engine.

Other consequences:

- **Synthetic-only stance.** Real rule sets with real part identities need an authority decision before they are stored (Q6). Until then, rule sets in the repository and the hosted demo stay synthetic.
- **Engineering approval.** Passing reference cases is software evidence, not engineering approval. Each family needs a named engineering owner (Q2).

## Open questions (recommendation first)

- **Q1** Keep rule sets in Rules studio? Yes. Products keeps part identity and the MYOB mapping.
- **Q2** Should each product family have a named engineering owner who takes part in every review? Yes.
- **Q3** Must reference-case expected values come from outside the rules? Yes, never generated by the rules themselves.
- **Q4** Phone limited to review and case results? Yes.
- **Q5** Only the rule set owner may accept a blocking finding? Yes.
- **Q6** Record an authority decision for real rule sets before storing any? Yes.
- **Q7** Who supplies engineering values marked "to confirm" (for example torque per m²)? The family's engineering owner, with the source recorded on the value.
- **Q8** Should Excel imports accept values and new rows, but never new columns? Yes.

## Verification of this record

Documentation checks only: `python3 scripts/build_status.py --check` and `python3 scripts/check_naming.py`. Owner acceptance, the engineer walkthrough and every build step remain open.
