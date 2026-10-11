import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import { crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { productActor, productInput } from "../helpers/products";
import { createProduct } from "../../src/products/commands";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
for (const through of [25, 48])
  test(`PD upgrade from ${through} retains estimate/quote/receipts; pending identity events across 0026 are resolved`, async () => {
    await database().query(
      await readFile(
        new URL("../../db/migrations/0001-recover.sql", import.meta.url),
        "utf8",
      ),
    );
    await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
    await migrate(through);
    await seed(through);
    const p = (await createSession("coordinator")).principal,
      op = crmCreate();
    await createOpportunity(p, op);
    const input = estimateInput(op.id),
      created = await createEstimate(p, input),
      d = await readEstimate(p, input.id),
      quote = quoteCommand(d.saved);
    await prepareQuote(p, input.id, quote);
    const tables = [
      "estimates",
      "estimate_versions",
      "draft_quotes",
      "draft_quote_revisions",
      "operation_receipts",
    ];
    const before = await Promise.all(
      tables.map((t) =>
        database().query(
          `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY id`,
        ),
      ),
    );
    const grants = (
      await database().query("SELECT * FROM ppo.permission_grants ORDER BY id")
    ).rows;
    await migrate();
    await seed();
    await migrate();
    await seed();
    for (let i = 0; i < tables.length; i++)
      assert.deepEqual(
        (
          await database().query(
            `SELECT to_jsonb(r) value FROM ppo.${tables[i]} r ORDER BY id`,
          )
        ).rows,
        before[i].rows,
        tables[i],
      );
    assert.deepEqual(
      await readOperation(p, input.operation_id),
      created.receipt,
    );
    if (through === 48)
      assert.deepEqual(
        (
          await database().query(
            "SELECT * FROM ppo.permission_grants ORDER BY id",
          )
        ).rows,
        grants,
      );
    assert.equal(
      (
        await database().query(
          "SELECT count(*)::int n FROM ppo.permission_grants WHERE capability LIKE 'products.%'",
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await database().query(
          "SELECT max(version) n FROM public.ppo_migrations",
        )
      ).rows[0].n,
      49,
    );
    await createProduct((await productActor()).p, productInput());
  });
