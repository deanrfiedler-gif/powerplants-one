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

  // A choice option no reference case selects.
  for (const input of def.inputs.filter((i) => i.type === "Choice")) {
    // The value each case actually ran with: an input that was not asked takes its default.
    const used = new Set(
      cases.map((c, i) =>
        c.run.status === "Done"
          ? c.run.inputs.find((x) => x.key === input.key)?.value
          : Object.hasOwn(def.reference_cases[i].inputs, input.key)
            ? def.reference_cases[i].inputs[input.key]
            : input.default,
      ),
    );
    // Each untested option is its own finding, so one accepted reason never covers another option.
    input.choices.forEach((option, i) => {
      if (!used.has(option))
        add("Blocking", "OPTION_UNTESTED", `${input.key}[${i}]`, `Option “${option}” of ${input.label} is in no reference case`);
    });
  }

  // A rule whose unit differs from its part's unit.
  const partUnit = new Map(def.parts.map((p) => [p.key, p.unit]));
  const runs = cases.map((c) => c.run).filter((r) => r.status === "Done");
  for (const r of def.rules) {
    if (r.unit === null) continue;
    const parts = new Set<string>(r.part ? [r.part] : runs.flatMap((run) => run.lines.filter((l) => l.rules.includes(r.key)).map((l) => l.part)));
    for (const part of parts)
      if (partUnit.get(part) !== r.unit)
        add("Blocking", "UNIT_MISMATCH", `${r.key}/${part}`, `Rule ${r.key} counts in ${r.unit}, but ${part} is sold in ${partUnit.get(part)}`);
  }

  // A table row no reference case reads.
  const read = new Set(runs.flatMap((run) => run.rows_read.map((x) => `${x.table}\u0000${x.row}`)));
  for (const t of def.tables) {
    const unread = t.rows.map((_, i) => i).filter((i) => !read.has(`${t.key}\u0000${i}`));
    if (unread.length)
      add("Warning", "ROW_UNREAD", t.key, `${t.label}: row${unread.length === 1 ? "" : "s"} ${unread.map((i) => i + 1).join(", ")} ${unread.length === 1 ? "is" : "are"} read by no reference case`);
  }

  // A rule that applies in no reference case.
  const applied = new Set(runs.flatMap((run) => run.applied));
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
