"use client";
import { useRef, useState } from "react";
import type { Definition, Rule } from "../cpq/types";
import type { validateDraft } from "../cpq/ui-reads";
import { compileFormula } from "../cpq/expression";
import { api, ErrorNotice } from "./business-ui";
import { Button } from "./ui/button";
import { CpqDialog, CpqField, CpqNotice, CpqPill, quantity, type Wire } from "./cpq-ui";

type Report = Wire<Awaited<ReturnType<typeof validateDraft>>>;
export function CpqFormulaEditor({ definition, rule, company, onApply, onClose }: {
  definition: Definition; rule: Rule; company: string;
  onApply: (formula: string) => void; onClose: () => void;
}) {
  const [formula, setFormula] = useState(rule.quantity),
    [search, setSearch] = useState(""),
    [scenario, setScenario] = useState(0),
    [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState<unknown>(null),
    [testing, setTesting] = useState(false),
    editor = useRef<HTMLTextAreaElement>(null);
  const part = definition.parts.find((p) => p.key === rule.part);
  const symbols = [
    ...definition.facts.filter((f) => ["Decimal", "Integer"].includes(f.type))
      .map((f) => ({ key: f.key, label: f.label, unit: f.unit, source: f.source ?? "Fact dictionary" })),
    ...(rule.parameters ?? []).map((p) => ({ ...p, source: "Release parameter" })),
    ...(rule.phase === "Labour" ? definition.parts.filter((p) => p.category !== "Labour" &&
      p.scope?.kind === part?.scope?.kind && p.scope?.group_fact === part?.scope?.group_fact)
      .map((p) => ({ key: `bom_${p.key}`, label: p.description, unit: p.unit, source: "Resolved material quantity" })) : []),
  ];
  let syntax: string | null = null;
  try { compileFormula(formula, new Set(symbols.map((s) => s.key)), definition.schema_version === 3); }
  catch (e) { syntax = (e as Error).message; }
  const edit = (value: string) => { setFormula(value); setReport(null); setError(null); };
  const insert = (text: string) => {
    const field = editor.current, start = field?.selectionStart ?? formula.length,
      end = field?.selectionEnd ?? start;
    edit(formula.slice(0, start) + text + formula.slice(end));
    const caret = start + (text.endsWith(")") ? text.indexOf("(") + 1 : text.length);
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(caret, caret); });
  };
  const run = async () => {
    setTesting(true); setError(null); setReport(null);
    try {
      setReport(await api<Report>("cpq/validate", { company_id: company, definition: {
        ...definition, rules: definition.rules.map((r) => r.key === rule.key ? { ...r, quantity: formula } : r),
      } }));
    } catch (e) { setError(e); }
    finally { setTesting(false); }
  };
  const result = report?.results[scenario];
  const functions = [
    ["ceil(x)", "Round up to a whole number", "ceil()"],
    ["floor(x)", "Round down to a whole number", "floor()"],
    ["round(x, places)", "Exact rounding; 0–12 places", "round(, 2)"],
    ["min(a, b)", "Smaller value", "min(, )"],
    ["max(a, b)", "Larger value", "max(, )"],
  ];
  return <CpqDialog title={`Quantity formula · ${part?.description ?? rule.description}`} onClose={onClose}
    footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={testing || !!syntax}
      onClick={() => onApply(formula)}>Apply to draft</Button></>}>
    <div className="cpq-formula-editor">
      <section className="cpq-stack">
        <small>{rule.phase} quantity · result unit: {part?.unit ?? "Not selected"}</small>
        <CpqField label="Formula"><textarea ref={editor} className="cpq-formula" rows={4} maxLength={2048}
          autoFocus disabled={testing} value={formula} onChange={(e) => edit(e.target.value)} /></CpqField>
        <CpqPill tone={syntax ? "warning" : "good"}>{syntax ?? "Syntax valid · server evaluation required"}</CpqPill>
        <div className="cpq-formula-units"><small>UNITS</small><p>{symbols.filter((s) => formula.includes(s.key))
          .map((s) => `${s.key} · ${s.unit}`).join("; ") || "No referenced facts or parameters"}</p>
          <small>Result: {part?.unit ?? "Not selected"}. Unit meanings remain authored metadata; validate the physical formula during independent review.</small></div>
        <CpqField label="Try it with a scenario"><select value={scenario} disabled={testing}
          onChange={(e) => setScenario(Number(e.target.value))}>{definition.fixtures.map((f, i) =>
            <option value={i} key={i}>{f.name}</option>)}</select></CpqField>
        <Button busy={testing} disabled={!!syntax || testing} onClick={() => void run()}>Run server test</Button>
        <ErrorNotice error={error} />
        {result && <div className="cpq-card">
          {(result.result?.lines ?? []).filter((l) => l.contributions.some((c) => c.rule === rule.key)).map((l) =>
            <p key={l.target}><strong>{quantity(l.line.quantity)} {l.line.unit}</strong> · {l.line.description}</p>)}
          <CpqPill tone={result.passed ? "good" : "bad"}>{result.passed ? "Scenario expectations match" : "Scenario expectations differ"}</CpqPill>
          <p>{result.actual.diagnostic_codes.join(" · ")}</p>
        </div>}
        <CpqNotice>Applying changes this working draft only. Run all scenarios and coverage checks in Test bench before creating a version.</CpqNotice>
      </section>
      <aside className="cpq-formula-insert cpq-stack">
        <CpqField label="Insert"><input placeholder="Find a fact or parameter" value={search} disabled={testing}
          onChange={(e) => setSearch(e.target.value)} /></CpqField>
        <small>FACTS & PARAMETERS</small>
        <div className="cpq-stack-tight">{symbols.filter((s) => `${s.label} ${s.key}`.toLowerCase().includes(search.toLowerCase())).map((s) =>
          <Button key={s.key} disabled={testing} onClick={() => insert(s.key)}><span><strong>{s.label}</strong>
            <small>{s.key} · {s.unit} · {s.source}</small></span></Button>)}</div>
        {definition.schema_version === 3 && <><small>FUNCTIONS</small><div className="cpq-stack-tight">{functions.map(([name, help, text]) =>
          <Button key={name} disabled={testing} onClick={() => insert(text)}><span><code>{name}</code><small>{help}</small></span></Button>)}</div></>}
        <small>Formulas allow + − × ÷, parentheses and the listed functions only. No scripts, loops or network access.</small>
      </aside>
    </div>
  </CpqDialog>;
}
