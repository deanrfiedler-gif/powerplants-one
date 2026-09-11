import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { AppError } from "../platform/errors";
import {
  opportunityAuthority,
  relationshipContext,
  type Opportunity,
} from "./context";
import { opportunityReceiptActions } from "./receipt-authority";
import {
  parseDealInformation,
  parseDealScope,
  parseDealStage,
} from "./refinement-validation";
import { linkedActiveAction } from "./opportunities";

function expected(o: Opportunity, v: number) {
  if (o.version !== v)
    throw new AppError(
      409,
      "VersionConflict",
      "This opportunity changed. Reload and compare the saved information before retrying.",
    );
}
async function authorise(
  c: PoolClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
  await opportunityReceiptActions(c, p, id, operation);
  return o;
}
async function record(
  c: PoolClient,
  p: Principal,
  o: Opportunity,
  command: { operation_id: string; reason: string },
  kind: string,
  previous: Opportunity,
) {
  const snapshot = {
    title: o.title,
    primary_person_id: o.primary_person_id,
    contact_unknown_reason: o.contact_unknown_reason,
    value_amount: o.value_amount,
    expected_close_date: o.expected_close_date,
    scope_details: o.scope_details,
  };
  await c.query(
    `INSERT INTO ppo.opportunity_events(id,workspace_id,company_id,opportunity_id,created_by,updated_by,operation_id,opportunity_version,event_type,pipeline_definition_id,from_stage,to_stage,next_activity_id,identification_activity_id,reason,need_summary,qualification_note,record_snapshot)
    VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
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
      previous.stage_id,
      o.stage_id,
      o.next_activity_id,
      o.identification_activity_id,
      command.reason,
      o.need_summary,
      o.qualification_note,
      snapshot,
    ],
  );
  return {
    ...o,
    state: o.stage_id,
    audit_details: {
      previous_version: previous.version,
      from_stage: previous.stage_id,
      to_stage: o.stage_id,
    },
  };
}
const returned =
  "RETURNING *, expected_close_date::text AS expected_close_date";
export async function editDealInformation(
  p: Principal,
  id: string,
  input: unknown,
) {
  const command = parseDealInformation(id, input);
  return sharedOperation(
    p,
    command,
    "EditOpportunityInformation",
    (c) => authorise(c, p, id, command.operation_id),
    async (c, old) => {
      expected(old, command.expected_version);
      await relationshipContext(
        c,
        p,
        { ...old, primary_person_id: command.primary_person_id },
        "crm.opportunity.edit",
      );
      if (old.stage_id === "Qualified" && !command.primary_person_id) {
        if (!old.identification_activity_id)
          throw new AppError(
            422,
            "CRM_IDENTIFICATION_REQUIRED",
            "A qualified deal needs a contact or an owned active contact-identification action.",
          );
        await linkedActiveAction(
          c,
          p,
          old,
          old.identification_activity_id,
          true,
        );
      }
      const o = (
        await c.query<Opportunity>(
          `UPDATE ppo.opportunities SET title=$1,primary_person_id=$2,contact_unknown_reason=$3,value_amount=$4,expected_close_date=$5,version=version+1,updated_at=clock_timestamp(),updated_by=$6 WHERE workspace_id=$7 AND id=$8 ${returned}`,
          [
            command.title,
            command.primary_person_id,
            command.contact_unknown_reason,
            command.value_amount,
            command.expected_close_date,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      return record(c, p, o, command, "OpportunityInformationEdited", old);
    },
    "Opportunity",
    "OpportunityInformationEdited",
  );
}
export async function editDealScope(p: Principal, id: string, input: unknown) {
  const command = parseDealScope(id, input);
  return sharedOperation(
    p,
    command,
    "EditOpportunityScope",
    (c) => authorise(c, p, id, command.operation_id),
    async (c, old) => {
      expected(old, command.expected_version);
      const o = (
        await c.query<Opportunity>(
          `UPDATE ppo.opportunities SET need_summary=$1,scope_details=$2,version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$4 AND id=$5 ${returned}`,
          [
            command.need_summary,
            command.scope_details,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      return record(c, p, o, command, "OpportunityScopeEdited", old);
    },
    "Opportunity",
    "OpportunityScopeEdited",
  );
}
export async function changeDealStage(
  p: Principal,
  id: string,
  input: unknown,
) {
  const command = parseDealStage(id, input);
  return sharedOperation(
    p,
    command,
    "ChangeOpportunityStage",
    (c) => authorise(c, p, id, command.operation_id),
    async (c, old) => {
      expected(old, command.expected_version);
      if (old.stage_id === command.stage_id)
        throw new AppError(
          422,
          "CRM_STAGE_UNCHANGED",
          "The deal is already in this stage.",
        );
      if (command.stage_id === "Qualified") {
        if (command.identification_activity_id)
          await linkedActiveAction(
            c,
            p,
            old,
            command.identification_activity_id,
            true,
          );
        if (!old.primary_person_id && !command.identification_activity_id)
          throw new AppError(
            422,
            "CRM_IDENTIFICATION_REQUIRED",
            "Select an owned active contact-identification action before qualification.",
          );
      }
      const o = (
        await c.query<Opportunity>(
          `UPDATE ppo.opportunities SET stage_id=$1,qualification_note=$2,identification_activity_id=$3,stage_entered_at=clock_timestamp(),version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$5 AND id=$6 ${returned}`,
          [
            command.stage_id,
            command.qualification_note,
            command.identification_activity_id,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      return record(c, p, o, command, "OpportunityStageChanged", old);
    },
    "Opportunity",
    "OpportunityStageChanged",
  );
}
