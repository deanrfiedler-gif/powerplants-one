import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { financeSources } from "../../src/finance/reads";
import { saveFinance } from "../../src/finance/service";
import { financeDraft, principal, base, readFinance } from "../helpers/finance";
import { id } from "../helpers/packs";
import {
  linkedFinanceDraft,
  costLines,
  reviseWork,
  submitWork,
  reviewWork,
  beginWork,
} from "../helpers/project-work-finance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

test("M2 authorised sources expose the exact Covered agreement default without requiring project read", async () => {
  const p = await principal("finance");
  for (const n of [1, 2, 6]) {
    const r = await financeSources(p, id("90", n));
    assert.deepEqual(r.allocation_defaults, {
      disposition: "NonBillable",
      reason: `Covered by agreement SYN-PPO-AGR-${String(n).padStart(6, "0")}`,
      target_group: null,
    });
  }
});

test("M2 NotCovered, Disputed, Unknown, NotApplicable and absent coverage receive no default", async () => {
  const p = await principal("finance");
  for (const n of [3, 4, 5, 7, 8])
    assert.equal(
      (await financeSources(p, id("90", n))).allocation_defaults,
      null,
    );
});

test("M2 coverage alone without an agreement does not silently grant free service", async () => {
  const f = await financeDraft();
  assert.equal(
    (await financeSources(f.p, f.cmd.work_order_id)).allocation_defaults,
    null,
  );
  await assert.rejects(
    saveFinance(f.p, null, {
      ...f.cmd,
      ...base(),
      id: randomUUID(),
      lines: f.cmd.lines.map(({ reason: ignored, ...line }) => {
        void ignored;
        return line;
      }),
    }),
    (e: unknown) => (e as { code: string }).code === "InvalidData",
  );
  assert.equal((await readFinance(f.p, f.id)).handoff.status, "Draft");
});

for (const profile of [
  "assigned-technician",
  "second-company",
  "other-workspace",
])
  test(`M2 ${profile} cannot discover protected coverage defaults`, async () => {
    await assert.rejects(
      financeSources(await principal(profile), id("90")),
      (e: unknown) =>
        ["Forbidden", "RecordUnavailable"].includes(
          (e as { code: string }).code,
        ),
    );
  });

test("M2 project precedence and NonBillable reason persist with original-operation replay", async () => {
  const f = await linkedFinanceDraft();
  assert.equal(
    (await financeSources(f.p, f.work.id)).allocation_defaults?.reason,
    "Included in project contract",
  );
  await reviseWork(
    f,
    costLines(f).map(({ reason: ignored, ...line }) => {
      void ignored;
      return line;
    }) as typeof f.cmd.lines,
  );
  const r = await readFinance(f.p, f.id);
  assert.ok(
    r.lines.every(
      (l) =>
        l.disposition === "NonBillable" &&
        l.reason === "Included in project contract",
    ),
  );
  await submitWork(f);
  await reviewWork(f);
  await beginWork(f);
  const before = await readFinance(f.p, f.id);
  await saveFinance(f.p, null, f.cmd);
  const recovered = await readFinance(f.p, f.id);
  assert.equal(recovered.handoff.version, before.handoff.version);
  assert.equal(recovered.revisions.length, before.revisions.length);
});

test("M2 defaults follow a native draft coverage revision and never rewrite old assessments", async () => {
  const { readWorkOrder, saveWorkScope } =
    await import("../../src/service/work-orders");
  const owner = await principal();
  const w = (await readWorkOrder(owner, id("90"))).items[0];
  const scope = w.scopes.find((s) => s.id === w.scope_revision_id)!;
  const oldCoverage = scope.coverage.id;
  const finance = await principal("finance");
  assert.ok((await financeSources(finance, w.id)).allocation_defaults);
  await saveWorkScope(owner, w.id, {
    ...base(),
    expected_version: w.version,
    scope: {
      summary: scope.summary,
      exclusions: scope.exclusions,
      diagnostic_limit: scope.diagnostic_limit,
      pending_account_plan: scope.pending_account_plan,
      authority_evidence: null,
      coverage: {
        status: "Disputed",
        agreement_reference: null,
        source_version: null,
        effective_from: null,
        effective_to: null,
        assessment: "SYN exact coverage now disputed",
        reason: "SYN successor assessment retains uncertainty",
        charging_route: "FinanceReview",
      },
      items: scope.items.map(
        (i: {
          task_kind: string;
          task_description: string;
          expected_outcome: string;
          completion_requirements: string[];
          required_skill_codes: string[];
          shutdown_condition: string | null;
          access_condition: string | null;
        }) => ({
          task_kind: i.task_kind,
          task_description: i.task_description,
          expected_outcome: i.expected_outcome,
          completion_requirements: i.completion_requirements,
          required_skill_codes: i.required_skill_codes,
          shutdown_condition: i.shutdown_condition,
          access_condition: i.access_condition,
          assets: [],
        }),
      ),
    },
  });
  assert.equal((await financeSources(finance, w.id)).allocation_defaults, null);
  const { rows } = await import("../helpers/finance");
  assert.equal(
    (
      await rows("SELECT status FROM ppo.coverage_assessments WHERE id=$1", [
        oldCoverage,
      ])
    )[0].status,
    "Covered",
  );
});
