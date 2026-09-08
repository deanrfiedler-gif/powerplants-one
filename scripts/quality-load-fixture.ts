import assert from "node:assert/strict";
import { localConfig } from "../src/platform/config";
import { transaction } from "../src/platform/database";

// Additive measurement fixture only. It is never part of the maintained seed,
// never grants authority and never manufactures issued/accepted business work.
export async function qualityLoadFixture() {
  assert.equal(localConfig().database_name, "ppo_synthetic_test");
  assert.equal(process.env.PPO_BENCHMARK_FIXTURE, "add-synthetic-load");
  const workspace = "10000000-0000-4000-8000-000000000001";
  const company = "20000000-0000-4000-8000-000000000001";
  const actor = "30000000-0000-4000-8000-000000000001";
  const site = "70000000-0000-4000-8000-000000000001";
  const customer = "50000000-0000-4000-8000-000000000001";
  const policy = "94000000-0000-4000-8000-000000000001";
  return transaction(async (c) => {
    const counts = async () =>
      (
        await c.query(
          `SELECT
      (SELECT count(*)::int FROM ppo.organisations WHERE workspace_id=$1) customers,
      (SELECT count(*)::int FROM ppo.assets WHERE workspace_id=$1) assets,
      (SELECT count(*)::int FROM ppo.appointments WHERE workspace_id=$1) appointments`,
          [workspace],
        )
      ).rows[0];
    const before = await counts();
    assert.ok(
      before.customers < 1000 &&
        before.assets < 5000 &&
        before.appointments < 10000,
      "Start from the retained disposable baseline; never reset or overwrite to fit the fixture.",
    );
    const newId = (prefix: string, n: number) =>
      `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;
    for (let n = 1; n <= 1000 - before.customers; n++)
      await c.query(
        "INSERT INTO ppo.organisations(id,workspace_id,company_id,created_by,updated_by,owner_id,display_name,relationship_status) VALUES($1,$2,$3,$4,$4,$4,$5,'Active')",
        [
          newId("e1110000", n),
          workspace,
          company,
          actor,
          `SYN PT-27 customer ${n}`,
        ],
      );
    for (let n = 1; n <= 5000 - before.assets; n++) {
      await c.query(
        "INSERT INTO ppo.assets(id,workspace_id,company_id,site_id,created_by,updated_by,description,identity_status,lifecycle_status) VALUES($1,$2,$3,$4,$5,$5,$6,'Unresolved','Active')",
        [
          newId("e1120000", n),
          workspace,
          company,
          site,
          actor,
          `SYN PT-27 unresolved asset ${n}`,
        ],
      );
      await c.query(
        "INSERT INTO ppo.asset_location_events(id,workspace_id,company_id,created_by,updated_by,asset_id,to_site_id,effective_at,reason) VALUES($1,$2,$3,$4,$4,$5,$6,'2026-09-05T00:00:00Z','SYN PT-27 initial fictional location; no physical relocation inferred')",
        [
          newId("e1160000", n),
          workspace,
          company,
          actor,
          newId("e1120000", n),
          site,
        ],
      );
    }
    for (let n = 1; n <= 1000; n++) {
      const wo = newId("e1130000", n),
        scope = newId("e1140000", n);
      await c.query(
        "INSERT INTO ppo.work_orders(id,workspace_id,company_id,site_id,created_by,updated_by,customer_id,service_owner_id,scope_revision_id) VALUES($1,$2,$3,$4,$5,$5,$6,$5,$7)",
        [wo, workspace, company, site, actor, customer, scope],
      );
      await c.query(
        "INSERT INTO ppo.work_order_tickets(workspace_id,company_id,site_id,work_order_id,ticket_id,issue_disposition) VALUES($1,$2,$3,$4,'40000000-0000-4000-8000-000000000020','SYN PT-27 additive load fixture; no work authority')",
        [workspace, company, site, wo],
      );
      await c.query(
        "INSERT INTO ppo.scope_revisions(id,workspace_id,company_id,site_id,created_by,updated_by,work_order_id,revision,policy_version_id,summary,exclusions) VALUES($1,$2,$3,$4,$5,$5,$6,1,$7,$8,'SYN benchmark draft only; no physical work or billing authorised')",
        [
          scope,
          workspace,
          company,
          site,
          actor,
          wo,
          policy,
          `SYN PT-27 scope ${n}. ` +
            "Unresolved identification remains explicitly owned. ".repeat(5),
        ],
      );
    }
    for (let n = 1; n <= 10000 - before.appointments; n++) {
      const work = 1 + ((n - 1) % 1000);
      // One loaded, bounded planner week with 100 extra proposals. Remaining
      // history is spread over later weeks; the 200-record guard stays intact.
      const instant =
        n <= 100
          ? Date.parse("2026-09-21T00:00:00Z") + ((n - 1) % 5) * 86400000
          : Date.parse("2028-01-03T00:00:00Z") +
            Math.floor((n - 101) / 100) * 604800000;
      await c.query(
        "INSERT INTO ppo.appointments(id,workspace_id,company_id,site_id,created_by,updated_by,work_order_id,start_at,end_at,site_timezone,customer_commitment,preparation_status,scope_revision_id,scope_version,policy_version_id) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,'Australia/Brisbane','Unknown','Unknown',$9,1,$10)",
        [
          newId("e1150000", n),
          workspace,
          company,
          site,
          actor,
          newId("e1130000", work),
          new Date(instant),
          new Date(instant + 3600000),
          newId("e1140000", work),
          policy,
        ],
      );
    }
    const after = await counts();
    assert.deepEqual(after, {
      customers: 1000,
      assets: 5000,
      appointments: 10000,
    });
    return {
      workspace,
      before,
      after,
      added_work_orders: 1000,
      added_planner_week_proposals: 100,
      selected_work_order: newId("e1130000", 1),
      distribution:
        "Current workspace totals. Customers means organisation records in the Customers view; 1000 added draft work orders share the fictional site/customer and have at most ten proposed visits each. Added assets remain Unresolved; proposals have no crew, acceptance or Finance outcomes. Existing issued/accepted fixtures, grants and constraints remain unchanged.",
    };
  });
}
