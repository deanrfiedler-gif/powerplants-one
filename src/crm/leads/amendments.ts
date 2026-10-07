import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { canonical, sharedOperation } from "../../platform/operations";
import { page } from "../../shared/reads";
import { object } from "../../shared/validation";
import { visibleActivity } from "../../activities/activities";
import { leadAuthority, leadContext, visibleLead, type Lead } from "./context";
import { leadReceiptAuthority } from "./receipt-authority";
import {
  currentResolution,
  sharedLeadContext,
  visibleCustomerContext,
} from "./resolution-context";
import { parseLeadResolution, parseLeadTransfer } from "./validation";

function active(l: Lead, version = l.version) {
  if (l.version !== version)
    throw new AppError(
      409,
      "VersionConflict",
      "This lead changed. Reload its current version before saving.",
    );
  if (l.is_archived || ["Converted", "Disqualified"].includes(l.status))
    throw new AppError(
      409,
      "LeadConflict",
      "Only an active, unconverted lead can be resolved or transferred.",
    );
}
async function lockAuthority(c: PoolClient, p: Principal) {
  await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [p.workspace_id]);
}
async function actions(c: PoolClient, p: Principal, id: string) {
  const ids = (
    await c.query<{ id: string }>(
      "SELECT activity_id AS id FROM ppo.activity_links WHERE workspace_id=$1 AND lead_id=$2 ORDER BY activity_id",
      [p.workspace_id, id],
    )
  ).rows;
  return Promise.all(ids.map((a) => visibleActivity(c, p, a.id)));
}
async function receiver(c: PoolClient, p: Principal, l: Lead, id: string) {
  if (id === l.owner_id)
    throw new AppError(
      422,
      "LEAD_TRANSFER_SAME_OWNER",
      "Choose a different eligible owner.",
    );
  const recipient = await leadContext(
    c,
    p,
    { ...l, owner_id: id },
    "crm.lead.edit",
  );
  await visibleLead(c, recipient, l.id);
  const resolution = await currentResolution(c, p, l.id);
  if (resolution) {
    await leadContext(c, p, { ...resolution, owner_id: id }, "crm.lead.edit");
    await visibleCustomerContext(c, recipient, resolution);
  }
  await actions(c, recipient, l.id);
  return recipient;
}
async function amend(
  c: PoolClient,
  p: Principal,
  l: Lead,
  command: { operation_id: string; reason: string },
  kind: string,
  owner = l.owner_id,
) {
  const next = (
    await c.query<Lead>(
      "UPDATE ppo.lead_candidates SET owner_id=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, l.id, owner, p.actor_id],
    )
  ).rows[0];
  const event = randomUUID();
  await c.query(
    "INSERT INTO ppo.lead_events(id,workspace_id,company_id,lead_id,created_by,updated_by,operation_id,lead_version,event_type,reason,snapshot) SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,$4,$5,to_jsonb(l) FROM ppo.lead_candidates l WHERE workspace_id=$6 AND id=$7",
    [
      event,
      p.actor_id,
      command.operation_id,
      kind,
      command.reason,
      p.workspace_id,
      l.id,
    ],
  );
  return { next, event };
}
export async function resolveLeadContext(
  p: Principal,
  id: string,
  input: unknown,
) {
  const command = parseLeadResolution(id, input);
  return sharedOperation(
    p,
    command,
    "ResolveLeadContext",
    async (c) => {
      await lockAuthority(c, p);
      return leadReceiptAuthority(
        c,
        p,
        id,
        "ResolveLeadContext",
        command.operation_id,
      );
    },
    async (c, l) => {
      active(l, command.expected_version);
      const context = {
        company_id: l.company_id,
        organisation_id: command.organisation_id,
        site_id: command.site_id,
        primary_person_id: command.primary_person_id,
      };
      await leadContext(
        c,
        p,
        { ...context, owner_id: l.owner_id },
        "crm.lead.edit",
      );
      await sharedLeadContext(c, p, context);
      // A new customer context must not strand any independent follow-up owner.
      for (const a of await actions(c, p, id))
        await visibleCustomerContext(
          c,
          { ...p, actor_id: a.owner_id },
          context,
        );
      const { next, event } = await amend(
        c,
        p,
        l,
        command,
        "ResolveLeadContext",
      );
      await c.query(
        "INSERT INTO ppo.lead_context_resolutions(workspace_id,company_id,lead_id,event_id,lead_version,organisation_id,site_id,primary_person_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          p.workspace_id,
          l.company_id,
          id,
          event,
          next.version,
          context.organisation_id,
          context.site_id,
          context.primary_person_id,
        ],
      );
      await sharedLeadContext(c, p, context);
      return { ...next, state: next.status };
    },
    "Lead",
    "LeadChanged",
  );
}
export async function transferLeadOwner(
  p: Principal,
  id: string,
  input: unknown,
) {
  const command = parseLeadTransfer(id, input);
  return sharedOperation(
    p,
    command,
    "TransferLeadOwner",
    async (c) => {
      await lockAuthority(c, p);
      return leadReceiptAuthority(
        c,
        p,
        id,
        "TransferLeadOwner",
        command.operation_id,
      );
    },
    async (c, l) => {
      active(l, command.expected_version);
      const originals = await actions(c, p, id);
      const versions = originals.map((a) => ({ id: a.id, version: a.version }));
      if (canonical(versions) !== canonical(command.expected_activity_versions))
        throw new AppError(
          409,
          "LeadActivityComparisonConflict",
          "The linked activities changed. Reload and compare every current activity.",
        );
      await receiver(c, p, l, command.new_owner_id);
      const { next, event } = await amend(
        c,
        p,
        l,
        command,
        "TransferLeadOwner",
        command.new_owner_id,
      );
      await c.query(
        "INSERT INTO ppo.lead_owner_transfers(workspace_id,company_id,lead_id,event_id,lead_version,from_owner_id,to_owner_id,activity_versions) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          p.workspace_id,
          l.company_id,
          id,
          event,
          next.version,
          l.owner_id,
          command.new_owner_id,
          JSON.stringify(versions),
        ],
      );
      await receiver(c, p, l, command.new_owner_id);
      return { ...next, state: next.status };
    },
    "Lead",
    "LeadChanged",
  );
}
export async function leadTransferOptions(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  const r = object(input, ["q", "limit", "cursor"]);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await lockAuthority(c, p);
    const l = await leadAuthority(c, p, id);
    active(l);
    const originals = await actions(c, p, id);
    const pg = page(r, {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "LeadTransfer",
      id,
      version: l.version,
    });
    const users = (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active AND id<>$2 AND ($3::uuid IS NULL OR id>$3) AND position(lower($4) in lower(display_name))>0 ORDER BY id",
        [p.workspace_id, l.owner_id, pg.after, pg.q],
      )
    ).rows;
    const items = [];
    for (const user of users) {
      try {
        await receiver(c, p, l, user.id);
        items.push(user);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404, 422].includes(e.status))
          throw e;
      }
      if (items.length > pg.limit) break;
    }
    return {
      items: items.slice(0, pg.limit),
      next_cursor:
        items.length > pg.limit ? pg.cursor(items[pg.limit - 1].id) : null,
      lead_version: l.version,
      activities: originals.map((a) => ({
        id: a.id,
        version: a.version,
        summary: a.summary,
        owner_id: a.owner_id,
        status: a.status,
        due_at: a.due_at,
      })),
    };
  });
}
