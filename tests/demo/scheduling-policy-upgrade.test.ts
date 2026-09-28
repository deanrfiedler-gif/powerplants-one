import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { canonical } from "../../src/platform/operations";
import { loadPolicyChain } from "../../src/scheduling/policy-persistence";
import { digest } from "../../src/scheduling/policy-values";
import { migrate, seed } from "../../scripts/database";
import {
  migrateDemo,
  demoWorkspace,
  grantRuntimePrivileges,
} from "../../scripts/demo-database";
import { upgradeExistingDemo } from "../../scripts/demo-upgrade";

const name = localConfig().database_name;
if (name !== "ppo_synthetic_test")
  throw Error("Disposable local test database required.");
const role = `${name}_app`,
  tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const read = (file: string) =>
  readFile(new URL(`../../db/${file}`, import.meta.url), "utf8");
const tables = [
  "public.ppo_migrations",
  "public.ppo_demo_migrations",
  "ppo.seed_receipts",
  "ppo.scheduling_policies",
  "ppo.appointments",
  "ppo.operation_receipts",
  "ppo.audit_events",
  "ppo.outbox_jobs",
  "ppo.pack_revisions",
  "ppo.permission_grants",
];
const snapshot = async (names = tables) =>
  Promise.all(
    names.map(
      async (table) =>
        (
          await database().query(
            `SELECT row_to_json(t) AS row FROM ${table} t ORDER BY row_to_json(t)::text`,
          )
        ).rows,
    ),
  );

// Build the retained 0050 state from ordinary inserts, with the original P05
// policy expiry (before 3cb76a4 shifted fresh fixtures). Never disable a guard or
// update a Published policy to manufacture this historical upgrade fixture.
async function baseline(expiry = "2027-01-01T00:00:00Z") {
  const db = database();
  await db.query(await read("migrations/0001-recover.sql"));
  await db.query(
    "DROP TABLE IF EXISTS public.ppo_migrations,public.ppo_demo_migrations",
  );
  await migrate(17);
  await seed(4);
  const sql = await read("seed-p05.sql");
  const line = sql
    .split(/\r?\n/)
    .find((line) => line.startsWith("INSERT INTO ppo.scheduling_policies("))!;
  assert.ok(line.includes("'2032-01-02T00:00:00Z'"));
  await transaction(async (c) => {
    await c.query(
      sql.replace(line, line.replace("'2032-01-02T00:00:00Z'", `'${expiry}'`)),
    );
    await c.query("INSERT INTO ppo.seed_receipts(version) VALUES(5)");
  });
  await seed(17);
  await migrateDemo();
  await migrate(50);
  await seed(50);
  if (
    !(await db.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role]))
      .rowCount
  )
    await db.query(`CREATE ROLE ${role}`);
  await transaction((c) => grantRuntimePrivileges(c, name, role));
}

after(async () => {
  if (
    (await database().query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role]))
      .rowCount
  ) {
    await database().query(`DROP OWNED BY ${role}`);
    await database().query(`DROP ROLE ${role}`);
  }
  // Leave the next demo/browser suite on its ordinary current fixture.
  await database().query(await read("migrations/0001-recover.sql"));
  await database().query(
    "DROP TABLE IF EXISTS public.ppo_migrations,public.ppo_demo_migrations",
  );
  await migrate();
  await seed();
  await migrateDemo();
  await closeDatabase();
});

test("retained 2027 root reproduces run 78 at seed 53 and rolls the entire upgrade back", async () => {
  await baseline();
  const before = await snapshot();
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        await read("migrations/0053-scheduling-policy-publication.sql"),
      );
      await c.query(
        await read("migrations/0054-scheduling-policy-commands.sql"),
      );
      await c.query(await read("seed-scheduling-policy-publication.sql"));
    }),
    { code: "23514", message: "Exact policy content required" },
  );
  assert.deepEqual(await snapshot(), before);
  assert.equal(
    (
      await database().query(
        "SELECT to_regclass('ppo.scheduling_policy_families') AS table",
      )
    ).rows[0].table,
    null,
  );
});

test("hosted upgrade binds the retained root exactly, preserves originals, and retries without changes", async () => {
  await baseline();
  const before = await snapshot();
  await upgradeExistingDemo(name, tenant, true);
  const after = await snapshot();
  for (let index = 0; index < tables.length; index++)
    for (const row of before[index])
      assert.ok(
        after[index].some(
          (candidate) => canonical(candidate) === canonical(row),
        ),
        tables[index],
      );
  for (const table of [
    "ppo.scheduling_policies",
    "ppo.appointments",
    "ppo.operation_receipts",
    "ppo.audit_events",
    "ppo.outbox_jobs",
    "ppo.pack_revisions",
  ])
    assert.deepEqual(
      after[tables.indexOf(table)],
      before[tables.indexOf(table)],
      table,
    );
  const chain = await transaction((c) => loadPolicyChain(c, demoWorkspace));
  assert.equal(chain.members.length, 1);
  assert.equal(
    chain.members[0].policy.effective_to,
    "2027-01-01T00:00:00.000Z",
  );
  assert.equal(chain.seed_root.content_hash, digest(chain.members[0].policy));
  assert.equal(chain.members[0].review_binding, null);
  assert.equal(chain.members[0].predecessor, null);
  const newTables = [
    "ppo.scheduling_policy_families",
    "ppo.scheduling_policy_members",
    "ppo.scheduling_policy_heads",
    "ppo.scheduling_policy_proposals",
    "ppo.scheduling_policy_reviews",
    "ppo.scheduling_policy_publications",
  ];
  const saved = await snapshot([...tables, ...newTables]);
  await upgradeExistingDemo(name, tenant, false);
  await upgradeExistingDemo(name, tenant, true);
  assert.deepEqual(await snapshot([...tables, ...newTables]), saved);
});

test("unrecognised retained root refuses the whole hosted upgrade", async () => {
  await baseline("2028-01-01T00:00:00Z");
  const before = await snapshot();
  await assert.rejects(
    upgradeExistingDemo(name, tenant, true),
    /Unrecognised scheduling seed root/,
  );
  assert.deepEqual(await snapshot(), before);
  assert.equal(
    (
      await database().query(
        "SELECT to_regclass('ppo.scheduling_policy_families') AS table",
      )
    ).rows[0].table,
    null,
  );
});

test("late hosted failure rolls retained-root bootstrap back before an exact successful retry", async () => {
  await baseline();
  const before = await snapshot();
  await database().query(`ALTER ROLE ${role} SUPERUSER`);
  try {
    await assert.rejects(
      upgradeExistingDemo(name, tenant, true),
      /unexpected identity privileges/,
    );
    assert.deepEqual(await snapshot(), before);
    assert.equal(
      (
        await database().query(
          "SELECT to_regclass('ppo.scheduling_policy_members') AS table",
        )
      ).rows[0].table,
      null,
    );
  } finally {
    await database().query(`ALTER ROLE ${role} NOSUPERUSER`);
  }
  await upgradeExistingDemo(name, tenant, true);
  assert.equal(
    (await transaction((c) => loadPolicyChain(c, demoWorkspace))).members[0]
      .policy.effective_to,
    "2027-01-01T00:00:00.000Z",
  );
});
