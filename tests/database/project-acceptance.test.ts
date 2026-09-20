import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { command } from "../../src/projects/acceptance/commands";
import { readWorkspace, file } from "../../src/projects/acceptance/reads";
import { readOperation } from "../../src/shared/receipts";
import { principalOf } from "../helpers/engineering-materials-direct";
import {
  contextFixture,
  seedStage,
  act,
  PJ,
  stable,
} from "../helpers/acceptance";
import { finishStage, detail } from "../helpers/acceptance-journey";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("PJ-09 database tests require ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(async () => {
  await reset();
  await contextFixture();
});
after(closeDatabase);
const p = () => principalOf("coordinator");
const rows = async (sql: string, v: unknown[] = []) =>
  (await database().query(sql, v)).rows;
let ready: Awaited<ReturnType<typeof seedStage>>;
test("PJ09-09/10/15/47: exact submitted snapshots, technical duty, return/successor and no waiver", async () => {
  const blocked = await seedStage(
    PJ.project,
    "blocked",
    "SYN failed shared release",
    "Blocked",
  );
  await assert.rejects(
    act("coordinator", PJ.project, blocked.stage, "technical"),
    (e) => Number((e as { status: number }).status) === 404,
  );
  await assert.rejects(
    act("materials-reviewer", PJ.project, blocked.stage, "technical"),
    /Blocked/,
  );
  const revision = await rows(
    "SELECT to_jsonb(r) AS r FROM ppo.acceptance_revisions r WHERE stage_id=$1",
    [blocked.stage],
  );
  await act("coordinator", PJ.project, blocked.stage, "return", {
    owner_id: PJ.sam,
  });
  await act("coordinator", PJ.project, blocked.stage, "successor");
  assert.deepEqual(
    await rows(
      "SELECT to_jsonb(r) AS r FROM ppo.acceptance_revisions r WHERE stage_id=$1",
      [blocked.stage],
    ),
    revision,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.acceptance_revisions SET reason='tampered' WHERE stage_id=$1",
      [blocked.stage],
    ),
    /immutable|retain|append|change/i,
  );
  ready = await seedStage(PJ.project, "ready", "SYN accepted exact stage");
  assert.equal(
    (await detail(PJ.project, ready.stage)).outcomes.technical,
    "Accepted",
  );
});
test("PJ09-44/47: original operations replay exactly and altered payload conflicts; grants checked before receipt", async () => {
  const result = await act("coordinator", PJ.project, ready.stage, "check");
  const original = JSON.parse(JSON.stringify(result.receipt));
  await act("coordinator", PJ.project, ready.stage, "check");
  const replay = await command(await p(), result.body);
  assert.equal(replay.replayed, true);
  assert.deepEqual(JSON.parse(JSON.stringify(replay.receipt)), original);
  await assert.rejects(
    command(await p(), { ...result.body, reason: "SYN altered command" }),
    /same|different|operation|original/i,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='acceptance.scope'",
    [PJ.coordinator],
  );
  await assert.rejects(command(await p(), result.body));
  await assert.rejects(readOperation(await p(), result.body.operation_id));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='acceptance.scope'",
    [PJ.coordinator],
  );
});
test("PJ09-26/29/30/33/35/37/38/39/40/41: exact issued files, independent Service, customer qualification and commercial separation", async () => {
  const project = stable("db:complete");
  await contextFixture(project, "SYN-PPO-PRJ-000702");
  const s = await seedStage(project, "L", "SYN complete delivery");
  const closed = await finishStage(project, s.stage);
  assert.equal(closed.stage.closeout, "Closed");
  assert.deepEqual(closed.closeout_gates, []);
  for (const m of closed.manifests) {
    const html = await file(await p(), m.id, "html"),
      pdf = await file(await p(), m.id, "pdf");
    assert.match(html.bytes.toString(), /SYN complete delivery/);
    assert.doesNotMatch(
      html.bytes.toString(),
      /PRIVATE_FINANCE_CANARY|private_note|provider|connection.string/i,
    );
    assert.equal(pdf.bytes.subarray(0, 5).toString(), "%PDF-");
  }
  await act("finance-reviewer", project, null, "commercial", {
    source_id: closed.requirements.find((r) => r.gate === "Commercial")!.source
      .id,
    outcome: "Complete",
    evidence: "SYN verified whole-project basis",
  });
  await act("coordinator", project, null, "closeProject");
  assert.equal(
    (await readWorkspace(await p(), { project })).project.lifecycle,
    "Closed",
  );
  await assert.rejects(
    act("coordinator", project, null, "unit", {
      id: randomUUID(),
      title: "SYN late unit",
      reference: "SYN late",
      system_name: "Irrigation",
      function_name: "Late scope",
      installed_at: "Nursery",
      served_areas: ["Nursery"],
      configuration_version: "r01",
    }),
    /closed|reopen/i,
  );
  const originals = await rows(
    "SELECT to_jsonb(d) AS d FROM ppo.acceptance_decisions d WHERE project_id=$1 ORDER BY id",
    [project],
  );
  const src = closed.requirements.find((r) => r.gate === "Technical")!.source;
  await act("coordinator", project, null, "source", {
    id: src.id,
    title: src.title,
    kind: "Technical",
    outcome: "Blocked",
    availability: "Changed",
    details: { evidence: "SYN post-close hold" },
    public_reference: src.reference,
    source_version: "r02",
    source_expected_version: src.version,
  });
  assert.equal(
    (await readWorkspace(await p(), { project })).project.lifecycle,
    "Closed",
  );
  assert.equal((await detail(project, s.stage)).stage.reassessment, true);
  await act("coordinator", project, null, "reopen", { unit_ids: [s.unit] });
  assert.equal(
    (await readWorkspace(await p(), { project })).project.lifecycle,
    "Active",
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT to_jsonb(d) AS d FROM ppo.acceptance_decisions d WHERE project_id=$1 ORDER BY id",
        [project],
      )
    ).filter((x) => originals.some((o) => o.d.id === x.d.id)),
    originals,
  );
});
test("PJ09-13/48/52: source versions, decisions, issued bytes and receipts persist across pool restart and repeat seed", async () => {
  const snapshot = async () => {
    const result: Record<string, unknown> = {};
    for (const table of [
      "acceptance_stages",
      "acceptance_revisions",
      "acceptance_source_versions",
      "acceptance_manifests",
      "acceptance_issues",
      "acceptance_decisions",
      "operation_receipts",
    ])
      result[table] = await rows(
        `SELECT to_jsonb(t) AS t FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
      );
    return result;
  };
  const before = await snapshot();
  await closeDatabase();
  assert.deepEqual(await snapshot(), before);
  await migrate();
  await seed();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.ok(
    (await readWorkspace(await p(), { project: PJ.project, q: "nothing" }))
      .project_gates.length > 0,
  );
  await assert.rejects(
    readWorkspace(await principalOf("second-company"), { project: PJ.project }),
  );
});
import { documentStore } from "../../src/documents/store";
import { handover } from "../helpers/acceptance";
test("PJ09-17/31/42/44/45/53: one connected blocked/return/successor journey, durable issue recovery and competing writes", async () => {
  const project = stable("db:journey");
  await contextFixture(project, "SYN-PPO-PRJ-000703");
  const s = await seedStage(
    project,
    "journey",
    "SYN complete returned journey",
    "Blocked",
  );
  await assert.rejects(
    act("materials-reviewer", project, s.stage, "technical"),
    /Blocked/,
  );
  let d = await detail(project, s.stage);
  const src = d.requirements.find((r) => r.gate === "Technical")!.source;
  await act("coordinator", project, null, "source", {
    id: src.id,
    title: src.title,
    kind: "Technical",
    outcome: "Satisfied",
    availability: "Current",
    details: {
      evidence: "SYN fresh independently reviewed retest",
      tests_accepted: 12,
      tests_required: 12,
      release: "SYN fresh exact technical issue r02",
    },
    public_reference: src.reference,
    source_version: "r02",
    source_expected_version: src.version,
  });
  await assert.rejects(
    act("materials-reviewer", project, s.stage, "technical"),
    /successor|changed/i,
  );
  await act("coordinator", project, s.stage, "return", { owner_id: PJ.sam });
  await act("coordinator", project, s.stage, "successor");
  await act("coordinator", project, s.stage, "submit");
  await act("materials-reviewer", project, s.stage, "technical");
  d = await detail(project, s.stage);
  const op = randomUUID(),
    mid = randomUUID(),
    actor = await p(),
    body = {
      operation_id: op,
      schema_version: 1,
      reason: "SYN storage succeeds before database finalisation failure",
      action: "prepare",
      project_id: project,
      stage_id: s.stage,
      expected_version: d.stage.version,
      facts_hash: d.facts_hash,
      fields: {
        id: mid,
        audience: "Customer",
        recipient_id: PJ.person,
        purpose: "SYN recovery proof",
      },
    };
  await database().query(
    "CREATE FUNCTION ppo.pj09_test_fail_manifest() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN injected finalisation failure' USING ERRCODE='23514'; END $$; CREATE TRIGGER pj09_test_fail_manifest BEFORE INSERT ON ppo.acceptance_manifests FOR EACH ROW EXECUTE FUNCTION ppo.pj09_test_fail_manifest()",
  );
  try {
    await assert.rejects(
      command(actor, body),
      (e) => Number((e as { status: number }).status) === 422,
    );
  } finally {
    await database().query(
      "DROP TRIGGER pj09_test_fail_manifest ON ppo.acceptance_manifests; DROP FUNCTION ppo.pj09_test_fail_manifest()",
    );
  }
  const store = documentStore();
  assert("locate" in store);
  const context = {
      workspace_id: actor.workspace_id,
      actor_id: actor.actor_id,
      operation_id: mid,
    },
    saved = await store.locate(context);
  assert(saved);
  await closeDatabase();
  const accepted = await command(actor, body);
  assert.equal(accepted.replayed, false);
  assert.deepEqual((await store.locate(context))!.bytes, saved.bytes);
  const pack = await handover(project, s.stage, "Service", "returned");
  await assert.rejects(
    act("coordinator", project, s.stage, "receive", {
      request_id: pack.request_id!,
      outcome: "Accepted",
      evidence: "SYN sender cannot sign for receiver",
    }),
  );
  await act("changes-service", project, s.stage, "receive", {
    request_id: pack.request_id!,
    outcome: "Returned",
    owner_id: PJ.sam,
    evidence: "SYN clarify the exact backup reference in a successor",
  });
  await act("coordinator", project, s.stage, "successor");
  await act("coordinator", project, s.stage, "submit");
  await act("materials-reviewer", project, s.stage, "technical");
  assert.equal(
    (await detail(project, s.stage)).outcomes.service,
    "Not requested",
  );
  await finishStage(project, s.stage);
  assert.equal((await detail(project, s.stage)).stage.closeout, "Closed");
  const candidate = await act("coordinator", PJ.project, ready.stage, "check");
  const base = {
    ...candidate.body,
    expected_version: (await detail(PJ.project, ready.stage)).stage.version,
  };
  const outcomes = await Promise.allSettled([
    command(actor, { ...base, operation_id: randomUUID() }),
    command(actor, { ...base, operation_id: randomUUID() }),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((r) => r.status === "rejected").length, 1);
});

import {
  registerIntent,
  recoverIntent,
  acknowledgeIntent,
  pendingIntents,
} from "../../src/projects/acceptance/intents";
import { parseCommand } from "../../src/projects/acceptance/validation";
import { actionDuty } from "../../src/projects/acceptance/ui-actions";
import { readFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
test("PJ09-34/44/46/47/48: server-held original, payload conflict, current authority and restricted Finance projection", async () => {
  const actor = await p(),
    d = await detail(PJ.project, ready.stage),
    body = parseCommand({
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN registered before interrupted command",
      action: "check",
      project_id: PJ.project,
      stage_id: ready.stage,
      expected_version: d.stage.version,
      facts_hash: d.facts_hash,
      fields: {},
    });
  await registerIntent(actor, body);
  await closeDatabase();
  assert.equal((await recoverIntent(actor, body.operation_id)).receipt, null);
  const result = await command(actor, body);
  await closeDatabase();
  assert.deepEqual(
    (await recoverIntent(actor, body.operation_id)).receipt,
    result.receipt,
  );
  assert.equal((await command(actor, body)).replayed, true);
  assert.equal(
    (await pendingIntents(database(), actor, PJ.project)).filter(
      (x) => x.operation_id === body.operation_id,
    ).length,
    1,
  );
  await assert.rejects(
    command(actor, { ...body, reason: "SYN changed original" }),
    /different|original/i,
  );
  await assert.rejects(
    recoverIntent(await principalOf("materials-author"), body.operation_id),
  );
  await acknowledgeIntent(actor, body.operation_id);
  assert(
    !(await pendingIntents(database(), actor, PJ.project)).some(
      (x) => x.operation_id === body.operation_id,
    ),
  );
  const grants = await rows(
    "SELECT id FROM ppo.permission_grants WHERE user_id=$1 AND capability LIKE 'acceptance.%' AND valid_to IS NULL",
    [actor.actor_id],
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=ANY($1::uuid[])",
    [grants.map((g) => g.id)],
  );
  try {
    for (const action of Object.keys(actionDuty))
      await assert.rejects(
        command(actor, { ...body, operation_id: randomUUID(), action }),
        (e) => Number((e as { status: number }).status) === 404,
      );
    await assert.rejects(recoverIntent(actor, body.operation_id));
    assert((await readWorkspace(actor, { project: PJ.project })).total > 0);
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [grants.map((g) => g.id)],
    );
  }
  const commercial = (await detail(PJ.project, ready.stage)).requirements.find(
      (r) => r.gate === "Commercial",
    )!.source,
    canary = "PRIVATE_FINANCE_CANARY_93441";
  await act(
    "finance-reviewer",
    PJ.project,
    null,
    "source",
    {
      id: commercial.id,
      title: canary,
      kind: "Commercial",
      outcome: "Satisfied",
      availability: "Current",
      details: {
        evidence: canary,
        private_note: canary,
        as_at: "2026-09-21",
        completeness: "Complete",
        source_reference: "SYN public account basis",
      },
      public_reference: commercial.reference,
      source_version: "r02",
      source_expected_version: commercial.version,
    },
    randomUUID(),
    canary,
  );
  await act(
    "finance-reviewer",
    PJ.project,
    ready.stage,
    "commercial",
    { outcome: "Complete", evidence: canary, source_id: commercial.id },
    randomUUID(),
    canary,
  );
  const publicView = await readWorkspace(
    await principalOf("materials-author"),
    { project: PJ.project, stage: ready.stage },
  );
  assert(!JSON.stringify(publicView).includes(canary));
  assert(
    JSON.stringify(
      await readWorkspace(await principalOf("finance-reviewer"), {
        project: PJ.project,
        stage: ready.stage,
      }),
    ).includes(canary),
  );
  await assert.rejects(
    act("coordinator", PJ.project, null, "source", {
      id: commercial.id,
      title: "SYN cannot reclassify Finance",
      kind: "Technical",
      outcome: "Outstanding",
      availability: "Current",
      details: { evidence: "SYN" },
      public_reference: commercial.reference,
      source_version: "r03",
      source_expected_version: commercial.version + 1,
    }),
    /kind|Preserve/,
  );
});
test("PJ09-11/13/36/38: authorised scope disposition retains the ledger and cannot hide a shared hold or stage", async () => {
  const unallocated = stable("db:unallocated");
  await act("coordinator", PJ.project, null, "unit", {
    id: unallocated,
    reference: "SYN-UNIT-UNALLOCATED",
    title: "SYN extra scope",
    system_name: "Shared controls",
    function_name: "Alarm coverage",
    installed_at: "Pump room",
    served_areas: ["GH01", "GH02"],
    configuration_version: "r01",
  });
  assert(
    (
      await readWorkspace(await p(), { project: PJ.project, q: "nonmatching" })
    ).project_gates.some((g) => g.includes("SYN extra scope")),
  );
  await assert.rejects(
    act("materials-author", PJ.project, null, "disposition", {
      unit_id: unallocated,
      required: false,
      removal_reference: "SYN unauthorised removal",
    }),
  );
  await act("coordinator", PJ.project, null, "disposition", {
    unit_id: unallocated,
    required: false,
    removal_reference: "SYN approved scope change 9",
  });
  let view = await readWorkspace(await p(), { project: PJ.project });
  assert.equal(view.ledger.find((u) => u.id === unallocated)!.required, false);
  assert(view.project_gates.some((g) => g.includes("stage")));
  assert.equal(
    (
      await rows("SELECT required FROM ppo.acceptance_units WHERE id=$1", [
        unallocated,
      ])
    )[0].required,
    true,
  );
  await act("coordinator", PJ.project, null, "disposition", {
    unit_id: unallocated,
    required: true,
    removal_reference: "SYN approved restoration 10",
  });
  view = await readWorkspace(await p(), { project: PJ.project });
  assert(view.project_gates.some((g) => g.includes("SYN extra scope")));
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.acceptance_unit_dispositions WHERE unit_id=$1",
        [unallocated],
      )
    ).length,
    2,
  );
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.acceptance_unit_dispositions WHERE unit_id=$1",
      [unallocated],
    ),
    /immutable|retained|append/i,
  );
});

test("PJ09-35/43: missing exact original blocks closeout, retains its reference and creates one owned recovery", async () => {
  const project = stable("db:journey"),
    stage = stable(project + ":journey:stage"),
    d = await detail(project, stage),
    manifest = d.manifests.find(
      (m) => m.revision === d.stage.revision && m.issue_id,
    )!;
  await act("coordinator", project, stage, "reopen", {
    unit_ids: d.units
      .filter((u) => u.disposition === "Included")
      .map((u) => u.id),
  });
  const path = join(
      process.env.PPO_DOCUMENT_DIRECTORY ??
        join(homedir(), ".ppo-synthetic-documents"),
      (await p()).workspace_id,
      manifest.id,
    ),
    missing = path + ".pj09-proof-missing",
    original = await readFile(path);
  await rename(path, missing);
  try {
    await assert.rejects(
      file(await p(), manifest.id, "pdf"),
      (e) => Number((e as { status: number }).status) === 503,
    );
    await assert.rejects(
      act("coordinator", project, stage, "closeStage"),
      (e) => Number((e as { status: number }).status) === 503,
    );
    await act("coordinator", project, stage, "check");
    await act("coordinator", project, stage, "check");
    assert.equal((await detail(project, stage)).source_state, "Unavailable");
    assert.equal(
      (
        await rows(
          "SELECT * FROM ppo.acceptance_followups WHERE stage_id=$1 AND cause=$2",
          [stage, "original:" + manifest.id],
        )
      ).length,
      1,
    );
  } finally {
    await rename(missing, path);
  }
  assert.deepEqual(await readFile(path), original);
  await act("coordinator", project, stage, "check");
  assert.equal((await detail(project, stage)).source_state, "Current");
  await act("coordinator", project, stage, "closeStage");
});
