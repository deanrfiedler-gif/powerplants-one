import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { canonical } from "../../src/platform/operations";
import { digest } from "../../src/documents/store";
import {
  recordResponse,
  readReport,
  presentationBytes,
  amendReport,
  submitCompletion,
  reviewReport,
} from "../../src/reports/service";
import { responseCommand } from "../../src/reports/validation";
import { readOperation } from "../../src/shared/receipts";
import { activityCommand, readActivity } from "../../src/activities/activities";
import { incidentCommand, incidentRead } from "../../src/incidents/service";
import { binding } from "../../src/incidents/context";
import { incidentHolds } from "../../src/incidents/holds";
import { syncBatch } from "../../src/offline/server";
import { operation } from "../helpers/offline";
import {
  reportIssued,
  reviewed,
  response,
  decision,
  base,
  principal,
  rows,
} from "../helpers/reports";
import { png, draft } from "../helpers/field";
import { readFieldJob } from "../../src/field/reads";
import { saveCompletionDraft } from "../../src/field/completion";
import {
  inspectionFixture,
  openInspection,
  saveInspection,
  inspect,
} from "../helpers/service-inspections";
import { inspectionCommand } from "../../src/inspections/service-commands";
import { estimateReviewSeedGrants, quotationReleaseSeedGrants } from "../helpers/engineering-materials-grants";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
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
    codes.includes((e as { code: string }).code);
const snapshot = async (tables: string[]) =>
  Promise.all(
    tables.map(async (t) => [
      t,
      await rows(
        `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
      ),
    ]),
  );
const mark = (width = 96) => {
  const b = png(width);
  return {
    sha256: digest(b),
    byte_count: b.length,
    content_base64: b.toString("base64"),
  };
};

test("FI07-01 every attendance acknowledgement remains distinct from report response, internal acceptance and Finance", async () => {
  const q = await reportIssued();
  assert.equal(q.report.responses.length, 0);
  const retained = await snapshot([
    "field_attendances",
    "attendance_acceptances",
    "appointments",
    "work_orders",
    "report_revisions",
    "report_reviews",
    "report_issues",
    "report_templates",
    "finance_handoffs",
  ]);
  for (const value of [
    "Accepted",
    "AcceptedWithReservations",
    "Declined",
    "Unavailable",
    "Disputed",
  ]) {
    const cmd = {
      ...response(q.report, value),
      subject: "AttendanceFacts",
      ...(value === "Accepted" ? { signature: mark() } : {}),
    };
    const one = await recordResponse(q.p, q.report.id, cmd);
    assert.deepEqual(
      (await recordResponse(q.p, q.report.id, cmd)).receipt,
      one.receipt,
    );
    assert.deepEqual(await readOperation(q.p, cmd.operation_id), one.receipt);
  }
  await recordResponse(q.p, q.report.id, {
    ...response(q.report, "Accepted", "DraftEvidence"),
    subject: "ReportContent",
  });
  const r = (await readReport(q.p, q.report.id)).items[0];
  assert.equal(
    r.responses.filter((x) => x.subject === "AttendanceFacts").length,
    5,
  );
  assert.equal(
    r.responses.filter((x) => x.subject === "ReportContent").length,
    1,
  );
  assert.equal(
    r.responses.find((x) => x.response === "Unavailable").respondent_name,
    null,
  );
  assert.equal(
    r.responses.find((x) => x.response === "Unavailable").signature_hash,
    null,
  );
  assert(
    r.responses.every(
      (x) =>
        x.captured_by &&
        x.actor_id === q.p.actor_id &&
        x.restrictions.work_authority === "NotGrantedByResponse",
    ),
  );
  assert.deepEqual(
    await snapshot([
      "field_attendances",
      "attendance_acceptances",
      "appointments",
      "work_orders",
      "report_revisions",
      "report_reviews",
      "report_issues",
      "report_templates",
      "finance_handoffs",
    ]),
    retained,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.report_follow_ups WHERE kind='CustomerResponse'",
      )
    )[0].n,
    4,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.customer_response_contexts SET subject='ReportContent'",
    ),
  );
});

test("FI07-02 two responders, one explicit successor, reused owned work and independent similar responses", async () => {
  const q = await reviewed(),
    original = {
      ...response(q.report, "Disputed", "DraftEvidence"),
      subject: "ReportContent",
    };
  await recordResponse(q.p, q.report.id, original);
  const before = (
    await rows("SELECT * FROM ppo.customer_responses WHERE id=$1", [
      original.id,
    ])
  )[0];
  const next = () => ({
    ...response(q.report, "AcceptedWithReservations", "DraftEvidence"),
    subject: "ReportContent",
    supersedes_response_id: original.id,
    correction_reason: "SYN clarification of the original stated reservation",
  });
  const a = next(),
    b = next();
  const results = await Promise.allSettled([
    recordResponse(q.p, q.report.id, a),
    recordResponse(q.reviewer, q.report.id, b),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    results.filter(
      (x) =>
        x.status === "rejected" &&
        x.reason.code === "ResponseCorrectionConflict",
    ).length,
    1,
  );
  const r = (await readReport(q.reviewer, q.report.id)).items[0];
  assert.equal(r.responses.length, 2);
  const successor = r.responses.find(
    (x) => x.supersedes_response_id === original.id,
  );
  assert(successor);
  assert.equal(successor.follow_up_activity_id, before.follow_up_activity_id);
  const activity = await readActivity(q.reviewer, before.follow_up_activity_id);
  assert.equal(activity.report_source?.href, `/service/reports/${q.report.id}`);
  await activityCommand(
    q.reviewer,
    activity.id,
    {
      ...base(),
      expected_version: activity.version,
      owner_id: q.reviewer.actor_id,
      summary: activity.summary,
      due_at: "2031-12-01T00:00:00Z",
      due_needed: false,
    },
    "update",
  );
  const changed = await readActivity(q.reviewer, activity.id);
  assert.equal(
    new Date(changed.due_at!).toISOString(),
    "2031-12-01T00:00:00.000Z",
  );
  await activityCommand(
    q.reviewer,
    activity.id,
    {
      ...base(),
      expected_version: changed.version,
      outcome:
        "SYN contact made; reservation remains the original customer fact",
    },
    "complete",
  );
  assert.deepEqual(
    (
      await rows("SELECT * FROM ppo.customer_responses WHERE id=$1", [
        original.id,
      ])
    )[0],
    before,
  );
  await recordResponse(q.p, q.report.id, {
    ...response(q.report, "Disputed", "DraftEvidence"),
    subject: "ReportContent",
  });
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].responses.length,
    3,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.report_follow_ups WHERE kind='CustomerResponse'",
      )
    )[0].n,
    2,
  );
  await assert.rejects(
    recordResponse(q.p, q.report.id, {
      ...next(),
      subject: "AttendanceFacts",
      supersedes_response_id: successor.id,
    }),
    code("ResponseCorrectionConflict"),
  );
});

test("FI07-03 changed recipient, source, service owner and permissions refuse fresh capture and retain originals", async () => {
  const q = await reviewed(),
    cmd = response(q.report, "Accepted", "DraftEvidence");
  const saved = await recordResponse(q.p, q.report.id, cmd);
  await database().query(
    "UPDATE ppo.work_orders SET service_owner_id=$2,version=version+1 WHERE id=$1",
    [q.report.work_order.id, (await principal("second-technician")).actor_id],
  );
  await assert.rejects(
    recordResponse(
      q.p,
      q.report.id,
      response(q.report, "Accepted", "DraftEvidence"),
    ),
    code("ResponseSourceChanged"),
  );
  assert.deepEqual(
    (await recordResponse(q.p, q.report.id, cmd)).receipt,
    saved.receipt,
  );
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].response_applicability.state,
    "ReviewRequired",
  );
  await database().query(
    "UPDATE ppo.people SET active=false,version=version+1 WHERE id=$1",
    [q.report.recipient_id],
  );
  await assert.rejects(
    recordResponse(
      q.p,
      q.report.id,
      response(q.report, "Accepted", "DraftEvidence"),
    ),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='report.respond'",
    [q.p.actor_id],
  );
  await assert.rejects(readOperation(q.p, cmd.operation_id));
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].can_respond,
    false,
  );
  await assert.rejects(recordResponse(q.p, q.report.id, cmd));
  await assert.rejects(
    readReport(await principal("second-company"), q.report.id),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.customer_responses"))[0].n,
    1,
  );
});

test("FI07-04 newly arriving incident hold permits factual response but preserves hold and redaction", async () => {
  const q = await reviewed(),
    cmd = {
      ...response(q.report, "Accepted", "DraftEvidence"),
      subject: "AttendanceFacts",
    };
  const target = (
    await rows(
      "SELECT scope_item_id,asset_id FROM ppo.scope_assets WHERE scope_revision_id=$1 ORDER BY scope_item_id LIMIT 1",
      [q.job.scope_revision_id],
    )
  )[0];
  const source = await transaction((c) =>
    binding(c, q.p, q.job.id, target.scope_item_id, target.asset_id),
  );
  const id = randomUUID();
  await incidentCommand(q.p, {
    ...base(),
    action: "create",
    id,
    appointment_id: q.job.id,
    ...target,
    source_hash: source.source_hash,
    facts: {
      classification: "Incident",
      occurred_at: new Date().toISOString(),
      summary: "FI07-INCIDENT-TITLE-CANARY",
      observations: "SYN later factual condition",
      immediate_response:
        "SYN reported condition without equipment intervention",
      source_reference: "SYN source",
      restricted_details: "FI07-PRIVATE-INCIDENT-CANARY",
    },
  });
  await incidentCommand(q.p, {
    ...base(),
    id,
    action: "submit",
    expected_version: 1,
  });
  const retained = await snapshot([
    "incidents",
    "incident_events",
    "attendance_acceptances",
    "appointments",
    "work_orders",
  ]);
  await recordResponse(q.p, q.report.id, cmd);
  const r = (await readReport(q.reviewer, q.report.id)).items[0];
  assert.equal(r.responses[0].restrictions.incident, "Held");
  assert.equal(r.response_applicability.restrictions!.incident, "Held");
  assert.equal(
    (await transaction((c) => incidentHolds(c, q.p, q.job.id))).length,
    1,
  );
  assert.equal((await incidentRead(q.p, id)).row.state, "Submitted");
  for (const canary of [
    "FI07-INCIDENT-TITLE-CANARY",
    "FI07-PRIVATE-INCIDENT-CANARY",
  ]) {
    assert(!JSON.stringify(r).includes(canary));
    assert(
      !(
        await presentationBytes(q.p, q.report.id, cmd.presentation_id)
      ).html.includes(canary),
    );
  }
  assert.deepEqual(
    await snapshot([
      "incidents",
      "incident_events",
      "attendance_acceptances",
      "appointments",
      "work_orders",
    ]),
    retained,
  );
  await recordResponse(q.p, q.report.id, {
    ...response(q.report, "Disputed", "DraftEvidence"),
    subject: "ReportContent",
  });
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].responses[0].restrictions
      .incident,
    "Held",
  );
});

test("FI07-05 failed inspection stays outstanding after internal review and customer acceptance", async () => {
  const f = await inspectionFixture(),
    attempt = await openInspection(f, f.tech, 1),
    a = await saveInspection(f, attempt, "120");
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: attempt,
      expected_version: a.row.version,
    },
    "capture",
  );
  const inspection = await inspect(f.co, f.id, "review");
  assert(inspection.defects.length);
  let job = (await readFieldJob(f.tech, f.id)).items[0];
  await saveCompletionDraft(f.tech, f.id, draft(job));
  job = (await readFieldJob(f.tech, f.id)).items[0];
  const id = randomUUID();
  await submitCompletion(f.tech, f.id, {
    ...base(),
    id,
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  let report = (await readReport(f.co, id)).items[0];
  await reviewReport(f.co, id, decision(report));
  report = (await readReport(f.tech, id)).items[0];
  const defects = await snapshot([
    "inspection_defects",
    "inspection_attempts",
    "inspection_reviews",
  ]);
  await recordResponse(
    f.tech,
    id,
    response(report, "Accepted", "DraftEvidence"),
  );
  assert.equal(
    (await readReport(f.tech, id)).items[0].responses[0].restrictions
      .inspection,
    "Outstanding",
  );
  assert.deepEqual(
    await snapshot([
      "inspection_defects",
      "inspection_attempts",
      "inspection_reviews",
    ]),
    defects,
  );
  assert.equal(
    (await readReport(f.tech, id)).items[0].appointment.status,
    "CompletedPendingReview",
  );
});

test("FI07-06 old queue hash, new subject replay, immutable corrections and rejected reassociation", async () => {
  const q = await reportIssued(),
    job = (await readFieldJob(q.p, q.job.id)).items[0];
  const old = response(q.report, "Disputed");
  assert(!("subject" in responseCommand(q.report.id, old)));
  const op = operation(q.p, job, "CustomerResponse", old, [], q.report.id),
    original = canonical(op);
  const saved = await syncBatch(q.p, { operations: [op] });
  assert.equal(saved.outcomes[0].state, "ServerSaved", JSON.stringify(saved));
  assert.deepEqual(
    (await syncBatch(q.p, { operations: [op] })).outcomes[0].receipt,
    saved.outcomes[0].receipt,
  );
  assert.equal(canonical(op), original);
  const ack = operation(
    q.p,
    job,
    "CustomerResponse",
    { ...response(q.report), subject: "AttendanceFacts", signature: mark() },
    [],
    q.report.id,
  );
  assert.equal(
    (await syncBatch(q.p, { operations: [ack] })).outcomes[0].state,
    "ServerSaved",
  );
  const bad = {
    ...response(q.report),
    subject: "AttendanceFacts",
    supersedes_response_id: String(ack.payload.id),
    correction_reason: "SYN corrected stated respondent role",
    signature: mark(),
  };
  await assert.rejects(
    recordResponse(q.p, q.report.id, bad),
    code("SignatureReassociationRefused"),
  );
  const offlineCorrection = operation(q.p, job, "CustomerResponse", { ...bad, signature: null }, [], q.report.id);
  assert.equal((await syncBatch(q.p, { operations: [offlineCorrection] })).outcomes[0].code, "OfflineResponseCorrectionUnsupported");
  await assert.rejects(
    recordResponse(q.p, q.report.id, {
      ...response(q.report),
      subject: "ReportContent",
      signature: mark(),
    }),
    code("SignatureReassociationRefused"),
  );
  const delayed = operation(
    q.p,
    job,
    "CustomerResponse",
    response(q.report),
    [],
    q.report.id,
  );
  await amendReport(q.p, q.report.id, {
    ...base(),
    expected_version: q.report.version,
    revision_id: q.report.revisions[0].id,
  });
  const rejected = await syncBatch(q.p, { operations: [delayed] });
  assert.equal(rejected.outcomes[0].state, "ReviewRequired");
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].responses.length,
    2,
  );
});

test("FI07-08 missing original evidence, revoked evidence access and wrong presentation bytes never save a response", async () => {
  const q = await reportIssued();
  const attachment = (
    await rows("SELECT * FROM ppo.field_attachments WHERE id=$1", [q.photo.id])
  )[0];
  const path = join(
    process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    q.p.workspace_id,
    attachment.storage_item_id,
  );
  const original = await readFile(path);
  try {
    await writeFile(path, "SYN damaged original");
    await assert.rejects(recordResponse(q.p, q.report.id, response(q.report)));
  } finally {
    await writeFile(path, original);
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='field.read.own'",
    [q.p.actor_id],
  );
  await assert.rejects(recordResponse(q.p, q.report.id, response(q.report)));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='field.read.own'",
    [q.p.actor_id],
  );
  const bad = { ...response(q.report), presented_hash: "0".repeat(64) };
  await assert.rejects(
    recordResponse(q.p, q.report.id, bad),
    code("PresentedContentChanged"),
  );
  await assert.rejects(
    recordResponse(q.p, q.report.id, {
      ...response(q.report),
      signature: { ...mark(), sha256: "0".repeat(64) },
    }),
    code("SignatureBytesMismatch"),
  );
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].responses.length,
    0,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.report_follow_ups WHERE kind='CustomerResponse'",
      )
    )[0].n,
    0,
  );
  await recordResponse(q.p, q.report.id, response(q.report));
});

test("FI07-09 queued attendance acknowledgements revalidate audience and current authority without rewriting originals", async () => {
  const q = await reviewed(),
    job = (await readFieldJob(q.p, q.job.id)).items[0];
  const op = operation(
    q.p,
    job,
    "CustomerResponse",
    {
      ...response(q.report, "Disputed", "DraftEvidence"),
      subject: "AttendanceFacts",
    },
    [],
    q.report.id,
  );
  const original = canonical(op);
  await database().query(
    "UPDATE ppo.people SET version=version+1 WHERE id=$1",
    [q.report.recipient_id],
  );
  const result = await syncBatch(q.p, { operations: [op] });
  assert.equal(result.outcomes[0].state, "ReviewRequired");
  assert.equal(result.outcomes[0].code, "ResponseSourceChanged");
  assert.equal(canonical(op), original);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='report.respond'",
    [q.p.actor_id],
  );
  assert.notEqual(
    (await syncBatch(q.p, { operations: [op] })).outcomes[0].state,
    "ServerSaved",
  );
  assert.equal(canonical(op), original);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.customer_responses"))[0].n,
    0,
  );
});

test("FI07-07 populated 0056 upgrade preserves original response hashes, output bytes, grants and exact ledgers", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(56);
  await seed(56);
  const q = await reportIssued(),
    cmd = response(q.report, "Disputed"),
    saved = await recordResponse(q.p, q.report.id, cmd);
  const originals = await snapshot([
    "field_attendances",
    "field_entries",
    "attendance_acceptances",
    "report_revisions",
    "report_reviews",
    "report_issues",
    "report_presentations",
    "customer_responses",
    "report_templates",
    "operation_receipts",
  ]);
  const users = await rows("SELECT * FROM ppo.users ORDER BY id");
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  const seedLedger = await rows(
    "SELECT * FROM ppo.seed_receipts ORDER BY version",
  );
  const bytes = await presentationBytes(q.p, q.report.id, cmd.presentation_id);
  await migrate();
  await seed();
  const firstUpgrade = await snapshot(["permission_grants", "users", "seed_receipts"]);
  const firstLedger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await snapshot(["permission_grants", "users", "seed_receipts"]),
    firstUpgrade,
  );
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    firstLedger,
  );
  assert.deepEqual(
    await snapshot([
      "field_attendances",
      "field_entries",
      "attendance_acceptances",
      "report_revisions",
      "report_reviews",
      "report_issues",
      "report_presentations",
      "customer_responses",
      "report_templates",
      "operation_receipts",
    ]),
    originals,
  );
  const upgradedGrants = await rows(
    "SELECT * FROM ppo.permission_grants ORDER BY id",
  );
  const originalGrantIds = new Set(grants.map((g) => g.id));
  assert.deepEqual(upgradedGrants.filter((g) => originalGrantIds.has(g.id)), grants);
  const grantContents = (values: typeof grants) => values.map((g) => JSON.stringify(
    Object.fromEntries(Object.entries(g)
      .filter(([key]) => key !== "id")
      .sort(([a], [b]) => a.localeCompare(b))),
  )).sort();
  const expectedGrants = [...estimateReviewSeedGrants(grants), ...quotationReleaseSeedGrants(grants)];
  assert.equal(expectedGrants.length, 18);
  assert.deepEqual(
    grantContents(upgradedGrants.filter((g) => !originalGrantIds.has(g.id))),
    grantContents(expectedGrants),
  );
  const upgradedUsers = await rows("SELECT * FROM ppo.users ORDER BY id");
  const originalUserIds = new Set(users.map((u) => u.id));
  assert.deepEqual(upgradedUsers.filter((u) => originalUserIds.has(u.id)), users);
  assert.deepEqual(upgradedUsers.filter((u) => !originalUserIds.has(u.id)), [
    {
      id: "e5050059-0000-4000-8000-000000000001",
      workspace_id: "10000000-0000-4000-8000-000000000001",
      issuer: "PPO-LocalSynthetic",
      subject_id: "quotation-approver",
      display_name: "SYN Quotation approver",
      active: true,
      synthetic: true,
    },
    {
      id: "e5050059-0000-4000-8000-000000000002",
      workspace_id: "10000000-0000-4000-8000-000000000001",
      issuer: "PPO-LocalSynthetic",
      subject_id: "quotation-issuer",
      display_name: "SYN Quotation issuer",
      active: true,
      synthetic: true,
    },
  ]);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(after.filter((row) => row.version <= 56), ledger);
  assert.deepEqual(after.filter((row) => row.version > 56).map((row) => row.version), [57, 58, 59, 60, 61, 62]);
  const afterSeeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  assert.deepEqual(afterSeeds.filter((row) => row.version <= 56), seedLedger);
  assert.deepEqual(afterSeeds.filter((row) => row.version > 56).map((row) => row.version), [58, 59]);
  assert.deepEqual(
    (await recordResponse(q.p, q.report.id, cmd)).receipt,
    saved.receipt,
  );
  assert.equal(
    (
      await rows("SELECT count(*)::int n FROM ppo.customer_response_contexts")
    )[0].n,
    0,
  );
  assert.equal(
    (await readReport(q.p, q.report.id)).items[0].responses[0].subject,
    "ReportContent",
  );
  const recovered = await presentationBytes(
    q.p,
    q.report.id,
    cmd.presentation_id,
  );
  assert.equal(digest(recovered.html), digest(bytes.html));
  assert.equal(digest(recovered.pdf!), digest(bytes.pdf!));
  await recordResponse(q.p, q.report.id, {
    ...response(q.report),
    subject: "AttendanceFacts",
  });
});
