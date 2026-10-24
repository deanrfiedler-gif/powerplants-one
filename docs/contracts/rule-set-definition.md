# Configuration rule set definition (schema 5)

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation contract for build step R1 of [ADR-0066](../decisions/ADR-0066-configuration-rule-sets.md), which Dean accepted on 24 October 2026. Traceability: EST-02 to EST-07, ES-02, ES-03 and ES-08.

Status: R1 engine and R2 storage implemented with synthetic data only. Rules studio screens (R3), the Excel round trip (R4) and ES-08 on rule sets (R5) are later changes. Passing reference cases is software evidence, not engineering approval. Real rule sets with real part identities still need the authority decision in ADR-0066 Q6, so every stored rule set is marked synthetic and the database refuses anything else.

## Where it lives

- `src/cpq/rule-sets/` is a pure engine. It reuses the exact `Fraction` from `src/cpq/expression.ts` but has its own parser, so definition schemas 1–4, their hashes and saved evidence keep their meaning.
- The isolated CPQ worker (`scripts/cpq-worker.mjs`) runs it with the existing memory and five-second limits, through `ruleSetTestIsolated`, `ruleSetRunIsolated` and `ruleSetJobIsolated` in `src/cpq/runner.ts`. Definitions arrive as untrusted data and are checked inside the worker.
- The runner copies each request as plain data (objects, lists, text, numbers, true/false and null) and sends that copy to the worker. It refuses with `PayloadTooLarge`, before it starts a worker, a request of more than 12,582,912 JSON characters, nested more than 32 deep, or holding anything else, such as a Map, buffer, date, class instance, accessor or proxy. The worker's memory limit does not cover copying the request in: an 80 MB input value aborted the whole process in a probe.
- The worker refuses any kind other than `rule-set-test`, `rule-set-run` and `rule-set-job` (`KIND`). It refuses supplied inputs that are not an object of text values, more than 100 of them, or a value over 300 characters, each with a path. A Map or other container is refused rather than read as empty. A name echoed in a path or message, by the worker or by validation, is shortened to 64 characters.

## The definition

| Field | Meaning |
|---|---|
| `schema_version`, `kind` | Always `5` and `"RuleSet"`. |
| `key`, `label`, `family` | Stable key (`^[a-z][a-z0-9_]{0,47}$`), display name and product family. |
| `inputs` | Typed questions: `Number`, `WholeNumber`, `YesNo` or `Choice`, each with a label, question wording, unit, options, minimum and maximum, default, `required`, and an optional `asked_when` formula. |
| `derived` | Named values worked out in list order from inputs and earlier derived values. |
| `tables` | Versioned data with typed columns (`Number` or `Text`), one or more key columns matched `Exact`, `AtLeast` or `AtMost`, and rows. Each table records its `source`. |
| `parts` | How each part is sold: unit, group, ordering (`AsCalculated`, `Whole`, `StockLength` with a length, `Pack` with a size) and installation minutes per unit. Part keys (`^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`) can carry product references. Parts hold no prices. |
| `rules` | A `when` condition, then a fixed `part` or a `choose` formula, then a `quantity` formula, in phase `Materials` or `Labour`, with an optional counting `unit`. |
| `reference_cases` | Inputs with either expected lines and values, or an expected stop code, and the `source` the expected values came from. They come from outside the rules (ADR-0066 Q3). |
| `passes` | Named values another rule set on the same job may receive (ADR-0066 Q11). |

Validation refuses a definition with every problem it finds, each with a path such as `rules[3].when` and a code. It lists the first 200 problems in the order found, then one `ISSUE_LIMIT` entry counting the rest. The refusals include:
- an invalid or duplicate key (inputs, derived values and tables share one namespace), or a key that is a word the language uses (`true`, `false`, `and`, `or`, `not` or a function name);
- an input type, option list, bound or default that does not fit;
- an optional or sometimes-asked input with no default;
- a rule with both or neither of `part` and `choose`, or a fixed part that does not exist;
- a column declared twice (the first declaration is the column; the second is reported and never read), a table whose key column is missing, with more than one range key (a grid is split into one table per exact value), a range key on a text column, or range rows out of order within each group of equal exact keys (number keys are equal by value, so `1` and `1.0` are one group);
- a part with an invalid ordering size or group;
- reference cases that name unknown inputs, parts or derived values, or an expected line quantity that is not a non-negative number (a decimal such as `6.1`, a long whole number or an exact fraction such as `1/3`);
- every formula error below;
- text containing a NUL character, which PostgreSQL cannot store;
- the limits: 524,288 bytes of UTF-8 JSON, 100 inputs, 100 derived values, 50 tables of up to 20 columns and 2,000 rows, 1,000 parts, 500 rules, 200 reference cases and 50 passed values.

## The formula language

```
expr    := or;  or := and ("or" and)*;  and := not ("and" not)*;  not := "not" not | compare
compare := sum (("=" | "<>" | "<" | "<=" | ">" | ">=") sum)?
sum     := product (("+" | "-") product)*;  product := unary (("*" | "/") unary)*
unary   := "-" unary | primary
primary := number | "text" | true | false | name | call | "(" expr ")"
call    := if(c, a, b) | ceil(x) | floor(x) | round(x[, places]) | min(a, b, ...) | max(a, b, ...)
         | lookup("table", "column", key...) | qty("part") | minutes(["group"])
```

Formulas are type-checked when the rule set is saved. The types are Number, Text and YesNo.
- Arithmetic and the ordering comparisons need Numbers, and `=` and `<>` need matching types.
- Conditions, `when` and `asked_when` must be YesNo. Quantities must be Numbers, and `choose` must be Text.
- A name must be an input or an earlier derived value. A later or circular reference is refused, and `asked_when` may read earlier inputs only.
- Comparing a Choice input with an option it does not have is refused.
- `lookup` takes quoted table and column names and one key per table key, each of the key column's type.
- `qty` and `minutes` appear only in Labour rules.
- Limits are 2,048 characters, 256 tokens and 32 levels of brackets, function arguments, minus signs and `not` per formula; 200,000 evaluation steps per case; and 2,000,000 steps across all the cases of one test or job, so a large rule set stops with `COMPUTATION_LIMIT` inside the worker's time limit.

## Working out a case

1. **Inputs.** Each input is coerced in order: Number and WholeNumber are bounded decimals within their bounds, YesNo is `Yes` or `No`, and a Choice is one of its options. An input whose `asked_when` is false takes its default and is reported as not asked. Only a missing value takes the default: a supplied value that is not text stops the case with `INPUT_INVALID`. A required input with no value stops the case.
2. **Derived values** are worked out in list order, then the passed values.
3. **Rules.** Materials rules run in list order, then Labour rules. `qty` reads the materials quantity of a part, and `minutes` sums materials quantity × installation minutes, optionally for one part group.
4. **Lines** sum per part. A zero quantity produces no line. The order quantity rounds up to whole units, stock lengths or packs.
5. **Lookups** check rows from the top. `Exact` matches equal values, `AtLeast` takes the first row at or above, and `AtMost` the first row at or below.
6. **Results.** Arithmetic is exact, and `round` rounds half away from zero. Values are shown as exact decimals, or as `n/d` when not exact to 12 places.

A case stops with a code rather than guessing:

| Code | When |
|---|---|
| `INPUT_MISSING`, `INPUT_INVALID`, `INPUT_UNKNOWN` | A required input has no value, a value does not fit its input or is not text, or a given or received value names no input |
| `LOOKUP_NO_ROW` | A table has no row for the keys; the message names the table and keys |
| `CHOSEN_PART_UNKNOWN` | A `choose` formula names a part that is not in the rule set |
| `QUANTITY_NEGATIVE` | A rule gives a negative quantity |
| `DIVIDE_BY_ZERO`, `ROUND_PLACES`, `COMPUTATION_LIMIT` | Arithmetic that cannot be worked out, or a case that needs too many steps |

## Reference cases and coverage

`testRuleSet` runs every reference case. A case passes when every expected line equals the result exactly, no unexpected line appears and every expected value matches. Quantities and Number values are equal by value (`6.10` is `6.1`, `2/6` is `1/3`); Text and YesNo values must match as written, so `01` is not `1`. A case that expects a stop passes when it stops with that code. Each line is reported with the expected and actual quantity.

A stopped case keeps a `trace` of the inputs it used, the rules it applied, the table rows it read and the part each applied rule gave, up to where it stopped. Coverage counts that trace, never the inputs as written in the case.

Coverage findings:

| Severity | Code | Finding |
|---|---|---|
| Blocking | `NO_REFERENCE_CASES` | The rule set has no reference cases |
| Blocking | `DUPLICATE_RULE` | Two rules give the same fixed part under the same condition |
| Blocking | `OPTION_UNTESTED` | A choice option is in no reference case |
| Blocking | `UNIT_MISMATCH` | A rule counts in a unit different from its part's unit: its fixed part, a part its `choose` formula always gives, or any part it chose in a case, even with a zero quantity |
| Warning | `ROW_UNREAD` | A table row is read by no reference case |
| Warning | `RULE_NEVER_APPLIES` | A rule applies in no reference case |
| Warning | `DERIVED_UNREAD` | A derived value is read by nothing |

Each finding names its subject, so one acceptance covers exactly one thing: an untested option is `input[index]` (for example `edge_fixing[2]`), and a unit mismatch is `rule/part`. The others name the rule set, rule, table or derived value. Accepting a blocking finding with a written reason belongs to storage and review (R2).

## Rule sets on one job

`runTogether` runs up to 20 rule set steps in order on one job, and refuses more with `STEP_LIMIT` (and a repeated step name with `STEP_DUPLICATE`). A step can receive inputs from an earlier step's passed values, and the same rule set may run more than once, for example once per controller. A number passes exactly, so one third arrives as one third; the receiving input still checks its type, whole-number rule and bounds. A step whose received name is not one of its inputs stops with `INPUT_UNKNOWN`. A step whose source stopped, ran later or does not pass the named value stops with `UPSTREAM_STOPPED`, `STEP_ORDER` or `PASS_MISSING`. Every part produced by more than one step is listed in `shared_parts`. The engine never merges shared parts: how they count is each family's policy (for Priva, question J2 in the control decisions).

## Storage and governance (R2)

Migration 0119 stores rule sets per company. Each rule set has a key that is unique in its company, a label, a family and a named engineering owner (ADR-0066 Q2). The company, key and owner never change.

| Table | Holds |
|---|---|
| `ppo.cpq_rule_sets` | The rule set, its current revision and its state: `Draft`, `Reviewed`, `Rejected` or `Published` |
| `ppo.cpq_rule_set_revisions` | Immutable revisions: the schema 5 definition, its content hash and the `testRuleSet` result at save |
| `ppo.cpq_rule_set_acceptances` | The owner's written acceptance of a blocking finding of one revision (Q5) |
| `ppo.cpq_rule_set_reviews` | One independent review of the exact content hash per revision, with its test result |
| `ppo.cpq_rule_set_publications`, `ppo.cpq_rule_set_heads` | Numbered, immutable publications and the current one |

The existing duties govern; there is no new capability, grant or seed.

| Command | Route | Rule |
|---|---|---|
| Save | POST `/api/v1/cpq/rule-sets` | `cpq.author`. A new rule set names its owner, who must be able to author or review for the company. Each save is a new Draft revision with `expected_version`. A definition that fails validation is refused with every problem (`RuleSetInvalid`, one field error per problem). Failing cases and findings are saved, so work in progress is never lost. Unchanged content is refused. |
| Accept a finding | POST `/api/v1/cpq/rule-sets/[id]/acceptances` | Owner only, while they can still author or review for the company (`RuleSetOwnerUnauthorised` otherwise), on the current Draft. Exact revision, finding `code` and `subject` (up to 200 characters), and a reason. |
| Review | POST `/api/v1/cpq/rule-sets/[id]/review` | `cpq.review`, not the author, with the owner as author or reviewer. Exact revision and hash. The cases and coverage rerun in the worker. Approval needs every case passing and every blocking finding accepted. |
| Publish | POST `/api/v1/cpq/rule-sets/[id]/publish` | `cpq.publish`, neither the author nor the reviewer. The reviewer must still hold `cpq.review`; otherwise `RuleSetReviewerUnauthorised` (409) asks for a fresh review. Exact reviewed revision and hash, and `expected_publication_version`. Moves the head; earlier publications never change. |
| List, read | GET `/api/v1/cpq/rule-sets?company_id=`, GET `/api/v1/cpq/rule-sets/[id]?revision_id=` | `cpq.read`. A read returns the rule set, the owner, the selected revision, its acceptances and review, the revision and publication history, the head and the reader's capabilities. |

Commands use the shared operation conventions: operation identity, reason, receipts, audit (`CpqRuleSet`) and the `CpqChanged` outbox kind. A replayed receipt is returned only to someone who still holds the duty the command needed. Triggers enforce the same governance when the service is bypassed:
- owner-only acceptance of a real blocking finding;
- an independent review of the exact content of the current Draft revision, with the owner taking part;
- for approval, both the test result stored at save and the one rerun at review must pass (`ppo.cpq_rule_set_test_passes`, which compares exact JSON values and never casts), and every blocking finding in either must be accepted;
- a third-person publisher of the current Reviewed revision;
- a head that only moves forward to a later publication of the same rule set and is never deleted;
- immutable revisions, acceptances, reviews and publications;
- a stored definition of at most 1 MiB of jsonb text, above the 524,288-byte validation limit because jsonb text adds spacing.

## Evidence

`tests/database/cpq-rule-sets.test.ts` covers storage: the lifecycle, owner acceptance, every governance refusal, the triggers when the service is bypassed, immutability and receipts. `tests/unit/cpq-rule-sets.test.ts` covers the language, validation, evaluation, ordering, reference cases, coverage, rule sets together and the worker. The fixtures in `tests/fixtures/rule-sets/` are fictional SYN families:
- **Screens:** ported from the structures the offline proof found in a private screen workbook.
- **Fertigation and control:** working together on one job.

Their expected values are worked by hand in the fixtures. The private workbook and the Priva deal trials that informed the design stay outside the repository.
