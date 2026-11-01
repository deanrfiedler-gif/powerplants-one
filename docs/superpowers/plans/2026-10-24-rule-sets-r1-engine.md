# Rule sets R1: the rule set engine, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build step R1 of [ADR-0066](../../decisions/ADR-0066-configuration-rule-sets.md), accepted by Dean on 24 October 2026, which he asked to start the same day: "Yes: start ADR-0066 build step R1, the rule set engine, as its own PR with synthetic fixtures."

R1 delivers the rule set schema in the interpreter, the model, line-level reference cases and coverage checks, with tests ported from the offline proof on synthetic fixtures. It stores nothing, adds no route, screen, permission, migration or seed, and changes no existing CPQ schema, hash or saved evidence. Storage (R2), screens (R3), the Excel round trip (R4) and ES-08 (R5) are later pull requests.

**Architecture:**
- A new folder `src/cpq/rule-sets/` holds a pure engine. It reuses the exact `Fraction` and `CceError` from `src/cpq/expression.ts` but has its own compiler, so definition schemas 1–4 keep their meaning byte for byte.
- `model.ts` holds the types and limits. `validate.ts` turns untrusted JSON into a frozen definition or refuses it with every problem found, each with a path and a code. `language.ts` tokenises, parses and type-checks formulas at save time. `evaluate.ts` runs one case. `cases.ts` compares reference cases line by line. `coverage.ts` produces the save-time findings. `together.ts` runs several rule sets on one job (ADR-0066 Q11).
- `scripts/cpq-worker.mjs` gains two kinds, `rule-set-test` and `rule-set-run`, and `src/cpq/runner.ts` gains `ruleSetTestIsolated` and `ruleSetRunIsolated`. Rule content stays data inside the existing isolated worker and its limits.

**Tech stack:** TypeScript 6, `node:test` with `tsx`. No new package.

## The definition (schema 5)

```ts
type RuleSetDefinition = {
  schema_version: 5; kind: "RuleSet";
  key: string; label: string; family: string;
  inputs: Input[]; derived: Derived[]; tables: Table[];
  parts: Part[]; rules: Rule[]; reference_cases: ReferenceCase[];
  passes: { key: string; value: string }[];   // values another rule set may receive (Q11)
};
type Input = {
  key: string; label: string; question: string; unit: string;
  type: "Number" | "WholeNumber" | "YesNo" | "Choice";
  choices: string[]; minimum: string | null; maximum: string | null;
  default: string | null; required: boolean; asked_when: string | null;
};
type Derived = { key: string; label: string; unit: string; formula: string };
type Table = {
  key: string; label: string; source: string;
  columns: { key: string; type: "Number" | "Text" }[];
  keys: { column: string; match: "Exact" | "AtLeast" | "AtMost" }[];
  rows: Record<string, string>[];
};
type Part = {
  key: string; description: string; unit: string; group: string;
  ordering: { kind: "AsCalculated" } | { kind: "Whole" }
          | { kind: "StockLength"; length: string } | { kind: "Pack"; size: string };
  install_minutes: string;
};
type Rule = {
  key: string; description: string; phase: "Materials" | "Labour";
  when: string; part: string | null; choose: string | null;
  quantity: string; unit: string | null;
};
type ReferenceCase = {
  key: string; label: string; source: string;
  inputs: Record<string, string>;
  expected: { lines: { part: string; quantity: string }[]; values: Record<string, string> }
          | { stop: string };
};
```

- Keys match `^[a-z][a-z0-9_]{0,47}$`, except part keys, which match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` so they can carry product references. Keys are unique within their kind, and input, derived and table keys share one namespace.
- A rule has exactly one of `part` and `choose`.
- An input with `asked_when` must have a default, which is its value when it is not asked.
- Reference-case expected values come from outside the rules (ADR-0066 Q3). The `source` field records where they came from.

## The formula language

```
expr    := or
or      := and ("or" and)*
and     := not ("and" not)*
not     := "not" not | compare
compare := sum (("=" | "<>" | "<" | "<=" | ">" | ">=") sum)?
sum     := product (("+" | "-") product)*
product := unary (("*" | "/") unary)*
unary   := "-" unary | primary
primary := number | "text" | true | false | name | call | "(" expr ")"
call    := if(c, a, b) | ceil(x) | floor(x) | round(x[, places]) | min(a, b, ...) | max(a, b, ...)
         | lookup("table", "column", key...) | qty("part") | minutes(["group"])
```

- **Types** are Number, Text and YesNo, checked when the rule set is saved. Arithmetic needs Numbers. `=` and `<>` need matching types, and the ordering comparisons need Numbers. `and`, `or`, `not`, `if` conditions and `when` need YesNo. `if` branches must match. A quantity must be a Number and `choose` must be Text.
- **Names**: an input, or a derived value earlier in the list. A later or circular reference is refused at save. Rules and `passes` may use every input and derived value. `asked_when` may use earlier inputs only.
- **Choice literals**: comparing a Choice input with a text literal that is not one of its choices is refused at save.
- **Lookups**: the table and column must be text literals naming an existing table and column, with one key per table key, each of the key column's type. Rows are checked from the top. `Exact` matches equal values, `AtLeast` takes the first row at or above the value and `AtMost` the first row at or below it. Range keys must be in ascending (`AtLeast`) or descending (`AtMost`) order within each group of equal exact keys; this is checked at save. A lookup that finds no row stops the case with `LOOKUP_NO_ROW` and the table and keys. Nothing is guessed.
- `qty("part")` and `minutes(["group"])` only appear in Labour rules. `qty` gives the materials quantity of a part, and `minutes` gives the total installation minutes over the materials lines, optionally for one part group.
- Arithmetic is exact (`Fraction`). `round` rounds half away from zero to 0–12 places, as schema 3 does. Division by zero stops the case.
- Limits: 2,048 characters, 256 tokens and nesting depth 32 per formula; 200,000 evaluation steps per case.

## Running a case

1. Coerce inputs: Number and WholeNumber values are bounded decimals within `minimum` and `maximum` (WholeNumber must be an integer), YesNo is `Yes` or `No`, and Choice must be one of its choices. A missing required input stops the case with `INPUT_MISSING`. Inputs whose `asked_when` is false take their default and are reported as not asked.
2. Work out derived values in list order.
3. Run Materials rules in list order, then Labour rules. A rule applies when its `when` is true. Its part is the fixed part or the `choose` result, which must be a part of the rule set (`CHOSEN_PART_UNKNOWN`). A negative quantity stops the case (`QUANTITY_NEGATIVE`); a zero quantity produces no line.
4. Lines sum per part. The order quantity follows the part's ordering: Whole rounds up; StockLength and Pack round up to whole lengths or packs.
5. The result lists the inputs used, the derived values, the lines in part order, the rules that applied, and the table rows read. All values are exact decimal strings, or `n/d` when not exact to 12 places.

## Reference cases and coverage

- `testRuleSet(definition)` runs every reference case. A case passes when every expected line equals the result exactly, no unexpected line appears, and every expected value matches. A case that expects a stop passes when it stops with that code.
- Coverage findings:
  - **Blocking:** two rules giving the same fixed part under the same condition; a choice option no case selects; a rule unit that differs from its part's unit.
  - **Warning:** a table row no case reads; a rule that applies in no case; a derived value nothing reads.

## Rule sets working together (ADR-0066 Q11)

`runTogether(steps)` runs rule sets in order on one job. A step can receive inputs from an earlier step's `passes` values. Every part produced by more than one rule set is flagged with the rule sets that produced it. The engine flags shared parts and does not merge them; how they are counted is each family's policy.

## Tasks

- [ ] **Task 1: model and validation.** `model.ts`, `validate.ts`. Tests: a valid definition passes and is frozen; each structural refusal has a path and code (key patterns, duplicates, shared namespace, part/choose exclusivity, asked_when without default, choice defaults, table key columns, row order, limits).
- [ ] **Task 2: the language.** `language.ts`: tokenise, parse and type-check. Tests: precedence, every function, type errors, forward and circular references, unknown names, choice literals, lookup arguments, labour-only functions, limits.
- [ ] **Task 3: evaluation.** `evaluate.ts`. Tests: input coercion and bounds, asked_when, derived order, exact/AtLeast/AtMost and two-key lookups, missing row, choose, unknown chosen part, zero and negative quantities, ordering kinds, labour qty and minutes, exact arithmetic and rounding, the step budget.
- [ ] **Task 4: reference cases and coverage.** `cases.ts`, `coverage.ts`. Tests: pass, line mismatch, unexpected line, value mismatch, expected stop, and every coverage finding.
- [ ] **Task 5: rule sets together.** `together.ts`. Tests: values passed between rule sets, a missing passed value, and shared-part flags.
- [ ] **Task 6: synthetic families and isolation.** Fixtures `tests/fixtures/rule-sets/`: a synthetic screen family ported from the proof's structures (derived lengths, drive factors by drive type, a bay-size table, stock lengths, a chosen part and labour from minutes), and synthetic fertigation and control families that work together (a two-key range table choosing the unit, I/O modules from built-in outputs). Expected values are hand-calculated in the fixture, with the working shown. Worker kinds and runner functions, with a test through the worker.
- [ ] **Task 7: documentation.** The [rule set definition contract](../../contracts/rule-set-definition.md), its register entry and a status fragment.

## Verification

- `node --import tsx --test tests/unit/cpq-rule-sets*.test.ts`, the full unit suite, `tsc --noEmit` and `eslint` on the changed files.
- `python3 scripts/build_status.py --check` and `python3 scripts/check_naming.py`.
- Existing CPQ unit tests unchanged and passing.
