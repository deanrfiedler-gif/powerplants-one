import { changeDealStage } from "../../src/crm/refinements";
import { readOpportunity } from "../../src/crm/reads";
import { crmBase } from "../helpers/crm";
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { transaction, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { crmCreate } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

// Increment A (issue #143) is the catalogue and the movement rule only; the code
// creation cutover is separate, so five-stage fixtures are constructed directly.
// These cases therefore exercise the database objects directly. Every write goes
// through one transaction because the event chain and per-version event triggers are
// DEFERRABLE INITIALLY DEFERRED and are only meaningful at commit.
// SA-07 to SA-10 and SA-12 are not here: they are browser and conversion concerns
// belonging to the code cutover.

type Row = Record<string, unknown>;
type Context = { seed: Row; five: string };
type Client = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Row[] }> };
const rows = async (sql: string, values: unknown[] = []) =>
  (await transaction(async (c: Client) => c.query(sql, values))).rows;
const refusal = async (work: (c: Client) => Promise<unknown>) => {
  try {
    await transaction(work);
    return null;
  } catch (error) {
    return (error as Error).message.split("\n")[0];
  }
};

let sequence = 900;
const context = async () => {
  const p = (await createSession("coordinator")).principal;
  await createOpportunity(p, crmCreate());
  const [seed] = await rows("SELECT * FROM ppo.opportunities LIMIT 1");
  const [five] = await rows(
    "SELECT id FROM ppo.crm_pipeline_definitions WHERE definition_key='SyntheticFiveStage'",
  );
  return { seed, five: five.id as string };
};

// A five-stage deal as the cutover will eventually write one: qualification evidence
// already present, because under the accepted model it arrives with the deal.
const deal =
  (
    ctx: Context,
    stage: string,
    note: string | null = "SYN qualified in Leads",
  ) =>
  async (c: Client) => {
    const { seed, five } = ctx;
    const id = randomUUID();
    const reference = `SYN-PPO-OPP-000${++sequence}`;
    await c.query(
      "INSERT INTO ppo.business_identities(workspace_id,id,object_type,display_number,synthetic) VALUES($1,$2,'Opportunity',$3,true)",
      [seed.workspace_id, id, reference],
    );
    await c.query(
      `INSERT INTO ppo.opportunities(id,workspace_id,company_id,display_number,version,synthetic,created_by,updated_by,
        organisation_id,site_id,primary_person_id,site_unknown_reason,contact_unknown_reason,title,need_summary,
        source_channel,source_basis,owner_id,pipeline_definition_id,stage_id,close_outcome,next_activity_id,
        qualification_note,scope_details,created_at,updated_at,stage_entered_at)
       VALUES($1,$2,$3,$4,1,true,$5,$5,$6,$7,$8,$9,$10,'SYN five-stage probe','SYN five-stage need',
        $11,$12,$13,$14,$15,'Open',$16,$17,'{}'::jsonb,now(),now(),now())`,
      [id, seed.workspace_id, seed.company_id, reference, seed.created_by, seed.organisation_id,
       seed.site_id, seed.primary_person_id, seed.site_unknown_reason, seed.contact_unknown_reason,
       seed.source_channel, seed.source_basis, seed.owner_id, five, stage, seed.next_activity_id, note],
    );
    // organisation_id and opportunity_id on activity_links are generated columns.
    await c.query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Opportunity',$4)",
      [seed.workspace_id, seed.company_id, seed.next_activity_id, id],
    );
    await event(c, ctx, id, "OpportunityCreated", null, stage, 1, note);
    return id;
  };

const event = async (
  c: Client,
  ctx: Context,
  opportunity: string,
  type: string,
  from: string | null,
  to: string,
  version: number,
  note: string | null = "SYN qualified in Leads",
  snapshot: unknown = null,
) => {
  const { seed, five } = ctx;
  const id = randomUUID();
  await c.query(
    "INSERT INTO ppo.business_identities(workspace_id,id,object_type,synthetic) VALUES($1,$2,'OpportunityEvent',true)",
    [seed.workspace_id, id],
  );
  await c.query(
    `INSERT INTO ppo.opportunity_events(id,workspace_id,company_id,opportunity_id,version,synthetic,created_by,updated_by,
      operation_id,opportunity_version,event_type,pipeline_definition_id,from_stage,to_stage,next_activity_id,
      reason,need_summary,qualification_note,record_snapshot,created_at,updated_at)
     VALUES($1,$2,$3,$4,1,true,$5,$5,$6,$7,$8,$9,$10,$11,$12,'SYN probe','SYN five-stage need',$13,$14,now(),now())`,
    [id, seed.workspace_id, seed.company_id, opportunity, seed.created_by, randomUUID(), version, type,
     five, from, to, seed.next_activity_id, note, snapshot],
  );
  return id;
};

// One stage movement, written as the application will write it: the row and its event
// together, next activity unchanged, and a record_snapshot the refinement guard in
// 0017 accepts - it compares the event's snapshot to ppo.crm_record_snapshot(NEW)
// field for field.
const move =
  (ctx: Context, id: string, from: string, to: string, version: number) =>
  async (c: Client) => {
    await c.query(
      "UPDATE ppo.opportunities SET stage_id=$1,stage_entered_at=clock_timestamp(),version=$2,updated_at=clock_timestamp() WHERE workspace_id=$3 AND id=$4",
      [to, version, ctx.seed.workspace_id, id],
    );
    const [row] = (await c.query(
      "SELECT ppo.crm_record_snapshot(o) AS snapshot FROM ppo.opportunities o WHERE workspace_id=$1 AND id=$2",
      [ctx.seed.workspace_id, id],
    )).rows;
    await event(c, ctx, id, "OpportunityStageChanged", from, to, version, "SYN qualified in Leads", row.snapshot);
  };

test("SA-01 the five-stage catalogue exists and the I1 definition is unmodified", async () => {
  await createSession("coordinator");
  assert.deepEqual(
    (await rows(
      `SELECT d.definition_key, s.stage_id, s.ordinal FROM ppo.crm_stage_definitions s
       JOIN ppo.crm_pipeline_definitions d ON d.id=s.pipeline_definition_id
       ORDER BY d.definition_key, s.ordinal`,
    )).map((r) => `${String(r.definition_key)}:${String(r.stage_id)}:${String(r.ordinal)}`),
    [
      "SyntheticEnquiryI1:Enquiry:1",
      "SyntheticEnquiryI1:Qualified:2",
      "SyntheticFiveStage:Discovery:1",
      "SyntheticFiveStage:Scoping:2",
      "SyntheticFiveStage:Quoting:3",
      "SyntheticFiveStage:Negotiation:4",
      "SyntheticFiveStage:Closing:5",
    ],
  );
});

test("SA-02 creation lands at the first stage; any other stage is refused with no state change", async () => {
  const ctx = await context();
  const before = (await rows("SELECT count(*)::int AS n FROM ppo.opportunities"))[0].n;
  assert.equal(await refusal(deal(ctx, "Scoping")), "Create only at the first stage");
  assert.equal(await refusal(deal(ctx, "Closing")), "Create only at the first stage");
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.opportunities"))[0].n, before);
  assert.equal(await refusal(deal(ctx, "Discovery")), null);
  assert.equal(
    (await rows("SELECT stage_id FROM ppo.opportunities WHERE title='SYN five-stage probe'"))[0].stage_id,
    "Discovery",
  );
});

test("SA-02/\u00a74.3 a five-stage deal must carry its qualification evidence at every stage", async () => {
  const ctx = await context();
  const message = await refusal(deal(ctx, "Discovery", null));
  assert.match(String(message), /opportunities_check2/);
});

test("SA-03 forward one stage is accepted and forward two is refused", async () => {
  const ctx = await context();
  const id = (await transaction(deal(ctx, "Discovery"))) as string;
  assert.equal(await refusal(move(ctx, id, "Discovery", "Quoting", 2)), "Unsupported opportunity progression");
  assert.equal(await refusal(move(ctx, id, "Discovery", "Scoping", 2)), null);
  assert.equal((await rows("SELECT stage_id FROM ppo.opportunities WHERE id=$1", [id]))[0].stage_id, "Scoping");
});

test("SA-04 backward movement to any lower stage is accepted", async () => {
  const ctx = await context();
  const id = (await transaction(deal(ctx, "Discovery"))) as string;
  let version = 1;
  for (const [from, to] of [["Discovery", "Scoping"], ["Scoping", "Quoting"], ["Quoting", "Negotiation"], ["Negotiation", "Closing"]])
    assert.equal(await refusal(move(ctx, id, from, to, ++version)), null, `${from} to ${to}`);
  assert.equal(await refusal(move(ctx, id, "Closing", "Scoping", ++version)), null, "Closing to Scoping");
  assert.equal((await rows("SELECT stage_id FROM ppo.opportunities WHERE id=$1", [id]))[0].stage_id, "Scoping");
});

test("SA-05 a stage may be re-entered and history keeps both entries", async () => {
  const ctx = await context();
  const id = (await transaction(deal(ctx, "Discovery"))) as string;
  await transaction(move(ctx, id, "Discovery", "Scoping", 2));
  await transaction(move(ctx, id, "Scoping", "Discovery", 3));
  await transaction(move(ctx, id, "Discovery", "Scoping", 4));
  assert.deepEqual(
    (await rows("SELECT to_stage FROM ppo.opportunity_events WHERE opportunity_id=$1 ORDER BY opportunity_version", [id]))
      .map((r) => String(r.to_stage)),
    ["Discovery", "Scoping", "Discovery", "Scoping"],
  );
  const [state] = await rows(
    `SELECT o.stage_id, o.version, (SELECT max(opportunity_version) FROM ppo.opportunity_events WHERE opportunity_id=o.id) AS latest
     FROM ppo.opportunities o WHERE o.id=$1`, [id]);
  assert.equal(state.stage_id, "Scoping");
  assert.equal(state.version, state.latest);
});

test("SA-06 recorded events stay immutable", async () => {
  const ctx = await context();
  const id = (await transaction(deal(ctx, "Discovery"))) as string;
  await transaction(move(ctx, id, "Discovery", "Scoping", 2));
  const digest = async () =>
    (await rows("SELECT md5(string_agg(to_jsonb(e)::text,'' ORDER BY opportunity_version)) AS hash FROM ppo.opportunity_events e"))[0].hash;
  const before = await digest();
  assert.ok(await refusal(async (c) => c.query("UPDATE ppo.opportunity_events SET to_stage='Closing' WHERE opportunity_id=$1", [id])));
  assert.ok(await refusal(async (c) => c.query("DELETE FROM ppo.opportunity_events WHERE opportunity_id=$1", [id])));
  assert.equal(await digest(), before);
});

test("SA-11 Won and Lost are still refused", async () => {
  const ctx = await context();
  for (const stage of ["Won", "Lost"])
    assert.equal(await refusal(deal(ctx, stage)), "Stage is not defined for this pipeline", stage);
});

test("a recorded stage must match the opportunity it describes", async () => {
  const ctx = await context();
  const message = await refusal(async (c) => {
    const id = randomUUID();
    const reference = `SYN-PPO-OPP-000${++sequence}`;
    await c.query(
      "INSERT INTO ppo.business_identities(workspace_id,id,object_type,display_number,synthetic) VALUES($1,$2,'Opportunity',$3,true)",
      [ctx.seed.workspace_id, id, reference],
    );
    await c.query(
      `INSERT INTO ppo.opportunities(id,workspace_id,company_id,display_number,version,synthetic,created_by,updated_by,
        organisation_id,site_id,primary_person_id,site_unknown_reason,contact_unknown_reason,title,need_summary,
        source_channel,source_basis,owner_id,pipeline_definition_id,stage_id,close_outcome,next_activity_id,
        qualification_note,scope_details,created_at,updated_at,stage_entered_at)
       VALUES($1,$2,$3,$4,1,true,$5,$5,$6,$7,$8,$9,$10,'SYN five-stage probe','SYN five-stage need',
        $11,$12,$13,$14,'Discovery','Open',$15,'SYN qualified in Leads','{}'::jsonb,now(),now(),now())`,
      [id, ctx.seed.workspace_id, ctx.seed.company_id, reference, ctx.seed.created_by, ctx.seed.organisation_id,
       ctx.seed.site_id, ctx.seed.primary_person_id, ctx.seed.site_unknown_reason, ctx.seed.contact_unknown_reason,
       ctx.seed.source_channel, ctx.seed.source_basis, ctx.seed.owner_id, ctx.five, ctx.seed.next_activity_id],
    );
    await c.query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Opportunity',$4)",
      [ctx.seed.workspace_id, ctx.seed.company_id, ctx.seed.next_activity_id, id],
    );
    // The row is at Discovery; the event claims Closing.
    await event(c, ctx, id, "OpportunityCreated", null, "Closing", 1);
  });
  // Refused by check_opportunity_graph (0010), which requires the event at the row's
  // current version to match its stage. The invariant survived step 3 removing the
  // 'Enquiry' literal from the event CHECK, because it never lived there.
  assert.equal(message, "Exact opportunity event required for every version");
});

test("five-stage server commands preserve evidence, exact event time and original receipts", async () => {
  const ctx = await context();
  const p = (await createSession("coordinator")).principal;
  const id = (await transaction(deal(ctx, "Discovery"))) as string;
  const original = await readOpportunity(p, id);
  assert.equal(original.can_edit, true);
  assert.deepEqual(
    original.stages.map((s) => s.stage_id),
    ["Discovery", "Scoping", "Quoting", "Negotiation", "Closing"],
  );
  const command = (stage_id: string, expected_version: number) => ({
    ...crmBase(),
    expected_version,
    stage_id,
    qualification_note: null,
    identification_activity_id: null,
  });
  for (const target of ["Quoting", "Qualified", "Enquiry"]) {
    await assert.rejects(changeDealStage(p, id, { ...command(target, 1), qualification_note: target === "Qualified" ? "SYN other pipeline" : null }), {
      code: "CRM_PROGRESS_INVALID",
    });
    assert.equal((await readOpportunity(p, id)).version, 1);
  }
  let version = 1;
  for (const stage of [
    "Scoping",
    "Quoting",
    "Negotiation",
    "Closing",
    "Scoping",
    "Quoting",
  ]) {
    const intent = command(stage, version);
    const receipt = await changeDealStage(p, id, intent);
    const replay = await changeDealStage(p, id, intent);
    assert.deepEqual(replay.receipt, receipt.receipt);
    assert.equal(replay.replayed, true);
    const saved = await readOpportunity(p, id);
    assert.equal(saved.version, ++version);
    assert.equal(saved.stage_id, stage);
    assert.equal(saved.qualification_note, original.qualification_note);
    assert.equal(
      saved.identification_activity_id,
      original.identification_activity_id,
    );
    assert.equal(saved.owner_id, original.owner_id);
    assert.equal(saved.next_activity?.id, original.next_activity?.id);
    assert.equal(saved.events.length, version);
    assert.equal(
      (
        await rows(
          `SELECT o.stage_entered_at=e.created_at AS exact FROM ppo.opportunities o JOIN ppo.opportunity_events e ON e.workspace_id=o.workspace_id AND e.opportunity_id=o.id AND e.opportunity_version=o.version WHERE o.id=$1`,
          [id],
        )
      )[0].exact,
      true,
    );
  }
  assert.deepEqual(
    (await readOpportunity(p, id)).events.map((e) => e.to_stage),
    [
      "Discovery",
      "Scoping",
      "Quoting",
      "Negotiation",
      "Closing",
      "Scoping",
      "Quoting",
    ],
  );
  await assert.rejects(changeDealStage(p, id, command("Negotiation", 1)), {
    code: "VersionConflict",
  });
  const denied = (await createSession("assigned-technician")).principal;
  await assert.rejects(
    changeDealStage(denied, id, command("Negotiation", version)),
  );
  assert.equal((await readOpportunity(p, id)).version, version);
});
