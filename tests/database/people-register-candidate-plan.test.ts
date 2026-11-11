import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, transaction } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { peopleRegister } from "../../src/shared/people-register";
import { peopleRegister as original } from "../helpers/people-register-main";
import {
  capturePeople,
  assertPeopleEqual,
  nativeFixture,
  peopleTables,
  assertNeverAnalysed,
  assertBoundedLoops,
} from "../helpers/people-register-plan";
import { CRM } from "../helpers/crm";
assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const baseline = "c248355e0b570bcf0a027000a123b7790a27f194";
test("complete frozen People reader equals the recorded baseline", () => {
  const source = readFileSync("tests/helpers/people-register-main.ts", "utf8")
    .split("\n")
    .slice(1)
    .join("\n")
    .replaceAll("../../src/platform/", "../platform/")
    .replaceAll("../../src/shared/", "./");
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    "29578a21daaa93c56a78957309d10befbc381bd54b6194e762ec041ae30ec5a6",
  );
});

// No manual/automatic analysis may precede either query. Compatible locks block
// concurrent auto-analysis during native DML; no configuration is changed.
async function isolatedPlan(
  run: (
    seed: Awaited<ReturnType<typeof assertNeverAnalysed>>,
    attempt: number,
  ) => Promise<void>,
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await reset();
    let seedGuard = true;
    try {
      await transaction(async (c) => {
        await c.query(
          `LOCK TABLE ${peopleTables.map((n) => `ppo.${n}`).join(",")} IN SHARE UPDATE EXCLUSIVE MODE`,
        );
        const seed = await assertNeverAnalysed(peopleTables);
        seedGuard = false;
        await run(seed, attempt);
      });
      return;
    } catch (error) {
      if (
        !seedGuard ||
        !(error instanceof assert.AssertionError) ||
        !(error.actual instanceof Date) ||
        attempt === 3
      )
        throw error;
      console.log(
        `Discarding auto-analysed seed before any fixture or reader (attempt ${attempt})`,
      );
    }
  }
}
for (const size of [30, 45])
  test(`native People ${size}: visible population bound passes only after the fix`, async () => {
    await isolatedPlan(async (seedStatistics, setupAttempt) => {
      const p = (await createSession("coordinator")).principal;
      const native = await nativeFixture(p, size);
      const before = await assertNeverAnalysed(peopleTables);
      const old = await withWorkingCompany(p.actor_id, CRM.company, () =>
        capturePeople(original, p, {}, true),
      );
      const fixed = await withWorkingCompany(p.actor_id, CRM.company, () =>
        capturePeople(peopleRegister, p, {}, true),
      );
      const afterStatistics = await assertNeverAnalysed(peopleTables);
      const ids = [
        CRM.person,
        ...native.created.people
          .map((id, i) => ({ id, name: `SYN Plan person ${i}` }))
          .sort((a, b) =>
            a.name < b.name
              ? -1
              : a.name > b.name
                ? 1
                : a.id.localeCompare(b.id),
          )
          .map((r) => r.id),
      ];
      assert.equal(old.data.total, size + 1);
      assert.deepEqual(old.data.counts, {
        Active: size + 1,
        SiteContacts: size + 1,
        Channels: 1,
        Inactive: 0,
      });
      assert.deepEqual(
        old.data.items.map((r) => r.id),
        ids.slice(0, 25),
      );
      assert.deepEqual(
        (old.raw[0] as { items: { id: string }[] }).items.map((r) => r.id),
        ids.slice(0, 26),
      );
      assert.ok(old.data.next_cursor);
      assert.deepEqual(
        old.data.organisations.map((r) => r.id).sort(),
        [CRM.org, ...native.created.organisations].sort(),
      );
      for (const r of old.data.items) {
        assert.equal(r.notice_exceptions, 0);
        assert.equal(r.last_correction, null);
        assert.equal(r.organisations.length, 1);
        assert.equal(r.notices_restricted, r.id === CRM.person);
        assert.equal(r.history_restricted, r.id === CRM.person);
      }
      assertPeopleEqual(old, fixed);
      mkdirSync("tmp/people-register-candidate-cost", { recursive: true });
      writeFileSync(
        `tmp/people-register-candidate-cost/${size}.json`,
        JSON.stringify(
          {
            baseline,
            size,
            native,
            expected_ids: ids,
            seedStatistics,
            setupAttempt,
            before,
            afterStatistics,
            denominator: "Reported visible population total",
            bound: (size + 1) * 10,
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
          visible: size + 1,
          bound: (size + 1) * 10,
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
      assert.throws(() => assertBoundedLoops(old.plan!, old.data.total));
      assertBoundedLoops(fixed.plan!, fixed.data.total);
    });
  });
