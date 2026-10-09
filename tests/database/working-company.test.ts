import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { hasPermission, scopeSql } from "../../src/platform/permissions";
import { chooseWorkingCompany, workingCompanies } from "../../src/shell/company";
import { loadWorkingCompany, withWorkingCompany } from "../../src/platform/working-company";
import { shellContext } from "../../src/shell/reads";
import { reset, migrate, seed } from "../../scripts/database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(async () => {
  await reset();
  await migrate();
  await seed();
});
after(closeDatabase);
const companyA = "20000000-0000-4000-8000-000000000001",
  companyB = "20000000-0000-4000-8000-000000000002",
  otherWorkspaceCompany = "20000000-0000-4000-8000-000000000003";
const principal = async (profile: string) => (await createSession(profile)).principal;
// The visible tickets per company through the shared scope check, as any reader would see them.
async function visibleTickets(p: Awaited<ReturnType<typeof principal>>) {
  const rows = (
    await database().query<{ company_id: string; n: number }>(
      `SELECT t.company_id,count(*)::int AS n FROM ppo.tickets t WHERE t.workspace_id=$1 AND ${scopeSql("t.company_id", "NULL::uuid", "shared.read")} GROUP BY t.company_id ORDER BY t.company_id`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  return Object.fromEntries(rows.map((r) => [r.company_id, r.n]));
}

test("NR-18 a workspace-wide reader can work in one company; every scoped check narrows and nothing widens", async () => {
  const p = await principal("workspace-observer");
  const choices = await workingCompanies(p);
  assert.deepEqual(choices.companies.map((c) => c.id).sort(), [companyA, companyB]);
  assert.ok(choices.companies.every((c) => /^SYN-[AB] · /.test(c.name)));
  assert.equal(choices.working_company_id, null);
  const all = await visibleTickets(p);
  assert.ok(all[companyA] > 0 && all[companyB] > 0, JSON.stringify(all));

  assert.equal((await chooseWorkingCompany(p, { company_id: companyB })).working_company_id, companyB);
  assert.equal((await shellContext(p, {})).working_company_id, companyB);
  const chosen = await loadWorkingCompany(database(), p);
  assert.equal(chosen, companyB);
  // Without a request context nothing narrows: jobs, seeds and upgrades keep their behaviour.
  assert.deepEqual(await visibleTickets(p), all);
  await withWorkingCompany(p.actor_id, chosen, async () => {
    assert.deepEqual(await visibleTickets(p), { [companyB]: all[companyB] });
    assert.equal(await hasPermission(database(), p, "shared.read", companyA), false);
    assert.equal(await hasPermission(database(), p, "shared.read", companyB), true);
    // A capability check without a record company is unchanged, so navigation stays the same.
    assert.equal(await hasPermission(database(), p, "shared.read"), true);
    // Another person's checks in the same context are untouched.
    const coordinator = await principal("coordinator");
    assert.equal(await hasPermission(database(), coordinator, "service.ticket.read", companyA), true);
  });

  assert.equal((await chooseWorkingCompany(p, { company_id: null })).working_company_id, null);
  assert.equal(await loadWorkingCompany(database(), p), null);
});

test("NR-18 only a reachable company can be chosen, and a choice the grants no longer reach lapses", async () => {
  const p = await principal("workspace-observer");
  await assert.rejects(chooseWorkingCompany(p, { company_id: otherWorkspaceCompany }), (e: { status?: number }) => e.status === 422);
  await assert.rejects(chooseWorkingCompany(p, {}), (e: { status?: number }) => e.status === 422);
  await assert.rejects(chooseWorkingCompany(p, { company_id: companyA, extra: true }), (e: { status?: number }) => e.status === 422);

  const reader = await principal("second-company");
  const reachable = (await workingCompanies(reader)).companies.map((c) => c.id);
  const unreachable = [companyA, companyB].find((id) => !reachable.includes(id));
  assert.ok(unreachable, "second-company reaches only one company");
  await assert.rejects(chooseWorkingCompany(reader, { company_id: unreachable }), (e: { status?: number }) => e.status === 422);
  await database().query(
    "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
    [reader.workspace_id, reader.actor_id, unreachable],
  );
  assert.equal(await loadWorkingCompany(database(), reader), null);
  assert.equal((await workingCompanies(reader)).working_company_id, null);
  assert.equal(
    (await database().query("SELECT 1 FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2", [reader.workspace_id, reader.actor_id])).rowCount,
    0,
  );
});
