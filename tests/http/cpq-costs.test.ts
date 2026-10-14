import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { cpqHttp } from "../helpers/cpq-products";
import { cpqCostHttpScenario } from "../helpers/cpq-costs-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("governed CPQ compiled API retains exact source evidence, recovers originals after source changes and rechecks access", async () => {
  const s = await cpqCostHttpScenario();
  assert.deepEqual(await cpqHttp(s.cookie, `cpq/runs/${s.run.id}`), s.run);
  for (const [path, command, receipt] of [
    [s.endpoint, s.command, s.calculationReceipt],
    [`cpq/runs/${s.run.id}/adoption`, s.adoption, s.adoptionReceipt],
  ] as const) {
    assert.deepEqual(
      await cpqHttp(s.cookie, `operations/${command.operation_id}`),
      receipt,
    );
    assert.deepEqual(await cpqHttp(s.cookie, path, command), receipt);
    assert.equal(
      (
        await cpqHttp<{ code: string }>(
          s.cookie,
          path,
          { ...command, reason: "SYN changed original" },
          409,
        )
      ).code,
      "OperationConflict",
    );
  }
  assert.equal(
    (
      await cpqHttp<{ code: string }>(
        s.cookie,
        `cpq/runs/${s.run.id}/adoption`,
        undefined,
        409,
      )
    ).code,
    "CpqCostSourceChanged",
  );
  const grants = (
    await database().query<{ id: string; valid_to: Date | null }>(
      "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.read'",
      [s.p.actor_id],
    )
  ).rows;
  try {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='estimating.read'",
      [s.p.actor_id],
    );
    for (const path of [
      `cpq/runs/${s.run.id}`,
      `cpq/releases/${s.release.release.id}`,
      `operations/${s.adoption.operation_id}`,
      `estimating/estimates/${s.estimate.id}`,
    ])
      await cpqHttp(s.cookie, path, undefined, 404);
    await cpqHttp(s.cookie, `cpq/runs/${s.run.id}/adoption`, s.adoption, 404);
  } finally {
    for (const grant of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [grant.id, grant.valid_to],
      );
  }
});
