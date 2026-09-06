import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "./identity";
import { transaction } from "./database";
import { AppError } from "./errors";
import { syncContext } from "./sync-context";
export type OperationReceipt = {
  operation_id: string;
  record_id: string;
  record_version: number;
  state: string;
  accepted_at: string;
  receipt_id: string;
  warnings: string[];
  task_ids: string[];
};
export async function lockOperation(
  client: PoolClient,
  p: Principal,
  operation_id: string,
) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    `${p.workspace_id}:${p.actor_id}:${operation_id}`,
  ]);
}
export async function priorReceipt(
  client: PoolClient,
  p: Principal,
  operation_id: string,
  hash: string,
) {
  const prior = await client.query(
    "SELECT payload_hash,result FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
    [p.workspace_id, p.actor_id, operation_id],
  );
  if (!prior.rows[0]) return null;
  if (prior.rows[0].payload_hash !== hash)
    throw new AppError(
      409,
      "OperationConflict",
      "This operation ID was already used for different content.",
    );
  return prior.rows[0].result as OperationReceipt;
}
export async function recordOperation(
  client: PoolClient,
  p: Principal,
  input: { operation_id: string; reason: string },
  result: { id: string; version: number; state: string; updated_at: Date },
  object_type: string,
  kind: string,
  hash: string,
  details: unknown,
) {
  const event_id = randomUUID();
  const receipt: OperationReceipt = {
    operation_id: input.operation_id,
    record_id: result.id,
    record_version: result.version,
    state: result.state,
    accepted_at: result.updated_at.toISOString(),
    receipt_id: randomUUID(),
    warnings: [],
    task_ids: [event_id],
  };
  await client.query(
    `INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,operation_id,outcome,reason,details) VALUES($1,$2,$3,$4,$5,$6,'Accepted',$7,$8)`,
    [
      randomUUID(),
      p.workspace_id,
      p.actor_id,
      object_type,
      result.id,
      input.operation_id,
      input.reason,
      details,
    ],
  );
  await client.query(
    `INSERT INTO ppo.operation_receipts(id,workspace_id,actor_id,operation_id,record_id,payload_hash,result) VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [
      receipt.receipt_id,
      p.workspace_id,
      p.actor_id,
      input.operation_id,
      result.id,
      hash,
      receipt,
    ],
  );
  await client.query(
    `INSERT INTO ppo.outbox_jobs(id,workspace_id,actor_id,operation_id,correlation_id,kind,payload_version,payload) VALUES($1,$2,$3,$4,$4,$5,1,$6)`,
    [
      event_id,
      p.workspace_id,
      p.actor_id,
      input.operation_id,
      kind,
      {
        record_id: result.id,
        record_version: result.version,
        ...(object_type === "Ticket" ? {} : { object_type }),
        ...(object_type === "ScheduleChangeRequest" &&
        kind === "AppointmentChanged"
          ? {
              appointment_id: (details as { appointment_id: string })
                .appointment_id,
              appointment_version: (details as { appointment_version: number })
                .appointment_version,
            }
          : {}),
        synthetic: true,
      },
    ],
  );
  return receipt;
}
// Recursively sort keys: field order must not turn an identical operation into a conflict.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function sharedOperation<T>(
  p: Principal,
  input: { operation_id: string; reason: string },
  name: string,
  authorise: (client: PoolClient) => Promise<T>,
  mutate: (
    client: PoolClient,
    context: T,
  ) => Promise<{
    id: string;
    version: number;
    state: string;
    updated_at: Date;
    audit_details?: Record<string, unknown>;
  }>,
  object_type: string,
  kind: string,
) {
  const hash = createHash("sha256")
    .update(canonical({ command: name, ...input }))
    .digest("hex");
  try {
    return await transaction(async (client) => {
      await lockOperation(client, p, input.operation_id);
      // A small prototype serialises graph mutations within one workspace. No cross-workspace bottleneck.
      await client.query(
        "SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",
        [p.workspace_id],
      );
      const context = await authorise(client); // Current scope/permission ALWAYS precedes receipt access.
      const sync = syncContext.getStore();
      if (sync && sync.operation_id !== input.operation_id)
        throw new AppError(409, "OperationConflict", "The original operation identity must be retained.");
      await sync?.validate(client);
      const prior = await priorReceipt(client, p, input.operation_id, hash);
      if (prior) {
        await sync?.accepted(client, prior);
        return { receipt: prior, replayed: true };
      }
      const result = await mutate(client, context);
      const receipt = await recordOperation(
        client,
        p,
        input,
        result,
        object_type,
        kind,
        hash,
        {
          command: name,
          record_version: result.version,
          ...result.audit_details,
        },
      );
      await sync?.accepted(client, receipt);
      return { receipt, replayed: false };
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505" || code === "23P01")
      throw new AppError(
        409,
        "RelationshipConflict",
        "This identity or effective relationship conflicts with an existing record.",
      );
    if (
      code === "23503" ||
      code === "23514" ||
      code === "22007" ||
      code === "22008" ||
      code === "55000"
    )
      throw new AppError(
        422,
        "InvalidRelationship",
        "Check the record relationships, effective dates and permitted hierarchy.",
      );
    throw error;
  }
}
