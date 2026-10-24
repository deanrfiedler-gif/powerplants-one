import { CRM } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { readOperation } from "../../src/shared/receipts";
import {
  readAssessment,
  saveAssessment,
  readAssessmentOutput,
} from "../../src/estimating/nursery-automation/assessment-service";
import {
  readNursery,
  saveNursery,
} from "../../src/estimating/nursery-automation/service";
import {
  assessmentFixture,
  assessmentCommand,
} from "../helpers/nursery-assessment";
import { nurseryFixture, nurseryCommand } from "../helpers/nursery-automation";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (wanted: string) => (e: unknown) =>
  (e as { code: string }).code === wanted;
test("N2 exact source, computed output bytes and immutable history survive successors and reconnect", async () => {
  const f = await assessmentFixture(),
    input = { ...assessmentCommand(f.detail), proposal: f.input };
  const first = await saveAssessment(f.p, f.id, input),
    d = await readAssessment(f.p, f.id);
  assert.equal(d.selected?.result.scenarios[0].good_output?.numerator, "13680");
  const q = { revision_id: d.selected!.id, kind: "study" },
    out = await readAssessmentOutput(f.p, f.id, q);
  assert.equal(out.hash, d.selected!.outputs.study.hash);
  const next = assessmentCommand(d);
  next.proposal.name = "SYN successor";
  await saveAssessment(f.p, f.id, next);
  assert.deepEqual(
    (await saveAssessment(f.p, f.id, input)).receipt,
    first.receipt,
  );
  assert.deepEqual(await readOperation(f.p, input.operation_id), first.receipt);
  await closeDatabase();
  const p = (await createSession("coordinator")).principal;
  assert.deepEqual(await readAssessmentOutput(p, f.id, q), out);
  assert.equal(
    (await readAssessment(p, f.id, { revision_id: d.selected!.id })).can_edit,
    false,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.nursery_assessment_revisions SET reason='changed' WHERE id=$1",
      [d.selected!.id],
    ),
  );
  await assert.rejects(
    saveAssessment(p, f.id, { ...input, reason: "changed original" }),
    code("OperationConflict"),
  );
  const current = await readNursery(p, f.id);
  await saveNursery(p, f.id, nurseryCommand(current));
  assert.equal((await readAssessment(p, f.id)).source_changed, true);
  assert.deepEqual(
    (await saveAssessment(p, f.id, input)).receipt,
    first.receipt,
  );
  assert.deepEqual(await readAssessmentOutput(p, f.id, q), out);
  await assert.rejects(
    saveAssessment(p, f.id, {
      ...input,
      operation_id: randomUUID(),
      expected_workspace_version: (await readAssessment(p, f.id)).workspace
        .version,
    }),
    code("NurseryAssessmentBasisChanged"),
  );
});
test("N2 concurrent acceptance, source/schema rejection and live authorization are atomic", async () => {
  const f = await assessmentFixture(),
    input = { ...assessmentCommand(f.detail), proposal: f.input };
  const settled = await Promise.allSettled([
    saveAssessment(f.p, f.id, input),
    saveAssessment(f.p, f.id, { ...input, operation_id: randomUUID() }),
  ]);
  assert.equal(settled.filter((r) => r.status === "fulfilled").length, 1);
  const d = await readAssessment(f.p, f.id),
    fresh = assessmentCommand(d),
    q = { revision_id: d.selected!.id, kind: "clarifications" };
  await assert.rejects(
    saveAssessment(f.p, f.id, { ...fresh, rule_edition: "retired" }),
    code("NurseryRulesChanged"),
  );
  await assert.rejects(
    saveAssessment(f.p, f.id, {
      ...fresh,
      proposal: { ...fresh.proposal, scenarios: [] },
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    saveAssessment(f.p, f.id, {
      ...fresh,
      proposal: { ...fresh.proposal, price: "100" },
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    saveAssessment(f.p, f.id, { ...fresh, option_id: randomUUID() }),
  );
  const other = (await createSession("second-company")).principal;
  await assert.rejects(readAssessment(other, f.id));
  await assert.rejects(readAssessmentOutput(other, f.id, q));
  await assert.rejects(saveAssessment(other, f.id, input));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [f.p.actor_id],
  );
  assert.equal((await readAssessment(f.p, f.id)).can_edit, false);
  await assert.rejects(saveAssessment(f.p, f.id, input));
  await assert.rejects(readOperation(f.p, input.operation_id));
  assert.ok((await readAssessmentOutput(f.p, f.id, q)).html);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'",
    [f.p.actor_id],
  );
  await assert.rejects(readAssessment(f.p, f.id));
  await assert.rejects(readAssessmentOutput(f.p, f.id, q));
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int AS n FROM ppo.nursery_assessment_revisions",
      )
    ).rows[0].n,
    1,
  );
});
test("0117 preserves populated 0116 Nursery evidence, all grants/seeds and original ledger; replay is inert", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(116);
  await seed(116);
  const f = await nurseryFixture();
  await saveNursery(f.p, f.id, {
    ...nurseryCommand(f.detail),
    proposal: f.proposal,
  });
  const rows = async (table: string) =>
    (await database().query("SELECT * FROM " + table + " ORDER BY 1")).rows;
  const nursery = await rows("ppo.nursery_discovery_revisions"),
    grants = await rows("ppo.permission_grants"),
    seeds = await rows("ppo.seed_receipts"),
    ledger = await rows("public.ppo_migrations");
  await assert.rejects(
    readAssessment(f.p, f.id),
    code("NurseryAssessmentUnavailable"),
  );
  await migrate();
  await seed();
  assert.deepEqual(await rows("ppo.nursery_discovery_revisions"), nursery);
  assert.deepEqual(await rows("ppo.permission_grants"), grants);
  assert.deepEqual(await rows("ppo.seed_receipts"), seeds);
  const after = await rows("public.ppo_migrations");
  assert.deepEqual(after.slice(0, ledger.length), ledger);
  assert.deepEqual(
    after.slice(ledger.length).map((r) => r.version),
    [117, 118],
  );
  assert.equal((await readAssessment(f.p, f.id)).selected, null);
  await migrate();
  await seed();
  assert.deepEqual(await rows("public.ppo_migrations"), after);
  assert.deepEqual(await rows("ppo.nursery_discovery_revisions"), nursery);
});

test("N2 save and receipt recovery require edit on the exact source site, not only the opportunity",async()=>{
 const p=(await createSession("coordinator")).principal,site2="70000000-0000-4000-8000-000000000002";
 await database().query("INSERT INTO ppo.site_parties(id,workspace_id,created_by,updated_by,company_id,site_id,organisation_id,role,valid_from) VALUES($1,$2,$3,$3,$4,$5,$6,'BillingParty','2026-01-01')",[randomUUID(),CRM.workspace,p.actor_id,CRM.company,site2,CRM.org]);
 const discovery=discoveryInput();discovery.scope={...discovery.scope,site_id:site2,facility_ids:[],equipment_ids:[],systems:[{tag:"ProductSupply",facility_ids:[]}]};
 const f=await nurseryFixture(false,discovery);await saveNursery(p,f.id,{...nurseryCommand(f.detail),proposal:f.proposal});
 const d=await readAssessment(p,f.id),input=assessmentCommand(d);await saveAssessment(p,f.id,input);
 await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",[p.actor_id]);
 await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from) VALUES($1,$2,$3,'estimating.edit','Site',$4,$4,'2026-01-01')",[CRM.workspace,p.actor_id,CRM.company,CRM.site]);
 const read=await readAssessment(p,f.id);assert.equal(read.has_edit_permission,true);assert.equal(read.can_edit,false);
 await assert.rejects(saveAssessment(p,f.id,input),code("RecordUnavailable"));
 await assert.rejects(saveAssessment(p,f.id,assessmentCommand(read)),code("RecordUnavailable"));
 await assert.rejects(readOperation(p,input.operation_id),code("RecordUnavailable"));
});
