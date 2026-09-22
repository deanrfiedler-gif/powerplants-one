import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import {
  sharedOperation,
  type OperationReceipt,
} from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  object,
  common,
  commonKeys,
  uuid,
  choice,
} from "../../shared/validation";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../discovery-workspace-context";
import {
  bounded,
  requireAvailable,
  scopeRecord,
  savedRevision,
  acceptedAuthority,
} from "./context";
import { database } from "../../platform/database";
export const commands = [
  "CreateFertigationScope",
  "ImportFertigationScope",
  "SaveFertigationRevision",
  "CopyFertigationScope",
  "RestoreFertigationRevision",
  "RefreshFertigationSource",
  "ArchiveFertigationScope",
  "PrepareFertigationOutput",
  "AttachFertigationEvidence",
  "RecordFertigationReview",
  "PrepareFertigationHandover",
  "AcceptFertigationHandover",
] as const;

export async function createResolutionAuthority(
  c: QueryClient,
  p: Principal,
  workspaceId: string,
  operationId: string,
) {
  const g = await workspaceAuthority(c, p, workspaceId, true);
  const row = (
    await c.query<{
      details: {
        source_revision_id: string;
        scope_id: string;
        original_receipt?: OperationReceipt;
      };
    }>(
      "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND object_id=$4 AND details->>'command'='ResolveFertigationCreate'",
      [p.workspace_id, p.actor_id, operationId, workspaceId],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await revisionAuthority(c, p, g, row.details.source_revision_id, true);
  if (
    row.details.original_receipt &&
    !(await acceptedAuthority(
      c,
      p,
      row.details.scope_id,
      row.details.original_receipt.operation_id,
    ))
  )
    throw unavailable();
  return g;
}
export async function resolveOriginal(
  p: Principal,
  id: string,
  value: unknown,
) {
  bounded(value);
  const create = ["CreateFertigationScope", "ImportFertigationScope"].includes(
    (value as { command?: string })?.command ?? "",
  );
  const r = object(value, [
    ...commonKeys,
    "original_operation_id",
    "command",
    ...(create ? ["estimating_workspace_id", "revision_id"] : []),
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "scope_id"),
    original_operation_id: uuid(
      r.original_operation_id,
      "original_operation_id",
    ),
    command: choice(r.command, "command", commands),
    ...(create
      ? {
          estimating_workspace_id: uuid(
            r.estimating_workspace_id,
            "estimating_workspace_id",
          ),
          revision_id: uuid(r.revision_id, "revision_id"),
        }
      : {}),
  };
  if (input.operation_id === input.original_operation_id)
    throw new AppError(
      422,
      "OperationConflict",
      "Resolution needs its own operation identity.",
    );
  return sharedOperation(
    p,
    input,
    create ? "ResolveFertigationCreate" : "ResolveFertigationOperation",
    async (c) => {
      await requireAvailable(c);
      if (create) {
        const g = await workspaceAuthority(
          c,
          p,
          input.estimating_workspace_id!,
          true,
        );
        await revisionAuthority(c, p, g, input.revision_id!, true);
        return { g, scope: null };
      }
      const scope =
        (await acceptedAuthority(c, p, id, input.operation_id)) ??
        (await scopeRecord(c, p, id, true));
      await savedRevision(c, p, scope);
      return { g: null, scope };
    },
    async (c, { scope, g }) => {
      const accepted = (
        await c.query<{
          result: OperationReceipt;
          details: { command: string; copied_from_scope_id?: string };
        }>(
          "SELECT r.result,a.details FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3",
          [p.workspace_id, p.actor_id, input.original_operation_id],
        )
      ).rows[0];
      let outcome: "Accepted" | "Closed without acceptance" =
        "Closed without acceptance";
      if (accepted) {
        if (
          accepted.details.command !== input.command ||
          (accepted.result.record_id !== id &&
            !(
              input.command === "CopyFertigationScope" &&
              accepted.details.copied_from_scope_id === id
            ))
        )
          throw unavailable();
        if (
          !(await acceptedAuthority(
            c,
            p,
            accepted.result.record_id,
            input.original_operation_id,
          ))
        )
          throw unavailable();
        outcome = "Accepted";
      } else {
        const prior = (
          await c.query<{ scope_id: string; command: string }>(
            "SELECT scope_id,command FROM ppo.fertigation_operation_closures WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, input.original_operation_id],
          )
        ).rows[0];
        if (prior && (prior.scope_id !== id || prior.command !== input.command))
          throw unavailable();
        if (!prior)
          await c.query(
            "INSERT INTO ppo.fertigation_operation_closures(workspace_id,actor_id,operation_id,scope_id,resolution_operation_id,command) VALUES($1,$2,$3,$4,$5,$6)",
            [
              p.workspace_id,
              p.actor_id,
              input.original_operation_id,
              id,
              input.operation_id,
              input.command,
            ],
          );
      }
      const result = scope ?? g!;
      return {
        ...result,
        state: scope?.state ?? g!.state,
        updated_at: new Date(),
        audit_details: {
          scope_id: id,
          revision_id: scope?.current_revision_id ?? input.revision_id,
          source_revision_id: input.revision_id ?? null,
          original_operation_id: input.original_operation_id,
          original_receipt: accepted?.result ?? null,
          outcome,
        },
      };
    },
    create ? "EstimatingWorkspace" : "FertigationScope",
    "FertigationScopeSaved",
    [input.original_operation_id],
  );
}
export async function recoveryResult(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  object(query, ["operation_id"]);
  const c = database(),
    operationId = uuid(query.operation_id, "operation_id");
  const row = (
    await c.query<{
      object_id: string;
      details: {
        command: string;
        outcome: string;
        original_receipt: OperationReceipt | null;
      };
    }>(
      "SELECT object_id,details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND details->>'scope_id'=$4 AND details->>'command' IN ('ResolveFertigationCreate','ResolveFertigationOperation')",
      [p.workspace_id, p.actor_id, operationId, id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  if (row.details.command === "ResolveFertigationCreate")
    await createResolutionAuthority(c, p, row.object_id, operationId);
  else if (!(await acceptedAuthority(c, p, id, operationId)))
    throw unavailable();
  return {
    outcome: row.details.outcome,
    original_receipt: row.details.original_receipt,
  };
}
