import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  createSession,
  resolveIdentity,
  tokenHash,
} from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createScope,
  saveScope,
  previewSource,
  refreshSource,
  archiveScope,
} from "../../src/estimating/fertigation/service";
import {
  readScope,
  listScopes,
  scopeHistory,
  creationOptions,
} from "../../src/estimating/fertigation/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  fertigationFixture,
  saveCommand,
  fertigationBase,
} from "../helpers/fertigation";
import { discoveryFacility } from "../helpers/estimating-discovery";
import {
  blankScope,
  blankGroup,
} from "../../src/estimating/fertigation/definition";
import { estimateInput } from "../helpers/estimating";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { crmCreate } from "../helpers/crm";
import {
  copyScope,
  restoreRevision,
  compareRevisions,
} from "../../src/estimating/fertigation/history";
import {
  resolveOriginal,
  recoveryResult,
} from "../../src/estimating/fertigation/recovery";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  (e as { code?: string }).code === expected;

test("FN-T01/T03/T78/T79 saved valve exact revisions survive sign-out, clean identity and database reconnect", async () => {
  const f = await fertigationFixture();
  assert.match(f.detail.scope.display_number, /^SYN-PPO-FRT-\d{6}$/);
  const command = saveCommand(f.detail);
  command.proposal.valves[0].label = "SYN north valve revised";
  command.proposal.valves[0].design_flow_m3h = 3.25;
  const result = await saveScope(f.p, f.create.id, command);
  assert.equal(result.receipt.record_version, 2);
  assert.deepEqual(
    (await saveScope(f.p, f.create.id, command)).receipt,
    result.receipt,
  );
  assert.deepEqual(
    await readOperation(f.p, command.operation_id),
    result.receipt,
  );
  await database().query("DELETE FROM ppo.sessions WHERE token_hash=$1", [
    tokenHash(f.session.token),
  ]);
  await assert.rejects(
    resolveIdentity(f.session.token),
    code("AuthenticationRequired"),
  );
  await closeDatabase();
  const clean = (await createSession("coordinator")).principal;
  const historical = await readScope(clean, f.create.id, {
      revision_id: f.detail.revision.id,
    }),
    current = await readScope(clean, f.create.id);
  assert.deepEqual(historical.revision, f.detail.revision);
  assert.deepEqual(historical.calculation, f.detail.calculation);
  assert.equal(historical.can_edit, false);
  assert.equal(current.revision.proposal.valves[0].id, f.proposal.valves[0].id);
  assert.equal(
    current.revision.proposal.valves[0].label,
    command.proposal.valves[0].label,
  );
  assert.equal(
    current.revision.proposal.masters[0].id,
    f.proposal.masters[0].id,
  );
  assert.equal((await scopeHistory(clean, f.create.id)).items.length, 2);
  await assert.rejects(
    database().query(
      "UPDATE ppo.fertigation_revisions SET reason='rewrite' WHERE id=$1",
      [f.detail.revision.id],
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.fertigation_revisions WHERE id=$1", [
      f.detail.revision.id,
    ]),
    code("55000"),
  );
});
test("FN-T10/T11/T86 concurrent writers and original retries have one durable revision effect", async () => {
  const f = await fertigationFixture(),
    a = saveCommand(f.detail),
    b = saveCommand(f.detail);
  a.proposal.valves[0].label = "SYN winner A";
  b.proposal.valves[0].label = "SYN winner B";
  const results = await Promise.allSettled([
    saveScope(f.p, f.create.id, a),
    saveScope(f.p, f.create.id, b),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    results.filter(
      (r) => r.status === "rejected" && code("VersionConflict")(r.reason),
    ).length,
    1,
  );
  const winner = results[0].status === "fulfilled" ? a : b;
  assert.equal((await saveScope(f.p, f.create.id, winner)).replayed, true);
  await assert.rejects(
    saveScope(f.p, f.create.id, {
      ...winner,
      reason: "SYN changed operation payload",
    }),
    code("OperationConflict"),
  );
  assert.equal((await scopeHistory(f.p, f.create.id)).items.length, 2);
});
test("FN-T08/T09/T73 all reads, originals, registers and source options retain server scope", async () => {
  const f = await fertigationFixture();
  for (const profile of [
    "systems",
    "assigned-technician",
    "second-company",
    "other-workspace",
  ]) {
    const p = (await createSession(profile)).principal;
    await assert.rejects(readScope(p, f.create.id), code("RecordUnavailable"));
    await assert.rejects(
      readOperation(p, f.create.operation_id),
      code("RecordUnavailable"),
    );
  }
  const other = (await createSession("second-company")).principal;
  assert.equal((await listScopes(other)).items.length, 0);
  assert.equal((await creationOptions(other)).sources.length, 0);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [f.p.actor_id],
  );
  await assert.rejects(createScope(f.p, f.create), code("RecordUnavailable"));
  await assert.rejects(
    readOperation(f.p, f.create.operation_id),
    code("RecordUnavailable"),
  );
  assert.equal((await readScope(f.p, f.create.id)).can_edit, false);
});
test("FN-T65/T79/T84 retained child ownership, typed links and explicit source refresh protect history", async () => {
  const f = await fertigationFixture();
  await assert.rejects(
    createScope(f.p, { ...f.create, ...fertigationBase(), id: randomUUID() }),
    code("InvalidRelationship"),
  );
  const command = saveCommand(f.detail),
    group = blankGroup(randomUUID());
  group.label = "SYN irrigation group";
  group.valve_ids = [command.proposal.valves[0].id];
  command.proposal.groups = [group];
  await saveScope(f.p, f.create.id, command);
  const current = await readScope(f.p, f.create.id),
    remove = saveCommand(current);
  remove.proposal.valves = [];
  await assert.rejects(
    saveScope(f.p, f.create.id, remove),
    code("InvalidData"),
  );
  await database().query(
    "UPDATE ppo.facilities SET version=version+1 WHERE id=$1",
    [discoveryFacility],
  );
  const changed = await readScope(f.p, f.create.id);
  assert.equal(changed.source.changed, true);
  await assert.rejects(
    saveScope(f.p, f.create.id, saveCommand(changed)),
    code("FertigationSourceChanged"),
  );
  const preview = await previewSource(f.p, f.create.id, {
    revision_id: f.revisionId,
    coverage: f.create.coverage,
  });
  await refreshSource(f.p, f.create.id, {
    ...fertigationBase(),
    revision_id: f.revisionId,
    coverage: f.create.coverage,
    expected_version: changed.scope.version,
    expected_revision_id: changed.revision.id,
    proposal_signature: preview.proposal_signature,
    proposal: changed.revision.proposal,
  });
  assert.equal((await readScope(f.p, f.create.id)).source.changed, false);
  assert.deepEqual(
    (await readScope(f.p, f.create.id, { revision_id: f.detail.revision.id }))
      .revision,
    f.detail.revision,
  );
});
test("FN-T61/T62/T68/T69/T70 blank and non-berry capture persists without invented containers or approval", async () => {
  const f = await fertigationFixture();
  const command = saveCommand(f.detail);
  command.proposal = blankScope();
  command.proposal.name = "SYN leafy greens recirculation study";
  command.proposal.production_context.tags = ["commercial_nursery"];
  command.proposal.production_context.crop_description =
    "SYN mixed leafy greens and nursery starts";
  command.proposal.production_context.growing_system = "hydroponic_soilless";
  command.proposal.production_context.hydraulic_arrangement = "recirculating";
  await saveScope(f.p, f.create.id, command);
  const exact = await readScope(f.p, f.create.id);
  assert.deepEqual(exact.revision.proposal, command.proposal);
  assert.equal(exact.revision.proposal.crop_groups.length, 0);
  assert.equal(exact.calculation.daily_demand_m3.value, null);
  await archiveScope(f.p, f.create.id, {
    ...fertigationBase(),
    expected_version: exact.scope.version,
  });
  assert.equal((await readScope(f.p, f.create.id)).can_edit, false);
  await assert.rejects(
    saveScope(f.p, f.create.id, saveCommand(exact)),
    code("FertigationArchived"),
  );
});
test("FN-T57 upgrade across 0026 with existing estimates preserves identity and repeat seed bytes", async () => {
  const db = database();
  await db.query("DROP SCHEMA IF EXISTS ppo_proof CASCADE");
  await db.query("DROP SCHEMA ppo CASCADE");
  await db.query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(25);
  await seed(25);
  const p = (await createSession("coordinator")).principal,
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const input = estimateInput(opportunity.id);
  await createEstimate(p, input);
  const before = (
    await db.query(
      "SELECT to_jsonb(v) AS row FROM ppo.estimate_versions v ORDER BY id",
    )
  ).rows;
  await migrate();
  await seed();
  assert.ok(
    (await db.query("SELECT to_regclass('ppo.fertigation_scopes') AS r"))
      .rows[0].r,
  );
  assert.deepEqual(
    (
      await db.query(
        "SELECT to_jsonb(v) AS row FROM ppo.estimate_versions v ORDER BY id",
      )
    ).rows,
    before,
  );
  const identities = (
    await db.query(
      "SELECT to_jsonb(i) AS row FROM ppo.business_identities i ORDER BY workspace_id,id",
    )
  ).rows;
  await seed();
  assert.deepEqual(
    (
      await db.query(
        "SELECT to_jsonb(i) AS row FROM ppo.business_identities i ORDER BY workspace_id,id",
      )
    ).rows,
    identities,
  );
});
test("FN-T79 independent copy identity, comparison and explicit historical restoration", async () => {
  const f = await fertigationFixture(),
    input = {
      ...fertigationBase(),
      id: randomUUID(),
      name: "SYN copied study",
      source_revision_id: f.detail.revision.id,
      estimating_workspace_id: f.workspaceId,
      option_id: f.optionId,
      revision_id: f.revisionId,
      expected_workspace_version: 1,
      coverage: f.create.coverage,
    };
  const copied = await copyScope(f.p, f.create.id, input);
  assert.equal((await copyScope(f.p, f.create.id, input)).replayed, true);
  assert.equal(copied.receipt.record_id, input.id);
  const target = await readScope(f.p, input.id);
  assert.notEqual(
    target.revision.proposal.valves[0].id,
    f.proposal.valves[0].id,
  );
  assert.equal(
    target.revision.proposal.valves[0].master_id,
    target.revision.proposal.masters[0].id,
  );
  const changed = saveCommand(f.detail);
  changed.proposal.valves[0].label = "SYN revised before restoration";
  await saveScope(f.p, f.create.id, changed);
  const current = await readScope(f.p, f.create.id);
  const comparison = await compareRevisions(f.p, f.create.id, {
    before_revision_id: f.detail.revision.id,
    after_revision_id: current.revision.id,
  });
  assert.ok(
    comparison.differences.some(
      (d) =>
        d.path.endsWith(".label") && d.before === f.proposal.valves[0].label,
    ),
  );
  await restoreRevision(f.p, f.create.id, {
    ...fertigationBase(),
    source_revision_id: f.detail.revision.id,
    expected_version: current.scope.version,
    expected_revision_id: current.revision.id,
  });
  assert.deepEqual(
    (await readScope(f.p, f.create.id)).revision.proposal,
    f.proposal,
  );
  assert.equal((await readScope(f.p, input.id)).scope.version, 1);
});
test("FN-T12/T86 terminal original reconciliation serializes accepted and permanently closed intents", async () => {
  const f = await fertigationFixture(),
    original = saveCommand(f.detail),
    resolution = {
      ...fertigationBase(),
      original_operation_id: original.operation_id,
      command: "SaveFertigationRevision",
    };
  await resolveOriginal(f.p, f.create.id, resolution);
  assert.equal(
    (
      await recoveryResult(f.p, f.create.id, {
        operation_id: resolution.operation_id,
      })
    ).outcome,
    "Closed without acceptance",
  );
  await assert.rejects(
    saveScope(f.p, f.create.id, original),
    code("FertigationOriginalClosed"),
  );
  const accepted = saveCommand(f.detail);
  await saveScope(f.p, f.create.id, accepted);
  const found = {
    ...fertigationBase(),
    original_operation_id: accepted.operation_id,
    command: "SaveFertigationRevision",
  };
  await resolveOriginal(f.p, f.create.id, found);
  assert.deepEqual(
    (
      await recoveryResult(f.p, f.create.id, {
        operation_id: found.operation_id,
      })
    ).original_receipt,
    await readOperation(f.p, accepted.operation_id),
  );
  const neverCreated = { ...f.create, ...fertigationBase(), id: randomUUID() };
  const closeCreate = {
    ...fertigationBase(),
    original_operation_id: neverCreated.operation_id,
    command: "CreateFertigationScope",
    estimating_workspace_id: f.workspaceId,
    revision_id: f.revisionId,
  };
  await resolveOriginal(f.p, neverCreated.id, closeCreate);
  assert.equal(
    (
      await recoveryResult(f.p, neverCreated.id, {
        operation_id: closeCreate.operation_id,
      })
    ).outcome,
    "Closed without acceptance",
  );
  await assert.rejects(
    createScope(f.p, neverCreated),
    code("FertigationOriginalClosed"),
  );
  assert.ok(await readOperation(f.p, closeCreate.operation_id));
});
