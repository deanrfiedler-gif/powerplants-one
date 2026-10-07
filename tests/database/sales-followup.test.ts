import { readOpportunity } from "../../src/crm/reads";
import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import {
  createActivity,
  activityCommand,
  readActivity,
} from "../../src/activities/activities";
import { createProject } from "../../src/projects/service";
import {
  createLead,
  convertLead,
  planLeadAction,
  changeLead,
} from "../../src/crm/leads/service";
import { createOpportunity } from "../../src/crm/opportunities";
import { readLead } from "../../src/crm/leads/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  createSalesReview,
  linkSalesFollowup,
  readSalesFollowup,
  type SalesTargetKind,
} from "../../src/sales/followup";
import { crmBase, crmDiscovery, CRM } from "../helpers/crm";
import { leadCreate, leadConvert } from "../helpers/leads";
import { projectInput } from "../helpers/projects";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const snapshot = (
  tables = [
    "activities",
    "activity_links",
    "lead_candidates",
    "lead_events",
    "opportunities",
    "opportunity_events",
    "projects",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "business_identities",
  ],
) =>
  Promise.all(
    tables.map((t) =>
      rows(`SELECT to_jsonb(t) row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`),
    ),
  );
async function fixture(kind: SalesTargetKind = "Lead", restricted = false) {
  const p = (await createSession("coordinator")).principal,
    project = projectInput(),
    a = {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      site_id: CRM.site,
      kind: restricted ? "TechnicalFollowUp" : "CustomerContact",
      owner_id: CRM.owner,
      summary: "SYN observed customer need after delivery",
      due_at: "2031-10-01T00:00:00.000Z",
      due_needed: false,
      access_class: restricted ? "RestrictedService" : "Internal",
      links: [{ object_type: "Project", object_id: project.id }],
    };
  await createProject(p, project);
  await createActivity(p, a);
  const dest = kind === "Lead" ? leadCreate() : crmDiscovery();
  if (kind === "Lead") await createLead(p, dest);
  else await createOpportunity(p, dest);
  return { p, a, project, dest, kind };
}
async function input(f: Awaited<ReturnType<typeof fixture>>) {
  const d = await readSalesFollowup(f.p, f.a.id, {
    kind: f.kind,
    destination_id: f.dest.id,
  });
  return {
    ...crmBase(),
    expected_version: d.activity.version,
    source_hash: d.source_hash,
    destination_kind: f.kind,
    destination_id: f.dest.id,
    expected_destination_version: d.candidate!.version,
    existing_checked: true,
  };
}
for (const kind of ["Lead", "Opportunity"] as const)
  test(`LC-17 ${kind} link is exactly once and retains native history, ownership and designated actions`, async () => {
    const f = await fixture(kind),
      c = await input(f),
      before = await readActivity(f.p, f.a.id),
      native = await snapshot([
        "lead_candidates",
        "lead_events",
        "opportunities",
        "opportunity_events",
        "projects",
      ]);
    const [saved, replay] = await Promise.all([
      linkSalesFollowup(f.p, f.a.id, c),
      linkSalesFollowup(f.p, f.a.id, c),
    ]);
    assert.deepEqual(saved.receipt, replay.receipt);
    assert.notEqual(saved.replayed, replay.replayed);
    assert.deepEqual(
      await snapshot([
        "lead_candidates",
        "lead_events",
        "opportunities",
        "opportunity_events",
        "projects",
      ]),
      native,
    );
    const d = await readSalesFollowup(f.p, f.a.id),
      a = await readActivity(f.p, f.a.id);
    assert.equal(a.owner_id, before.owner_id);
    assert.equal(a.due_at, before.due_at);
    assert.equal(a.status, before.status);
    assert.equal(a.version, 2);
    assert.equal(a.links.length, 2);
    assert.equal(d.existing[0].id, f.dest.id);
    assert.equal(d.history.length, 1);
    assert.equal(d.ready, false);
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.audit_events WHERE operation_id=$1",
          [c.operation_id],
        )
      )[0].n,
      1,
    );
    assert.deepEqual(await readOperation(f.p, c.operation_id), saved.receipt);
    if (kind === "Lead") {
      assert.equal((await readLead(f.p, f.dest.id)).next_activity, null);
      await planLeadAction(f.p, f.dest.id, {
        ...crmBase(),
        expected_version: 1,
        activity_id: f.a.id,
        new_action: null,
      });
      assert.equal((await readLead(f.p, f.dest.id)).next_activity?.id, f.a.id);
      const conversion = leadConvert(2, f.a.id);
      await convertLead(f.p, f.dest.id, conversion);
      const deal = await readOpportunity(f.p, conversion.opportunity_id);
      assert.equal(deal.next_activity?.id, f.a.id);
      assert.ok(deal.actions.some((a) => a.id === f.a.id));
    }
    await activityCommand(
      f.p,
      f.a.id,
      { ...crmBase(), expected_version: 2, outcome: "SYN review completed" },
      "complete",
    );
    assert.deepEqual(await readOperation(f.p, c.operation_id), saved.receipt);
    assert.deepEqual(
      (await linkSalesFollowup(f.p, f.a.id, c)).receipt,
      saved.receipt,
    );
  });
test("LC-17 restricted completed source creates a separate reviewed Internal action and preserves exact original", async () => {
  const f = await fixture("Lead", true);
  await activityCommand(
    f.p,
    f.a.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN technical follow-up completed",
    },
    "complete",
  );
  const original = await readActivity(f.p, f.a.id),
    d = await readSalesFollowup(f.p, f.a.id);
  assert.equal(d.ready, false);
  assert.equal(d.can_review, true);
  const c = {
    ...crmBase(),
    id: randomUUID(),
    expected_version: 2,
    source_hash: d.source_hash,
    summary: "SYN reviewed customer request for internal Sales",
    due_at: "2031-11-01T00:00:00.000Z",
    wording_reviewed: true,
  };
  const saved = await createSalesReview(f.p, f.a.id, c);
  assert.deepEqual(
    (await createSalesReview(f.p, f.a.id, c)).receipt,
    saved.receipt,
  );
  assert.deepEqual(await readActivity(f.p, f.a.id), original);
  const review = await readSalesFollowup(f.p, c.id);
  assert.equal(review.activity.owner_id, f.p.actor_id);
  assert.equal(review.activity.access_class, "Internal");
  assert.equal(review.activity.kind, "RelationshipReview");
  assert.equal(review.activity.status, "Open");
  assert.equal(review.ready, true);
  assert.equal(review.origin?.access, "Available");
  if (review.origin?.access === "Available")
    assert.equal(review.origin.snapshot.version, 2);
  assert.deepEqual(review.activity.links, [
    { object_type: "Project", object_id: f.project.id },
  ]);
  assert.deepEqual(await readOperation(f.p, c.operation_id), saved.receipt);
  const f2 = { ...f, a: { ...f.a, id: c.id } };
  await linkSalesFollowup(f.p, c.id, await input(f2));
  assert.deepEqual(await readActivity(f.p, f.a.id), original);
});
test("LC-17 stale source, stale target, unreviewed wording and a second Sales destination have no effects", async () => {
  const f = await fixture(),
    c = await input(f),
    before = await snapshot();
  for (const patch of [
    { expected_version: 99 },
    { source_hash: "0".repeat(64) },
    { expected_destination_version: 99 },
    { existing_checked: false },
  ]) {
    await assert.rejects(linkSalesFollowup(f.p, f.a.id, { ...c, ...patch }));
    assert.deepEqual(await snapshot(), before);
  }
  await assert.rejects(
    createSalesReview(f.p, f.a.id, {
      ...crmBase(),
      id: randomUUID(),
      expected_version: 1,
      source_hash: c.source_hash,
      summary: "SYN separate review",
      due_at: f.a.due_at,
      wording_reviewed: false,
    }),
  );
  assert.deepEqual(await snapshot(), before);
  await linkSalesFollowup(f.p, f.a.id, c);
  const linked = await snapshot();
  await assert.rejects(
    linkSalesFollowup(f.p, f.a.id, { ...c, ...crmBase(), expected_version: 2 }),
  );
  assert.deepEqual(await snapshot(), linked);
});
test("LC-17 incompatible site, closed Lead and non-owner are refused without changing source", async () => {
  const f = await fixture(),
    c = await input(f),
    wrong = {
      ...leadCreate(),
      organisation_id: CRM.org,
      company_id: CRM.company,
      site_id: null,
      primary_person_id: null,
    };
  await createLead(f.p, wrong);
  const before = await snapshot();
  await assert.rejects(
    linkSalesFollowup(f.p, f.a.id, { ...c, destination_id: wrong.id }),
  );
  assert.deepEqual(await snapshot(), before);
  await changeLead(f.p, f.dest.id, {
    ...crmBase(),
    expected_version: 1,
    action: "disqualify",
    note: "SYN no current need",
  });
  const closed = await snapshot();
  await assert.rejects(
    linkSalesFollowup(f.p, f.a.id, { ...c, expected_destination_version: 2 }),
  );
  assert.deepEqual(await snapshot(), closed);
  const observer = (await createSession("observer")).principal;
  await assert.rejects(
    linkSalesFollowup(observer, f.a.id, { ...c, ...crmBase() }),
  );
  assert.equal((await readActivity(f.p, f.a.id)).version, 1);
});
test("LC-17 current permission revocation hides source and blocks original recovery across nested reviews", async () => {
  const f = await fixture();
  const d = await readSalesFollowup(f.p, f.a.id);
  const make = async (id: string, version: number, hash: string) => {
    const c = {
      ...crmBase(),
      id: randomUUID(),
      expected_version: version,
      source_hash: hash,
      summary: "SYN reviewed Internal need",
      due_at: f.a.due_at,
      wording_reviewed: true,
    };
    await createSalesReview(f.p, id, c);
    return c;
  };
  const first = await make(f.a.id, 1, d.source_hash),
    firstRead = await readSalesFollowup(f.p, first.id),
    second = await make(first.id, 1, firstRead.source_hash);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [f.p.workspace_id, f.p.actor_id],
  );
  for (const id of [f.a.id, first.id, second.id])
    await assert.rejects(readSalesFollowup(f.p, id));
  await assert.rejects(readOperation(f.p, first.operation_id));
  await assert.rejects(readOperation(f.p, second.operation_id));
});
test("LC-17 late publication failure rolls back link, version, receipt and audit atomically", async () => {
  const f = await fixture(),
    c = await input(f),
    before = await snapshot();
  await database().query(
    "CREATE FUNCTION ppo.lc17_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN LC17 late failure' USING ERRCODE='P0001'; END $$; CREATE TRIGGER lc17_fail BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.lc17_fail()",
  );
  try {
    await assert.rejects(linkSalesFollowup(f.p, f.a.id, c), (e) =>
      String(e).includes("SYN LC17 late failure"),
    );
  } finally {
    await database().query(
      "DROP TRIGGER lc17_fail ON ppo.outbox_jobs; DROP FUNCTION ppo.lc17_fail()",
    );
  }
  assert.deepEqual(await snapshot(), before);
});

test("LC-17 a nested separate review cannot bypass lost access to its original Sales source", async () => {
  const f = await fixture();
  await linkSalesFollowup(f.p, f.a.id, await input(f));
  const make = async (id: string) => {
    const d = await readSalesFollowup(f.p, id),
      c = {
        ...crmBase(),
        id: randomUUID(),
        expected_version: d.activity.version,
        source_hash: d.source_hash,
        summary: "SYN separate customer need",
        due_at: f.a.due_at,
        wording_reviewed: true,
      };
    await createSalesReview(f.p, id, c);
    return c;
  };
  const first = await make(f.a.id),
    second = await make(first.id);
  const beforeRead = await readSalesFollowup(f.p, second.id);
  assert.equal(beforeRead.ready, true);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='crm.lead.read'",
    [f.p.workspace_id, f.p.actor_id],
  );
  const before = await snapshot();
  for (const c of [first, second]) {
    const d = await readSalesFollowup(f.p, c.id);
    assert.deepEqual(d.origin, { access: "Restricted" });
    assert.equal(d.ready, false);
    assert.equal(d.can_review, false);
    await assert.rejects(readOperation(f.p, c.operation_id));
  }
  await assert.rejects(
    createSalesReview(f.p, second.id, {
      ...crmBase(),
      id: randomUUID(),
      expected_version: beforeRead.activity.version,
      source_hash: beforeRead.source_hash,
      summary: "SYN blocked third review",
      due_at: f.a.due_at,
      wording_reviewed: true,
    }),
  );
  assert.deepEqual(await snapshot(), before);
});
