import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { hasPermission } from "../../platform/permissions";
import { transaction, database } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import type { OperationReceipt } from "../../platform/operations";
import { object, uuid, choice } from "../../shared/validation";
import {
  access,
  stageRow,
  loadDetail,
  sourcesFor,
  hash,
  fail,
} from "./context";
import { actionDuty } from "./ui-actions";
import { parseCommand, type Command } from "./validation";
export type Recovery = {
  operation_id: string;
  action: string;
  stage_id: string | null;
  registered_at: string;
  accepted: boolean;
};
async function authority(c: QueryClient, p: Principal, cmd: Command) {
  const a = await access(c, p, cmd.project_id, actionDuty[cmd.action]);
  if (
    (cmd.action === "commercial" ||
      (cmd.action === "source" && cmd.fields.kind === "Commercial")) &&
    !(await hasPermission(
      c,
      p,
      "finance.read",
      a.project.company_id,
      a.project.site_id,
    ))
  )
    throw unavailable();
  if (cmd.stage_id) {
    const s = await stageRow(c, p, cmd.stage_id);
    if (s.project_id !== a.project.id) throw unavailable();
    const d = await loadDetail(c, p, s, await sourcesFor(c, p, a.project));
    if (
      [
        "technical",
        "prepare",
        "issue",
        "validate",
        "receive",
        "commercial",
        "closeStage",
        "closeProject",
        "amendment",
      ].includes(cmd.action) &&
      d.requirements.some((r) => r.source.availability === "Restricted")
    )
      throw unavailable();
  }
}
export async function registerIntent(p: Principal, cmd: Command) {
  await transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await authority(c, p, cmd);
    const fingerprint = hash({ command: `Acceptance:${cmd.action}`, ...cmd }),
      prior = (
        await c.query(
          "SELECT payload_hash FROM ppo.acceptance_intents WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, cmd.operation_id],
        )
      ).rows[0];
    if (prior && prior.payload_hash !== fingerprint)
      fail(
        "The original operation has a different canonical payload.",
        "OperationConflict",
        409,
      );
    if (!prior)
      await c.query(
        "INSERT INTO ppo.acceptance_intents(workspace_id,actor_id,operation_id,project_id,action,payload_hash,payload) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          p.workspace_id,
          p.actor_id,
          cmd.operation_id,
          cmd.project_id,
          cmd.action,
          fingerprint,
          cmd,
        ],
      );
    else
      await c.query(
        "UPDATE ppo.acceptance_intents SET final_failure=NULL WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, cmd.operation_id],
      );
  });
}
export async function intentFailure(
  p: Principal,
  cmd: Command,
  error: unknown,
) {
  if (error instanceof AppError && error.status < 500)
    await database().query(
      "UPDATE ppo.acceptance_intents i SET final_failure=$4 WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE (r.workspace_id,r.actor_id,r.operation_id)=(i.workspace_id,i.actor_id,i.operation_id))",
      [p.workspace_id, p.actor_id, cmd.operation_id, error.code],
    );
}
export async function recoverIntent(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const row = (
      await c.query(
        "SELECT payload FROM ppo.acceptance_intents WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, uuid(id, "operation_id")],
      )
    ).rows[0];
    if (!row) throw unavailable();
    const cmd = parseCommand(row.payload);
    await authority(c, p, cmd);
    const receipt =
      (
        await c.query<{ result: OperationReceipt }>(
          "SELECT result FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, id],
        )
      ).rows[0]?.result ?? null;
    return { command: cmd, receipt };
  });
}
export async function acknowledgeIntent(
  p: Principal,
  id: string,
  input: unknown = { disposition: "Seen" },
) {
  const value = object(input, ["disposition"]),
    disposition = choice(value.disposition, "disposition", [
      "Seen",
      "Discard uncommitted",
    ] as const);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const row = (
      await c.query(
        "SELECT payload FROM ppo.acceptance_intents WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, uuid(id, "operation_id")],
      )
    ).rows[0];
    if (!row) throw unavailable();
    await authority(c, p, parseCommand(row.payload));
    const accepted = (
      await c.query(
        "SELECT result FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0];
    if (disposition === "Seen" && !accepted)
      fail(
        "The operation has no committed receipt. Review or retry its exact original first.",
      );
    if (disposition === "Discard uncommitted" && accepted)
      fail(
        "This operation committed. Inspect its original result before acknowledging it.",
      );
    await c.query(
      "UPDATE ppo.acceptance_intents SET acknowledged_at=coalesce(acknowledged_at,clock_timestamp()) WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
      [p.workspace_id, p.actor_id, id],
    );
    return { operation_id: id, acknowledged: true };
  });
}
export async function pendingIntents(
  c: QueryClient,
  p: Principal,
  project: string,
): Promise<Recovery[]> {
  const rows = (
    await c.query(
      "SELECT i.*,EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE (r.workspace_id,r.actor_id,r.operation_id)=(i.workspace_id,i.actor_id,i.operation_id)) AS accepted FROM ppo.acceptance_intents i WHERE i.workspace_id=$1 AND i.actor_id=$2 AND i.project_id=$3 AND i.acknowledged_at IS NULL AND i.final_failure IS NULL ORDER BY registered_at DESC LIMIT 20",
      [p.workspace_id, p.actor_id, project],
    )
  ).rows;
  const result: Recovery[] = [];
  for (const r of rows)
    try {
      const cmd = parseCommand(r.payload);
      await authority(c, p, cmd);
      result.push({
        operation_id: r.operation_id,
        action: r.action,
        stage_id: cmd.stage_id,
        registered_at: r.registered_at.toISOString(),
        accepted: r.accepted,
      });
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
  return result;
}
