import { emptyConfiguration } from "../../src/estimating/configuration-definition";
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { readOperation } from "../../src/shared/receipts";
import {
  readNursery,
  saveNursery,
} from "../../src/estimating/nursery-automation/service";
import { nurseryFixture, nurseryCommand } from "../helpers/nursery-automation";
import { crmBase } from "../helpers/crm";
import { structuredDiscovery } from "../helpers/estimating-configuration";
import { discoveryInput } from "../helpers/estimating-discovery";
import {
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (wanted: string) => (e: unknown) =>
  (e as { code: string }).code === wanted;
test("NAC N1 saved Express scenarios, conflicts and immutable history survive reconnect; originals recover after successors", async () => {
  const f = await nurseryFixture(false, structuredDiscovery(true)),
    input = { ...nurseryCommand(f.detail), proposal: f.proposal };
  const first = await saveNursery(f.p, f.id, input);
  const d = await readNursery(f.p, f.id);
  assert.deepEqual(d.proposal, f.proposal);
  assert.equal(d.source.effort, "Express");
  assert.equal(d.selected?.version, 1);
  assert.equal(
    (await readNursery(f.p, f.id, { revision_id: d.selected!.id })).can_edit,
    false,
  );
  assert.equal(d.proposal.scenarios[0].facts.target_good_pots.value, null);
  const next = nurseryCommand(d);
  next.proposal.scenarios[0].name = "SYN changed name";
  await saveNursery(f.p, f.id, next);
  assert.deepEqual(
    (await saveNursery(f.p, f.id, input)).receipt,
    first.receipt,
  );
  assert.deepEqual(await readOperation(f.p, input.operation_id), first.receipt);
  await closeDatabase();
  const p = (await createSession("coordinator")).principal;
  const historical = await readNursery(p, f.id, {
    revision_id: d.selected!.id,
  });
  assert.deepEqual(historical.proposal, f.proposal);
  assert.equal(historical.can_edit, false);
  assert.equal((await readNursery(p, f.id)).history.length, 2);
  await assert.rejects(
    database().query(
      "UPDATE ppo.nursery_discovery_revisions SET reason='changed' WHERE id=$1",
      [d.selected!.id],
    ),
  );
  await assert.rejects(
    saveNursery(p, f.id, { ...input, reason: "changed original" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    saveNursery(p, f.id, { ...input, operation_id: randomUUID() }),
    code("NurseryBasisChanged"),
  );

  const beforeSourceChange = await readNursery(p, f.id);
  const change = {
    kind: "Save",
    option_id: f.option_id,
    expected_version: beforeSourceChange.workspace.version,
    expected_revision_id: f.revision_id,
    discovery: { ...discoveryInput(), configuration: emptyConfiguration() },
    branch_mode: null,
    copy_follow_up: null,
  };
  const preview = await previewDiscoveryChange(p, f.id, change);
  const sourceId = randomUUID();
  await changeDiscoveryWorkspace(p, f.id, {
    ...crmBase(),
    ...change,
    revision_id: sourceId,
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const changedSource = await readNursery(p, f.id);
  assert.equal(changedSource.source_changed, true);
  assert.equal(changedSource.source.id, sourceId);
  assert.deepEqual(changedSource.selected_source, beforeSourceChange.source);
  assert.ok(
    changedSource.selected_source.systems.some(
      (s) => s.id === f.proposal.system_id,
    ),
  );
  assert.deepEqual(changedSource.source.systems, []);
  assert.equal(changedSource.selected!.source_revision_id, f.revision_id);
  // Even an updated workspace version cannot legitimise the old source.
  await assert.rejects(
    saveNursery(p, f.id, {
      ...nurseryCommand(beforeSourceChange),
      expected_workspace_version: changedSource.workspace.version,
    }),
    code("NurseryBasisChanged"),
  );
  assert.deepEqual((await saveNursery(p, f.id, input)).receipt, first.receipt);
  await assert.rejects(
    saveNursery(p, f.id, nurseryCommand(changedSource)),
    code("InvalidData"),
  );
  const rebind = nurseryCommand(changedSource);
  rebind.proposal.system_id = null; // Explicitly clear the removed system on the successor only.
  await saveNursery(p, f.id, rebind);
  const rebound = await readNursery(p, f.id);
  assert.equal(rebound.source_changed, false);
  assert.equal(rebound.selected!.source_revision_id, sourceId);
  assert.deepEqual(
    (await readNursery(p, f.id, { revision_id: d.selected!.id })).proposal,
    f.proposal,
  );
  const retained = await readNursery(p, f.id, { revision_id: d.selected!.id });
  assert.deepEqual(retained.selected_source, beforeSourceChange.source);
  assert.equal(retained.source.id, sourceId);
  const incomplete = await nurseryFixture(true);
  assert.equal(incomplete.detail.source.readiness, "Incomplete");
  await saveNursery(
    incomplete.p,
    incomplete.id,
    nurseryCommand(incomplete.detail),
  );
  assert.equal(
    (await readNursery(incomplete.p, incomplete.id)).source.readiness,
    "Incomplete",
  );
});
test("NAC N1 competing saves accept once; foreign option, stale catalogue and current access cannot be bypassed", async () => {
  const f = await nurseryFixture(),
    a = { ...nurseryCommand(f.detail), proposal: f.proposal };
  const results = await Promise.allSettled([
    saveNursery(f.p, f.id, a),
    saveNursery(f.p, f.id, { ...a, operation_id: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await readNursery(f.p, f.id)).history.length, 1);
  const d = await readNursery(f.p, f.id),
    input = nurseryCommand(d);
  await assert.rejects(
    saveNursery(f.p, f.id, { ...input, catalogue_hash: "a".repeat(64) }),
    code("NurseryCatalogueChanged"),
  );
  await assert.rejects(
    saveNursery(f.p, f.id, { ...input, option_id: randomUUID() }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    saveNursery(f.p, f.id, {
      ...input,
      proposal: { ...input.proposal, system_id: randomUUID() },
    }),
    code("InvalidData"),
  );
  const other = (await createSession("second-company")).principal;
  await assert.rejects(readNursery(other, f.id));
  await assert.rejects(saveNursery(other, f.id, input));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [f.p.actor_id],
  );
  assert.equal((await readNursery(f.p, f.id)).can_edit, false);
  await assert.rejects(saveNursery(f.p, f.id, a));
  await assert.rejects(readOperation(f.p, a.operation_id));
});
test("0116 upgrades populated 0115 without altering saved Discovery, grants, seed receipts or ledger", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(115);
  await seed(115);
  // Create the existing Discovery fixture without accessing the new table.
  const { createOpportunity } = await import("../../src/crm/opportunities");
  const { createDiscoveryWorkspace, previewDiscoveryCreate } =
    await import("../../src/estimating/discovery-workspaces");
  const { crmCreate, crmBase } = await import("../helpers/crm");
  const { discoveryInput } = await import("../helpers/estimating-discovery");
  const p = (await createSession("coordinator")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const discovery = discoveryInput();
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: o.id,
    discovery,
  });
  const id = randomUUID(),
    option_id = randomUUID(),
    revision_id = randomUUID();
  await createDiscoveryWorkspace(p, {
    ...crmBase(),
    id,
    option_id,
    revision_id,
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const snapshot = async () =>
    Promise.all(
      [
        "ppo.estimating_workspaces",
        "ppo.estimating_options",
        "ppo.estimation_revisions",
        "ppo.permission_grants",
        "ppo.seed_receipts",
      ].map(
        async (table) =>
          (
            await database().query(
              `SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const afterLedger = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(afterLedger.slice(0, ledger.length), ledger);
  assert.deepEqual(
    afterLedger.slice(ledger.length).map((r) => r.version),
    [116, 117, 118, 119],
  );
  assert.equal((await readNursery(p, id)).selected, null);
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
});
