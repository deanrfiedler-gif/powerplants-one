import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeEach, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { editDealInformation } from "../../src/crm/refinements";
import {
  createHandover,
  commandHandover,
  readHandover,
} from "../../src/sales/handover-service";
import { emptyHandover } from "../../src/sales/handover-model";
import {
  bindEstimatingWorkspace,
  readEstimatingBinding,
  readWorkspaceSalesBriefs,
} from "../../src/sales/estimating-binding";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import { readOperation } from "../../src/shared/receipts";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
async function fixture() {
  const p = (await createSession("coordinator")).principal,
    o = crmDiscovery();
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  await createOpportunity(p, o);
  const id = randomUUID();
  await createHandover(p, {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Estimating",
  });
  const content = {
    ...emptyHandover(),
    problem: "SYN Sales problem distinct from independently authored Discovery",
    outcome: "SYN customer outcome",
    included_scope: "SYN controls",
    exclusions: "None",
    assumptions: "None",
    unknowns: "SYN receiver owns technical verification",
    requested_date: "2031-10-01",
    date_reason: "SYN request",
    next_activity_id: o.initial_action.id,
  };
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: p.actor_id,
    note: "SYN prepared brief",
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
    note: "SYN receiver reviewed",
  });
  const discovery = discoveryInput(),
    preview = await previewDiscoveryCreate(p, {
      opportunity_id: o.id,
      discovery,
    });
  const create = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
  const created = await createDiscoveryWorkspace(p, create);
  return { p, o, id, content, create, created };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
async function input(f: Fixture) {
  const d = await readEstimatingBinding(f.p, f.id),
    g = d.candidate!;
  return {
    ...crmBase(),
    expected_version: d.version,
    acceptance_event_id: d.acceptance_event_id!,
    source_hash: d.source_hash!,
    estimating_workspace_id: g.id,
    expected_estimating_version: g.version,
    selected_option_id: g.selected_option_id,
    selected_revision_id: g.selected_revision_id,
  };
}
async function nativeSave(f: Fixture) {
  const d = await readEstimatingBinding(f.p, f.id),
    g = d.candidate!;
  const proposal = {
    kind: "Save" as const,
    option_id: g.selected_option_id,
    expected_version: g.version,
    expected_revision_id: g.selected_revision_id,
    discovery: discoveryInput(),
    branch_mode: null,
    copy_follow_up: null,
  };
  const preview = await previewDiscoveryChange(f.p, g.id, proposal);
  await changeDiscoveryWorkspace(f.p, g.id, {
    ...crmBase(),
    ...proposal,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  });
}
const snapshots = async (tables: string[]) =>
  Promise.all(
    tables.map((t) =>
      rows(
        `SELECT to_jsonb(t) AS row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
      ),
    ),
  );
const native = [
  "estimating_workspaces",
  "estimating_options",
  "estimation_revisions",
  "estimates",
  "estimate_versions",
  "sales_handovers",
  "sales_workflow_events",
  "opportunities",
  "activities",
];
test("LC-13 exact acceptance binding preserves independent native history and original recovery after successors", async () => {
  const f = await fixture(),
    command = await input(f),
    before = await snapshots(native);
  const result = await bindEstimatingWorkspace(f.p, f.id, command);
  assert.deepEqual(await snapshots(native), before);
  assert.deepEqual(
    await readOperation(f.p, command.operation_id),
    result.receipt,
  );
  assert.deepEqual(
    (await bindEstimatingWorkspace(f.p, f.id, command)).receipt,
    result.receipt,
  );
  const first = await readWorkspaceSalesBriefs(f.p, f.create.id);
  assert.equal(first.items[0].access, "Available");
  assert.equal(first.items[0].content?.problem, f.content.problem);
  assert.equal(first.items[0].current, true);
  await nativeSave(f);
  await commandHandover(f.p, f.id, {
    ...crmBase(),
    action: "Successor",
    expected_version: 4,
    note: "SYN new Sales review",
  });
  assert.deepEqual(
    await readOperation(f.p, command.operation_id),
    result.receipt,
  );
  assert.deepEqual(
    (await bindEstimatingWorkspace(f.p, f.id, command)).receipt,
    result.receipt,
  );
  assert.equal(
    (await readWorkspaceSalesBriefs(f.p, f.create.id)).items[0].current,
    false,
  );
  await assert.rejects(
    bindEstimatingWorkspace(f.p, f.id, {
      ...command,
      operation_id: randomUUID(),
    }),
    code("VersionConflict"),
  );
  await commandHandover(f.p, f.id, {
    ...crmBase(),
    action: "Submit",
    expected_version: 5,
    note: "SYN submit successor",
  });
  const current = await readHandover(f.p, f.id);
  await commandHandover(f.p, f.id, {
    ...crmBase(),
    action: "Accept",
    expected_version: 6,
    source_hash: current.record.source_hash,
    note: "SYN accept successor",
  });
  await bindEstimatingWorkspace(f.p, f.id, await input(f));
  const history = await readWorkspaceSalesBriefs(f.p, f.create.id);
  assert.equal(history.items.length, 2);
  assert.deepEqual(
    history.items.map((i) => i.current),
    [false, true],
  );
  assert.deepEqual(
    await readOperation(f.p, f.create.operation_id),
    f.created.receipt,
  );
});
test("LC-13 stale source/workspace, wrong Deal and receiver authority block new links without effects", async () => {
  const f = await fixture(),
    command = await input(f);
  await nativeSave(f);
  await assert.rejects(
    bindEstimatingWorkspace(f.p, f.id, command),
    code("VersionConflict"),
  );
  const next = await input(f),
    other = await fixture();
  await assert.rejects(
    bindEstimatingWorkspace(f.p, f.id, {
      ...next,
      estimating_workspace_id: other.create.id,
    }),
    (e) => [403, 404].includes((e as { status: number }).status),
  );
  const p = (await createSession("crm-receiver")).principal;
  await assert.rejects(bindEstimatingWorkspace(p, f.id, next), (e) =>
    [403, 404].includes((e as { status: number }).status),
  );
  await editDealInformation(f.p, f.o.id, {
    ...crmBase(),
    expected_version: 1,
    title: "SYN changed customer need",
    primary_person_id: f.o.primary_person_id,
    contact_unknown_reason: null,
    value_amount: null,
    expected_close_date: null,
  });
  assert.equal((await readEstimatingBinding(f.p, f.id)).source_changed, true);
  await assert.rejects(
    bindEstimatingWorkspace(f.p, f.id, next),
    code("VersionConflict"),
  );
  assert.equal(
    (await rows("SELECT * FROM ppo.sales_estimating_bindings")).length,
    0,
  );
});
test("LC-13 identical concurrent linking has one original; competing intent cannot duplicate the association", async () => {
  const f = await fixture(),
    command = await input(f);
  const both = await Promise.all([
    bindEstimatingWorkspace(f.p, f.id, command),
    bindEstimatingWorkspace(f.p, f.id, command),
  ]);
  assert.deepEqual(both[0].receipt, both[1].receipt);
  assert.equal(both.filter((x) => !x.replayed).length, 1);
  await assert.rejects(
    bindEstimatingWorkspace(f.p, f.id, { ...command, reason: "SYN different" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    bindEstimatingWorkspace(f.p, f.id, {
      ...command,
      operation_id: randomUUID(),
    }),
    code("RelationshipConflict"),
  );
  assert.equal(
    (await rows("SELECT * FROM ppo.sales_estimating_bindings")).length,
    1,
  );
  await assert.rejects(
    database().query("UPDATE ppo.sales_estimating_bindings SET reason=$1", [
      "SYN rewrite",
    ]),
    code("55000"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.sales_estimating_bindings"),
    code("55000"),
  );
});
test("LC-13 late publication failure and missing direct SQL evidence roll back the entire link", async () => {
  const f = await fixture(),
    command = await input(f),
    tables = [
      ...native,
      "sales_estimating_bindings",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
    ],
    before = await snapshots(tables);
  await database().query(
    "CREATE FUNCTION ppo.test_lc13_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN publication failure'; END $$; CREATE TRIGGER test_lc13_failure BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.test_lc13_failure()",
  );
  try {
    await assert.rejects(
      bindEstimatingWorkspace(f.p, f.id, command),
      /SYN publication failure/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER test_lc13_failure ON ppo.outbox_jobs; DROP FUNCTION ppo.test_lc13_failure()",
    );
  }
  assert.deepEqual(await snapshots(tables), before);
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.sales_estimating_bindings(workspace_id,company_id,handover_id,acceptance_event_id,estimating_workspace_id,estimating_version,selected_option_id,selected_revision_id,operation_id,recorded_by,reason) VALUES($1,$2,$3,$4,$5,1,$6,$7,$8,$9,$10)",
        [
          f.p.workspace_id,
          f.o.company_id,
          f.id,
          command.acceptance_event_id,
          f.create.id,
          f.create.option_id,
          f.create.revision_id,
          randomUUID(),
          f.p.actor_id,
          "SYN no publication",
        ],
      );
    }),
    code("23514"),
  );
  assert.deepEqual(await snapshots(tables), before);
  await bindEstimatingWorkspace(f.p, f.id, command);
});
test("LC-13 revoked native access hides link identities and denies original recovery and replay", async () => {
  const f = await fixture(),
    command = await input(f);
  await bindEstimatingWorkspace(f.p, f.id, command);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'",
    [f.p.actor_id],
  );
  const d = await readEstimatingBinding(f.p, f.id);
  assert.deepEqual(d.links, [{ access: "Restricted" }]);
  assert.equal(d.candidate, null);
  assert.equal(d.can_link, false);
  await assert.rejects(readOperation(f.p, command.operation_id), (e) =>
    [403, 404].includes((e as { status: number }).status),
  );
  await assert.rejects(bindEstimatingWorkspace(f.p, f.id, command), (e) =>
    [403, 404].includes((e as { status: number }).status),
  );
});
test("LC-13 populated 0073 upgrade retains accepted brief bytes, native Discovery, grants and original receipts", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(73);
  await seed(73);
  const f = await fixture(),
    tables = [
      ...native,
      "permission_grants",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
    ],
    before = await snapshots(tables),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await snapshots(tables), before);
  const upgraded = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(upgraded.slice(0, -2), ledger);
  assert.deepEqual(upgraded.slice(-2).map(row => row.version), [74,75]);
  assert.deepEqual(
    await readOperation(f.p, f.create.operation_id),
    f.created.receipt,
  );
  await bindEstimatingWorkspace(f.p, f.id, await input(f));
  assert.equal(
    (await readWorkspaceSalesBriefs(f.p, f.create.id)).items.length,
    1,
  );
});
