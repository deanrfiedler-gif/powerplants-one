import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { database, transaction, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
const read = (name: string) =>
  readFile(new URL(`../db/${name}`, import.meta.url), "utf8");
export async function migrate() {
  const sql = await read("migrations/0001-foundation.sql"),
    hash = createHash("sha256").update(sql).digest("hex");
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(10001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS public.ppo_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT clock_timestamp())",
    );
    const prior = await client.query(
      "SELECT sha256 FROM public.ppo_migrations WHERE version=1",
    );
    if (prior.rows[0]) {
      if (prior.rows[0].sha256 !== hash)
        throw new Error(
          "Migration checksum mismatch. Preserve the database and investigate; do not edit an applied migration.",
        );
      return;
    }
    await client.query(sql);
    await client.query(
      "INSERT INTO public.ppo_migrations(version,sha256) VALUES(1,$1)",
      [hash],
    );
  });
}
export async function seed() {
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(10001)");
    await client.query(await read("seed.sql"));
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
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
