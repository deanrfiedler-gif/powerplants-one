import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { database, transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { type Principal } from "../platform/identity";
import { hasPermission } from "../platform/permissions";
import {
  lockOperation,
  priorReceipt,
  recordOperation,
} from "../platform/operations";
import { invalid, label, object, uuid } from "../platform/validation";

export type DraftCommand = {
  operation_id: string;
  expected_version: number;
  schema_version: 1;
  summary: string;
  reason: string;
};
export type TicketView = {
  id: string;
  display_number: string;
  summary: string;
  status: string;
  version: number;
  synthetic: true;
  updated_at: string;
  can_edit: boolean;
};
export type Receipt = {
  operation_id: string;
  record_id: string;
  record_version: number;
  state: "New";
  accepted_at: string;
  receipt_id: string;
  warnings: string[];
  task_ids: string[];
};
export function draftCommand(input: unknown): DraftCommand {
  const p = object(input, [
    "operation_id",
    "expected_version",
    "schema_version",
    "summary",
    "reason",
  ]);
  if (p.schema_version !== 1)
    invalid("schema_version", "Only schema version 1 is supported.");
  if (
    !Number.isSafeInteger(p.expected_version) ||
    Number(p.expected_version) < 1
  )
    invalid("expected_version", "A positive record version is required.");
  return {
    operation_id: uuid(p.operation_id, "operation_id"),
    expected_version: Number(p.expected_version),
    schema_version: 1,
    summary: label(p.summary, "summary", 200),
    reason: label(p.reason, "reason", 1000),
  };
}
async function visibleTicket(
  client: Pick<PoolClient, "query">,
  p: Principal,
  id: string,
  lock = false,
) {
  if (!(await hasPermission(client, p, "service.ticket.read")))
    throw new AppError(
      403,
      "Forbidden",
      "This identity cannot read service requests.",
    );
  const result = await client.query(
    `SELECT t.* FROM ppo.tickets t WHERE t.workspace_id=$1 AND t.id=$2
    AND EXISTS(SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=t.workspace_id AND g.user_id=$3
      AND g.company_id=t.company_id AND g.capability='service.ticket.read' AND g.valid_from<=clock_timestamp()
      AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())) ${lock ? "FOR UPDATE OF t" : ""}`,
    [p.workspace_id, id, p.actor_id],
  );
  if (!result.rows[0]) throw unavailable();
  return result.rows[0];
}
export async function readTicket(
  p: Principal,
  raw_id: string,
): Promise<TicketView> {
  const t = await visibleTicket(database(), p, uuid(raw_id, "record_id"));
  return {
    id: t.id,
    display_number: t.display_number,
    summary: t.summary,
    status: t.status,
    version: t.version,
    synthetic: true,
    updated_at: t.updated_at.toISOString(),
    can_edit:
      t.status === "New" &&
      (await hasPermission(database(), p, "service.ticket.edit", t.company_id)),
  };
}
export async function saveDraft(
  p: Principal,
  raw_id: string,
  input: unknown,
): Promise<Receipt> {
  const id = uuid(raw_id, "record_id"),
    command = draftCommand(input);
  // Fixed-key canonical form includes command, target and complete normalised business payload.
  const hash = createHash("sha256")
    .update(
      JSON.stringify({ command: "SaveTicketDraft", record_id: id, ...command }),
    )
    .digest("hex");
  return transaction(async (client) => {
    // Serialise concurrent same-operation retries before reading the receipt. Collisions only reduce concurrency.
    await lockOperation(client, p, command.operation_id);
    const t = await visibleTicket(client, p, id, true);
    if (!(await hasPermission(client, p, "service.ticket.edit", t.company_id)))
      throw new AppError(
        403,
        "Forbidden",
        "This identity cannot edit service requests.",
      );
    const prior = await priorReceipt(client, p, command.operation_id, hash);
    if (prior) return prior as Receipt;
    if (t.version !== command.expected_version)
      throw new AppError(
        409,
        "VersionConflict",
        "This request has changed. Keep your proposed text and reload the current version.",
      );
    if (t.status !== "New")
      throw new AppError(
        422,
        "InvalidState",
        "Only a new, untriaged request can be edited in P01.",
      );
    const updated = await client.query(
      `UPDATE ppo.tickets SET summary=$1,version=version+1,updated_at=clock_timestamp(),updated_by=$2
      WHERE workspace_id=$3 AND id=$4 RETURNING version,updated_at`,
      [command.summary, p.actor_id, p.workspace_id, id],
    );
    const row = updated.rows[0];
    return (await recordOperation(
      client,
      p,
      command,
      { id, version: row.version, state: "New", updated_at: row.updated_at },
      "Ticket",
      "TicketDraftSaved",
      hash,
      {
        previous_version: t.version,
        record_version: row.version,
        before_summary: t.summary,
        after_summary: command.summary,
      },
    )) as Receipt;
  });
}
