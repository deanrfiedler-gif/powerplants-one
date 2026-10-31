import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { evaluationHash } from "../src/assistant/evaluation";
import { assessments, catalogueHash, scoringRubric, type Catalogue } from "./t2e-catalogue";
import type { exportPreparation } from "./t2e-preparation";
// Human-readable projections of a proposed inventory. They grant no approval and carry no provider body.
export type Inventory = Awaited<ReturnType<typeof exportPreparation>>;
type Member = Inventory["report"]["instances"][number];
const caseOf = (c: Catalogue, id: string) => { const k = c.cases.find(k => k.id === id); assert.ok(k, `Unknown case ${id}`); return k; };
const header = (title: string, result: Inventory) => [`# ${title}`, "",
  "Proposed offline review material for T2E-SYN-01: no model results, owner acceptance, approval or live authority.", "",
  `Catalogue hash: \`${result.report.catalogue_hash}\`. Inventory hash: \`${result.inventory_hash}\`.`, ""];
const counted = (values: string[]) => [...new Set(values)].map(v => `${v} ${values.filter(x => x === v).length}`).join(", ");
export function caseCards(c: Catalogue, result: Inventory) {
  const lines = [...header("T2e synthetic case cards", result),
    "Each card shows the case definition, its predeclared scoring and the gold bindings of its first sample; `proposed-inventory.json` holds every sample's own source identities.",
    "Application invariants are pass/fail checks outside model-quality scores and gold denominators; fixed CannotAnswer wording earns no model points.",
    "Review every model claim, including volunteered facts. Resolve displayed citation numbers through the stored source identities: they can differ from envelope S numbers.",
    "Input bounds are conservative byte estimates, not measured tokens.", ""];
  for (const k of c.cases) {
    const members = result.report.instances.filter(i => i.case_id === k.id), first = members[0];
    assert.ok(first, `${k.id} has no sample`);
    lines.push(`## ${k.id} — ${k.stage}`, "", `**Question:** ${k.question}`, "", `**Setup:** ${k.setup}`, "",
      `${members.length} independent samples. Requirements: ${k.requirements.join(", ")}. Parent requirements: ${k.parent_requirements.join(", ")}.`, "",
      `**Expected assertions** (first sample: \`${first.model}\` repetition ${first.repetition}; included sources: ${counted(first.sources.map(s => s.type))}):`, "");
    first.gold.forEach((g, n) => {
      lines.push(`${n + 1}. ${g.claim}`, `   - ${assessments[g.assessment as keyof typeof assessments]}`);
      for (const s of g.support) lines.push(`   - ${s.source_id}: ${s.alias} \`${s.field}\` = ${JSON.stringify(s.equals)}; record \`${s.record_id}\`, version ${s.source_version}`);
    });
    lines.push("", "**Predeclared scoring:**", "", ...Object.entries(scoringRubric(k.scoring)).map(([dimension, rule]) => `- ${dimension}: ${rule}`), "");
  }
  return lines.join("\n");
}
const bindings = (i: Member) => i.gold.reduce((n, g) => n + g.support.length, 0);
export function sampleTable(result: Inventory) {
  return [...header("T2e synthetic sample table", result),
    "| Case | Model | Rep. | Turn | Sources | Excluded | Gold bindings | Input estimate | Messages retained / omitted |",
    "|---|---|---:|---|---:|---:|---:|---:|---:|",
    ...result.report.instances.map(i => `| ${i.case_id} | ${i.model} | ${i.repetition} | \`${i.turn_id}\` | ${i.sources.length} | ${i.excluded.length} | ${bindings(i)} | ${i.bounds.estimated_input_tokens} | ${i.bounds.retained_messages} / ${i.bounds.fitted_omissions} |`),
    "", "Input estimates are the existing conservative byte meter plus the 8,192 allowance, not measured tokens; `offline-bounds.csv` carries the price scenarios.",
    "Each sample's source identities, gold bindings and evidence hash are in `proposed-inventory.json`. No approval_reference, run ID or installable manifest is emitted.", ""].join("\n");
}
export const reviewDocuments = (c: Catalogue, result: Inventory) => ({ "cases.md": caseCards(c, result), "review.md": sampleTable(result) });
// One report field or member per line; JSON content is unchanged and the canonical hash ignores layout.
export function formatInventory(result: Inventory) {
  const fields = Object.entries(result.report).map(([key, value]) => key === "instances"
    ? `"instances": [\n${result.report.instances.map(i => JSON.stringify(i)).join(",\n")}\n]` : `${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  return `{\n"report": {\n${fields.join(",\n")}\n},\n"inventory_hash": ${JSON.stringify(result.inventory_hash)}\n}\n`;
}
export function writeReviewPackage(path: string, c: Catalogue, result: Inventory) {
  writeFileSync(path, formatInventory(result), { flag: "wx" });
  for (const [name, text] of Object.entries(reviewDocuments(c, result))) writeFileSync(resolve(dirname(path), name), text, { flag: "wx" });
}
const read = (path: string) => {
  try { return readFileSync(path, "utf8").replaceAll("\r\n", "\n"); } catch { assert.fail(`Missing review file ${path.split(/[\\/]/).at(-1)}`); }
};
// A verified inventory alone does not establish that the cards and table presented for review still describe it.
export function checkReviewDocuments(dir: string, c: Catalogue, result: Inventory) {
  for (const [name, text] of Object.entries(reviewDocuments(c, result))) assert.equal(read(resolve(dir, name)), text, `${name} must match the inventory`);
}
// Offline check of a retained package; it reads no database and cannot detect corpus drift (use export for that).
export function checkReviewPackage(c: Catalogue, path: string) {
  const text = read(path), result = JSON.parse(text) as Inventory;
  assert.equal(evaluationHash(result.report), result.inventory_hash, "Corrupt inventory");
  assert.equal(result.report.catalogue_hash, catalogueHash(c), "Inventory describes a different catalogue");
  for (const i of result.report.instances) assert.ok(isDeepStrictEqual(i.gold.map(({ claim, assessment, support }) => ({ claim, assessment,
    support: support.map(({ alias, field, equals }) => ({ alias, field, equals })) })), caseOf(c, i.case_id).gold), `${i.case_id} gold differs from the catalogue`);
  assert.equal(text, formatInventory(result), "Inventory layout differs from the tool output");
  checkReviewDocuments(dirname(path), c, result);
  return result;
}
