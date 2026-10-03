import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { sharedOperation, recordOperation } from "../../platform/operations";
import { scopedOwner } from "../../shared/authority";
import { invalid } from "../../shared/validation";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { releaseHash } from "../release/context";
import { recordCommand } from "../../supply/validation";
import { createSupplyRecordInTransaction } from "../../supply/commands";
import {
  conversionAuthority,
  conversionContext,
  conversionConflict,
} from "./context";
import {
  latestResolution,
  type ConversionEvent,
  type FrozenPlan,
  type PlanBasis,
} from "./model";
import {
  receivingInput,
  resolutionInput,
  planInput,
  executionInput,
  type ConversionInput,
} from "./validation";

function targetCommands(b: PlanBasis, now: Date, reason: string) {
  return b.lines.map((l) => {
    const id = randomUUID();
    return recordCommand({
      operation_id: randomUUID(),
      schema_version: 1,
      reason,
      id,
      kind: "Demand",
      company_id: b.target.company,
      site_id: b.target.site_id,
      reference: `SYN-PPO-SC-${id}`,
      title: l.label,
      item: l.item,
      unit: l.unit,
      quantity: l.quantity,
      owner_id: b.follow_up.owner_id,
      next_action: b.follow_up.next_action,
      completeness: "Complete",
      observed_at: now.toISOString(),
      source_reference: `ES-07 issue ${b.issue_id}; line ${l.line_id}; resolution ${l.resolution_id}`,
      external_key: {
        provider: b.target.provider,
        configuration: b.target.configuration,
        company: b.target.company,
        entity: b.target.entity,
        key: id,
      },
      data: {
        demand_class: "Forecast",
        origin_kind: "OtherApproved",
        origin_reference: `SYN-ES07-01 reviewed coordination plan; no work authority`,
        timezone: b.target.timezone,
        date_needed_reason:
          "Operational required date not established by synthetic receiving",
        source_revision: b.estimate_version_id,
        customer_id: b.target.customer_id,
        quote_reference: b.issue_id,
        handover_reference: b.receiving_id,
        technical_release: "Not established",
        material_release: "Not established",
      },
    });
  });
}
async function execute(p: Principal, id: string, input: ConversionInput) {
  return sharedOperation(
    p,
    input,
    `QuoteConversion:${input.action}`,
    (c) => conversionAuthority(c, p, id, true),
    async (c) => {
      const d = await conversionContext(c, p, id);
      expected(d.conversion_sequence, input.expected_sequence);
      const original = (
        await c.query(
          "SELECT * FROM ppo.quote_response_events WHERE workspace_id=$1 AND revision_id=$2 AND id=$3 AND action='Prepare' AND response_id=$4",
          [p.workspace_id, id, input.preparation_id, input.response_id],
        )
      ).rows[0];
      if (
        !original ||
        input.issue_id !== d.issue.id ||
        input.output_hash !== d.issue.output_hash
      )
        conversionConflict(
          "Name the exact ES-06 preparation, immutable issue/output and recorded response.",
        );
      if (
        input.action !== "Receive" &&
        (!d.state.preparedApplicable ||
          input.preparation_id !== d.state.preparation?.id ||
          input.response_id !== d.state.response?.id)
      )
        conversionConflict(
          "This preparation is held by the current response or issued successor.",
        );
      if (
        input.action === "Receive" &&
        input.decision === "Received" &&
        (!d.state.preparedApplicable ||
          input.preparation_id !== d.state.preparation?.id ||
          input.response_id !== d.state.response?.id)
      )
        conversionConflict(
          "Receive only the currently applicable exact preparation; retain an owned Held or Returned decision for incomplete evidence.",
        );
      // Every new consequential command verifies the original output. Held/Returned can record missing evidence.
      if (input.action !== "Receive" || input.decision === "Received") {
        if (
          releaseHash((await draftBytes(p, id)).manifest) !== input.output_hash
        )
          conversionConflict(
            "Original issued output is unavailable or changed.",
          );
      }
      const eventId = randomUUID(),
        sequence = d.conversion_sequence + 1;
      const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
        .rows[0].now;
      let receiving: ConversionEvent["receiving"] = null,
        resolution: ConversionEvent["resolution"] = null,
        plan: FrozenPlan | null = null,
        planHash: string | null = null,
        planId: string | null = null;
      const predecessor =
        "predecessor_id" in input ? input.predecessor_id : null;
      if (input.action === "Receive") {
        if (predecessor !== (d.receiving?.id ?? null))
          conversionConflict(
            "Explicitly name the preceding receiving decision when correcting it.",
          );
        await scopedOwner(
          c,
          p,
          input.owner_id,
          d.e.company_id,
          d.base.basis.recipient.site_id ?? undefined,
          "activity.edit",
        );
        receiving = {
          decision: input.decision,
          owner_id: input.owner_id,
          due_date: input.due_date,
          next_action: input.next_action,
        };
      } else if (input.action === "Resolve") {
        const source = d.source_lines.find(
          (l) => l.id === input.line_id && l.category === "Product",
        );
        if (!source)
          invalid("line_id", "Choose an exact included Product source line.");
        const previous = latestResolution(d.events, input.line_id);
        if (predecessor !== (previous?.id ?? null))
          conversionConflict(
            "Name the preceding resolution; original mappings remain immutable.",
          );
        if (input.company_id !== d.e.company_id)
          invalid(
            "company_id",
            "The native target must retain the exact source company.",
          );
        if (
          input.state === "OneOff" &&
          (input.unit !== source.unit || source.unit.length > 30)
        )
          invalid(
            "unit",
            "One-off resolution must retain a compatible exact source unit.",
          );
        resolution = {
          line_id: input.line_id,
          state: input.state,
          item_id: previous?.resolution?.item_id ?? randomUUID(),
          label: input.label,
          unit: input.unit,
          company_id: input.company_id,
          entity: input.entity,
          external_mapping: null,
        };
      } else if (input.action === "Plan") {
        if (d.executions.length)
          conversionConflict(
            "Downstream facts already exist. Recover originals; replacement creation requires a separate future disposition.",
          );
        if (predecessor !== (d.plan?.id ?? null))
          conversionConflict(
            "Name the exact preceding plan when replacing it.",
          );
        if (d.holds.length || !d.basis || d.basis_hash !== input.basis_hash)
          conversionConflict(
            d.holds.join(" ") ||
              "The reviewed target basis changed. Compare it before freezing a replacement.",
          );
        plan = {
          basis: d.basis,
          basis_hash: d.basis_hash!,
          commands: targetCommands(d.basis, now, input.reason),
        };
        planHash = releaseHash(plan);
      } else {
        planId = input.plan_id;
        if (d.executions.length)
          conversionConflict(
            "This quotation already created its downstream facts. Recover the original execution.",
          );
        if (
          !d.plan_applicable ||
          d.plan?.id !== planId ||
          d.plan.plan_hash !== input.plan_hash ||
          releaseHash(d.plan.plan) !== input.plan_hash
        )
          conversionConflict(
            "The exact reviewed plan is absent, replaced or held. No new target was created.",
          );
        const frozen = d.plan.plan!;
        for (let i = 0; i < frozen.commands.length; i++) {
          const cmd = frozen.commands[i],
            line = frozen.basis.lines[i];
          const saved = await createSupplyRecordInTransaction(c, p, cmd);
          await recordOperation(
            c,
            p,
            cmd,
            {
              id: saved.id,
              version: saved.version,
              state: "Recorded",
              updated_at: new Date(saved.updated_at),
            },
            "SupplyRecord",
            "SupplyRecorded",
            releaseHash({ command: "Supply:Create", ...cmd }),
            {
              command: "Supply:Create",
              record_version: saved.version,
              conversion_plan_id: planId,
              source_line_id: line.line_id,
            },
          );
          await c.query(
            `INSERT INTO ppo.quote_conversion_targets(workspace_id,quote_id,revision_id,plan_id,execution_id,line_id,target_id,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              p.workspace_id,
              d.q.quote_id,
              id,
              planId,
              eventId,
              line.line_id,
              saved.id,
              cmd.operation_id,
            ],
          );
        }
      }
      const saved = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_conversion_events
        (id,workspace_id,quote_id,revision_id,issue_id,response_id,preparation_id,sequence,action,predecessor_id,output_hash,receiving,resolution,plan,plan_hash,plan_id,evidence,reason,created_by,operation_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING created_at`,
          [
            eventId,
            p.workspace_id,
            d.q.quote_id,
            id,
            input.issue_id,
            input.response_id,
            input.preparation_id,
            sequence,
            input.action,
            predecessor,
            input.output_hash,
            receiving,
            resolution,
            plan,
            planHash,
            planId,
            input.evidence,
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      await conversionAuthority(c, p, id, true);
      return {
        id,
        version: sequence,
        state:
          receiving?.decision ??
          resolution?.state ??
          (input.action === "Plan" ? "Reviewed" : "Converted"),
        updated_at: saved.created_at,
        audit_details: {
          conversion_event_id: eventId,
          plan_id: planId,
          synthetic_only: true,
        },
      };
    },
    "DraftQuoteRevision",
    "QuotationConversionRecorded",
  );
}
export const receiveQuotation = (p: Principal, id: string, value: unknown) =>
  execute(p, id, receivingInput(id, value));
export const resolveQuotationItem = (
  p: Principal,
  id: string,
  value: unknown,
) => execute(p, id, resolutionInput(id, value));
export const reviewConversionPlan = (
  p: Principal,
  id: string,
  value: unknown,
) => execute(p, id, planInput(id, value));
export const executeConversion = (p: Principal, id: string, value: unknown) =>
  execute(p, id, executionInput(id, value));
