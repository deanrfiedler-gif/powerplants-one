import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { cpqHttp } from "../helpers/cpq-products";
import { cpqRebaseHttpScenario } from "../helpers/cpq-rebase-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("compiled rebase and receiving decisions retain exact history and original-operation recovery after source changes", async () => {
  const s = await cpqRebaseHttpScenario();
  for (const [path, command, receipt] of [
    [s.parentEndpoint + "/rebase", s.command, s.rebaseReceipt],
    [`cpq/runs/${s.run.id}/adoption`, s.adoption, s.adoptionReceipt],
  ] as const) {
    assert.deepEqual(await cpqHttp(s.cookie, path, command), receipt);
    assert.deepEqual(
      await cpqHttp(s.cookie, `operations/${command.operation_id}`),
      receipt,
    );
    await cpqHttp(
      s.cookie,
      path,
      { ...command, reason: "SYN changed accepted request" },
      409,
    );
  }
  assert.deepEqual(await cpqHttp(s.cookie, `cpq/runs/${s.run.id}`), s.run);
  assert.deepEqual(await cpqHttp(s.cookie, s.provenancePath), s.provenance);
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
  await cpqHttp(
    "",
    `cpq/runs/${s.run.id}/adoption/preview`,
    { decisions: [] },
    401,
  );
  await cpqHttp(
    s.cookie,
    s.parentEndpoint + "/rebase/preview",
    { ...s.command, computed_total: "0" },
    422,
  );
});
