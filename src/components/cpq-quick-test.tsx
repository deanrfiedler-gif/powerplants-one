"use client";
import { useEffect, useId, useState } from "react";
import type {
  Condition,
  ConditionEvidence,
  Definition,
  Fact,
  Rule,
  Scalar,
} from "../cpq/types";
import type { validateDraft } from "../cpq/ui-reads";
import { api, type Failure } from "./business-ui";
import { Button } from "./ui/button";
import { ProductIcon, type ProductIconName } from "./product-icons";
import { CpqField, CpqState, quantity, type CpqTone, type Wire } from "./cpq-ui";

// Accepted frames 486:641 / 488:1029, "Quick test": the selected saved scenario run against this
// exact draft (and the published or saved version, for comparison) through the read-only server
// validator. Nothing is written; a quick test is never evidence for creating a version.
type Report = Wire<Awaited<ReturnType<typeof validateDraft>>>;
export type QuickRun = {
  for: string;
  draft: Report | null;
  base: Report | null;
  error: Failure | null;
  baseError: Failure | null;
};
const message = (e: Failure | null) =>
  e?.field_errors?.[0]?.message ?? e?.message ?? "The quick test could not run.";
// A rejected definition (4xx with a message) is a validation result; a lost connection is not.
export const quickInvalid = (run: QuickRun | null) =>
  !!run?.error && !run.error.retryable && (run.error.status ?? 500) < 500;

// `baseline` is the published (or saved) definition in editor form; `signature` is the draft's.
export function useQuickTest({
  company,
  definition,
  signature,
  baseline,
  ruleKey,
  scenario,
  enabled,
}: {
  company: string;
  definition: Definition;
  signature: string;
  baseline: Definition | null;
  ruleKey: string | undefined;
  scenario: number;
  enabled: boolean;
}) {
  const [run, setRun] = useState<QuickRun | null>(null);
  const key = `${signature}#${scenario}`;
  useEffect(() => {
    const fixture = definition.fixtures[scenario];
    if (!enabled || !fixture) return;
    let live = true;
    // Debounced, so typing in a condition does not send one request per keystroke.
    const timer = setTimeout(() => {
      const compare =
        baseline && baseline.rules.some((r) => r.key === ruleKey)
          ? api<Report>("cpq/validate", {
              company_id: company,
              definition: { ...baseline, fixtures: [fixture] },
            })
          : Promise.resolve(null);
      void Promise.allSettled([
        api<Report>("cpq/validate", {
          company_id: company,
          definition: { ...definition, fixtures: [fixture] },
        }),
        compare,
      ]).then(([draft, base]) => {
        if (!live) return;
        setRun({
          for: key,
          draft: draft.status === "fulfilled" ? draft.value : null,
          error: draft.status === "rejected" ? (draft.reason as Failure) : null,
          base: base.status === "fulfilled" ? base.value : null,
          baseError: base.status === "rejected" ? (base.reason as Failure) : null,
        });
      });
    }, 500);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [company, definition, baseline, ruleKey, scenario, enabled, key]);
  return enabled && run?.for === key ? run : null;
}

const plainUnit = (unit: string | undefined) =>
  unit && !["each", "count"].includes(unit) ? ` ${unit}` : "";
function value(v: Scalar | undefined, fact?: Fact) {
  if (v === undefined) return "Not set";
  if (v === null) return "Unknown";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return fact && ["Decimal", "Integer"].includes(fact.type)
    ? `${v}${plainUnit(fact.unit)}`
    : v;
}
function conditionFacts(c: Condition, out: string[] = []) {
  if ("fact" in c) out.push(c.fact);
  if ("items" in c) for (const x of c.items) conditionFacts(x, out);
  if ("item" in c) conditionFacts(c.item, out);
  return out;
}
const names = (formula: string): string[] =>
  formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
const symbol: Record<string, string> = { GT: ">", GTE: "≥", LT: "<", LTE: "≤" };
function summary(c: Condition, facts: Fact[]): string {
  if (c.op === "ALWAYS") return "Always applies";
  if ("items" in c) return `${c.op} of ${c.items.length} conditions`;
  if ("item" in c) return `NOT ${summary(c.item, facts)}`;
  const fact = facts.find((f) => f.key === c.fact),
    label = fact?.label ?? c.fact;
  if ("values" in c) return `${label} is one of …`;
  if (!("value" in c))
    return `${label} is ${c.op === "KNOWN" ? "known" : "not applicable"}`;
  if (typeof c.value === "boolean")
    return `${label} is ${c.op === "NE" ? "not " : ""}${c.value}`;
  const unit =
    fact && ["Decimal", "Integer"].includes(fact.type) ? plainUnit(fact.unit) : "";
  return symbol[c.op]
    ? `${label} ${symbol[c.op]} ${c.value}${unit}`
    : `${label} ${c.op === "NE" ? "is not" : "is"} ${c.value}${unit}`;
}
const verdicts: Record<string, { text: string; icon: ProductIconName; tone: CpqTone }> = {
  true: { text: "True", icon: "converted", tone: "good" },
  false: { text: "False", icon: "circle-xmark", tone: "neutral" },
  null: { text: "Unknown", icon: "help", tone: "warning" },
};
// One line per top-level condition, as the frame draws them: the outcome, the condition and the
// scenario's value. A nested ALL / ANY group reads as one line; NOT shows its single child.
function conditionLines(evidence: ConditionEvidence, facts: Fact[]) {
  const items =
    evidence.condition.op === "ALL" || evidence.condition.op === "ANY"
      ? (evidence.children ?? [])
      : [evidence];
  return items.map((e) => {
    const leaf = e.condition.op === "NOT" ? e.children?.[0] : e,
      condition = leaf?.condition,
      fact =
        condition && "fact" in condition
          ? facts.find((f) => f.key === condition.fact)
          : undefined,
      verdict = verdicts[String(e.result)];
    return {
      ...verdict,
      text: [
        verdict.text,
        summary(e.condition, facts),
        ...(leaf && "actual" in leaf ? [value(leaf.actual, fact)] : []),
      ].join(" · "),
    };
  });
}
const glyph: Record<string, string> = { "*": "×", "/": "÷", "+": "+", "-": "−" };
function substituted(formula: string, values: Record<string, string>) {
  const tokens =
    formula.match(/\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*|\S/g) ?? [];
  return tokens
    .map((t, i) => {
      const binary =
        t in glyph && i > 0 && !["(", ",", "+", "-", "*", "/"].includes(tokens[i - 1]);
      if (binary) return ` ${glyph[t]} `;
      if (t === "-") return "−";
      if (t === ",") return ", ";
      return values[t] ?? t;
    })
    .join("");
}
type Outcome = {
  value: string;
  quantity: string | null;
  detail: string;
  lines: ReturnType<typeof conditionLines>;
};
function outcome(
  report: Report | null,
  rule: Rule,
  definition: Definition,
  instance: string | undefined,
): Outcome {
  const result = report?.results[0]?.result,
    unit = definition.parts.find((p) => p.key === rule.part)?.unit ?? "",
    explanation = result?.explanation;
  if (!explanation)
    return { value: "—", quantity: null, detail: "No result was returned for this scenario.", lines: [] };
  const trace =
      explanation.rules.find((t) => t.rule === rule.key && t.instance_id === instance) ??
      explanation.rules.find((t) => t.rule === rule.key),
    line = explanation.lines.find(
      (l) =>
        (!instance || l.instance_id === instance) &&
        l.contributions.some((c) => c.rule === rule.key),
    ),
    contribution = line?.contributions.find((c) => c.rule === rule.key),
    lines = trace ? conditionLines(trace.condition, definition.facts) : [];
  if (contribution) {
    const rounded =
      (BigInt(contribution.exact.numerator) * 1000n) %
        BigInt(contribution.exact.denominator) !==
      0n;
    return {
      value: `${quantity(contribution.quantity)} ${unit}`.trim(),
      quantity: contribution.quantity,
      detail:
        `${substituted(rule.quantity, contribution.facts)} = ${quantity(contribution.quantity)}` +
        (rounded ? " · rounded to three places" : "") +
        (line && !line.selected_rules.includes(rule.key)
          ? " · not selected by its resolution group"
          : ""),
      lines,
    };
  }
  const none = (detail: string, shown = "—") => ({
    value: shown,
    quantity: shown === "—" ? null : "0",
    detail,
    lines,
  });
  switch (trace?.outcome) {
    case "Zero":
      return none("The formula gives 0 for this scenario", `0 ${unit}`.trim());
    case "NotApplicable":
      return none("Does not apply: a condition is false for this scenario");
    case "Unknown":
      return none("No result: a fact this rule reads is unknown");
    case "Error":
      return none(`No result: ${trace.error ?? "the formula failed"}`);
    case "TableExcluded":
      return none("A decision table excludes this rule for this scenario");
    default:
      return none("This rule does not run for this scenario’s configuration");
  }
}

export function QuickTestPanel({
  definition,
  rule,
  scenario,
  onScenario,
  run,
  enabled,
  blocked,
  chip,
  baselineLabel,
  baselineHasRule,
  inline = false,
  runAll,
}: {
  definition: Definition;
  rule: Rule;
  scenario: number;
  onScenario: (n: number) => void;
  run: QuickRun | null;
  enabled: boolean;
  blocked: string | null;
  chip: string;
  baselineLabel: string | null;
  baselineHasRule: boolean;
  inline?: boolean;
  runAll?: { onClick: () => void; busy: boolean; disabled: boolean };
}) {
  const id = useId(),
    fixtures = definition.fixtures,
    fixture = fixtures[scenario],
    instance = fixture?.input.instances[0],
    keys = [
      ...new Set([
        ...conditionFacts(rule.when),
        ...names(rule.quantity).filter((k) => definition.facts.some((f) => f.key === k)),
      ]),
    ],
    parameters = (rule.parameters ?? []).filter((p) =>
      names(rule.quantity).includes(p.key),
    );
  let result: Outcome;
  if (blocked) result = { value: "—", quantity: null, detail: blocked, lines: [] };
  else if (!fixture)
    result = { value: "—", quantity: null, detail: "No saved scenario to test", lines: [] };
  else if (!enabled)
    result = {
      value: "—",
      quantity: null,
      detail: "Author permission is required to run a quick test",
      lines: [],
    };
  else if (!run)
    result = { value: "…", quantity: null, detail: "Calculating this scenario…", lines: [] };
  else if (run.error)
    result = { value: "—", quantity: null, detail: `No result: ${message(run.error)}`, lines: [] };
  else result = outcome(run.draft, rule, definition, instance?.id);
  const base = run?.base ? outcome(run.base, rule, definition, instance?.id) : null;
  const comparison = !baselineLabel
    ? null
    : blocked
      ? "Complete the draft to test it"
      : !baselineHasRule
        ? `${baselineLabel} does not contain this rule`
        : !run || run.error
          ? null
          : run.baseError || !base
            ? `${baselineLabel}: comparison unavailable for this scenario`
            : base.quantity === null
              ? `${baselineLabel}: ${base.detail.charAt(0).toLowerCase()}${base.detail.slice(1)}`
              : result.quantity !== null && Number(base.quantity) === Number(result.quantity)
                ? `${baselineLabel} gives ${quantity(base.quantity)} · no difference for this scenario`
                : `${baselineLabel} gives ${quantity(base.quantity)} · different from this draft`;
  return (
    <section
      className={inline ? "cpq-quick-test cpq-quick-inline" : "cpq-summary cpq-quick-test"}
      aria-labelledby={`${id}-head`}
    >
      <div className="cpq-quick-head">
        <h2 id={`${id}-head`}>Quick test</h2>
        <CpqState pill icon="pen-square">
          {chip}
        </CpqState>
      </div>
      {fixtures.length ? (
        <CpqField
          label="Scenario"
          help={`Synthetic fixture · ${fixtures.length} saved ${fixtures.length === 1 ? "scenario" : "scenarios"} in this release`}
        >
          <select
            value={Math.min(scenario, fixtures.length - 1)}
            onChange={(e) => onScenario(Number(e.target.value))}
          >
            {fixtures.map((f, i) => (
              <option value={i} key={i}>
                {f.name}
              </option>
            ))}
          </select>
        </CpqField>
      ) : (
        <p className="cpq-muted">
          No saved scenarios. Add one in the Test bench to test this rule.
        </p>
      )}
      {instance && (keys.length > 0 || parameters.length > 0) && (
        <div className="cpq-quick-inputs">
          <h3>Inputs</h3>
          <dl>
            {keys.map((key) => {
              const fact = definition.facts.find((f) => f.key === key);
              return (
                <div key={key}>
                  <dt>{fact?.label ?? key}</dt>
                  <dd>
                    {instance.not_applicable?.includes(key)
                      ? "Not applicable"
                      : value(instance.facts[key], fact)}
                  </dd>
                </div>
              );
            })}
            {parameters.map((p) => (
              <div key={p.key}>
                <dt>{p.label}</dt>
                <dd>
                  {p.value}
                  {plainUnit(p.unit)} · release parameter
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <div className="cpq-quick-result" aria-live="polite">
        <p className="cpq-quick-result-head">
          <span>Draft result</span>
          <strong>{result.value}</strong>
        </p>
        <p>{result.detail}</p>
        {comparison && <p className="cpq-quick-compare">{comparison}</p>}
        {result.lines.length > 0 && (
          <ul aria-label="Conditions for this scenario">
            {result.lines.map((l, i) => (
              <li key={i}>
                <CpqState icon={l.icon} tone={l.tone}>
                  {l.text}
                </CpqState>
              </li>
            ))}
          </ul>
        )}
      </div>
      {runAll && (
        <div>
          <Button
            variant="primary"
            busy={runAll.busy}
            disabled={runAll.disabled}
            onClick={runAll.onClick}
          >
            <ProductIcon name="play" />
            Run all {fixtures.length} scenarios
          </Button>
        </div>
      )}
      <p className="cpq-quick-note">
        {inline
          ? "Quick test is not evidence for publication. Run all scenarios below; the result is bound to this exact draft."
          : "Quick test is not evidence for publication. Run all scenarios in the Test bench; the result is bound to this exact draft."}
      </p>
    </section>
  );
}
