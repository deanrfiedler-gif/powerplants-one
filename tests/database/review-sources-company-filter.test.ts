import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { AppError } from "../../src/platform/errors";
import { reviewSources, reviewInbox } from "../../src/reviews/service";
import { listWorkReviews } from "../../src/activities/work-reviews";
import {
  createEngineeringRequest,
  listEngineering,
} from "../../src/engineering/service";
import { reviewSources as oracle } from "../helpers/review-sources-per-row";
import { reviewSourcesFixture } from "../helpers/review-sources-fixture";
import { engineeringInput } from "../helpers/engineering";
import { CRM } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

async function companyFixture(count = 64) {
  const f = await reviewSourcesFixture(count);
  // Test-only principal: combine the existing second-company and Finance
  // profiles with the coordinator. Production grants and seeds stay unchanged.
  await database().query(
    `INSERT INTO ppo.permission_grants
     (id,workspace_id,user_id,company_id,capability,valid_from,valid_to,scope_type,scope_id,site_id)
     SELECT gen_random_uuid(),workspace_id,$1,company_id,capability,valid_from,valid_to,scope_type,scope_id,site_id
     FROM ppo.permission_grants WHERE user_id=ANY($2::uuid[])
     ON CONFLICT (workspace_id,user_id,capability,scope_type,scope_id) DO NOTHING`,
    [f.broad.actor_id, [f.other.actor_id, f.denied.actor_id]],
  );
  return f;
}
const engineering = (r: Awaited<ReturnType<typeof reviewSources>>) =>
  r.items.filter((i) => i.module === "Engineering");
const engineeringState = (r: Awaited<ReturnType<typeof reviewSources>>) =>
  r.sources.find((s) => s.module === "Engineering");

test("Company-filtered reviews preserve source authority and the independent unfiltered oracle", async (t) => {
  const f = await companyFixture();
  const expected = await oracle(f.broad);
  assert.equal(f.packageIds.length, 64);
  assert.equal(engineering(expected).length, 13);
  assert.deepEqual(engineeringState(expected), {
    module: "Engineering",
    state: "available",
    bounded: false,
  });

  await t.test(
    "2a: exact filtered tasks and order across a multi-company principal and two pages",
    async () => {
      const listed = [];
      let cursor: string | null = null;
      do {
        const page = await listEngineering(f.broad, {
          limit: "50",
          ...(cursor ? { cursor } : {}),
        });
        listed.push(...page.items);
        cursor = page.next_cursor;
      } while (cursor);
      assert.equal(listed.length, 64, "oracle is below the 200-package bound");
      assert.equal(
        listed.filter((p) => p.company_id === CRM.company).length,
        63,
      );
      assert.equal(
        listed.filter((p) => p.company_id === CRM.companyB).length,
        1,
      );
      for (const [company, count] of [
        [CRM.company, 12],
        [CRM.companyB, 1],
      ] as const) {
        const actual = await reviewSources(f.broad, company);
        const selected = engineering(expected).filter(
          (i) => i.company_id === company,
        );
        assert.equal(selected.length, count);
        assert.equal(engineering(actual).length, count);
        assert.deepEqual(engineering(actual), selected);
        assert.equal(
          JSON.stringify(engineering(actual)),
          JSON.stringify(selected),
        );
        assert.deepEqual(engineeringState(actual), {
          module: "Engineering",
          state: "available",
          bounded: false,
        });
        assert.ok(actual.items.every((i) => i.company_id === company));
      }
      const filtered = engineering(await reviewSources(f.broad, CRM.company));
      assert.equal(
        filtered.filter(
          (i) => i.kind === "Review" && i.status === "InReview" && i.current,
        ).length,
        3,
      );
      assert.equal(
        filtered.filter((i) => i.kind === "Review" && i.returned && i.current)
          .length,
        1,
      );
      assert.equal(filtered.filter((i) => i.kind === "Handover").length, 5);
      assert.equal(
        filtered.filter((i) => i.status === "Closed" && !i.current).length,
        1,
        "second page contributes its closed review",
      );
      const other = engineering(expected).filter(
        (i) => i.company_id === CRM.companyB,
      );
      assert.equal(other.length, 1);
      assert.ok(!filtered.some((i) => i.id === other[0].id));
    },
  );

  await t.test(
    "2b: My Work and inbox return company reviews when all five sources are available",
    async () => {
      const sources = await reviewSources(f.broad, CRM.company);
      assert.equal(sources.sources.length, 5);
      assert.ok(sources.sources.every((s) => s.state === "available"));
      const work = await listWorkReviews(f.broad, {
        company_id: CRM.company,
        limit: 100,
      });
      assert.ok(work);
      assert.ok(work.total > 0);
      assert.equal(work.items.length, work.total);
      assert.ok(work.items.every((i) => i.company_id === CRM.company));
      const inbox = await reviewInbox(f.broad, { company_id: CRM.company });
      assert.equal(inbox.state, "complete");
      assert.ok(inbox.total > 0);
      assert.equal(inbox.items.length, inbox.total);
      assert.ok(inbox.items.every((i) => i.company_id === CRM.company));
      assert.equal(inbox.sources.length, 5);
      assert.ok(inbox.sources.every((s) => s.state === "available"));
    },
  );

  await t.test(
    "2c: a hidden company and a non-existent company have identical empty source responses",
    async () => {
      assert.equal(
        engineering(await oracle(f.other)).length,
        1,
        "principal sees its own company's review",
      );
      const absent = randomUUID();
      assert.equal(
        (
          await database().query("SELECT id FROM ppo.companies WHERE id=$1", [
            absent,
          ])
        ).rowCount,
        0,
      );
      const hidden = await reviewSources(f.other, CRM.company);
      const missing = await reviewSources(f.other, absent);
      assert.deepEqual(hidden, missing);
      assert.equal(JSON.stringify(hidden), JSON.stringify(missing));
      assert.deepEqual(engineeringState(hidden), {
        module: "Engineering",
        state: "available",
        bounded: false,
      });
      assert.equal(hidden.items.length, 0);
      assert.equal(engineering(hidden).length, 0);
    },
  );

  await t.test(
    "2d: domain denial and native package refusal keep distinct filtered states",
    async () => {
      const denied = await reviewSources(f.denied, CRM.company);
      assert.deepEqual(engineeringState(denied), {
        module: "Engineering",
        state: "denied",
        bounded: false,
      });
      assert.equal(engineering(denied).length, 0);
      assert.equal(
        denied.items.filter((i) => i.module === "Finance").length,
        3,
      );
      const pool = database(),
        original = pool.query,
        target = f.made.package_id;
      assert.equal(
        (
          await pool.query(
            "SELECT company_id FROM ppo.engineering_packages WHERE id=$1",
            [target],
          )
        ).rows[0].company_id,
        CRM.company,
      );
      const before = await reviewSources(f.broad, CRM.company);
      assert.equal(engineering(before).length, 12);
      let omitted = 0;
      const seam = t.mock.method(pool, "query", function (
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
          return result.then(
            (r: { rows: { id?: string }[]; rowCount: number }) => {
              const rows = r.rows.filter((row) => row.id !== target);
              omitted += r.rows.length - rows.length;
              return { ...r, rows, rowCount: rows.length };
            },
          );
        return result;
      } as typeof original);
      let refused;
      try {
        refused = await reviewSources(f.broad, CRM.company);
      } finally {
        seam.mock.restore();
      }
      assert.equal(
        omitted,
        1,
        "seam hits the per-package access read, never the ID pager",
      );
      assert.deepEqual(engineeringState(refused), {
        module: "Engineering",
        state: "unavailable",
        bounded: false,
      });
      assert.equal(engineering(refused).length, 0);
      assert.deepEqual(
        refused.items,
        before.items.filter((i) => i.module !== "Engineering"),
      );
    },
  );

  await t.test(
    "2f: full unfiltered DTOs and JSON remain identical for five principals",
    async () => {
      for (const [p, count] of [
        [f.broad, 13],
        [f.reviewer, 11],
        [f.author, 12],
        [f.other, 1],
        [f.denied, 0],
      ] as const) {
        const before = await oracle(p),
          actual = await reviewSources(p);
        assert.equal(engineering(actual).length, count);
        assert.ok(actual.items.length > 0);
        assert.deepEqual(actual, before);
        assert.equal(JSON.stringify(actual), JSON.stringify(before));
      }
    },
  );

  await t.test(
    "2g: public Engineering query and invalid inbox company are refused before source reads",
    async () => {
      const pool = database();
      const query = t.mock.method(pool, "query");
      try {
        for (const read of [
          () => listEngineering(f.broad, { company_id: CRM.company }),
          () => reviewInbox(f.broad, { company_id: "not-a-uuid" }),
        ])
          await assert.rejects(
            read,
            (e: unknown) => e instanceof AppError && e.status === 422,
          );
        assert.equal(query.mock.callCount(), 0);
      } finally {
        query.mock.restore();
      }
    },
  );
});

test("2e: the company bound ignores more than 200 visible packages in another company", async () => {
  await reset();
  const f = await companyFixture(6);
  const before = engineering(await oracle(f.broad)).filter(
    (i) => i.company_id === CRM.company,
  );
  assert.equal(before.length, 12);
  const project = (
    await database().query(
      "SELECT project_id FROM ppo.engineering_packages WHERE id=$1",
      [f.extra[1]],
    )
  ).rows[0].project_id;
  for (let i = 0; i < 205; i++)
    await createEngineeringRequest(f.other, {
      ...engineeringInput(project),
      owner_id: f.other.actor_id,
    });
  const visible = [];
  let cursor: string | null = null;
  do {
    const page = await listEngineering(f.broad, {
      limit: "50",
      ...(cursor ? { cursor } : {}),
    });
    visible.push(...page.items);
    cursor = page.next_cursor;
  } while (cursor);
  assert.equal(visible.length, 211);
  assert.equal(
    visible.filter((p) => p.company_id === CRM.companyB).length,
    206,
  );
  assert.equal(visible.filter((p) => p.company_id === CRM.company).length, 5);
  assert.equal(engineeringState(await reviewSources(f.broad))?.bounded, true);
  const actual = await reviewSources(f.broad, CRM.company);
  assert.deepEqual(engineeringState(actual), {
    module: "Engineering",
    state: "available",
    bounded: false,
  });
  assert.equal(engineering(actual).length, 12);
  assert.deepEqual(engineering(actual), before);
  assert.equal(JSON.stringify(engineering(actual)), JSON.stringify(before));
});
