import pg, { type PoolClient } from "pg";
import { localConfig } from "./config";
import { proofReadPhase } from "./proof-diagnostics";
let pool: pg.Pool | undefined;
export function proofDatabaseState() {
  return { pool_total: pool?.totalCount ?? 0, pool_idle: pool?.idleCount ?? 0, pool_waiting: pool?.waitingCount ?? 0 };
}
export function database() {
  const config = localConfig();
  if (pool) return pool;
  pool = new pg.Pool({
    connectionString: config.database_url,
    max: 8,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    statement_timeout: 10000,
    application_name: "PPO-P01",
  });
  pool.on("error", () => {
    // An idle connection may end during a database restart. The pool removes it;
    // subsequent requests reconnect. Never log connection strings or SQL payloads.
    console.warn(
      "PPO database connection ended; the next request will reconnect.",
    );
  });
  return pool;
}
export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  proofReadPhase("database-acquire-start", proofDatabaseState());
  const client = await database().connect();
  proofReadPhase("database-acquired", proofDatabaseState());
  try {
    await client.query("BEGIN");
    proofReadPhase("database-work-start");
    const result = await work(client);
    proofReadPhase("database-commit-start");
    await client.query("COMMIT");
    proofReadPhase("database-committed");
    return result;
  } catch (error) {
    proofReadPhase("database-rollback-start");
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    proofReadPhase("database-released", proofDatabaseState());
  }
}
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
