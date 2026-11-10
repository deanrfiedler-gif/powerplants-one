import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, transaction } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { projectRegister } from "../../src/projects/register";
import { projectRegister as original } from "../helpers/projects-register-main";
import {
  captureRegister,
  nativeFixture,
  projectTables,
  assertNeverAnalysed,
  assertBoundedLoops,
} from "../helpers/projects-register-plan";
import { CRM } from "../helpers/crm";
assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const baseline = "900daa9d0929c12251226c4a7ff02cce247ad9f9";
test("the full frozen reader is the baseline, with only relocated imports", () => {
  const frozen = readFileSync("tests/helpers/projects-register-main.ts", "utf8")
    .split("\n")
    .slice(1)
    .join("\n")
    .replaceAll("../../src/platform/", "../platform/")
    .replaceAll("../../src/shared/", "../shared/")
    .replace('"../../src/projects/service"', '"./service"')
    .replace('"../../src/projects/register-model"', '"./register-model"');
  assert.equal(
    createHash("sha256").update(frozen).digest("hex"),
    "f28338afa4ba9ef4223eaef6adfd7f38172f5c0adb9167355f08e37ddedce1b1",
  );
});
// Keep autovacuum from analysing the measured tables between fixture creation and
// the paired reads. SHARE UPDATE EXCLUSIVE permits the native commands' DML.
// No statistics/configuration are changed; both readers see identical native state.
async function isolatedPlan(
  run: (
    seedStatistics: Awaited<ReturnType<typeof assertNeverAnalysed>>,
    setupAttempt: number,
  ) => Promise<void>,
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await reset();
    let seedGuard = true;
    try {
      await transaction(async (c) => {
        await c.query(
          `LOCK TABLE ${projectTables.map((name) => `ppo.${name}`).join(",")} IN SHARE UPDATE EXCLUSIVE MODE`,
        );
        const seedStatistics = await assertNeverAnalysed(projectTables);
        seedGuard = false;
        await run(seedStatistics, attempt);
      });
      return;
    } catch (error) {
      // A rare auto-analysis during reset/seed invalidates setup, before any fixture
      // or reader runs. Dispose it rather than clear counters or reuse its statistics.
      // Never retry a fixture, equivalence or performance assertion failure.
      if (
        !seedGuard ||
        !(error instanceof assert.AssertionError) ||
        !(error.actual instanceof Date) ||
        attempt === 3
      )
        throw error;
      console.log(
        `Discarding auto-analysed seed before measurement (setup ${attempt})`,
      );
    }
  }
}
for (const size of [30, 45])
  test(`native Projects population ${size}: every plan node is bounded, frozen baseline fails`, async (t) => {
    await isolatedPlan(async (seedStatistics, setupAttempt) => {
      const p = (await createSession("coordinator")).principal;
      const native = await nativeFixture(p, size);
      const before = await assertNeverAnalysed(projectTables);
      t.mock.timers.enable({
        apis: ["Date"],
        now: new Date("2026-11-10T00:00:00Z"),
      });
      try {
        const old = await withWorkingCompany(p.actor_id, CRM.company, () =>
          captureRegister(original, p, {}, true),
        );
        const fixed = await withWorkingCompany(p.actor_id, CRM.company, () =>
          captureRegister(projectRegister, p, {}, true),
        );
        const afterStatistics = await assertNeverAnalysed(projectTables);
        const expected = [...native.created.projects].sort();
        assert.deepEqual(
          old.data.items.map((r) => r.id),
          expected,
        );
        assert.deepEqual(old.data.counts, {
          Active: size,
          Mine: size,
          All: size,
          Closed: 0,
          Overdue: 0,
          AtRisk: 0,
          NoTarget: 0,
        });
        assert.equal(old.data.total, size);
        assert.equal(old.data.active_count, size);
        assert.equal(old.data.next_cursor, null);
        for (const row of old.data.items) {
          assert.equal(row.next_milestone, null);
          assert.equal(row.at_risk, 0);
          assert.equal(row.milestone_overdue, false);
        }
        assert.deepEqual(fixed.values, old.values);
        assert.deepEqual(fixed.raw, old.raw);
        assert.deepEqual(fixed.data, old.data);
        assert.equal(JSON.stringify(fixed.data), JSON.stringify(old.data));
        assert.throws(() => assertBoundedLoops(old.plan!, old.data.total));
        assertBoundedLoops(fixed.plan!, fixed.data.total);
        if (process.env.PPO_PLAN_FROZEN_MAIN === "1")
          assertBoundedLoops(old.plan!, old.data.total);
        mkdirSync("tmp/projects-register-candidate-cost", { recursive: true });
        writeFileSync(
          `tmp/projects-register-candidate-cost/${size}.json`,
          JSON.stringify(
            {
              baseline,
              size,
              seedStatistics,
              setupAttempt,
              isolation:
                "SHARE UPDATE EXCLUSIVE locks prevent concurrent auto-analysis; native DML and both readers unchanged",
              denominator: "Reported visible population total",
              bound: 10 * size,
              native,
              before,
              afterStatistics,
              old,
              fixed,
            },
            null,
            2,
          ),
        );
        console.log(
          JSON.stringify({
            size,
            bound: 10 * size,
            old: {
              loops: old.max_loops,
              hits: old.shared_hit_blocks,
              ms: old.execution_ms,
            },
            fixed: {
              loops: fixed.max_loops,
              hits: fixed.shared_hit_blocks,
              ms: fixed.execution_ms,
            },
          }),
        );
      } finally {
        t.mock.timers.reset();
      }
    });
  });
