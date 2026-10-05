import {
  shortfallHistory,
  shortfallAvailable,
  acceptedShortfall,
  shortfallCommandAuthority,
} from "./shortfall-context";
import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import {
  sharedOperation,
  recordOperation,
  type OperationReceipt,
} from "../../platform/operations";
import {
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
} from "../../activities/activities";
import { endOfLocalDay } from "../../activities/work-view";
import { supplyRecord } from "../../supply/context";
import { allocationCommand, factCommand } from "../../supply/validation";
import {
  allocateInTransaction,
  reduceAllocationsInTransaction,
  recordFactInTransaction,
} from "../../supply/commands";
import { reservationDependencies } from "./dependency";
import { decimal } from "../../supply/model";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { releaseHash } from "../release/context";
import { dispositionHash, dispositionTarget } from "../disposition/context";
import { conversionAuthority, conversionContext } from "../conversion/context";
import { followupBasis, followupContext, followupOwner } from "./context";
import {
  followupConflict,
  followupHistory,
  followupEvidenceAuthority,
} from "./authority";
import {
  referralInput,
  receivingInput,
  reviewInput,
  applyInput,
} from "./validation";
import type { FollowupEvent } from "./model";
import {
  acceptedReceipt,
  receiptCommandAuthority,
  receiptHistory,
  receiptAvailable,
} from "./receipt-context";
type Input =
  | ReturnType<typeof referralInput>
  | ReturnType<typeof receivingInput>
  | ReturnType<typeof reviewInput>
  | ReturnType<typeof applyInput>;
async function execute(p: Principal, id: string, input: Input) {
  return sharedOperation(
    p,
    input,
    `QuoteSupply:${input.action}`,
    async (c) => {
      await conversionAuthority(c, p, id, true);
      await supplyRecord(c, p, input.target_id, "supply.coordinate");
      const checked = {
        revisions: new Set([id]),
        records: new Set([input.target_id]),
        credits: new Set<string>(),
      };
      await followupHistory(c, p, input.target_id, checked);
      const originals = await receiptHistory(c, p, input.target_id, checked);
      const original = (
        await c.query<FollowupEvent>(
          "SELECT * FROM ppo.quote_supply_events WHERE workspace_id=$1 AND created_by=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, input.operation_id],
        )
      ).rows[0];
      if (original?.allocation_proposal_id) {
        const proposal = (
          await shortfallHistory(c, p, input.target_id, checked)
        ).find((e) => e.id === original.allocation_proposal_id);
        if (!proposal) throw unavailable();
        await shortfallCommandAuthority(c, p, proposal);
      }
      if (original?.receipt_proposal_id) {
        const proposal = originals.find(
          (e) => e.id === original.receipt_proposal_id,
        );
        if (!proposal) throw unavailable();
        await receiptCommandAuthority(c, p, proposal);
      }
    },
    async (c) => {
      const t = await followupContext(c, p, id, input.target_id);
      expected(t.sequence, input.expected_sequence);
      if (
        input.execution_id !== t.execution_id ||
        input.basis_hash !== t.basis_hash
      )
        followupConflict(
          "Compare the exact current exception and Supply position before saving.",
        );
      if (
        releaseHash((await draftBytes(p, id)).manifest) !==
        t.basis.conversion.output_hash
      )
        followupConflict("Original issued output is unavailable or changed.");
      const eventId = randomUUID();
      let referralId: string = eventId,
        predecessor: string | null = null,
        receivingId: string | null = null,
        reviewId: string | null = null;
      let owner: string,
        due: string | null,
        dateNeeded: boolean,
        next: string,
        activityId: string;
      let decision: FollowupEvent["decision"],
        cmd: FollowupEvent["command"] = null,
        reviewHash: string | null = null,
        nativeReceipt: OperationReceipt | null = null;
      let basis = t.basis;
      let allocationProposalId: string | null = null;
      let receiptProposalId: string | null = null;
      let effectReceivingIds: string[] = [];
      if (input.action === "Refer") {
        const disposition = await dispositionTarget(
          c,
          p,
          await conversionContext(c, p, id),
          input.target_id,
        );
        if (
          disposition.status !== "Review required" &&
          !t.allocation_shortfall.candidates.length
        )
          followupConflict(
            "This exact quotation exception is already resolved or unchanged. Reassess current evidence before referral.",
          );
        if (!t.can_refer || input.predecessor_id !== (t.referral?.id ?? null))
          followupConflict(
            "Recover or finish the existing referral first. A replacement must explicitly follow a returned/held acknowledgement or applied outcome.",
          );
        owner = input.owner_id;
        due = input.due_date;
        dateNeeded = input.date_needed;
        next = input.next_action;
        await followupOwner(c, p, owner, basis);
        predecessor = input.predecessor_id;
        decision = "Requested";
        activityId = randomUUID();
        const r = basis.conversion.target;
        const activity: ActivityInput = {
          id: activityId,
          company_id: r.company_id,
          site_id: r.site_id,
          kind: "MaterialAction",
          owner_id: owner,
          summary:
            "Review restricted quotation-conversion evidence in the Supply follow-up workspace. Activity completion does not resolve the quotation exception.",
          due_at: due ? endOfLocalDay(due, r.data.timezone!) : null,
          due_needed: dateNeeded,
          access_class: "RestrictedService",
          links: [{ object_type: "Site", object_id: r.site_id! }],
        };
        await authoriseActivityInput(c, p, activity);
        await insertActivity(c, p, activity);
      } else {
        const referral = t.referral;
        if (!referral || input.referral_id !== referral.id)
          followupConflict(
            "Use the current exact referral; prior referrals remain historical.",
          );
        if (referral.owner_id !== p.actor_id) throw unavailable();
        const ownerPrincipal = await followupOwner(
          c,
          p,
          referral.owner_id,
          basis,
        );
        await followupEvidenceAuthority(c, ownerPrincipal, referral);
        referralId = referral.id;
        owner = referral.owner_id;
        due = referral.due_date;
        dateNeeded = referral.date_needed;
        next = referral.next_action;
        activityId = referral.activity_id;
        if (input.action === "Receive") {
          if (input.predecessor_id !== (t.receiving?.id ?? null))
            followupConflict(
              "Name the latest acknowledgement when correcting receiving.",
            );
          decision = input.decision;
          predecessor = input.predecessor_id;
        } else if (input.action === "Review") {
          if (
            t.receiving?.decision !== "Accepted" ||
            input.receiving_id !== t.receiving.id
          )
            followupConflict(
              "The receiving owner must explicitly accept this referral for review first.",
            );
          if (input.predecessor_id !== (t.review?.id ?? null))
            followupConflict(
              "Name the latest review when correcting or replacing it.",
            );
          decision = input.decision;
          predecessor = input.predecessor_id;
          receivingId = input.receiving_id;
          if (decision === "AdjustAllocation") {
            if (t.allocation_shortfall.candidates.length)
              followupConflict(
                "This Receipt-derived shared shortfall requires a complete independently received allocation proposal.",
              );
            if (t.adjustment_holds.length)
              followupConflict(t.adjustment_holds.join(" "));
            const a = basis.conversion.dependencies.allocations.find(
              (a) => a.id === input.allocation_id,
            );
            if (!a || input.quantity === null)
              followupConflict(
                "Select an existing allocation of this exact demand.",
              );
            if (decimal(a.quantity) === decimal(input.quantity))
              followupConflict(
                "Quantity is unchanged. Record explicit retention instead.",
              );
            const s = await supplyRecord(
              c,
              p,
              a.supply_id,
              "supply.coordinate",
            );
            cmd = allocationCommand({
              operation_id: randomUUID(),
              schema_version: 1,
              reason: input.reason,
              id: a.id,
              expected_version: a.version,
              demand_id: a.demand_id,
              supply_id: a.supply_id,
              demand_version: basis.conversion.target.version,
              supply_version: s.version,
              quantity: input.quantity,
              unit: a.unit,
              basis: a.basis,
            });
            // Preview conservation with exact arithmetic; the original SQL guards
            // recheck at execution, including complete usable and picked evidence.
            const group = basis.position.find((g) => g.supply.id === s.id)!;
            const capacity = a.basis === "Incoming" ? s.quantity : group.usable;
            const supplyTotal = group.allocations
              .filter((x) => x.basis === a.basis && x.id !== a.id)
              .reduce(
                (n, x) => n + decimal(x.quantity),
                decimal(input.quantity),
              );
            const demandTotal = basis.conversion.dependencies.allocations
              .filter((x) => x.basis === a.basis && x.id !== a.id)
              .reduce(
                (n, x) => n + decimal(x.quantity),
                decimal(input.quantity),
              );
            if (
              capacity === null ||
              supplyTotal > decimal(capacity) ||
              demandTotal > decimal(basis.conversion.target.quantity)
            )
              followupConflict(
                "Proposed allocation exceeds the exact evidenced shared supply or demand capacity.",
              );
          }
          if (decision === "ReconcileReservationOutcome") {
            const dependency = reservationDependencies(basis).find(
              (x) => x.fact.id === input.dependency_id,
            );
            if (!dependency)
              followupConflict(
                "Select the exact current external reservation outcome.",
              );
            if (dependency.holds.length)
              followupConflict(dependency.holds.join(" "));
            cmd = {
              ...factCommand({
                operation_id: randomUUID(),
                schema_version: 1,
                reason: input.reason,
                id: randomUUID(),
                expected_version: basis.conversion.target.version,
                kind: "ExternalOutcome",
                predecessor_id: dependency.fact.id,
                data: {
                  source_operation: dependency.fact.data.source_operation,
                  effect: "Reservation",
                  state: input.outcome_state,
                  lookup_evidence: input.lookup_evidence,
                },
                completeness: "Complete",
                observed_at: input.observed_at,
                evidence: input.reason,
                attachment_id: null,
              }),
              record_id: input.target_id,
            };
          }
          if (decision === "ReduceAllocations") {
            const received = acceptedShortfall(
              t.allocation_shortfall,
              input.allocation_proposal_id!,
            );
            await shortfallCommandAuthority(c, p, received.proposal);
            allocationProposalId = received.proposal.id;
            effectReceivingIds = received.receiving_ids;
            cmd = received.proposal.command;
          }
          if (decision === "CorrectReceipt") {
            const received = acceptedReceipt(
              t.receipt_correction,
              input.receipt_proposal_id!,
            );
            await receiptCommandAuthority(c, p, received.proposal);
            receiptProposalId = received.proposal.id;
            effectReceivingIds = received.receiving_ids;
            cmd = received.proposal.command;
          }
          reviewHash = dispositionHash({
            basis,
            referral_id: referralId,
            receiving_id: receivingId,
            decision,
            command: cmd,
            reason: input.reason,
            evidence: input.evidence,
            ...(allocationProposalId
              ? {
                  allocation_proposal_id: allocationProposalId,
                  effect_receiving_ids: effectReceivingIds,
                }
              : {}),
            ...(receiptProposalId
              ? {
                  receipt_proposal_id: receiptProposalId,
                  effect_receiving_ids: effectReceivingIds,
                }
              : {}),
          });
        } else {
          const review = t.review;
          if (
            !review ||
            review.id !== input.review_id ||
            review.review_hash !== input.review_hash ||
            !t.can_apply
          )
            followupConflict(
              t.review_holds.join(" ") ||
                "Use the exact applicable, unapplied review.",
            );
          reviewId = review.id;
          receivingId = review.receiving_id;
          decision = review.decision;
          cmd = review.command;
          reviewHash = review.review_hash;
          allocationProposalId = review.allocation_proposal_id ?? null;
          receiptProposalId = review.receipt_proposal_id ?? null;
          effectReceivingIds = review.effect_receiving_ids ?? [];
          if (cmd) {
            // Reserved operation is committed only here with its owning review.
            const nativeCommand =
              "record_id" in cmd
                ? `Supply:Fact:${cmd.kind}`
                : "changes" in cmd
                  ? "Supply:ReduceAllocations"
                  : "Supply:Allocate";
            let saved;
            if ("record_id" in cmd) {
              const { record_id, ...fact } = cmd;
              saved = await recordFactInTransaction(c, p, record_id, fact);
            } else if ("changes" in cmd)
              saved = await reduceAllocationsInTransaction(c, p, cmd);
            else saved = await allocateInTransaction(c, p, cmd);
            nativeReceipt = await recordOperation(
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
              releaseHash({ command: nativeCommand, ...cmd }),
              {
                command: nativeCommand,
                record_version: saved.version,
                ...("record_id" in cmd
                  ? { fact_id: cmd.id, predecessor_id: cmd.predecessor_id }
                  : "changes" in cmd
                    ? { allocation_ids: cmd.changes.map((x) => x.id) }
                    : { allocation_id: cmd.id }),
                supply_review_id: review.id,
                supply_outcome_id: eventId,
                referral_id: referralId,
                conversion_execution_id: t.execution_id,
                source_line_id: basis.conversion.line_id,
              },
            );
          }
          basis = await followupBasis(c, p, id, input.target_id);
        }
      }
      const basisHash = dispositionHash(basis);
      const receiptSchema = await receiptAvailable(c);
      const shortfallSchema = await shortfallAvailable(c);
      const row = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_supply_events
      (id,workspace_id,revision_id,execution_id,target_id,sequence,action,referral_id,predecessor_id,receiving_id,review_id,decision,basis,basis_hash,review_hash,command,owner_id,due_date,date_needed,next_action,activity_id,reason,evidence,created_by,operation_id,native_receipt${receiptSchema ? ",receipt_proposal_id,effect_receiving_ids" : ""}${shortfallSchema ? ",allocation_proposal_id" : ""})
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26${receiptSchema ? ",$27,$28" : ""}${shortfallSchema ? ",$29" : ""}) RETURNING created_at`,
          [
            eventId,
            p.workspace_id,
            id,
            t.execution_id,
            input.target_id,
            t.sequence + 1,
            input.action,
            referralId,
            predecessor,
            receivingId,
            reviewId,
            decision,
            basis,
            basisHash,
            reviewHash,
            cmd,
            owner,
            due,
            dateNeeded,
            next,
            activityId,
            input.reason,
            input.evidence,
            p.actor_id,
            input.operation_id,
            nativeReceipt,
            ...(receiptSchema
              ? [receiptProposalId, JSON.stringify(effectReceivingIds)]
              : []),
            ...(shortfallSchema ? [allocationProposalId] : []),
          ],
        )
      ).rows[0];
      // Recheck frozen and current dependency authority after native effects.
      await followupHistory(c, p, input.target_id);
      return {
        id,
        version: t.sequence + 1,
        state:
          input.action === "Refer"
            ? "SupplyReferred"
            : input.action === "Apply"
              ? decision === "ReduceAllocations"
                ? "AllocationsReduced"
                : decision === "AdjustAllocation"
                  ? "AllocationAdjusted"
                  : decision === "ReconcileReservationOutcome"
                    ? "ReservationOutcomeReconciled"
                    : decision === "CorrectReceipt"
                      ? "ReceiptEvidenceCorrected"
                      : decision === "Hold"
                        ? "SupplyHeld"
                        : "SupplyRetained"
              : decision,
        updated_at: row.created_at,
        audit_details: {
          supply_event_id: eventId,
          target_id: input.target_id,
          referral_id: referralId,
          review_id: reviewId,
          execution_id: t.execution_id,
          synthetic_only: true,
        },
      };
    },
    "DraftQuoteRevision",
    "QuotationSupplyRecorded",
  );
}
export const referSupply = (p: Principal, id: string, value: unknown) =>
  execute(p, id, referralInput(id, value));
export const receiveSupply = (p: Principal, id: string, value: unknown) =>
  execute(p, id, receivingInput(id, value));
export const reviewSupply = (p: Principal, id: string, value: unknown) =>
  execute(p, id, reviewInput(id, value));
export const applySupply = (p: Principal, id: string, value: unknown) =>
  execute(p, id, applyInput(id, value));
