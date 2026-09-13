import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { hasPermission } from "../platform/permissions";
import { sharedOperation } from "../platform/operations";
import { visibleActivity } from "../activities/activities";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
} from "../shared/validation";
import { page } from "../shared/reads";
import {
  opportunityAuthority,
  eligibleOpportunityOwner,
  type Opportunity,
} from "./context";
import { acceptedOpportunityOriginal } from "./receipt-authority";

function fence(value: unknown, field: string) {
  const r = object(value, ["id", "version"]);
  return { id: uuid(r.id, `${field}.id`), version: version(r.version) };
}
export function parseOwnerTransfer(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "new_owner_id",
    "expected_next_activity",
    "expected_identification_activity",
  ]);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    new_owner_id: uuid(r.new_owner_id, "new_owner_id"),
    expected_next_activity: fence(
      r.expected_next_activity,
      "expected_next_activity",
    ),
    expected_identification_activity:
      r.expected_identification_activity === null
        ? null
        : fence(
            r.expected_identification_activity,
            "expected_identification_activity",
          ),
  };
}
// These administrative rows do not all share the business workspace protocol.
// SHARE conflicts with update/delete; the final permission checks include clock expiry.
async function lockAuthority(c: PoolClient, p: Principal) {
  await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [p.workspace_id]);
}
async function initiator(c: PoolClient, p: Principal, id: string) {
  const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
  if (
    !(await hasPermission(
      c,
      p,
      "crm.opportunity.transfer.own",
      o.company_id,
      o.site_id ?? undefined,
    ))
  )
    throw new AppError(
      403,
      "CRM_TRANSFER_REQUIRED",
      "Current ownership and explicit transfer permission are required.",
    );
  return o;
}
async function requiredActions(
  c: PoolClient,
  p: Principal,
  o: Opportunity,
  lock = false,
) {
  const ids = [
    ...new Set(
      [o.next_activity_id, o.identification_activity_id].filter(
        (id): id is string => !!id,
      ),
    ),
  ].sort();
  if (lock)
    await c.query(
      "SELECT id FROM ppo.activities WHERE workspace_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",
      [p.workspace_id, ids],
    );
  const actions = [];
  for (const id of ids) {
    const a = await visibleActivity(c, p, id);
    const owner = (
      await c.query<{ display_name: string }>(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, a.owner_id],
      )
    ).rows[0];
    actions.push({
      id: a.id,
      version: a.version,
      summary: a.summary,
      status: a.status,
      owner_id: a.owner_id,
      owner_name: owner.display_name,
    });
  }
  return actions;
}
async function receiver(
  c: PoolClient,
  p: Principal,
  o: Opportunity,
  id: string,
) {
  if (id === o.owner_id)
    throw new AppError(
      422,
      "CRM_TRANSFER_SAME_OWNER",
      "Choose a different eligible owner.",
    );
  const recipient = await eligibleOpportunityOwner(c, p, o, id);
  await requiredActions(c, recipient, o);
  return recipient;
}
export async function ownerTransferOptions(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  const r = object(input, ["q", "limit", "cursor"]),
    limit = r.limit === undefined ? 25 : Number(r.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    invalid("limit", "Choose a page size from 1 to 100.");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await lockAuthority(c, p);
    const o = await initiator(c, p, id),
      actions = await requiredActions(c, p, o, true);
    const pg = page(
      { ...r, limit },
      {
        workspace: p.workspace_id,
        actor: p.actor_id,
        opportunity: id,
        version: o.version,
      },
    );
    const rows = (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active AND id<>$2 AND ($3::uuid IS NULL OR id>$3) AND position(lower($4) in lower(display_name))>0 ORDER BY id",
        [p.workspace_id, o.owner_id, pg.after, pg.q],
      )
    ).rows;
    const items = [];
    for (const u of rows) {
      try {
        await receiver(c, p, o, u.id);
        items.push(u);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404, 422].includes(e.status))
          throw e;
      }
      if (items.length > limit) break;
    }
    return {
      items: items.slice(0, limit),
      next_cursor: items.length > limit ? pg.cursor(items[limit - 1].id) : null,
      opportunity_version: o.version,
      current_owner_id: o.owner_id,
      next_activity: actions.find((a) => a.id === o.next_activity_id)!,
      identification_activity:
        actions.find((a) => a.id === o.identification_activity_id) ?? null,
      observed_at: new Date().toISOString(),
      synthetic: true,
    };
  });
}
export async function transferOpportunityOwner(
  p: Principal,
  id: string,
  input: unknown,
) {
  const command = parseOwnerTransfer(id, input);
  return sharedOperation(
    p,
    command,
    "TransferOpportunityOwner",
    async (c) => {
      await lockAuthority(c, p);
      const accepted = await acceptedOpportunityOriginal(
        c,
        p,
        id,
        command.operation_id,
        "TransferOpportunityOwner",
      );
      return accepted?.opportunity ?? (await initiator(c, p, id));
    },
    async (c, old) => {
      if (old.version !== command.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "The opportunity changed. Reload and compare before transferring it.",
        );
      const actions = await requiredActions(c, p, old, true);
      const next = actions.find((a) => a.id === old.next_activity_id)!,
        identification =
          actions.find((a) => a.id === old.identification_activity_id) ?? null;
      if (
        next.id !== command.expected_next_activity.id ||
        next.version !== command.expected_next_activity.version ||
        identification?.id !== command.expected_identification_activity?.id ||
        identification?.version !==
          command.expected_identification_activity?.version
      )
        throw new AppError(
          409,
          "ActivityComparisonConflict",
          "An activity changed. Reload and review its owner and outcome before transferring.",
        );
      await receiver(c, p, old, command.new_owner_id);
      // Repeat at the final point after candidate/target reads: a grant can expire while waiting.
      await initiator(c, p, id);
      await receiver(c, p, old, command.new_owner_id);
      const o = (
        await c.query<Opportunity>(
          "UPDATE ppo.opportunities SET owner_id=$1,version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE workspace_id=$3 AND id=$4 RETURNING *",
          [command.new_owner_id, p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      const event = randomUUID();
      await c.query(
        `INSERT INTO ppo.opportunity_events(id,workspace_id,company_id,opportunity_id,created_by,updated_by,operation_id,opportunity_version,event_type,pipeline_definition_id,from_stage,to_stage,next_activity_id,identification_activity_id,reason,need_summary,qualification_note,record_snapshot,created_at)
      SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,'OpportunityOwnerTransferred',pipeline_definition_id,stage_id,stage_id,next_activity_id,identification_activity_id,$4,need_summary,qualification_note,ppo.crm_record_snapshot(o),updated_at FROM ppo.opportunities o WHERE workspace_id=$5 AND id=$6`,
        [
          event,
          p.actor_id,
          command.operation_id,
          command.reason,
          p.workspace_id,
          id,
        ],
      );
      await c.query(
        `INSERT INTO ppo.opportunity_owner_transfers(workspace_id,company_id,opportunity_id,event_id,opportunity_version,from_owner_id,to_owner_id,next_activity_id,next_activity_version,identification_activity_id,identification_activity_version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          p.workspace_id,
          o.company_id,
          id,
          event,
          o.version,
          old.owner_id,
          o.owner_id,
          next.id,
          next.version,
          identification?.id ?? null,
          identification?.version ?? null,
        ],
      );
      return {
        ...o,
        state: o.stage_id,
        audit_details: {
          previous_version: old.version,
          from_owner_id: old.owner_id,
          to_owner_id: o.owner_id,
          event_id: event,
        },
      };
    },
    "Opportunity",
    "OpportunityOwnerTransferred",
  );
}
