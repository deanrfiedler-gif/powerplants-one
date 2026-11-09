import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import {
  commercialFixture,
  approvedBasis,
} from "../helpers/project-commercial";
import { crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("B2 compiled HTTP schedule save, independent approval, replay and scoped read", async () => {
  const f = await commercialFixture();
  await approvedBasis(f);
  const route = `projects/${f.project.id}/commercial/claims`;
  const command = (expected_version: number, action: string) => ({
    ...crmBase(),
    basis_id: f.create.id,
    expected_version,
    action,
  });
  const input = {
    ...command(0, "Save"),
    milestones: [
      {
        id: randomUUID(),
        title: "Completion",
        trigger: "Exact customer acceptance",
        amount: "350.00",
      },
    ],
  };
  const saved = await h.call("coordinator", route, input);
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  assert.equal(
    (await h.call("coordinator", route, command(1, "Submit"))).status,
    201,
  );
  assert.equal(
    (await h.call("coordinator", route, command(2, "Approve"))).status,
    409,
  );
  assert.equal(
    (await h.call("estimating-source-reviewer", route, command(2, "Approve")))
      .status,
    201,
  );
  const read = await h.call("coordinator", `${route}?basis_id=${f.create.id}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.state, "Approved");
  assert.deepEqual(read.body.milestones, input.milestones);
  const replay = await h.call("coordinator", route, input);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, saved.body);
  assert.equal(
    (await h.call("second-company", `${route}?basis_id=${f.create.id}`)).status,
    404,
  );
  assert.equal(
    (
      await h.call("coordinator", route, {
        ...command(3, "Approve"),
        milestones: input.milestones,
      })
    ).status,
    422,
  );
});
