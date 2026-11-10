import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recoverSchema } from "../helpers/recover-schema";
import {
  projectFinanceFixture,
  saveClaim,
  approveClaim,
} from "../helpers/project-claim-finance";
import { agreement } from "../helpers/maintenance";
import { readFinance } from "../../src/finance/reads";
import { readOperation } from "../../src/shared/receipts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
test("C1 populated 0126 upgrade retains exact agreement bytes, ProjectClaim holds, receipts and grants", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(126);
  await seed(126);
  const oldAgreement = await agreement(),
    f = await projectFinanceFixture(),
    a = await saveClaim(f, [4]);
  await approveClaim(f, a.id);
  const tables = [
    "service_agreements",
    "agreement_revisions",
    "agreement_scope",
    "maintenance_events",
    "finance_handoffs",
    "finance_revisions",
    "finance_lines",
    "finance_allocation_holds",
    "finance_reviews",
    "audit_events",
    "operation_receipts",
    "permission_grants",
    "seed_receipts",
  ];
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (t) => [
          t,
          (
            await database().query(
              `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
            )
          ).rows.map((x) => x.row),
        ]),
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  await seed();
  const after = await snapshot();
  const additions: Record<string, Record<string, unknown>> = {
    finance_handoffs: { agreement_id: null },
    finance_lines: { agreement_revision_id: null, agreement_charge_id: null },
    finance_allocation_holds: {
      agreement_revision_id: null,
      agreement_charge_id: null,
    },
  };
  for (const t of tables) {
    const expected = before[t].map((r: Record<string, unknown>) => ({
      ...r,
      ...additions[t],
    }));
    assert.deepEqual(after[t], expected, t);
  }
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.agreement_charge_lines",
      )
    ).rows[0].n,
    "0",
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations WHERE version<=126 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT version FROM public.ppo_migrations WHERE version>126 ORDER BY version",
      )
    ).rows,
    [{ version: 127 }],
  );
  assert.equal(
    (await readFinance(f.preparer, a.id)).handoff.status,
    "Approved",
  );
  assert.deepEqual(
    await readOperation(f.preparer, a.cmd.operation_id),
    a.result.receipt,
  );
  assert.equal(
    "charge_schedule" in
      (
        await database().query(
          "SELECT content FROM ppo.agreement_revisions WHERE id=$1",
          [oldAgreement.revision],
        )
      ).rows[0].content,
    false,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), after);
});
