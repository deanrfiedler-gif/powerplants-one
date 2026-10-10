import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { canonical } from "../../src/platform/operations";
import type { SourceEntry } from "../../src/finance/context";
import { digest } from "../../src/documents/store";
import { acknowledgePack } from "../../src/documents/packs";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { sectionKeys } from "../../src/documents/validation";
import { supportedRenderReport } from "../../src/documents/p11-render";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { captureEntry } from "../../src/field/entries";
import { saveCompletionDraft } from "../../src/field/completion";
import {
  submitCompletion,
  readReport,
  reviewReport,
} from "../../src/reports/service";
import {
  requestReportIssue,
  processReportJob,
  readReportBundle,
} from "../../src/reports/worker";
import {
  financeOptions,
  financeSources,
  readFinance,
} from "../../src/finance/reads";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import {
  requestFinanceEvidence,
  processFinanceJob,
  readFinanceBundle,
} from "../../src/finance/worker";
import { queued, content, principal, base, rows, id } from "../helpers/packs";
import {
  startInput,
  entry,
  timePayload,
  materialPayload,
  draft,
} from "../helpers/field";
import { decision } from "../helpers/reports";
import { families, selectTemplate } from "../helpers/controlled-outputs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const canaries = [
  "PT23_PRIVATE_TIME",
  "PT23_PRIVATE_REVIEW",
  "PT23_PRIVATE_ENTRY",
  "PT23_PRIVATE_STOCK",
];
const numbered = (label: string, n: number) =>
  `${label}${String(n).padStart(2, "0")}`;
const paragraph =
  "SYN visual inspection only; retain the uncertain label and arrange separately authorised work. ";
const root = () =>
  process.env.PPO_PT23_EVIDENCE_DIRECTORY ?? "verification-evidence/pt23";

async function saveOutput(
  name: string,
  output: { html: string; pdf: Buffer },
  manifest: unknown,
  expected: string[],
  forbidden = canaries,
) {
  for (const value of expected)
    assert.ok(output.html.includes(value), `HTML contains ${value}`);
  for (const value of forbidden)
    assert.ok(!output.html.includes(value), `HTML excludes ${value}`);
  const pageCount = [
    ...output.pdf.toString("latin1").matchAll(/\/Type\s*\/Page\b/g),
  ].length;
  assert.ok(pageCount > 1, `${name} must actually span pages`);
  await mkdir(root(), { recursive: true });
  await writeFile(join(root(), `${name}.html`), output.html);
  await writeFile(join(root(), `${name}.pdf`), output.pdf);
  await writeFile(
    join(root(), `${name}.json`),
    JSON.stringify(
      {
        manifest,
        html_sha256: digest(output.html),
        pdf_sha256: digest(output.pdf),
        page_count: pageCount,
        expected_text: expected,
        forbidden_text: forbidden,
        review:
          "Automated content/identity checks; every-page visual inspection recorded separately",
      },
      null,
      2,
    ) + "\n",
  );
}

for (const version of [1, 2] as const) {
  test(`PT-23 v${version}: long reviewed pack, Service report and reconciled Finance originals`, async () => {
    await reset();
    for (const family of families) await selectTemplate(family, version);
    // Synthetic master-data fixtures only; all preparation, issue, personal
    // evidence, Service approval and Finance reconciliation use domain commands.
    const customer =
      "SYN " +
      "Long customer greenhouse research and maintenance division ".repeat(3);
    const site =
      "SYN " +
      "Long eastern irrigation inspection and propagation facility ".repeat(3);
    await database().query(
      "UPDATE ppo.organisations SET display_name=$2,version=version+1 WHERE id=$1",
      [id("50"), customer],
    );
    await database().query(
      "UPDATE ppo.sites SET display_name=$2,version=version+1 WHERE id=$1",
      [id("70"), site],
    );
    const notes = content();
    for (const key of sectionKeys)
      notes.sections[key] =
        `${key.toUpperCase()}START ${paragraph.repeat(9)} ${key.toUpperCase()}END`;
    const q = await queued(9, notes),
      packJob = q.pack.jobs[0];
    assert.ok("issue_id" in (await processRenderJob(packJob.id)));
    const packIssue = (
      await rows("SELECT * FROM ppo.pack_issues WHERE render_job_id=$1", [
        packJob.id,
      ])
    )[0];
    const packOutput = await readBundle(q.p, packIssue.manifest);
    await saveOutput(
      `OUT-09-v${version}`,
      packOutput,
      packIssue.manifest,
      sectionKeys.flatMap((k) => [
        k.toUpperCase() + "START",
        k.toUpperCase() + "END",
      ]),
    );
    for (const profile of ["assigned-technician", "second-technician"]) {
      const p = await principal(profile);
      const [recipient] = await rows(
        "SELECT * FROM ppo.pack_recipients WHERE issue_id=$1 AND user_id=$2",
        [packIssue.id, p.actor_id],
      );
      await acknowledgePack(p, packIssue.id, {
        ...base(),
        assignment_id: recipient.assignment_id,
        assignment_version: recipient.assignment_version,
        presented_hash: packIssue.output_hash,
        captured_at: new Date().toISOString(),
      });
    }
    const tech = await principal("assigned-technician");
    let job = (await readFieldJob(tech, q.pack.appointment_id)).items[0];
    await startAttendance(tech, job.id, startInput(job));
    job = (await readFieldJob(tech, job.id)).items[0];
    await captureEntry(
      tech,
      entry(job, "Time", { ...timePayload(), note: canaries[0] }),
    );
    for (let n = 1; n <= 8; n++)
      await captureEntry(
        tech,
        entry(job, "Material", {
          ...materialPayload(),
          description: numbered("MATERIAL", n) + " synthetic label sleeve",
          source_reference: canaries[3],
        }),
      );
    for (let n = 1; n <= 24; n++)
      await captureEntry(
        tech,
        entry(job, "Observation", {
          finding: numbered("FINDING", n) + " " + paragraph.repeat(2),
          confidence: "Suspected",
          attempted_fix: "SYN read the external label only; no intervention",
          result: "Uncertain; no verified repair",
          follow_up_required: true,
        }),
      );
    job = (await readFieldJob(tech, job.id)).items[0];
    await saveCompletionDraft(tech, job.id, {
      ...draft(job),
      work_performed: "WORKSTART " + paragraph.repeat(22) + " WORKEND",
    });
    job = (await readFieldJob(tech, job.id)).items[0];
    const reportId = randomUUID();
    await submitCompletion(tech, job.id, {
      ...base(),
      id: reportId,
      attendance_id: job.attendance!.id,
      draft_revision_id: job.draft_revisions[0].id,
      expected_draft_version: job.draft!.version,
      expected_report_version: 0,
      expected_appointment_version: job.version,
      attendance_end_at: new Date().toISOString(),
    });
    let report = (await readReport(q.p, reportId)).items[0];
    const review = decision(report);
    review.remarks = canaries[1];
    for (const item of review.entry_decisions) item.remarks = canaries[2];
    await reviewReport(q.p, reportId, review);
    report = (await readReport(q.p, reportId)).items[0];
    await requestReportIssue(q.p, reportId, {
      ...base(),
      expected_version: report.version,
      revision_id: report.revisions[0].id,
      review_id: report.reviews[0].id,
      template_id: report.template.id,
      template_version: report.template.version,
    });
    const [reportJob] = await rows(
      "SELECT * FROM ppo.report_render_jobs WHERE report_id=$1",
      [reportId],
    );
    assert.ok("issue_id" in (await processReportJob(reportJob.id)));
    const [reportIssue] = await rows(
      "SELECT * FROM ppo.report_issues WHERE render_job_id=$1",
      [reportJob.id],
    );
    const reportOutput = await readReportBundle(q.p, reportIssue.manifest);
    const expectedReport = [
      "WORKSTART",
      "WORKEND",
      ...Array.from({ length: 24 }, (_, n) => numbered("FINDING", n + 1)),
      ...Array.from({ length: 8 }, (_, n) => numbered("MATERIAL", n + 1)),
    ];
    await saveOutput(
      `OUT-10-v${version}`,
      reportOutput,
      reportIssue.manifest,
      expectedReport,
    );

    // Separate render-only stress: twenty explicitly synthetic asset rows test
    // the projection's table pagination. They are never issued or passed into
    // Finance as authorised work, and the issued originals above stay unchanged.
    const stress = structuredClone(reportJob.render_snapshot.source);
    stress.assets = Array.from({ length: 20 }, (_, n) => ({
      id: randomUUID(),
      name: numbered("ASSET", n + 1) + " " + paragraph,
      identity: "Unverified",
    }));
    const stressOutput = await supportedRenderReport(
      stress,
      reportJob.render_snapshot.output,
      version,
    );
    await saveOutput(
      `OUT-10-assets-v${version}`,
      stressOutput,
      {
        kind: "Unissued synthetic pagination fixture",
        template_version: version,
        source_hash: digest(canonical(stress)),
        asset_count: 20,
      },
      [
        ...expectedReport,
        ...Array.from({ length: 20 }, (_, n) => numbered("ASSET", n + 1)),
      ],
    );

    const preparer = await principal("finance"),
      reviewer = await principal("finance-reviewer"),
      processor = await principal("finance-processor"),
      reconciler = await principal("finance-reconciler");
    const workId = report.revisions[0].snapshot.work.id;
    const options = await financeOptions(preparer),
      sources = await financeSources(preparer, workId);
    const source = sources.items.find((s) => s.id === reportId)!;
    assert.ok(source.ready && "source" in source && source.source);
    const work = options.works.find((w) => w.id === workId)!;
    const financeId = randomUUID();
    const quantityEntries = (source.source.entries as SourceEntry[]).filter(
      (e) => ["MIN", "EA"].includes(e.uom),
    );
    assert.equal(quantityEntries.length, 9);
    await saveFinance(preparer, null, {
      ...base(),
      id: financeId,
      work_order_id: work.id,
      account_id: options.accounts.find(
        (a) => a.customer_id === work.customer_id,
      )!.id,
      mode: "SyntheticManual",
      definition_id: options.definition.id,
      definition_version: options.definition.version,
      policy_version: options.definition.policy_version,
      reports: [
        {
          report_id: source.id,
          revision_id: source.revision_id,
          review_id: source.review_id,
          issue_id: source.issue_id,
        },
      ],
      lines: quantityEntries.map((e, n) => ({
        entry_id: e.id,
        quantity: e.uom === "MIN" ? "90" : "2",
        disposition: "Billable",
        reason:
          numbered("ALLOCATION", n + 1) +
          " SYN fixture-only treatment; no price, tax or stock policy",
        target_group: e.uom === "MIN" ? "F06-LABOUR" : "F06-MATERIAL",
      })),
      treatment_basis:
        "PT23_FINANCE_ONLY TREATMENTSTART " +
        paragraph.repeat(18) +
        " TREATMENTEND",
      remaining_work_basis:
        "REMAININGSTART " + paragraph.repeat(10) + " REMAININGEND",
    });
    let finance = await readFinance(preparer, financeId);
    await submitFinance(preparer, financeId, {
      ...base(),
      expected_version: finance.handoff.version,
    });
    finance = await readFinance(reviewer, financeId);
    const [revision] = await rows(
      "SELECT * FROM ppo.finance_revisions WHERE id=$1",
      [finance.handoff.current_revision_id],
    );
    await reviewFinance(reviewer, financeId, {
      ...base(),
      expected_version: finance.handoff.version,
      revision_id: revision.id,
      source_hash: revision.source_hash,
      decision: "Approved",
    });
    finance = await readFinance(processor, financeId);
    await beginFinanceProcessing(processor, financeId, {
      ...base(),
      expected_version: finance.handoff.version,
      scenario: "Accepted",
    });
    finance = await readFinance(processor, financeId);
    await recordFinanceOutcome(processor, financeId, {
      ...base(),
      expected_version: finance.handoff.version,
      attempt_id: finance.handoff.active_attempt_id,
      action: "Dispatch",
    });
    finance = await readFinance(reconciler, financeId);
    const [outcome] = await rows(
      "SELECT * FROM ppo.finance_outcomes WHERE handoff_id=$1 ORDER BY observed_at DESC",
      [financeId],
    );
    await reconcileFinance(reconciler, financeId, {
      ...base(),
      expected_version: finance.handoff.version,
      outcome_id: outcome.id,
      basis:
        "SYN exact 90 MIN and sixteen EA fixture quantities checked; no operational posting.",
    });
    finance = await readFinance(reconciler, financeId);
    await requestFinanceEvidence(reconciler, financeId, {
      ...base(),
      expected_version: finance.handoff.version,
      revision_id: finance.handoff.current_revision_id,
      review_id: finance.reviews[0].id,
      reconciliation_id: finance.reconciliations[0].id,
    });
    const [financeJob] = await rows(
      "SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1",
      [financeId],
    );
    assert.ok("issue_id" in (await processFinanceJob(financeJob.id)));
    const [financeIssue] = await rows(
      "SELECT * FROM ppo.finance_issues WHERE render_job_id=$1",
      [financeJob.id],
    );
    const financeOutput = await readFinanceBundle(
      reconciler,
      financeIssue.manifest,
    );
    await saveOutput(
      `OUT-14-v${version}`,
      financeOutput,
      financeIssue.manifest,
      [
        "TREATMENTSTART",
        "TREATMENTEND",
        "REMAININGSTART",
        "REMAININGEND",
        ...Array.from({ length: 9 }, (_, n) => numbered("ALLOCATION", n + 1)),
      ],
    );
    for (const output of [packOutput, reportOutput])
      assert.ok(!output.html.includes("PT23_FINANCE_ONLY"));
    for (const m of [
      packIssue.manifest,
      reportIssue.manifest,
      financeIssue.manifest,
    ])
      assert.equal(m.template.version, version);
    if (version === 1)
      for (const family of families) await selectTemplate(family, 2);
    assert.deepEqual(await readBundle(q.p, packIssue.manifest), packOutput);
    assert.deepEqual(
      await readReportBundle(q.p, reportIssue.manifest),
      reportOutput,
    );
    assert.deepEqual(
      await readFinanceBundle(reconciler, financeIssue.manifest),
      financeOutput,
    );
  });
}
