// Coverage checks run on every save (ADR-0066). Blocking findings stop submission unless the
// rule set owner accepts them with a written reason; that acceptance belongs to storage (R2).
import type { CaseResult } from "./cases";
import type { Node } from "./language";
import type { CheckedRuleSet } from "./validate";

export type Finding = {
  severity: "Blocking" | "Warning";
  code: string;
  subject: string;
  message: string;
};

const namesIn = (n: Node, into: Set<string>): Set<string> => {
  if (n.k === "name") into.add(n.name);
  if ("a" in n) namesIn(n.a, into);
  if ("b" in n) namesIn(n.b, into);
  if (n.k === "call") n.args.forEach((a) => namesIn(a, into));
  return into;
};

export function coverage(checked: CheckedRuleSet, cases: CaseResult[]): Finding[] {
  const def = checked.definition;
  const findings: Finding[] = [];
  const add = (severity: Finding["severity"], code: string, subject: string, message: string) =>
    findings.push({ severity, code, subject, message });

  if (!def.reference_cases.length)
    add("Blocking", "NO_REFERENCE_CASES", def.key, "The rule set has no reference cases, so nothing checks it");

  // Two rules giving the same fixed part under the same condition.
  const seen = new Map<string, string>();
  for (const r of def.rules) {
    if (r.part === null) continue;
    // Compare parsed conditions, so spacing never makes two conditions look different or alike.
    const sig = `${r.phase}\u0000${r.part}\u0000${JSON.stringify(checked.rules.get(r.key)!.when.tree)}`;
    const first = seen.get(sig);
    if (first)
      add("Blocking", "DUPLICATE_RULE", r.key, `Rules ${first} and ${r.key} give ${r.part} under the same condition`);
    else seen.set(sig, r.key);
  }

  // What each case actually used, whether it finished or stopped part-way.
  const traces = cases.flatMap((c) => (c.run.status === "Done" ? [c.run] : c.run.trace ? [c.run.trace] : []));

  // A choice option no reference case selects.
  for (const input of def.inputs.filter((i) => i.type === "Choice")) {
    // The value each case ran with: an input that was not asked took its default, and a case that
    // stopped before reaching the input used none.
    const used = new Set(traces.map((t) => t.inputs.find((x) => x.key === input.key)?.value));
    for (const option of input.choices)
      if (!used.has(option))
        add("Blocking", "OPTION_UNTESTED", input.key, `Option “${option}” of ${input.label} is in no reference case`);
  }

  // A rule whose unit differs from its part's unit: its fixed part, a part its formula always chooses,
  // and every part it chose in a case, even with a zero quantity.
  const partUnit = new Map(def.parts.map((p) => [p.key, p.unit]));
  for (const r of def.rules) {
    if (r.unit === null) continue;
    const literal = checked.rules.get(r.key)!.choose?.tree;
    const parts = new Set<string>(
      r.part
        ? [r.part]
        : [
            ...(literal?.k === "text" && partUnit.has(literal.value) ? [literal.value] : []),
            ...traces.flatMap((t) => t.chosen.filter((x) => x.rule === r.key).map((x) => x.part)),
          ],
    );
    for (const part of parts)
      if (partUnit.get(part) !== r.unit)
        add("Blocking", "UNIT_MISMATCH", r.key, `Rule ${r.key} counts in ${r.unit}, but ${part} is sold in ${partUnit.get(part)}`);
  }

  // A table row no reference case reads.
  const read = new Set(traces.flatMap((t) => t.rows_read.map((x) => `${x.table}\u0000${x.row}`)));
  for (const t of def.tables) {
    const unread = t.rows.map((_, i) => i).filter((i) => !read.has(`${t.key}\u0000${i}`));
    if (unread.length)
      add("Warning", "ROW_UNREAD", t.key, `${t.label}: row${unread.length === 1 ? "" : "s"} ${unread.map((i) => i + 1).join(", ")} ${unread.length === 1 ? "is" : "are"} read by no reference case`);
  }

  // A rule that applies in no reference case.
  const applied = new Set(traces.flatMap((t) => t.applied));
  for (const r of def.rules)
    if (!applied.has(r.key)) add("Warning", "RULE_NEVER_APPLIES", r.key, `Rule ${r.key} applies in no reference case`);

  // A derived value nothing reads.
  const readers = new Set<string>();
  for (const c of [...checked.derived.values(), ...checked.asked.values(), ...checked.passes.values()]) namesIn(c.tree, readers);
  for (const c of checked.rules.values()) {
    namesIn(c.when.tree, readers);
    namesIn(c.quantity.tree, readers);
    if (c.choose) namesIn(c.choose.tree, readers);
  }
  for (const d of def.derived)
    if (!readers.has(d.key)) add("Warning", "DERIVED_UNREAD", d.key, `Derived value ${d.label} is read by nothing`);

  return findings;
}
