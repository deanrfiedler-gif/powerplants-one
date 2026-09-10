import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import { visible } from "../../shared/reads";
import {
  authoriseActivityInput,
  insertActivity,
  visibleActivity,
  activityLinks,
  type ActivityInput,
} from "../../activities/activities";
import {
  PIPELINE_ID,
  relationshipContext,
  eligibleOpportunityOwner,
} from "../context";
import { opportunityEvent } from "../opportunities";
import { leadContext, type Lead } from "./context";
import {
  parseLeadCreate,
  parseLeadChange,
  parseLeadPlan,
  parseLeadConversion,
} from "./validation";
import { leadReceiptAuthority } from "./receipt-authority";
const conflict = (message: string) =>
  new AppError(409, "LeadConflict", message);
function editable(l: Lead, version: number, active = false) {
  if (l.version !== version)
    throw new AppError(
      409,
      "VersionConflict",
      "This lead changed. Review its current saved version before trying again.",
    );
  if (l.status === "Converted")
    throw conflict(
      "This lead has already been converted. Open its linked deal.",
    );
  if (active && (l.status === "Disqualified" || l.is_archived))
    throw conflict("Reopen or unarchive the lead before progressing it.");
}
async function event(
  c: PoolClient,
  p: Principal,
  l: Lead,
  command: { operation_id: string; reason: string },
  kind: string,
  note: string | null = null,
) {
  await c.query(
    `INSERT INTO ppo.lead_events(id,workspace_id,company_id,lead_id,created_by,updated_by,operation_id,lead_version,event_type,reason,note,snapshot) SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,$4,$5,$6,to_jsonb(l) FROM ppo.lead_candidates l WHERE workspace_id=$7 AND id=$8`,
    [
      randomUUID(),
      p.actor_id,
      command.operation_id,
      kind,
      command.reason,
      note,
      p.workspace_id,
      l.id,
    ],
  );
  return { ...l, state: l.status };
}
async function update(
  c: PoolClient,
  p: Principal,
  id: string,
  fields: Record<string, unknown>,
) {
  const entries = Object.entries(fields);
  return (
    await c.query<Lead>(
      `UPDATE ppo.lead_candidates SET ${entries.map(([k], i) => `${k}=$${i + 1}`).join(",")},version=version+1,updated_at=clock_timestamp(),updated_by=$${entries.length + 1} WHERE workspace_id=$${entries.length + 2} AND id=$${entries.length + 3} RETURNING *`,
      [...entries.map(([, v]) => v), p.actor_id, p.workspace_id, id],
    )
  ).rows[0];
}
async function sharedContext(
  c: PoolClient,
  p: Principal,
  l: ReturnType<typeof parseLeadCreate>,
) {
  if (l.organisation_id) {
    const org = await visible(c, p, "Organisation", l.organisation_id);
    if (org.company_id !== l.company_id) throw unavailable();
  }
  if (l.primary_person_id) {
    const person = await visible(c, p, "Person", l.primary_person_id);
    if (
      !person.active ||
      !(
        await c.query(
          "SELECT 1 FROM ppo.relationships WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND person_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
          [
            p.workspace_id,
            l.company_id,
            l.organisation_id,
            l.primary_person_id,
          ],
        )
      ).rowCount
    )
      throw unavailable();
  }
  if (
    l.site_id &&
    !(
      await c.query(
        "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND site_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
        [p.workspace_id, l.company_id, l.organisation_id, l.site_id],
      )
    ).rowCount
  )
    throw unavailable();
}
export async function createLead(p: Principal, value: unknown) {
  const command = parseLeadCreate(value);
  return sharedOperation(
    p,
    command,
    "CreateLead",
    async (c) => {
      const owner = await leadContext(c, p, command, "crm.lead.create");
      await sharedContext(c, p, command);
      await sharedContext(c, owner, command);
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.lead_candidates WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, command.id],
          )
        ).rowCount
      )
        await leadReceiptAuthority(c, p, command.id, "CreateLead");
    },
    async (c) => {
      const {
        operation_id: _operation,
        schema_version: _schema,
        reason: _reason,
        ...fields
      } = command;
      void _operation;
      void _schema;
      void _reason;
      const entries = Object.entries({
        ...fields,
        workspace_id: p.workspace_id,
        created_by: p.actor_id,
        updated_by: p.actor_id,
      });
      const lead = (
        await c.query<Lead>(
          `INSERT INTO ppo.lead_candidates(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
          entries.map(([, v]) => v),
        )
      ).rows[0];
      return event(c, p, lead, command, "CreateLead");
    },
    "Lead",
    "LeadCreated",
  );
}
export async function changeLead(p: Principal, id: string, value: unknown) {
  const command = parseLeadChange(id, value);
  const name = {
    update: "UpdateLead",
    note: "RecordLeadNote",
    archive: "ArchiveLead",
    unarchive: "UnarchiveLead",
    disqualify: "DisqualifyLead",
    reopen: "ReopenLead",
  }[command.action];
  return sharedOperation(
    p,
    command,
    name,
    (c) => leadReceiptAuthority(c, p, id, name),
    async (c, l) => {
      editable(l, command.expected_version);
      let fields: Record<string, unknown>;
      switch (command.action) {
        case "update":
          editable(l, command.expected_version, true);
          fields = { ...command.details, status: command.status };
          break;
        case "note":
          fields = { status: l.status };
          break;
        case "archive":
          if (l.is_archived) throw conflict("This lead is already archived.");
          fields = { is_archived: true };
          break;
        case "unarchive":
          if (!l.is_archived) throw conflict("This lead is not archived.");
          fields = { is_archived: false };
          break;
        case "disqualify":
          if (l.status === "Disqualified")
            throw conflict("This lead is already disqualified.");
          fields = { status: "Disqualified", is_archived: false };
          break;
        case "reopen":
          if (l.status !== "Disqualified")
            throw conflict("Only a disqualified lead can be reopened.");
          fields = { status: "New", is_archived: false };
          break;
      }
      return event(
        c,
        p,
        await update(c, p, id, fields),
        command,
        name,
        command.note,
      );
    },
    "Lead",
    "LeadChanged",
  );
}
function leadAction(
  l: Lead,
  action: NonNullable<ReturnType<typeof parseLeadPlan>["new_action"]>,
): ActivityInput {
  return {
    ...action,
    company_id: l.company_id,
    site_id: l.site_id,
    access_class: "Internal",
    links: [{ object_type: "Lead", object_id: l.id }],
  };
}
async function activeAction(c: PoolClient, p: Principal, l: Lead, id: string) {
  const a = await visibleActivity(c, p, id),
    links = await activityLinks(c, p, id);
  if (
    a.company_id !== l.company_id ||
    a.site_id !== l.site_id ||
    !links.some((x) => x.object_type === "Lead" && x.object_id === l.id)
  )
    throw unavailable();
  await authoriseActivityInput(c, p, { ...a, links });
  if (!["Open", "InProgress"].includes(a.status))
    throw new AppError(
      422,
      "LEAD_ACTION_TERMINAL",
      "Choose an active action; completed and cancelled actions remain in history.",
    );
  return a;
}
export async function planLeadAction(p: Principal, id: string, value: unknown) {
  const command = parseLeadPlan(id, value);
  return sharedOperation(
    p,
    command,
    "PlanLeadAction",
    (c) => leadReceiptAuthority(c, p, id, "PlanLeadAction"),
    async (c, l) => {
      editable(l, command.expected_version, true);
      let actionId = command.activity_id;
      if (command.new_action) {
        const input = leadAction(l, command.new_action);
        await authoriseActivityInput(c, p, input);
        await insertActivity(c, p, input);
        actionId = input.id;
      } else if (actionId) await activeAction(c, p, l, actionId);
      return event(
        c,
        p,
        await update(c, p, id, { next_activity_id: actionId }),
        command,
        "PlanLeadAction",
      );
    },
    "Lead",
    "LeadActionPlanned",
  );
}
export async function convertLead(p: Principal, id: string, value: unknown) {
  const command = parseLeadConversion(id, value);
  return sharedOperation(
    p,
    command,
    "ConvertLeadToOpportunity",
    async (c) => {
      const l = await leadReceiptAuthority(
        c,
        p,
        id,
        "ConvertLeadToOpportunity",
      );
      const context = {
        company_id: l.company_id,
        owner_id: l.owner_id,
        organisation_id: command.organisation_id,
        site_id: command.site_id,
        primary_person_id: command.primary_person_id,
        pipeline_definition_id: PIPELINE_ID,
      };
      await relationshipContext(c, p, context, "crm.opportunity.create");
      await eligibleOpportunityOwner(c, p, context);
      return l;
    },
    async (c, l) => {
      editable(l, command.expected_version, true);
      const context = {
        company_id: l.company_id,
        owner_id: l.owner_id,
        organisation_id: command.organisation_id,
        site_id: command.site_id,
        primary_person_id: command.primary_person_id,
        pipeline_definition_id: PIPELINE_ID,
      };
      // Every original action is carried by identity. Incompatible context blocks before commit.
      const originals = (
        await c.query<{ activity_id: string }>(
          "SELECT activity_id FROM ppo.activity_links WHERE workspace_id=$1 AND lead_id=$2 ORDER BY activity_id",
          [p.workspace_id, id],
        )
      ).rows;
      const actions: ActivityInput[] = [];
      for (const { activity_id } of originals) {
        const a = await visibleActivity(c, p, activity_id),
          links = await activityLinks(c, p, activity_id);
        if (a.site_id !== command.site_id || a.access_class !== "Internal")
          throw new AppError(
            422,
            "LEAD_ACTIVITY_CONTEXT",
            "A linked activity has a different site or access context. Preserve its history and review the conversion context.",
          );
        await authoriseActivityInput(c, p, { ...a, links });
        // Validate all future targets and the independent Activity owner, without creating the new target yet.
        const future = {
          ...a,
          links: [
            ...links,
            {
              object_type: "Organisation" as const,
              object_id: context.organisation_id,
            },
            ...(context.site_id
              ? [{ object_type: "Site" as const, object_id: context.site_id }]
              : []),
          ],
        };
        await authoriseActivityInput(c, p, future);
        await relationshipContext(
          c,
          { ...p, actor_id: a.owner_id },
          context,
          "crm.opportunity.read",
        );
        actions.push({ ...a, links });
      }
      let nextId = command.activity_id;
      if (nextId) await activeAction(c, p, l, nextId);
      if (command.new_action) nextId = command.new_action.id;
      if (!nextId) throw unavailable();
      if (
        (l.organisation_id && l.organisation_id !== command.organisation_id) ||
        (l.primary_person_id &&
          l.primary_person_id !== command.primary_person_id) ||
        (l.site_id && l.site_id !== command.site_id)
      )
        throw new AppError(
          422,
          "LEAD_SOURCE_CONTEXT",
          "Conversion must retain the lead's resolved organisation, contact and site.",
        );
      const o = (
        await c.query(
          `INSERT INTO ppo.opportunities(id,workspace_id,company_id,created_by,updated_by,organisation_id,site_id,primary_person_id,site_unknown_reason,contact_unknown_reason,title,need_summary,source_channel,source_basis,owner_id,pipeline_definition_id,next_activity_id) VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
          [
            command.opportunity_id,
            p.workspace_id,
            l.company_id,
            p.actor_id,
            command.organisation_id,
            command.site_id,
            command.primary_person_id,
            command.site_unknown_reason,
            command.contact_unknown_reason,
            command.title,
            command.need_summary,
            l.source_channel,
            l.source_basis,
            l.owner_id,
            PIPELINE_ID,
            nextId,
          ],
        )
      ).rows[0];
      for (const a of actions) {
        const input = {
          ...a,
          links: [
            ...a.links,
            { object_type: "Opportunity" as const, object_id: o.id },
          ],
        };
        await authoriseActivityInput(c, p, input);
        await c.query(
          "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Opportunity',$4)",
          [p.workspace_id, l.company_id, a.id, o.id],
        );
      }
      if (command.new_action) {
        const input: ActivityInput = {
          ...command.new_action,
          company_id: l.company_id,
          site_id: command.site_id,
          access_class: "Internal",
          links: [
            { object_type: "Organisation", object_id: command.organisation_id },
            { object_type: "Opportunity", object_id: o.id },
            ...(command.site_id === l.site_id
              ? [{ object_type: "Lead" as const, object_id: id }]
              : []),
          ],
        };
        await authoriseActivityInput(c, p, input);
        await insertActivity(c, p, input);
      }
      const identificationId = command.identification_activity_id;
      if (!command.primary_person_id) {
        if (!identificationId)
          throw new AppError(
            422,
            "CRM_IDENTIFICATION_REQUIRED",
            "Choose an active contact-identification action owned by the lead owner.",
          );
        const a = await visibleActivity(c, p, identificationId),
          links = await activityLinks(c, p, identificationId);
        if (
          a.owner_id !== l.owner_id ||
          !["Open", "InProgress"].includes(a.status) ||
          !["CustomerContact", "RelationshipReview"].includes(a.kind) ||
          !links.some(
            (x) => x.object_type === "Opportunity" && x.object_id === o.id,
          )
        )
          throw unavailable();
        await authoriseActivityInput(c, p, { ...a, links });
      } else if (identificationId)
        throw new AppError(
          422,
          "CRM_IDENTIFICATION_INVALID",
          "A resolved contact does not need a separate identification action.",
        );
      await opportunityEvent(c, p, o, command, "OpportunityCreated", null);
      const qualified = (
        await c.query(
          "UPDATE ppo.opportunities SET stage_id='Qualified',qualification_note=$1,identification_activity_id=$2,stage_entered_at=clock_timestamp(),version=2,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$4 AND id=$5 RETURNING *",
          [
            command.qualification_note,
            identificationId,
            p.actor_id,
            p.workspace_id,
            o.id,
          ],
        )
      ).rows[0];
      await opportunityEvent(
        c,
        p,
        qualified,
        command,
        "OpportunityQualified",
        "Enquiry",
      );
      await c.query(
        "INSERT INTO ppo.lead_conversions(id,workspace_id,company_id,lead_id,opportunity_id,created_by,updated_by,operation_id,source_version) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8)",
        [
          randomUUID(),
          p.workspace_id,
          l.company_id,
          id,
          o.id,
          p.actor_id,
          command.operation_id,
          l.version,
        ],
      );
      const result = await event(
        c,
        p,
        await update(c, p, id, { status: "Converted", is_archived: false }),
        command,
        "ConvertLeadToOpportunity",
      );
      return {
        ...result,
        audit_details: {
          source_version: l.version,
          opportunity_id: o.id,
          next_activity_id: nextId,
          preserved_activity_ids: actions.map((a) => a.id),
        },
      };
    },
    "Lead",
    "LeadConverted",
  );
}
