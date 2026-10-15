import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createSession } from "../../src/platform/identity";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { cpqPackageHttpScenario } from "../helpers/cpq-packages-http";
import { cpqHttp } from "../helpers/cpq-products";
import { crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("compiled packages assemble exact Cost Source releases, adopt native provenance and recover original operations after withdrawal", async () => {
  const s = await cpqPackageHttpScenario();
  for (const operation of s.operations) {
    assert.deepEqual(
      await cpqHttp(
        operation.cookie,
        `operations/${operation.command.operation_id}`,
      ),
      operation.receipt,
    );
    assert.deepEqual(
      await cpqHttp(operation.cookie, operation.path, operation.command),
      operation.receipt,
    );
  }
  await cpqHttp(s.cookie, `cpq/runs/${s.run.id}/adoption`, undefined, 409);
  const count = (
    await database().query(
      "SELECT count(*)::int n FROM ppo.cpq_package_events WHERE package_id=$1",
      [s.id],
    )
  ).rows[0].n;
  assert.equal(count, 5);
  await cpqHttp(s.cookie, s.path + "?include_private=true", undefined, 422);
  const outsider = `ppo_local_session=${(await createSession("technician")).token}`;
  await cpqHttp(outsider, s.path, undefined, 404);
  await cpqHttp(
    outsider,
    `operations/${s.operations[0].command.operation_id}`,
    undefined,
    404,
  );
  const changed = {
    ...s.operations[0].command,
    ...crmBase(),
    expected_version: 5,
  };
  await cpqHttp(s.reviewerCookie, "cpq/packages", changed, 404);
});
