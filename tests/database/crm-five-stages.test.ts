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
// cutover is separate, so nothing in the application creates a five-stage deal yet.
// These cases therefore exercise the database objects directly. Every write goes
// through one transaction because the event chain and per-version event triggers are
// DEFERRABLE INITIALLY DEFERRED and are only meaningful at commit.
// SA-03 to SA-06 and SA-07 to SA-10 and SA-12 are not here: the movement cases need
// an OpportunityStageChanged record_snapshot that matches the row exactly, and the
// rest are browser and conversion concerns belonging to the code cutover.

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
     five, from, to, seed.next_activity_id, note, type === "OpportunityCreated" ? null : {}],
  );
  return id;
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
