import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { migrationFiles } from "../../scripts/migration-registry";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { readOperation } from "../../src/shared/receipts";
import { crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
const rows = async (sql: string) => (await database().query(sql)).rows;
for (const through of [25, 92])
  test(`XI04 populated ${through} upgrade preserves native estimates, authority and original ledgers; no Excel seed`, async () => {
    await recoverSchema();
    await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
    await migrate(through);
    await seed(through);
    const p = (await createSession("coordinator")).principal,
      op = crmCreate();
    await createOpportunity(p, op);
    const command = estimateInput(op.id),
      accepted = await createEstimate(p, command);
    const tables = [
      "estimates",
      "estimate_versions",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ];
    const snapshot = () =>
      Promise.all(
        tables.map((t) =>
          rows(
            `SELECT to_jsonb(r) AS value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
          ),
        ),
      );
    const original = await snapshot(),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      );
    const grants = await rows(
        "SELECT * FROM ppo.permission_grants ORDER BY id",
      ),
      users = await rows("SELECT * FROM ppo.users ORDER BY id");
    const seeds = await rows(
      "SELECT * FROM ppo.seed_receipts ORDER BY version",
    );
    await migrate(); // No seed is needed by this feature; isolate migration effects.
    assert.deepEqual(await snapshot(), original);
    const upgraded = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
    assert.deepEqual(
      upgraded.filter((r) => r.version <= through),
      ledger,
    );
    const expected =
      through === 92
        ? [93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 114]
        : migrationFiles
            .map((f) => Number(f.slice(0, 4)))
            .filter((v) => v > through);
    assert.deepEqual(
      upgraded.filter((r) => r.version > through).map((r) => r.version),
      expected,
    );
    for (const t of ["excel_imports", "excel_import_lines", "excel_reimports"])
      assert.deepEqual(await rows(`SELECT * FROM ppo.${t}`), []);
    assert.deepEqual(
      await rows("SELECT * FROM ppo.permission_grants WHERE capability NOT LIKE 'conversation.%' ORDER BY id"),
      grants,
    );
    assert.deepEqual(await rows("SELECT * FROM ppo.users ORDER BY id"), users);
    assert.deepEqual(
      await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
      seeds,
    );
    await migrate();
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      upgraded,
    );
    assert.deepEqual(
      await readOperation(p, command.operation_id),
      accepted.receipt,
    );
    assert.deepEqual(await snapshot(), original);
  });
