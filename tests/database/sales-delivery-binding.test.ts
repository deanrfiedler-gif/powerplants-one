import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { changeDealStage } from "../../src/crm/refinements";
import { recordOpportunityOutcome } from "../../src/crm/outcomes";
import {
  createHandover,
  commandHandover,
  readHandover,
} from "../../src/sales/handover-service";
import { emptyHandover } from "../../src/sales/handover-model";
import {
  bindDelivery,
  readDeliveryBinding,
  readDeliverySalesSources,
  type DeliveryKind,
} from "../../src/sales/delivery-binding";
import { createProject, saveTask } from "../../src/projects/service";
import { createWorkOrder } from "../../src/service/work-orders";
import { readOperation } from "../../src/shared/receipts";
import { crmBase, crmDiscovery, CRM } from "../helpers/crm";
import { projectInput, taskInput } from "../helpers/projects";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
const native = [
  "projects",
  "project_tasks",
  "project_schedule_events",
  "work_orders",
  "work_order_tickets",
  "scope_revisions",
  "tickets",
  "opportunities",
  "opportunity_handovers_due",
  "activities",
  "sales_handovers",
  "sales_workflow_events",
];
const all = [
  ...native,
  "sales_delivery_bindings",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
];
const snapshot = (tables = all) =>
  Promise.all(
    tables.map((t) =>
      rows(`SELECT to_jsonb(t) row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`),
    ),
  );
async function fixture(kind: DeliveryKind = "Projects", unknownSite = false) {
  const p = (await createSession("coordinator")).principal,
    o = crmDiscovery();
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  if (unknownSite) {
    o.site_id = null;
    o.site_unknown_reason =
      "SYN receiver will explicitly identify delivery location";
  }
  await createOpportunity(p, o);
  for (const [i, stage_id] of [
    "Scoping",
    "Quoting",
    "Negotiation",
    "Closing",
  ].entries())
    await changeDealStage(p, o.id, {
      ...crmBase(),
      expected_version: i + 1,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  await recordOpportunityOutcome(p, o.id, {
    ...crmBase(),
    expected_version: 5,
    close_outcome: "Won",
    lost_reason: null,
    acceptance_evidence: "SYN independently reviewed order",
    commercial_source: {
      kind: "Independent",
      evidence: "SYN separate fictional customer order",
    },
  });
  const id = randomUUID();
  await createHandover(p, {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Won",
  });
  const content = {
    ...emptyHandover(),
    problem: "SYN original Sales problem",
    outcome: "SYN customer outcome",
    included_scope: "SYN Sales scope remains separate from native work",
    exclusions: "None",
    assumptions: "None",
    unknowns: "SYN receiver owns technical review",
    date_reason: "SYN requested date remains to be agreed",
    next_activity_id: o.initial_action.id,
    destination: kind,
    routing_basis: "SYN explicit receiving route",
    delivery_items: "SYN controls package",
    release_prerequisites:
      "SYN native scope and release review remains required",
  };
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: p.actor_id,
    note: "SYN saved receiving package",
  });
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN submit",
  });
  const submitted = await readHandover(p, id);
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Accept",
    expected_version: 3,
    source_hash: submitted.record.source_hash,
    note: "SYN accept exact receiving revision",
  });
  const target = randomUUID();
  const create =
    kind === "Projects"
      ? { ...projectInput(), id: target }
      : {
          ...crmBase(),
          id: target,
          company_id: CRM.company,
          site_id: CRM.site,
          customer_id: CRM.org,
          service_owner_id: CRM.owner,
          tickets: [
            {
              ticket_id: "40000000-0000-4000-8000-000000000020",
              issue_disposition: "SYN retained native intake",
            },
          ],
        };
  const created =
    kind === "Projects"
      ? await createProject(p, create)
      : await createWorkOrder(p, create);
  return { p, o, id, kind, content, target, create, created };
}
async function input(f: Awaited<ReturnType<typeof fixture>>) {
  const d = await readDeliveryBinding(f.p, f.id, { destination_id: f.target });
  assert.equal(d.can_link, true);
  assert.ok(d.candidate);
  assert.ok(d.acceptance_event_id);
  return {
    ...crmBase(),
    expected_version: d.version,
    acceptance_event_id: d.acceptance_event_id,
    source_hash: d.source_hash,
    destination_kind: f.kind,
    destination_id: f.target,
    destination_site_id: d.candidate.site_id,
    expected_destination_version: d.candidate.version,
  };
}
for (const kind of ["Projects", "Service"] as const)
  test(`LC-16 ${kind} links exact acceptance once without changing native scope and recovers after Sales successor`, async () => {
    const f = await fixture(kind),
      c = await input(f),
      before = await snapshot(native);
    const saved = await Promise.all([
      bindDelivery(f.p, f.id, c),
      bindDelivery(f.p, f.id, c),
    ]);
    assert.deepEqual(saved[0].receipt, saved[1].receipt);
    assert.equal(saved.filter((x) => x.replayed).length, 1);
    assert.deepEqual(await snapshot(native), before);
    assert.deepEqual(
      await readOperation(f.p, f.create.operation_id),
      f.created.receipt,
    );
    assert.equal(
      (await readDeliverySalesSources(f.p, kind, f.target)).items[0].content
        ?.included_scope,
      f.content.included_scope,
    );
    await commandHandover(f.p, f.id, {
      ...crmBase(),
      action: "Successor",
      expected_version: 4,
      note: "SYN later independently reviewed revision",
    });
    const d = await readDeliveryBinding(f.p, f.id);
    assert.equal(d.links[0].access, "Available");
    assert.equal(d.links[0].current, false);
    assert.deepEqual(
      await readOperation(f.p, c.operation_id),
      saved[0].receipt,
    );
    assert.deepEqual(
      (await bindDelivery(f.p, f.id, c)).receipt,
      saved[0].receipt,
    );
    await assert.rejects(
      bindDelivery(f.p, f.id, { ...c, reason: "Changed original link" }),
      code("OperationConflict"),
    );
    await assert.rejects(
      database().query(
        "UPDATE ppo.sales_delivery_bindings SET reason=$1 WHERE handover_id=$2",
        ["SYN forbidden rewrite", f.id],
      ),
    );
  });
test("LC-16 an unknown Sales site remains unknown while the exact native destination site is explicitly captured", async () => {
  const f = await fixture("Projects", true),
    c = await input(f);
  assert.equal((await readHandover(f.p, f.id)).record.site_id, null);
  await bindDelivery(f.p, f.id, c);
  assert.equal(
    (
      await rows(
        "SELECT destination_site_id FROM ppo.sales_delivery_bindings WHERE handover_id=$1",
        [f.id],
      )
    )[0].destination_site_id,
    CRM.site,
  );
  assert.equal((await readHandover(f.p, f.id)).record.site_id, null);
});
test("LC-16 stale target, mismatched site/route and changed Sales acceptance refuse every link effect", async () => {
  const f = await fixture(),
    c = await input(f);
  let before = await snapshot();
  await assert.rejects(
    bindDelivery(f.p, f.id, { ...c, destination_site_id: randomUUID() }),
    code("VersionConflict"),
  );
  await assert.rejects(
    bindDelivery(f.p, f.id, { ...c, destination_kind: "Service" }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(await snapshot(), before);
  await saveTask(f.p, f.target, taskInput());
  before = await snapshot();
  await assert.rejects(bindDelivery(f.p, f.id, c), code("VersionConflict"));
  assert.deepEqual(await snapshot(), before);
  const refreshed = await input(f);
  await commandHandover(f.p, f.id, {
    ...crmBase(),
    action: "Successor",
    expected_version: 4,
    note: "SYN source successor",
  });
  before = await snapshot();
  await assert.rejects(
    bindDelivery(f.p, f.id, refreshed),
    code("VersionConflict"),
  );
  assert.deepEqual(await snapshot(), before);
});
test("LC-16 current native access hides stored identities and blocks original receipt recovery", async () => {
  const f = await fixture(),
    c = await input(f);
  await bindDelivery(f.p, f.id, c);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [f.p.workspace_id, f.p.actor_id],
  );
  const d = await readDeliveryBinding(f.p, f.id);
  assert.deepEqual(d.links, [{ access: "Restricted" }]);
  await assert.rejects(readOperation(f.p, c.operation_id));
  await assert.rejects(bindDelivery(f.p, f.id, c));
  await assert.rejects(readDeliverySalesSources(f.p, "Projects", f.target));
});

test("LC-16 a direct companion insert without its exact receipt, audit and publication is rejected at commit", async () => {
  const f = await fixture(),
    c = await input(f),
    before = await snapshot();
  await assert.rejects(
    database().query(
      `INSERT INTO ppo.sales_delivery_bindings(workspace_id,company_id,handover_id,acceptance_event_id,destination_kind,project_id,destination_site_id,destination_version,operation_id,recorded_by,reason)
    VALUES($1,$2,$3,$4,'Projects',$5,$6,$7,$8,$9,'SYN missing atomic companions')`,
      [
        f.p.workspace_id,
        CRM.company,
        f.id,
        c.acceptance_event_id,
        f.target,
        CRM.site,
        c.expected_destination_version,
        c.operation_id,
        f.p.actor_id,
      ],
    ),
  );
  assert.deepEqual(await snapshot(), before);
  await bindDelivery(f.p, f.id, c);
});
test("LC-16 late publication failure rolls back link/audit/receipt and preserves the independently created native record", async () => {
  const f = await fixture(),
    c = await input(f),
    before = await snapshot();
  await database().query(
    "CREATE FUNCTION ppo.lc16_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN LC16 late failure' USING ERRCODE='P0001'; END $$; CREATE TRIGGER lc16_fail BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.lc16_fail()",
  );
  try {
    await assert.rejects(bindDelivery(f.p, f.id, c), (e) =>
      String(e).includes("SYN LC16 late failure"),
    );
  } finally {
    await database().query(
      "DROP TRIGGER lc16_fail ON ppo.outbox_jobs; DROP FUNCTION ppo.lc16_fail()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    await readOperation(f.p, f.create.operation_id),
    f.created.receipt,
  );
  await bindDelivery(f.p, f.id, c);
});
test("LC-16 populated 0075 upgrade preserves exact accepted Sales, native records, authorities and independent receipts", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(75);
  await seed(75);
  const f = await fixture(),
    names = [
      ...native,
      "permission_grants",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ];
  const before = await snapshot(names),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(names), before);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(after.slice(0, -2), ledger);
  assert.deepEqual(after.slice(-2).map((r: { version: number }) => r.version), [76, 77]);
  assert.deepEqual(
    await readOperation(f.p, f.create.operation_id),
    f.created.receipt,
  );
  assert.deepEqual((await readDeliveryBinding(f.p, f.id)).links, []);
  await bindDelivery(f.p, f.id, await input(f));
});
