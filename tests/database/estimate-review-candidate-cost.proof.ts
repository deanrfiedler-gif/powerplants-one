import assert from "node:assert/strict";
import { test, after } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOrganisation } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { readEstimateReview } from "../../src/estimating/review/reads";
import { submitEstimateReview } from "../../src/estimating/review/service";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";
import { readRelease } from "../../src/estimating/release/reads";
import { prepareRelease } from "../../src/estimating/release/service";
import { releaseFixture, preparation } from "../helpers/quotation-release";
import { crmBase, crmCreate, CRM } from "../helpers/crm";
import { reset } from "../../scripts/database";
import { readEstimatingReviewQueue as mainQueue } from "../helpers/estimate-review-queue-main";
import { estimateInput } from "../helpers/estimating";

// Explicit diagnostic entrypoint; intentionally outside the ordinary *.test.ts
// glob. Thousands of native commands measure volume, not a CI latency assertion.
assert.equal(localConfig().database_name, "ppo_synthetic_test");
after(closeDatabase);
const compare = process.env.PPO_COST_COMPARE === "1";
const output = compare ? "work/candidate-cost-paired" : "work/candidate-cost";
mkdirSync(output, { recursive: true });
type Sample = { sql: string; values: unknown[]; ms: number };
let samples: Sample[] | undefined;
const original = pg.Client.prototype.query;
pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
  const captured = samples;
  const start = performance.now();
  const result = Reflect.apply(original, this, args);
  if (!captured || typeof args[0] !== "string" || !result?.then) return result;
  return result.then((value: unknown) => {
    captured.push({
      sql: args[0] as string,
      values: Array.isArray(args[1]) ? args[1] : [],
      ms: performance.now() - start,
    });
    return value;
  });
} as typeof original;

test("Prompt Y native volume measurement", async () => {
  if (compare) {
    process.env.PPO_ALLOW_RESET = "dispose-synthetic";
    process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
    await reset();
  }
  const p = (await createSession("coordinator")).principal;
  const title = `SYN Candidate window ${randomUUID()}`;
  async function nativeEstimate(title: string, newOrganisation: boolean) {
    const o = crmCreate();
    if (newOrganisation) {
      o.organisation_id = randomUUID();
      await createOrganisation(p, {
        ...crmBase(),
        id: o.organisation_id,
        company_id: CRM.company,
        display_name: `SYN unrelated ${o.organisation_id}`,
        relationship_status: "Active",
        owner_id: p.actor_id,
        sector: "Nursery",
        access_class: "Internal",
      });
      o.site_id = null;
      o.primary_person_id = null;
      o.site_unknown_reason = "SYN volume fixture without a site";
      o.contact_unknown_reason = "SYN volume fixture without a contact";
    }
    await createOpportunity(p, o);
    const input = { ...estimateInput(o.id), title };
    await createEstimate(p, input);
    const d = await readEstimateReview(p, input.id);
    await submitEstimateReview(p, input.id, {
      ...crmBase(),
      estimate_version_id: d.saved.id,
      basis_hash: d.basis_hash,
      expected_version: d.estimate.version,
      expected_review_version: d.sequence,
      responses: [],
    });
  }
  for (let i = 0; i < 26; i++) await nativeEstimate(title, false);
  const rows: unknown[] = [];
  let created = 0;
  for (const volume of [100, 1000, 3000]) {
    for (; created < volume; created++) {
      await nativeEstimate(`SYN Unrelated volume ${created}`, true);
      if ((created + 1) % 100 === 0)
        console.log(`Native estimates created: ${created + 1}`);
    }
    // Release bases use the existing native reviewed-estimate/quote fixture.
    for (let i = 0; i < (volume === 100 ? 2 : volume === 1000 ? 8 : 20); i++) {
      const f = await releaseFixture();
      await prepareRelease(
        f.owner,
        f.draft.id,
        preparation(await readRelease(f.owner, f.draft.id)),
      );
    }
    const counts = (
      await database().query(
        `SELECT
      (SELECT count(*) FROM ppo.estimates WHERE workspace_id=$1) estimates,
      (SELECT count(*) FROM ppo.estimate_review_events WHERE workspace_id=$1 AND kind='Submission') submissions,
      (SELECT count(*) FROM ppo.quote_release_bases WHERE workspace_id=$1) release_bases,
      (SELECT count(*) FROM ppo.opportunities WHERE workspace_id=$1) opportunities,
      (SELECT count(*) FROM ppo.organisations WHERE workspace_id=$1) organisations`,
        [p.workspace_id],
      )
    ).rows[0];
    for (const offset of [25, 0]) {
      let expected: unknown;
      const readers: [string, typeof readEstimatingReviewQueue][] = compare
        ? [
            ["before", mainQueue],
            ["after", readEstimatingReviewQueue],
          ]
        : [["before", readEstimatingReviewQueue]];
      for (const [label, reader] of readers) {
        const input = { q: title, offset: String(offset) };
        await reader(p, input);
        samples = [];
        const start = performance.now();
        const result = await reader(p, input);
        const wall = performance.now() - start;
        const { as_of, ...stable } = result;
        assert.ok(as_of);
        if (label === "before") expected = stable;
        else {
          assert.deepEqual(stable, expected);
          assert.equal(JSON.stringify(stable), JSON.stringify(expected));
        }
        const measured = samples;
        samples = undefined;
        assert.equal(result.items.length, offset === 25 ? 3 : 75);
        assert.equal(result.next_offset, offset === 25 ? null : 25);
        assert.equal(result.completeness, "CompleteWindow");
        const candidate = measured.find((s) =>
          s.sql.includes("WITH candidates AS"),
        )!;
        assert.ok(candidate);
        const longest = measured.reduce((a, b) => (a.ms > b.ms ? a : b));
        const row = {
          label,
          volume,
          offset,
          counts,
          statements: measured.length,
          database_ms: measured.reduce((n, s) => n + s.ms, 0),
          longest_ms: longest.ms,
          longest_sql: longest.sql,
          candidate_ms: candidate.ms,
          wall_ms: wall,
        };
        rows.push(row);
        console.log(JSON.stringify(row));
        writeFileSync(
          `${output}/measurements.json`,
          JSON.stringify({ title, rows }, null, 2),
        );
        writeFileSync(
          `${output}/statements-${label}-${volume}-${offset}.json`,
          JSON.stringify(measured, null, 2),
        );
        const plan = await database().query(
          `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${candidate.sql}`,
          candidate.values,
        );
        writeFileSync(
          `${output}/plan-${label}-${volume}-${offset}.json`,
          JSON.stringify(plan.rows, null, 2),
        );
      }
    }
  }
});
