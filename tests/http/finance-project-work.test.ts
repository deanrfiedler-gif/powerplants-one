import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { linkedFinanceDraft } from "../helpers/project-work-finance";
import { base, readFinance } from "../helpers/finance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("B4 compiled HTTP refuses billable project work without disclosing project identity", async () => {
  const f = await linkedFinanceDraft();
  // Seed Finance has no project.read: refusal must not require or reveal that scope.
  const project = await h.call("finance", `projects/${f.project.id}`);
  assert.ok([403, 404].includes(project.status));
  const r = await readFinance(f.p, f.id);
  const response = await h.call("finance", `finance/handoffs/${f.id}/submit`, {
    ...base(),
    expected_version: r.handoff.version,
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.code, "ProjectWorkNotBillable");
  assert.equal(
    response.body.message,
    "This work order is included in a project contract. Charge additional work through an approved variation claim.",
  );
  const body = JSON.stringify(response.body);
  for (const hidden of [
    f.project.id,
    f.project.title,
    f.project.display_number,
  ])
    assert.ok(!body.includes(hidden));
  assert.equal((await readFinance(f.p, f.id)).handoff.status, "Draft");
});
