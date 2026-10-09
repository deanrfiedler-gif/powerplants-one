// PT-13 / AT-12: exact approved time/material successors, before and after processing.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { AppError } from "../../src/platform/errors";
import { captureEntry } from "../../src/field/entries";
import { readFieldJob } from "../../src/field/reads";
import { saveCompletionDraft } from "../../src/field/completion";
import {
  amendReport,
  readReport,
  reviewReport,
  submitCompletion,
  presentationBytes,
} from "../../src/reports/service";
import { requestReportIssue, processReportJob } from "../../src/reports/worker";
import { financeSources } from "../../src/finance/reads";
import type { SourceEntry } from "../../src/finance/context";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  cancelFinance,
  requestFinanceCorrection,
} from "../../src/finance/service";
import {
  approvedFinance,
  reconciledFinance,
  readFinance,
  base,
  rows,
} from "../helpers/finance";
import { entry, draft } from "../helpers/field";
import { decision } from "../helpers/reports";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  e instanceof AppError && e.code === expected;
const dbCode = (expected: string) => (e: unknown) =>
  (e as { code?: string }).code === expected;
const handoff = async (id: string) =>
  (await rows("SELECT * FROM ppo.finance_handoffs WHERE id=$1", [id]))[0];

// Compare full retained rows, allowing independently asserted successor records.
async function preserve(tables: string[]) {
  const originals = await Promise.all(
    tables.map(async (table) => ({
      table,
      data: await rows(`SELECT to_jsonb(r) AS row FROM ppo.${table} r`),
    })),
  );
  return async () => {
    for (const { table, data } of originals)
      assert.deepEqual(
        await rows(
          `SELECT original FROM unnest($1::jsonb[]) AS original WHERE NOT EXISTS (SELECT 1 FROM ppo.${table} r WHERE to_jsonb(r)=original)`,
          [data.map((r) => JSON.stringify(r.row))],
        ),
        [],
        `${table}: retained originals`,
      );
  };
}

for (const processed of [false, true]) {
  test(`PT-13 approved 90 MIN / 2 EA corrections ${processed ? "after reconciled processing" : "before processing"}`, async (t) => {
    await closeDatabase();
    await reset();
    // These existing fixtures capture Draft entries, submit/approve/issue the
    // exact report, then independently allocate 60 billable + 30 non-billable MIN.
    const q = processed ? await reconciledFinance() : await approvedFinance();
    const oldReport = q.q.report;
    const oldEntries = await rows(
      "SELECT * FROM ppo.field_entries WHERE attendance_id=$1 AND kind IN ('Time','Material') ORDER BY kind",
      [q.q.job.attendance!.id],
    );
    const time = oldEntries.find((e) => e.kind === "Time")!;
    const material = oldEntries.find((e) => e.kind === "Material")!;
    const originalFinance = await readFinance(q.p, q.id);
    const originalHolds = await rows(
      "SELECT * FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY line_id",
      [q.id],
    );
    const originalTargets = await rows(
      "SELECT * FROM ppo.finance_simulator_targets ORDER BY id",
    );
    const originalOutcomes = await rows(
      "SELECT * FROM ppo.finance_outcomes ORDER BY id",
    );
    const presentation = oldReport.presentations.find(
      (p: { kind: string }) => p.kind === "IssuedReport",
    )!;
    const originalBytes = await presentationBytes(
      q.q.p,
      oldReport.id,
      presentation.id,
    );
    const retained = await preserve([
      "field_entries",
      "report_revisions",
      "report_reviews",
      "report_issues",
      "report_entry_refs",
      "report_presentations",
      "attendance_acceptances",
      "finance_revisions",
      "finance_lines",
      "finance_sources",
      "finance_reviews",
      "finance_processing_attempts",
      "finance_outcomes",
      "finance_reconciliations",
      "finance_simulator_targets",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ]);
    let currentJob = (await readFieldJob(q.q.p, q.q.job.id)).items[0];
    // Independently specified factual corrections: 75 minutes and 3 EA. They
    // confer no billing policy and never rewrite the original 90 / 2 quantities.
    const corrections = [
      {
        source: time,
        cmd: {
          ...entry(currentJob, "Time", {
            time_kind: "Labour",
            start_at: time.payload.start_at,
            end_at: new Date(
              Date.parse(time.payload.start_at) + 75 * 60000,
            ).toISOString(),
            note: "SYN corrected actual interval: 75 minutes",
          }),
          expected_version: time.version,
          reason:
            "SYN PT-13 factual time correction: original interval included fifteen minutes in error.",
        },
      },
      {
        source: material,
        cmd: {
          ...entry(currentJob, "Material", {
            ...material.payload,
            quantity: "3",
          }),
          expected_version: material.version,
          reason:
            "SYN PT-13 factual material correction: three fictional sleeves were consumed.",
        },
      },
    ];

    await t.test(
      "approved originals and separate financial quantities cannot be edited in place",
      async () => {
        assert.equal(
          (Date.parse(time.payload.end_at) -
            Date.parse(time.payload.start_at)) /
            60000,
          90,
        );
        assert.equal(material.payload.quantity, "2");
        assert.equal(material.payload.uom, "EA");
        for (const source of oldEntries) {
          assert.ok(
            oldReport.reviews[0].entry_decisions.some(
              (d: { id: string; version: number; decision: string }) =>
                d.id === source.id &&
                d.version === source.version &&
                d.decision === "Approved",
            ),
          );
          await assert.rejects(
            database().query(
              "UPDATE ppo.field_entries SET payload=jsonb_set(payload,'{note}','\"SYN forbidden overwrite\"') WHERE id=$1",
              [source.id],
            ),
            dbCode("55000"),
          );
        }
        const quantities = originalFinance.lines
          .map((l) => [
            l.uom,
            l.captured_quantity,
            l.reviewed_quantity,
            l.allocated_quantity,
            l.billable_quantity,
            l.disposition,
          ])
          .sort();
        assert.deepEqual(quantities, [
          ["EA", "2.000000", "2.000000", "2.000000", "2.000000", "Billable"],
          [
            "MIN",
            "90.000000",
            "90.000000",
            "30.000000",
            "0.000000",
            "NonBillable",
          ],
          [
            "MIN",
            "90.000000",
            "90.000000",
            "60.000000",
            "60.000000",
            "Billable",
          ],
        ]);
        for (const { source, cmd } of corrections)
          await assert.rejects(
            captureEntry(q.q.p, cmd, source.id),
            code("SubmissionFrozen"),
          );
        assert.equal(
          (await handoff(q.id)).status,
          processed ? "Reconciled" : "Approved",
        );
        await retained();
      },
    );

    await t.test(
      "reasoned successors invalidate downstream readiness and replay only their original receipts",
      async () => {
        await amendReport(q.q.p, oldReport.id, {
          ...base(),
          expected_version: oldReport.version,
          revision_id: oldReport.revisions[0].id,
          reason:
            "SYN PT-13 reopen exact approved time and material for factual correction.",
        });
        for (const { source, cmd } of corrections) {
          await assert.rejects(
            captureEntry(q.q.p, { ...cmd, reason: "" }, source.id),
            code("InvalidData"),
          );
          const result = await captureEntry(q.q.p, cmd, source.id);
          const replay = await captureEntry(q.q.p, cmd, source.id);
          assert.equal(replay.replayed, true);
          assert.deepEqual(replay.receipt, result.receipt);
          await assert.rejects(
            captureEntry(
              q.q.p,
              { ...cmd, operation_id: randomUUID(), id: randomUUID() },
              source.id,
            ),
            code("VersionConflict"),
          );
          const successor = (
            await rows("SELECT * FROM ppo.field_entries WHERE id=$1", [cmd.id])
          )[0];
          assert.equal(successor.root_id, source.root_id);
          assert.equal(successor.supersedes_entry_id, source.id);
          assert.equal(successor.version, source.version + 1);
          assert.equal(successor.correction_reason, cmd.reason);
          assert.equal(successor.actor_id, q.q.p.actor_id);
          const audit = await rows(
            "SELECT object_id,reason,details FROM ppo.audit_events WHERE operation_id=$1",
            [cmd.operation_id],
          );
          assert.equal(audit.length, 1);
          assert.equal(audit[0].object_id, cmd.id);
          assert.equal(audit[0].reason, cmd.reason);
          assert.equal(audit[0].details.source_entry_id, source.id);
        }
        const state = await handoff(q.id);
        assert.equal(
          state.status,
          processed ? "ReconciliationRequired" : "Returned",
        );
        assert.equal(state.needs_review, true);
        assert.equal(
          state.current_revision_id,
          originalFinance.handoff.current_revision_id,
        );
        assert.equal(
          (await readReport(q.q.reviewer, oldReport.id)).items[0].status,
          "Draft",
        );
        assert.equal(
          (await financeSources(q.p, q.cmd.work_order_id)).items.find(
            (s) => s.id === oldReport.id,
          )!.ready,
          false,
        );
        await assert.rejects(
          beginFinanceProcessing(q.processor, q.id, {
            ...base(),
            expected_version: state.version,
            scenario: "Accepted",
          }),
          code("FinanceStateChanged"),
        );
        assert.deepEqual(
          await rows(
            "SELECT * FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY line_id",
            [q.id],
          ),
          originalHolds,
        );
        await retained();
      },
    );

    await t.test(
      "corrected report requires a new exact submission, review and issue",
      async () => {
        currentJob = (await readFieldJob(q.q.p, q.q.job.id)).items[0];
        for (const { source, cmd } of corrections) {
          assert.equal(
            currentJob.entries.find((e) => e.id === source.id)!.superseded,
            true,
          );
          assert.equal(
            currentJob.entries.find((e) => e.id === cmd.id)!.superseded,
            false,
          );
        }
        await saveCompletionDraft(q.q.p, currentJob.id, draft(currentJob));
        currentJob = (await readFieldJob(q.q.p, currentJob.id)).items[0];
        let r = (await readReport(q.q.p, oldReport.id)).items[0];
        await submitCompletion(q.q.p, currentJob.id, {
          ...base(),
          id: r.id,
          attendance_id: currentJob.attendance!.id,
          draft_revision_id: currentJob.draft_revisions[0].id,
          expected_draft_version: currentJob.draft!.version,
          expected_report_version: r.version,
          expected_appointment_version: currentJob.version,
          attendance_end_at: new Date(
            oldReport.appointment.actual_end_at!,
          ).toISOString(),
        });
        r = (await readReport(q.q.reviewer, oldReport.id)).items[0];
        assert.equal(r.status, "Submitted");
        assert.notEqual(r.revisions[0].id, oldReport.revisions[0].id);
        const selected = r.revisions[0].snapshot.entries as {
          id: string;
          version: number;
        }[];
        for (const { source, cmd } of corrections) {
          assert.ok(
            selected.some(
              (e) => e.id === cmd.id && e.version === source.version + 1,
            ),
          );
          assert.ok(!selected.some((e) => e.id === source.id));
        }
        await assert.rejects(
          reviewReport(q.q.reviewer, r.id, {
            ...decision(r),
            revision_id: oldReport.revisions[0].id,
            source_hash: oldReport.revisions[0].source_hash,
          }),
          code("SubmissionChanged"),
        );
        await reviewReport(q.q.reviewer, r.id, decision(r));
        r = (await readReport(q.q.reviewer, r.id)).items[0];
        await requestReportIssue(q.q.reviewer, r.id, {
          ...base(),
          expected_version: r.version,
          revision_id: r.revisions[0].id,
          review_id: r.reviews[0].id,
          template_id: r.template.id,
          template_version: r.template.version,
        });
        r = (await readReport(q.q.reviewer, r.id)).items[0];
        const result = await processReportJob(r.jobs[0].id);
        assert.ok("issue_id" in result, JSON.stringify(result));
        r = (await readReport(q.q.reviewer, r.id)).items[0];
        assert.equal(r.issues.length, 2);
        assert.equal(r.appointment.status, "Completed");
        assert.equal(
          new Date(r.appointment.actual_end_at!).toISOString(),
          new Date(oldReport.appointment.actual_end_at!).toISOString(),
        );
        const source = (
          await financeSources(q.p, q.cmd.work_order_id)
        ).items.find((s) => s.id === oldReport.id)!;
        assert.ok(source.ready && "source" in source && source.source);
        assert.deepEqual(
          source.source.entries
            .map((e: SourceEntry) => [e.uom, e.quantity])
            .sort(),
          [
            ["EA", "3"],
            ["MIN", "75"],
          ],
        );
        assert.equal(
          (await handoff(q.id)).needs_review,
          true,
          "Service approval must not restore the old Finance approval",
        );
        const bytes = await presentationBytes(
          q.q.p,
          oldReport.id,
          presentation.id,
        );
        assert.equal(bytes.html, originalBytes.html);
        assert.deepEqual(bytes.pdf, originalBytes.pdf);
        await retained();
      },
    );

    await t.test(
      processed
        ? "processed originals stay consumed and a correction request links the original outcome"
        : "unprocessed handoff needs a new exact allocation and independent Finance review",
      async () => {
        const source = (
          await financeSources(q.p, q.cmd.work_order_id)
        ).items.find((s) => s.id === oldReport.id)!;
        const cmd = {
          ...q.cmd,
          id: undefined,
          ...base(),
          expected_version: (await handoff(q.id)).version,
          reports: [
            {
              report_id: source.id,
              revision_id: source.revision_id,
              review_id: source.review_id,
              issue_id: source.issue_id,
            },
          ],
          lines: q.cmd.lines.map((l) => ({
            ...l,
            entry_id: corrections.find((c) => c.source.id === l.entry_id)!.cmd
              .id,
            quantity:
              l.quantity === "60" ? "45" : l.quantity === "2" ? "3" : "30",
            reason:
              "SYN PT-13 separately reviewed corrected allocation; no operational charging policy.",
          })),
          treatment_basis:
            "SYN only: corrected 75 MIN allocated 45 billable / 30 non-billable and 3 EA, independently reviewed.",
        };
        if (processed) {
          await assert.rejects(
            saveFinance(q.p, q.id, cmd),
            code("FinanceStateChanged"),
          );
          await assert.rejects(
            cancelFinance(q.p, q.id, {
              ...base(),
              expected_version: cmd.expected_version,
            }),
            code("FinanceStateChanged"),
          );
          const correction = {
            ...base(),
            expected_version: cmd.expected_version,
            disposition: "CorrectionRequested",
            reason: `SYN PT-13 investigate corrected time/material in report ${source.revision_id}; retained target is not rewritten.`,
          };
          const result = await requestFinanceCorrection(
            q.reconciler,
            q.id,
            correction,
          );
          assert.deepEqual(
            (await requestFinanceCorrection(q.reconciler, q.id, correction))
              .receipt,
            result.receipt,
          );
          const links = await rows(
            "SELECT * FROM ppo.finance_corrections WHERE handoff_id=$1",
            [q.id],
          );
          assert.equal(links.length, 1);
          assert.equal(
            links[0].source_revision_id,
            originalFinance.handoff.current_revision_id,
          );
          assert.equal(links[0].outcome_id, originalOutcomes[0].id);
          assert.equal(links[0].disposition, "CorrectionRequested");
          assert.deepEqual(
            await rows(
              "SELECT * FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY line_id",
              [q.id],
            ),
            originalHolds,
          );
        } else {
          await saveFinance(q.p, q.id, cmd);
          let f = await readFinance(q.p, q.id);
          assert.equal(f.handoff.status, "Draft");
          assert.notEqual(
            f.handoff.current_revision_id,
            originalFinance.handoff.current_revision_id,
          );
          await assert.rejects(
            beginFinanceProcessing(q.processor, q.id, {
              ...base(),
              expected_version: f.handoff.version,
              scenario: "Accepted",
            }),
            code("FinanceStateChanged"),
          );
          await submitFinance(q.p, q.id, {
            ...base(),
            expected_version: f.handoff.version,
          });
          f = await readFinance(q.p, q.id);
          const v = (
            await rows("SELECT * FROM ppo.finance_revisions WHERE id=$1", [
              f.handoff.current_revision_id,
            ])
          )[0];
          const originalReview = originalFinance.reviews[0];
          await assert.rejects(
            reviewFinance(q.reviewer, q.id, {
              ...base(),
              expected_version: f.handoff.version,
              revision_id: originalReview.revision_id,
              source_hash: originalReview.source_hash,
              decision: "Approved",
            }),
            code("SourceChanged"),
          );
          await reviewFinance(q.reviewer, q.id, {
            ...base(),
            expected_version: f.handoff.version,
            revision_id: v.id,
            source_hash: v.source_hash,
            decision: "Approved",
          });
          f = await readFinance(q.p, q.id);
          assert.equal(f.handoff.status, "Approved");
          assert.equal(f.handoff.needs_review, false);
          assert.equal(f.reviews.length, 2);
          assert.deepEqual(
            f.lines
              .map((l) => [
                l.uom,
                l.captured_quantity,
                l.reviewed_quantity,
                l.allocated_quantity,
                l.billable_quantity,
                l.disposition,
              ])
              .sort(),
            [
              [
                "EA",
                "3.000000",
                "3.000000",
                "3.000000",
                "3.000000",
                "Billable",
              ],
              [
                "MIN",
                "75.000000",
                "75.000000",
                "30.000000",
                "0.000000",
                "NonBillable",
              ],
              [
                "MIN",
                "75.000000",
                "75.000000",
                "45.000000",
                "45.000000",
                "Billable",
              ],
            ],
          );
          const holds = await rows(
            "SELECT revision_id,state,quantity::text FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY revision_id,quantity",
            [q.id],
          );
          assert.equal(
            holds.filter(
              (h) =>
                h.revision_id === originalFinance.handoff.current_revision_id &&
                h.state === "Released",
            ).length,
            3,
          );
          assert.deepEqual(
            holds
              .filter((h) => h.revision_id === f.handoff.current_revision_id)
              .map((h) => [h.state, h.quantity]),
            [
              ["Held", "3.000000"],
              ["Held", "30.000000"],
              ["Held", "45.000000"],
            ],
          );
        }
        assert.deepEqual(
          await rows("SELECT * FROM ppo.finance_simulator_targets ORDER BY id"),
          originalTargets,
        );
        assert.deepEqual(
          await rows("SELECT * FROM ppo.finance_outcomes ORDER BY id"),
          originalOutcomes,
        );
        assert.equal(originalTargets.length, processed ? 1 : 0);
        await retained();
        t.diagnostic(
          JSON.stringify({
            phase: processed
              ? "processed-original-preserved"
              : "new-independent-approval",
            report_id: oldReport.id,
            handoff_id: q.id,
            original_finance_revision:
              originalFinance.handoff.current_revision_id,
            successors: corrections.map((c) => ({
              original: c.source.id,
              successor: c.cmd.id,
              operation_id: c.cmd.operation_id,
            })),
            target_ids: originalTargets.map((o) => o.id),
          }),
        );
      },
    );
  });
}
