import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { withWorkingCompany } from "../../src/platform/working-company";
import { readTemplateScopes } from "../../src/documents/workspace-reads";
import { principal, grantDraft, id } from "../helpers/template-drafts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("DK06 proposable scopes filter duties before paging and bind purpose, family and company", async () => {
  const p = await principal("systems");
  await grantDraft(p, ["template.read", "shared.read", "pack.read"]);
  const site = (n: number) =>
    `fe000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  // Three sites exercise native continuation at limit 1; the browser regression covers 51 choices.
  // This is fixture setup, not an application operation. Keep ordinary
  // read/command timeouts unchanged after the transaction, as recoverSchema does.
  await transaction(async (c) => {
    await c.query("SET LOCAL statement_timeout = '120s'");
    await c.query(
      `INSERT INTO ppo.sites
      (id,workspace_id,company_id,created_by,updated_by,owner_id,display_name,location_description,timezone)
      SELECT ('fe000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
        $1,$2,$3,$3,$3,'SYN paging site ' || n,'SYN paging fixture','Australia/Brisbane'
      FROM generate_series(1,3) AS n`,
      [p.workspace_id, id("20"), p.actor_id],
    );
  });
  const visible = await readTemplateScopes(p, { family: "OUT-09", limit: "1" });
  assert.equal(visible.items.length, 1);
  assert.ok(visible.next_cursor);
  assert.ok(visible.items.every((s) => !s.can_propose));
  assert.ok(!visible.items.some((s) => s.id === site(3)));
  assert.deepEqual(
    (await readTemplateScopes(p, { family: "OUT-09", purpose: "Propose" }))
      .items,
    [],
  );
  for (const n of [2, 3])
    await database().query(
      `INSERT INTO ppo.permission_grants
      (workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
      VALUES ($1,$2,$3,'template.propose','Site',$4,$4)`,
      [p.workspace_id, p.actor_id, id("20"), site(n)],
    );
  const query = { family: "OUT-09", purpose: "Propose", limit: "1" };
  const first = await readTemplateScopes(p, query);
  assert.deepEqual(
    first.items.map((s) => s.id),
    [site(2)],
  );
  assert.equal(first.items[0].can_propose, true);
  assert.ok(first.next_cursor);
  const next = await readTemplateScopes(p, {
    ...query,
    cursor: first.next_cursor,
  });
  assert.deepEqual(
    next.items.map((s) => s.id),
    [site(3)],
  );
  assert.equal(next.next_cursor, null);
  for (const changed of [{ purpose: "Read" }, { family: "OUT-10" }])
    await assert.rejects(
      readTemplateScopes(p, {
        ...query,
        ...changed,
        cursor: first.next_cursor,
      }),
      { code: "InvalidData" },
    );
  await assert.rejects(
    readTemplateScopes(p, { family: "OUT-09", purpose: "Publish" }),
    { code: "InvalidData" },
  );
  assert.deepEqual(
    (await readTemplateScopes(p, { family: "OUT-14", purpose: "Propose" }))
      .items,
    [],
  );
  await withWorkingCompany(p.actor_id, id("20", 2), async () => {
    assert.deepEqual((await readTemplateScopes(p, query)).items, []);
    await assert.rejects(
      readTemplateScopes(p, { ...query, cursor: first.next_cursor! }),
      { code: "InvalidData" },
    );
  });
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='template.propose'",
    [p.workspace_id, p.actor_id],
  );
  const revoked = await readTemplateScopes(p, {
    ...query,
    cursor: first.next_cursor,
  });
  assert.deepEqual(revoked.items, []);
  assert.equal(revoked.next_cursor, null);
});
