import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { readWorkOverview } from "../../src/activities/work-overview";
import { readWorkOverview as mainOverview } from "../helpers/my-work-overview-main";
import { auditDealFixture, assertNeverAnalysed } from "../helpers/deals-worklist-plan";
import { measureOverview } from "../helpers/my-work-overview-plan";
import { assertBoundedLoops, planNodes } from "../helpers/estimate-review-candidate-plan";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const auditTables = ["organisations", "people", "sites", "facilities", "assets", "activities", "activity_links", "opportunities", "projects", "lead_candidates", "tickets"];

test("My Work window bounds every node at 30 and 45 never-analysed native audit candidates and discriminates frozen main", async () => {
  const measurements: { before: Awaited<ReturnType<typeof measureOverview>>; after: Awaited<ReturnType<typeof measureOverview>> }[] = [];
  for (const size of [30, 45]) {
    await reset();
    const p = (await createSession("coordinator")).principal;
    const native = await auditDealFixture(p, size);
    assert.equal(native.counts.opportunities, size);
    const statisticsBefore = await assertNeverAnalysed(auditTables);
    const input = {};
    const before = await measureOverview(mainOverview, p, input);
    const after = await measureOverview(readWorkOverview, p, input, before.values);
    const statisticsAfter = await assertNeverAnalysed(auditTables);
    assert.deepEqual(after.rows, before.rows);
    assert.equal(JSON.stringify(after.rows), JSON.stringify(before.rows));
    assert.equal(after.reader_result.activities.items.length, 8);
    assert.equal(after.reader_result.activities.completeness, "BoundedWindow");
    assert.equal(after.reader_result.activities.total, size + 2);
    assert.deepEqual(after.reader_result.activities, before.reader_result.activities);
    assert.deepEqual(after.reader_result.counts, before.reader_result.counts);
    assert.deepEqual(after.reader_result.activities.items.map(item => item.kind),
      ["TechnicalFollowUp", "MaterialAction", ...Array(6).fill("CustomerContact")]);
    const nodes = planNodes(after.plan).filter(n => n["Subplan Name"] === "CTE overview_window");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0]["Actual Loops"], 1);
    assert.equal(nodes[0]["Actual Rows"], 8);
    const summary = { size, native, statisticsBefore, statisticsAfter, bound: 80, before, after };
    mkdirSync("tmp/my-work-overview-candidate-cost", { recursive: true });
    writeFileSync(`tmp/my-work-overview-candidate-cost/${size}.json`, JSON.stringify(summary, null, 2));
    const compact = (m: typeof before) => ({ loops: m.max_loops, hits: m.shared_hit_blocks, ms: m.execution_ms, jit: m.has_jit });
    console.log("PPO_MY_WORK_PLAN " + JSON.stringify({size, before: compact(before), after: compact(after)}));
    assertBoundedLoops(process.env.PPO_PLAN_FROZEN_MAIN === "1" ? before.plan : after.plan, 8);
    assert.throws(() => assertBoundedLoops(before.plan, 8), /loops exceeds/);
    measurements.push(summary);
  }
  const growth = (side: "before" | "after") => ({
    loops: measurements[1][side].max_loops / measurements[0][side].max_loops,
    hits: measurements[1][side].shared_hit_blocks / measurements[0][side].shared_hit_blocks,
    ms: measurements[1][side].execution_ms / measurements[0][side].execution_ms,
  });
  console.log("PPO_MY_WORK_GROWTH " + JSON.stringify({ before: growth("before"), after: growth("after") }));
  assert.ok(growth("after").loops <= 1.5);
});
