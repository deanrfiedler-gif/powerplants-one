import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reviewSources } from "../../src/reviews/service";
import { listWorkReviews } from "../../src/activities/work-reviews";
import { reviewSources as oracle } from "../helpers/review-sources-per-row";
import { listWorkReviews as workOracle } from "../helpers/work-reviews-per-row";
import { reviewSourcesFixture } from "../helpers/review-sources-fixture";
import { CRM } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("Review sources preserve full DTO, JSON, authority, paging and work summaries against frozen main", async (t) => {
  const f = await reviewSourcesFixture();
  let filteredComparisons = 0,
    nonEmptyFilteredComparisons = 0;
  for (const p of [f.broad, f.reviewer, f.author, f.other, f.denied]) {
    const expected = await oracle(p),
      actual = await reviewSources(p);
    assert.deepEqual(actual, expected);
    assert.equal(JSON.stringify(actual), JSON.stringify(expected));
    assert.ok(actual.items.length > 0, `non-vacuous ${p.display_name}`);
    for (const limit of [1, 3, 100]) {
      const expectedWork = await workOracle(p, { company_id: null, limit });
      const work = await listWorkReviews(p, { company_id: null, limit });
      assert.deepEqual(work, expectedWork);
      assert.equal(JSON.stringify(work), JSON.stringify(expectedWork));
      if (work) assert.equal(work.items.length, Math.min(work.total, limit));
    }
    for (const company of [CRM.company, CRM.companyB]) {
      // Engineering's corrected company filter is proved separately; the other
      // sources must still match the frozen oracle, including their states.
      const expectedFiltered = await oracle(p, company),
        actualFiltered = await reviewSources(p, company);
      const expectedOther = {
        items: expectedFiltered.items.filter((i) => i.module !== "Engineering"),
        sources: expectedFiltered.sources.filter(
          (s) => s.module !== "Engineering",
        ),
      };
      const actualOther = {
        items: actualFiltered.items.filter((i) => i.module !== "Engineering"),
        sources: actualFiltered.sources.filter(
          (s) => s.module !== "Engineering",
        ),
      };
      assert.deepEqual(actualOther, expectedOther);
      assert.equal(JSON.stringify(actualOther), JSON.stringify(expectedOther));
      filteredComparisons++;
      if (actualOther.items.length > 0) nonEmptyFilteredComparisons++;
    }
  }
  assert.equal(
    filteredComparisons,
    10,
    "five principals across both companies",
  );
  assert.equal(
    nonEmptyFilteredComparisons,
    2,
    "exactly two company-filtered comparisons contain non-Engineering items",
  );
  const broad = await reviewSources(f.broad),
    engineering = broad.items.filter((i) => i.module === "Engineering");
  assert.ok(
    engineering.some((i) => i.kind === "Review" && !i.returned && i.current),
  );
  assert.ok(engineering.some((i) => i.kind === "Review" && i.returned));
  assert.ok(engineering.some((i) => i.kind === "Handover"));
  assert.ok(engineering.some((i) => i.actionable));
  assert.ok(broad.items.filter((i) => i.module === "Service").length >= 2);
  assert.ok(
    (await reviewSources(f.denied)).items.some((i) => i.module === "Finance"),
  );
  assert.equal(
    (await reviewSources(f.denied)).sources.find(
      (s) => s.module === "Engineering",
    )?.state,
    "denied",
  );
  assert.ok(
    engineering.some(
      (i) => i.package_id === f.packageIds.slice(3).sort().at(-1),
    ),
    "page 2 contributes a closed review",
  );
  const narrow = await reviewSources(f.reviewer);
  assert.equal(
    narrow.items.find(
      (i) => i.record_id === f.made.changes["001"] && i.kind === "Review",
    )?.actionable,
    true,
  );
  assert.equal(
    narrow.items.find(
      (i) => i.record_id === f.made.changes["004"] && i.kind === "Review",
    )?.actionable,
    false,
    "site policy narrows the company policy's disciplines",
  );
  for (const status of ["Pending", "Returned", "Accepted"])
    assert.ok(
      engineering.some((i) => i.kind === "Handover" && i.status === status),
    );
  assert.ok(engineering.some((i) => i.status === "Closed" && !i.current));
  const stale = engineering.filter(
    (i) =>
      i.record_id === f.made.changes["007"] &&
      i.kind === "Handover" &&
      i.status === "Pending",
  );
  assert.ok(
    stale.length > 0,
    "successor revision retains stale pending handovers",
  );
  assert.ok(stale.every((i) => !i.actionable));
  assert.ok(
    engineering.length >
      narrow.items.filter((i) => i.module === "Engineering").length,
    "site-scoped visibility is narrower",
  );
  // Revocation must affect the next request; no authority is cached across calls.
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='engineering.change.review' AND valid_to IS NULL",
    [f.reviewer.actor_id],
  );
  const revoked = await reviewSources(f.reviewer);
  assert.deepEqual(revoked, await oracle(f.reviewer));
  assert.ok(
    !revoked.items.some((i) => i.module === "Engineering" && i.actionable),
  );

  // Test-only seam: hide one listed package from its native engineeringRow
  // projection, after listEngineering has returned it. Both paths consequently
  // throw the native unavailable() 404; production has no hook or test mode.
  const pool = database(),
    original = pool.query,
    target = [...f.packageIds].sort()[20];
  let omitted = 0;
  const mock = t.mock.method(pool, "query", function (
    this: typeof pool,
    sql: unknown,
    ...args: unknown[]
  ) {
    const result = Reflect.apply(original, this, [sql, ...args]);
    if (
      typeof sql === "string" &&
      sql.includes("FROM ppo.engineering_packages p JOIN") &&
      /p\.id=\$/.test(sql)
    )
      return result.then((r: { rows: { id?: string }[]; rowCount: number }) => {
        const rows = r.rows.filter((row) => row.id !== target);
        omitted += r.rows.length - rows.length;
        return { ...r, rows, rowCount: rows.length };
      });
    return result;
  } as typeof original);
  const failedBefore = await oracle(f.broad),
    failedAfter = await reviewSources(f.broad);
  mock.mock.restore();
  assert.equal(omitted, 2);
  assert.deepEqual(failedAfter, failedBefore);
  assert.equal(JSON.stringify(failedAfter), JSON.stringify(failedBefore));
  assert.equal(
    failedAfter.sources.find((s) => s.module === "Engineering")?.state,
    "unavailable",
  );
  assert.ok(!failedAfter.items.some((i) => i.module === "Engineering"));
  assert.deepEqual(
    failedAfter.items,
    broad.items.filter((i) => i.module !== "Engineering"),
  );
});

test("Review sources keep the 200-package bound and perform scoped checks once per request", async (t) => {
  await reset();
  const f = await reviewSourcesFixture(205);
  const expected = await oracle(f.broad);
  const pool = database(),
    original = pool.query;
  const grants: string[] = [];
  let statements = 0;
  const observer = t.mock.method(pool, "query", function (
    this: typeof pool,
    sql: unknown,
    ...args: unknown[]
  ) {
    statements++;
    if (
      typeof sql === "string" &&
      sql.includes("SELECT DISTINCT g.capability")
    ) {
      const values = args[0] as unknown[];
      for (let offset = 0; offset < values.length; offset += 5)
        grants.push(JSON.stringify(values.slice(offset, offset + 5)));
    }
    return Reflect.apply(original, this, [sql, ...args]);
  } as typeof original);
  const actual = await reviewSources(f.broad);
  observer.mock.restore();
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(
    actual.sources.find((s) => s.module === "Engineering")?.bounded,
    true,
  );
  assert.ok(actual.items.length > 0);
  const engineering = actual.items.filter((i) => i.module === "Engineering");
  assert.ok(
    engineering.some((i) => i.kind === "Review" && !i.returned && i.current),
  );
  assert.ok(engineering.some((i) => i.kind === "Review" && i.returned));
  assert.ok(engineering.some((i) => i.kind === "Handover"));
  assert.ok(engineering.some((i) => i.actionable));
  assert.equal(
    grants.length,
    new Set(grants).size,
    "exact scoped duty checks are reused across pages",
  );
  assert.ok(grants.length > 0, "the duty observer is non-vacuous");
  assert.ok(statements < 100, `small bounded statement count: ${statements}`);
  for (const limit of [1, 3, 100]) {
    const actualWork = await listWorkReviews(f.broad, {
      company_id: null,
      limit,
    });
    assert.deepEqual(
      actualWork,
      await workOracle(f.broad, { company_id: null, limit }),
    );
    assert.equal(actualWork?.bounded, true);
  }
});
