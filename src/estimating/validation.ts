import { common, commonKeys, object, uuid, version, label, narrative, invalid, choice } from "../shared/validation";
import { arithmeticPolicy, decimal, scaled, type CostLine, type QuoteChoice } from "./math";
export function amount(value: unknown, field: string, quantity = false) {
  let n: bigint;
  try { if (typeof value !== "string") throw Error(); n = scaled(value, quantity ? 3 : 2); }
  catch { return invalid(field, `Enter a decimal ${quantity ? "quantity with up to 3" : "amount with up to 2"} places. Blank is unknown, not zero.`); }
  if (n < (quantity ? 1n : 0n) || n > 100000000n)
    invalid(field, quantity ? "Quantity must be greater than zero and at most 100,000." : "Amount must be between 0 and 1,000,000 AUD.");
  return decimal(n, quantity ? 3 : 2);
}
export function parseLines(value: unknown): CostLine[] {
  if (!Array.isArray(value) || value.length > 100) invalid("lines", "Use at most 100 complete manual lines.");
  const lines = value.map((item, i) => {
    const r = object(item, ["id", "description", "category", "quantity", "unit", "unit_cost", "unit_sell", "source", "effective_date"]), f = (name: string) => `lines.${i}.${name}`;
    const unit_cost = amount(r.unit_cost, f("unit_cost")), unit_sell = amount(r.unit_sell, f("unit_sell"));
    if (scaled(unit_sell, 2) < scaled(unit_cost, 2)) invalid(f("unit_sell"), "Estimate sell cannot be below cost under this synthetic policy.");
    const date = String(r.effective_date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)
      invalid(f("effective_date"), "Enter the actual source date in YYYY-MM-DD form.");
    return { id: uuid(r.id, f("id")), description: label(r.description, f("description"), 300),
      category: choice(r.category, f("category"), ["Product", "Labour", "Freight"] as const),
      quantity: amount(r.quantity, f("quantity"), true), unit: label(r.unit, f("unit"), 40), unit_cost, unit_sell,
      source: narrative(r.source, f("source"), 500), effective_date: date };
  });
  if (new Set(lines.map(l => l.id)).size !== lines.length) invalid("lines", "Each cost line must have its own identity.");
  return lines;
}
export function scope(value: unknown) {
  const r = object(value, ["included", "excluded", "assumptions"]);
  return { included: narrative(r.included, "included", 3000), excluded: narrative(r.excluded, "excluded", 2000), assumptions: narrative(r.assumptions, "assumptions", 2000) };
}
function policy(value: unknown) { return choice(value, "policy", [arithmeticPolicy] as const); }
export function createInput(value: unknown) {
  const r = object(value, [...commonKeys, "id", "opportunity_id", "owner_id", "title", "scope", "lines", "policy"]);
  return { ...common(r), id: uuid(r.id,"id"), opportunity_id: uuid(r.opportunity_id,"opportunity_id"), owner_id: uuid(r.owner_id,"owner_id"),
    title: label(r.title,"title",200), scope: scope(r.scope), lines: parseLines(r.lines), policy: policy(r.policy) };
}
export function saveInput(id: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version", "title", "scope", "lines", "policy"]);
  return { ...common(r), id: uuid(id,"id"), expected_version: version(r.expected_version), title: label(r.title,"title",200), scope: scope(r.scope), lines: parseLines(r.lines), policy: policy(r.policy) };
}
export function quoteInput(id: string, value: unknown) {
  const r = object(value, [...commonKeys, "id", "estimate_version_id", "expected_version", "expected_quote_version", "choices"]);
  if (!Array.isArray(r.choices) || !r.choices.length || r.choices.length > 100) invalid("choices", "Choose the presentation of each saved line.");
  if (!Number.isSafeInteger(r.expected_quote_version) || Number(r.expected_quote_version)<0) invalid("expected_quote_version", "Use the current quotation revision, or zero before the first draft.");
  const choices: QuoteChoice[] = r.choices.map(value => {
    const c = object(value, ["line_id","included","print"]);
    if (typeof c.included !== "boolean" || typeof c.print !== "boolean") invalid("choices", "Include and print must be explicit choices.");
    return { line_id: uuid(c.line_id,"line_id"), included: c.included, print: c.print };
  });
  if (new Set(choices.map(c=>c.line_id)).size !== choices.length || !choices.some(c=>c.included)) invalid("choices", "Use each line once and include at least one line.");
  return { ...common(r), estimate_id: uuid(id,"estimate_id"), id: uuid(r.id,"id"), estimate_version_id: uuid(r.estimate_version_id,"estimate_version_id"), expected_version: version(r.expected_version), expected_quote_version:Number(r.expected_quote_version), choices };
}
