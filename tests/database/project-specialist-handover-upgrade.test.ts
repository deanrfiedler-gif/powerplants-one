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
test("PJ06-R2 upgrade from populated 0103 preserves every legacy payload, hash, grant, receipt and ledger exactly; repeat run adds nothing", async () => {
  const c = database();
  await c.query(await readFile("db/migrations/0001-recover.sql", "utf8"));
  await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(103);
  await seed(103);
  const f = await specialistHandoverFixture(),
    legacy: Record<string, unknown> = { ...f.prepare };
  delete legacy.specialist;
  const saved = await handoverCommand(f.owner, f.engineering.id, legacy);
  const send = handoverAction({
    action: "send",
    handover_id: legacy.id,
    expected_version: 1,
  });
  await handoverCommand(f.owner, f.engineering.id, send);
  const decide = handoverAction({
    action: "decide",
    handover_id: legacy.id,
    expected_version: 2,
    result: "Accepted",
  });
  const accepted = await handoverCommand(f.receiver, f.engineering.id, decide);
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
              `SELECT to_jsonb(x)${t === "material_handovers" ? "-'specialist_package_id'-'specialist_version'" : ""} row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
            )
          ).rows,
      ),
    );
  const original = await snapshot(),
    ledger = (
      await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    (
      await c.query(
        "SELECT * FROM public.ppo_migrations WHERE version<=103 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.deepEqual(
    (
      await c.query(
        "SELECT version FROM public.ppo_migrations WHERE version>103 ORDER BY version",
      )
    ).rows,
    [{ version: 104 }],
  );
  assert.deepEqual(
    (
      await c.query(
        "SELECT specialist_package_id,specialist_version,payload->>'schema_version' AS schema FROM ppo.material_handovers",
      )
    ).rows,
    [{ specialist_package_id: null, specialist_version: null, schema: "1" }],
  );
  assert.deepEqual(
    (await handoverCommand(f.owner, f.engineering.id, legacy)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    await readOperation(f.receiver, decide.operation_id),
    accepted.receipt,
  );
  const upgraded = (
    await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
  ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version"))
      .rows,
    upgraded,
  );
});
