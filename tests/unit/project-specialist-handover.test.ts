import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHandoverCommand } from "../../src/engineering/materials/validation";
const id = "00000000-0000-4000-8000-000000000001";
const native = { schema_version: 1, operation_id: id, reason: "SYN", action: "prepare", id, release_id: id,
  requested_action: "ProcurementReady", demand_basis: "Approved", demand_source_id: id, receiver_id: id, required_by: null, predecessor_id: null };
test("PJ06 R2 opt-in leaves ordinary parsed handover command bytes unchanged and accepts only an exact source selector", () => {
  assert.deepEqual(parseHandoverCommand(native), native);
  const parsed = parseHandoverCommand({ ...native, specialist: { id, version: 3 } });
  assert.deepEqual(parsed, { ...native, specialist: { id, version: 3 } });
  for (const specialist of [null, { id, version: 0 }, { id, version: 1.5 }, { id, version: 3, content: {} }, { id, version: 3, source_hash: "a".repeat(64) }])
    assert.throws(() => parseHandoverCommand({ ...native, specialist }));
  assert.throws(() => parseHandoverCommand({ ...native, requested_action: "ForecastOnly", specialist: { id, version: 3 } }));
  assert.throws(() => parseHandoverCommand({ ...native, demand_basis: "Forecast", demand_source_id: null, specialist: { id, version: 3 } }));
});
