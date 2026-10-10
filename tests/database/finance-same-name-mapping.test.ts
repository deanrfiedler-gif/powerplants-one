// PT-02 / AT-02, AT-30: one Q01 work-to-target procedure, using synthetic accounts only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { AppError } from "../../src/platform/errors";
import { captureEntry } from "../../src/field/entries";
import { readFieldJob } from "../../src/field/reads";
import { saveCompletionDraft } from "../../src/field/completion";
import {
  readReport,
  submitCompletion,
  reviewReport,
} from "../../src/reports/service";
import { processReportJob, requestReportIssue } from "../../src/reports/worker";
import {
  financeOptions,
  financeSources,
  readFinance,
} from "../../src/finance/reads";
import { hash, type SourceEntry } from "../../src/finance/context";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import { twoTaskStarted } from "../helpers/field-two-tasks";
import {
  entry,
  draft,
  photo,
  timePayload,
  materialPayload,
} from "../helpers/field";
import { decision } from "../helpers/reports";
import { id, principal, base, rows } from "../helpers/packs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);

const code = (status: number, expected: string) => (e: unknown) =>
  e instanceof AppError && e.status === status && e.code === expected;
const handoff = async (key: string) =>
  (await rows("SELECT * FROM ppo.finance_handoffs WHERE id=$1", [key]))[0];
const financeTables = [
  "finance_accounts",
  "finance_handoffs",
  "finance_revisions",
  "finance_sources",
  "finance_lines",
  "finance_allocation_holds",
  "finance_reviews",
  "finance_events",
  "finance_processing_attempts",
  "finance_simulator_targets",
  "finance_simulator_results",
  "finance_outcomes",
  "finance_reconciliations",
  "finance_corrections",
  "operation_receipts",
  "audit_events",
  "outbox_jobs",
];
async function durableState() {
  return Promise.all(
    financeTables.map(async (table) => ({
      table,
      rows: await rows(
        `SELECT to_jsonb(r) AS row FROM ppo.${table} r ORDER BY to_jsonb(r)::text`,
      ),
    })),
  );
}
async function refused(
  run: () => Promise<unknown>,
  status: number,
  expected: string,
) {
  const before = await durableState();
  await assert.rejects(run(), code(status, expected));
  assert.deepEqual(
    await durableState(),
    before,
    `${expected}: no durable Finance or operation effect`,
  );
}

// Unlike the older Finance fixture, create the Q01 work through its application command.
async function issuedQ01Work() {
  const q = await twoTaskStarted();
  await captureEntry(q.p, entry(q.job, "Time", timePayload()));
  await captureEntry(q.p, entry(q.job, "Material", materialPayload()));
  for (const task of q.job.scope.items) {
    await captureEntry(q.p, {
      ...entry(q.job),
      scope_item_id: task.id,
      asset_id: task.assets[0].id,
    });
  }
  const image = await photo(q.job, q.p);
  await captureEntry(
    q.p,
    entry(q.job, "Photo", {
      attachment_id: image.id,
      caption: "SYN PT-02 inspection evidence",
    }),
  );
  let job = (await readFieldJob(q.p, q.job.id)).items[0];
  await saveCompletionDraft(q.p, job.id, draft(job));
  job = (await readFieldJob(q.p, job.id)).items[0];
  const reportID = randomUUID();
  await submitCompletion(q.p, job.id, {
    ...base(),
    id: reportID,
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  let report = (await readReport(q.co, reportID)).items[0];
  await reviewReport(q.co, reportID, decision(report));
  report = (await readReport(q.co, reportID)).items[0];
  await requestReportIssue(q.co, reportID, {
    ...base(),
    expected_version: report.version,
    revision_id: report.revisions[0].id,
    review_id: report.reviews[0].id,
    template_id: report.template.id,
    template_version: report.template.version,
  });
  report = (await readReport(q.co, reportID)).items[0];
  const rendered = await processReportJob(report.jobs[0].id);
  assert.ok("issue_id" in rendered, JSON.stringify(rendered));
  return { workID: job.work_order.id, reportID };
}

test(
  "PT-02 same-name Q01 customer selects one exact synthetic debtor through release and target",
  { timeout: 120000 },
  async (t) => {
    await closeDatabase();
    await reset();
    const p = await principal("finance"),
      reviewer = await principal("finance-reviewer"),
      processor = await principal("finance-processor"),
      reconciler = await principal("finance-reconciler"),
      q = await issuedQ01Work(),
      accounts = await rows(`SELECT f.*, o.display_name AS customer_name
      FROM ppo.finance_accounts f JOIN ppo.organisations o ON o.id=f.organisation_id ORDER BY f.id`),
      correct = accounts.find(
        (a) => a.company_id === id("20") && a.organisation_id === id("50"),
      )!,
      other = accounts.find((a) => a.company_id === id("20", 2))!,
      originalMapping = (
        await rows("SELECT * FROM ppo.erp_account_mappings WHERE id=$1", [
          correct.mapping_id,
        ])
      )[0],
      options = await financeOptions(p),
      work = options.works.find((w) => w.id === q.workID)!;
    assert.ok(work);
    assert.equal(work.site_id, id("70"));
    assert.equal(work.site_name, "SYN Q01 Demonstration Site");
    assert.equal(work.company_id, correct.company_id);
    assert.equal(work.customer_id, correct.organisation_id);
    assert.equal(correct.customer_name, "SYN Greenhouse Demonstration");
    assert.equal(other.customer_name, correct.customer_name);
    assert.deepEqual(
      [correct, other].map((a) => [
        a.mapping_snapshot.erp_connection_id,
        a.mapping_snapshot.erp_company_id,
        a.mapping_snapshot.customer_id,
      ]),
      [
        [id("21"), "SYN-A", "000Ab-C.01"],
        [id("21"), "SYN-B", "000ab-C.01"],
      ],
    );
    assert.equal(originalMapping.mapping_status, "Proposed");
    assert.equal(correct.status, "SyntheticVerified");
    assert.deepEqual(
      correct.mapping_snapshot,
      JSON.parse(JSON.stringify(originalMapping)),
    );
    const source = (await financeSources(p, work.id)).items.find(
      (s) => s.id === q.reportID,
    )!;
    assert.ok(source.ready && "source" in source && source.source);
    const time = source.source.entries.find(
        (e: SourceEntry) => e.uom === "MIN",
      )!,
      material = source.source.entries.find(
        (e: SourceEntry) => e.uom === "EA",
      )!,
      key = randomUUID(),
      command = {
        ...base(),
        id: key,
        work_order_id: work.id,
        account_id: correct.id,
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
        lines: [
          {
            entry_id: time.id,
            quantity: "60",
            disposition: "Billable",
            target_group: "F06-LABOUR",
            reason: "SYN F-06 sixty labour minutes only",
          },
          {
            entry_id: time.id,
            quantity: "30",
            disposition: "NonBillable",
            target_group: null,
            reason: "SYN F-06 remaining thirty minutes explicitly non-billable",
          },
          {
            entry_id: material.id,
            quantity: "2",
            disposition: "Billable",
            target_group: "F06-MATERIAL",
            reason: "SYN F-06 two fictional sleeves; no stock or price effect",
          },
        ],
        treatment_basis:
          "SYN F-06 independent fixture: 60 MIN and 2 EA billable; 30 MIN non-billable. No live billing authority.",
        remaining_work_basis:
          "SYN partial attendance only; remaining tasks stay with the Service owner and work remains open.",
      };
    const save = (account_id: unknown, mode = command.mode) =>
      saveFinance(p, null, { ...command, ...base(), account_id, mode });
    const submit = async () =>
      submitFinance(p, key, {
        ...base(),
        expected_version: (await handoff(key)).version,
      });
    const review = async () => {
      const h = await handoff(key),
        v = (
          await rows("SELECT * FROM ppo.finance_revisions WHERE id=$1", [
            h.current_revision_id,
          ])
        )[0];
      return reviewFinance(reviewer, key, {
        ...base(),
        expected_version: h.version,
        revision_id: v.id,
        source_hash: v.source_hash,
        decision: "Approved",
      });
    };
    const claim = async () =>
      beginFinanceProcessing(processor, key, {
        ...base(),
        expected_version: (await handoff(key)).version,
        scenario: "Accepted",
      });
    const dispatch = async () => {
      const h = await handoff(key);
      return recordFinanceOutcome(processor, key, {
        ...base(),
        expected_version: h.version,
        attempt_id: h.active_attempt_id,
        action: "Dispatch",
      });
    };
    // Change only the source fixture; account verification is immutable. Restore exactly
    // between independent challenges, without offering this reset as a business workflow.
    async function changedMapping(
      set: string,
      run: () => Promise<unknown>,
      persisted = true,
    ) {
      await rows(`UPDATE ppo.erp_account_mappings SET ${set} WHERE id=$1`, [
        correct.mapping_id,
      ]);
      try {
        if (persisted) {
          const view = await readFinance(p, key);
          assert.equal(view.readiness.ready, false);
          assert.equal(view.readiness.code, "AccountContextChanged");
        }
        await refused(run, 409, "AccountContextChanged");
      } finally {
        await rows(
          `UPDATE ppo.erp_account_mappings SET version=$2, customer_id=$3,
        mapping_status=$4, valid_from=$5, valid_to=$6 WHERE id=$1`,
          [
            originalMapping.id,
            originalMapping.version,
            originalMapping.customer_id,
            originalMapping.mapping_status,
            originalMapping.valid_from,
            originalMapping.valid_to,
          ],
        );
      }
      assert.deepEqual(
        (
          await rows("SELECT * FROM ppo.erp_account_mappings WHERE id=$1", [
            correct.mapping_id,
          ])
        )[0],
        originalMapping,
      );
    }

    await t.test(
      "wrong-company same-name debtor is refused, even when the actor can access both accounts",
      async () => {
        assert.equal(
          options.accounts.some((a) => a.id === other.id),
          false,
        );
        await refused(() => save(other.id), 404, "RecordUnavailable");
        const grants = await rows(
          `INSERT INTO ppo.permission_grants
      (workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
      SELECT $1,$2,$3,cap,'Company',$3,NULL FROM unnest(ARRAY[
        'finance.read','finance.prepare','finance.account.read','shared.finance.read']) cap RETURNING id`,
          [p.workspace_id, p.actor_id, other.company_id],
        );
        try {
          assert.equal(
            (await financeOptions(p)).accounts.some((a) => a.id === other.id),
            true,
          );
          await refused(() => save(other.id), 404, "RecordUnavailable");
        } finally {
          await rows(
            "DELETE FROM ppo.permission_grants WHERE id=ANY($1::uuid[])",
            [grants.map((g) => g.id)],
          );
        }
        assert.deepEqual((await financeOptions(p)).accounts, options.accounts);
      },
    );
    await t.test(
      "a display name, missing account or proposed ERP mapping cannot stand in for verified synthetic context",
      async () => {
        for (const value of [undefined, null, "SYN Greenhouse Demonstration"])
          await refused(() => save(value), 422, "InvalidData");
        for (const value of [randomUUID(), originalMapping.id])
          await refused(() => save(value), 404, "RecordUnavailable");
        for (const mode of ["Manual", "VerifiedApi"])
          await refused(() => save(correct.id, mode), 422, "InvalidData");
        await changedMapping(
          "mapping_status='Disputed', version=version+1",
          () => save(correct.id),
          false,
        );
        assert.equal(
          (await rows("SELECT count(*)::int n FROM ppo.finance_handoffs"))[0].n,
          0,
        );
      },
    );
    await t.test(
      "exact account selection saves the source hash; absent current verification blocks submission without reservations",
      async () => {
        await saveFinance(p, null, command);
        const h = await handoff(key),
          v = (
            await rows("SELECT * FROM ppo.finance_revisions WHERE id=$1", [
              h.current_revision_id,
            ])
          )[0];
        assert.equal(h.account_id, correct.id);
        assert.equal(h.company_id, correct.company_id);
        assert.equal(h.customer_id, correct.organisation_id);
        assert.equal(
          v.source_snapshot.mapping_hash,
          hash(correct.mapping_snapshot),
        );
        assert.equal(v.source_hash, hash(v.source_snapshot));
        assert.equal(v.source_snapshot.account_id, correct.id);
        assert.equal(v.source_snapshot.company_id, correct.company_id);
        assert.equal(v.source_snapshot.customer_id, correct.organisation_id);
        for (const set of [
          "mapping_status='Disputed', version=version+1",
          "valid_to=clock_timestamp()-interval '1 day', version=version+1",
          "valid_from=clock_timestamp()+interval '1 day', version=version+1",
          "customer_id='000ab-C.01', version=version+1",
          // Exact tuple integrity must not rely only on a version increment.
          "customer_id='000ab-C.01'",
        ])
          await changedMapping(set, submit);
        assert.deepEqual(
          await rows("SELECT * FROM ppo.finance_allocation_holds"),
          [],
        );
        assert.equal((await handoff(key)).status, "Draft");
        await submit();
      },
    );
    await t.test(
      "mapping changes after submission or approval require current verification before review and processing",
      async () => {
        await changedMapping("version=version+1", review);
        await review();
        await changedMapping(
          "customer_id='000ab-C.01', version=version+1",
          claim,
        );
        assert.deepEqual(
          await rows("SELECT * FROM ppo.finance_processing_attempts"),
          [],
        );
        await claim();
        await changedMapping(
          "mapping_status='Inactive', version=version+1",
          dispatch,
        );
        const a = (
          await rows(
            "SELECT * FROM ppo.finance_processing_attempts WHERE handoff_id=$1",
            [key],
          )
        )[0];
        assert.equal(a.dispatch_started_at, null);
        assert.deepEqual(
          await rows("SELECT * FROM ppo.finance_simulator_targets"),
          [],
        );
        await dispatch();
      },
    );
    await t.test(
      "every accepted target and allocation resolves to the exact retained connection/company/debtor tuple",
      async () => {
        const h = await handoff(key),
          a = (
            await rows(
              "SELECT * FROM ppo.finance_processing_attempts WHERE id=$1",
              [h.active_attempt_id],
            )
          )[0],
          targets = await rows(
            `SELECT t.*, f.mapping_snapshot FROM ppo.finance_simulator_targets t
        JOIN ppo.finance_accounts f ON (f.workspace_id,f.company_id,f.organisation_id,f.id)=
        (t.workspace_id,t.company_id,t.customer_id,t.account_id) WHERE t.handoff_id=$1`,
            [key],
          );
        assert.equal(targets.length, 1);
        const target = targets[0];
        assert.equal(a.source_snapshot.account_id, correct.id);
        assert.equal(a.source_snapshot.company_id, correct.company_id);
        assert.equal(a.source_snapshot.customer_id, correct.organisation_id);
        assert.equal(a.input_hash, hash(a.source_snapshot));
        assert.equal(target.input_hash, a.input_hash);
        assert.equal(target.attempt_id, a.id);
        assert.equal(target.correlation_id, h.correlation_id);
        assert.equal(target.status, "Accepted");
        assert.deepEqual(target.mapping_snapshot, correct.mapping_snapshot);
        assert.deepEqual(target.lines, a.source_snapshot.lines);
        assert.equal(target.lines.length, 2);
        assert.deepEqual(
          target.lines
            .map((l: { uom: string; quantity: string }) => [l.uom, l.quantity])
            .sort(),
          [
            ["EA", "2"],
            ["MIN", "60"],
          ],
        );
        const allocations = await rows(
          `SELECT l.id,l.uom,l.allocated_quantity::text AS quantity
      FROM ppo.finance_lines l WHERE l.revision_id=$1 AND l.disposition='Billable' ORDER BY l.id`,
          [h.current_revision_id],
        );
        assert.deepEqual(
          target.lines
            .flatMap((l: { source_allocations: { line_id: string }[] }) =>
              l.source_allocations.map((s) => s.line_id),
            )
            .sort(),
          allocations.map((l) => l.id).sort(),
        );
        const outcome = (
          await rows("SELECT * FROM ppo.finance_outcomes WHERE handoff_id=$1", [
            key,
          ])
        )[0];
        await reconcileFinance(reconciler, key, {
          ...base(),
          expected_version: h.version,
          outcome_id: outcome.id,
          basis:
            "SYN PT-02 exact connection UUID / SYN-A / 000Ab-C.01 retained; 60 MIN plus 2 EA target and 30 MIN non-billable checked independently.",
        });
        assert.equal((await handoff(key)).status, "Reconciled");
        const reconciliation = (
          await rows(
            "SELECT * FROM ppo.finance_reconciliations WHERE handoff_id=$1",
            [key],
          )
        )[0];
        assert.deepEqual(reconciliation.line_mapping, target.lines);
        assert.equal(reconciliation.no_posting.length, 1);
        assert.equal(reconciliation.no_posting[0].quantity, "30.000000");
        assert.equal(reconciliation.no_posting[0].uom, "MIN");
        t.diagnostic(
          JSON.stringify({
            work_id: work.id,
            site_id: work.site_id,
            handoff_id: key,
            account_id: correct.id,
            mapping_id: correct.mapping_id,
            mapping_hash: hash(correct.mapping_snapshot),
            tuple: [
              correct.mapping_snapshot.erp_connection_id,
              correct.mapping_snapshot.erp_company_id,
              correct.mapping_snapshot.customer_id,
            ],
            target_id: target.id,
            input_hash: target.input_hash,
            target_lines: target.lines.length,
          }),
        );
      },
    );
    await t.test(
      "account tuple and target are immutable; later source mapping changes preserve historical exact identity",
      async () => {
        for (const sql of [
          "UPDATE ppo.finance_accounts SET mapping_snapshot=jsonb_set(mapping_snapshot,'{customer_id}','\"000ab-C.01\"'),version=version+1 WHERE id=$1",
          "DELETE FROM ppo.finance_accounts WHERE id=$1",
        ])
          await assert.rejects(
            rows(sql, [correct.id]),
            (e: unknown) => (e as { code?: string }).code === "55000",
          );
        await assert.rejects(
          rows(
            "UPDATE ppo.finance_simulator_targets SET status='Partial' WHERE handoff_id=$1",
            [key],
          ),
          (e: unknown) => (e as { code?: string }).code === "55000",
        );
        const before = await durableState();
        await rows(
          "UPDATE ppo.erp_account_mappings SET customer_id='SYN-CHANGED-DEBTOR',version=version+1 WHERE id=$1",
          [correct.mapping_id],
        );
        const view = await readFinance(reconciler, key);
        assert.equal(view.readiness.ready, false);
        assert.equal(view.readiness.code, "AccountContextChanged");
        assert.equal(view.handoff.status, "Reconciled");
        assert.deepEqual(await durableState(), before);
        const retained = (
          await rows(
            `SELECT f.mapping_snapshot FROM ppo.finance_simulator_targets t
      JOIN ppo.finance_accounts f ON f.id=t.account_id WHERE t.handoff_id=$1`,
            [key],
          )
        )[0];
        assert.deepEqual(retained.mapping_snapshot, correct.mapping_snapshot);
        assert.notEqual(
          retained.mapping_snapshot.customer_id,
          "SYN-CHANGED-DEBTOR",
        );
        assert.equal(
          (
            await rows(
              "SELECT count(*)::int n FROM ppo.finance_simulator_targets WHERE company_id=$1",
              [other.company_id],
            )
          )[0].n,
          0,
        );
      },
    );
  },
);
