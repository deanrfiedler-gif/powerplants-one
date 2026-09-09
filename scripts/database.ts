import { seedDocumentFiles } from "../src/documents/fixtures";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { database, transaction, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
const read = (name: string) =>
  readFile(new URL(`../db/${name}`, import.meta.url), "utf8");
export async function migrate(through = 17) {
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(10001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS public.ppo_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT clock_timestamp())",
    );
    for (const file of [
      "0001-foundation.sql",
      "0002-shared-foundation.sql",
      "0003-customer-intake.sql",
      "0004-work-scope.sql",
      "0005-planner.sql",
      "0006-job-packs.sql",
      "0007-online-field.sql",
      "0008-offline-recovery.sql",
      "0009-service-reports.sql",
      "0010-crm-opportunities.sql",
      "0011-finance-handoff.sql",
      "0012-estimating-e1.sql",
      "0013-p11-travel.sql",
      "0014-p11-travel-guard-repair.sql",
      // 0015 and 0016 remain reserved by the Email/Calendar and Assistant branches.
      "0017-crm-ui-refinements.sql",
    ]) {
      const version = Number(file.slice(0, 4));
      if (version > through) break;
      const sql = await read(`migrations/${file}`),
        hash = createHash("sha256").update(sql).digest("hex");
      const prior = await client.query(
        "SELECT sha256 FROM public.ppo_migrations WHERE version=$1",
        [version],
      );
      if (prior.rows[0]) {
        if (prior.rows[0].sha256 !== hash)
          throw new Error(
            "Migration checksum mismatch. Preserve the database and investigate; do not edit an applied migration.",
          );
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)",
        [version, hash],
      );
    }
  });
}
export async function seed(through = 17) {
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(10001)");
    for (const [version, file] of [
      [2, "seed.sql"],
      [3, "seed-p03.sql"],
      [4, "seed-p04.sql"],
      [5, "seed-p05.sql"],
      [6, "seed-p06.sql"],
      [7, "seed-p07.sql"],
      [9, "seed-p09.sql"],
      [10, "seed-crm-i1.sql"],
      [11, "seed-p10.sql"],
      [12, "seed-estimating-e1.sql"],
      [13, "seed-p11.sql"],
      [14, "seed-p11-templates.sql"],
    ] as const) {
      if (version > through) break;
      const prior = await client.query(
        "SELECT 1 FROM ppo.seed_receipts WHERE version=$1",
        [version],
      );
      if (prior.rowCount) continue;
      await client.query(await read(file));
      if (version === 6) await seedDocumentFiles();
      if (version === 9) {
        const { currentReportTemplate } =
          await import("../src/reports/template");
        const definition = await currentReportTemplate();
        await client.query(
          "INSERT INTO ppo.report_templates(id,workspace_id,version,definition,content_hash) VALUES('e1000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,$1,$2)",
          [definition, createHash("sha256").update(definition).digest("hex")],
        );
        await client.query(
          "INSERT INTO ppo.report_template_policy(workspace_id,template_id) VALUES('10000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')",
        );
      }
      if (version === 11) {
        const { seedFinance } = await import("../src/finance/fixtures");
        await seedFinance(client);
      }
      if (version === 13) {
        const { seedP11Finance } = await import("../src/finance/p11-fixtures");
        await seedP11Finance(client);
      }
      if (version === 14) {
        const { seedP11Templates } =
          await import("../src/documents/p11-fixtures");
        await seedP11Templates(client);
      }
      await client.query("INSERT INTO ppo.seed_receipts(version) VALUES($1)", [
        version,
      ]);
    }
  });
}
export async function reset() {
  const config = localConfig();
  if (
    process.env.PPO_ALLOW_RESET !== "dispose-synthetic" ||
    process.env.PPO_RESET_DATABASE !== config.database_name
  )
    throw new Error(
      "Reset requires PPO_ALLOW_RESET=dispose-synthetic and PPO_RESET_DATABASE matching the named database. Stop the application first.",
    );
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(10001)");
    await client.query(await read("migrations/0001-recover.sql"));
    await client.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate();
  await seed();
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const command = process.argv[2];
    if (command === "migrate") await migrate();
    else if (command === "seed") await seed();
    else if (command === "reset") await reset();
    else if (command === "health") {
      const r = await database().query(
        "SELECT current_database() AS database,version() AS engine,(SELECT count(*)::int FROM public.ppo_migrations) AS migrations",
      );
      console.log(r.rows[0]);
    } else throw new Error("Use migrate, seed, health or reset.");
    console.log(`Database ${command}: completed`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Database command failed",
    );
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
