import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import { supplyRecord } from "../../supply/context";
import { factCommand } from "../../supply/validation";
import { conversionAuthority } from "../conversion/context";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { releaseHash } from "../release/context";
import { dispositionHash } from "../disposition/context";
import { followupContext, followupOwner } from "./context";
import { followupConflict } from "./authority";
import { receiptProposalInput, receiptReceivingInput } from "./receipt-input";
import {
  receiptDependencies,
  receiptEffects,
  receiptHolds,
  receiptEvidenceAuthority,
  receiptCommandAuthority,
  receiptOriginalAuthority,
  effectOwner,
  type ReceiptEvent,
  type ReceiptCommand,
} from "./receipt-context";

type Input =
  | ReturnType<typeof receiptProposalInput>
  | ReturnType<typeof receiptReceivingInput>;
async function execute(p: Principal, id: string, input: Input) {
  return sharedOperation(
    p,
    input,
    `QuoteSupply:${input.action}`,
    async (c) => {
      await conversionAuthority(c, p, id, true);
      await supplyRecord(c, p, input.target_id, "supply.coordinate");
      // New operations get complete current/historical authority in followupContext
      // before mutation. Replays authorise the exact retained original before its receipt.
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.quote_supply_receipt_events WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, input.operation_id],
          )
        ).rowCount
      )
        await receiptOriginalAuthority(c, p, id, input.operation_id);
    },
    async (c) => {
      const t = await followupContext(c, p, id, input.target_id);
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
      const state = t.receipt_correction;
      const eventId = randomUUID();
      let proposalId: string = eventId,
        demandId: string | null = null,
        ownerId = p.actor_id;
      let command: ReceiptCommand,
        proposalHash: string,
        deps: ReceiptEvent["dependencies"],
        decision: ReceiptEvent["decision"];
      if (input.action === "ReceiptPropose") {
        if (t.referral.owner_id !== p.actor_id) throw unavailable();
        await followupOwner(c, p, p.actor_id, t.basis);
        if (
          input.receiving_id !== t.receiving.id ||
          input.predecessor_id !== (state.proposal?.id ?? null)
        )
          followupConflict(
            "Use the current acceptance and retain the latest proposal as predecessor.",
          );
        const candidate = state.candidates.find(
          (x) => x.fact.id === input.dependency_id,
        );
        if (!candidate)
          followupConflict(
            "Select one existing current Receipt on linked Supply; creation is outside this action.",
          );
        const holds = receiptHolds(
          t.basis.position.find((g) => g.supply.id === candidate.supply.id)!
            .facts,
        );
        if (holds.length) followupConflict(holds.join(" "));
        // A competing target cannot receive or reserve replacement work for this fact.
        const competing = (
          await c.query(
            `SELECT p.id FROM ppo.quote_supply_receipt_events p
        JOIN LATERAL (SELECT id FROM ppo.quote_supply_receipt_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='ReceiptPropose' ORDER BY sequence DESC LIMIT 1) latest ON latest.id=p.id
        JOIN LATERAL (SELECT id FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1) ref ON ref.id=p.referral_id
        JOIN LATERAL (SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1) recv ON recv.decision='Accepted'
        WHERE p.workspace_id=$1 AND p.target_id<>$2 AND p.command->>'predecessor_id'=$3
        AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events a WHERE a.workspace_id=p.workspace_id AND a.receipt_proposal_id=p.id AND a.action='Apply')`,
            [p.workspace_id, input.target_id, candidate.fact.id],
          )
        ).rowCount;
        if (competing)
          followupConflict(
            "Another accepted referral owns active correction work on this Receipt. Recover or return that original before replacement work.",
          );
        deps = await receiptDependencies(c, p, t.basis, candidate.supply.id);
        command = {
          ...factCommand({
            schema_version: 1,
            operation_id: randomUUID(),
            reason: input.reason,
            id: randomUUID(),
            kind: "Receipt",
            expected_version: candidate.supply.version,
            predecessor_id: candidate.fact.id,
            data: input.data,
            completeness: input.completeness,
            observed_at: input.observed_at,
            evidence: input.fact_evidence,
            attachment_id: candidate.fact.attachment_id,
          }),
          record_id: candidate.supply.id,
        };
        receiptEffects(deps, command);
        if (
          dispositionHash({
            data: command.data,
            completeness: command.completeness,
            observed_at: command.observed_at,
            evidence: command.evidence,
          }) ===
          dispositionHash({
            data: candidate.fact.data,
            completeness: candidate.fact.completeness,
            observed_at: new Date(candidate.fact.observed_at).toISOString(),
            evidence: candidate.fact.evidence,
          })
        )
          followupConflict(
            "Receipt evidence is unchanged. Retain the reviewed position instead.",
          );
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
            "Receive the latest exact Receipt correction proposal.",
          );
        if (state.holds.length) followupConflict(state.holds.join(" "));
        const prior = state.required.find(
          (x) => x.demand.id === input.demand_id,
        )?.decision;
        if (input.predecessor_id !== (prior?.id ?? null))
          followupConflict(
            "Retain the latest affected-demand decision as predecessor.",
          );
        const owner = await effectOwner(c, p, proposal, input.demand_id);
        if (owner.actor_id !== p.actor_id) throw unavailable();
        if (
          t.events.some(
            (e) =>
              e.action === "Apply" && e.receipt_proposal_id === proposal.id,
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
      await receiptEvidenceAuthority(c, p, e as ReceiptEvent);
      if (input.action === "ReceiptPropose")
        await receiptCommandAuthority(c, p, e as ReceiptEvent);
      const columns = Object.keys(e),
        values = Object.values(e);
      const saved = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_supply_receipt_events (${columns.join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")}) RETURNING created_at`,
          values,
        )
      ).rows[0];
      return {
        id,
        version: e.sequence,
        state:
          decision === "Proposed"
            ? "ReceiptCorrectionProposed"
            : `ReceiptEffect${decision}`,
        updated_at: saved.created_at,
        audit_details: {
          receipt_event_id: e.id,
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
export const proposeReceipt = (p: Principal, id: string, value: unknown) =>
  execute(p, id, receiptProposalInput(id, value));
export const receiveReceiptEffect = (
  p: Principal,
  id: string,
  value: unknown,
) => execute(p, id, receiptReceivingInput(id, value));
