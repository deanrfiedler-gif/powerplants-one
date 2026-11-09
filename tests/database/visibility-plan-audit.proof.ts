// Manual, disposable proof only. Not matched by tests/database/*.test.ts.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { createSession, type Principal } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  addAffiliation,
  createOrganisation,
  createPerson,
  createSite,
  createFacility,
  createAsset,
} from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { createProject, saveTask } from "../../src/projects/service";
import { startThread } from "../../src/conversations/commands";
import { organisationRegister } from "../../src/shared/organisation-register";
import { sitesRegister } from "../../src/shared/sites";
import { peopleRegister } from "../../src/shared/people-register";
import { registerFacilities } from "../../src/shared/facilities/reads";
import { equipmentRegister } from "../../src/equipment/reads";
import { readWorkOverview } from "../../src/activities/work-overview";
import { initialWorklistFilters } from "../../src/crm/worklist-location";
import { listOpportunities } from "../../src/crm/worklist";
import { projectRegister } from "../../src/projects/register";
import { listThreads } from "../../src/conversations/reads";
import { readEstimatingWorkload } from "../../src/estimating/workload";
import { crmBase, crmDiscovery, CRM } from "../helpers/crm";
import { projectInput, taskInput } from "../helpers/projects";
import {
  planNodes,
  type PlanNode,
} from "../helpers/estimate-review-candidate-plan";

const output = "tmp/visibility-plan-audit";
const size = 30;
const dealInput = Object.fromEntries(
  Object.entries(initialWorklistFilters).filter(([, value]) => value !== ""),
);
type Reader = {
  name: string;
  run: (p: Principal) => Promise<unknown>;
  match: (sql: string) => boolean;
  tables: string[];
};
const shared = ["organisations", "sites", "people", "facilities", "assets"];
const readers: Reader[] = [
  {
    name: "organisations",
    run: (p) => organisationRegister(p),
    match: (s) =>
      s.includes("WITH permitted AS MATERIALIZED") &&
      s.includes("name_candidates AS MATERIALIZED"),
    tables: [
      ...shared,
      "site_parties",
      "opportunities",
      "activities",
      "activity_links",
    ],
  },
  {
    name: "sites",
    run: (p) => sitesRegister(p),
    match: (s) =>
      s.includes("WITH permitted AS MATERIALIZED") &&
      s.includes("visits AS MATERIALIZED"),
    tables: [...shared, "site_parties", "appointments", "work_orders"],
  },
  {
    name: "my-work",
    run: (p) => readWorkOverview(p),
    match: (s) => s.includes("FROM ppo.activities a") && s.includes("LIMIT $9"),
    tables: [
      ...shared,
      "activities",
      "activity_links",
      "opportunities",
      "projects",
      "lead_candidates",
      "tickets",
    ],
  },
  {
    name: "deals",
    run: (p) => listOpportunities(p, dealInput),
    match: (s) =>
      s.includes("WITH permitted AS MATERIALIZED") &&
      s.includes("opportunity_events"),
    tables: [
      ...shared,
      "opportunities",
      "opportunity_events",
      "activities",
      "activity_links",
    ],
  },
  {
    name: "projects",
    run: (p) => projectRegister(p),
    match: (s) =>
      s.includes("WITH authorised AS MATERIALIZED") &&
      s.includes("milestone_overdue"),
    tables: [...shared, "projects", "project_tasks"],
  },
  {
    name: "facilities",
    run: (p) => registerFacilities(p, { sort: "site", area_view: "all" }),
    match: (s) => s.includes("FROM ppo.facilities f") && /LIMIT \$\d+/.test(s),
    tables: [...shared, "site_parties"],
  },
  {
    name: "equipment",
    run: (p) => equipmentRegister(p),
    match: (s) =>
      s.includes("AS permitted_total") && s.includes("LIMIT 30 OFFSET"),
    tables: [
      ...shared,
      "site_parties",
      "asset_served_facilities",
      "asset_location_events",
    ],
  },
  {
    name: "people",
    run: (p) => peopleRegister(p),
    match: (s) =>
      s.includes("WITH permitted AS MATERIALIZED") &&
      s.includes("person_company_contexts"),
    tables: [
      ...shared,
      "person_company_contexts",
      "relationships",
      "contact_notice_preferences",
    ],
  },
  {
    name: "conversations",
    run: (p) => listThreads(p),
    match: (s) =>
      s.includes("FROM ppo.conversation_threads t") && s.includes("LIMIT $6"),
    tables: [
      "conversation_threads",
      "conversation_messages",
      "conversation_participants",
      "conversation_asks",
      "conversation_mentions",
      "opportunities",
      "projects",
      ...shared,
    ],
  },
  {
    name: "estimating-workload",
    run: (p) => readEstimatingWorkload(p),
    match: (s) => s.includes("all_window AS") && s.includes("mine_window AS"),
    tables: ["opportunities", "organisations", "estimating_workspaces"],
  },
];

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
async function assertNeverAnalysed(tables: string[]) {
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

async function fixture(p: Principal) {
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
    assert.ok(n >= size && n <= 50, `Small primary population: ${n}`);
  return { created, counts: actual };
}

type Measurement = {
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
async function measure(reader: Reader, p: Principal, prior?: Measurement) {
  const original = pg.Client.prototype.query;
  let captured: Measurement | undefined;
  // The pool uses callbacks; transactions use promises. Preserve both calling forms.
  pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
    const sql = args[0];
    if (typeof sql !== "string" || !reader.match(sql))
      return Reflect.apply(original, this, args);
    assert.equal(captured, undefined, "Exactly one main statement must match");
    const values =
      prior?.values ?? ((Array.isArray(args[1]) ? args[1] : []) as unknown[]);
    if (prior) assert.equal(sql, prior.sql);
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
      reader.run(p),
    );
    assert.ok(captured, `Main statement captured: ${reader.name}`);
    return { ...captured, reader_result: result };
  } finally {
    pg.Client.prototype.query = original;
  }
}

assert.equal(localConfig().database_name, "ppo_synthetic_test");
assert.ok(
  process.argv.includes("--analyse-control"),
  "Manual destructive proof: pass --analyse-control",
);
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
mkdirSync(output, { recursive: true });
const selected = process.argv.find((a) => a.startsWith("--reader="))?.slice(9);
assert.ok(!selected || readers.some((r) => r.name === selected));
try {
  for (const reader of readers.filter(
    (r) => !selected || r.name === selected,
  )) {
    console.log(`Preparing ${reader.name}`);
    await reset();
    const p = (await createSession("coordinator")).principal;
    const native = await fixture(p);
    const tableCounts = await counts(reader.tables);
    const beforeStatistics = await assertNeverAnalysed(reader.tables);
    const without = await measure(reader, p);
    const afterStatistics = await assertNeverAnalysed(reader.tables);
    const dependencies = await statistics();
    // This file is a manual proof only, never a CI test or setup path.
    await database().query("ANALYZE");
    const controlStatistics = await statistics(reader.tables);
    for (const stat of controlStatistics)
      assert.ok(Number(stat.analyze_count) > 0, stat.relname);
    const control = await measure(reader, p, without);
    assert.deepEqual(control.values, without.values);
    assert.equal(control.jit_setting, without.jit_setting);
    assert.equal(without.sql, control.sql);
    assert.equal(without.visible_rows, control.visible_rows);
    const bound = 10 * without.visible_rows;
    const summary = {
      reader: reader.name,
      profile: "coordinator",
      company: CRM.company,
      input:
        reader.name === "facilities"
          ? { sort: "site", area_view: "all" }
          : reader.name === "deals"
            ? dealInput
            : {},
      fixture_size: size,
      tableCounts,
      beforeStatistics,
      afterStatistics,
      dependencies,
      controlStatistics,
      bound,
      classification: without.max_loops <= bound ? "BOUNDED" : "AT RISK",
      without,
      control,
      native,
    };
    writeFileSync(
      `${output}/${reader.name}.json`,
      JSON.stringify(summary, null, 2),
    );
    console.log(
      JSON.stringify({
        reader: reader.name,
        bound,
        classification: summary.classification,
        without: {
          loops: without.max_loops,
          hits: without.shared_hit_blocks,
          ms: without.execution_ms,
          jit: without.has_jit,
          visible: without.visible_rows,
        },
        control: {
          loops: control.max_loops,
          hits: control.shared_hit_blocks,
          ms: control.execution_ms,
          jit: control.has_jit,
        },
      }),
    );
  }
} finally {
  await closeDatabase();
}
