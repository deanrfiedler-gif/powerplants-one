import { AsyncLocalStorage } from "node:async_hooks";
import type { PoolClient } from "pg";
import type { OperationReceipt } from "./operations";

// Request-local extension: both hooks execute under the existing operation/workspace locks.
// No hook can replace domain authorisation or supply an accepted business result.
export const syncContext = new AsyncLocalStorage<{
  operation_id: string;
  validate: (client: PoolClient) => Promise<void>;
  accepted: (client: PoolClient, receipt: OperationReceipt) => Promise<void>;
}>();
