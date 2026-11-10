import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { projectFinanceCommand } from "../../src/finance/project-claims-validation";
import { crmBase } from "../helpers/crm";
const draft = () => ({
  ...crmBase(),
  id: randomUUID(),
  source_kind: "ProjectClaim",
  project_id: randomUUID(),
  basis_id: randomUUID(),
  completion_versions: [5, 4],
  account_id: randomUUID(),
  mode: "SyntheticApi",
  definition_id: randomUUID(),
  definition_version: 1,
  policy_version: 1,
  treatment_basis: "Exact whole synthetic entitlement",
});
test("B3 inputs select whole completion versions, never client supplied amounts or partial quantities", () => {
  const input = draft();
  assert.deepEqual(
    projectFinanceCommand(null, input).completion_versions,
    [4, 5],
  );
  for (const extra of [
    { amount: "0.01" },
    { quantity: "0.5" },
    { work_order_id: randomUUID() },
    { reports: [] },
    { lines: [] },
  ])
    assert.throws(() => projectFinanceCommand(null, { ...input, ...extra }));
  for (const completion_versions of [
    [],
    [4, 4],
    [0],
    [1.5],
    Array.from({ length: 51 }, (_, i) => i + 1),
  ])
    assert.throws(() =>
      projectFinanceCommand(null, { ...input, completion_versions }),
    );
});
test("B3 distinguishes creation and revision without accepting alternate identity fields", () => {
  const input = draft();
  assert.throws(() => projectFinanceCommand(input.id, input));
  assert.throws(() =>
    projectFinanceCommand(null, { ...input, expected_version: 1 }),
  );
  const { id, ...revision } = input;
  assert.equal(
    projectFinanceCommand(id, { ...revision, expected_version: 2 }).id,
    id,
  );
});
