import assert from "node:assert/strict";
import { test } from "node:test";
import { sourceContent } from "../../src/estimating/sources/validation";
import { sourcePrice } from "../../src/estimating/sources/price";

const content = () => ({title: "SYN Screen rail", supplier_label: "SYN Supplier", supplier_entity_key: null, item_reference: "SYN-RAIL", unit: "m", currency: "AUD", tax_basis: "ExcludingTax", data_mode: "Synthetic", source_date: "2026-09-20", effective_from: "2026-09-21", valid_until: null, evidence_reference: "SYN authored price evidence", evidence_excerpt: "Synthetic authored rate. No live supplier source.", tiers: [{minimum_quantity: "0.001", unit_cost: "10"}, {minimum_quantity: "20", unit_cost: "9.50"}]});
test("ES03 exact source tiers use source units, retain explicit zero and preserve unknown validity", () => {
  const c = sourceContent(content());
  assert.equal(sourcePrice(c, "19.999", "m", "2026-09-24").unit_cost, "10.00");
  assert.equal(sourcePrice(c, "20.000", "m", "2026-09-24").unit_cost, "9.50");
  assert.match(sourcePrice(c, "20", "m", "2026-09-24").validity_warning!, /Unknown/);
  const free = sourceContent({...content(), tiers: [{minimum_quantity: "1", unit_cost: "0"}]});
  assert.equal(sourcePrice(free, "1", "m", "2026-09-24").unit_cost, "0.00");
  assert.throws(() => sourcePrice(free, "0.999", "m", "2026-09-24"), /below/);
  assert.throws(() => sourcePrice(c, "20", "m2", "2026-09-24"), /units/);
  assert.throws(() => sourcePrice(c, "20", "m", "2026-09-20"), /dates/);
});
test("ES03 unsupported commercial policy, malformed tiers, missing costs and false calendar dates are refused", () => {
  const invalid: Record<string, unknown>[] = [
    {currency: "USD"}, {tax_basis: "IncludingTax"}, {data_mode: "Operational"}, {fx_rate: "1.5"},
    {effective_from: "2026-02-30"}, {valid_until: "2026-09-20"},
    {tiers: [{minimum_quantity: "1", unit_cost: ""}]},
    {tiers: [{minimum_quantity: "1", unit_cost: "1.005"}]},
    {tiers: [{minimum_quantity: "20", unit_cost: "9"}, {minimum_quantity: "1", unit_cost: "10"}]},
    {tiers: [{minimum_quantity: "1", unit_cost: "9"}, {minimum_quantity: "1.000", unit_cost: "10"}]},
  ];
  for (const change of invalid) assert.throws(() => sourceContent({...content(), ...change}));
  const dated = sourceContent({...content(), valid_until: "2026-09-24"});
  assert.equal(sourcePrice(dated, "1", "m", "2026-09-24").validity_warning, null);
  assert.throws(() => sourcePrice(dated, "1", "m", "2026-09-25"), /dates/);
});
