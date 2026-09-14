import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { visibleActivity } from "../activities/activities";
import { hasPermission } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  narrative,
  invalid,
} from "../shared/validation";
import { opportunityAuthority, type Opportunity } from "./context";
import { opportunityReceiptActions } from "./receipt-authority";
import { ACTIVE_PIPELINE_ID } from "./stages";

export const lostReasons = [
  "Price",
  "Competitor",
  "Timing",
  "No decision",
] as const;
export function parseOpportunityOutcome(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "close_outcome",
    "lost_reason",
    "acceptance_evidence",
  ]);
  const close_outcome = choice(r.close_outcome, "close_outcome", [
    "Won",
    "Lost",
  ]);
  if (close_outcome === "Won" && r.lost_reason != null)
    invalid("lost_reason", "A Won outcome cannot carry a lost reason.");
  if (close_outcome === "Lost" && r.acceptance_evidence != null)
    invalid(
      "acceptance_evidence",
      "A Lost outcome cannot carry acceptance evidence.",
    );
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    close_outcome,
    lost_reason:
      close_outcome === "Lost"
        ? choice(r.lost_reason, "lost_reason", lostReasons)
        : null,
    acceptance_evidence:
      close_outcome === "Won"
        ? narrative(r.acceptance_evidence, "acceptance_evidence", 2000)
        : null,
  };
}
export async function recordOpportunityOutcome(
  p: Principal,
  id: string,
  input: unknown,
) {
  const command = parseOpportunityOutcome(id, input);
  return sharedOperation(
    p,
    command,
    "RecordOpportunityOutcome",
    async (c) => {
      const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
      await opportunityReceiptActions(c, p, id, command.operation_id);
      return o;
    },
    async (c, old) => {
      if (old.version !== command.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This opportunity changed. Reload and compare before recording its outcome.",
        );
      if (old.pipeline_definition_id !== ACTIVE_PIPELINE_ID)
        throw new AppError(
          422,
          "CRM_OUTCOME_PIPELINE",
          "Outcomes are available on the five-stage pipeline.",
        );
      if (old.close_outcome !== "Open")
        throw new AppError(
          422,
          "CRM_OUTCOME_CLOSED",
          "An outcome is already recorded. Reopening is unavailable.",
        );
      if (command.close_outcome === "Won" && old.stage_id !== "Closing")
        throw new AppError(
          422,
          "CRM_WON_REQUIRES_CLOSING",
          "Move through the pipeline to Closing before recording Won.",
        );
      // Preserve the same all-target Activity authority used to recover this receipt.
      for (const actionId of new Set(
        [old.next_activity_id, old.identification_activity_id].filter(
          (id): id is string => !!id,
        ),
      )) {
        const action = await visibleActivity(c, p, actionId);
        if (
          !(await hasPermission(
            c,
            p,
            "activity.edit",
            action.company_id,
            action.site_id ?? undefined,
          ))
        )
          throw unavailable();
      }
      const o = (
        await c.query<Opportunity>(
          `UPDATE ppo.opportunities SET close_outcome=$1,version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE workspace_id=$3 AND id=$4 RETURNING *`,
          [command.close_outcome, p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      const event = randomUUID();
      await c.query(
        `INSERT INTO ppo.opportunity_events(id,workspace_id,company_id,opportunity_id,created_by,updated_by,operation_id,opportunity_version,event_type,pipeline_definition_id,from_stage,to_stage,next_activity_id,identification_activity_id,reason,need_summary,qualification_note,record_snapshot,created_at,close_outcome,lost_reason,acceptance_evidence)
      SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,'OpportunityOutcomeRecorded',pipeline_definition_id,stage_id,stage_id,next_activity_id,identification_activity_id,$4,need_summary,qualification_note,ppo.crm_record_snapshot(o),updated_at,close_outcome,$5,$6 FROM ppo.opportunities o WHERE workspace_id=$7 AND id=$8`,
        [
          event,
          p.actor_id,
          command.operation_id,
          command.reason,
          command.lost_reason,
          command.acceptance_evidence,
          p.workspace_id,
          id,
        ],
      );
      if (command.close_outcome === "Won")
        await c.query(
          `INSERT INTO ppo.opportunity_handovers_due(workspace_id,company_id,opportunity_id,outcome_event_id,opportunity_version,owner_id,created_by,created_at)
        SELECT workspace_id,company_id,id,$1,version,owner_id,$2,updated_at FROM ppo.opportunities WHERE workspace_id=$3 AND id=$4`,
          [event, p.actor_id, p.workspace_id, id],
        );
      return {
        ...o,
        state: command.close_outcome,
        audit_details: {
          previous_version: old.version,
          close_outcome: command.close_outcome,
          outcome_event_id: event,
        },
      };
    },
    "Opportunity",
    "OpportunityOutcomeRecorded",
  );
}
