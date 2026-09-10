import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import {
  createLead,
  changeLead,
  planLeadAction,
  convertLead,
} from "../../src/crm/leads/service";
import { readLead, listLeads } from "../../src/crm/leads/reads";
import { readOpportunity } from "../../src/crm/reads";
import { activityCommand, readActivity } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { leadCreate, leadConvert } from "../helpers/leads";
import { CRM, crmBase, crmAction } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const counts = async () =>
  Promise.all(
    [
      "lead_candidates",
      "lead_events",
      "lead_conversions",
      "opportunities",
      "opportunity_events",
      "activities",
      "activity_links",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
      "business_identities",
    ].map(async (t) => [
      t,
      (await rows(`SELECT count(*)::int AS n FROM ppo.${t}`))[0].n,
    ]),
  );
test("LC-01/02/06 manual capture, note, completed history and independent-owner action survive one durable conversion", async () => {
  const p = await principal(),
    input = leadCreate();
  await createLead(p, input);
  await changeLead(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    action: "note",
    note: "SYN Original author note before qualification.",
  });
  const done = crmAction();
  await planLeadAction(p, input.id, {
    ...crmBase(),
    expected_version: 2,
    activity_id: null,
    new_action: done,
  });
  await activityCommand(
    p,
    done.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN Customer discussion completed",
    },
    "complete",
  );
  const other = await principal("observer");
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$2 AND capability IN ('crm.lead.read','crm.opportunity.read','activity.read','activity.edit','shared.read','shared.internal.read') ON CONFLICT DO NOTHING`,
    [other.actor_id, p.actor_id],
  );
  const next = {
    ...crmAction(other.actor_id),
    due_at: "2026-11-12T03:00:00.000Z",
    due_needed: false,
  };
  await planLeadAction(p, input.id, {
    ...crmBase(),
    expected_version: 3,
    activity_id: null,
    new_action: next,
  });
  const before = await readLead(p, input.id),
    beforeDone = await readActivity(p, done.id),
    beforeNext = await readActivity(p, next.id),
    command = leadConvert(4, next.id);
  const converted = await convertLead(p, input.id, command);
  const lead = await readLead(p, input.id),
    deal = await readOpportunity(p, command.opportunity_id);
  assert.equal(lead.status, "Converted");
  assert.equal(deal.stage_id, "Qualified");
  assert.equal(deal.owner_id, input.owner_id);
  assert.equal(deal.close_outcome, "Open");
  assert.equal(deal.actions.length, 2);
  assert.deepEqual(lead.events.slice(0, 4), before.events);
  assert.deepEqual(deal.source_lead?.events.slice(0, 4), before.events);
  for (const [id, prior] of [
    [done.id, beforeDone],
    [next.id, beforeNext],
  ] as const) {
    const a = await readActivity(p, id);
    assert.equal(a.version, prior.version);
    assert.equal(a.owner_id, prior.owner_id);
    assert.equal(a.due_at, prior.due_at);
    assert.equal(a.status, prior.status);
    assert.equal(a.outcome, prior.outcome);
    assert(a.links.some((l) => l.object_type === "Lead"));
    assert(a.links.some((l) => l.object_type === "Opportunity"));
  }
  assert.equal(deal.next_activity?.id, next.id);
  assert.equal((await listLeads(p)).items.length, 0);
  assert.equal(
    (await listLeads(p, { view: "Converted" })).items[0].id,
    input.id,
  );
  assert.deepEqual(
    await readOperation(p, command.operation_id),
    converted.receipt,
  );
  const fresh = await promisify(execFile)(process.execPath, [
    "--env-file=.env.local",
    "--import",
    "tsx",
    "--input-type=module",
    "-e",
    `import {createSession} from './src/platform/identity.ts';import {readLead} from './src/crm/leads/reads.ts';import {closeDatabase} from './src/platform/database.ts';const p=(await createSession('coordinator')).principal;console.log(JSON.stringify(await readLead(p,'${input.id}')));await closeDatabase();`,
  ]);
  assert.equal(JSON.parse(fresh.stdout).deal.id, command.opportunity_id);
});
test("LC-04/05 same-intent retries and competing intents commit exactly one linked deal", async () => {
  const p = await principal(),
    input = leadCreate();
  await createLead(p, input);
  const command = leadConvert(1);
  const results = await Promise.all([
    convertLead(p, input.id, command),
    convertLead(p, input.id, command),
  ]);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  const before = await counts();
  await assert.rejects(
    convertLead(p, input.id, {
      ...command,
      qualification_note: "Changed intent",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    convertLead(p, input.id, {
      ...command,
      operation_id: randomUUID(),
      opportunity_id: randomUUID(),
    }),
    code("VersionConflict"),
  );
  assert.deepEqual(await counts(), before);
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.lead_conversions"))[0].n,
    1,
  );
});
test("LC-05 failure after tentative deal/action insertion rolls back every effect", async () => {
  const p = await principal(),
    input = { ...leadCreate(), primary_person_id: null };
  await createLead(p, input);
  const before = await counts();
  await assert.rejects(
    convertLead(p, input.id, {
      ...leadConvert(1),
      primary_person_id: null,
      contact_unknown_reason: "SYN Contact requires identification",
    }),
    code("CRM_IDENTIFICATION_REQUIRED"),
  );
  assert.deepEqual(await counts(), before);
  assert.equal((await readLead(p, input.id)).status, "New");
});
test("LC-03/06 current permission, company and all-target checks precede reads and replay", async () => {
  const p = await principal(),
    input = leadCreate();
  await createLead(p, input);
  for (const profile of ["systems", "second-company", "other-workspace"]) {
    const other = await principal(profile);
    await assert.rejects(readLead(other, input.id));
    await assert.rejects(convertLead(other, input.id, leadConvert(1)));
  }
  const command = leadConvert(1);
  await convertLead(p, input.id, command);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.lead.convert'",
    [p.actor_id],
  );
  await assert.rejects(convertLead(p, input.id, command));
  await assert.rejects(readOperation(p, command.operation_id));
  const a = command.new_action!.id;
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.lead.read'",
    [p.actor_id],
  );
  await assert.rejects(readActivity(p, a));
  assert.equal(
    (await readOpportunity(p, command.opportunity_id)).source_lead,
    null,
  );
});
test("LC-07 archive, disqualify and reopen preserve history; converted source is immutable", async () => {
  const p = await principal(),
    input = leadCreate();
  await createLead(p, input);
  let version = 1;
  for (const action of ["archive", "unarchive", "disqualify", "reopen"]) {
    await changeLead(p, input.id, {
      ...crmBase(),
      expected_version: version++,
      action,
    });
  }
  assert.equal((await readLead(p, input.id)).events.length, 5);
  await convertLead(p, input.id, leadConvert(5));
  await assert.rejects(
    changeLead(p, input.id, {
      ...crmBase(),
      expected_version: 6,
      action: "note",
      note: "Forbidden after conversion",
    }),
    code("LeadConflict"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.lead_candidates WHERE id=$1", [input.id]),
  );
});
test("LC-06 incompatible Activity site context blocks without a partial conversion", async () => {
  const p = await principal(),
    input = { ...leadCreate(), site_id: null };
  await createLead(p, input);
  await planLeadAction(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: crmAction(),
  });
  const before = await counts();
  await assert.rejects(
    convertLead(p, input.id, leadConvert(2)),
    code("LEAD_ACTIVITY_CONTEXT"),
  );
  assert.deepEqual(await counts(), before);
  const all = await listLeads(p, { sort: "Name", limit: "1" });
  assert.equal(all.items[0].id, input.id);
  assert.equal(CRM.company, input.company_id);
});

test("LC-04 two different concurrent conversion intents cannot create two deals", async () => {
  const p = await principal(),
    input = leadCreate();
  await createLead(p, input);
  const results = await Promise.allSettled([
    convertLead(p, input.id, leadConvert(1)),
    convertLead(p, input.id, leadConvert(1)),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(results.filter((x) => x.status === "rejected").length, 1);
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.lead_conversions"))[0].n,
    1,
  );
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.opportunities"))[0].n,
    1,
  );
});

test("LC-08 ordered pagination keeps signed filter context and visits each lead once", async () => {
  const p = await principal();
  for (const title of ["SYN C enquiry", "SYN A enquiry", "SYN B enquiry"])
    await createLead(p, { ...leadCreate(), title });
  for (const sort of ["Newest", "Oldest", "Name"]) {
    const ids: string[] = [],
      titles: string[] = [];
    let cursor: string | null = null;
    do {
      const result = await listLeads(p, {
        sort,
        limit: "1",
        ...(cursor ? { cursor } : {}),
      });
      ids.push(...result.items.map((l) => l.id));
      titles.push(...result.items.map((l) => l.title));
      cursor = result.next_cursor;
      if (cursor)
        await assert.rejects(
          listLeads(p, { sort, limit: "1", cursor, q: "Changed filter" }),
        );
    } while (cursor);
    assert.equal(new Set(ids).size, 3);
    assert.equal(ids.length, 3);
    if (sort === "Name")
      assert.deepEqual(titles, [
        "SYN A enquiry",
        "SYN B enquiry",
        "SYN C enquiry",
      ]);
  }
});
