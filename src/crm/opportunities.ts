import { opportunityReceiptActions } from "./receipt-authority";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import {
  authoriseActivityInput,
  insertActivity,
  activityLinks,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
import {
  visibleOpportunity,
  relationshipContext,
  eligibleOpportunityOwner,
  opportunityAuthority,
  type OpportunityContext,
} from "./context";
import {
  parseCreate,
  parsePlan,
  parseQualification,
  type parseAction,
} from "./validation";

function actionInput(
  o: OpportunityContext & { id: string },
  action: ReturnType<typeof parseAction>,
): ActivityInput {
  return {
    ...action,
    company_id: o.company_id,
    site_id: o.site_id,
    access_class: "Internal",
    links: [
      { object_type: "Organisation", object_id: o.organisation_id },
      ...(o.site_id
        ? [{ object_type: "Site" as const, object_id: o.site_id }]
        : []),
      { object_type: "Opportunity", object_id: o.id },
    ],
  };
}
async function event(
  c: PoolClient,
  p: Principal,
  o: Record<string, unknown>,
  command: { operation_id: string; reason: string },
  kind: string,
  from: string | null,
) {
  await c.query(
    `INSERT INTO ppo.opportunity_events(id,workspace_id,company_id,opportunity_id,created_by,updated_by,operation_id,opportunity_version,event_type,pipeline_definition_id,from_stage,to_stage,next_activity_id,identification_activity_id,reason,need_summary,qualification_note) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      randomUUID(),
      p.workspace_id,
      o.company_id,
      o.id,
      p.actor_id,
      command.operation_id,
      o.version,
      kind,
      o.pipeline_definition_id,
      from,
      o.stage_id,
      o.next_activity_id,
      o.identification_activity_id,
      command.reason,
      o.need_summary,
      o.qualification_note,
    ],
  );
}
function expected(o: { version: number }, value: number) {
  if (o.version !== value)
    throw new AppError(
      409,
      "VersionConflict",
      "This opportunity changed. Keep your proposal and compare the current saved version before trying again.",
    );
}
export async function createOpportunity(p: Principal, value: unknown) {
  const command = parseCreate(value);
  return sharedOperation(
    p,
    command,
    "CreateOpportunity",
    async (c) => {
      await relationshipContext(c, p, command, "crm.opportunity.create");
      await eligibleOpportunityOwner(c, p, command);
      // The new target does not exist yet; validate its existing context first.
      const initial = actionInput(command, command.initial_action);
      await authoriseActivityInput(c, p, {
        ...initial,
        links: initial.links.filter((l) => l.object_type !== "Opportunity"),
      });
      const exists = (
        await c.query(
          "SELECT 1 FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, command.id],
        )
      ).rowCount;
      if (exists) {
        await visibleOpportunity(c, p, command.id);
        await opportunityReceiptActions(c, p, command.id, command.operation_id);
      }
    },
    async (c) => {
      const o = (
        await c.query(
          `INSERT INTO ppo.opportunities(id,workspace_id,company_id,created_by,updated_by,organisation_id,site_id,primary_person_id,site_unknown_reason,contact_unknown_reason,title,need_summary,source_channel,source_basis,owner_id,pipeline_definition_id,next_activity_id) VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *,stage_id AS state`,
          [
            command.id,
            p.workspace_id,
            command.company_id,
            p.actor_id,
            command.organisation_id,
            command.site_id,
            command.primary_person_id,
            command.site_unknown_reason,
            command.contact_unknown_reason,
            command.title,
            command.need_summary,
            command.source_channel,
            command.source_basis,
            command.owner_id,
            command.pipeline_definition_id,
            command.initial_action.id,
          ],
        )
      ).rows[0];
      const initial = actionInput(command, command.initial_action);
      await authoriseActivityInput(c, p, initial);
      await insertActivity(c, p, initial);
      await event(c, p, o, command, "OpportunityCreated", null);
      return {
        ...o,
        audit_details: {
          initial_activity_id: initial.id,
          pipeline_definition_id: o.pipeline_definition_id,
        },
      };
    },
    "Opportunity",
    "OpportunityCreated",
  );
}
async function linkedActiveAction(
  c: PoolClient,
  p: Principal,
  o: OpportunityContext & { id: string },
  id: string,
  identification = false,
) {
  const a = await visibleActivity(c, p, id);
  await c.query(
    "SELECT id FROM ppo.activities WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
    [p.workspace_id, id],
  );
  const links = await activityLinks(c, p, id);
  if (
    a.company_id !== o.company_id ||
    a.site_id !== o.site_id ||
    a.access_class !== "Internal" ||
    !links.some((l) => l.object_type === "Opportunity" && l.object_id === o.id)
  )
    throw unavailable();
  await authoriseActivityInput(c, p, { ...a, links });
  if (!["Open", "InProgress"].includes(a.status))
    throw new AppError(
      422,
      "CRM_ACTION_TERMINAL",
      "Choose an active action. The completed or cancelled outcome remains in history.",
    );
  if (
    identification &&
    (a.owner_id !== o.owner_id ||
      !["CustomerContact", "RelationshipReview"].includes(a.kind))
  )
    throw new AppError(
      422,
      "CRM_IDENTIFICATION_REQUIRED",
      "Contact identification needs an active Customer contact or Relationship review action owned by the opportunity owner.",
    );
  return a;
}
export async function qualifyOpportunity(
  p: Principal,
  id: string,
  value: unknown,
) {
  const command = parseQualification(id, value);
  return sharedOperation(
    p,
    command,
    "RecordQualificationAndProgress",
    async (c) => {
      const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
      await opportunityReceiptActions(c, p, id, command.operation_id);
      return o;
    },
    async (c, o) => {
      expected(o, command.expected_version);
      if (
        o.stage_id !== "Enquiry" ||
        o.close_outcome !== "Open" ||
        o.pipeline_definition_id !== command.pipeline_definition_id
      )
        throw new AppError(
          422,
          "CRM_PROGRESS_INVALID",
          "Only an Open Enquiry in its original fictional pipeline can be qualified.",
        );
      if (command.identification_activity_id)
        await linkedActiveAction(
          c,
          p,
          o,
          command.identification_activity_id,
          true,
        );
      if (!o.primary_person_id && !command.identification_activity_id)
        throw new AppError(
          422,
          "CRM_IDENTIFICATION_REQUIRED",
          "Select an owned active contact-identification action before qualification.",
        );
      const next = (
        await c.query(
          `UPDATE ppo.opportunities SET stage_id='Qualified',stage_entered_at=clock_timestamp(),need_summary=$1,qualification_note=$2,identification_activity_id=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$5 AND id=$6 RETURNING *,stage_id AS state`,
          [
            command.need_summary,
            command.qualification_note,
            command.identification_activity_id,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      await event(c, p, next, command, "OpportunityQualified", "Enquiry");
      return {
        ...next,
        audit_details: {
          previous_version: o.version,
          from_stage: o.stage_id,
          to_stage: next.stage_id,
        },
      };
    },
    "Opportunity",
    "OpportunityQualified",
  );
}
export async function planOpportunityAction(
  p: Principal,
  id: string,
  value: unknown,
) {
  const command = parsePlan(id, value);
  return sharedOperation(
    p,
    command,
    "PlanOpportunityAction",
    async (c) => {
      const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
      await opportunityReceiptActions(c, p, id, command.operation_id);
      return o;
    },
    async (c, o) => {
      expected(o, command.expected_version);
      let actionId = command.activity_id;
      if (command.new_action) {
        const input = actionInput(o, command.new_action);
        await authoriseActivityInput(c, p, input);
        await insertActivity(c, p, input);
        actionId = input.id;
      } else if (actionId) await linkedActiveAction(c, p, o, actionId);
      const next = (
        await c.query(
          "UPDATE ppo.opportunities SET next_activity_id=$1,version=version+1,updated_at=clock_timestamp(),updated_by=$2 WHERE workspace_id=$3 AND id=$4 RETURNING *,stage_id AS state",
          [actionId, p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      await event(c, p, next, command, "OpportunityActionPlanned", o.stage_id);
      return {
        ...next,
        audit_details: {
          previous_version: o.version,
          previous_next_activity_id: o.next_activity_id,
          next_activity_id: actionId,
        },
      };
    },
    "Opportunity",
    "OpportunityActionPlanned",
  );
}
