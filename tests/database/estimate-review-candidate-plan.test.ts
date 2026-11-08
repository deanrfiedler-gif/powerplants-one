import { randomUUID } from "node:crypto";
import { createOrganisation } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { crmBase, crmCreate, CRM } from "../helpers/crm";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";
import { readEstimatingReviewQueue as mainQueue } from "../helpers/estimate-review-queue-main";
import { releaseFixture, preparation } from "../helpers/quotation-release";
import { prepareRelease } from "../../src/estimating/release/service";
import { readRelease } from "../../src/estimating/release/reads";
import {
  submittedCandidate,
  candidateQuery,
  explainCandidate,
  assertBoundedLoops,
  assertNeverAnalysed,
  planNodes,
} from "../helpers/estimate-review-candidate-plan";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
after(closeDatabase);

test("candidate branch fences bound every plan node on never-analysed small tables", async () => {
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
  const p = (await createSession("coordinator")).principal;
  const title = "SYN Small candidate plan";
  // CI's accumulated fixture has 29 organisations and 126 opportunities.
  // Build that cheap-join fanout natively, without touching table statistics.
  for (let i = 0; i < 23; i++) {
    await createOrganisation(p, {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      display_name: `SYN Plan organisation ${i}`,
      relationship_status: "Active",
      owner_id: p.actor_id,
      sector: "Nursery",
      access_class: "Internal",
    });
  }
  for (let i = 0; i < 91; i++) await createOpportunity(p, crmCreate());

  for (let i = 0; i < 32; i++) await submittedCandidate(p, title);
  for (let i = 0; i < 3; i++) {
    const f = await releaseFixture();
    await prepareRelease(
      f.owner,
      f.draft.id,
      preparation(await readRelease(f.owner, f.draft.id)),
    );
  }
  const counts = (
    await database().query(`SELECT
    (SELECT count(*)::int FROM ppo.estimates) estimates,
    (SELECT count(*)::int FROM ppo.estimate_review_events WHERE kind='Submission') submissions,
    (SELECT count(*)::int FROM ppo.quote_release_bases) quotations,
    (SELECT count(*)::int FROM ppo.organisations) organisations,
    (SELECT count(*)::int FROM ppo.opportunities) opportunities`)
  ).rows[0];
  assert.deepEqual(counts, {
    estimates: 35,
    submissions: 35,
    quotations: 3,
    organisations: 29,
    opportunities: 126,
  });
  const candidateCount = counts.submissions + counts.quotations;
  const statisticsBefore = await assertNeverAnalysed();
  const input = { q: title, offset: "25" };
  const before = await explainCandidate(
    await candidateQuery(mainQueue, p, input),
  );
  const after = await explainCandidate(
    await candidateQuery(readEstimatingReviewQueue, p, input),
  );
  const statisticsAfter = await assertNeverAnalysed();
  assert.deepEqual(after.rows, before.rows);
  assert.equal(after.rows.length, 7);
  const materialised = planNodes(after.plan).filter((n) =>
    ["CTE estimate_rows", "CTE quotation_rows"].includes(
      n["Subplan Name"] ?? "",
    ),
  );
  assert.equal(materialised.length, 2);
  for (const branch of materialised) assert.equal(branch["Actual Loops"], 1);
  assert.equal(
    materialised.reduce((sum, n) => sum + n["Actual Rows"], 0),
    candidateCount,
  );
  const summary = {
    counts,
    candidate_count: candidateCount,
    loop_bound: 10 * candidateCount,
    statisticsBefore,
    statisticsAfter,
    before: { ...before, rows: undefined },
    after: { ...after, rows: undefined },
  };
  mkdirSync("work/candidate-branch-fences", { recursive: true });
  writeFileSync(
    "work/candidate-branch-fences/small.json",
    JSON.stringify(summary, null, 2),
  );
  console.log(
    "PPO_CANDIDATE_PLAN " +
      JSON.stringify({
        counts,
        loop_bound: 10 * candidateCount,
        before: { ...before, plan: undefined, rows: undefined },
        after: { ...after, plan: undefined, rows: undefined },
      }),
  );
  // Explicit mutation mode demonstrates the same assertion failing on frozen main.
  assertBoundedLoops(
    process.env.PPO_PLAN_FROZEN_MAIN === "1" ? before.plan : after.plan,
    candidateCount,
  );
  assert.throws(
    () => assertBoundedLoops(before.plan, candidateCount),
    /loops exceeds/,
  );
});
