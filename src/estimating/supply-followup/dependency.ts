import type { FollowupBasis } from "./model";
import type { Fact } from "../../supply/model";

// Reconcile one exact recorded external reservation outcome, never the external effect.
export function reservationDependencies(basis: FollowupBasis) {
  const facts = basis.conversion.dependencies.facts;
  return facts
    .filter(
      (f) => f.kind === "ExternalOutcome" && f.data.effect === "Reservation",
    )
    .map((fact) => ({ fact, holds: reservationHolds(facts, fact) }));
}
export function reservationHolds(facts: Fact[], fact: Fact) {
  const holds: string[] = [];
  if (
    fact.kind !== "ExternalOutcome" ||
    fact.data.effect !== "Reservation" ||
    fact.data.state !== "Unknown"
  )
    holds.push(
      "Select a current Unknown external reservation outcome; other evidence requires its owning Supply workflow.",
    );
  if (
    facts.some(
      (f) =>
        f.kind === "ExternalOutcome" &&
        f.data.state === "Unknown" &&
        f.id !== fact.id,
    )
  )
    holds.push(
      "Other unknown external outcomes on this demand require original-operation reconciliation in Supply before this action.",
    );
  return holds;
}
