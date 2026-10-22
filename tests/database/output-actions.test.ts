import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import {
  runOutputAction,
  readOutputActions,
  recoverOutputOperation,
} from "../../src/outputs/actions";
import {
  prepareDistribution,
  recordDistributionOutcome,
  readDistribution,
} from "../../src/outputs/distribution";
import {
  issued,
  queued,
  prepared,
  principal,
  rows,
  base,
  id,
} from "../helpers/packs";
import { reviewed, reportIssued } from "../helpers/reports";
import {
  readPack,
  checkPack,
  requestIssue,
  recordDistribution,
} from "../../src/documents/packs";
import { readReport } from "../../src/reports/service";
import { processRenderJob } from "../../src/documents/worker";
import { processReportJob, requestReportIssue } from "../../src/reports/worker";
import {
  documentStore,
  LocalSyntheticDocumentStore,
} from "../../src/documents/store";
import { withWorkingCompany } from "../../src/platform/working-company";
import { outputSnapshot } from "../helpers/output-register";
import type { OutputKind } from "../../src/outputs/model";
import { started, acknowledged, startInput } from "../helpers/field";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { readOutput } from "../../src/outputs/reads";
import { moveAppointment, readAppointment } from "../../src/scheduling/planner";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const denied = (e: unknown) =>
  [403, 404].includes((e as { status: number }).status);
const envelope = (kind: OutputKind, action: string, command: unknown) => ({
  kind,
  action,
  command,
});
const prepare = (
  issue_id: string,
  recipient_id: string,
  expected_version: number,
) => ({
  ...base(),
  attempt_id: randomUUID(),
  issue_id,
  recipient_id,
  expected_version,
});
const outcome = (
  attempt_id: string,
  expected_attempt_version: number,
  value = "OutcomeUnknown",
) => ({
  ...base(),
  attempt_id,
  expected_attempt_version,
  outcome: value,
  evidence:
    "SYN controlled outcome observation; no provider or customer communication.",
});

test("DK03-C10 native InProgress applicability permits exact distribution and original recovery", async () => {
  const q = await started(),
    issuer = await principal(),
    recipient = (
      await rows(
        "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
        [q.issue_id],
      )
    )[0];
  assert.equal(q.job.status, "InProgress");
  const detail = await readOutput(issuer, q.pack.id, { kind: "JobPack" });
  assert.equal(detail.selected_issue!.pack_applicable, true);
  assert.equal(detail.availability, "Available");
  const retained = await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [
      q.issue_id,
    ]),
    cmd = prepare(q.issue_id, recipient.id, q.pack.version);
  const saved = await prepareDistribution(issuer, "JobPack", q.pack.id, cmd);
  const sent = outcome(cmd.attempt_id, 1, "SimulatedSent");
  const recorded = await recordDistributionOutcome(
    issuer,
    "JobPack",
    q.pack.id,
    sent,
  );
  const snapshot = await outputSnapshot();
  assert.deepEqual(
    await recoverOutputOperation(issuer, q.pack.id, {
      kind: "JobPack",
      operation_id: cmd.operation_id,
    }),
    saved.receipt,
  );
  assert.deepEqual(
    (await prepareDistribution(issuer, "JobPack", q.pack.id, cmd)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    (await recordDistributionOutcome(issuer, "JobPack", q.pack.id, sent))
      .receipt,
    recorded.receipt,
  );
  assert.deepEqual(await outputSnapshot(), snapshot);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [q.issue_id]),
    retained,
  );
  const history = await readDistribution(issuer, "JobPack", q.pack.id);
  assert.deepEqual(
    history[0].events.map((e: { state: string }) => e.state),
    ["Prepared", "SimulatedSent"],
  );
  assert.equal(history[0].sent_at, null);
  assert.equal(history[0].delivered_at, null);
});

test("DK03-C11 a Confirmed preparation survives native start without changing its exact issue", async () => {
  const q = await acknowledged(),
    tech = await principal("assigned-technician"),
    recipient = (
      await rows(
        "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
        [q.issue_id],
      )
    )[0],
    cmd = prepare(q.issue_id, recipient.id, q.pack.version);
  await prepareDistribution(q.p, "JobPack", q.pack.id, cmd);
  const job = (await readFieldJob(tech, q.pack.appointment_id)).items[0];
  const sent = outcome(cmd.attempt_id, 1, "SimulatedSent");
  await startAttendance(tech, job.id, startInput(job));
  assert.equal(
    (await readOutput(q.p, q.pack.id, { kind: "JobPack" })).selected_issue!
      .pack_applicable,
    true,
  );
  await recordDistributionOutcome(q.p, "JobPack", q.pack.id, sent);
  assert.equal(
    (await readDistribution(q.p, "JobPack", q.pack.id))[0].state,
    "SimulatedSent",
  );
});

test("DK03-C12 native schedule and crew changes refuse new distribution without changing original attempts", async () => {
  const q = await issued(),
    a = (await readAppointment(q.p, q.pack.appointment_id)).items[0],
    recipient = (
      await rows(
        "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
        [q.issue_id],
      )
    )[0],
    cmd = prepare(q.issue_id, recipient.id, q.pack.version);
  await prepareDistribution(q.p, "JobPack", q.pack.id, cmd);
  await moveAppointment(q.p, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
    scheduling_policy_hash:
      "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
    publication_head_version: 1,
    selected_policy: {
      id: id("a0"),
      version: 1,
      content_hash:
        "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
    },
    start_at: "2031-09-24T03:00:00Z",
    end_at: "2031-09-24T05:00:00Z",
    crew: [
      {
        resource_id: id("a4", 9),
        resource_version: 1,
        calendar_version: 1,
        crew_role: "Lead",
        travel_before_minutes: 0,
        travel_after_minutes: 0,
        travel_reason: "SYN reviewed zero allowance",
      },
    ],
  });
  const current = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(current.needs_review, true);
  assert.equal(
    (await readOutput(q.p, q.pack.id, { kind: "JobPack" })).selected_issue!
      .pack_applicable,
    false,
  );
  const snapshot = await outputSnapshot(),
    history = await readDistribution(q.p, "JobPack", q.pack.id);
  await assert.rejects(
    recordDistributionOutcome(
      q.p,
      "JobPack",
      q.pack.id,
      outcome(cmd.attempt_id, 1, "SimulatedSent"),
    ),
    code("IssueNotApplicable"),
  );
  await assert.rejects(
    prepareDistribution(
      q.p,
      "JobPack",
      q.pack.id,
      prepare(q.issue_id, recipient.id, current.version),
    ),
    code("IssueNotApplicable"),
  );
  assert.deepEqual(await outputSnapshot(), snapshot);
  assert.deepEqual(await readDistribution(q.p, "JobPack", q.pack.id), history);
  await recordDistributionOutcome(
    q.p,
    "JobPack",
    q.pack.id,
    outcome(cmd.attempt_id, 1, "SimulatedNotSent"),
  );
});

test("DK03-C01 shared issue delegates exact native operations; pack recovery retains original stored bytes", async () => {
  const p = await principal(),
    pack = await prepared();
  await assert.rejects(
    runOutputAction(
      p,
      pack.id,
      envelope("JobPack", "RequestIssue", {
        ...base(),
        expected_version: pack.version,
      }),
    ),
    code("PackNotReady"),
  );
  await checkPack(p, pack.id, {
    ...base(),
    expected_version: pack.version,
    decision: "Checked",
  });
  const checked = (await readPack(p, pack.id)).items[0],
    cmd = { ...base(), expected_version: checked.version };
  const accepted = await runOutputAction(
    p,
    pack.id,
    envelope("JobPack", "RequestIssue", cmd),
  );
  assert.equal(accepted.type, "receipt");
  if (accepted.type !== "receipt") throw Error("Expected receipt");
  assert.deepEqual(
    (await requestIssue(p, pack.id, cmd)).receipt,
    accepted.receipt,
  );
  const actions = await readOutputActions(p, pack.id, { kind: "JobPack" }),
    job = actions.jobs[0];
  await processRenderJob(job.id, {
    afterStore: async () => {
      throw Error("SYN interrupted after storage");
    },
  });
  const original = await documentStore().locate({ ...p, operation_id: job.id });
  assert.ok(original);
  const recovered = await runOutputAction(
    p,
    pack.id,
    envelope("JobPack", "RecoverIssue", { job_id: job.id }),
  );
  assert.equal(recovered.type === "job" && recovered.job.state, "Issued");
  const before = await outputSnapshot();
  assert.deepEqual(
    await runOutputAction(
      p,
      pack.id,
      envelope("JobPack", "RecoverIssue", { job_id: job.id }),
    ),
    recovered,
  );
  assert.deepEqual(await outputSnapshot(), before);
  assert.deepEqual(
    await documentStore().locate({ ...p, operation_id: job.id }),
    original,
  );
  assert.deepEqual(
    await recoverOutputOperation(p, pack.id, {
      kind: "JobPack",
      operation_id: cmd.operation_id,
    }),
    accepted.receipt,
  );
  const another = await prepared(10);
  await assert.rejects(
    runOutputAction(
      p,
      another.id,
      envelope("JobPack", "RecoverIssue", { job_id: job.id }),
    ),
    denied,
  );
  await assert.rejects(
    recoverOutputOperation(p, another.id, {
      kind: "JobPack",
      operation_id: cmd.operation_id,
    }),
    denied,
  );
  assert.ok(
    !JSON.stringify(actions).match(/store_key|render_snapshot|lease_token/),
  );
});

test("DK03-C02 report issue uses exact review/template and resumes original finalisation", async () => {
  const q = await reviewed(),
    r = q.report;
  const cmd = {
    ...base(),
    expected_version: r.version,
    revision_id: r.revisions[0].id,
    review_id: r.reviews[0].id,
    template_id: r.template.id,
    template_version: r.template.version,
  };
  await assert.rejects(
    runOutputAction(
      q.reviewer,
      r.id,
      envelope("ServiceReport", "RequestIssue", {
        ...cmd,
        template_version: r.template.version + 1,
      }),
    ),
    code("TemplateChanged"),
  );
  const issued = await runOutputAction(
    q.reviewer,
    r.id,
    envelope("ServiceReport", "RequestIssue", cmd),
  );
  assert.equal(issued.type, "receipt");
  if (issued.type !== "receipt") throw Error("Expected receipt");
  assert.deepEqual(
    (await requestReportIssue(q.reviewer, r.id, cmd)).receipt,
    issued.receipt,
  );
  const job = (
    await readOutputActions(q.reviewer, r.id, { kind: "ServiceReport" })
  ).jobs[0];
  await processReportJob(job.id, {
    beforeFinalise: async () => {
      throw Error("SYN interrupted finalisation");
    },
  });
  const original = await documentStore().locate({
    ...q.reviewer,
    operation_id: job.id,
  });
  assert.ok(original);
  const result = await runOutputAction(
    q.reviewer,
    r.id,
    envelope("ServiceReport", "RecoverIssue", { job_id: job.id }),
  );
  assert.equal(result.type === "job" && result.job.state, "Issued");
  assert.deepEqual(
    await documentStore().locate({ ...q.reviewer, operation_id: job.id }),
    original,
  );
  assert.equal((await readReport(q.reviewer, r.id)).items[0].issues.length, 1);
  await assert.rejects(
    runOutputAction(
      q.reviewer,
      r.id,
      envelope("ServiceReport", "WithdrawPack", base()),
    ),
    denied,
  );
});

test("DK03-C03 per-recipient original replay, concurrent claims, unknown outcome and additive reconciliation", async () => {
  const q = await issued(),
    recipients = await rows(
      "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
      [q.issue_id],
    );
  const cmd = prepare(q.issue_id, recipients[0].id, q.pack.version);
  const raceResults = await Promise.allSettled([
    prepareDistribution(q.p, "JobPack", q.pack.id, cmd),
    prepareDistribution(q.p, "JobPack", q.pack.id, cmd),
  ]);
  const race = raceResults.map((result) => {
    if (result.status === "rejected") throw result.reason;
    return result.value;
  });
  assert.deepEqual(race[0].receipt, race[1].receipt);
  assert.equal(race.filter((r) => r.replayed).length, 1);
  await assert.rejects(
    prepareDistribution(q.p, "JobPack", q.pack.id, {
      ...cmd,
      attempt_id: randomUUID(),
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    prepareDistribution(q.p, "JobPack", q.pack.id, {
      ...cmd,
      ...base(),
      attempt_id: randomUUID(),
    }),
    code("DistributionRecoveryRequired"),
  );
  const uncertain = outcome(cmd.attempt_id, 1);
  await recordDistributionOutcome(q.p, "JobPack", q.pack.id, uncertain);
  await assert.rejects(
    recordDistributionOutcome(
      q.p,
      "JobPack",
      q.pack.id,
      outcome(cmd.attempt_id, 2, "SimulatedSent"),
    ),
    code("DistributionTransitionRefused"),
  );
  await assert.rejects(
    recordDistribution(q.p, q.issue_id, {
      ...base(),
      recipient_id: recipients[0].id,
      kind: "SimulatedSent",
      evidence: "SYN legacy route must not bypass an unknown attempt.",
    }),
    code("InvalidRelationship"),
  );
  const second = prepare(q.issue_id, recipients[1].id, q.pack.version);
  await prepareDistribution(q.p, "JobPack", q.pack.id, second);
  const correction = outcome(cmd.attempt_id, 2, "SimulatedNotSent");
  const resolved = await recordDistributionOutcome(
    q.p,
    "JobPack",
    q.pack.id,
    correction,
    true,
  );
  assert.deepEqual(
    (
      await recordDistributionOutcome(
        q.p,
        "JobPack",
        q.pack.id,
        correction,
        true,
      )
    ).receipt,
    resolved.receipt,
  );
  const contenders = await Promise.allSettled(
    [1, 2].map(() =>
      prepareDistribution(
        q.p,
        "JobPack",
        q.pack.id,
        prepare(q.issue_id, recipients[0].id, q.pack.version),
      ),
    ),
  );
  assert.equal(contenders.filter((x) => x.status === "fulfilled").length, 1);
  const history = await readDistribution(q.p, "JobPack", q.pack.id),
    first = history.find((a) => a.id === cmd.attempt_id)!;
  assert.deepEqual(
    first.events.map((e: { state: string }) => e.state),
    ["Prepared", "OutcomeUnknown", "SimulatedNotSent"],
  );
  assert.equal(first.sent_at, null);
  assert.equal(first.delivered_at, null);
  const other = history.find((a) => a.id === second.attempt_id)!;
  assert.equal(other.state, "Prepared");
  const success = outcome(second.attempt_id, 1, "SimulatedSent");
  await recordDistributionOutcome(q.p, "JobPack", q.pack.id, success);
  await assert.rejects(
    prepareDistribution(
      q.p,
      "JobPack",
      q.pack.id,
      prepare(q.issue_id, recipients[1].id, q.pack.version),
    ),
    code("DistributionRecoveryRequired"),
  );
  await assert.rejects(
    recordDistributionOutcome(
      q.p,
      "JobPack",
      q.pack.id,
      outcome(second.attempt_id, 1),
    ),
    code("VersionConflict"),
  );
  await assert.rejects(
    recordDistributionOutcome(q.p, "JobPack", q.pack.id, {
      ...outcome(second.attempt_id, 2),
      outcome: "Delivered",
    }),
    (e) => (e as { status: number }).status === 422,
  );
});

test("DK03-C04 current permissions, exact recipient binding and withdrawn historical reconciliation", async () => {
  const q = await issued(),
    recipient = (
      await rows(
        "SELECT id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
        [q.issue_id],
      )
    )[0];
  const cmd = prepare(q.issue_id, recipient.id, q.pack.version);
  await assert.rejects(
    prepareDistribution(
      await principal("second-company"),
      "JobPack",
      q.pack.id,
      cmd,
    ),
    denied,
  );
  await assert.rejects(
    prepareDistribution(
      await principal("assigned-technician"),
      "JobPack",
      q.pack.id,
      cmd,
    ),
    denied,
  );
  await withWorkingCompany(q.p.actor_id, id("20", 2), () =>
    assert.rejects(prepareDistribution(q.p, "JobPack", q.pack.id, cmd), denied),
  );
  await assert.rejects(
    prepareDistribution(q.p, "JobPack", q.pack.id, {
      ...cmd,
      recipient_id: randomUUID(),
    }),
    denied,
  );
  await assert.rejects(
    prepareDistribution(q.p, "JobPack", q.pack.id, {
      ...cmd,
      expected_version: q.pack.version + 1,
    }),
    code("VersionConflict"),
  );
  await prepareDistribution(q.p, "JobPack", q.pack.id, cmd);
  await recordDistributionOutcome(
    q.p,
    "JobPack",
    q.pack.id,
    outcome(cmd.attempt_id, 1),
  );
  await runOutputAction(
    q.p,
    q.pack.id,
    envelope("JobPack", "WithdrawPack", {
      ...base(),
      expected_version: q.pack.version,
    }),
  );
  await recordDistributionOutcome(
    q.p,
    "JobPack",
    q.pack.id,
    outcome(cmd.attempt_id, 2, "SimulatedSent"),
    true,
  );
  assert.equal((await readPack(q.p, q.pack.id)).items[0].status, "Withdrawn");
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='pack.issue'",
    [q.p.workspace_id, q.p.actor_id],
  );
  await assert.rejects(
    prepareDistribution(q.p, "JobPack", q.pack.id, cmd),
    denied,
  );
  await assert.rejects(readDistribution(q.p, "JobPack", q.pack.id), denied);
  await assert.rejects(
    recoverOutputOperation(q.p, q.pack.id, {
      kind: "JobPack",
      operation_id: cmd.operation_id,
    }),
    denied,
  );
});

test("DK03-C05 report recipient exactness, storage refusal and original operation recovery", async () => {
  const q = await reportIssued(),
    r = q.report,
    issue = r.issues[0];
  const cmd = prepare(issue.id, r.recipient_id, r.version);
  await assert.rejects(
    prepareDistribution(q.reviewer, "ServiceReport", r.id, {
      ...cmd,
      recipient_id: randomUUID(),
    }),
    denied,
  );
  const original = LocalSyntheticDocumentStore.prototype.read;
  try {
    LocalSyntheticDocumentStore.prototype.read = async () => {
      throw Error("SYN unavailable exact bytes");
    };
    await assert.rejects(
      prepareDistribution(q.reviewer, "ServiceReport", r.id, cmd),
      code("ExactOutputUnavailable"),
    );
    assert.equal(
      (await readDistribution(q.reviewer, "ServiceReport", r.id)).length,
      0,
    );
  } finally {
    LocalSyntheticDocumentStore.prototype.read = original;
  }
  const saved = await prepareDistribution(
    q.reviewer,
    "ServiceReport",
    r.id,
    cmd,
  );
  await recordDistributionOutcome(
    q.reviewer,
    "ServiceReport",
    r.id,
    outcome(cmd.attempt_id, 1, "SimulatedSent"),
  );
  assert.deepEqual(
    await recoverOutputOperation(q.reviewer, r.id, {
      kind: "ServiceReport",
      operation_id: cmd.operation_id,
    }),
    saved.receipt,
  );
  const facts = (await readDistribution(q.reviewer, "ServiceReport", r.id))[0];
  assert.equal(facts.output_hash, issue.output_hash);
  assert.equal(facts.state, "SimulatedSent");
  assert.equal(facts.sent_at, null);
  assert.equal(facts.delivered_at, null);
  assert.equal((await readReport(q.reviewer, r.id)).items[0].issues.length, 1);
});

test("DK03-C06 database guards and receipt failure roll back all distribution effects", async () => {
  const q = await issued(),
    recipient = (
      await rows("SELECT id FROM ppo.pack_recipients WHERE issue_id=$1", [
        q.issue_id,
      ])
    )[0];
  const cmd = prepare(q.issue_id, recipient.id, q.pack.version);
  await rows(
    `CREATE FUNCTION ppo.output_test_refuse_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.operation_id='${cmd.operation_id}'::uuid THEN RAISE EXCEPTION 'SYN receipt refusal' USING ERRCODE='23514'; END IF; RETURN NEW; END $$`,
  );
  await rows(
    "CREATE TRIGGER output_test_refuse_receipt BEFORE INSERT ON ppo.operation_receipts FOR EACH ROW EXECUTE FUNCTION ppo.output_test_refuse_receipt()",
  );
  const before = await outputSnapshot();
  try {
    await assert.rejects(
      prepareDistribution(q.p, "JobPack", q.pack.id, cmd),
      code("InvalidRelationship"),
    );
  } finally {
    await rows(
      "DROP TRIGGER output_test_refuse_receipt ON ppo.operation_receipts",
    );
    await rows("DROP FUNCTION ppo.output_test_refuse_receipt()");
  }
  assert.deepEqual(await outputSnapshot(), before);
  assert.equal((await readDistribution(q.p, "JobPack", q.pack.id)).length, 0);
  await prepareDistribution(q.p, "JobPack", q.pack.id, cmd);
  await assert.rejects(
    rows(
      "UPDATE ppo.output_distribution_attempts SET output_hash=repeat('a',64) WHERE id=$1",
      [cmd.attempt_id],
    ),
  );
  await assert.rejects(
    rows("DELETE FROM ppo.output_distribution_events WHERE attempt_id=$1", [
      cmd.attempt_id,
    ]),
  );
  await assert.rejects(
    rows(
      "INSERT INTO ppo.output_distribution_events(id,workspace_id,attempt_id,version,state,action,actor_id,operation_id,reason,evidence) VALUES($1,$2,$3,2,'SimulatedSent','Reconcile',$4,$5,'SYN','SYN')",
      [
        randomUUID(),
        q.p.workspace_id,
        cmd.attempt_id,
        q.p.actor_id,
        randomUUID(),
      ],
    ),
    code("23514"),
  );
  await assert.rejects(
    rows(
      "INSERT INTO ppo.output_distribution_attempts(id,workspace_id,kind,output_id,issue_id,recipient_id,output_hash,actor_id,recovery_owner_id,operation_id) VALUES($1,$2,'JobPack',$3,$4,$5,repeat('a',64),$6,$6,$7)",
      [
        randomUUID(),
        q.p.workspace_id,
        q.pack.id,
        q.issue_id,
        recipient.id,
        q.p.actor_id,
        randomUUID(),
      ],
    ),
    code("23514"),
  );
});

test("DK03-C07 populated 0090 upgrade retains all originals and adds only empty distribution storage", async () => {
  await recoverSchema();
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(90);
  await seed(90);
  await reportIssued();
  const before = await outputSnapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    users = await rows("SELECT * FROM ppo.users ORDER BY id");
  await migrate();
  await seed();
  assert.deepEqual(await outputSnapshot(), before);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    after.filter((r) => r.version <= 90),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 90).map((r) => r.version),
    [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 118],
  );
  assert.equal(
    (await rows("SELECT count(*) n FROM ppo.output_distribution_attempts"))[0]
      .n,
    "0",
  );
  await migrate();
  await seed();
  assert.deepEqual(await outputSnapshot(), before);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    after,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants WHERE capability NOT LIKE 'conversation.%' ORDER BY id"),
    grants,
  );
  assert.deepEqual(await rows("SELECT * FROM ppo.users ORDER BY id"), users);
});

test("DK03-C08 stale source cannot issue through shared recovery", async () => {
  const q = await queued();
  await rows("UPDATE ppo.sites SET version=version+1 WHERE id=$1", [
    q.pack.site_id,
  ]);
  const result = await runOutputAction(
    q.p,
    q.pack.id,
    envelope("JobPack", "RecoverIssue", { job_id: q.pack.jobs[0].id }),
  );
  assert.equal(result.type === "job" && result.job.state, "StaleSource");
  assert.equal(
    (await rows("SELECT count(*) n FROM ppo.pack_issues"))[0].n,
    "0",
  );
});

test("DK03-C09 loss of recipient access during storage refuses distribution; withdrawn preparations cannot simulate sending", async () => {
  const q = await issued(),
    recipient = (
      await rows(
        "SELECT id,user_id FROM ppo.pack_recipients WHERE issue_id=$1 ORDER BY id",
        [q.issue_id],
      )
    )[0];
  const cmd = prepare(q.issue_id, recipient.id, q.pack.version);
  const grants = await rows(
    "SELECT * FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='pack.read'",
    [q.p.workspace_id, recipient.user_id],
  );
  assert.ok(grants.length);
  const original = LocalSyntheticDocumentStore.prototype.read;
  try {
    LocalSyntheticDocumentStore.prototype.read = async function (context, key) {
      const bytes = await original.call(this, context, key);
      await rows(
        "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='pack.read'",
        [q.p.workspace_id, recipient.user_id],
      );
      return bytes;
    };
    await assert.rejects(
      prepareDistribution(q.p, "JobPack", q.pack.id, cmd),
      denied,
    );
  } finally {
    LocalSyntheticDocumentStore.prototype.read = original;
    for (const grant of grants)
      await rows(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1::jsonb)",
        [JSON.stringify(grant)],
      );
  }
  assert.equal((await readDistribution(q.p, "JobPack", q.pack.id)).length, 0);
  const before = await outputSnapshot();
  try {
    LocalSyntheticDocumentStore.prototype.read = async () => {
      throw Error("SYN issued file unavailable");
    };
    const recovery = await runOutputAction(
      q.p,
      q.pack.id,
      envelope("JobPack", "RecoverIssue", { job_id: q.job.id }),
    );
    assert.equal(
      recovery.type === "job" && recovery.job.availability,
      "ExactUnavailable",
    );
    assert.deepEqual(await outputSnapshot(), before);
  } finally {
    LocalSyntheticDocumentStore.prototype.read = original;
  }

  await prepareDistribution(q.p, "JobPack", q.pack.id, cmd);
  await runOutputAction(
    q.p,
    q.pack.id,
    envelope("JobPack", "WithdrawPack", {
      ...base(),
      expected_version: q.pack.version,
    }),
  );
  await assert.rejects(
    recordDistributionOutcome(
      q.p,
      "JobPack",
      q.pack.id,
      outcome(cmd.attempt_id, 1, "SimulatedSent"),
    ),
    code("IssueNotCurrent"),
  );
  await recordDistributionOutcome(
    q.p,
    "JobPack",
    q.pack.id,
    outcome(cmd.attempt_id, 1, "SimulatedNotSent"),
  );
  const pack = (await readPack(q.p, q.pack.id)).items[0];
  await assert.rejects(
    prepareDistribution(
      q.p,
      "JobPack",
      q.pack.id,
      prepare(q.issue_id, recipient.id, pack.version),
    ),
    code("IssueNotCurrent"),
  );
});
