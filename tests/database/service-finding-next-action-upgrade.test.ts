import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { migrationFiles } from "../../scripts/migration-registry";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { confirmed, principal, base } from "../helpers/packs";
import { readActivity, activityCommand } from "../../src/activities/activities";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
after(closeDatabase);
for (const through of [109, 113])
test(`0111 preserves populated ${through} sources, Activities, grants and exact migration/seed ledgers`, async () => {
  const c = database();
  await c.query(
    "DROP SCHEMA IF EXISTS ppo CASCADE; DROP SCHEMA IF EXISTS ppo_proof CASCADE; DROP TABLE IF EXISTS public.ppo_migrations",
  );
  // Reproduce main before the reserved 0111 migration lands, including the
  // newer 0113 history. Installing a lower reserved version must retain it.
  const index = migrationFiles.indexOf("0111-service-finding-next-actions.sql");
  const [migration] = (migrationFiles as unknown as string[]).splice(index, 1);
  try {
    await migrate(through);
    await seed(through);
  } finally {
    (migrationFiles as unknown as string[]).splice(index, 0, migration);
  }
  await confirmed();
  const tables = [
    "activities",
    "activity_links",
    "appointments",
    "schedule_follow_ups",
    "inspection_defects",
    "incident_actions",
    "report_revisions",
    "customer_responses",
    "permission_grants",
    "users",
    "seed_receipts",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        c
          .query(
            `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
          )
          .then((r) => r.rows),
      ),
    );
  const ledger = (
    await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
  ).rows;
  const versions = new Set(ledger.map((row) => row.version));
  const p = await principal(),
    id = (
      await c.query("SELECT activity_id FROM ppo.schedule_follow_ups LIMIT 1")
    ).rows[0].activity_id;
  const initial = await readActivity(p, id);
  const command = {
    ...base(),
    expected_version: initial.version,
    owner_id: initial.owner_id,
    summary: "SYN historical update",
    due_at: "2031-11-10T00:00:00Z",
    due_needed: false,
  };
  const accepted = await activityCommand(p, id, command, "update");
  const activity = await readActivity(p, id),
    before = await snapshot();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  // Unadopted native follow-ups retain the coordinator's existing editor.
  assert.deepEqual(await readActivity(p, id), activity);
  assert.deepEqual(await activityCommand(p, id, command, "update"), {
    ...accepted,
    replayed: true,
  });
  assert.deepEqual(
    (
      await c.query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows.filter((row) => versions.has(row.version)),
    ledger,
  );
  assert.deepEqual(
    (
      await c.query(
        "SELECT version FROM public.ppo_migrations ORDER BY version",
      )
    ).rows.filter((row) => !versions.has(row.version)),
    through === 109 ? [{ version: 111 }, { version: 113 }] : [{ version: 111 }],
  );
  assert.equal(
    (
      await c.query(
        "SELECT count(*)::int n FROM ppo.service_finding_activity_bindings",
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await c.query(
        "SELECT count(*)::int n FROM ppo.service_finding_action_details",
      )
    ).rows[0].n,
    0,
  );
  const afterLedger = (
    await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
  ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version"))
      .rows,
    afterLedger,
  );
});
