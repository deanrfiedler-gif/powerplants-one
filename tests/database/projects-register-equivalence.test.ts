import assert from "node:assert/strict";
import { after, before, test, type TestContext } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { createOrganisation, createSite } from "../../src/shared/commands";
import { createProject, saveTask } from "../../src/projects/service";
import { projectRegister } from "../../src/projects/register";
import {
  projectViews,
  projectSorts,
  type ProjectView,
  type ProjectSort,
} from "../../src/projects/register-model";
import { projectRegister as original } from "../helpers/projects-register-main";
import { captureRegister } from "../helpers/projects-register-plan";
import { act } from "../helpers/acceptance";
import { CRM, crmBase } from "../helpers/crm";
import { projectInput, taskInput } from "../helpers/projects";
import { AppError } from "../../src/platform/errors";
assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
const id = (n: number) =>
  `f1000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const taskId = (n: number) =>
  `e1000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const sam = "30000000-0000-4000-8000-000000000017";
let coordinator: Principal, other: Principal, samPrincipal: Principal;
type Expected = {
  id: string;
  company_id: string;
  coordinator_id: string;
  organisation_id: string;
  site_id: string;
  title: string;
  target_date: string | null;
  milestone_date: string | null;
  milestone_id: string | null;
  milestone_title: string | null;
  milestone_overdue: boolean;
  at_risk: number;
  lifecycle: string;
  customer_name: string;
  site_name: string;
  coordinator_name: string;
  display_number: string;
};
const expected: Expected[] = [];
let org1: string, org2: string, site2: string;
const riskTask = {
  ...taskInput(),
  id: taskId(1),
  title: "SYN ordinary risk",
  status: "AtRisk",
};
before(async () => {
  await reset();
  coordinator = (await createSession("coordinator")).principal;
  other = (await createSession("second-company")).principal;
  samPrincipal = (await createSession("materials-engineer")).principal;
  assert.equal(samPrincipal.actor_id, sam);
  const parents = [];
  for (const [p, company, name] of [
    [coordinator, CRM.company, "Alpha"],
    [coordinator, CRM.company, "Beta"],
    [other, CRM.companyB, "Other"],
  ] as const) {
    const org = randomUUID(),
      site = randomUUID();
    await createOrganisation(p, {
      ...crmBase(),
      id: org,
      company_id: company,
      display_name: `SYN ${name} customer`,
      relationship_status: "Active",
      owner_id: p.actor_id,
      access_class: "Internal",
    });
    await createSite(p, {
      ...crmBase(),
      id: site,
      company_id: company,
      display_name: `SYN ${name} site`,
      location_description: "SYN legal optional-parent fixture",
      timezone: "Australia/Brisbane",
      owner_id: p.actor_id,
      primary_contact_id: null,
      parties: [
        {
          organisation_id: org,
          role: "Operator",
          valid_from: "2026-01-01T00:00:00Z",
          valid_to: null,
        },
      ],
    });
    parents.push({ org, site, name });
  }
  org1 = parents[0].org;
  ({ org: org2, site: site2 } = parents[1]);
  for (let n = 1; n <= 6; n++) {
    const parent = parents[n === 6 ? 2 : [3, 5].includes(n) ? 1 : 0],
      p = n === 6 ? other : coordinator;
    const target =
      n === 3
        ? null
        : n === 4
          ? "2031-01-01"
          : n === 5
            ? "2029-01-01"
            : "2030-01-01";
    // Seeded Company A has one project.edit coordinator. Do not invent grants.
    const owner = n === 6 ? other.actor_id : coordinator.actor_id;
    const title = `SYN Register ${n === 2 ? "alpha" : n === 1 ? "Alpha" : n}`;
    await createProject(p, {
      ...projectInput(),
      id: id(n),
      company_id: n === 6 ? CRM.companyB : CRM.company,
      organisation_id: parent.org,
      site_id: parent.site,
      coordinator_id: owner,
      title,
      target_date: target,
    });
    expected.push({
      id: id(n),
      company_id: n === 6 ? CRM.companyB : CRM.company,
      coordinator_id: owner,
      organisation_id: parent.org,
      site_id: parent.site,
      title,
      target_date: target,
      milestone_date: null,
      milestone_id: null,
      milestone_title: null,
      milestone_overdue: false,
      at_risk: 0,
      lifecycle: n === 4 ? "Closed" : "Active",
      customer_name: `SYN ${parent.name} customer`,
      site_name: `SYN ${parent.name} site`,
      coordinator_name:
        n === 6 ? "SYN Company B coordinator" : "SYN Coordinator",
      display_number: "",
    });
  }
  await saveTask(coordinator, id(1), riskTask);
  for (const [version, tid, title, date, status] of [
    [2, 2, "SYN completed earlier", "2000-01-03", "Complete"],
    [3, 3, "SYN first tied milestone", "2001-01-01", "Planned"],
    [4, 4, "SYN second tied milestone", "2001-01-01", "Planned"],
    [5, 5, "SYN undated risk marker", null, "AtRisk"],
  ] as const)
    await saveTask(coordinator, id(1), {
      ...taskInput(version),
      id: taskId(tid),
      title,
      milestone: true,
      start_date: date,
      finish_date: date,
      status,
      progress: status === "Complete" ? 100 : 0,
    });
  await saveTask(coordinator, id(3), {
    ...taskInput(),
    id: taskId(6),
    title: "SYN undated milestone",
    milestone: true,
    start_date: null,
    finish_date: null,
    status: "Planned",
    progress: 0,
  });
  await saveTask(coordinator, id(4), {
    ...taskInput(),
    id: taskId(7),
    status: "AtRisk",
  });
  await saveTask(coordinator, id(4), {
    ...taskInput(2),
    id: taskId(8),
    title: "SYN closed overdue milestone",
    milestone: true,
    start_date: "2001-01-01",
    finish_date: "2001-01-01",
    status: "Planned",
    progress: 0,
  });
  await saveTask(coordinator, id(5), { ...taskInput(), id: taskId(9) });
  Object.assign(expected[0], {
    milestone_date: "2001-01-01",
    milestone_id: taskId(3),
    milestone_title: "SYN first tied milestone",
    milestone_overdue: true,
    at_risk: 1,
  });
  Object.assign(expected[2], {
    milestone_id: taskId(6),
    milestone_title: "SYN undated milestone",
  });
  Object.assign(expected[3], {
    milestone_date: "2001-01-01",
    milestone_id: taskId(8),
    milestone_title: "SYN closed overdue milestone",
    milestone_overdue: true,
    at_risk: 1,
  });
  // Native closeout of explicitly removed synthetic scope. No stages/documents or bypassed guards.
  await act("coordinator", id(4), null, "unit", {
    id: randomUUID(),
    reference: "SYN-REG-CLOSED-SCOPE",
    title: "SYN removed scope",
    system_name: "Synthetic system",
    function_name: "No remaining delivery",
    installed_at: "Synthetic site",
    configuration_version: "SYN-1",
    required: false,
    removal_reference: "SYN authorised scope cancellation",
    removal_reason: "Synthetic register fixture: scope withdrawn",
  });
  const source = randomUUID();
  await act("finance-reviewer", id(4), null, "source", {
    id: source,
    title: "SYN no commercial obligations",
    kind: "Commercial",
    outcome: "Not required",
    availability: "Current",
    details: { authority_reference: "SYN cancelled-scope applicability" },
    public_reference: "SYN-REG-COMMERCIAL",
    source_version: "1",
  });
  await act("finance-reviewer", id(4), null, "commercial", {
    source_id: source,
    outcome: "Not required",
    evidence: "SYN independent Finance disposition of cancelled scope",
  });
  await act("coordinator", id(4), null, "closeProject");
  for (const row of (
    await database().query(
      "SELECT id,display_number FROM ppo.projects WHERE id=ANY($1::uuid[])",
      [expected.map((x) => x.id)],
    )
  ).rows)
    expected.find((x) => x.id === row.id)!.display_number = row.display_number;
  assert.equal(expected.filter((x) => x.display_number).length, 6);
});
after(closeDatabase);
const matches = (row: Expected, view: ProjectView, actor: string) =>
  ({
    Active: row.lifecycle === "Active",
    Mine: row.lifecycle === "Active" && row.coordinator_id === actor,
    Closed: row.lifecycle === "Closed",
    All: true,
    Overdue: row.lifecycle === "Active" && row.milestone_overdue,
    AtRisk: row.lifecycle === "Active" && row.at_risk > 0,
    NoTarget: row.lifecycle === "Active" && row.target_date === null,
  })[view];
function ordered(rows: Expected[], sort: ProjectSort, direction: string) {
  const value = (r: Expected) =>
    ({
      target: r.target_date,
      title: r.title.toLowerCase(),
      milestone: r.milestone_date,
      risk: r.at_risk,
      customer: r.customer_name.toLowerCase(),
      coordinator: r.coordinator_name.toLowerCase(),
      status: r.lifecycle,
      reference: r.display_number,
    })[sort];
  return [...rows].sort((a, b) => {
    const x = value(a),
      y = value(b);
    return x === y
      ? a.id.localeCompare(b.id)
      : x === null
        ? 1
        : y === null
          ? -1
          : (x < y ? -1 : 1) * (direction === "asc" ? 1 : -1);
  });
}
async function prove(
  t: TestContext,
  input: Record<string, unknown> = {},
  p = coordinator,
  company = CRM.company,
) {
  const authorised = expected.filter((r) => r.company_id === company);
  const q = String(input.q ?? "").toLowerCase();
  const filtered = authorised.filter(
    (r) =>
      (!input.coordinator || r.coordinator_id === input.coordinator) &&
      (!input.customer || r.organisation_id === input.customer) &&
      [r.title, r.display_number, r.id, r.customer_name, r.site_name]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );
  const view = (input.view ?? "Active") as ProjectView,
    sort = (input.sort ?? "target") as ProjectSort;
  const rows = ordered(
    filtered.filter((r) => matches(r, view, p.actor_id)),
    sort,
    String(input.direction ?? "asc"),
  );
  const counts = Object.fromEntries(
    projectViews.map((v) => [
      v,
      filtered.filter((r) => matches(r, v, p.actor_id)).length,
    ]),
  );
  let cursor: string | null = null;
  const seen: string[] = [];
  const limit = Number(input.limit ?? 2);
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-11-10T00:00:00Z"),
  });
  try {
    do {
      const args: Record<string, unknown> = {
        ...input,
        limit,
        ...(cursor ? { cursor } : {}),
      };
      const a = await withWorkingCompany(p.actor_id, company, () =>
        captureRegister(original, p, args),
      );
      const b = await withWorkingCompany(p.actor_id, company, () =>
        captureRegister(projectRegister, p, args),
      );
      const wanted = rows.slice(seen.length, seen.length + limit);
      assert.deepEqual(
        b.data.items.map((x) => x.id),
        wanted.map((x) => x.id),
      );
      assert.deepEqual(b.data.counts, counts);
      assert.equal(b.data.total, rows.length);
      assert.equal(
        b.data.active_count,
        authorised.filter((r) => r.lifecycle === "Active").length,
      );
      assert.equal(b.data.completeness, "Page");
      assert.deepEqual(
        b.data.options.customers,
        [
          ...new Map(
            authorised.map((r) => [
              r.organisation_id,
              { id: r.organisation_id, name: r.customer_name },
            ]),
          ).values(),
        ].sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        ),
      );
      assert.deepEqual(
        b.data.options.coordinators,
        [
          ...new Map(
            authorised.map((r) => [
              r.coordinator_id,
              { id: r.coordinator_id, name: r.coordinator_name },
            ]),
          ).values(),
        ].sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        ),
      );
      for (const actual of b.data.items) {
        const e = wanted.find((r) => r.id === actual.id)!;
        assert.equal(actual.at_risk, e.at_risk);
        assert.equal(actual.milestone_overdue, e.milestone_overdue);
        assert.deepEqual(
          actual.next_milestone,
          e.milestone_id
            ? {
                id: e.milestone_id,
                title: e.milestone_title,
                finish_date: e.milestone_date,
              }
            : null,
        );
        assert.equal(actual.lifecycle, e.lifecycle);
        assert.equal(actual.can_edit, false);
        assert.equal(actual.coordinator_id, e.coordinator_id);
      }
      assert.deepEqual(b.raw, a.raw);
      assert.deepEqual(b.values, a.values);
      assert.deepEqual(b.data, a.data);
      assert.equal(JSON.stringify(b.data), JSON.stringify(a.data));
      seen.push(...b.data.items.map((r) => r.id));
      cursor = b.data.next_cursor;
      assert.equal(cursor !== null, seen.length < rows.length);
    } while (cursor);
    assert.deepEqual(
      seen,
      rows.map((r) => r.id),
    );
  } finally {
    t.mock.timers.reset();
  }
}
test("named Active/Closed/company populations retain exact counts and IDs", async () => {
  const active = await projectRegister(coordinator);
  assert.deepEqual(
    active.items.map((r) => r.id),
    [id(5), id(1), id(2), id(3)],
  );
  assert.deepEqual(active.counts, {
    Active: 4,
    Mine: 4,
    All: 5,
    Closed: 1,
    Overdue: 1,
    AtRisk: 1,
    NoTarget: 1,
  });
  assert.equal(active.active_count, 4);
  const closed = await projectRegister(coordinator, { view: "Closed" });
  assert.deepEqual(
    closed.items.map((r) => r.id),
    [id(4)],
  );
  assert.equal(closed.items[0].at_risk, 1);
  assert.equal(closed.items[0].milestone_overdue, true);
  for (const view of ["Overdue", "AtRisk"] as const)
    assert.deepEqual(
      (await projectRegister(coordinator, { view })).items.map((r) => r.id),
      [id(1)],
    );
  assert.deepEqual(
    (await projectRegister(samPrincipal, { view: "Mine" })).items,
    [],
  );
  const companyB = await projectRegister(other);
  assert.deepEqual(
    companyB.items.map((r) => r.id),
    [id(6)],
  );
  assert.deepEqual(companyB.counts, {
    Active: 1,
    Mine: 1,
    All: 1,
    Closed: 0,
    Overdue: 0,
    AtRisk: 0,
    NoTarget: 0,
  });
});
for (const view of projectViews)
  for (const sort of projectSorts)
    for (const direction of ["asc", "desc"])
      test(`${view}/${sort}/${direction}: exact identities, facts, counts, raw rows and every public cursor`, (t) =>
        prove(t, { view, sort, direction }));
for (const q of [
  "sYn rEgIsTeR",
  "Alpha",
  "SYN Beta site",
  id(3),
  "no such project",
  "SYN Sam Jordan",
])
  test(`search ${q}: exact matches and exclusions`, (t) =>
    prove(t, { q, view: "All", limit: 1 }));
test("owner/customer combinations, references and unfiltered options/badge", async (t) => {
  for (const coordinatorId of [undefined, coordinator.actor_id, sam])
    for (const customer of [undefined, org1, org2])
      await prove(t, {
        view: "All",
        ...(coordinatorId ? { coordinator: coordinatorId } : {}),
        ...(customer ? { customer } : {}),
        limit: 1,
      });
  await prove(t, { q: expected[0].display_number, view: "All", limit: 200 });
  await prove(t, { customer: expected[5].organisation_id, view: "All" });
});
test("other coordinator and Company B have their explicit Mine and company populations", async (t) => {
  await prove(t, { view: "Mine" }, samPrincipal);
  await prove(t, { view: "All" }, samPrincipal);
  await prove(t, { view: "All" }, other, CRM.companyB);
  await prove(t, { view: "Mine" }, other, CRM.companyB);
});
test("missing/deleted mandatory parents refuse; optional parents remain null without invalid fixtures", async (t) => {
  const rows = (
    await database().query(
      "SELECT p.id,o.parent_organisation_id,s.primary_contact_id FROM ppo.projects p JOIN ppo.organisations o ON o.id=p.organisation_id JOIN ppo.sites s ON s.id=p.site_id WHERE p.id=$1",
      [id(3)],
    )
  ).rows;
  assert.deepEqual(rows, [
    { id: id(3), parent_organisation_id: null, primary_contact_id: null },
  ]);
  for (const [table, parent] of [
    ["organisations", org2],
    ["sites", site2],
    ["users", sam],
  ])
    await assert.rejects(
      transaction(async (c) => {
        await c.query(`DELETE FROM ppo.${table} WHERE id=$1`, [parent]);
      }),
      (e) => ["23503", "55000"].includes((e as { code: string }).code),
    );
  await assert.rejects(
    createProject(coordinator, {
      ...projectInput(),
      id: randomUUID(),
      organisation_id: randomUUID(),
    }),
  );
  await prove(t, { view: "All" });
});
test("denied profiles, working-company exclusions and cursor binding are unchanged", async () => {
  for (const profile of ["systems", "other-workspace"]) {
    const p = (await createSession(profile)).principal;
    for (const reader of [original, projectRegister])
      await assert.rejects(
        reader(p),
        (e) => e instanceof AppError && e.status === 403,
      );
  }
  for (const reader of [original, projectRegister]) {
    const empty = await withWorkingCompany(
      coordinator.actor_id,
      CRM.companyB,
      () => reader(coordinator, { view: "All" }),
    );
    assert.equal(empty.total, 0);
    assert.equal(empty.active_count, 0);
    assert.deepEqual(empty.options, { customers: [], coordinators: [] });
  }
  const first = await projectRegister(coordinator, { limit: 1 });
  assert.ok(first.next_cursor);
  for (const reader of [original, projectRegister]) {
    for (const changed of [
      { view: "All" },
      { sort: "title" },
      { direction: "desc" },
      { q: "Alpha" },
      { coordinator: sam },
      { customer: org1 },
      { limit: 2 },
      { cursor: first.next_cursor + "x" },
    ])
      await assert.rejects(
        reader(coordinator, {
          limit: 1,
          cursor: first.next_cursor,
          ...changed,
        }),
        (e) => e instanceof AppError && e.status === 422,
      );
    await assert.rejects(
      reader(samPrincipal, { limit: 1, cursor: first.next_cursor }),
      (e) => e instanceof AppError && e.status === 422,
    );
  }
});
test("native task completion removes a valid cursor anchor and preserves refresh refusal", async () => {
  const extra = { ...taskInput(), id: taskId(10), status: "AtRisk" };
  await saveTask(coordinator, id(2), extra);
  const first = await projectRegister(coordinator, {
    view: "AtRisk",
    limit: 1,
  });
  assert.equal(first.items[0].id, id(1));
  assert.ok(first.next_cursor);
  const version = (
    await database().query("SELECT version FROM ppo.projects WHERE id=$1", [
      id(1),
    ])
  ).rows[0].version;
  await saveTask(coordinator, id(1), {
    ...riskTask,
    ...crmBase(),
    expected_version: version,
    status: "Complete",
    progress: 100,
  });
  for (const reader of [original, projectRegister])
    await assert.rejects(
      reader(coordinator, {
        view: "AtRisk",
        limit: 1,
        cursor: first.next_cursor,
      }),
      (e) =>
        e instanceof AppError &&
        e.status === 422 &&
        e.field_errors.some(
          (x) => x.field === "cursor" && x.message.includes("Refresh"),
        ),
    );
});

// All records come from the native setup above. Narrow an existing seeded grant
// and reassign an existing site-party relationship only inside a rolled-back
// fixture transaction; no grant is added and every constraint remains enabled.
test("site-scoped parent visibility decides rows, counts and options", async (t) => {
  const pool = database(),
    c = await pool.connect();
  await c.query("BEGIN");
  const route = t.mock.method(pool, "query", (...args: unknown[]) =>
    Reflect.apply(c.query, c, args),
  );
  try {
    const grants = (
      await c.query(
        "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
        [sam],
      )
    ).rows;
    assert.equal(grants.length, 1);
    assert.equal(grants[0].scope_type, "Company");
    assert.equal(grants[0].company_id, CRM.company);
    const site = expected[0].site_id;
    await c.query(
      "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2 WHERE id=$1",
      [grants[0].id, site],
    );
    t.mock.timers.enable({
      apis: ["Date"],
      now: new Date("2026-11-10T00:00:00Z"),
    });
    const check = async (ids: string[]) => {
      const a = await captureRegister(original, samPrincipal, { view: "All" });
      const b = await captureRegister(projectRegister, samPrincipal, {
        view: "All",
      });
      assert.deepEqual(
        b.data.items.map((r) => r.id),
        ids,
      );
      assert.equal(b.data.total, ids.length);
      assert.deepEqual(
        b.data.counts,
        ids.length
          ? {
              Active: 2,
              Mine: 0,
              All: 3,
              Closed: 1,
              Overdue: 1,
              AtRisk: 1,
              NoTarget: 0,
            }
          : {
              Active: 0,
              Mine: 0,
              All: 0,
              Closed: 0,
              Overdue: 0,
              AtRisk: 0,
              NoTarget: 0,
            },
      );
      assert.equal(b.data.active_count, ids.length ? 2 : 0);
      assert.deepEqual(
        b.data.options,
        ids.length
          ? {
              customers: [{ id: org1, name: expected[0].customer_name }],
              coordinators: [
                {
                  id: coordinator.actor_id,
                  name: expected[0].coordinator_name,
                },
              ],
            }
          : { customers: [], coordinators: [] },
      );
      assert.equal(b.data.next_cursor, null);
      assert.deepEqual(b.raw, a.raw);
      assert.deepEqual(b.values, a.values);
      assert.deepEqual(b.data, a.data);
    };
    // Organisation passes only through site_parties; swapping o/s loses these rows.
    await check([id(1), id(2), id(4)]);
    // Reassign the relationship, not the mandatory project parent. The project
    // scope and site remain visible but org1 has no party at the permitted site.
    // Dropping both parent checks would incorrectly return P1/P2/P4 here.
    const reassigned = await c.query(
      "UPDATE ppo.site_parties SET organisation_id=$3 WHERE site_id=$1 AND organisation_id=$2 RETURNING id",
      [site, org1, org2],
    );
    assert.equal(reassigned.rowCount, 1);
    // Validate deferred constraints too, even though this fixture is rolled back.
    await c.query("SET CONSTRAINTS ALL IMMEDIATE");
    await check([]);
  } finally {
    t.mock.timers.reset();
    route.mock.restore();
    await c.query("ROLLBACK");
    c.release();
  }
});
