import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { database } from "../../src/platform/database";
import type { Principal } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { addAffiliation, createOrganisation, createPerson, createSite, createFacility, createAsset } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { createProject, saveTask } from "../../src/projects/service";
import { startThread } from "../../src/conversations/commands";
import { crmBase, crmDiscovery, CRM } from "./crm";
import { projectInput, taskInput } from "./projects";
import { planNodes, type PlanNode } from "./estimate-review-candidate-plan";
import type { listOpportunities } from "../../src/crm/worklist";

// Native fixture and capture method retained from the #877 audit at c1dcdf8ba.
// No ANALYZE or planner setting is applied by this helper.
export const dealTables = ["organisations", "sites", "people", "facilities", "assets",
  "opportunities", "opportunity_events", "activities", "activity_links"];
async function statistics(tables?: string[]) {
  return (
    await database().query(
      `SELECT relname,n_live_tup,n_mod_since_analyze,last_analyze,last_autoanalyze,analyze_count,autoanalyze_count
     FROM pg_stat_user_tables WHERE schemaname='ppo' AND ($1::text[] IS NULL OR relname=ANY($1)) ORDER BY relname`,
      [tables ?? null],
    )
  ).rows;
}
// Parallel to #870's six-table helper, with an explicit per-reader table set.
export async function assertNeverAnalysed(tables: string[] = dealTables) {
  const rows = await statistics(tables);
  assert.equal(rows.length, tables.length);
  for (const r of rows) {
    assert.equal(r.last_analyze, null, r.relname);
    assert.equal(r.last_autoanalyze, null, r.relname);
    assert.equal(Number(r.analyze_count), 0, r.relname);
    assert.equal(Number(r.autoanalyze_count), 0, r.relname);
  }
  return rows;
}
async function counts(tables: string[]) {
  const result: Record<string, number> = {};
  for (const table of tables) {
    assert.match(table, /^[a-z_]+$/);
    result[table] = (
      await database().query(`SELECT count(*)::int AS n FROM ppo.${table}`)
    ).rows[0].n;
  }
  return result;
}

export async function auditDealFixture(p: Principal, size: number) {
  const created: Record<string, string[]> = {
    organisations: [],
    people: [],
    sites: [],
    facilities: [],
    assets: [],
    opportunities: [],
    projects: [],
    project_tasks: [],
    conversation_threads: [],
  };
  const due = new Date(Date.now() - 86400000).toISOString();
  for (let i = 0; i < size; i++) {
    const org = randomUUID(),
      person = randomUUID(),
      site = randomUUID(),
      facility = randomUUID(),
      asset = randomUUID();
    await createOrganisation(p, {
      ...crmBase(),
      id: org,
      company_id: CRM.company,
      display_name: `SYN Plan organisation ${i}`,
      relationship_status: "Active",
      owner_id: p.actor_id,
      access_class: "Internal",
    });
    await createPerson(p, {
      ...crmBase(),
      id: person,
      company_ids: [CRM.company],
      display_name: `SYN Plan person ${i}`,
      email: `person${i}@plan.example`,
      phone: "0491 570 006",
    });
    await addAffiliation(p, org, {
      ...crmBase(),
      id: randomUUID(),
      expected_version: 1,
      person_id: person,
      role_label: "Synthetic contact",
      valid_from: "2026-01-01",
      valid_to: null,
    });
    await createSite(p, {
      ...crmBase(),
      id: site,
      company_id: CRM.company,
      display_name: `SYN Plan site ${i}`,
      location_description: "Synthetic audit location",
      timezone: "Australia/Brisbane",
      owner_id: p.actor_id,
      primary_contact_id: person,
      parties: [
        {
          organisation_id: org,
          role: "Operator",
          valid_from: "2026-01-01T00:00:00Z",
          valid_to: null,
        },
      ],
    });
    await createFacility(p, {
      ...crmBase(),
      id: facility,
      company_id: CRM.company,
      site_id: site,
      name: `SYN Plan facility ${i}`,
    });
    await createAsset(p, {
      ...crmBase(),
      id: asset,
      company_id: CRM.company,
      site_id: site,
      facility_id: facility,
      description: `SYN Plan equipment ${i}`,
      identity_status: "Unresolved",
      serial: null,
      effective_at: "2026-01-01T00:00:00Z",
      configuration: "Synthetic audit configuration",
    });
    const deal = crmDiscovery();
    await createOpportunity(p, {
      ...deal,
      organisation_id: org,
      site_id: site,
      primary_person_id: person,
      initial_action: {
        ...deal.initial_action,
        due_at: due,
        due_needed: false,
      },
    });
    const project = projectInput(),
      task = taskInput();
    await createProject(p, { ...project, organisation_id: org, site_id: site });
    await saveTask(p, project.id, task);
    const thread = await startThread(p, {
      ...crmBase(),
      anchor_type: "Opportunity",
      anchor_id: deal.id,
      title: `SYN Plan thread ${i}`,
      body: "Synthetic audit message.",
    });
    for (const [table, id] of Object.entries({
      organisations: org,
      people: person,
      sites: site,
      facilities: facility,
      assets: asset,
      opportunities: deal.id,
      projects: project.id,
      project_tasks: task.id,
      conversation_threads: thread.receipt.record_id,
    }))
      created[table].push(id);
  }
  for (const ids of Object.values(created))
    assert.equal(new Set(ids).size, size);
  const actual = await counts(Object.keys(created));
  for (const n of Object.values(actual))
    assert.ok(n >= size && n <= size + 10, `Small primary population: ${n}`);
  return { created, counts: actual };
}

type Measurement = {
  rows: unknown[];
  sql: string;
  values: unknown[];
  sql_sha256: string;
  jit_setting: string;
  plan: PlanNode;
  execution_ms: number;
  planning_ms: number;
  max_loops: number;
  max_nodes: unknown[];
  shared_hit_blocks: number;
  has_jit: boolean;
  statement_rows: number;
  visible_rows: number;
};
export async function measureDeals(reader: typeof listOpportunities, p: Principal, input: Record<string, unknown>, valuesOverride?: unknown[]) {
  const original = pg.Client.prototype.query;
  let captured: Measurement | undefined;
  // The pool uses callbacks; transactions use promises. Preserve both calling forms.
  pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
    const sql = args[0];
    if (typeof sql !== "string" || !(sql.includes("WITH permitted AS MATERIALIZED") && sql.includes("opportunity_events")))
      return Reflect.apply(original, this, args);
    assert.equal(captured, undefined, "Exactly one main statement must match");
    const values =
      valuesOverride ?? ((Array.isArray(args[1]) ? args[1] : []) as unknown[]);
    const callback = args.at(-1);
    const call = (text: string, binds: unknown[] = []) =>
      new Promise<pg.QueryResult>((resolve, reject) => {
        Reflect.apply(original, this, [
          text,
          binds,
          (error: Error | null, result: pg.QueryResult) =>
            error ? reject(error) : resolve(result),
        ]);
      });
    const work = (async () => {
      const jit = (await call("SHOW jit")).rows[0].jit as string;
      const result = await call(sql, values);
      const explained = (
        await call(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, values)
      ).rows[0]["QUERY PLAN"][0];
      const nodes = planNodes(explained.Plan);
      const max = Math.max(...nodes.map((n) => n["Actual Loops"]));
      const first = result.rows[0];
      const visible =
        typeof first?.total === "number"
          ? first.total
          : typeof first?.counts?.total === "number"
            ? first.counts.total
            : Array.isArray(first?.items)
              ? first.items.length
              : result.rows.length;
      assert.ok(visible > 0, "Non-empty visible population");
      captured = {
        rows: result.rows,
        sql,
        values,
        sql_sha256: createHash("sha256").update(sql).digest("hex"),
        jit_setting: jit,
        plan: explained.Plan,
        execution_ms: explained["Execution Time"],
        planning_ms: explained["Planning Time"],
        max_loops: max,
        max_nodes: nodes
          .filter((n) => n["Actual Loops"] === max)
          .map((n) => ({ ...n, Plans: undefined })),
        shared_hit_blocks: explained.Plan["Shared Hit Blocks"],
        has_jit: "JIT" in explained,
        statement_rows: result.rows.length,
        visible_rows: visible,
      };
      return result;
    })();
    if (typeof callback === "function") {
      void work.then(
        (r) => callback(null, r),
        (e) => callback(e),
      );
      return;
    }
    return work;
  } as typeof original;
  try {
    const result = await withWorkingCompany(p.actor_id, CRM.company, () =>
      reader(p, input),
    );
    assert.ok(captured, "Main Deals statement captured");
    return { ...captured, reader_result: result };
  } finally {
    pg.Client.prototype.query = original;
  }
}

