import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { AppError } from "../../src/platform/errors";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import { reportPhotoBytes } from "../../src/reports/photos";
import {
  amendReport,
  readReport,
  reviewReport,
  submitCompletion,
} from "../../src/reports/service";
import { captureEntry } from "../../src/field/entries";
import { saveCompletionDraft } from "../../src/field/completion";
import { readFieldJob } from "../../src/field/reads";
import { attachmentBytes } from "../../src/field/attachments";
import { startAttendance } from "../../src/field/start";
import {
  base,
  draft,
  entry,
  photo,
  png,
  principal,
  rows,
  started,
  startInput,
} from "../helpers/field";
import { decision } from "../helpers/reports";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(async () => {
  await closeDatabase();
  await reset();
});
after(closeDatabase);
const code =
  (...codes: string[]) =>
  (e: unknown) =>
    e instanceof AppError && codes.includes(e.code);
async function fixture(two = false, startPeer = false) {
  const q = await started(),
    a = await photo(q.job, q.p),
    b = two ? await photo(q.job, q.p, png(128, 64)) : null;
  const peer = await principal("second-technician");
  if (startPeer) {
    const peerJob = (await readFieldJob(peer, q.job.id)).items[0];
    await startAttendance(peer, peerJob.id, startInput(peerJob));
  }
  await captureEntry(
    q.p,
    entry(q.job, "Photo", {
      attachment_id: a.id,
      caption: "SYN submitted original A",
    }),
  );
  let job = (await readFieldJob(q.p, q.job.id)).items[0];
  await saveCompletionDraft(q.p, job.id, {
    ...draft(job),
    required_attachment_ids: [a.id],
  });
  job = (await readFieldJob(q.p, job.id)).items[0];
  const cmd = {
    ...base(),
    id: randomUUID(),
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  };
  await submitCompletion(q.p, job.id, cmd);
  const reviewer = await principal("coordinator"),
    report = (await readReport(reviewer, cmd.id)).items[0];
  const input = { revision_id: report.revisions[0].id, attachment_id: a.id };
  return { ...q, a, b, cmd, reviewer, report, input, peer };
}

test("report photo requires current review authority and exact report/revision/photo membership without writes", async () => {
  const q = await fixture(true);
  // Session creation is an audited action; complete it before the read-only snapshot.
  const denied = await Promise.all(
    [
      "assigned-technician",
      "second-technician",
      "technician",
      "second-company",
      "other-workspace",
      "systems",
    ].map((profile) => principal(profile)),
  );
  const facts = () =>
    rows(`SELECT
    (SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM ppo.report_revisions r) revisions,
    (SELECT jsonb_agg(to_jsonb(e) ORDER BY id) FROM ppo.field_entries e) entries,
    (SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM ppo.field_attachments a) attachments,
    (SELECT count(*) FROM ppo.report_reviews) reviews,
    (SELECT count(*) FROM ppo.audit_events) audit,
    (SELECT count(*) FROM ppo.operation_receipts) receipts`);
  const before = await facts();
  assert.deepEqual(
    (await reportPhotoBytes(q.reviewer, q.report.id, q.input)).bytes,
    q.a.bytes,
  );
  for (const actor of denied)
    await assert.rejects(
      reportPhotoBytes(actor, q.report.id, q.input),
      code("Forbidden", "RecordUnavailable"),
    );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, randomUUID(), q.input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, q.report.id, {
      ...q.input,
      revision_id: randomUUID(),
    }),
    code("RecordUnavailable"),
  );
  // B is a real available photo of this very attendance, but it was not submitted.
  await assert.rejects(
    reportPhotoBytes(q.reviewer, q.report.id, {
      ...q.input,
      attachment_id: q.b!.id,
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, q.report.id, { ...q.input, latest: true }),
    code("InvalidData"),
  );
  await assert.rejects(attachmentBytes(q.reviewer, q.a.id), code("Forbidden"));
  assert.deepEqual((await attachmentBytes(q.p, q.a.id)).bytes, q.a.bytes);
  for (const change of ["status='Quarantined'", "access_class='Public'"]) {
    await assert.rejects(
      database().query(
        `UPDATE ppo.field_attachments SET version=version+1,${change} WHERE id=$1`,
        [q.a.id],
      ),
      (e: unknown) => (e as { code: string }).code === "55000",
    );
  }
  assert.deepEqual(await facts(), before);
});

test("report photo refuses an actual other technician report revision and photo on the same appointment", async () => {
  const q = await fixture(false, true);
  let job = (await readFieldJob(q.peer, q.job.id)).items[0];
  const other = await photo(job, q.peer, png(128, 64));
  await captureEntry(
    q.peer,
    entry(job, "Photo", {
      attachment_id: other.id,
      caption: "SYN other technician original",
    }),
  );
  job = (await readFieldJob(q.peer, q.job.id)).items[0];
  await saveCompletionDraft(q.peer, job.id, {
    ...draft(job),
    entries: job.entries
      .filter((e) => e.actor_id === q.peer.actor_id && !e.superseded)
      .map((e) => ({ id: e.id, version: e.version })),
    required_attachment_ids: [other.id],
  });
  job = (await readFieldJob(q.peer, q.job.id)).items[0];
  const reportId = randomUUID();
  await submitCompletion(q.peer, job.id, {
    ...base(),
    id: reportId,
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  const report = (await readReport(q.reviewer, reportId)).items[0];
  const input = {
    revision_id: report.revisions[0].id,
    attachment_id: other.id,
  };
  assert.deepEqual(
    (await reportPhotoBytes(q.reviewer, reportId, input)).bytes,
    other.bytes,
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, q.report.id, input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, reportId, q.input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, q.report.id, {
      ...q.input,
      attachment_id: other.id,
    }),
    code("RecordUnavailable"),
  );
});

test("report photo retains historical membership instead of substituting a successor photo", async () => {
  const q = await fixture(true);
  await reviewReport(q.reviewer, q.report.id, decision(q.report));
  let report = (await readReport(q.reviewer, q.report.id)).items[0];
  const presentation = report.presentations[0];
  await amendReport(q.p, report.id, {
    ...base(),
    expected_version: report.version,
    revision_id: report.revisions[0].id,
  });
  let job = (await readFieldJob(q.p, q.job.id)).items[0];
  const original = job.entries.find((e) => e.kind === "Photo")!;
  await captureEntry(
    q.p,
    {
      ...entry(job, "Photo", {
        attachment_id: q.b!.id,
        caption: "SYN corrected original B",
      }),
      expected_version: original.version,
    },
    original.id,
  );
  job = (await readFieldJob(q.p, q.job.id)).items[0];
  await saveCompletionDraft(q.p, job.id, {
    ...draft(job),
    required_attachment_ids: [q.b!.id],
  });
  job = (await readFieldJob(q.p, q.job.id)).items[0];
  report = (await readReport(q.reviewer, report.id)).items[0];
  await submitCompletion(q.p, job.id, {
    ...q.cmd,
    ...base(),
    expected_report_version: report.version,
    expected_appointment_version: job.version,
    expected_draft_version: job.draft!.version,
    draft_revision_id: job.draft_revisions[0].id,
  });
  report = (await readReport(q.reviewer, report.id)).items[0];
  const successor = {
    revision_id: report.revisions[0].id,
    attachment_id: q.b!.id,
  };
  assert.notEqual(successor.revision_id, q.input.revision_id);
  assert.deepEqual(
    (await reportPhotoBytes(q.reviewer, report.id, q.input)).bytes,
    q.a.bytes,
  );
  assert.deepEqual(
    (await reportPhotoBytes(q.reviewer, report.id, successor)).bytes,
    q.b!.bytes,
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, report.id, {
      ...q.input,
      attachment_id: q.b!.id,
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    reportPhotoBytes(q.reviewer, report.id, {
      ...successor,
      attachment_id: q.a.id,
    }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(
    report.presentations.find((v: { id: string }) => v.id === presentation.id),
    presentation,
  );
});

test("report photo rechecks actual owner, scoped grants and active actor on every retrieval", async () => {
  const q = await fixture();
  const read = () => reportPhotoBytes(q.reviewer, q.report.id, q.input);
  const other = await principal("second-technician");
  await database().query(
    "UPDATE ppo.work_orders SET service_owner_id=$2,version=version+1 WHERE id=$1",
    [q.report.work_order.id, other.actor_id],
  );
  await assert.rejects(read(), code("RecordUnavailable"));
  await database().query(
    "UPDATE ppo.work_orders SET service_owner_id=$2,version=version+1 WHERE id=$1",
    [q.report.work_order.id, q.reviewer.actor_id],
  );
  for (const capability of ["report.review", "report.read"]) {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2",
      [q.reviewer.actor_id, capability],
    );
    await assert.rejects(read(), code("Forbidden", "RecordUnavailable"));
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability=$2",
      [q.reviewer.actor_id, capability],
    );
  }
  await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
    q.reviewer.actor_id,
  ]);
  await assert.rejects(read(), code("Forbidden"));
  await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
    q.reviewer.actor_id,
  ]);
  assert.deepEqual((await read()).bytes, q.a.bytes);
});

test("report photo refuses missing/corrupt bytes and authority revoked while storage is being read", async (t) => {
  const q = await fixture();
  const read = () => reportPhotoBytes(q.reviewer, q.report.id, q.input);
  const originalRead = LocalSyntheticDocumentStore.prototype.read;
  const missing = t.mock.method(
    LocalSyntheticDocumentStore.prototype,
    "read",
    async () => {
      throw new AppError(
        503,
        "ExactDocumentUnavailable",
        "SYN missing original",
      );
    },
  );
  await assert.rejects(read(), code("ReportPhotoUnavailable"));
  missing.mock.restore();
  const corrupt = t.mock.method(
    LocalSyntheticDocumentStore.prototype,
    "read",
    async () => Buffer.from("SYN corrupt original"),
  );
  await assert.rejects(read(), code("ReportPhotoUnavailable"));
  corrupt.mock.restore();
  const revoked = t.mock.method(
    LocalSyntheticDocumentStore.prototype,
    "read",
    async function (
      this: LocalSyntheticDocumentStore,
      ...args: Parameters<typeof originalRead>
    ) {
      const bytes = await originalRead.apply(this, args);
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='report.review'",
        [q.reviewer.actor_id],
      );
      return bytes;
    },
  );
  await assert.rejects(read(), code("Forbidden"));
  revoked.mock.restore();
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='report.review'",
    [q.reviewer.actor_id],
  );
  assert.deepEqual((await read()).bytes, q.a.bytes);
});
