import type { Pool, PoolClient } from "pg";
import { performance } from "node:perf_hooks";
import { unexpectedFailureCategory } from "./errors";
import { captureDatabaseProof, proofDiagnosticsEnabled, proofEvent } from "./proof-diagnostics";

type Event = NonNullable<ReturnType<typeof captureDatabaseProof>>;
type ConnectCallback = Parameters<Pool["connect"]>[0];
const key = Symbol.for("ppo.synthetic-proof-pools");
const shared = globalThis as typeof globalThis & {
  [key]?: { next: number; pools: WeakMap<Pool, number> };
};

/** Local opt-in observation. Keep pg's own query, queue, release and timeout logic. */
export function installDatabaseProof(pool: Pool) {
  if (!proofDiagnosticsEnabled()) return;
  const state = shared[key] ??= { next: 0, pools: new WeakMap() };
  if (state.pools.has(pool)) return;
  const poolId = ++state.next;
  state.pools.set(pool, poolId);
  const counts = () => ({ pool_id: poolId, total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount });
  proofEvent("database-pool-created", { ...counts(), max: pool.options.max });
  let acquisition = 0;
  const held = new WeakMap<PoolClient, { emit: Event; acquired: number; id: number }>();
  pool.on("connect", () => proofEvent("database-client-connected", counts()));
  pool.on("release", (error, client) => {
    const lease = held.get(client);
    if (!lease) return;
    held.delete(client);
    lease.emit("database-release", { ...counts(), acquisition_id: lease.id,
      held_ms: performance.now() - lease.acquired, error_category: error ? unexpectedFailureCategory(error) : null });
  });
  const connect = pool.connect.bind(pool);
  pool.connect = ((callback?: ConnectCallback) => {
    const emit = captureDatabaseProof();
    if (!emit) return callback ? connect(callback) : connect();
    const id = ++acquisition, began = performance.now(), loop = performance.eventLoopUtilization();
    emit("database-acquire-start", { ...counts(), acquisition_id: id });
    const finished = (error: unknown, client?: PoolClient) => {
      const now = performance.now(), delta = performance.eventLoopUtilization(loop);
      if (client) held.set(client, { emit, acquired: now, id });
      emit(error ? "database-acquire-failed" : "database-acquired", { ...counts(), acquisition_id: id,
        elapsed_ms: now - began, event_loop_active_ms: delta.active, event_loop_idle_ms: delta.idle,
        error_category: error ? unexpectedFailureCategory(error) : null });
    };
    if (callback) return connect((error, client, release) => {
      finished(error, client);
      callback(error, client, release);
    });
    return connect().then(client => { finished(undefined, client); return client; }, error => {
      finished(error); throw error;
    });
  }) as Pool["connect"];
}
