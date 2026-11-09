import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { listOpportunities } from "../../src/crm/worklist";
import { listOpportunities as mainWorklist } from "../helpers/deals-worklist-main";
import { ACTIVE_PIPELINE_ID } from "../../src/crm/stages";
import { auditDealFixture, assertNeverAnalysed, measureDeals } from "../helpers/deals-worklist-plan";
import { assertBoundedLoops, planNodes } from "../helpers/estimate-review-candidate-plan";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);

test("Deals fences bound every node at 30 and 45 never-analysed native audit candidates and discriminate frozen main", async () => {
  const measurements: { before: Awaited<ReturnType<typeof measureDeals>>; after: Awaited<ReturnType<typeof measureDeals>> }[] = [];
  for (const size of [30, 45]) {
    await reset();
    const p = (await createSession("coordinator")).principal;
    const native = await auditDealFixture(p, size);
    assert.equal(native.counts.opportunities, size);
    const statisticsBefore = await assertNeverAnalysed();
    const input = { pipeline_definition_id: ACTIVE_PIPELINE_ID, outcome: "Open", sort: "Reference", limit: 50 };
    const before = await measureDeals(mainWorklist, p, input);
    const after = await measureDeals(listOpportunities, p, input, before.values);
    const statisticsAfter = await assertNeverAnalysed();
    assert.deepEqual(after.rows, before.rows);
    assert.equal(JSON.stringify(after.rows), JSON.stringify(before.rows));
    assert.equal(after.reader_result.items.length, size);
    assert.equal(after.reader_result.completeness, "Complete");
    assert.equal(after.reader_result.next_cursor, null);
    assert.deepEqual(new Set(after.reader_result.items.map(i => i.id)), new Set(native.created.opportunities));
    for (const item of after.reader_result.items) {
      assert.equal(item.history?.length, 1);
      assert.equal(item.next_action_state, "Overdue");
      assert.equal(item.can_edit, true);
    }
    for (const name of ["candidates", "visible_opportunities", "visible_actions"]) {
      const nodes = planNodes(after.plan).filter(n => n["Subplan Name"] === `CTE ${name}`);
      assert.equal(nodes.length, 1, name);
      assert.equal(nodes[0]["Actual Loops"], 1, name);
      assert.equal(nodes[0]["Actual Rows"], size, name);
    }
    const summary = { size, native, statisticsBefore, statisticsAfter, bound: 10 * size, before, after };
    mkdirSync("tmp/deals-worklist-candidate-cost", { recursive: true });
    writeFileSync(`tmp/deals-worklist-candidate-cost/${size}.json`, JSON.stringify(summary, null, 2));
    const compact = (m: typeof before) => ({ loops: m.max_loops, hits: m.shared_hit_blocks, ms: m.execution_ms, jit: m.has_jit });
    console.log("PPO_DEALS_PLAN " + JSON.stringify({size, before: compact(before), after: compact(after)}));
    assertBoundedLoops(process.env.PPO_PLAN_FROZEN_MAIN === "1" ? before.plan : after.plan, size);
    assert.throws(() => assertBoundedLoops(before.plan, size), /loops exceeds/);
    measurements.push(summary);
  }
  const growth = (side: "before" | "after") => ({
    loops: measurements[1][side].max_loops / measurements[0][side].max_loops,
    hits: measurements[1][side].shared_hit_blocks / measurements[0][side].shared_hit_blocks,
    ms: measurements[1][side].execution_ms / measurements[0][side].execution_ms,
  });
  console.log("PPO_DEALS_GROWTH " + JSON.stringify({ before: growth("before"), after: growth("after") }));
  assert.ok(growth("after").loops <= 1.5);
});
