import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { readOperation } from "../../src/shared/receipts";
import { crmCreate } from "../helpers/crm";
import {
  commercialFixture,
  approvedBasis,
} from "../helpers/project-commercial";
import { estimateInput } from "../helpers/estimating";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
for (const through of [25, 102])
  test(`PJ06-UPGRADE populated ${through} upgrade retains original identities, financial source and operation ledgers`, async () => {
    await rows(await readFile("db/migrations/0001-recover.sql", "utf8"));
    await rows("DROP TABLE IF EXISTS public.ppo_migrations");
    await migrate(through);
    await seed(through);
    const p = (await createSession("coordinator")).principal,
      o = crmCreate();
    await createOpportunity(p, o);
    const estimate = estimateInput(o.id),
      saved = await createEstimate(p, estimate);
    if (through === 102) await approvedBasis(await commercialFixture());
    const tables = [
      ...(through === 102
        ? [
            "project_commercial_entries",
            "project_commercial_sources",
            "project_commercial_events",
            "library_revisions",
            "library_reviews",
            "draft_quotes",
            "draft_quote_revisions",
            "quote_release_events",
            "quote_response_events",
            "sales_delivery_bindings",
            "cpq_releases",
          ]
        : []),
      "estimates",
      "estimate_versions",
      "business_identities",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
      "permission_grants",
      "users",
      "seed_receipts",
    ];
    const snapshots = await Promise.all(
      tables.map((t) =>
        rows(
          // Later seeds 107 (readiness), 108 (Conversations) and 110 (agent ask) are proved in readiness-gate.test.ts, conversations-upgrade.test.ts and assistant-upgrade.test.ts.
          `SELECT to_jsonb(x) row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110,120, 121)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
        ),
      ),
    );
    const ledger = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
    await migrate(); // Includes 0026 deferred identity events when starting from 0025.
    const upgraded = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
    assert.deepEqual(
      upgraded.filter((x) => x.version <= through),
      ledger,
    );
    assert.deepEqual(
      upgraded.filter((x) => x.version > through).map((x) => x.version),
      through === 102 ? [103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122] : [...Array.from({ length: 85 }, (_, i) => i + 26), 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122],
    );
    for (const [i, t] of tables.entries()) {
      const actual = await rows(
        `SELECT to_jsonb(x) row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110,120, 121)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
      );
      // Earlier 0026 and 0095 legitimately extend estimates; preserve every original field.
      for (const original of snapshots[i]) {
        const key = original.row.id,
          record = actual.find((x) =>
            key
              ? x.row.id === key
              : JSON.stringify(x) === JSON.stringify(original),
          );
        assert.ok(record, `preserved ${t} row`);
        for (const [field, value] of Object.entries(original.row))
          assert.deepEqual(record.row[field], value, `${t}.${field}`);
      }
      if (through === 102) assert.deepEqual(actual, snapshots[i], t);
    }
    assert.deepEqual(
      await readOperation(p, estimate.operation_id),
      saved.receipt,
    );
    for (const t of [
      "project_specialist_packages",
      "project_specialist_events",
    ])
      assert.deepEqual(await rows(`SELECT * FROM ppo.${t}`), []);
    assert.equal(
      (
        await rows(
          "SELECT * FROM ppo.permission_grants WHERE capability LIKE 'project.specialist.%'",
        )
      ).length,
      0,
    );
    await seed();
    const after = await Promise.all(
      tables.map((t) =>
        rows(
          `SELECT to_jsonb(x) row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110,120, 121)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
        ),
      ),
    );
    await migrate();
    await seed();
    assert.deepEqual(
      await Promise.all(
        tables.map((t) =>
          rows(
            `SELECT to_jsonb(x) row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110,120, 121)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
          ),
        ),
      ),
      after,
    );
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      upgraded,
    );
  });
