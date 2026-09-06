import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { canonical } from "../../src/platform/operations";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createOpportunity,
  qualifyOpportunity,
  planOpportunityAction,
} from "../../src/crm/opportunities";
import {
  readOpportunity,
  listOpportunities,
  opportunityOptions,
} from "../../src/crm/reads";
import {
  activityCommand,
  createActivity,
  listActivities,
  readActivity,
} from "../../src/activities/activities";
import { ownerOptions } from "../../src/shared/context";
import { readOperation } from "../../src/shared/receipts";
import { CRM, crmBase, crmAction, crmCreate, crmQualify } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const effectCounts = async () =>
  Promise.all(
    [
      "opportunities",
      "activities",
      "activity_links",
      "opportunity_events",
      "business_identities",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
      "reference_counters",
    ].map(async (table) => [
      table,
      (await rows(`SELECT count(*)::int AS n FROM ppo.${table}`))[0].n,
    ]),
  );

test("CA-01/03 real atomic creation, competing identical retries, original hashes and one effect", async () => {
  const p = await principal(),
    input = crmCreate();
  const results = await Promise.all([
    createOpportunity(p, input),
    createOpportunity(p, input),
  ]);
  assert.equal(results.filter((x) => x.replayed).length, 1);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  const o = await readOpportunity(p, input.id);
  assert.equal(o.stage_id, "Enquiry");
  assert.equal(o.close_outcome, "Open");
  assert.match(o.display_number, /^SYN-PPO-OPP-000001$/);
  assert.equal(o.actions.length, 1);
  assert.equal(o.events.length, 1);
  assert.equal(o.next_action_state, "DueNeeded");
  for (const [table, condition] of [
    ["opportunities", "id"],
    ["opportunity_events", "opportunity_id"],
    ["operation_receipts", "record_id"],
    ["audit_events", "object_id"],
  ])
    assert.equal(
      (
        await rows(
          `SELECT count(*)::int AS n FROM ppo.${table} WHERE ${condition}=$1`,
          [input.id],
        )
      )[0].n,
      1,
    );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.outbox_jobs WHERE operation_id=$1",
        [input.operation_id],
      )
    )[0].n,
    1,
  );
  assert.equal(
    (
      await rows(
        "SELECT payload_hash FROM ppo.operation_receipts WHERE operation_id=$1",
        [input.operation_id],
      )
    )[0].payload_hash,
    createHash("sha256")
      .update(canonical({ command: "CreateOpportunity", ...input }))
      .digest("hex"),
  );
  assert.deepEqual(
    await readOperation(p, input.operation_id),
    results[0].receipt,
  );
  await assert.rejects(
    createOpportunity(p, { ...input, title: "Different content" }),
    code("OperationConflict"),
  );
});
test("CA-01 failure at final outbox insert rolls back every domain/link/identity/reference/evidence write", async () => {
  const p = await principal(),
    input = crmCreate(),
    before = await effectCounts();
  await database().query(
    "CREATE FUNCTION ppo.crm_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='OpportunityCreated' THEN RAISE EXCEPTION 'SYN final-write failure' USING ERRCODE='23514'; END IF; RETURN NEW; END $$; CREATE TRIGGER crm_test_fail BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.crm_test_fail()",
  );
  await assert.rejects(createOpportunity(p, input));
  assert.deepEqual(await effectCounts(), before);
  await database().query(
    "DROP TRIGGER crm_test_fail ON ppo.outbox_jobs; DROP FUNCTION ppo.crm_test_fail()",
  );
  await createOpportunity(p, input);
  assert.equal(
    (await readOpportunity(p, input.id)).display_number,
    "SYN-PPO-OPP-000001",
  );
});
test("CA-02 competing PostgreSQL qualification/action transactions block and accept exactly one expected version", async () => {
  const p = await principal(),
    input = crmCreate();
  await createOpportunity(p, input);
  const blocker = await database().connect();
  await blocker.query("BEGIN");
  await blocker.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
    p.workspace_id,
  ]);
  const a = qualifyOpportunity(p, input.id, crmQualify()),
    b = planOpportunityAction(p, input.id, {
      ...crmBase(),
      expected_version: 1,
      new_action: crmAction(),
      activity_id: null,
    });
  const result = Promise.allSettled([a, b]);
  let blocked = false;
  for (let i = 0; i < 40; i++) {
    if (
      (
        await rows(
          "SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name='PPO-P01' AND wait_event_type='Lock'",
        )
      )[0].n >= 2
    ) {
      blocked = true;
      break;
    }
    await delay(25);
  }
  await blocker.query("COMMIT");
  blocker.release();
  const outcomes = await result;
  assert.equal(
    blocked,
    true,
    "Separate PostgreSQL backends really waited on locks",
  );
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    outcomes.filter(
      (x) =>
        x.status === "rejected" &&
        (x.reason as { code: string }).code === "VersionConflict",
    ).length,
    1,
  );
  const o = await readOpportunity(p, input.id);
  assert.equal(o.version, 2);
  assert.equal(o.events.length, 2);
});
test("CA-02 two qualification intents preserve the winning need and immutable stage entry", async () => {
  const p = await principal(),
    i = crmCreate();
  await createOpportunity(p, i);
  const first = crmQualify(),
    second = { ...crmQualify(), need_summary: "SYN competing proposal" };
  const result = await Promise.allSettled([
    qualifyOpportunity(p, i.id, first),
    qualifyOpportunity(p, i.id, second),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  const o = await readOpportunity(p, i.id);
  assert.equal(o.stage_id, "Qualified");
  assert.equal(o.events[1].from_stage, "Enquiry");
  const entered = o.stage_entered_at;
  await planOpportunityAction(p, i.id, {
    ...crmBase(),
    expected_version: 2,
    new_action: crmAction(),
  });
  assert.equal((await readOpportunity(p, i.id)).stage_entered_at, entered);
  await assert.rejects(
    qualifyOpportunity(p, i.id, crmQualify(3)),
    code("CRM_PROGRESS_INVALID"),
  );
});
test("CA-04/07 completing designated action retains outcome and requires deliberate successor, never stage progression", async () => {
  const p = await principal(),
    i = crmCreate();
  await createOpportunity(p, i);
  const complete = {
    ...crmBase(),
    expected_version: 1,
    outcome: "SYN Contact explained the need.\nFollow-up is still required.",
  };
  await activityCommand(p, i.initial_action.id, complete, "complete");
  let o = await readOpportunity(p, i.id);
  assert.equal(o.next_action_state, "Needed");
  assert.equal(o.stage_id, "Enquiry");
  assert.equal(o.version, 1);
  assert.equal(o.actions[0].outcome, complete.outcome);
  const unrelated = {
    ...crmBase(),
    ...crmAction(),
    company_id: CRM.company,
    site_id: CRM.site,
    access_class: "Internal",
    links: [{ object_type: "Opportunity", object_id: i.id }],
  };
  await createActivity(p, unrelated);
  assert.equal(
    (await readOpportunity(p, i.id)).next_action_state,
    "Needed",
    "Other active actions are not silently designated",
  );
  await planOpportunityAction(p, i.id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: unrelated.id,
  });
  o = await readOpportunity(p, i.id);
  assert.equal(o.next_activity!.id, unrelated.id);
  assert.equal(o.next_action_state, "DueNeeded");
  await assert.rejects(
    planOpportunityAction(p, i.id, {
      ...crmBase(),
      expected_version: 2,
      activity_id: i.initial_action.id,
    }),
    code("CRM_ACTION_TERMINAL"),
  );
  assert.deepEqual(
    (await activityCommand(p, i.initial_action.id, complete, "complete"))
      .receipt,
    await readOperation(p, complete.operation_id),
  );
});
test("CA-04/07 unknown contact needs owned active identification; terminal historical action remains valid history", async () => {
  const p = await principal(),
    i = {
      ...crmCreate(),
      site_id: null,
      site_unknown_reason: "SYN Site remains to be identified",
      primary_person_id: null,
      contact_unknown_reason: "SYN Contact unknown",
    };
  await createOpportunity(p, i);
  await assert.rejects(
    qualifyOpportunity(p, i.id, crmQualify()),
    code("CRM_IDENTIFICATION_REQUIRED"),
  );
  const q = {
    ...crmQualify(),
    identification_activity_id: i.initial_action.id,
  };
  const accepted = await qualifyOpportunity(p, i.id, q);
  await activityCommand(
    p,
    i.initial_action.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN Identification attempt documented; further contact needed",
    },
    "complete",
  );
  assert.equal((await readOpportunity(p, i.id)).next_action_state, "Needed");
  assert.deepEqual(
    (await qualifyOpportunity(p, i.id, q)).receipt,
    accepted.receipt,
  );
  await planOpportunityAction(p, i.id, {
    ...crmBase(),
    expected_version: 2,
    new_action: {
      ...crmAction(),
      due_at: "2026-01-01T00:00:00Z",
      due_needed: false,
    },
  });
  assert.equal((await readOpportunity(p, i.id)).next_action_state, "Overdue");
});
for (const [label, change] of [
  ["wrong company", { company_id: CRM.companyB }],
  [
    "unaffiliated contact",
    { primary_person_id: "60000000-0000-4000-8000-000000000002" },
  ],
  ["other site", { site_id: "70000000-0000-4000-8000-000000000003" }],
  ["unknown definition", { pipeline_definition_id: randomUUID() }],
  ["Systems owner", { owner_id: "30000000-0000-4000-8000-000000000003" }],
  ["actor injection", { actor_id: CRM.owner }],
  ["state injection", { stage_id: "Qualified" }],
  ["client reference", { display_number: "SYN-PPO-OPP-000999" }],
  ["unknown site without reason", { site_id: null }],
  ["unknown contact without reason", { primary_person_id: null }],
  ["oversized title", { title: "x".repeat(201) }],
  ["blank need", { need_summary: " " }],
] as const)
  test(`CA-01/05/06 invalid ${label} leaves no partial effects`, async () => {
    const p = await principal(),
      before = await effectCounts();
    await assert.rejects(createOpportunity(p, { ...crmCreate(), ...change }));
    assert.deepEqual(await effectCounts(), before);
  });
test("CA-05 permitted shared person preserves one identity and same-name organisations never merge", async () => {
  const p = await principal(),
    i = crmCreate(),
    before = (await rows("SELECT count(*)::int AS n FROM ppo.people"))[0].n;
  await createOpportunity(p, i);
  const people = await opportunityOptions(p, {
    kind: "Person",
    company_id: CRM.company,
    organisation_id: CRM.org,
  });
  assert.ok(people.items.some((x) => x.id === CRM.person));
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.people"))[0].n,
    before,
  );
  const orgs = await opportunityOptions(p, {
    kind: "Organisation",
    company_id: CRM.company,
  });
  assert.ok(orgs.items.length > 1);
  assert.equal(new Set(orgs.items.map((x) => x.id)).size, orgs.items.length);
});
test("CA-06/10 current scope suppresses opportunity and all-target Activity through direct/list/filter/selector/receipt", async () => {
  const p = await principal(),
    i = crmCreate();
  const receipt = await createOpportunity(p, i);
  for (const profile of [
    "second-company",
    "systems",
    "technician",
    "site-observer",
    "other-workspace",
  ]) {
    const denied = await principal(profile);
    for (const id of [i.id, randomUUID()])
      await assert.rejects(
        readOpportunity(denied, id),
        code("RecordUnavailable"),
      );
    await assert.rejects(readActivity(denied, i.initial_action.id));
    await assert.rejects(readOperation(denied, i.operation_id));
  }
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",
    [p.actor_id],
  );
  await assert.rejects(readOpportunity(p, i.id), code("RecordUnavailable"));
  await assert.rejects(
    readActivity(p, i.initial_action.id),
    code("RecordUnavailable"),
  );
  assert.equal(
    (await listActivities(p, { q: i.initial_action.summary })).items.length,
    0,
  );
  await assert.rejects(
    listActivities(p, { object_type: "Opportunity", object_id: i.id }),
    code("RecordUnavailable"),
  );
  await assert.rejects(readOperation(p, i.operation_id));
  await assert.rejects(createOpportunity(p, i));
  await assert.rejects(
    ownerOptions(p, {
      company_id: CRM.company,
      site_id: CRM.site,
      purpose: "Activity",
      access_class: "Internal",
      activity_id: i.initial_action.id,
    }),
  );
  assert.equal(
    (
      await rows(
        "SELECT result FROM ppo.operation_receipts WHERE operation_id=$1",
        [i.operation_id],
      )
    )[0].result.receipt_id,
    receipt.receipt.receipt_id,
  );
});
test("CA-06 scoped site reader sees its site only; CRM owner label does not replace grants", async () => {
  const p = await principal(),
    known = crmCreate(),
    unknown = {
      ...crmCreate(),
      site_id: null,
      site_unknown_reason: "SYN unspecified site",
    };
  await createOpportunity(p, known);
  await createOpportunity(p, unknown);
  const siteReader = await principal("site-observer");
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,user_id,company_id,c,'Site',scope_id,site_id FROM ppo.permission_grants CROSS JOIN unnest(ARRAY['crm.opportunity.read','shared.internal.read']) c WHERE user_id=$1 AND capability='shared.read' ON CONFLICT DO NOTHING",
    [siteReader.actor_id],
  );
  const list = await listOpportunities(siteReader);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].id, known.id);
  assert.equal((await readOpportunity(siteReader, known.id)).can_edit, false);
  await assert.rejects(
    readOpportunity(siteReader, unknown.id),
    code("RecordUnavailable"),
  );
  await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
    p.actor_id,
  ]);
  await assert.rejects(readOpportunity(p, known.id), code("RecordUnavailable"));
  await assert.rejects(readOperation(p, known.operation_id));
});
test("CA-08 reassignment versus completion keeps current owner/version and terminal outcome exact", async () => {
  const p = await principal(),
    i = crmCreate();
  await createOpportunity(p, i);
  const u = randomUUID();
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN second eligible sales owner')",
    [u, p.workspace_id, randomUUID()],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",
    [u, p.actor_id],
  );
  const old = {
    ...crmBase(),
    expected_version: 1,
    outcome: "SYN Original owner result",
  };
  const updates = await Promise.allSettled([
    activityCommand(
      p,
      i.initial_action.id,
      {
        ...crmBase(),
        expected_version: 1,
        owner_id: u,
        summary: i.initial_action.summary,
        due_at: null,
        due_needed: true,
      },
      "update",
    ),
    activityCommand(p, i.initial_action.id, old, "complete"),
  ]);
  assert.equal(updates.filter((x) => x.status === "fulfilled").length, 1);
  const a = await readActivity(p, i.initial_action.id);
  if (a.status === "Completed") {
    assert.equal(a.outcome, old.outcome);
    await assert.rejects(
      activityCommand(
        p,
        a.id,
        {
          ...crmBase(),
          expected_version: a.version,
          cancellation_reason: "No",
        },
        "cancel",
      ),
    );
  } else {
    assert.equal(a.owner_id, u);
    await assert.rejects(
      activityCommand(
        p,
        a.id,
        { ...old, operation_id: randomUUID(), expected_version: a.version },
        "complete",
      ),
      code("ACTIVITY_OWNER_REQUIRED"),
    );
  }
});
test("CA-01/05 real FK, deferred designation, immutable config/context/events and direct SQL failures", async () => {
  const p = await principal(),
    i = crmCreate();
  await createOpportunity(p, i);
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Opportunity',$4)",
      [CRM.workspace, CRM.company, i.initial_action.id, randomUUID()],
    ),
    code("23503"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.opportunities SET next_activity_id=$1,version=version+1 WHERE id=$2",
      ["85000000-0000-4000-8000-000000000001", i.id],
    ),
    code("23514"),
  );
  for (const sql of [
    "UPDATE ppo.opportunities SET owner_id=created_by,title='rewritten',version=version+1",
    "UPDATE ppo.opportunity_events SET reason='rewritten'",
    "DELETE FROM ppo.crm_pipeline_definitions",
    "UPDATE ppo.crm_stage_definitions SET ordinal=ordinal",
    "DELETE FROM ppo.opportunities",
  ])
    await assert.rejects(database().query(sql), code("55000"));
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.crm_stage_definitions VALUES($1,$2,'Estimating',3)",
      [CRM.workspace, CRM.definition],
    ),
    code("23514"),
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.activities(id,workspace_id,company_id,created_by,updated_by,site_id,kind,owner_id,summary,due_at,due_needed,access_class) VALUES($1,$2,$3,$4,$4,NULL,'CustomerContact',$4,'SYN wrong site',NULL,true,'Internal')",
        [
          "ca000000-0000-4000-8000-000000000001",
          CRM.workspace,
          CRM.company,
          CRM.owner,
        ],
      );
      await c.query(
        "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Opportunity',$4)",
        [
          CRM.workspace,
          CRM.company,
          "ca000000-0000-4000-8000-000000000001",
          i.id,
        ],
      );
    }),
    code("23514"),
  );
});
test("CA-03/10 accepted-main upgrade preserves old commands, histories, IDs and hashes; repeat seed never repairs revocations or edits", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(8);
  await seed(7);
  const p = await principal();
  const a = {
    ...crmBase(),
    ...crmAction(),
    company_id: CRM.company,
    site_id: CRM.site,
    access_class: "Internal",
    links: [{ object_type: "Organisation", object_id: CRM.org }],
  };
  const accepted = await createActivity(p, a);
  const tables = [
    "activities",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "history_records",
    "reference_counters",
  ];
  const before = await Promise.all(
    tables.map((t) => rows(`SELECT * FROM ppo.${t} ORDER BY 1`)),
  );
  const hashes = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  for (let n = 0; n < tables.length; n++)
    assert.deepEqual(
      await rows(`SELECT * FROM ppo.${tables[n]} ORDER BY 1`),
      before[n],
    );
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=8 ORDER BY version",
    ),
    hashes,
  );
  assert.deepEqual((await createActivity(p, a)).receipt, accepted.receipt);
  const i = crmCreate();
  await createOpportunity(p, i);
  await qualifyOpportunity(p, i.id, crmQualify());
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.edit'",
    [p.actor_id],
  );
  const all = await effectCounts(),
    counter = await rows(
      "SELECT * FROM ppo.reference_counters ORDER BY record_type",
    );
  await seed();
  await seed();
  assert.deepEqual(await effectCounts(), all);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.reference_counters ORDER BY record_type"),
    counter,
  );
  assert.equal((await readOpportunity(p, i.id)).stage_id, "Qualified");
  assert.equal((await readOpportunity(p, i.id)).can_edit, false);
});

test("CA-06/10 each mixed Activity target controls visibility, designation content and current-permission receipts", async () => {
  const p = await principal(),
    i = crmCreate();
  await createOpportunity(p, i);
  const mixed = {
    ...crmBase(),
    ...crmAction(),
    summary: "SYN mixed target private action",
    company_id: CRM.company,
    site_id: CRM.site,
    access_class: "Internal",
    links: [
      { object_type: "Opportunity", object_id: i.id },
      {
        object_type: "Ticket",
        object_id: "40000000-0000-4000-8000-000000000020",
      },
    ],
  };
  await createActivity(p, mixed);
  const plan = { ...crmBase(), expected_version: 1, activity_id: mixed.id };
  await planOpportunityAction(p, i.id, plan);
  assert.equal((await readOpportunity(p, i.id)).next_activity!.id, mixed.id);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.ticket.read'",
    [p.actor_id],
  );
  const o = await readOpportunity(p, i.id);
  assert.equal(o.next_action_state, "Unavailable");
  assert.equal(o.next_activity, null);
  assert.ok(!JSON.stringify(o).includes(mixed.id));
  assert.ok(!JSON.stringify(o).includes(mixed.summary));
  assert.equal((await listActivities(p, { q: mixed.summary })).items.length, 0);
  await assert.rejects(readActivity(p, mixed.id), code("RecordUnavailable"));
  await assert.rejects(readOperation(p, plan.operation_id));
  await assert.rejects(planOpportunityAction(p, i.id, plan));
  // Independent Activity permission revocation also blocks the original create receipt.
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.edit'",
    [p.actor_id],
  );
  await assert.rejects(readOperation(p, i.operation_id));
  await assert.rejects(createOpportunity(p, i));
});

test("CA-01/08 eligible action owner needs Activity authority and CRM read, not Opportunity edit", async () => {
  const p = await principal(),
    u = randomUUID();
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN eligible contact-action owner')",
    [u, p.workspace_id, randomUUID()],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability NOT IN ('crm.opportunity.create','crm.opportunity.edit')",
    [u, p.actor_id],
  );
  const args = {
    company_id: CRM.company,
    organisation_id: CRM.org,
    site_id: CRM.site,
    primary_person_id: CRM.person,
  };
  assert.ok(
    (await opportunityOptions(p, { ...args, kind: "ActionOwner" })).items.some(
      (x) => x.id === u,
    ),
  );
  assert.ok(
    !(await opportunityOptions(p, { ...args, kind: "Owner" })).items.some(
      (x) => x.id === u,
    ),
  );
  const i = { ...crmCreate(), initial_action: crmAction(u) };
  await createOpportunity(p, i);
  const other = { ...p, actor_id: u };
  await activityCommand(
    other,
    i.initial_action.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN permitted action owner outcome",
    },
    "complete",
  );
  await assert.rejects(qualifyOpportunity(other, i.id, crmQualify()));
  await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [u]);
  assert.ok(
    !(await opportunityOptions(p, { ...args, kind: "ActionOwner" })).items.some(
      (x) => x.id === u,
    ),
  );
  await assert.rejects(
    createOpportunity(p, { ...crmCreate(), initial_action: crmAction(u) }),
  );
});

test("CA-05/06 scoped site creator selects only permitted context and completes its owned journey",async()=>{
 const p=await principal("site-observer");
 await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,user_id,company_id,c,'Site',scope_id,site_id FROM ppo.permission_grants CROSS JOIN unnest(ARRAY['crm.opportunity.read','crm.opportunity.create','crm.opportunity.edit','shared.internal.read','activity.read','activity.edit']) c WHERE user_id=$1 AND capability='shared.read' ON CONFLICT DO NOTHING",[p.actor_id]);
 const companies=await opportunityOptions(p,{kind:"Company"});assert.equal(companies.items.length,1);assert.equal(companies.items[0].id,CRM.company);assert.equal(companies.items[0].requires_site,true);
 const orgs=await opportunityOptions(p,{kind:"Organisation",company_id:CRM.company});assert.ok(orgs.items.some(x=>x.id===CRM.org));assert.ok(!orgs.items.some(x=>x.id===CRM.orgB));
 const sites=await opportunityOptions(p,{kind:"Site",company_id:CRM.company,organisation_id:CRM.org});assert.deepEqual(sites.items.map(x=>x.id),[CRM.site]);
 const i={...crmCreate(),owner_id:p.actor_id,initial_action:crmAction(p.actor_id)};await createOpportunity(p,i);await activityCommand(p,i.initial_action.id,{...crmBase(),expected_version:1,outcome:"SYN Site-scoped contact outcome"},"complete");await qualifyOpportunity(p,i.id,crmQualify());assert.equal((await readOpportunity(p,i.id)).next_action_state,"Needed");
 await assert.rejects(createOpportunity(p,{...crmCreate(),site_id:null,site_unknown_reason:"SYN beyond site authority",owner_id:p.actor_id,initial_action:crmAction(p.actor_id)}));
 await assert.rejects(createOpportunity(p,{...crmCreate(),site_id:"70000000-0000-4000-8000-000000000002",owner_id:p.actor_id,initial_action:crmAction(p.actor_id)}));assert.equal((await listOpportunities(p)).items.length,1);
});
