import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";
import { readEstimatingReviewQueue as mainQueue } from "../helpers/estimate-review-queue-main";
import {
  submittedCandidate,
  candidateQuery,
  explainCandidate,
  candidateStatistics,
} from "../helpers/estimate-review-candidate-plan";

// Explicit volume measurement, outside CI's *.test.ts glob. Run immediately
// after the small-plan test: keep its 35 estimates and three release bases.
assert.equal(localConfig().database_name, "ppo_synthetic_test");
after(closeDatabase);
test("branch fence measurements at 3000 naturally analysed native estimates", async () => {
  const count = async () =>
    Number(
      (await database().query("SELECT count(*) FROM ppo.estimates")).rows[0]
        .count,
    );
  assert.equal(
    await count(),
    35,
    "run the small-plan test first on this disposable database",
  );
  const p = (await createSession("coordinator")).principal;
  for (let i = 35; i < 3000; i++) {
    await submittedCandidate(p, `SYN Unrelated candidate ${i}`);
    if ((i + 1) % 100 === 0) console.log(`Native estimates created: ${i + 1}`);
  }
  assert.equal(await count(), 3000);
  // Observe normal automatic maintenance; never issue ANALYZE or change settings.
  let statistics = await candidateStatistics();
  const analysed = () =>
    ["estimates", "estimate_versions", "estimate_review_events"].every((name) =>
      statistics.some((s) => s.relname === name && s.last_autoanalyze !== null),
    );
  const deadline = Date.now() + 180000;
  while (!analysed() && Date.now() < deadline) {
    await setTimeout(1000);
    statistics = await candidateStatistics();
  }
  assert.ok(
    analysed(),
    "normal autoanalyze must have reached the 3000-row fixture",
  );
  const measurements = [];
  for (const search of [true, false]) {
    const input = { q: search ? "SYN Small candidate plan" : "", offset: "25" };
    const queries = [
      await candidateQuery(mainQueue, p, input),
      await candidateQuery(readEstimatingReviewQueue, p, input),
    ];
    // One warm-up per side, then one retained paired sample, no retries.
    for (const query of queries) await explainCandidate(query);
    const before = await explainCandidate(queries[0]);
    const after = await explainCandidate(queries[1]);
    assert.deepEqual(after.rows, before.rows);
    const measurement = {
      search,
      estimates: 3000,
      candidates: 3003,
      before: { ...before, rows: undefined },
      after: { ...after, rows: undefined },
    };
    measurements.push(measurement);
    console.log(
      "PPO_CANDIDATE_VOLUME " +
        JSON.stringify({
          ...measurement,
          before: { ...measurement.before, plan: undefined },
          after: { ...measurement.after, plan: undefined },
        }),
    );
  }
  mkdirSync("work/candidate-branch-fences", { recursive: true });
  writeFileSync(
    "work/candidate-branch-fences/volume.json",
    JSON.stringify({ statistics, measurements }, null, 2),
  );
});
