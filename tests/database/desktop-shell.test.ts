import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { shellContext, shellSearch } from "../../src/shell/reads";
import { crmCreate } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset); after(closeDatabase);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;

test("shell search and quick add preserve tenant, company and current-grant boundaries", async () => {
  const p = await principal(), input = crmCreate();
  input.title = `SYN Shell scope ${input.id}`;
  await createOpportunity(p, input);
  const results = await shellSearch(p, { q: input.id });
  assert.equal(results.items.length, 1);
  assert.equal(results.items[0].href, `/crm/opportunities/${input.id}`);
  assert.equal(results.items[0].label, input.title);
  for (const profile of ["second-company", "other-workspace", "systems"]) {
    const hidden = await shellSearch(await principal(profile), { q: input.id });
    assert.deepEqual(hidden.items, [], `${profile} must not discover another scope's record`);
  }
  assert.ok((await shellContext(p, {})).actions.some(action => action.id === "opportunity"));
  await database().query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='crm.opportunity.read'", [p.workspace_id, p.actor_id]);
  assert.deepEqual((await shellSearch(p, { q: input.id })).items, []);
  assert.ok(!(await shellContext(p, {})).actions.some(action => action.id === "opportunity"));
});
