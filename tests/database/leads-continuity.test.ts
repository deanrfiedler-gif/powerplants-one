import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  createLead,
  planLeadAction,
  convertLead,
} from "../../src/crm/leads/service";
import { readLead } from "../../src/crm/leads/reads";
import { readOpportunity } from "../../src/crm/reads";
import { readActivity, activityCommand } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { leadCreate, leadConvert } from "../helpers/leads";
import { CRM, crmBase, crmAction } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const counts = async () =>
  Promise.all(
    [
      "opportunities",
      "lead_events",
      "lead_conversions",
      "activities",
      "activity_links",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ].map(
      async (table) =>
        (await database().query(`SELECT count(*)::int AS n FROM ppo.${table}`))
          .rows[0].n,
    ),
  );
async function fixture() {
  const p = (await createSession("coordinator")).principal;
  const input = { ...leadCreate(), site_id: null },
    action = crmAction();
  await createLead(p, input);
  await planLeadAction(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: action,
  });
  const command = {
    ...leadConvert(2),
    new_action: {
      ...crmAction(),
      kind: "RelationshipReview",
      summary:
        "SYN Review the original enquiry follow-up at the newly identified site",
      due_at: "2031-11-13T03:00:00.000Z",
      due_needed: false,
    },
    source_activity_review: [
      {
        id: action.id,
        version: 1,
        disposition: "Retain",
        reason:
          "SYN Review the unresolved customer questions using the newly identified site.",
      },
    ],
  };
  return { p, input, action, command };
}
test("LC-11 site resolution preserves source obligations and exact concurrent original recovery", async () => {
  const f = await fixture();
  const before = await readActivity(f.p, f.action.id);
  const [first, retry] = await Promise.all([
    convertLead(f.p, f.input.id, f.command),
    convertLead(f.p, f.input.id, f.command),
  ]);
  assert.deepEqual(retry.receipt, first.receipt);
  assert.deepEqual(
    await readOperation(f.p, f.command.operation_id),
    first.receipt,
  );
  assert.deepEqual(await readActivity(f.p, f.action.id), before);
  const lead = await readLead(f.p, f.input.id),
    deal = await readOpportunity(f.p, f.command.opportunity_id);
  assert.equal(lead.status, "Converted");
  assert.equal(deal.stage_id, "Discovery");
  assert.equal(deal.site_id, CRM.site);
  assert.equal(deal.next_activity?.id, f.command.new_action.id);
  assert.equal(deal.next_activity?.owner_id, f.input.owner_id);
  assert.equal(deal.next_activity?.kind, "RelationshipReview");
  assert.deepEqual(
    deal.actions.map((a) => a.id),
    [f.command.new_action.id],
  );
  assert.equal(lead.conversion_review?.state, "Available");
  assert.equal(lead.conversion_review?.retained[0].id, f.action.id);
  assert.equal(
    lead.conversion_review?.retained[0].reason,
    f.command.source_activity_review[0].reason,
  );
  assert.deepEqual(deal.source_lead?.conversion_review, lead.conversion_review);
  const beforeRetry = await counts();
  assert.deepEqual(
    (await convertLead(f.p, f.input.id, f.command)).receipt,
    first.receipt,
  );
  assert.deepEqual(await counts(), beforeRetry);
  await assert.rejects(
    convertLead(f.p, f.input.id, {
      ...f.command,
      qualification_note: "SYN different intent",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    convertLead(f.p, f.input.id, {
      ...f.command,
      operation_id: randomUUID(),
      opportunity_id: randomUUID(),
    }),
    code("VersionConflict"),
  );
});
test("LC-11 exact membership and activity versions fence reviewed conversion without partial effects", async () => {
  const f = await fixture(),
    before = await counts();
  for (const source_activity_review of [
    [],
    [{ ...f.command.source_activity_review[0], id: randomUUID() }],
    [{ ...f.command.source_activity_review[0], version: 2 }],
  ]) {
    await assert.rejects(
      convertLead(f.p, f.input.id, { ...f.command, source_activity_review }),
      code("LeadActivityComparisonConflict"),
    );
    assert.deepEqual(await counts(), before);
  }
  await activityCommand(
    f.p,
    f.action.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN Completed original customer call",
    },
    "complete",
  );
  await assert.rejects(
    convertLead(f.p, f.input.id, f.command),
    code("LeadActivityComparisonConflict"),
  );
  const updated = {
    ...f.command,
    source_activity_review: [
      { ...f.command.source_activity_review[0], version: 2 },
    ],
  };
  await convertLead(f.p, f.input.id, updated);
  assert.equal(
    (await readLead(f.p, f.input.id)).conversion_review?.retained[0]
      .current_status,
    "Completed",
  );
});
test("LC-11 retained obligations need an owned dated relationship review and cannot evade compatible carrying", async () => {
  const f = await fixture(),
    before = await counts();
  for (const new_action of [
    { ...f.command.new_action, due_at: null, due_needed: true },
    {
      ...f.command.new_action,
      owner_id: "30000000-0000-4000-8000-000000000002",
    },
    { ...f.command.new_action, kind: "CustomerContact" },
  ]) {
    await assert.rejects(
      convertLead(f.p, f.input.id, { ...f.command, new_action }),
      code("LEAD_REVIEW_ACTION_REQUIRED"),
    );
    assert.deepEqual(await counts(), before);
  }
  await assert.rejects(
    convertLead(f.p, f.input.id, {
      ...f.command,
      site_id: null,
      site_unknown_reason: "SYN Still unknown",
    }),
    code("LEAD_ACTIVITY_CONTEXT"),
  );
  await assert.rejects(
    convertLead(f.p, f.input.id, {
      ...f.command,
      source_activity_review: [
        {
          ...f.command.source_activity_review[0],
          disposition: "Carry",
          reason: null,
        },
      ],
    }),
    code("LEAD_ACTIVITY_CONTEXT"),
  );
  assert.deepEqual(await counts(), before);
});
test("LC-11 current source access governs conversion, history disclosure and original recovery", async () => {
  const f = await fixture();
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
    [f.p.actor_id],
  );
  const before = await counts();
  await assert.rejects(convertLead(f.p, f.input.id, f.command));
  assert.deepEqual(await counts(), before);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='activity.read'",
    [f.p.actor_id],
  );
  await convertLead(f.p, f.input.id, f.command);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
    [f.p.actor_id],
  );
  const lead = await readLead(f.p, f.input.id);
  assert.deepEqual(lead.conversion_review, {
    state: "Restricted",
    retained: [],
    review_activity: null,
  });
  await assert.rejects(readOperation(f.p, f.command.operation_id));
  await assert.rejects(convertLead(f.p, f.input.id, f.command));
});
test("LC-11 a late outbox failure rolls back the Deal, review activity, links, source evidence and receipt", async () => {
  const f = await fixture(),
    before = await counts();
  await database().query(
    "CREATE FUNCTION ppo.fail_lead_review() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='LeadConverted' THEN RAISE EXCEPTION 'SYN late conversion failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_lead_review BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.fail_lead_review()",
  );
  await assert.rejects(convertLead(f.p, f.input.id, f.command));
  assert.deepEqual(await counts(), before);
  assert.equal((await readLead(f.p, f.input.id)).status, "New");
  await database().query(
    "DROP TRIGGER fail_lead_review ON ppo.outbox_jobs; DROP FUNCTION ppo.fail_lead_review()",
  );
  await convertLead(f.p, f.input.id, f.command);
});
