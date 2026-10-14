import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { cpqHttp, cpqProductHttpScenario } from "../helpers/cpq-products";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);

test("published CPQ API retains exact evidence and recovers original operations after withdrawal under current authority", async () => {
  const s = await cpqProductHttpScenario();
  assert.deepEqual(await cpqHttp(s.cookie, `cpq/runs/${s.run.id}`), s.run);
  assert.deepEqual(await cpqHttp(s.cookie, s.provenancePath), s.provenance);
  for (const [path, payload, receipt] of [
    [s.endpoint, s.command, s.calculationReceipt],
    [`cpq/runs/${s.run.id}/adoption`, s.adoption, s.adoptionReceipt],
  ] as const) {
    assert.deepEqual(
      await cpqHttp(s.cookie, `operations/${payload.operation_id}`),
      receipt,
    );
    assert.deepEqual(await cpqHttp(s.cookie, path, payload), receipt);
    assert.equal(
      (
        await cpqHttp<{ code: string }>(
          s.cookie,
          path,
          { ...payload, reason: "SYN changed original" },
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
    "CpqProductPublicationChanged",
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.p.actor_id],
  );
  for (const path of [
    s.provenancePath,
    `cpq/runs/${s.run.id}`,
    `cpq/releases/${s.release.id}`,
    `operations/${s.command.operation_id}`,
    `operations/${s.adoption.operation_id}`,
  ])
    assert.equal(
      (await cpqHttp<{ code: string }>(s.cookie, path, undefined, 404)).code,
      "RecordUnavailable",
    );
  await cpqHttp(s.cookie, `cpq/runs/${s.run.id}/adoption`, s.adoption, 404);
});
