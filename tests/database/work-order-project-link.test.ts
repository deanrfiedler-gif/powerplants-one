import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import {
  closeDatabase,
  database,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { reset } from "../../scripts/database";
import { createProject } from "../../src/projects/service";
import { createWorkOrder, readWorkOrder } from "../../src/service/work-orders";
import {
  readProjectSchedule as readSchedule,
  fieldWorkCandidates,
  linkWorkOrderProject,
  unlinkWorkOrderProject,
} from "../../src/service/project-field-work";
import { readOperation } from "../../src/shared/receipts";
import { CRM } from "../helpers/crm";
import { projectInput } from "../helpers/projects";

// B1 (project delivery billing decision R1): typed project link on work orders.
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const id = (t: number, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const order = (n: number) => id(90, n);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (value: string) => (e: unknown) =>
  e instanceof AppError && e.code === value;
const pgCode = (value: string) => (e: unknown) =>
  (e as { code?: string }).code === value;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN B1 project field work link",
});
async function project(
  p: Principal,
  overrides: Partial<ReturnType<typeof projectInput>> = {},
) {
  const input = { ...projectInput(), ...overrides };
  await createProject(p, input);
  return input.id;
}
async function versions(p: Principal, workOrder: string, projectId: string) {
  return {
    expected_version: (
      await rows("SELECT version FROM ppo.work_orders WHERE id=$1", [workOrder])
    )[0].version as number,
    expected_project_version: (await readSchedule(p, projectId)).project
      .version,
  };
}
async function link(p: Principal, workOrder: string, projectId: string) {
  return {
    ...base(),
    project_id: projectId,
    ...(await versions(p, workOrder, projectId)),
  };
}
async function close(projectId: string, actor: Principal) {
  // Fixture-only closure with the exact schedule event the deferred guard requires.
  await transaction(async (c) => {
    await c.query(
      "UPDATE ppo.projects SET lifecycle='Closed',version=version+1,updated_by=$2 WHERE id=$1",
      [projectId, actor.actor_id],
    );
    await c.query(
      `INSERT INTO ppo.project_schedule_events(id,workspace_id,company_id,project_id,created_by,updated_by,operation_id,project_version,event_type,reason,project_snapshot)
      SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,'ProjectAcceptanceChanged','SYN closed-context fixture',to_jsonb(p) FROM ppo.projects p WHERE id=$4`,
      [randomUUID(), actor.actor_id, randomUUID(), projectId],
    );
  });
}
async function startVisit(workOrder: string) {
  const visit = (
    await rows(
      "SELECT id FROM ppo.appointments WHERE work_order_id=$1 ORDER BY id LIMIT 1",
      [workOrder],
    )
  )[0].id;
  await database().query(
    "UPDATE ppo.appointments SET actual_start_at=clock_timestamp(),version=version+1 WHERE id=$1",
    [visit],
  );
}
const revoke = (user: string, capability: string) =>
  database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2",
    [user, capability],
  );
const grant = (user: string, capability: string, company = CRM.company) =>
  database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3) ON CONFLICT DO NOTHING",
    [CRM.workspace, user, company, capability],
  );

test("B1 migration adds an unlinked typed column: existing work orders and free-text references stay as they were", async () => {
  const linked = await rows(
    "SELECT id,project_reference,project_id FROM ppo.work_orders ORDER BY id",
  );
  assert.ok(linked.length > 0);
  assert.ok(linked.every((w) => w.project_id === null));
  assert.equal(
    linked.find((w) => w.id === "a9000000-0000-4000-8000-000000000001")
      ?.project_reference,
    "SYN-PPO-PROJECT-PLANNER",
  );
});

test("link and unlink record a receipt, audit and outbox once, show on both reads and replay exactly", async () => {
  const p = await principal(),
    prj = await project(p);
  const cmd = await link(p, order(1), prj);
  const linked = await linkWorkOrderProject(p, order(1), cmd);
  assert.equal(linked.replayed, false);
  assert.equal(linked.receipt.record_id, order(1));
  assert.equal(linked.receipt.record_version, cmd.expected_version + 1);
  const replay = await linkWorkOrderProject(p, order(1), cmd);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.receipt, linked.receipt);
  assert.deepEqual(await readOperation(p, cmd.operation_id), linked.receipt);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.audit_events WHERE operation_id=$1",
        [cmd.operation_id],
      )
    )[0].n,
    1,
  );
  assert.deepEqual(
    (
      await rows("SELECT kind FROM ppo.outbox_jobs WHERE operation_id=$1", [
        cmd.operation_id,
      ])
    ).map((r) => r.kind),
    ["WorkOrderProjectLinked"],
  );
  // The project version is not advanced: field work is not a schedule change.
  const schedule = await readSchedule(p, prj);
  assert.equal(schedule.project.version, cmd.expected_project_version);
  assert.deepEqual(
    schedule.field_work?.items.map((w) => [
      w.id,
      w.can_unlink,
      w.visit_started,
    ]),
    [[order(1), true, false]],
  );
  assert.equal(schedule.field_work?.can_link, true);
  const w = (await readWorkOrder(p, order(1))).items[0] as Record<
    string,
    unknown
  >;
  assert.equal("project_id" in w, false);
  assert.deepEqual(w.project, {
    id: prj,
    display_number: schedule.project.display_number,
    title: schedule.project.title,
    lifecycle: "Active",
  });
  // A second link, under a new operation, is refused rather than duplicated.
  await assert.rejects(
    linkWorkOrderProject(p, order(1), await link(p, order(1), prj)),
    code("AlreadyLinked"),
  );

  const off = {
    ...(await link(p, order(1), prj)),
    reason: "SYN raised against the wrong project",
  };
  const unlinked = await unlinkWorkOrderProject(p, order(1), off);
  assert.deepEqual(
    (await unlinkWorkOrderProject(p, order(1), off)).receipt,
    unlinked.receipt,
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT reason,details->>'command' AS command,details->>'project_id' AS project FROM ppo.audit_events WHERE operation_id=$1",
        [off.operation_id],
      )
    )[0],
    {
      reason: "SYN raised against the wrong project",
      command: "UnlinkWorkOrderProject",
      project: prj,
    },
  );
  assert.equal((await readWorkOrder(p, order(1))).items[0].project, null);
  assert.deepEqual((await readSchedule(p, prj)).field_work?.items, []);
  // Unlinking again finds no link to remove.
  await assert.rejects(
    unlinkWorkOrderProject(p, order(1), await link(p, order(1), prj)),
    code("VersionConflict"),
  );
});

test("stale work-order or project versions conflict and change nothing", async () => {
  const p = await principal(),
    prj = await project(p);
  const cmd = await link(p, order(1), prj);
  await assert.rejects(
    linkWorkOrderProject(p, order(1), {
      ...cmd,
      expected_version: cmd.expected_version + 1,
    }),
    code("VersionConflict"),
  );
  await assert.rejects(
    linkWorkOrderProject(p, order(1), {
      ...cmd,
      operation_id: randomUUID(),
      expected_project_version: cmd.expected_project_version + 1,
    }),
    code("VersionConflict"),
  );
  await assert.rejects(
    linkWorkOrderProject(p, order(1), {
      ...cmd,
      operation_id: randomUUID(),
      expected_project_version: 0,
    }),
    code("InvalidData"),
  );
  assert.equal(
    (
      await rows("SELECT project_id FROM ppo.work_orders WHERE id=$1", [
        order(1),
      ])
    )[0].project_id,
    null,
  );
  // A reused operation with different content is refused.
  await linkWorkOrderProject(p, order(1), cmd);
  await assert.rejects(
    unlinkWorkOrderProject(p, order(1), {
      ...cmd,
      ...(await versions(p, order(1), prj)),
    }),
    code("OperationConflict"),
  );
});

test("a different customer, a closed project and a started visit are refused by the command and the database", async () => {
  const p = await principal(),
    other = await project(p, {
      organisation_id: "50000000-0000-4000-8000-000000000002",
    }),
    prj = await project(p);
  await assert.rejects(
    linkWorkOrderProject(p, order(1), await link(p, order(1), other)),
    (e) =>
      e instanceof AppError &&
      e.code === "InvalidData" &&
      e.field_errors[0].field === "project_id",
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.work_orders SET project_id=$2,version=version+1 WHERE id=$1",
      [order(1), other],
    ),
    pgCode("23514"),
  );

  // A started visit fixes the link both ways.
  await linkWorkOrderProject(p, order(2), await link(p, order(2), prj));
  await startVisit(order(2));
  await assert.rejects(
    unlinkWorkOrderProject(p, order(2), await link(p, order(2), prj)),
    code("FieldWorkStarted"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.work_orders SET project_id=NULL,version=version+1 WHERE id=$1",
      [order(2)],
    ),
    pgCode("55000"),
  );
  assert.equal(
    (await readSchedule(p, prj)).field_work?.items[0].can_unlink,
    false,
  );
  await startVisit(order(7));
  await assert.rejects(
    linkWorkOrderProject(p, order(7), await link(p, order(7), prj)),
    code("FieldWorkStarted"),
  );
  assert.deepEqual(
    (await fieldWorkCandidates(p, prj)).items
      .map((w) => w.id)
      .filter((w) => [order(2), order(7)].includes(w)),
    [],
  );

  // Linking or unlinking against a closed project is refused; the database refuses a new link.
  await linkWorkOrderProject(p, order(3), await link(p, order(3), prj));
  await close(prj, p);
  await assert.rejects(
    linkWorkOrderProject(p, order(1), await link(p, order(1), prj)),
    code("ClosedProject"),
  );
  await assert.rejects(
    unlinkWorkOrderProject(p, order(3), await link(p, order(3), prj)),
    code("ClosedProject"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.work_orders SET project_id=$2,version=version+1 WHERE id=$1",
      [order(1), prj],
    ),
    pgCode("23514"),
  );
  const closed = await readSchedule(p, prj);
  assert.equal(closed.field_work?.can_link, false);
  assert.deepEqual(
    closed.field_work?.items.map((w) => [w.id, w.can_unlink]),
    [
      [order(2), false],
      [order(3), false],
    ],
  );
  assert.deepEqual((await fieldWorkCandidates(p, prj)).items, []);
  // The link stays when its project closes.
  assert.equal(
    (await readWorkOrder(p, order(3))).items[0].project?.lifecycle,
    "Closed",
  );
});

test("cross-company links are refused, and a direct switch between projects needs an unlink first", async () => {
  const p = await principal(),
    b = await principal("second-company");
  const foreign = await project(b, {
    company_id: CRM.companyB,
    organisation_id: CRM.orgB,
    site_id: "70000000-0000-4000-8000-000000000003",
    coordinator_id: b.actor_id,
  });
  for (const capability of [
    "project.read",
    "project.edit",
    "shared.internal.read",
    "shared.read",
  ])
    await grant(p.actor_id, capability, CRM.companyB);
  await assert.rejects(
    linkWorkOrderProject(p, order(1), await link(p, order(1), foreign)),
    code("InvalidData"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.work_orders SET project_id=$2,version=version+1 WHERE id=$1",
      [order(1), foreign],
    ),
    (e: unknown) =>
      ["23503", "23514"].includes((e as { code?: string }).code ?? ""),
  );
  const first = await project(p),
    second = await project(p);
  await linkWorkOrderProject(p, order(1), await link(p, order(1), first));
  await assert.rejects(
    linkWorkOrderProject(p, order(1), await link(p, order(1), second)),
    code("ProjectLinkExists"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.work_orders SET project_id=$2,version=version+1 WHERE id=$1",
      [order(1), second],
    ),
    pgCode("23514"),
  );
});

test("linking needs project.edit on the project and service.work_order.edit on the work order", async () => {
  const p = await principal(),
    prj = await project(p),
    cmd = await link(p, order(1), prj);
  await revoke(p.actor_id, "project.edit");
  await assert.rejects(
    linkWorkOrderProject(p, order(1), cmd),
    code("RecordUnavailable"),
  );
  assert.equal((await readSchedule(p, prj)).field_work?.can_link, false);
  await grant(p.actor_id, "project.edit");
  await revoke(p.actor_id, "service.work_order.edit");
  await assert.rejects(
    linkWorkOrderProject(p, order(1), cmd),
    (e) => e instanceof AppError && [403, 404].includes(e.status),
  );
  assert.equal((await readSchedule(p, prj)).field_work?.can_link, false);
  assert.deepEqual((await fieldWorkCandidates(p, prj)).items, []);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1",
        [cmd.operation_id],
      )
    )[0].n,
    0,
  );
  assert.equal(
    (
      await rows("SELECT project_id FROM ppo.work_orders WHERE id=$1", [
        order(1),
      ])
    )[0].project_id,
    null,
  );
  // Unlinking needs the same pair of permissions.
  await grant(p.actor_id, "service.work_order.edit");
  await linkWorkOrderProject(p, order(1), cmd);
  await revoke(p.actor_id, "project.edit");
  await assert.rejects(
    unlinkWorkOrderProject(p, order(1), await link(p, order(1), prj)),
    code("RecordUnavailable"),
  );
});

test("each record keeps its own read permission: no hidden count, no leaked project identity", async () => {
  const p = await principal(),
    prj = await project(p);
  await linkWorkOrderProject(p, order(1), await link(p, order(1), prj));
  await linkWorkOrderProject(p, order(3), await link(p, order(3), prj));
  // A project reader without work-order read sees no field work, not a count of it.
  const projectOnly = await principal("materials-author");
  const seen = await readSchedule(projectOnly, prj);
  assert.deepEqual(seen.field_work, { items: [], can_link: false });
  // A work-order reader without project read sees no project and no project identifier.
  const observer = await principal("observer");
  const w = (await readWorkOrder(observer, order(1))).items[0] as Record<
    string,
    unknown
  >;
  assert.equal(w.project, null);
  assert.equal(JSON.stringify(w).includes(prj), false);
  // A reader of only some work orders sees exactly those.
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,site_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'service.work_order.read','Site',$4)",
    [
      CRM.workspace,
      projectOnly.actor_id,
      CRM.company,
      "70000000-0000-4000-8000-000000000002",
    ],
  );
  assert.deepEqual(
    (await readSchedule(projectOnly, prj)).field_work?.items,
    [],
  );
  // Work-order read also needs its linked service requests to be readable.
  await grant(projectOnly.actor_id, "service.work_order.read");
  await grant(projectOnly.actor_id, "service.ticket.read");
  assert.deepEqual(
    (await readSchedule(projectOnly, prj)).field_work?.items.map((x) => [
      x.display_number,
      x.can_unlink,
    ]),
    [
      ["SYN-WO-000001", false],
      ["SYN-WO-000003", false],
    ],
  );
});

test("creating a work order may set its project under the same rules", async () => {
  const p = await principal(),
    prj = await project(p);
  const payload = {
    ...base(),
    id: randomUUID(),
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    service_owner_id: CRM.owner,
    project_id: prj,
    tickets: [
      {
        ticket_id: id(40, 20),
        issue_disposition: "SYN project field work request",
      },
    ],
  };
  const created = await createWorkOrder(p, payload);
  assert.deepEqual(
    (await createWorkOrder(p, payload)).receipt,
    created.receipt,
  );
  assert.equal((await readWorkOrder(p, payload.id)).items[0].project?.id, prj);
  assert.deepEqual(
    (await readSchedule(p, prj)).field_work?.items.map((w) => w.id),
    [payload.id],
  );
  const other = await project(p, {
    organisation_id: "50000000-0000-4000-8000-000000000002",
  });
  await assert.rejects(
    createWorkOrder(p, {
      ...payload,
      ...base(),
      id: randomUUID(),
      project_id: other,
    }),
    code("InvalidData"),
  );
  await close(prj, p);
  await assert.rejects(
    createWorkOrder(p, { ...payload, ...base(), id: randomUUID() }),
    code("ClosedProject"),
  );
  await revoke(p.actor_id, "project.edit");
  await assert.rejects(
    createWorkOrder(p, {
      ...payload,
      ...base(),
      id: randomUUID(),
      project_id: other,
    }),
    code("RecordUnavailable"),
  );
});

test("link candidates are unlinked, same-customer, editable work orders without a started visit", async () => {
  const p = await principal(),
    prj = await project(p);
  const all = (await fieldWorkCandidates(p, prj)).items.map(
    (w) => w.display_number,
  );
  assert.ok(all.includes("SYN-WO-000001"));
  await linkWorkOrderProject(p, order(1), await link(p, order(1), prj));
  const after = (await fieldWorkCandidates(p, prj)).items.map(
    (w) => w.display_number,
  );
  assert.equal(after.includes("SYN-WO-000001"), false);
  assert.deepEqual(
    (await fieldWorkCandidates(p, prj, { q: "000003" })).items.map(
      (w) => w.display_number,
    ),
    ["SYN-WO-000003"],
  );
  const other = await project(p, {
    organisation_id: "50000000-0000-4000-8000-000000000002",
  });
  assert.deepEqual((await fieldWorkCandidates(p, other)).items, []);
  await assert.rejects(
    fieldWorkCandidates(await principal("materials-author"), prj),
    code("RecordUnavailable"),
  );
});

// #752 review R1: candidates are paged only over rows the caller may read in full and edit, so
// hidden rows are never counted and cannot crowd permitted ones out of the page.
const site2 = "70000000-0000-4000-8000-000000000002";
const siteGrant = (user: string, capability: string, site: string) =>
  database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,site_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,$5,'Site',$4) ON CONFLICT DO NOTHING",
    [CRM.workspace, user, CRM.company, site, capability],
  );
let cloned = 0;
// Fixture-only: unlinked Draft copies of SYN-WO-000001 on a site, each linked to the given ticket.
// References are allocated in insertion order, so earlier copies sort first.
async function cloneOrders(count: number, site: string, ticket: string) {
  const ids = Array.from({ length: count }, () => id(91, ++cloned));
  await transaction(async (c) => {
    for (const orderId of ids) {
      await c.query(
        `INSERT INTO ppo.work_orders SELECT (jsonb_populate_record(NULL::ppo.work_orders,(to_jsonb(w)-'display_number')||jsonb_build_object('id',$2::text,'version',1,'status','Draft','scope_revision_id',null,'project_id',null,'site_id',$3::text))).* FROM ppo.work_orders w WHERE w.id=$1`,
        [order(1), orderId, site],
      );
      await c.query(
        "INSERT INTO ppo.work_order_tickets(workspace_id,company_id,site_id,work_order_id,ticket_id,issue_disposition) VALUES($1,$2,$3,$4,$5,'SYN candidate paging fixture')",
        [CRM.workspace, CRM.company, site, orderId, ticket],
      );
    }
  });
  return (
    await rows("SELECT display_number FROM ppo.work_orders WHERE id=ANY($1) ORDER BY display_number", [ids])
  ).map((r) => r.display_number as string);
}
async function siteTwoTicket() {
  const ticket = id(41, 1);
  await database().query(
    `INSERT INTO ppo.tickets SELECT (jsonb_populate_record(NULL::ppo.tickets,(to_jsonb(t)-'display_number')||jsonb_build_object('id',$1::text,'version',1,'site_id',$2::text,'asset_id',null))).* FROM ppo.tickets t WHERE t.id=(SELECT ticket_id FROM ppo.work_order_tickets WHERE work_order_id=$3 ORDER BY ticket_id LIMIT 1)`,
    [ticket, site2, order(1)],
  );
  return ticket;
}
test("R1 candidate pages count only readable, editable work orders; hidden ones neither leak nor crowd", async () => {
  const p = await principal(),
    prj = await project(p);
  const siteOneTicket = (
    await rows("SELECT ticket_id FROM ppo.work_order_tickets WHERE work_order_id=$1 ORDER BY ticket_id LIMIT 1", [order(1)])
  )[0].ticket_id as string;
  // More hidden rows than one 200-row scan batch, so permitted rows are only found after a keyset step.
  const hidden = await cloneOrders(201, CRM.site, siteOneTicket);
  const permitted = await cloneOrders(2, site2, await siteTwoTicket());
  const page = (input = {}) => fieldWorkCandidates(p, prj, input);
  const numbers = async (input = {}) => {
    const r = await page(input);
    return { items: r.items.map((w) => w.display_number), has_more: r.has_more };
  };
  // With company-wide edit every unlinked row qualifies: a full page and more.
  const full = await page();
  assert.equal(full.items.length, 100);
  assert.equal(full.has_more, true);
  // Site 1 rows readable but not editable: they are skipped, the later Site 2 rows are found, and
  // has_more does not reveal the skipped rows.
  await revoke(p.actor_id, "service.work_order.edit");
  await siteGrant(p.actor_id, "service.work_order.edit", site2);
  assert.deepEqual(await numbers(), { items: permitted, has_more: false });
  // A search that matches only rows the caller cannot edit shows nothing and no "more".
  assert.deepEqual(await numbers({ q: hidden[50] }), { items: [], has_more: false });
  // Rows hidden from read by their linked request behave the same.
  await grant(p.actor_id, "service.work_order.edit");
  await revoke(p.actor_id, "service.ticket.read");
  await siteGrant(p.actor_id, "service.ticket.read", site2);
  assert.deepEqual(await numbers(), { items: permitted, has_more: false });
  assert.deepEqual(await numbers({ q: hidden[0] }), { items: [], has_more: false });
  // More than a page of permitted rows still gives exactly 100 and has_more.
  const more = await cloneOrders(101, site2, id(41, 1));
  const bounded = await numbers();
  assert.equal(bounded.items.length, 100);
  assert.equal(bounded.has_more, true);
  assert.deepEqual(bounded.items, [...permitted, ...more].slice(0, 100));
});

// #752 review R2: receipt recovery needs the same project authority as the original command, on
// the project that command named, not the work order's current link.
test("R2 link, unlink and project-linked create receipts recover only with current project edit", async () => {
  const p = await principal(),
    prj = await project(p);
  const on = await link(p, order(1), prj);
  const linked = await linkWorkOrderProject(p, order(1), on);
  const off = await link(p, order(1), prj);
  const unlinked = await unlinkWorkOrderProject(p, order(1), off);
  const payload = {
    ...base(),
    id: randomUUID(),
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    service_owner_id: CRM.owner,
    project_id: prj,
    tickets: [{ ticket_id: id(40, 20), issue_disposition: "SYN project field work request" }],
  };
  const created = await createWorkOrder(p, payload);
  const plain = {
    ...payload,
    ...base(),
    id: randomUUID(),
    project_id: undefined,
    tickets: [{ ticket_id: id(40, 20), issue_disposition: "SYN unlinked field work request" }],
  };
  delete (plain as { project_id?: string }).project_id;
  const unrelated = await createWorkOrder(p, plain);
  // The audit keeps the original project for the linked create; a plain create records none.
  assert.equal(
    (await rows("SELECT details->>'project_id' AS project FROM ppo.audit_events WHERE operation_id=$1", [payload.operation_id]))[0].project,
    prj,
  );
  assert.equal(
    (await rows("SELECT details ? 'project_id' AS has FROM ppo.audit_events WHERE operation_id=$1", [plain.operation_id]))[0].has,
    false,
  );
  const recovered = async () => {
    const out: Record<string, boolean> = {};
    for (const [name, op] of [["link", on.operation_id], ["unlink", off.operation_id], ["create", payload.operation_id], ["plain", plain.operation_id]] as const)
      out[name] = await readOperation(p, op).then(() => true, (e) => {
        if (!code("RecordUnavailable")(e) && !code("Forbidden")(e)) throw e;
        return false;
      });
    return out;
  };
  // The work order is now unlinked, yet the link receipt recovers against its original project.
  assert.deepEqual(await readOperation(p, on.operation_id), linked.receipt);
  assert.deepEqual(await readOperation(p, off.operation_id), unlinked.receipt);
  assert.deepEqual(await readOperation(p, payload.operation_id), created.receipt);
  assert.deepEqual(await readOperation(p, plain.operation_id), unrelated.receipt);
  // Without project edit, POST replay and GET recovery both refuse; the plain create is unaffected.
  await revoke(p.actor_id, "project.edit");
  await assert.rejects(linkWorkOrderProject(p, order(1), on), code("RecordUnavailable"));
  assert.deepEqual(await recovered(), { link: false, unlink: false, create: false, plain: true });
  await grant(p.actor_id, "project.edit");
  assert.deepEqual(await recovered(), { link: true, unlink: true, create: true, plain: true });
  // Relinking to a second project leaves the original receipts tied to the first one.
  const second = await project(p);
  await linkWorkOrderProject(p, order(1), await link(p, order(1), second));
  assert.deepEqual(await readOperation(p, on.operation_id), linked.receipt);
  // Work-order edit is still required as well.
  await revoke(p.actor_id, "service.work_order.edit");
  assert.deepEqual(await recovered(), { link: false, unlink: false, create: false, plain: false });
});

// #752 re-review: recovery is decided by the project each original command named, not by the work
// order's current link. Losing read or edit on the original project refuses its receipts while a
// relinked current project stays accessible; restoring access restores recovery.
test("R2 receipts follow the original project's authority after relinking to another project", async () => {
  const p = await principal(),
    first = await project(p);
  // Fixture-only: the customer also occupies Site 2, so a second project can sit there.
  await database().query(
    `INSERT INTO ppo.site_parties SELECT (jsonb_populate_record(NULL::ppo.site_parties,to_jsonb(s)||jsonb_build_object('id',$2::text,'site_id',$3::text))).* FROM ppo.site_parties s WHERE s.site_id=$1 AND s.organisation_id=$4 ORDER BY s.valid_from LIMIT 1`,
    [CRM.site, randomUUID(), site2, CRM.org],
  );
  const second = await project(p, { site_id: site2 });
  const on = await link(p, order(1), first);
  const linked = await linkWorkOrderProject(p, order(1), on);
  const off = await link(p, order(1), first);
  const unlinked = await unlinkWorkOrderProject(p, order(1), off);
  const again = await link(p, order(1), second);
  const relinked = await linkWorkOrderProject(p, order(1), again);
  const created = {
    ...base(),
    id: randomUUID(),
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    service_owner_id: CRM.owner,
    project_id: first,
    tickets: [{ ticket_id: id(40, 20), issue_disposition: "SYN project field work request" }],
  };
  const createdReceipt = (await createWorkOrder(p, created)).receipt;
  const { project_id: _omit, ...plainInput } = { ...created, ...base(), id: randomUUID() };
  void _omit;
  const plainReceipt = (await createWorkOrder(p, plainInput)).receipt;
  const ops = {
    link: [on.operation_id, linked.receipt],
    unlink: [off.operation_id, unlinked.receipt],
    create: [created.operation_id, createdReceipt],
    relink: [again.operation_id, relinked.receipt],
    plain: [plainInput.operation_id, plainReceipt],
  } as const;
  const recovered = async () => {
    const out: Record<string, boolean> = {};
    for (const [name, [op, receipt]] of Object.entries(ops))
      out[name] = await readOperation(p, op).then(
        (r) => (assert.deepEqual(r, receipt), true),
        (e) => {
          if (!code("RecordUnavailable")(e) && !code("Forbidden")(e)) throw e;
          return false;
        },
      );
    return out;
  };
  const all = { link: true, unlink: true, create: true, relink: true, plain: true };
  const firstDenied = { link: false, unlink: false, create: false, relink: true, plain: true };
  assert.deepEqual(await recovered(), all);
  // Edit kept only on Site 2: the current, relinked project stays editable; the original does not.
  await revoke(p.actor_id, "project.edit");
  await siteGrant(p.actor_id, "project.edit", site2);
  assert.deepEqual(await recovered(), firstDenied);
  await grant(p.actor_id, "project.edit");
  assert.deepEqual(await recovered(), all);
  // Read kept only on Site 2: the original project is unreadable, the current one readable.
  await revoke(p.actor_id, "project.read");
  await siteGrant(p.actor_id, "project.read", site2);
  assert.deepEqual(await recovered(), firstDenied);
  await grant(p.actor_id, "project.read");
  assert.deepEqual(await recovered(), all);
});
