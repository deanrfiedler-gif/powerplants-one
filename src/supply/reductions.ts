import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
} from "../shared/validation";
import { allocationCommand } from "./validation";
import { decimal, quantity, type SupplyRecord, type Fact } from "./model";

export function reductionCommand(input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "supply_id",
    "supply_version",
    "changes",
  ]);
  const base = common(r);
  const supply_id = uuid(r.supply_id, "supply_id");
  const supply_version = version(r.supply_version);
  if (
    !Array.isArray(r.changes) ||
    r.changes.length < 2 ||
    r.changes.length > 100
  )
    invalid(
      "changes",
      "An atomic reduction requires 2–100 existing allocations.",
    );
  const changes = r.changes
    .map(allocationCommand)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (
    new Set(changes.map((x) => x.id)).size !== changes.length ||
    new Set(changes.map((x) => x.demand_id)).size !== changes.length ||
    changes.some(
      (x) =>
        x.supply_id !== supply_id ||
        x.supply_version !== supply_version ||
        x.operation_id !== base.operation_id ||
        x.reason !== base.reason ||
        x.expected_version === null ||
        x.basis !== "Usable",
    )
  )
    invalid(
      "changes",
      "Use distinct existing Usable allocations on one exact Supply and original operation.",
    );
  return { ...base, supply_id, supply_version, changes };
}
export type ReductionCommand = ReturnType<typeof reductionCommand>;
export type AllocationEffectCommand =
  ReturnType<typeof allocationCommand> | ReductionCommand;
export const allocationChanges = (cmd: AllocationEffectCommand) =>
  "changes" in cmd ? cmd.changes : [cmd];
export const allocationReceiptTarget = (cmd: AllocationEffectCommand) =>
  "changes" in cmd ? cmd.supply_id : cmd.demand_id;

// No consequential reversal authority is inferred from an allocation proposal.
export function reductionHolds(d: {
  record: SupplyRecord;
  facts: Fact[];
  children: unknown[];
}) {
  const holds: string[] = [];
  if (d.record.data.demand_class !== "Approved")
    holds.push(
      `${d.record.reference}: native allocation requires already Approved Demand.`,
    );
  if (d.children.length)
    holds.push(
      `${d.record.reference}: return/custody children require their owning Supply workflow before reduction.`,
    );
  const consequential = d.facts.filter(
    (f) => !["Assessment", "Impact", "Pick"].includes(f.kind),
  );
  if (consequential.length)
    holds.push(
      `${d.record.reference}: ${[...new Set(consequential.map((f) => f.kind))].join(", ")} evidence requires its owning workflow; no reversal is authorised.`,
    );
  return holds;
}
export const pickedMinimum = (facts: Fact[]) =>
  quantity(
    facts
      .filter((f) => f.kind === "Pick")
      .reduce((n, f) => n + decimal(f.data.quantity!), 0n),
  );
