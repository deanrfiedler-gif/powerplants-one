import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError } from "../../platform/errors";
import { scopedOwner } from "../../shared/authority";
import { supplyRecord } from "../../supply/context";
import { conversionContext, conversionAuthority } from "../conversion/context";
import {
  targetBasis,
  dispositionHash,
  dispositionHistoryAuthority,
} from "../disposition/context";
import { allocationPosition } from "./position";
import { followupHistory, followupEvidenceAuthority } from "./authority";
import type { FollowupBasis } from "./model";
import { reservationDependencies } from "./dependency";
import {
  receiptState,
  acceptedReceipt,
  receiptCommandAuthority,
  receiptHistory,
} from "./receipt-context";

export async function followupOwner(
  c: QueryClient,
  p: Principal,
  ownerId: string,
  basis: FollowupBasis,
) {
  const target = basis.conversion.target;
  const owner = await scopedOwner(
    c,
    p,
    ownerId,
    target.company_id,
    target.site_id ?? undefined,
    "supply.coordinate",
  );
  await scopedOwner(
    c,
    p,
    ownerId,
    target.company_id,
    target.site_id ?? undefined,
    "activity.edit",
  );
  await conversionAuthority(
    c,
    owner,
    basis.conversion.original_evidence.receiving.revision_id,
    true,
  );
  await allocationPosition(c, owner, target.id);
  return owner;
}
export async function followupContext(
  c: QueryClient,
  p: Principal,
  id: string,
  target: string,
  known?: {
    context: Awaited<ReturnType<typeof conversionContext>>;
    basis: FollowupBasis["conversion"];
    resolved: boolean;
  },
) {
  const d = known?.context ?? (await conversionContext(c, p, id));
  if (!known) await dispositionHistoryAuthority(c, p, target);
  const conversion = known?.basis ?? (await targetBasis(c, p, d, target));
  const disposition =
    (
      await c.query<{ id: string; sequence: number; decision: string }>(
        "SELECT id,sequence,decision FROM ppo.quote_disposition_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence DESC LIMIT 1",
        [p.workspace_id, target],
      )
    ).rows[0] ?? null;
  const basis: FollowupBasis = {
    policy: "SYN-ES07-03",
    conversion,
    position: await allocationPosition(c, p, target),
    disposition,
  };
  const basisHash = dispositionHash(basis),
    events = await followupHistory(c, p, target);
  const referral = events.filter((e) => e.action === "Refer").at(-1) ?? null;
  const current = events.filter((e) => e.referral_id === referral?.id);
  const receiving =
    current.filter((e) => e.action === "Receive").at(-1) ?? null;
  const review = current.filter((e) => e.action === "Review").at(-1) ?? null;
  const applied = current.filter((e) => e.action === "Apply").at(-1) ?? null;
  const receiptCorrection = await receiptState(
    c,
    p,
    basis,
    referral,
    receiving,
  );
  const r = conversion.target;
  const holds: string[] = [];
  if (r.kind !== "Demand" || r.data.demand_class !== "Approved")
    holds.push(
      "Native allocation adjustment requires already Approved demand; this workflow cannot change demand class.",
    );
  if (!conversion.dependencies.allocations.length)
    holds.push(
      "There is no existing allocation to adjust. New allocations are outside this follow-up.",
    );
  if (conversion.dependencies.children.length)
    holds.push(
      "Retained return or custody children require their owning Supply workflow; allocation adjustment is held.",
    );
  if (
    conversion.dependencies.facts.some(
      (f) => !["Assessment", "Impact"].includes(f.kind),
    )
  )
    holds.push(
      "Consequential purchasing, reservation, fulfilment or external-outcome evidence requires its owning Supply workflow; allocation adjustment is held.",
    );
  const reviewHolds: string[] = [];
  if (review) {
    if (
      receiving?.decision !== "Accepted" ||
      review.receiving_id !== receiving.id
    )
      reviewHolds.push(
        "The exact receiving acceptance was replaced or is held/returned.",
      );
    if (review.basis_hash !== basisHash)
      reviewHolds.push(
        "Relevant quotation, disposition, demand, allocation, shared supply or dependency evidence changed. Compare and replace the review.",
      );
    if (review.decision === "AdjustAllocation") reviewHolds.push(...holds);
    if (review.decision === "CorrectReceipt") {
      try {
        const received = acceptedReceipt(
          receiptCorrection,
          review.receipt_proposal_id!,
        );
        if (
          dispositionHash(received.receiving_ids) !==
          dispositionHash(review.effect_receiving_ids)
        )
          reviewHolds.push(
            "Affected-demand receiving changed after review. Record a fresh immutable review.",
          );
        await receiptCommandAuthority(c, p, received.proposal);
      } catch (e) {
        if (!(e instanceof AppError)) throw e;
        reviewHolds.push(e.message);
      }
    }
    try {
      const owner = await followupOwner(c, p, referral!.owner_id, basis);
      await followupEvidenceAuthority(c, owner, review);
      if (review.decision === "CorrectReceipt" && receiptCorrection.proposal)
        await receiptCommandAuthority(c, owner, receiptCorrection.proposal);
      if (review.command && "supply_id" in review.command)
        await supplyRecord(
          c,
          owner,
          review.command.supply_id,
          "supply.coordinate",
        );
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      reviewHolds.push(
        "The receiving owner's current source or Supply permissions are unavailable.",
      );
    }
  }
  const sourceChanged =
    dispositionHash(conversion.source) !==
    dispositionHash(conversion.original_source);
  const exception = sourceChanged || r.version !== 1 || !!disposition;
  const heldTarget =
    r.data.demand_class === "Approved" ||
    conversion.dependencies.allocations.length > 0 ||
    conversion.dependencies.children.length > 0 ||
    conversion.dependencies.facts.some(
      (f) => !["Assessment", "Impact"].includes(f.kind),
    ) ||
    disposition?.decision === "Hold";
  const completed = !!review && applied?.review_id === review.id;
  const canReplace =
    !referral ||
    receiving?.decision === "Returned" ||
    receiving?.decision === "Held" ||
    completed;
  const outcome =
    current
      .filter(
        (e) =>
          e.action === "Apply" ||
          (e.action === "Receive" && ["Returned", "Held"].includes(e.decision)),
      )
      .at(-1) ?? null;
  let canWrite = false;
  try {
    await conversionAuthority(c, p, id, true);
    canWrite = true;
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
  }
  return {
    revision_id: id,
    target_id: target,
    execution_id: conversion.execution_id,
    basis,
    basis_hash: basisHash,
    events,
    sequence: events.at(-1)?.sequence ?? 0,
    referral,
    receiving,
    review,
    applied,
    outcome,
    status: !referral
      ? "Not referred"
      : receiving?.decision === "Returned"
        ? "Returned"
        : receiving?.decision === "Held"
          ? "Continuing hold"
          : completed
            ? review.decision === "Hold"
              ? "Continuing hold"
              : review.decision === "Retain"
                ? "Position retained"
                : review.decision === "ReconcileReservationOutcome"
                  ? "Reservation outcome reconciled"
                  : review.decision === "CorrectReceipt"
                    ? "Receipt evidence corrected"
                    : "Allocation adjusted"
            : receiving?.decision === "Accepted"
              ? "Accepted for review"
              : "Awaiting owner",
    adjustment_holds: holds,
    reservation_dependencies: reservationDependencies(basis),
    receipt_correction: receiptCorrection,
    review_holds: reviewHolds,
    can_refer: exception && !known?.resolved && heldTarget && canReplace,
    can_apply: !!review && !completed && !reviewHolds.length,
    can_write: canWrite,
    outcome_current:
      !!outcome &&
      dispositionHash({
        conversion: outcome.basis.conversion,
        position: outcome.basis.position,
      }) === dispositionHash({ conversion, position: basis.position }),
  };
}
export type FollowupDetail = Awaited<ReturnType<typeof followupContext>>;
// Used by ES-07 to bind the returned outcome and actual current shared position.
// It does not call dispositionTarget, avoiding a self-referential evidence hash.
export async function returnedSupplyBasis(
  c: QueryClient,
  p: Principal,
  target: string,
) {
  const events = await followupHistory(c, p, target);
  if (!events.length) return null;
  const last = events.at(-1)!;
  const receiptEvents = await receiptHistory(c, p, target);
  const outcome = events
    .filter(
      (e) =>
        e.action === "Apply" ||
        (e.action === "Receive" && ["Returned", "Held"].includes(e.decision)),
    )
    .at(-1);
  return {
    event_id: last.id,
    referral_id: last.referral_id,
    decision: last.decision,
    outcome_id: outcome?.id ?? null,
    outcome_hash: outcome?.basis_hash ?? null,
    position: await allocationPosition(c, p, target),
    ...(receiptEvents.length
      ? { receipt_event_id: receiptEvents.at(-1)!.id }
      : {}),
  };
}
