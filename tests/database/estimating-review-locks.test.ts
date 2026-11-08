import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { after, before, test, type TestContext } from "node:test";
import { setTimeout as pause } from "node:timers/promises";
import pg from "pg";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { createSession, type Principal } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, saveEstimate } from "../../src/estimating/service";
import { readEstimateReview } from "../../src/estimating/review/reads";
import { submitEstimateReview } from "../../src/estimating/review/service";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";
import { prepareRelease } from "../../src/estimating/release/service";
import { readRelease } from "../../src/estimating/release/reads";
import {
  createCostSource,
  decideCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import {
  previewSourceRefresh,
  applySourceRefresh,
} from "../../src/estimating/sources/refresh";
import {
  applyReceiving,
  previewReceiving,
} from "../../src/estimating/specialist/receiving";
import { fixtureIds } from "../../src/estimating/specialist/fixture-policy";
import { crmBase, crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
import { sourceInput } from "../helpers/estimating-sources";
import { releaseFixture, preparation } from "../helpers/quotation-release";
import { specialistFixture, receivingInput, base } from "../helpers/specialist";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

const workspaceLock =
  /SELECT 1 FROM ppo\.workspaces WHERE id=\$1 FOR (?:SHARE|UPDATE)/;
const queueWorkspaceLock = "SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE";
type Scope = {
  pid?: number;
  sql: string[];
  selectOnly?: boolean;
  before?: (sql: string) => Promise<void> | void;
  after?: (sql: string) => Promise<void> | void;
};
const observed = new AsyncLocalStorage<Scope>();

function assertSelect(sql: string) {
  // Only this exact statement may take a row lock in the queue callback.
  if (sql === queueWorkspaceLock) return;
  // Lexically remove SQL literals/comments before checking CTEs or a second
  // statement. Source audit separately enumerates the SELECT function calls.
  const code = sql
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, " ")
    .trim();
  assert.match(code, /^(SELECT|WITH)\b/i, "queue callback must only SELECT");
  assert.doesNotMatch(
    code,
    /\bFOR\s+(?:(?:NO\s+KEY\s+)?UPDATE|(?:KEY\s+)?SHARE)\b/i,
    "queue callback must not take any other row lock",
  );
  assert.doesNotMatch(
    code,
    /;|\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|CALL|DO|COPY|SET|RESET|nextval|setval)\b/i,
    "queue callback must not hide writes in CTEs, functions or extra statements",
  );
}
function instrument(t: TestContext) {
  const real = pg.Client.prototype.query;
  t.mock.method(
    pg.Client.prototype,
    "query",
    async function (this: pg.Client, ...args: Parameters<pg.Client["query"]>) {
      const scope = observed.getStore();
      const sql =
        typeof args[0] === "string"
          ? args[0]
          : (args[0] as unknown as { text?: string })?.text;
      if (scope) {
        assert.equal(typeof sql, "string");
        scope.pid = (this as pg.Client & { processID: number }).processID;
        scope.sql.push(sql!);
        // Only the transaction wrapper may delimit the callback. Every other
        // statement, including the workspace lock and WITH query, is checked.
        if (scope.selectOnly && !/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql!))
          assertSelect(sql!);
        await scope.before?.(sql!);
      }
      const result = await Reflect.apply(real, this, args);
      await scope?.after?.(sql!);
      return result;
    },
  );
}
function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
async function bounded<T>(promise: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Error(
                "Concurrent operation did not progress while reader held its lock",
              ),
            ),
          5000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function submit(p: Principal, id: string) {
  const d = await readEstimateReview(p, id);
  await submitEstimateReview(p, id, {
    ...crmBase(),
    estimate_version_id: d.saved.id,
    basis_hash: d.basis_hash,
    expected_version: d.estimate.version,
    expected_review_version: d.sequence,
    responses: [],
  });
}
async function fixture(title = `SYN queue locking ${randomUUID()}`) {
  const p = (await createSession("coordinator")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const input = { ...estimateInput(o.id), title };
  await createEstimate(p, input);
  await submit(p, input.id);
  return { p, input, title };
}

// Non-vacuous projection checks accompany the rejecting client. No renderer is
// needed: the quotation branch uses a real prepared Output pending revision.
test("queue callback rejects non-SELECT SQL across source, specialist/discovery and quotation history reads", async (t) => {
  for (const sql of [
    "UPDATE ppo.users SET active=false",
    "WITH x AS (DELETE FROM ppo.users RETURNING *) SELECT * FROM x",
    "SELECT 1; DELETE FROM ppo.users",
    "SELECT nextval('x')",
    "SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",
    "SELECT id FROM ppo.opportunities WHERE id=$1 FOR UPDATE",
    "SELECT id FROM ppo.opportunities WHERE id=$1 FOR NO KEY UPDATE",
    "SELECT id FROM ppo.opportunities WHERE id=$1 FOR SHARE",
    "SELECT id FROM ppo.opportunities WHERE id=$1 FOR KEY SHARE",
    `${queueWorkspaceLock} NOWAIT`,
  ])
    assert.throws(() => assertSelect(sql));
  const f = await fixture();
  const reviewer = (await createSession("estimating-source-reviewer"))
    .principal;
  const source = sourceInput();
  await createCostSource(f.p, source);
  let detail = await readCostSource(f.p, source.id);
  await decideCostSource(f.p, source.id, {
    ...crmBase(),
    expected_version: detail.source.version,
    revision_id: detail.revision.id,
    action: "Submit",
  });
  detail = await readCostSource(reviewer, source.id);
  await decideCostSource(reviewer, source.id, {
    ...crmBase(),
    expected_version: detail.source.version,
    revision_id: detail.revision.id,
    action: "Reviewed",
  });
  const saved = await readEstimateReview(f.p, f.input.id);
  const proposal = {
    estimate_version_id: saved.saved.id,
    pricing_date: "2026-09-24",
    selections: [
      {
        line_id: saved.saved.lines[0].id,
        source_id: source.id,
        revision_id: detail.revision.id,
        expected_source_version: detail.source.version + 1,
      },
    ],
  };
  const preview = await previewSourceRefresh(f.p, f.input.id, proposal);
  await applySourceRefresh(f.p, f.input.id, {
    ...crmBase(),
    expected_version: saved.estimate.version,
    proposal,
    comparison_hash: preview.comparison_hash,
    reviewed: true,
  });
  await submit(f.p, f.input.id); // retains both original and source-bound submissions
  const s = await specialistFixture(true),
    receiving = await receivingInput(s.p);
  const comparison = await previewReceiving(
    s.p,
    fixtureIds.configuration,
    receiving,
  );
  await applyReceiving(s.p, fixtureIds.configuration, {
    ...base(),
    ...receiving,
    proposal_signature: comparison.proposal_signature,
  });
  await submit(s.p, fixtureIds.estimate);
  const q = await releaseFixture();
  const prepared = preparation(await readRelease(q.owner, q.draft.id));
  await prepareRelease(q.owner, q.draft.id, prepared);

  instrument(t);
  const scope: Scope = { sql: [], selectOnly: true };
  const read = async (...args: Parameters<typeof readEstimatingReviewQueue>) => {
    const start = scope.sql.length;
    const result = await readEstimatingReviewQueue(...args);
    assert.equal(
      scope.sql.slice(start).filter((sql) => sql === queueWorkspaceLock).length,
      1,
      "each queue read must take its exact workspace share lock once",
    );
    return result;
  };
  const [sourceQueue, specialistQueue, quotationQueue] = await observed.run(
    scope,
    async () => [
      await read(reviewer, {
        q: f.title,
        source: "estimates",
      }),
      await read(s.p, {
        q: "SYN Northbank Screen Systems estimate",
        source: "estimates",
      }),
      await read(q.approver, { source: "quotations" }),
    ],
  );
  assert.equal(sourceQueue.items.length, 3);
  assert.equal(specialistQueue.items.length, 3);
  assert.ok(
    specialistQueue.items.every(
      (row) => row.estimate_id === fixtureIds.estimate,
    ),
  );
  assert.equal(
    quotationQueue.items.find((row) => row.submission_id === prepared.id)
      ?.state,
    "Output pending",
  );
  for (const table of [
    "estimate_review_events",
    "estimate_cost_source_bindings",
    "cost_sources",
    "specialist_configurations",
    "specialist_runs",
    "specialist_drafts",
    "estimation_revisions",
    "estimate_specialist_lineage",
    "quote_release_events",
    "quote_release_bases",
    "estimate_quote_jobs",
  ])
    assert.ok(
      scope.sql.some((sql) => sql.includes(`ppo.${table}`)),
      `exercised ${table}`,
    );
  assert.equal(scope.sql.filter((sql) => sql === "BEGIN").length, 3);
  assert.equal(scope.sql.filter((sql) => sql === "COMMIT").length, 3);
  assert.equal(scope.sql.filter((sql) => sql === queueWorkspaceLock).length, 3);
  assert.equal(scope.sql.includes("ROLLBACK"), false);
});

test("two queue readers acquire the same workspace concurrently without a lock wait", async (t) => {
  const f = await fixture(),
    acquired = gate(),
    release = gate();
  instrument(t);
  const firstScope: Scope = {
    sql: [],
    after: async (sql) => {
      if (workspaceLock.test(sql)) {
        acquired.resolve();
        await release.promise;
      }
    },
  };
  const first = observed.run(firstScope, () =>
    readEstimatingReviewQueue(f.p, { q: f.title }),
  );
  const secondScope: Scope = { sql: [] };
  let second: ReturnType<typeof readEstimatingReviewQueue> | undefined;
  try {
    await bounded(acquired.promise);
    second = observed.run(secondScope, () =>
      readEstimatingReviewQueue(f.p, { q: f.title }),
    );
    const result = await bounded(second);
    assert.equal(result.items.length, 3);
    assert.notEqual(firstScope.pid, secondScope.pid);
    const row = (
      await database().query("SELECT pg_blocking_pids($1) blockers", [
        firstScope.pid,
      ])
    ).rows[0];
    assert.deepEqual(row.blockers, []);
    // Completion while the first transaction is still open is stronger than
    // a small measured lock duration; it cannot have waited for its commit.
  } finally {
    release.resolve();
    await Promise.allSettled([first, ...(second ? [second] : [])]);
  }
  assert.equal((await first).items.length, 3);
});

test("one-candidate continuation completes while two full-window queue readers hold their locks", async (t) => {
  const title = `SYN concurrent full window ${randomUUID()}`;
  let f!: Awaited<ReturnType<typeof fixture>>;
  for (let i = 0; i < 26; i++) f = await fixture(title);
  instrument(t);
  const release = gate(),
    ready = [gate(), gate()];
  const scopes: Scope[] = ready.map((g) => ({
    sql: [],
    after: async (sql) => {
      if (workspaceLock.test(sql)) {
        g.resolve();
        await release.promise;
      }
    },
  }));
  const full = scopes.map((scope) =>
    observed.run(scope, () => readEstimatingReviewQueue(f.p, { q: title })),
  );
  const continuationScope: Scope = { sql: [] };
  let continuation: ReturnType<typeof readEstimatingReviewQueue> | undefined;
  try {
    await bounded(Promise.all(ready.map((g) => g.promise)));
    continuation = observed.run(continuationScope, () =>
      readEstimatingReviewQueue(f.p, { q: title, offset: "25" }),
    );
    const page = await bounded(continuation);
    assert.equal(
      new Set([...scopes.map((s) => s.pid), continuationScope.pid]).size,
      3,
    );
    assert.equal(page.items.length, 3);
    assert.equal(page.next_offset, null);
    assert.equal(page.completeness, "CompleteWindow");
    for (const scope of scopes)
      assert.deepEqual(
        (
          await database().query("SELECT pg_blocking_pids($1) blockers", [
            scope.pid,
          ])
        ).rows[0].blockers,
        [],
      );
  } finally {
    release.resolve();
    await Promise.allSettled([
      ...full,
      ...(continuation ? [continuation] : []),
    ]);
  }
  for (const page of await Promise.all(full)) {
    assert.equal(page.items.length, 75);
    assert.equal(page.next_offset, 25);
  }
});

test("native estimating mutation waits for the queue reader and commits only after it ends", async (t) => {
  const f = await fixture(),
    acquired = gate(),
    release = gate(),
    attempted = gate();
  instrument(t);
  const readerScope: Scope = {
    sql: [],
    after: async (sql) => {
      if (workspaceLock.test(sql)) {
        acquired.resolve();
        await release.promise;
      }
    },
  };
  const writerScope: Scope = {
    sql: [],
    before: (sql) => {
      if (workspaceLock.test(sql)) attempted.resolve();
    },
  };
  const reader = observed.run(readerScope, () =>
    readEstimatingReviewQueue(f.p, { q: f.title }),
  );
  let writer: ReturnType<typeof saveEstimate> | undefined;
  try {
    await bounded(acquired.promise);
    writer = observed.run(writerScope, () =>
      saveEstimate(f.p, f.input.id, {
        ...crmBase(),
        expected_version: 1,
        title: f.title,
        scope: f.input.scope,
        policy: f.input.policy,
        lines: f.input.lines.map((line, i) =>
          i ? line : { ...line, unit_cost: "121" },
        ),
      }),
    );
    await bounded(attempted.promise);
    let blocked = false;
    for (let i = 0; i < 100; i++) {
      const row = (
        await database().query("SELECT $1=ANY(pg_blocking_pids($2)) blocked", [
          readerScope.pid,
          writerScope.pid,
        ])
      ).rows[0];
      if (row.blocked) {
        blocked = true;
        break;
      }
      await pause(20);
    }
    assert.equal(
      blocked,
      true,
      "native save must wait on the live queue backend",
    );
    assert.equal(
      (
        await database().query(
          "SELECT version FROM ppo.estimates WHERE id=$1",
          [f.input.id],
        )
      ).rows[0].version,
      1,
    );
  } finally {
    release.resolve();
    await Promise.allSettled([reader, ...(writer ? [writer] : [])]);
  }
  assert.equal((await reader).items.length, 3);
  await writer;
  assert.equal(
    (
      await database().query("SELECT version FROM ppo.estimates WHERE id=$1", [
        f.input.id,
      ])
    ).rows[0].version,
    2,
  );
  const changed = await readEstimatingReviewQueue(f.p, { q: f.title });
  assert.equal(
    changed.items.find((row) => row.kind === "SourcePrice")?.state,
    "Changed basis",
  );
});
