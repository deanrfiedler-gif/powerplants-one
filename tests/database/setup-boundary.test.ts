import assert from "node:assert/strict";
import { after, test } from "node:test";
import { reset, seed } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);

test("synthetic reset and seed leave the reused application connection at its ten-second deadline", async () => {
  const timeout = async () =>
    (await database().query("SHOW statement_timeout")).rows[0].statement_timeout;
  assert.equal(await timeout(), "10s");
  await reset();
  assert.equal(await timeout(), "10s");
  await seed();
  assert.equal(await timeout(), "10s");
  // This isolated test uses one pool connection, so the checks cover reuse of
  // the setup connection, not a different connection with untouched defaults.
  assert.equal(database().totalCount, 1);
});
