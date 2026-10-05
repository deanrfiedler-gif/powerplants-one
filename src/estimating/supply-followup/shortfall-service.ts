import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import { supplyRecord } from "../../supply/context";
import { allocationCommand } from "../../supply/validation";
import {
  reductionCommand,
  allocationChanges,
  type AllocationEffectCommand,
} from "../../supply/reductions";
import { conversionAuthority, conversionContext } from "../conversion/context";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { releaseHash } from "../release/context";
import { dispositionHash } from "../disposition/context";
import { followupContext, followupOwner } from "./context";
import { followupConflict } from "./authority";
import {
  shortfallProposalInput,
  shortfallReceivingInput,
} from "./shortfall-input";
import {
  shortfallDependencies,
  shortfallEffects,
  shortfallEvidenceAuthority,
  shortfallCommandAuthority,
  shortfallOriginalAuthority,
  type ShortfallEvent,
} from "./shortfall-context";
import { effectOwner, currentEvidenceChecked } from "./receipt-context";

type Input =
  | ReturnType<typeof shortfallProposalInput>
  | ReturnType<typeof shortfallReceivingInput>;
async function execute(p: Principal, id: string, input: Input) {
  return sharedOperation(
    p,
    input,
    `QuoteSupply:${input.action}`,
    async (c) => {
      const source = await conversionAuthority(
        c,
        p,
        id,
        input.action === "ShortfallPropose",
      );
      await supplyRecord(
        c,
        p,
        input.target_id,
        input.action === "ShortfallPropose"
          ? "supply.coordinate"
          : "supply.read",
      );
      // New operations get complete current/historical authority in followupContext
      // before mutation. Replays authorise the exact retained original before its shortfall.
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.quote_supply_shortfall_events WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, input.operation_id],
          )
        ).rowCount
      )
        await shortfallOriginalAuthority(c, p, id, input.operation_id);
      return source;
    },
    async (c, authorised) => {
      const context = await conversionContext(c, p, id, authorised);
      const t = await followupContext(c, p, id, input.target_id, { context });
      const checked = currentEvidenceChecked(t.basis);
      expected(t.sequence, input.expected_sequence);
      if (
        input.execution_id !== t.execution_id ||
        input.basis_hash !== t.basis_hash
      )
        followupConflict(
          "Compare current quotation and shared Supply evidence before saving.",
        );
      if (
        releaseHash((await draftBytes(p, id)).manifest) !==
        t.basis.conversion.output_hash
      )
        followupConflict("Original issued output is unavailable or changed.");
      if (
        !t.referral ||
        input.referral_id !== t.referral.id ||
        t.receiving?.decision !== "Accepted"
      )
        followupConflict(
          "The current exact Supply referral must be accepted for review first.",
        );
      const state = t.allocation_shortfall;
      const eventId = randomUUID();
      let proposalId: string = eventId,
        demandId: string | null = null,
        ownerId = p.actor_id;
      let command: AllocationEffectCommand,
        proposalHash: string,
        deps: ShortfallEvent["dependencies"],
        decision: ShortfallEvent["decision"];
      if (input.action === "ShortfallPropose") {
        if (t.referral.owner_id !== p.actor_id) throw unavailable();
        await followupOwner(c, p, p.actor_id, t.basis, { context, checked });
        if (
          input.receiving_id !== t.receiving.id ||
          input.predecessor_id !== (state.proposal?.id ?? null)
        )
          followupConflict(
            "Use the current acceptance and retain the latest proposal as predecessor.",
          );
        const candidate = state.candidates.find(
          (x) => x.correction.id === input.correction_id,
        );
        if (!candidate)
          followupConflict(
            "Select an applied Receipt correction with a current shared Shipment capacity shortfall.",
          );
        const competing = (
          await c.query(
            `SELECT p.id FROM ppo.quote_supply_shortfall_events p
          WHERE p.workspace_id=$1 AND p.target_id<>$2 AND p.action='ShortfallPropose' AND p.command->>'supply_id'=$3
          AND p.id=(SELECT id FROM ppo.quote_supply_shortfall_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='ShortfallPropose' ORDER BY sequence DESC LIMIT 1)
          AND p.referral_id=(SELECT id FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1)
          AND 'Accepted'=(SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1)
          AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND allocation_proposal_id=p.id AND action='Apply')`,
            [p.workspace_id, input.target_id, candidate.group.supply.id],
          )
        ).rowCount;
        if (competing)
          followupConflict(
            "Another accepted referral owns this shared Supply allocation set. Recover or return original work before replacement.",
          );
        deps = await shortfallDependencies(c, p, t.basis, candidate.correction);
        const operation = randomUUID();
        const changes = input.reductions.map((x) => {
          const a = deps.group.allocations.find(
            (a) => a.id === x.allocation_id,
          );
          const d = deps.group.demands.find(
            (d) => d.record.id === a?.demand_id,
          );
          if (!a || !d)
            followupConflict(
              "Select existing allocations on the exact shortfall Supply.",
            );
          return allocationCommand({
            schema_version: 1,
            operation_id: operation,
            reason: input.reason,
            id: a.id,
            expected_version: a.version,
            demand_id: a.demand_id,
            supply_id: a.supply_id,
            demand_version: d.record.version,
            supply_version: deps.group.supply.version,
            quantity: x.quantity,
            unit: a.unit,
            basis: a.basis,
          });
        });
        command =
          changes.length === 1
            ? changes[0]
            : reductionCommand({
                schema_version: 1,
                operation_id: operation,
                reason: input.reason,
                supply_id: deps.group.supply.id,
                supply_version: deps.group.supply.version,
                changes,
              });
        const effects = shortfallEffects(deps, command);
        if (effects.holds.length) followupConflict(effects.holds.join(" "));
        decision = "Proposed";
        proposalHash = dispositionHash({
          basis: t.basis,
          dependencies: deps,
          command,
          referral_id: t.referral.id,
          receiving_id: t.receiving.id,
        });
      } else {
        const proposal = state.proposal;
        if (
          !proposal ||
          proposal.id !== input.proposal_id ||
          proposal.proposal_hash !== input.proposal_hash
        )
          followupConflict(
            "Receive the latest exact Allocation shortfall proposal.",
          );
        if (state.holds.length) followupConflict(state.holds.join(" "));
        const prior = state.required.find(
          (x) => x.demand.id === input.demand_id,
        )?.decision;
        if (input.predecessor_id !== (prior?.id ?? null))
          followupConflict(
            "Retain the latest affected-demand decision as predecessor.",
          );
        if (
          !allocationChanges(proposal.command).some(
            (a) => a.demand_id === input.demand_id,
          )
        )
          followupConflict(
            "Only a changed Demand receives this allocation proposal.",
          );
        const owner = await effectOwner(
          c,
          p,
          proposal,
          input.demand_id,
          checked,
        );
        if (owner.actor_id !== p.actor_id) throw unavailable();
        if (
          t.events.some(
            (e) =>
              e.action === "Apply" && e.allocation_proposal_id === proposal.id,
          )
        )
          followupConflict(
            "This proposal has been applied; retain its decisions and create separately reviewed successor evidence.",
          );
        proposalId = proposal.id;
        demandId = input.demand_id;
        ownerId = owner.actor_id;
        command = proposal.command;
        proposalHash = proposal.proposal_hash;
        deps = state.dependencies!;
        decision = input.decision;
      }
      const e = {
        id: eventId,
        workspace_id: p.workspace_id,
        revision_id: id,
        target_id: input.target_id,
        execution_id: t.execution_id,
        sequence: state.sequence + 1,
        action: input.action,
        referral_id: t.referral.id,
        receiving_id: t.receiving.id,
        proposal_id: proposalId,
        predecessor_id: input.predecessor_id,
        demand_id: demandId,
        owner_id: ownerId,
        decision,
        basis: t.basis,
        basis_hash: t.basis_hash,
        dependencies: deps,
        dependency_hash: dispositionHash(deps),
        proposal_hash: proposalHash,
        command,
        reason: input.reason,
        evidence: input.evidence,
        created_by: p.actor_id,
        operation_id: input.operation_id,
      };
      await shortfallEvidenceAuthority(c, p, e as ShortfallEvent, checked);
      if (input.action === "ShortfallPropose")
        await shortfallCommandAuthority(c, p, e as ShortfallEvent, checked);
      const columns = Object.keys(e),
        values = Object.values(e);
      const saved = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_supply_shortfall_events (${columns.join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")}) RETURNING created_at`,
          values,
        )
      ).rows[0];
      return {
        id,
        version: e.sequence,
        state:
          decision === "Proposed"
            ? "AllocationReductionProposed"
            : `AllocationEffect${decision}`,
        updated_at: saved.created_at,
        audit_details: {
          shortfall_event_id: e.id,
          proposal_id: proposalId,
          target_id: input.target_id,
          demand_id: demandId,
          referral_id: t.referral.id,
          synthetic_only: true,
        },
      };
    },
    "DraftQuoteRevision",
    "QuotationSupplyRecorded",
  );
}
export const proposeShortfall = (p: Principal, id: string, value: unknown) =>
  execute(p, id, shortfallProposalInput(id, value));
export const receiveAllocationEffect = (
  p: Principal,
  id: string,
  value: unknown,
) => execute(p, id, shortfallReceivingInput(id, value));
