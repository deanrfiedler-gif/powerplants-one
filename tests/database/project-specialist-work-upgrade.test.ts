import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { handoverCommand } from "../../src/engineering/materials/commands";
import { readOperation } from "../../src/shared/receipts";
import {
  specialistHandoverFixture,
  handoverAction,
} from "../helpers/project-specialist-handover";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
test("PJ06-R3 populated 0105 upgrade preserves exact R1/R2 evidence, grants, sources, identities and receipts; repeat adds nothing", async () => {
  const c = database();
  await c.query(await readFile("db/migrations/0001-recover.sql", "utf8"));
  await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(105);
  await seed(105);
  const f = await specialistHandoverFixture();
  await handoverCommand(f.owner, f.engineering.id, f.prepare);
  await handoverCommand(
    f.owner,
    f.engineering.id,
    handoverAction({
      action: "send",
      handover_id: f.prepare.id,
      expected_version: 1,
    }),
  );
  const decision = handoverAction({
    action: "decide",
    handover_id: f.prepare.id,
    expected_version: 2,
    result: "Accepted",
  });
  const accepted = await handoverCommand(
    f.receiver,
    f.engineering.id,
    decision,
  );
  const tables = [
    "material_handovers",
    "material_events",
    "material_sources",
    "material_releases",
    "material_release_lines",
    "material_lines",
    "project_specialist_packages",
    "project_specialist_events",
    "project_commercial_events",
    "library_documents",
    "library_revisions",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "business_identities",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const snapshot = async () =>
    Promise.all(
      tables.map(
        async (t) =>
          (
            await c.query(
              // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
              `SELECT to_jsonb(x) row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
            )
          ).rows,
      ),
    );
  const before = await snapshot(),
    ledger = (
      await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (
      await c.query(
        "SELECT * FROM public.ppo_migrations WHERE version<=105 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.deepEqual(
    (
      await c.query(
        "SELECT version FROM public.ppo_migrations WHERE version>105 ORDER BY version",
      )
    ).rows,
    [{ version: 106 }, { version: 107 }, { version: 108 }, { version: 109 }, { version: 110 }, { version: 113 }],
  );
  assert.equal(
    (await c.query("SELECT count(*)::int n FROM ppo.project_specialist_work"))
      .rows[0].n,
    0,
  );
  assert.deepEqual(
    await readOperation(f.receiver, decision.operation_id),
    accepted.receipt,
  );
  const upgraded = (
    await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
  ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version"))
      .rows,
    upgraded,
  );
});
