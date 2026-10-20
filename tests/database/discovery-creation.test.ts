import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createHandover, commandHandover, readHandover } from "../../src/sales/handover-service";
import { emptyHandover } from "../../src/sales/handover-model";
import { bindEstimatingWorkspace, readEstimatingBinding, readWorkspaceSalesBriefs } from "../../src/sales/estimating-binding";
import { createDiscoveryWorkspace, previewDiscoveryCreate, previewDiscoveryChange } from "../../src/estimating/discovery-workspaces";
import { discoveryCreationOptions } from "../../src/estimating/discovery-creation-context";
import { readOperation } from "../../src/shared/receipts";
import { crmBase, crmDiscovery, CRM } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import { recoverSchema } from "../helpers/recover-schema";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) => (await database().query(sql, values)).rows;
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
const denied = (e: unknown) => [403, 404].includes((e as { status: number }).status);

async function estimator(p: Principal, label: string) {
  const actor_id = randomUUID();
  await rows("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active) VALUES($1,$2,'PPO-LocalSynthetic',$4,$3,true)", [actor_id, p.workspace_id, label, actor_id]);
  await rows(`INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,site_id,capability,scope_type,scope_id)
    SELECT workspace_id,$2,company_id,site_id,capability,scope_type,scope_id FROM ppo.permission_grants
    WHERE user_id=$1 AND valid_to IS NULL`, [p.actor_id, actor_id]);
  return { ...p, actor_id, display_name: label };
}
async function setup(brief = true) {
  const receiver = (await createSession("coordinator")).principal, opportunity = crmDiscovery();
  opportunity.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  opportunity.initial_action.due_needed = false;
  await createOpportunity(receiver, opportunity);
  const handover_id = randomUUID();
  if (brief) {
    await createHandover(receiver, { ...crmBase(), id: handover_id, opportunity_id: opportunity.id, kind: "Estimating" });
    await commandHandover(receiver, handover_id, { ...crmBase(), action: "Save", expected_version: 1,
      receiving_owner_id: receiver.actor_id, note: "SYN prepared brief", content: {
        ...emptyHandover(), problem: "SYN reported problem", outcome: "SYN customer outcome",
        included_scope: "SYN controls", exclusions: "None", assumptions: "None", unknowns: "SYN verify on discovery",
        requested_date: "2031-10-01", date_reason: "SYN request", next_activity_id: opportunity.initial_action.id,
      } });
    await commandHandover(receiver, handover_id, { ...crmBase(), action: "Submit", expected_version: 2, note: "SYN submit" });
    const submitted = await readHandover(receiver, handover_id);
    await commandHandover(receiver, handover_id, { ...crmBase(), action: "Accept", expected_version: 3,
      source_hash: submitted.record.source_hash, note: "SYN accepted by receiver" });
  }
  const creator = await estimator(receiver, "SYN Discovery creator"), owner = await estimator(receiver, "SYN Assigned estimator");
  return { receiver, creator, owner, opportunity, handover_id };
}
type Fixture = Awaited<ReturnType<typeof setup>>;
async function proposed(f: Fixture, legacy = false) {
  const options = await discoveryCreationOptions(f.creator, { opportunity_id: f.opportunity.id });
  const proposal = { opportunity_id: f.opportunity.id, discovery: discoveryInput(),
    ...(!legacy ? { creation: { owner_id: f.owner.actor_id, sales_brief: options.brief?.selection ?? null } } : {}) };
  const preview = await previewDiscoveryCreate(f.creator, proposal);
  return { ...crmBase(), ...proposal, id: randomUUID(), option_id: randomUUID(), revision_id: randomUUID(),
    expected_opportunity_version: preview.expected_opportunity_version, context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids };
}
async function countCreated(f: Fixture) {
  return (await rows("SELECT count(*)::int n FROM ppo.estimating_workspaces WHERE opportunity_id=$1", [f.opportunity.id]))[0].n;
}

test("reviewed creation keeps creator, accepted Sales receiver and assigned estimator distinct in one transaction", async () => {
  const f = await setup(), input = await proposed(f), before = await readHandover(f.receiver, f.handover_id);
  const created = await createDiscoveryWorkspace(f.creator, input);
  const g = (await rows("SELECT * FROM ppo.estimating_workspaces WHERE id=$1", [input.id]))[0];
  assert.equal(g.owner_id, f.owner.actor_id); assert.equal(g.created_by, f.creator.actor_id);
  const links = await rows("SELECT * FROM ppo.sales_estimating_bindings WHERE estimating_workspace_id=$1", [input.id]);
  assert.equal(links.length, 1); assert.equal(links[0].recorded_by, f.creator.actor_id);
  assert.equal(links[0].acceptance_event_id, input.creation!.sales_brief!.acceptance_event_id);
  assert.equal(links[0].selected_revision_id, input.revision_id);
  const { observed_at: beforeObserved, ...beforeState } = before;
  const { observed_at: afterObserved, ...afterState } = await readHandover(f.receiver, f.handover_id);
  assert.deepEqual(afterState, beforeState);
  assert.ok(Date.parse(afterObserved) >= Date.parse(beforeObserved));
  assert.equal((await readWorkspaceSalesBriefs(f.owner, input.id)).items.length, 1);
  const revision = (await rows("SELECT * FROM ppo.estimation_revisions WHERE id=$1", [input.revision_id]))[0];
  assert.deepEqual(revision.input, input.discovery);
  assert.ok(Object.values(revision.answer_attribution).every(a => (a as { actor_id: string }).actor_id === f.creator.actor_id));
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1", [input.operation_id]))[0].n, 1);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.outbox_jobs WHERE operation_id=$1", [input.operation_id]))[0].n, 1);
  assert.deepEqual((await createDiscoveryWorkspace(f.creator, input)).receipt, created.receipt);
  assert.deepEqual(await readOperation(f.creator, input.operation_id), created.receipt);
  await assert.rejects(createDiscoveryWorkspace(f.creator, { ...input, reason: "SYN changed retry" }), code("OperationConflict"));
  await assert.rejects(previewDiscoveryChange(f.creator, input.id, { kind: "Save", expected_version: 1,
    option_id: input.option_id, expected_revision_id: input.revision_id, discovery: input.discovery }), code("EstimatingOwnerRequired"));
});

test("no accepted brief supports assigned creation and legacy clients retain creator ownership and unchanged receipts", async () => {
  const f = await setup(false), input = await proposed(f);
  assert.equal(input.creation!.sales_brief, null);
  await createDiscoveryWorkspace(f.creator, input);
  assert.equal((await rows("SELECT owner_id FROM ppo.estimating_workspaces WHERE id=$1", [input.id]))[0].owner_id, f.owner.actor_id);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.sales_estimating_bindings"))[0].n, 0);
  const old = await setup(false), legacy = await proposed(old, true), created = await createDiscoveryWorkspace(old.creator, legacy);
  assert.equal((await rows("SELECT owner_id FROM ppo.estimating_workspaces WHERE id=$1", [legacy.id]))[0].owner_id, old.creator.actor_id);
  assert.deepEqual((await createDiscoveryWorkspace(old.creator, legacy)).receipt, created.receipt);
});

test("estimator choices and commit recheck active scoped authority without granting new access", async () => {
  const f = await setup(false), input = await proposed(f);
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'", [f.owner.actor_id]);
  const options = await discoveryCreationOptions(f.creator, { opportunity_id: f.opportunity.id });
  assert.ok(!options.estimators.some(u => u.id === f.owner.actor_id));
  assert.ok(options.estimators.some(u => u.id === f.creator.actor_id));
  await assert.rejects(createDiscoveryWorkspace(f.creator, input), denied);
  assert.equal(await countCreated(f), 0);
  await rows("UPDATE ppo.users SET active=false WHERE id=$1", [f.receiver.actor_id]);
  assert.ok(!(await discoveryCreationOptions(f.creator, { opportunity_id: f.opportunity.id })).estimators.some(u => u.id === f.receiver.actor_id));
});

test("stale accepted brief or explicit omission cannot silently become an unlinked workspace", async () => {
  const f = await setup(), input = await proposed(f);
  await assert.rejects(createDiscoveryWorkspace(f.creator, { ...input, creation: { ...input.creation, sales_brief: null } }), code("SalesBriefChanged"));
  await rows("UPDATE ppo.sites SET display_name='SYN changed Sales source',version=version+1 WHERE id=$1", [CRM.site]);
  // A fresh Discovery context still cannot rescue a stale Sales selection.
  await assert.rejects(previewDiscoveryCreate(f.creator, { opportunity_id: f.opportunity.id, discovery: input.discovery, creation: input.creation }), code("SalesBriefChanged"));
  assert.equal(await countCreated(f), 0);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.sales_estimating_bindings"))[0].n, 0);
});

test("concurrent creates produce one workspace and recovery still checks the creator's current access", async () => {
  const f = await setup(), input = await proposed(f);
  const concurrent = await Promise.allSettled([
    createDiscoveryWorkspace(f.creator, input),
    createDiscoveryWorkspace(f.creator, { ...input, ...crmBase(), id: randomUUID(), option_id: randomUUID(), revision_id: randomUUID() }),
  ]);
  assert.equal(concurrent.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(concurrent.filter(r => r.status === "rejected" && code("RelationshipConflict")(r.reason)).length, 1);
  assert.equal(await countCreated(f), 1);
  const winner = concurrent.find(r => r.status === "fulfilled"); assert.ok(winner?.status === "fulfilled");
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'", [f.creator.actor_id]);
  await assert.rejects(readOperation(f.creator, winner.value.receipt.operation_id), denied);
});

test("0113 preserves populated original links, receipts, grants and migration ledger across repeated upgrade", async () => {
  await recoverSchema(); await rows("DROP TABLE IF EXISTS public.ppo_migrations"); await migrate(109); await seed(109);
  const f = await setup(), input = await proposed(f, true);
  // The legacy separate-link command still requires the recorded receiver and owner.
  const legacy = { ...input, opportunity_id: f.opportunity.id };
  const created = await createDiscoveryWorkspace(f.receiver, legacy);
  const b = await readEstimatingBinding(f.receiver, f.handover_id), g = b.candidate!;
  const link = { ...crmBase(), expected_version: b.version, acceptance_event_id: b.acceptance_event_id!, source_hash: b.source_hash!,
    estimating_workspace_id: g.id, expected_estimating_version: g.version, selected_option_id: g.selected_option_id, selected_revision_id: g.selected_revision_id };
  const linked = await bindEstimatingWorkspace(f.receiver, f.handover_id, link);
  const tables = ["sales_estimating_bindings", "sales_workflow_events", "estimating_workspaces", "estimating_options", "estimation_revisions", "permission_grants", "seed_receipts", "operation_receipts", "audit_events", "outbox_jobs"];
  const snapshot = () => Promise.all(tables.map(t => rows(`SELECT to_jsonb(t) AS row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`)));
  const before = await snapshot(), ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate(); await seed(); await migrate(); await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations WHERE version<=109 ORDER BY version"), ledger);
  assert.deepEqual(await rows("SELECT version FROM public.ppo_migrations WHERE version>109 ORDER BY version"), [{ version: 112 }, { version: 113 }]);
  assert.deepEqual(await readOperation(f.receiver, legacy.operation_id), created.receipt);
  assert.deepEqual(await readOperation(f.receiver, link.operation_id), linked.receipt);
  const next = await setup(); await createDiscoveryWorkspace(next.creator, await proposed(next));
});

test("late publication failure rolls back the workspace, first revision and Sales binding together", async () => {
  const f = await setup(), input = await proposed(f);
  await rows("CREATE SCHEMA IF NOT EXISTS ppo_proof");
  await rows(`CREATE FUNCTION ppo_proof.reject_discovery_publication() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.kind='EstimatingWorkspaceCreated' THEN
      RAISE EXCEPTION 'SYN forced publication failure' USING ERRCODE='23514';
    END IF; RETURN NEW; END $$`);
  await rows(`CREATE TRIGGER reject_discovery_publication BEFORE INSERT ON ppo.outbox_jobs
    FOR EACH ROW EXECUTE FUNCTION ppo_proof.reject_discovery_publication()`);
  await assert.rejects(createDiscoveryWorkspace(f.creator, input));
  assert.equal(await countCreated(f), 0);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.estimation_revisions WHERE id=$1", [input.revision_id]))[0].n, 0);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.sales_estimating_bindings WHERE operation_id=$1", [input.operation_id]))[0].n, 0);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1", [input.operation_id]))[0].n, 0);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.outbox_jobs WHERE operation_id=$1", [input.operation_id]))[0].n, 0);
  await rows("DROP TRIGGER reject_discovery_publication ON ppo.outbox_jobs");
  const recovered = await createDiscoveryWorkspace(f.creator, input);
  assert.equal(recovered.receipt.record_id, input.id);
  assert.equal(await countCreated(f), 1);
});

test("the database refuses an exact-source binding without matching creation or separate-link evidence", async () => {
  const f = await setup(), input = await proposed(f, true);
  await createDiscoveryWorkspace(f.creator, input);
  const brief = (await discoveryCreationOptions(f.creator, { opportunity_id: f.opportunity.id })).brief!.selection!;
  await assert.rejects(rows(`INSERT INTO ppo.sales_estimating_bindings
    (workspace_id,company_id,handover_id,acceptance_event_id,estimating_workspace_id,
     estimating_version,selected_option_id,selected_revision_id,operation_id,recorded_by,reason)
    SELECT workspace_id,company_id,$2,$3,id,1,$4,$5,$6,$7,$8 FROM ppo.estimating_workspaces WHERE id=$1`,
    [input.id, f.handover_id, brief.acceptance_event_id, input.option_id, input.revision_id,
      input.operation_id, f.creator.actor_id, input.reason]), code("23514"));
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.sales_estimating_bindings WHERE estimating_workspace_id=$1", [input.id]))[0].n, 0);
});
