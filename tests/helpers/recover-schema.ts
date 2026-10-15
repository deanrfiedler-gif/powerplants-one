import { readFile } from "node:fs/promises";
import type { PoolClient } from "pg";
import { transaction } from "../../src/platform/database";

// Dispose the synthetic schema the way scripts/database.ts reset() does. The pool's
// 10 s statement_timeout bounds application reads; dropping every ppo object is setup
// and can exceed it on a loaded runner (PR #514's database-2 shard failed with 57014
// here on 15 Oct 2026, before any migration ran). The advisory lock is the one
// migrate() and seed() take. Pass a client only from inside an open transaction: the
// timeout and lock then last until that transaction ends.
export async function recoverSchema(client?: PoolClient): Promise<void> {
  if (!client) return transaction((c) => recoverSchema(c));
  await client.query("SET LOCAL statement_timeout = '120s'");
  await client.query("SELECT pg_advisory_xact_lock(10001)");
  await client.query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
}
