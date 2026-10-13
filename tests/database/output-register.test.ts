import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { listOutputs, readOutput } from "../../src/outputs/reads";
import {
  issued,
  queued,
  prepared,
  principal,
  rows,
  base,
  content,
  id,
} from "../helpers/packs";
import { reportIssued, response } from "../helpers/reports";
import { recordResponse } from "../../src/reports/service";
import {
  recordDistribution,
  revisePack,
  checkPack,
  requestIssue,
  readPack,
  withdrawPack,
} from "../../src/documents/packs";
import { processRenderJob } from "../../src/documents/worker";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  readAppointment,
  cancelAppointment,
} from "../../src/scheduling/planner";
import { outputSnapshot } from "../helpers/output-register";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const denied = (e: unknown) =>
  [403, 404, 409].includes((e as { status: number }).status);
const detail = (kind: "JobPack" | "ServiceReport", issue_id?: string) => ({
  kind,
  ...(issue_id ? { issue_id } : {}),
});

test("DK03-B01 native pack/report journey, literal scoped paging, distinct recipient facts and zero writes", async () => {
  const q = await reportIssued(),
    p = q.reviewer;
  const pack = await readOutput(p, q.pack.id, detail("JobPack"));
  const recipient = pack.selected_issue!.distribution!.recipients[0];
  await recordDistribution(p, q.issue_id, {
    ...base(),
    recipient_id: recipient.id,
    kind: "SimulatedSent",
    evidence: "SYN simulated delivery only",
  });
  await recordResponse(q.p, q.report.id, {
    ...response(q.report, "Declined"),
    subject: "AttendanceFacts",
  });
  await recordResponse(q.p, q.report.id, {
    ...response(q.report, "Accepted"),
    subject: "ReportContent",
  });
  await recordResponse(q.p, q.report.id, {
    ...response(q.report, "Accepted", "DraftEvidence"),
    subject: "ReportContent",
  });
  const before = await outputSnapshot(),
    register = await listOutputs(p, { limit: 1 });
  assert.equal(register.total_matching, 2);
  assert.equal(register.has_more_in_window, true);
  const second = await listOutputs(p, { limit: 1, offset: 1 });
  assert.notEqual(second.items[0].id, register.items[0].id);
  assert.equal((await listOutputs(p, { q: "%_" })).total_matching, 0);
  assert.equal(
    (await listOutputs(p, { kind: "ServiceReport" })).total_matching,
    1,
  );
  assert.equal(
    (await listOutputs(p, { site_id: randomUUID() })).total_matching,
    0,
  );
  for (const row of [...register.items, ...second.items])
    assert.equal(row.availability, "NotChecked");
  const packDetail = await readOutput(p, q.pack.id, detail("JobPack"));
  const reportDetail = await readOutput(
    p,
    q.report.id,
    detail("ServiceReport"),
  );
  assert.equal(packDetail.availability, "Available");
  assert.equal(reportDetail.availability, "Available");
  assert.equal(
    packDetail.selected_issue!.distribution!.support,
    "SimulatedOnly",
  );
  assert.equal(packDetail.selected_issue!.distribution!.delivered_at, null);
  assert.equal(packDetail.selected_issue!.distribution!.sent_at, null);
  assert.ok(
    packDetail.selected_issue!.distribution!.recipients.some((r) =>
      r.events.some((e: { kind: string }) => e.kind === "SimulatedSent"),
    ),
  );
  assert.equal(
    packDetail.selected_issue!.distribution!.recipients.flatMap(
      (r) => r.acknowledgements,
    ).length,
    2,
  );
  const selected = reportDetail.selected_issue!;
  assert.equal(selected.distribution!.support, "NotRecordedBySource");
  assert.equal(selected.distribution!.responses.length, 1);
  assert.equal(selected.distribution!.responses[0].response, "Accepted");
  assert.equal(selected.distribution!.responses[0].subject, "ReportContent");
  assert.equal(selected.exact.pdf_hash, selected.output_hash);
  assert.equal(selected.revision.id, q.report.issues[0].revision_id);
  assert.match(selected.files!.pdf, /presentation_id=/);
  assert.ok(
    !JSON.stringify([packDetail, reportDetail]).match(
      /store_key|render_snapshot|lease_token|signature_key|html_base64/,
    ),
  );
  const field = await readOutput(q.p, q.pack.id, detail("JobPack"));
  assert.equal(field.preparation_visibility, "NotProvided");
  assert.deepEqual(field.preparations, []);
  assert.equal(field.selected_issue!.distribution!.recipients.length, 1);
  assert.equal(
    field.selected_issue!.distribution!.recipients[0].user_id,
    q.p.actor_id,
  );
  assert.deepEqual(await outputSnapshot(), before);
});

test("DK03-B02 current source scope, working company, assignment, family coverage and exact parent binding", async () => {
  const q = await issued(),
    p = q.p;
  const other = await principal("second-company"),
    systems = await principal("systems");
  await assert.rejects(readOutput(other, q.pack.id, detail("JobPack")), denied);
  await assert.rejects(listOutputs(systems), denied);
  assert.equal((await listOutputs(other)).total_matching, 0);
  await withWorkingCompany(p.actor_id, id("20", 2), async () => {
    assert.equal((await listOutputs(p)).total_matching, 0);
    await assert.rejects(readOutput(p, q.pack.id, detail("JobPack")), denied);
  });
  await assert.rejects(
    readOutput(
      { ...p, workspace_id: randomUUID() },
      q.pack.id,
      detail("JobPack"),
    ),
    denied,
  );
  await assert.rejects(
    readOutput(p, q.pack.id, detail("JobPack", randomUUID())),
    denied,
  );
  await assert.rejects(
    readOutput(p, q.pack.id, detail("ServiceReport", q.issue_id)),
    denied,
  );
  const another = await prepared(10);
  await assert.rejects(
    readOutput(p, another.id, detail("JobPack", q.issue_id)),
    denied,
  );
  const field = await principal("assigned-technician");
  const appointment = (await readAppointment(p, q.pack.appointment_id))
    .items[0];
  await cancelAppointment(p, appointment.id, {
    ...base(),
    expected_version: appointment.version,
    expected_work_order_version: appointment.work_order_version,
    expected_assignment_version: appointment.assignment_version,
  });
  await assert.rejects(readOutput(field, q.pack.id, detail("JobPack")), denied);
  assert.ok(!(await listOutputs(field)).items.some((x) => x.id === q.pack.id));
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='report.read'",
    [p.workspace_id, p.actor_id],
  );
  const remaining = await listOutputs(p);
  assert.equal(
    remaining.coverage.find((x) => x.kind === "ServiceReport")!.state,
    "NotPermitted",
  );
  assert.equal(remaining.total_matching, 2);
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.read'",
    [p.workspace_id, p.actor_id],
  );
  assert.equal((await listOutputs(p)).total_matching, 0);
  await assert.rejects(readOutput(p, q.pack.id, detail("JobPack")), denied);
});

test("DK03-B03 failed/durable preparation has no issue; native original recovery creates one retained issue", async () => {
  const q = await queued(),
    job = q.pack.jobs[0];
  const queuedRead = await readOutput(q.p, q.pack.id, detail("JobPack"));
  assert.equal(queuedRead.selected_issue, null);
  assert.equal(queuedRead.preparations[0].state, "Queued");
  const crew = await principal("assigned-technician");
  const protectedDraft = await readOutput(crew, q.pack.id, detail("JobPack"));
  assert.equal(protectedDraft.availability, "NotProvided");
  assert.equal(protectedDraft.output.current_revision_id, null);
  assert.deepEqual(protectedDraft.preparations, []);
  assert.equal(
    (await listOutputs(crew, { view: "unissued" })).total_matching,
    0,
  );
  const result = await processRenderJob(job.id, {
    beforeFinalise: async () => {
      throw Error("SYN finalisation unavailable");
    },
  });
  assert.ok("state" in result);
  const failed = await readOutput(q.p, q.pack.id, detail("JobPack"));
  assert.equal(failed.selected_issue, null);
  assert.equal(failed.availability, "NotIssued");
  assert.equal(failed.preparations[0].has_recorded_output, true);
  assert.equal(failed.preparations[0].state, "Failed");
  assert.equal((await listOutputs(q.p, { view: "issued" })).total_matching, 0);
  assert.equal(
    (await listOutputs(q.p, { view: "exceptions" })).total_matching,
    1,
  );
  await processRenderJob(job.id, {
    afterRender: async () => {
      throw Error("Must reuse the original retained bytes");
    },
  });
  const recovered = await readOutput(q.p, q.pack.id, detail("JobPack"));
  assert.equal(recovered.availability, "Available");
  assert.equal(recovered.issue_history.length, 1);
  assert.equal(recovered.preparations[0].id, job.id);
  assert.deepEqual(
    (await requestIssue(q.p, q.pack.id, q.cmd)).receipt,
    q.receipt.receipt,
  );
});

test("DK03-B04 superseded and withdrawn issues retain exact bytes without inheriting successor applicability", async () => {
  const q = await issued(),
    original = await readOutput(q.p, q.pack.id, detail("JobPack"));
  await revisePack(q.p, q.pack.id, {
    ...base(),
    expected_version: q.pack.version,
    content: content(),
  });
  let pack = (await readPack(q.p, q.pack.id)).items[0];
  await checkPack(q.p, pack.id, {
    ...base(),
    expected_version: pack.version,
    decision: "Checked",
  });
  pack = (await readPack(q.p, pack.id)).items[0];
  await requestIssue(q.p, pack.id, {
    ...base(),
    expected_version: pack.version,
  });
  pack = (await readPack(q.p, pack.id)).items[0];
  await processRenderJob(pack.jobs[0].id);
  pack = (await readPack(q.p, pack.id)).items[0];
  const old = await readOutput(q.p, pack.id, detail("JobPack", q.issue_id));
  assert.deepEqual(old.selected_issue!.exact, original.selected_issue!.exact);
  assert.equal(old.selected_issue!.is_current_issue, false);
  assert.equal(old.selected_issue!.pack_applicable, false);
  assert.equal(old.availability, "Available");
  assert.equal(old.issue_history.length, 2);
  assert.ok(old.selected_issue!.events.some((x) => x.kind === "Superseded"));
  const field = await principal("assigned-technician");
  const historical = await readOutput(
    field,
    pack.id,
    detail("JobPack", q.issue_id),
  );
  assert.equal(historical.issue_history.length, 1);
  assert.equal(historical.history_coverage, "SelectedIssueOnly");
  await withdrawPack(q.p, pack.id, {
    ...base(),
    expected_version: pack.version,
  });
  const withdrawn = await readOutput(q.p, pack.id, detail("JobPack"));
  assert.equal(withdrawn.selected_issue!.pack_applicable, false);
  assert.equal(withdrawn.availability, "Available");
  assert.ok(
    withdrawn.selected_issue!.events.some((x) => x.kind === "Withdrawn"),
  );
});

test("DK03-B05 missing/corrupt exact bytes preserve identity; grants are rechecked after storage", async () => {
  const q = await reportIssued(),
    nativeRead = LocalSyntheticDocumentStore.prototype.read;
  const cases = [
    { kind: "JobPack", id: q.pack.id },
    { kind: "ServiceReport", id: q.report.id },
  ] as const;
  for (const item of cases) {
    const original = await readOutput(q.reviewer, item.id, detail(item.kind));
    const before = await outputSnapshot();
    LocalSyntheticDocumentStore.prototype.read = async () => {
      throw Error("SYN unavailable exact bytes");
    };
    try {
      const missing = await readOutput(q.reviewer, item.id, detail(item.kind));
      assert.equal(missing.availability, "ExactUnavailable");
      assert.equal(missing.selected_issue!.id, original.selected_issue!.id);
      assert.deepEqual(
        missing.selected_issue!.exact,
        original.selected_issue!.exact,
      );
    } finally {
      LocalSyntheticDocumentStore.prototype.read = nativeRead;
    }
    LocalSyntheticDocumentStore.prototype.read = async () =>
      Buffer.from("SYN corrupt original");
    try {
      assert.equal(
        (await readOutput(q.reviewer, item.id, detail(item.kind))).availability,
        "ExactUnavailable",
      );
    } finally {
      LocalSyntheticDocumentStore.prototype.read = nativeRead;
    }
    assert.deepEqual(await outputSnapshot(), before);
  }
  let intercepted = false;
  LocalSyntheticDocumentStore.prototype.read = async function (ctx, key) {
    const bytes = await nativeRead.call(this, ctx, key);
    intercepted = true;
    await rows(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='report.read'",
      [q.reviewer.workspace_id, q.reviewer.actor_id],
    );
    return bytes;
  };
  try {
    await assert.rejects(
      readOutput(q.reviewer, q.report.id, detail("ServiceReport")),
      denied,
    );
  } finally {
    LocalSyntheticDocumentStore.prototype.read = nativeRead;
  }
  assert.equal(intercepted, true);
});

test("DK03-B06 visible discovery cap gives honest coverage and live pagination; authority expiry refuses stale counts", async () => {
  const p = await principal();
  // Synthetic draft fixtures: native FK/check/trigger constraints remain enabled.
  await rows(
    `WITH input AS (SELECT gen_random_uuid() AS appointment_id,gen_random_uuid() AS pack_id,n FROM generate_series(1,201) n),
    appointments AS (
      INSERT INTO ppo.appointments SELECT (jsonb_populate_record(NULL::ppo.appointments,
        to_jsonb(a)||jsonb_build_object('id',i.appointment_id,'display_number',NULL))).*
      FROM input i CROSS JOIN ppo.appointments a WHERE a.id=$1 RETURNING id
    )
    INSERT INTO ppo.packs(id,workspace_id,company_id,site_id,appointment_id,display_number,created_by,updated_by)
    SELECT i.pack_id,$2,a.company_id,a.site_id,i.appointment_id,NULL,$3,$3
    FROM input i JOIN appointments made ON made.id=i.appointment_id CROSS JOIN ppo.appointments a WHERE a.id=$1`,
    [id("a8", 9), p.workspace_id, p.actor_id],
  );
  const register = await listOutputs(p, { kind: "JobPack", limit: 50 });
  assert.equal(register.coverage[0].state, "BoundedWindow");
  assert.equal(register.total_matching, null);
  assert.equal(register.matching_in_window, 200);
  const tail = await listOutputs(p, {
    kind: "JobPack",
    offset: 150,
    limit: 50,
  });
  assert.equal(tail.items.length, 50);
  assert.equal(tail.has_more_in_window, false);
  assert.equal(
    new Set([...register.items, ...tail.items].map((x) => x.id)).size,
    100,
  );
  const pool = database(),
    client = await pool.connect(),
    connect = pool.connect,
    query = client.query;
  const execute = client.query.bind(client);
  let intercepted = false;
  pool.connect = (async () => client) as typeof pool.connect;
  client.query = (async (sql: string, values?: unknown[]) => {
    const result = await execute(sql, values);
    if (!intercepted && sql.includes("FROM ppo.pack_render_jobs")) {
      intercepted = true;
      await execute(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='pack.read'",
        [p.actor_id],
      );
    }
    return result;
  }) as typeof client.query;
  try {
    await assert.rejects(listOutputs(p, { kind: "JobPack" }), denied);
  } finally {
    pool.connect = connect;
    client.query = query;
  }
  assert.equal(intercepted, true);
});
