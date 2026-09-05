import pg, { type PoolClient } from "pg";
import { localConfig } from "./config";
let pool: pg.Pool | undefined;
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
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
