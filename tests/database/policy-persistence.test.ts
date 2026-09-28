import assert from "node:assert/strict";
import { schedulingPolicySeedGrants } from "../helpers/engineering-materials-grants";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import type { PoolClient } from "pg";
import { migrate, seed } from "../../scripts/database";
import { migrateDemo } from "../../scripts/demo-database";
import { grantRuntimePrivileges } from "../../scripts/demo-runtime";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { canonical } from "../../src/platform/operations";
import {
  loadPolicyChain,
  loadProposal,
  loadReview,
  savePolicyProposal,
  savePolicyReview,
} from "../../src/scheduling/policy-persistence";
import {
  createPolicyProposal,
  createPolicyReview,
  proposalReference,
} from "../../src/scheduling/policy-publication-contracts";
import { digest } from "../../src/scheduling/policy-values";
import {
  persistenceFixture,
  publicationFixture,
  resolutionFixture,
  workspace,
  proposer,
  reviewer,
} from "../helpers/policy-persistence";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const sql = (name: string) =>
  readFile(new URL(`../../db/${name}`, import.meta.url), "utf8");
before(async () => {
  await database().query(await sql("migrations/0001-recover.sql"));
  await database().query(
    "DROP TABLE IF EXISTS public.ppo_migrations,public.ppo_demo_migrations",
  );
  await migrate(50);
  await seed(50);
});
after(closeDatabase);
const tables = async () =>
  (
    await database().query(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows.map((r) => r.tablename as string);
const snapshot = async (names: string[]) => {
  // One round trip retains the complete ordered rows; no checksum-only weakening.
  const result = await database().query(
    names
      .map(
        (name) =>
          `SELECT '${name}' AS name,coalesce(jsonb_agg(row_to_json(t) ORDER BY row_to_json(t)::text),'[]'::jsonb) AS rows FROM ppo.${name} t`,
      )
      .join(" UNION ALL "),
  );
  return Object.fromEntries(result.rows.map((r) => [r.name, r.rows]));
};
const rollback = Symbol("fixture rollback");
async function proof(fn: (db: PoolClient) => Promise<void>) {
  try {
    await transaction(async (db) => {
      await fn(db);
      await db.query("SET CONSTRAINTS ALL IMMEDIATE");
      throw rollback;
    });
  } catch (e) {
    if (e !== rollback) throw e;
  }
}
async function refused(
  db: PoolClient,
  fn: () => Promise<unknown>,
  codes: string[] = ["23514", "23503", "23505", "P0002"],
) {
  await db.query("SAVEPOINT negative_case");
  try {
    await assert.rejects(
      async () => {
        await fn();
        await db.query("SET CONSTRAINTS ALL IMMEDIATE");
      },
      (e: unknown) => codes.includes((e as { code: string }).code),
    );
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT negative_case");
    await db.query("RELEASE SAVEPOINT negative_case");
  }
}
async function clone(
  db: PoolClient,
  table: string,
  patch: Record<string, unknown>,
) {
  const row = (
    await db.query(`SELECT row_to_json(t) AS row FROM ppo.${table} t LIMIT 1`)
  ).rows[0].row;
  const next = { ...row, ...patch };
  if (!patch.content && next.content?.id && patch.id)
    next.content = { ...next.content, id: patch.id };
  if (table === "scheduling_policy_reviews" && !patch.review_event_id) {
    next.review_event_id = randomUUID();
    next.content = { ...next.content, review_event_id: next.review_event_id };
  }
  if (next.content && !patch.content_hash) {
    next.canonical_content = canonical(next.content);
    next.content_hash = digest(next.content);
  }
  return db.query(
    `INSERT INTO ppo.${table} SELECT (jsonb_populate_record(NULL::ppo.${table},$1::jsonb)).*`,
    [next],
  );
}

test("populated 0050 upgrade preserves every old row/hash, registers 0053/0054 with reserved gaps and exact narrow authority additions", async () => {
  const names = (await tables()).filter((t) => t !== "seed_receipts"),
    beforeRows = await snapshot(names);
  const oldLedger = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  const oldReceipts = (
    await database().query("SELECT * FROM ppo.seed_receipts ORDER BY version")
  ).rows;
  await migrate();
  await seed();
  const upgraded = await snapshot(names);
  for (const name of names.filter(n => !["users", "permission_grants"].includes(n))) assert.deepEqual(upgraded[name], beforeRows[name]);
  const ids = new Set(beforeRows.users.map((r: { id: string }) => r.id));
  assert.deepEqual(upgraded.users.filter((r: { id: string }) => ids.has(r.id)), beforeRows.users);
  assert.deepEqual(upgraded.users.filter((r: { id: string }) => !ids.has(r.id)).map((r: { id: string }) => r.id).sort(),
    ["a0540000-0000-4000-8000-000000000001", "a0540000-0000-4000-8000-000000000002"]);
  const grantIds = new Set(beforeRows.permission_grants.map((r: { id: string }) => r.id));
  assert.deepEqual(upgraded.permission_grants.filter((r: { id: string }) => grantIds.has(r.id)), beforeRows.permission_grants);
  const shape = (rows: Record<string, unknown>[]) => rows.map(({ id: _id, ...r }) => { void _id; return canonical(r); }).sort();
  assert.deepEqual(shape(upgraded.permission_grants.filter((r: { id: string }) => !grantIds.has(r.id))), shape(schedulingPolicySeedGrants(beforeRows.permission_grants)));
  const ledger = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(ledger.slice(0, -2), oldLedger);
  assert.equal(ledger.at(-1).version, 54);
  assert.deepEqual(
    ledger.map((r) => r.version),
    [
      ...Array.from({ length: 50 }, (_, i) => i + 1).filter((n) => n !== 16),
      53, 54,
    ],
  );
  const receipts = (
    await database().query("SELECT * FROM ppo.seed_receipts ORDER BY version")
  ).rows;
  assert.deepEqual(receipts.slice(0, -2), oldReceipts);
  assert.equal(receipts.at(-1).version, 54);
  await transaction(async (db) => {
    const chain = await loadPolicyChain(db, workspace);
    assert.equal(chain.members.length, 1);
    assert.equal(chain.head.version, 1);
    assert.equal(chain.members[0].review_binding, null);
    assert.equal(chain.members[0].predecessor, null);
  });
  for (const t of [
    "proposals",
    "reviews",
    "publications",
    "impacts",
    "resolutions",
  ])
    assert.equal(
      (
        await database().query(
          `SELECT count(*)::int AS n FROM ppo.scheduling_policy_${t}`,
        )
      ).rows[0].n,
      0,
    );
  const retained = await snapshot(await tables());
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(await tables()), retained);
});

test("PostgreSQL round-trip preserves exact canonical proposal/review bytes, timestamps, nulls and complete ordered population", async () =>
  proof(async (db) => {
    const f = await persistenceFixture(db);
    const loadedP = await loadProposal(db, workspace, f.proposal.id, f.chain);
    const loadedR = await loadReview(
      db,
      workspace,
      f.review.id,
      f.chain,
      loadedP,
    );
    assert.deepEqual(loadedP, f.proposal);
    assert.deepEqual(loadedR, f.review);
    assert.equal(loadedR.candidates.length, 2);
    assert.deepEqual(
      loadedR.candidates.map((c) => c.evaluation.outcome).sort(),
      ["Compliant", "ImpactRequired"],
    );
    assert.equal(
      loadedR.candidates[0].dependencies.booking.actual_start_at,
      null,
    );
    assert.equal(loadedP.proposed_at, "2030-01-01T00:00:00.123Z");
    assert.equal(
      loadedP.fixed_terms.evidence,
      f.chain.members[0].policy.evidence,
    );
    for (const [table, record] of [
      ["proposals", f.proposal],
      ["reviews", f.review],
    ] as const) {
      const stored = (
        await db.query(
          `SELECT *,content::text AS postgres_text FROM ppo.scheduling_policy_${table} WHERE id=$1`,
          [record.id],
        )
      ).rows[0];
      const { content_hash, ...body } = record;
      assert.equal(stored.canonical_content, canonical(body));
      assert.equal(stored.content_hash, content_hash);
      assert.notEqual(stored.postgres_text, stored.canonical_content);
    }
    const later = createPolicyReview(
      {
        id: randomUUID(),
        version: 1,
        reviewer_id: reviewer,
        review_event_id: randomUUID(),
        evaluated_at: "2030-02-02T00:00:00.123Z",
      },
      {
        chain: f.chain,
        proposal: f.proposal,
        proposer_id: proposer,
        reviewer_id: reviewer,
        population: f.population,
      },
    );
    assert.equal(later.population_hash, f.review.population_hash);
    assert.notEqual(later.content_hash, f.review.content_hash);
    await savePolicyReview(db, later, {
      workspace_id: workspace,
      proposal_id: f.proposal.id,
      reviewer_id: reviewer,
      population: f.population,
    });
  }));

test("immutable proposal revisions retain predecessors and reject forged source/head/actor/hash/workspace bindings", async () =>
  proof(async (db) => {
    const f = await persistenceFixture(db, 0),
      p = f.proposal;
    const revised = createPolicyProposal(
      { max_visit_minutes: 90, effective_from: p.effective_from },
      {
        chain: f.chain,
        proposer_id: proposer,
        id: randomUUID(),
        version: 2,
        predecessor_proposal: proposalReference(p),
        proposed_at: p.proposed_at,
      },
    );
    await savePolicyProposal(db, revised, {
      workspace_id: workspace,
      proposer_id: proposer,
    });
    assert.deepEqual(await loadProposal(db, workspace, p.id, f.chain), p);
    for (const patch of [
      { source_hash: "f".repeat(64) },
      { expected_head_version: 7 },
      { proposer_id: reviewer },
      { root_policy_id: randomUUID() },
      { workspace_id: "10000000-0000-4000-8000-000000000002" },
      { schema_version: 2 },
      { evaluator_version: 2 },
      { content_hash: "a".repeat(64) },
      {
        predecessor_id: p.id,
        predecessor_version: null,
        predecessor_hash: null,
      },
    ])
      await refused(db, () =>
        clone(db, "scheduling_policy_proposals", {
          id: randomUUID(),
          ...patch,
        }),
      );
    const forged = {
      ...p,
      id: randomUUID(),
      fixed_terms: { ...p.fixed_terms, evidence: "Changed source" },
    };
    await assert.rejects(
      savePolicyProposal(db, forged, {
        workspace_id: workspace,
        proposer_id: proposer,
      }),
    );
    await assert.rejects(
      loadProposal(db, "10000000-0000-4000-8000-000000000002", p.id, f.chain),
    );
  }));

test("review refuses missing compliant candidates, substituted proposal, timestamp, event, population and typed booking links", async () =>
  proof(async (db) => {
    const f = await persistenceFixture(db);
    await assert.rejects(
      savePolicyReview(db, f.review, {
        workspace_id: workspace,
        proposal_id: f.proposal.id,
        reviewer_id: reviewer,
        population: f.population.slice(1),
      }),
    );
    for (const patch of [
      { proposal_hash: "a".repeat(64) },
      { reviewer_id: proposer },
      { evaluated_at: "2030-01-01T00:00:00Z" },
      { population_hash: "b".repeat(64) },
      { review_event_id: randomUUID() },
    ])
      await refused(db, () =>
        clone(db, "scheduling_policy_reviews", { id: randomUUID(), ...patch }),
      );
    await refused(db, () =>
      clone(db, "scheduling_policy_candidates", { ordinal: 3 }),
    );
    await refused(db, () =>
      clone(db, "scheduling_policy_candidates", {
        appointment_id: randomUUID(),
      }),
    );
    await refused(db, () =>
      clone(db, "scheduling_policy_candidates", { site_id: randomUUID() }),
    );
    await refused(db, async () => {
      const { content_hash, ...body } = f.review;
      assert.ok(content_hash);
      const content = {
        ...body,
        id: randomUUID(),
        review_event_id: randomUUID(),
      };
      await clone(db, "scheduling_policy_reviews", {
        id: content.id,
        review_event_id: content.review_event_id,
        content,
      });
      // Deliberately insert no typed candidates: deferred coverage must reject commit.
    });
  }));

test("linear publication advances family head separately from policy version and binds exact receipt, proposal and review", async () =>
  proof(async (db) => {
    const f = await persistenceFixture(db),
      p = await publicationFixture(db, f);
    await db.query("SET CONSTRAINTS ALL IMMEDIATE");
    await db.query("SET CONSTRAINTS ALL DEFERRED");
    const chain = await loadPolicyChain(db, workspace);
    assert.equal(chain.head.version, 2);
    assert.equal(chain.head.policy.version, 7);
    assert.equal(chain.members[0].policy.id, f.chain.seed_root.id);
    assert.equal(
      chain.members[1].review_binding?.review.content_hash,
      f.review.content_hash,
    );
    assert.equal(
      chain.members[1].review_binding?.selected_policy.content_hash,
      digest(p.policy),
    );
    await refused(db, () =>
      db.query(
        "UPDATE ppo.scheduling_policy_heads SET version=1,policy_id=$2 WHERE workspace_id=$1",
        [workspace, f.chain.seed_root.id],
      ),
    );
    await refused(db, () =>
      db.query(
        "UPDATE ppo.scheduling_policy_heads SET version=3 WHERE workspace_id=$1",
        [workspace],
      ),
    );
    await refused(db, () =>
      clone(db, "scheduling_policy_members", {
        policy_id: randomUUID(),
        chain_version: 3,
      }),
    );
    await refused(db, () => publicationFixture(db, f));
    await refused(db, () =>
      clone(db, "scheduling_policy_publications", {
        id: randomUUID(),
        review_hash: "b".repeat(64),
      }),
    );
    await refused(db, () =>
      clone(db, "scheduling_policy_impacts", { id: randomUUID() }),
    );
    await refused(db, () =>
      clone(db, "scheduling_policy_impact_activities", {
        impact_id: randomUUID(),
      }),
    );
    const first = await resolutionFixture(db, p),
      second = await resolutionFixture(db, p, first);
    assert.equal(second.sequence, 2);
    await refused(db, () => resolutionFixture(db, p, first));
    await refused(db, () =>
      clone(db, "scheduling_policy_resolutions", {
        id: randomUUID(),
        operation_id: randomUUID(),
        sequence: 4,
      }),
    );
    // Activity completion does not write any resolution or alter impact evidence.
    const impactBefore = (
      await db.query(
        "SELECT content_hash FROM ppo.scheduling_policy_impacts WHERE id=$1",
        [p.impacts[0].id],
      )
    ).rows;
    await db.query(
      "UPDATE ppo.activities SET status='Completed',outcome='Synthetic completion',version=version+1 WHERE id=$1",
      [p.impacts[0].activity_id],
    );
    assert.deepEqual(
      (
        await db.query(
          "SELECT content_hash FROM ppo.scheduling_policy_impacts WHERE id=$1",
          [p.impacts[0].id],
        )
      ).rows,
      impactBefore,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM ppo.scheduling_policy_resolutions",
        )
      ).rows[0].n,
      2,
    );
  }));

test("all evidence tables reject direct UPDATE/DELETE; head refuses DELETE", async () =>
  proof(async (db) => {
    const f = await persistenceFixture(db),
      p = await publicationFixture(db, f);
    await resolutionFixture(db, p);
    await db.query("SET CONSTRAINTS ALL IMMEDIATE");
    await db.query("SET CONSTRAINTS ALL DEFERRED");
    for (const table of [
      "families",
      "members",
      "proposals",
      "reviews",
      "candidates",
      "publications",
      "impacts",
      "impact_activities",
      "resolutions",
    ]) {
      await refused(
        db,
        () =>
          db.query(
            `UPDATE ppo.scheduling_policy_${table} SET workspace_id=workspace_id`,
          ),
        ["55000"],
      );
      await refused(
        db,
        () => db.query(`DELETE FROM ppo.scheduling_policy_${table}`),
        ["55000"],
      );
    }
    await refused(
      db,
      () => db.query("DELETE FROM ppo.scheduling_policy_heads"),
      ["55000"],
    );
  }));

test("publication rejects re-bound operations, actors, receipts, task owners and incomplete impact/task graphs", async () =>
  proof(async (db) => {
    const f = await persistenceFixture(db);
    for (const scenario of [
      "predecessor",
      "publisher",
      "review hash",
      "operation",
      "command bytes",
      "receipt record",
      "task owner",
      "missing task link",
    ]) {
      const intercepted = new Proxy(db, {
        get(target, key) {
          if (key !== "query") return Reflect.get(target, key);
          return (text: string, values?: unknown[]) => {
            const v = values ? [...values] : undefined;
            if (
              v &&
              text.includes("INSERT INTO ppo.scheduling_policy_publications")
            ) {
              if (scenario === "predecessor") v[11] = randomUUID();
              if (scenario === "publisher") v[4] = reviewer;
              if (scenario === "review hash") v[10] = "f".repeat(64);
              if (scenario === "operation") v[16] = randomUUID();
              if (scenario === "command bytes")
                v[19] = canonical({
                  ...(v[18] as Record<string, unknown>),
                  reason: "Altered original",
                });
            }
            if (
              v &&
              scenario === "receipt record" &&
              text.includes("INSERT INTO ppo.operation_receipts")
            )
              v[4] = f.population[0].dependencies.booking.appointment.id;
            if (
              v &&
              scenario === "task owner" &&
              text.includes("INSERT INTO ppo.activities")
            )
              v[4] = reviewer;
            if (
              scenario === "missing task link" &&
              text.includes(
                "INSERT INTO ppo.scheduling_policy_impact_activities",
              )
            )
              return target.query("SELECT 1");
            return target.query(text, v);
          };
        },
      });
      await refused(db, () => publicationFixture(intercepted, f));
    }
  }));

test("failure at each persistence stage rolls back policy, head, identities, impacts, tasks and receipt", async () => {
  const names = await tables(),
    initial = await snapshot(names);
  for (const stage of [
    "policy",
    "member",
    "publication",
    "head",
    "impact",
    "task",
    "receipt",
  ]) {
    await assert.rejects(
      transaction(async (db) =>
        publicationFixture(db, await persistenceFixture(db), stage),
      ),
      new RegExp(`Injected after ${stage}`),
    );
    assert.deepEqual(await snapshot(names), initial);
  }
});

test("restricted hosted runtime can insert evidence but cannot mutate it or acquire identity/grant authority", async () => {
  await migrateDemo();
  const role = "ppo_synthetic_test_policy_runtime";
  await database().query(`CREATE ROLE ${role}`);
  try {
    await transaction((db) =>
      grantRuntimePrivileges(db, "ppo_synthetic_test", role),
    );
    await proof(async (db) => {
      await db.query(`SET LOCAL ROLE ${role}`);
      const f = await persistenceFixture(db);
      await publicationFixture(db, f);
      await refused(
        db,
        () =>
          db.query("UPDATE ppo.scheduling_policy_reviews SET version=version"),
        ["55000"],
      );
      await refused(
        db,
        () => db.query("UPDATE ppo.permission_grants SET valid_to=NULL"),
        ["42501"],
      );
      await refused(db, () => db.query("UPDATE ppo.users SET active=true"), [
        "42501",
      ]);
    });
  } finally {
    await database().query(`DROP OWNED BY ${role}`);
    await database().query(`DROP ROLE ${role}`);
  }
});

test("direct reseed and runner retries preserve an advanced head, later evidence, old pins and revoked grants", async () => {
  const oldNames = (await tables()).filter(
    (t) =>
      !t.startsWith("scheduling_policy_") &&
      ![
        "business_identities",
        "activities",
        "activity_links",
        "operation_receipts",
        "reference_counters",
        "scheduling_policies",
      ].includes(t),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.manage'",
    [proposer],
  );
  const f = await transaction((db) => persistenceFixture(db));
  const old = await snapshot(oldNames);
  await transaction(async (db) => {
    await publicationFixture(db, f);
  });
  assert.deepEqual(await snapshot(oldNames), old);
  const full = await snapshot(await tables());
  await transaction(async (db) => {
    await db.query(await sql("seed-scheduling-policy-publication.sql"));
    await db.query(await sql("seed-scheduling-policy-publication.sql"));
  });
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(await tables()), full);
  await transaction(async (db) =>
    assert.equal((await loadPolicyChain(db, workspace)).head.version, 2),
  );
});

test("fresh installation applies only registered files through 0054, retains reserved gaps and repeats without changes", async () => {
  await database().query(await sql("migrations/0001-recover.sql"));
  await database().query(
    "DROP TABLE IF EXISTS public.ppo_migrations,public.ppo_demo_migrations",
  );
  await migrate();
  await seed();
  assert.deepEqual(
    (
      await database().query(
        "SELECT version FROM public.ppo_migrations ORDER BY version",
      )
    ).rows.map((r) => r.version),
    [
      ...Array.from({ length: 50 }, (_, i) => i + 1).filter((n) => n !== 16),
      53, 54,
    ],
  );
  const first = await snapshot(await tables());
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(await tables()), first);
  await transaction(async (db) =>
    assert.equal((await loadPolicyChain(db, workspace)).head.version, 1),
  );
});
