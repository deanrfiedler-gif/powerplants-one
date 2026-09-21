import type { Principal } from "../../platform/identity";
import {
  sharedOperation,
  type OperationReceipt,
} from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  choice,
} from "../../shared/validation";
import { acceptedEstimateContext } from "../context";
import {
  configuration,
  draft,
  acceptedAuthority,
  requireAvailable,
} from "./context";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../discovery-workspace-context";
import type { QueryClient } from "../../platform/permissions";
import { bounded } from "./validation";
export const specialistCommands = [
  "CreateSpecialistConfiguration",
  "SaveSpecialistDraft",
  "SaveSpecialistRun",
  "SaveSpecialistResolvedSet",
  "ArchiveSpecialistConfiguration",
  "CreateSpecialistDraftFromRun",
  "CopySpecialistConfiguration",
  "RebaseSpecialistSource",
  "RecordSpecialistFindingReview",
  "ApplySpecialistConfiguration",
] as const;
export async function resolveOriginal(
  p: Principal,
  id: string,
  value: unknown,
) {
  bounded(value);
  if (
    (value as { command?: string })?.command === "CreateSpecialistConfiguration"
  )
    return resolveCreate(p, id, value);
  const r = object(value, [...commonKeys, "original_operation_id", "command"]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      original_operation_id: uuid(
        r.original_operation_id,
        "original_operation_id",
      ),
      command: choice(r.command, "command", specialistCommands),
    };
  if (input.operation_id === input.original_operation_id)
    throw new AppError(
      422,
      "OperationConflict",
      "Resolution has a separate operation identity.",
    );
  return sharedOperation(
    p,
    input,
    "ResolveSpecialistOperation",
    async (c) => {
      await requireAvailable(c);
      const cfg =
        (await acceptedAuthority(c, p, id, input.operation_id)) ??
        (await configuration(c, p, id, true));
      return cfg;
    },
    async (c, cfg) => {
      const accepted = (
        await c.query<{
          result: OperationReceipt;
          details: {
            command: string;
            configuration_id?: string;
            source_configuration_id?: string;
            draft_id?: string;
            source_draft_id?: string;
            run_id?: string;
            resolved_set_id?: string;
            saved_version_id?: string;
          };
        }>(
          `SELECT r.result,a.details FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3`,
          [p.workspace_id, p.actor_id, input.original_operation_id],
        )
      ).rows[0];
      if (accepted) {
        if (
          accepted.details.command !== input.command ||
          !(await acceptedAuthority(
            c,
            p,
            input.command === "CopySpecialistConfiguration" &&
              accepted.details.source_configuration_id === id
              ? accepted.result.record_id
              : id,
            input.original_operation_id,
          ))
        )
          throw unavailable();
        if (
          input.command === "ApplySpecialistConfiguration" &&
          !(await acceptedEstimateContext(
            c,
            p,
            accepted.result.record_id,
            input.original_operation_id,
          ))
        )
          throw unavailable();
        return {
          ...cfg,
          audit_details: {
            configuration_id: cfg.id,
            draft_id:
              input.command === "CopySpecialistConfiguration"
                ? accepted.details.source_draft_id
                : accepted.details.draft_id,
            ...(input.command === "ApplySpecialistConfiguration"
              ? { original_estimate_id: accepted.result.record_id }
              : {}),
            original_operation_id: input.original_operation_id,
            outcome: "Original accepted",
            original_receipt: accepted.result,
            original_configuration_id:
              input.command === "CopySpecialistConfiguration"
                ? accepted.result.record_id
                : id,
          },
        };
      }
      const closure = (
        await c.query(
          "SELECT configuration_id,command FROM ppo.specialist_operation_closures WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, input.original_operation_id],
        )
      ).rows[0];
      if (
        closure &&
        (closure.configuration_id !== cfg.id ||
          closure.command !== input.command)
      )
        throw unavailable();
      if (!closure)
        await c.query(
          "INSERT INTO ppo.specialist_operation_closures(workspace_id,actor_id,operation_id,configuration_id,resolution_operation_id,command) VALUES($1,$2,$3,$4,$5,$6)",
          [
            p.workspace_id,
            p.actor_id,
            input.original_operation_id,
            cfg.id,
            input.operation_id,
            input.command,
          ],
        );
      return {
        ...cfg,
        audit_details: {
          configuration_id: cfg.id,
          draft_id: cfg.current_draft_id,
          original_operation_id: input.original_operation_id,
          outcome: "Closed without acceptance",
        },
      };
    },
    "SpecialistConfiguration",
    "SpecialistConfigurationSaved",
    [input.original_operation_id],
  );
}

// A Create can have no aggregate yet. Resolve its original under the exact saved
// discovery authority and record the closure on the existing workspace identity.
export async function createResolutionAuthority(
  c: QueryClient,
  p: Principal,
  groupId: string,
  operationId: string,
) {
  const row = (
    await c.query<{
      details: {
        configuration_id: string;
        revision_id: string;
        original_operation_id: string;
        original_receipt?: OperationReceipt;
      };
    }>(
      "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND object_id=$4 AND details->>'command'='ResolveSpecialistCreate'",
      [p.workspace_id, p.actor_id, operationId, groupId],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const g = await workspaceAuthority(c, p, groupId, true);
  await revisionAuthority(c, p, g, row.details.revision_id, true);
  if (
    row.details.original_receipt &&
    !(await acceptedAuthority(
      c,
      p,
      row.details.configuration_id,
      row.details.original_operation_id,
    ))
  )
    throw unavailable();
  return g;
}
async function resolveCreate(p: Principal, id: string, value: unknown) {
  const r = object(value, [
      ...commonKeys,
      "original_operation_id",
      "command",
      "estimating_workspace_id",
      "revision_id",
    ]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      command: choice(r.command, "command", [
        "CreateSpecialistConfiguration",
      ] as const),
      original_operation_id: uuid(
        r.original_operation_id,
        "original_operation_id",
      ),
      estimating_workspace_id: uuid(
        r.estimating_workspace_id,
        "estimating_workspace_id",
      ),
      revision_id: uuid(r.revision_id, "revision_id"),
    };
  if (input.operation_id === input.original_operation_id)
    throw new AppError(
      422,
      "OperationConflict",
      "Resolution needs a separate operation identity.",
    );
  return sharedOperation(
    p,
    input,
    "ResolveSpecialistCreate",
    async (c) => {
      await requireAvailable(c);
      const g = await workspaceAuthority(
        c,
        p,
        input.estimating_workspace_id,
        true,
      );
      await revisionAuthority(c, p, g, input.revision_id, true);
      return g;
    },
    async (c, g) => {
      const original = (
        await c.query<{
          result: OperationReceipt;
          command: string;
          draft_id: string;
        }>(
          "SELECT r.result,a.details->>'command' AS command,a.details->>'draft_id' AS draft_id FROM ppo.operation_receipts r JOIN ppo.audit_events a USING(workspace_id,actor_id,operation_id) WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3",
          [p.workspace_id, p.actor_id, input.original_operation_id],
        )
      ).rows[0];
      if (original) {
        const cfg = await acceptedAuthority(
          c,
          p,
          id,
          input.original_operation_id,
        );
        if (
          !cfg ||
          original.command !== input.command ||
          cfg.estimating_workspace_id !== g.id
        )
          throw unavailable();
        const exact = await draft(c, p, cfg, original.draft_id, true);
        if (exact.d.binding.revision_id !== input.revision_id)
          throw unavailable();
      } else {
        const closure = (
          await c.query(
            "SELECT configuration_id,command FROM ppo.specialist_operation_closures WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, input.original_operation_id],
          )
        ).rows[0];
        if (
          closure &&
          (closure.configuration_id !== id || closure.command !== input.command)
        )
          throw unavailable();
        if (!closure)
          await c.query(
            "INSERT INTO ppo.specialist_operation_closures(workspace_id,actor_id,operation_id,configuration_id,resolution_operation_id,command) VALUES($1,$2,$3,$4,$5,$6)",
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
      return {
        ...g,
        audit_details: {
          configuration_id: id,
          revision_id: input.revision_id,
          original_operation_id: input.original_operation_id,
          outcome: original ? "Original accepted" : "Closed without acceptance",
          original_receipt: original?.result ?? null,
        },
      };
    },
    "EstimatingWorkspace",
    "SpecialistConfigurationSaved",
    [input.original_operation_id],
  );
}
