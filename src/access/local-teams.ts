import { createHash, randomUUID } from "node:crypto";
import { transaction } from "../platform/database";
import { isHostedDemo } from "../platform/demo-config";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import {
  canonical,
  lockOperation,
  type OperationReceipt,
} from "../platform/operations";
import {
  common,
  commonKeys,
  invalid,
  label,
  object,
  uuid,
} from "../shared/validation";
import { requireAccessInspection } from "./service";

function localOnly() {
  if (isHostedDemo())
    throw new AppError(
      403,
      "LocalOnly",
      "Team records are available only in the local synthetic prototype.",
    );
}
async function authority(c: QueryClient, p: Principal, create = false) {
  localOnly();
  await requireAccessInspection(c, p);
  if (
    create &&
    !(
      await c.query(
        `SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u
    ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
    WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND u.issuer='PPO-LocalSynthetic'
    AND g.capability='admin.access.team.create' AND g.scope_type='Workspace' AND g.scope_id=$1
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())`,
        [p.workspace_id, p.actor_id],
      )
    ).rowCount
  )
    throw new AppError(
      403,
      "Forbidden",
      "Current Workspace team-creation authority is required.",
    );
}
const missing = () =>
  new AppError(404, "NotFound", "This local team record is unavailable.");
const personName = (alias: string) =>
  `CASE WHEN ${alias}.issuer='PPO-LocalSynthetic' THEN ${alias}.display_name ELSE 'Hosted identity (masked)' END`;
const teamColumns = `t.*, ${personName("lead")} AS lead_name, lead.active AS lead_active,
 ${personName("creator")} AS creator_name`;
const teamJoins = `FROM ppo.access_teams t JOIN ppo.users lead ON (lead.workspace_id,lead.id)=(t.workspace_id,t.lead_id)
 JOIN ppo.users creator ON (creator.workspace_id,creator.id)=(t.workspace_id,t.created_by)`;
export async function localTeams(
  p: Principal,
  query: Record<string, string> = {},
) {
  localOnly();
  const offset = Number(query.offset ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    invalid("offset", "Choose a valid page.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const items = (
      await c.query(
        `SELECT ${teamColumns},(SELECT count(*)::integer FROM ppo.access_team_members m
      WHERE (m.workspace_id,m.team_id)=(t.workspace_id,t.id)) AS member_count ${teamJoins}
      WHERE t.workspace_id=$1 ORDER BY t.created_at DESC,t.id LIMIT 51 OFFSET $2`,
        [p.workspace_id, offset],
      )
    ).rows;
    await authority(c, p);
    return { items: items.slice(0, 50), has_more: items.length > 50 };
  });
}
export async function localTeam(p: Principal, id: string) {
  localOnly();
  uuid(id, "team_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const team = (
      await c.query(
        `SELECT ${teamColumns} ${teamJoins} WHERE t.workspace_id=$1 AND t.id=$2`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!team) throw missing();
    const members = (
      await c.query(
        `SELECT m.user_id,${personName("u")} AS display_name,u.active,
      u.issuer<>'PPO-LocalSynthetic' AS masked FROM ppo.access_team_members m
      JOIN ppo.users u ON (u.workspace_id,u.id)=(m.workspace_id,m.user_id)
      WHERE m.workspace_id=$1 AND m.team_id=$2 ORDER BY m.user_id`,
        [p.workspace_id, id],
      )
    ).rows;
    const history = (
      await c.query(
        `SELECT o.operation_id,o.command,a.occurred_at,a.reason,
      ${personName("u")} AS actor_name FROM ppo.access_team_operations o
      JOIN ppo.audit_events a ON a.id=o.audit_id
      JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.actor_id)
      WHERE o.workspace_id=$1 AND o.team_id=$2 ORDER BY a.occurred_at,o.id`,
        [p.workspace_id, id],
      )
    ).rows;
    await authority(c, p);
    return { team, members, history };
  });
}
export async function recoverLocalTeam(p: Principal, id: string) {
  localOnly();
  uuid(id, "operation_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p, true);
    const row = (
      await c.query(
        "SELECT receipt FROM ppo.access_team_operations WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0];
    if (!row) throw missing();
    await authority(c, p, true);
    return row.receipt as OperationReceipt;
  });
}
export async function createLocalTeam(p: Principal, input: unknown) {
  localOnly();
  const b = object(input, [
    ...commonKeys,
    "team_id",
    "expected_version",
    "name",
    "purpose",
    "lead_id",
    "member_ids",
  ]);
  if (b.expected_version !== 0)
    invalid("expected_version", "A new team requires expected version 0.");
  const command = common(b),
    purpose = label(b.purpose, "purpose", 1000);
  if (command.reason.length < 10)
    invalid("reason", "Explain this record in 10–1000 characters.");
  if (purpose.length < 10)
    invalid("purpose", "Describe the team's purpose in 10–1000 characters.");
  if (
    !Array.isArray(b.member_ids) ||
    b.member_ids.length < 1 ||
    b.member_ids.length > 20
  )
    invalid("member_ids", "Choose 1–20 distinct local people.");
  const member_ids = b.member_ids.map((id) => uuid(id, "member_ids")).sort();
  if (new Set(member_ids).size !== member_ids.length)
    invalid("member_ids", "Choose each person once.");
  const value = {
    ...command,
    team_id: uuid(b.team_id, "team_id"),
    expected_version: 0,
    name: label(b.name, "name", 100),
    purpose,
    lead_id: uuid(b.lead_id, "lead_id"),
    member_ids,
  };
  const hash = createHash("sha256")
    .update(canonical({ command: "CreateTeam", ...value }))
    .digest("hex");
  try {
    return await transaction(async (c) => {
      await lockOperation(c, p, value.operation_id);
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      await c.query(
        "LOCK TABLE ppo.users,ppo.permission_grants,ppo.working_companies IN SHARE ROW EXCLUSIVE MODE",
      );
      await authority(c, p, true);
      const prior = (
        await c.query(
          "SELECT payload_hash,receipt FROM ppo.access_team_operations WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, value.operation_id],
        )
      ).rows[0];
      if (prior) {
        if (prior.payload_hash !== hash)
          throw new AppError(
            409,
            "OperationConflict",
            "This operation ID was already used for different content.",
          );
        return { receipt: prior.receipt as OperationReceipt, replayed: true };
      }
      const participants = [...new Set([value.lead_id, ...value.member_ids])];
      const eligible = (
        await c.query(
          "SELECT id FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[]) AND active AND issuer='PPO-LocalSynthetic'",
          [p.workspace_id, participants],
        )
      ).rows;
      if (!eligible.some((u) => u.id === value.lead_id))
        invalid("lead_id", "Choose an active local lead in this workspace.");
      if (eligible.length !== participants.length)
        invalid(
          "member_ids",
          "Every member must be active and local to this workspace.",
        );
      const row = (
        await c.query(
          `INSERT INTO ppo.access_teams(id,workspace_id,name,purpose,lead_id,created_by,reason)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [
            value.team_id,
            p.workspace_id,
            value.name,
            value.purpose,
            value.lead_id,
            p.actor_id,
            value.reason,
          ],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO ppo.access_team_members(workspace_id,team_id,user_id) SELECT $1,$2,id FROM unnest($3::uuid[]) id",
        [p.workspace_id, value.team_id, value.member_ids],
      );
      const snapshot = (
        await c.query(
          `SELECT jsonb_build_object('team',to_jsonb(t),'members',
        (SELECT jsonb_agg(to_jsonb(m) ORDER BY m.user_id) FROM ppo.access_team_members m WHERE (m.workspace_id,m.team_id)=(t.workspace_id,t.id))) AS value
        FROM ppo.access_teams t WHERE t.workspace_id=$1 AND t.id=$2`,
          [p.workspace_id, value.team_id],
        )
      ).rows[0].value;
      const receipt_id = randomUUID(),
        audit_id = randomUUID();
      const receipt: OperationReceipt = {
        receipt_id,
        operation_id: value.operation_id,
        record_id: value.team_id,
        record_version: 1,
        state: "Recorded",
        accepted_at: new Date(row.created_at).toISOString(),
        warnings: [],
        task_ids: [],
      };
      await c.query(
        `INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,operation_id,outcome,reason,details)
        VALUES($1,$2,$3,'AccessTeam',$4,$5,'Accepted',$6,$7)`,
        [
          audit_id,
          p.workspace_id,
          p.actor_id,
          value.team_id,
          value.operation_id,
          value.reason,
          snapshot,
        ],
      );
      await c.query(
        `INSERT INTO ppo.access_team_operations(id,workspace_id,actor_id,operation_id,team_id,command,payload_hash,audit_id,snapshot,receipt)
        VALUES($1,$2,$3,$4,$5,'CreateTeam',$6,$7,$8,$9)`,
        [
          receipt_id,
          p.workspace_id,
          p.actor_id,
          value.operation_id,
          value.team_id,
          hash,
          audit_id,
          snapshot,
          receipt,
        ],
      );
      await authority(c, p, true);
      return { receipt, replayed: false };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505")
      throw new AppError(
        409,
        "TeamConflict",
        "A team or accepted operation already exists for this exact identity.",
      );
    throw error;
  }
}
