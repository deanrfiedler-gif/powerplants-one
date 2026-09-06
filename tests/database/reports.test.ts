import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  submitCompletion,
  reviewReport,
  amendReport,
  recordResponse,
  readReport,
  presentationBytes,
} from "../../src/reports/service";
import {
  processReportJob,
  requestReportIssue,
  readReportJob,
} from "../../src/reports/worker";
import { readOperation } from "../../src/shared/receipts";
import { captureEntry } from "../../src/field/entries";
import { saveCompletionDraft } from "../../src/field/completion";
import { readFieldJob } from "../../src/field/reads";
import { entry, draft, png, started } from "../helpers/field";
import {
  submitted,
  reviewed,
  reportIssued,
  decision,
  response,
  principal,
  base,
  rows,
} from "../helpers/reports";
import { canonical } from "../../src/platform/operations";
import { digest } from "../../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use disposable test database");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...v: string[]) =>
  (e: unknown) =>
    v.includes((e as { code: string }).code);
test("P09 fresh and P08 upgrade preserve originals and repeat seed does not revive revoked report grants", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(8);
  await seed(7);
  const q = await started(),
    before = await rows(
      "SELECT to_jsonb(a) a FROM ppo.field_attendances a ORDER BY id",
    );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT to_jsonb(a) a FROM ppo.field_attendances a ORDER BY id"),
    before,
  );
  assert.equal((await readFieldJob(q.p, q.job.id)).items[0].report, null);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='report.respond'",
    [q.p.actor_id],
  );
  await seed();
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability='report.respond' AND valid_to IS NULL",
        [q.p.actor_id],
      )
    )[0].n,
    0,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    9,
  );
});
test("P09 exact submission freezes entries; duplicate original recovers same receipt; changed reuse conflicts", async () => {
  const q = await submitted();
  assert.equal(q.report.appointment.status, "CompletedPendingReview");
  assert.deepEqual(
    (await submitCompletion(q.p, q.job.id, q.cmd)).receipt,
    q.result.receipt,
  );
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.result.receipt,
  );
  await assert.rejects(
    submitCompletion(q.p, q.job.id, { ...q.cmd, reason: "SYN changed" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    captureEntry(q.p, entry(q.job)),
    code("SubmissionFrozen"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.report_revisions SET change_reason='changed' WHERE id=$1",
      [q.report.revisions[0].id],
    ),
  );
  assert.equal(q.report.finance_state, "Not implemented — P10");
});
test("P09 return comments, linked correction, successor submission and narrow attendance acceptance", async () => {
  const q = await submitted(),
    cmd = decision(q.report, "Returned");
  await reviewReport(q.reviewer, q.report.id, cmd);
  let r = (await readReport(q.p, q.report.id)).items[0];
  assert.equal(r.status, "Returned");
  assert.equal(r.appointment.status, "CompletedPendingReview");
  const source = q.job.entries.find((e) => e.kind === "Observation")!,
    next = {
      ...entry(q.job),
      expected_version: source.version,
      payload: {
        ...source.payload,
        finding:
          "SYN linked factual correction: external label remained uncertain.",
      },
    };
  await captureEntry(q.p, next, source.id);
  let job = (await readFieldJob(q.p, q.job.id)).items[0];
  await saveCompletionDraft(q.p, job.id, draft(job));
  job = (await readFieldJob(q.p, job.id)).items[0];
  await submitCompletion(q.p, job.id, {
    ...base(),
    id: r.id,
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: r.version,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  r = (await readReport(q.reviewer, r.id)).items[0];
  await reviewReport(q.reviewer, r.id, decision(r));
  r = (await readReport(q.reviewer, r.id)).items[0];
  assert.equal(r.status, "Reviewed");
  assert.equal(r.appointment.status, "Completed");
  assert.equal(r.revisions.length, 2);
  assert.equal(
    r.revisions[1].snapshot.entries.find(
      (e: { id: string }) => e.id === source.id,
    ).payload.finding,
    source.payload.finding,
  );
  assert.ok(
    r.follow_ups.some((x: { kind: string }) => x.kind === "RemainingWork"),
  );
  assert.notEqual(r.work_order.status, "Closed");
});
test("P09 competing approve and return decide exactly one set and late retry recovers original", async () => {
  const q = await submitted(),
    a = decision(q.report),
    b = decision(q.report, "Returned"),
    results = await Promise.allSettled([
      reviewReport(q.reviewer, q.report.id, a),
      reviewReport(q.reviewer, q.report.id, b),
    ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.report_reviews"))[0].n,
    1,
  );
  const index = results.findIndex((x) => x.status === "fulfilled"),
    r = await reviewReport(q.reviewer, q.report.id, index === 0 ? a : b);
  assert.equal(r.replayed, true);
});
test("P09 strict review fields, exact set/version and server owner permissions", async () => {
  const q = await submitted(),
    cmd = decision(q.report);
  for (const patch of [
    { unknown: true },
    { source_hash: "bad" },
    { entry_decisions: [] },
    {
      entry_decisions: cmd.entry_decisions.map((x) => ({ ...x, version: 99 })),
    },
    { recipient_id: randomUUID() },
  ])
    await assert.rejects(
      reviewReport(q.reviewer, q.report.id, { ...cmd, ...patch }),
    );
  for (const profile of [
    "systems",
    "assigned-technician",
    "second-company",
    "other-workspace",
    "site-observer",
  ]) {
    const p = await principal(profile);
    await assert.rejects(reviewReport(p, q.report.id, cmd));
  }
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.report_reviews"))[0].n,
    0,
  );
});
test("P09 required bytes missing after submission block review without changing original", async () => {
  const q = await submitted(),
    file = (
      await rows(
        "SELECT storage_item_id FROM ppo.field_attachments WHERE id=$1",
        [q.photo.id],
      )
    )[0];
  const path = join(
      process.env.PPO_DOCUMENT_DIRECTORY ??
        join(homedir(), ".ppo-synthetic-documents"),
      q.p.workspace_id,
      file.storage_item_id,
    ),
    bytes = await readFile(path);
  await unlink(path);
  await assert.rejects(
    reviewReport(q.reviewer, q.report.id, decision(q.report)),
  );
  await writeFile(path, bytes, { mode: 0o600 });
  assert.equal(
    (await readReport(q.reviewer, q.report.id)).items[0].status,
    "Submitted",
  );
});
test("P09 all five exact responses, mandatory remarks, immutable synthetic marks and original receipt recovery", async () => {
  const q = await reportIssued();
  for (const value of [
    "Accepted",
    "AcceptedWithReservations",
    "Declined",
    "Unavailable",
    "Disputed",
  ]) {
    const cmd = response(q.report, value);
    if (value === "Accepted") {
      const bytes = png();
      Object.assign(cmd, {
        signature: {
          sha256: digest(bytes),
          byte_count: bytes.length,
          content_base64: bytes.toString("base64"),
        },
      });
    }
    const result = await recordResponse(q.p, q.report.id, cmd);
    assert.deepEqual(
      (await recordResponse(q.p, q.report.id, cmd)).receipt,
      result.receipt,
    );
    assert.deepEqual(
      await readOperation(q.p, cmd.operation_id),
      result.receipt,
    );
  }
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.customer_responses"))[0].n,
    5,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.customer_responses WHERE follow_up_activity_id IS NOT NULL",
      )
    )[0].n,
    4,
  );
  await assert.rejects(
    recordResponse(q.p, q.report.id, {
      ...response(q.report, "Disputed"),
      remarks: "x",
    }),
  );
  await assert.rejects(
    recordResponse(q.p, q.report.id, {
      ...response(q.report, "Unavailable"),
      respondent_name: "Invented",
    }),
  );
  await assert.rejects(
    database().query("UPDATE ppo.customer_responses SET response='Accepted'"),
  );
});
test("P09 issued bytes and every customer projection exclude private fields and filenames", async () => {
  const q = await reportIssued(),
    v = q.report.presentations.find(
      (x: { kind: string }) => x.kind === "IssuedReport",
    )!,
    b = await presentationBytes(q.p, q.report.id, v.id);
  assert.ok(b.pdf);
  const text = b.html + JSON.stringify(b.manifest);
  for (const hidden of [
    "SYN exact 90-minute component interval",
    "SYN-inspection.png",
    "stock_status",
    "PRIVATE_FINANCE_CANARY",
    "SYN exact factual evidence checked",
    "provider_path",
  ])
    assert.equal(text.includes(hidden), false, hidden);
  assert.ok(text.includes("Suspected"));
  assert.ok(text.includes("Still unclear"));
  assert.equal(digest(b.html), v.content_hash);
  await assert.rejects(
    presentationBytes(await principal("systems"), q.report.id, v.id),
  );
  await assert.rejects(presentationBytes(q.p, randomUUID(), v.id));
});
test("P09 storage success then database failure reconciles original bundle and one issue", async () => {
  const q = await reviewed(),
    r = q.report;
  await requestReportIssue(q.reviewer, r.id, {
    ...base(),
    expected_version: r.version,
    revision_id: r.revisions[0].id,
    review_id: r.reviews[0].id,
    template_id: r.template.id,
    template_version: r.template.version,
  });
  const job = (await readReport(q.reviewer, r.id)).items[0].jobs[0];
  const failed = await processReportJob(job.id, {
    afterStore: async () => {
      throw Error("synthetic database interruption");
    },
  });
  assert.equal("state" in failed && failed.state, "Failed");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.report_issues"))[0].n,
    0,
  );
  const path = join(
      process.env.PPO_DOCUMENT_DIRECTORY ??
        join(homedir(), ".ppo-synthetic-documents"),
      q.p.workspace_id,
      job.id,
    ),
    before = digest(await readFile(path));
  const done = await processReportJob(job.id);
  assert.ok("issue_id" in done);
  assert.equal(digest(await readFile(path)), before);
  await processReportJob(job.id);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.report_issues"))[0].n,
    1,
  );
});
test("P09 template change during real generation retains stale owned output and no issue", async () => {
  const q = await reviewed(),
    r = q.report;
  await requestReportIssue(q.reviewer, r.id, {
    ...base(),
    expected_version: r.version,
    revision_id: r.revisions[0].id,
    review_id: r.reviews[0].id,
    template_id: r.template.id,
    template_version: r.template.version,
  });
  const job = (await readReport(q.reviewer, r.id)).items[0].jobs[0],
    result = await processReportJob(job.id, {
      afterRender: async () => {
        await database().query(
          "UPDATE ppo.report_template_policy SET version=version+1",
        );
      },
    });
  assert.equal("state" in result && result.state, "StaleSource");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.report_issues"))[0].n,
    0,
  );
  assert.equal((await readReportJob(q.reviewer, job.id)).state, "StaleSource");
});
test("P09 revoked review and response receipt capability returns no original receipt", async () => {
  const q = await reportIssued(),
    cmd = response(q.report);
  await recordResponse(q.p, q.report.id, cmd);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='report.respond'",
    [q.p.actor_id],
  );
  await assert.rejects(readOperation(q.p, cmd.operation_id));
  await assert.rejects(recordResponse(q.p, q.report.id, cmd));
});
test("P09 accepted attendance correction preserves old output and refuses prior response reassociation", async () => {
  const q = await reportIssued(),
    old = q.report,
    cmd = response(old);
  await recordResponse(q.p, old.id, cmd);
  const v = old.presentations.find(
      (x: { kind: string }) => x.kind === "IssuedReport",
    )!,
    bytes = await presentationBytes(q.p, old.id, v.id);
  await amendReport(q.p, old.id, {
    ...base(),
    expected_version: old.version,
    revision_id: old.revisions[0].id,
  });
  const job = (await readFieldJob(q.p, q.job.id)).items[0];
  await assert.rejects(captureEntry(q.p, entry(job)), code("NewVisitRequired"));
  const source = job.entries.find((e) => e.kind === "Observation")!;
  await captureEntry(
    q.p,
    {
      ...entry(job),
      expected_version: source.version,
      payload: {
        ...source.payload,
        finding:
          "SYN corrected customer finding; previous uncertainty is retained.",
      },
    },
    source.id,
  );
  let current = (await readFieldJob(q.p, job.id)).items[0];
  await saveCompletionDraft(q.p, job.id, draft(current));
  current = (await readFieldJob(q.p, job.id)).items[0];
  let r = (await readReport(q.p, old.id)).items[0];
  await submitCompletion(q.p, job.id, {
    ...base(),
    id: r.id,
    attendance_id: job.attendance!.id,
    draft_revision_id: current.draft_revisions[0].id,
    expected_draft_version: current.draft!.version,
    expected_report_version: r.version,
    expected_appointment_version: current.version,
    attendance_end_at: new Date(old.appointment.actual_end_at!).toISOString(),
  });
  r = (await readReport(q.reviewer, r.id)).items[0];
  await reviewReport(q.reviewer, r.id, decision(r));
  r = (await readReport(q.reviewer, r.id)).items[0];
  await requestReportIssue(q.reviewer, r.id, {
    ...base(),
    expected_version: r.version,
    revision_id: r.revisions[0].id,
    review_id: r.reviews[0].id,
    template_id: r.template.id,
    template_version: r.template.version,
  });
  r = (await readReport(q.reviewer, r.id)).items[0];
  await processReportJob(r.jobs[0].id);
  r = (await readReport(q.reviewer, r.id)).items[0];
  assert.equal(r.issues.length, 2);
  assert.equal(r.appointment.status, "Completed");
  assert.equal(r.responses.length, 1);
  const newer = r.presentations.find(
    (x: { kind: string; revision_id: string }) =>
      x.kind === "IssuedReport" && x.revision_id === r.revisions[0].id,
  )!;
  await assert.rejects(
    recordResponse(q.p, r.id, {
      ...cmd,
      ...base(),
      id: randomUUID(),
      expected_report_version: r.version,
      presentation_id: newer.id,
      revision_id: newer.revision_id,
    }),
    code("PresentedContentChanged"),
  );
  assert.deepEqual((await presentationBytes(q.p, r.id, v.id)).pdf, bytes.pdf);
  await mkdir("verification-evidence/p09", { recursive: true });
  for (const [name, pres] of [
    ["old", v],
    ["new", newer],
  ] as const) {
    const b = await presentationBytes(q.p, r.id, pres.id);
    await writeFile(`verification-evidence/p09/${name}.pdf`, b.pdf!);
    await writeFile(`verification-evidence/p09/${name}.html`, b.html);
    await writeFile(
      `verification-evidence/p09/${name}-manifest.json`,
      JSON.stringify(b.manifest, null, 2),
    );
  }
});

for (const action of [
  "submit",
  "review",
  "return",
  "amend",
  "issue",
  "response",
] as const)
  for (const table of [
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ] as const)
    test(`P09 ${action} late ${table} rollback preserves business facts and original recovery`, async () => {
      const q =
        action === "submit"
          ? await started()
          : action === "review" || action === "return"
            ? await submitted()
            : action === "response"
              ? await reportIssued()
              : await reviewed();
      let invoke: () => Promise<unknown>;
      if (action === "submit") {
        await saveCompletionDraft(q.p, q.job.id, draft(q.job));
        const j = (await readFieldJob(q.p, q.job.id)).items[0],
          cmd = {
            ...base(),
            id: randomUUID(),
            attendance_id: j.attendance!.id,
            draft_revision_id: j.draft_revisions[0].id,
            expected_draft_version: j.draft!.version,
            expected_report_version: 0,
            expected_appointment_version: j.version,
            attendance_end_at: new Date().toISOString(),
          };
        invoke = () => submitCompletion(q.p, j.id, cmd);
      } else {
        if (!("report" in q)) throw Error("setup");
        const r = q.report;
        if (action === "review" || action === "return") {
          const cmd = decision(
            r,
            action === "return" ? "Returned" : "Approved",
          );
          invoke = () => reviewReport(q.reviewer, r.id, cmd);
        } else if (action === "amend") {
          const cmd = {
            ...base(),
            expected_version: r.version,
            revision_id: r.revisions[0].id,
          };
          invoke = () => amendReport(q.p, r.id, cmd);
        } else if (action === "response") {
          const bytes = png(),
            cmd = {
              ...response(r, "AcceptedWithReservations"),
              signature: {
                sha256: digest(bytes),
                byte_count: bytes.length,
                content_base64: bytes.toString("base64"),
              },
            };
          invoke = () => recordResponse(q.p, r.id, cmd);
        } else {
          await requestReportIssue(q.reviewer, r.id, {
            ...base(),
            expected_version: r.version,
            revision_id: r.revisions[0].id,
            review_id: r.reviews[0].id,
            template_id: r.template.id,
            template_version: r.template.version,
          });
          const j = (await readReport(q.reviewer, r.id)).items[0].jobs[0];
          invoke = () => processReportJob(j.id);
        }
      }
      const facts = async () =>
        rows(
          "SELECT (SELECT count(*) FROM ppo.report_revisions) revisions,(SELECT count(*) FROM ppo.report_reviews) reviews,(SELECT count(*) FROM ppo.attendance_acceptances) attendance,(SELECT count(*) FROM ppo.report_issues) issues,(SELECT count(*) FROM ppo.report_presentations) presentations,(SELECT count(*) FROM ppo.customer_responses) responses,(SELECT count(*) FROM ppo.activities) tasks,(SELECT count(*) FROM ppo.audit_events) audit,(SELECT count(*) FROM ppo.operation_receipts) receipts,(SELECT count(*) FROM ppo.outbox_jobs) outbox,(SELECT jsonb_agg(jsonb_build_array(id,version,status)) FROM ppo.service_reports) reports",
        );
      const before = await facts();
      await database().query(
        `CREATE FUNCTION ppo.fail_p09() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN P09 late failure'; END $$; CREATE TRIGGER p09_fail BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_p09()`,
      );
      if (action === "issue")
        assert.equal(((await invoke()) as { state: string }).state, "Failed");
      else await assert.rejects(invoke());
      assert.deepEqual(await facts(), before);
      await database().query(
        `DROP TRIGGER p09_fail ON ppo.${table}; DROP FUNCTION ppo.fail_p09()`,
      );
      const accepted = await invoke();
      if (action === "issue") assert.ok("issue_id" in (accepted as object));
      else assert.equal((accepted as { replayed: boolean }).replayed, false);
    });
test("P09 exact render input, response nullable checks and accepted end are physically protected", async () => {
  const q = await reportIssued();
  await assert.rejects(
    database().query(
      "UPDATE ppo.report_render_jobs SET input_hash=repeat('0',64)",
    ),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.appointments SET actual_end_at=actual_end_at+interval '1 minute' WHERE id=$1",
      [q.job.id],
    ),
  );
  const r = q.report,
    cmd = response(r, "Unavailable");
  await assert.rejects(recordResponse(q.p, r.id, { ...cmd, remarks: null }));
  await assert.rejects(
    recordResponse(q.p, r.id, { ...response(r), respondent_name: null }),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.customer_responses"))[0].n,
    0,
  );
});
test("P09 source snapshot canonical hash uses persisted timestamps and every exact accepted original", async () => {
  const q = await submitted(),
    v = q.report.revisions[0];
  assert.equal(v.source_hash, digest(canonical(v.snapshot)));
  assert.ok(
    v.snapshot.entries.every(
      (e: { received_at: unknown }) => typeof e.received_at === "string",
    ),
  );
});
