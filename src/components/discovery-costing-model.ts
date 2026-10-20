import { calculate, decimal, scaled, type CostLine } from "../estimating/math";
import { parseLines } from "../estimating/validation";
import type { SourceBinding } from "../estimating/sources/bindings";
import type { DiscoveryDifference } from "../estimating/discovery-comparison";
import type { DiscoveryInput } from "../estimating/discovery";
import { discoveryDefinition } from "../estimating/discovery-definition";

const lineFields: (keyof CostLine)[] = [
  "description",
  "category",
  "quantity",
  "unit",
  "unit_cost",
  "unit_sell",
  "source",
  "effective_date",
  "allowance",
];
export function compareCostLines(saved: CostLine[], proposal: CostLine[]) {
  const added = proposal.filter(
    (line) => !saved.some((old) => old.id === line.id),
  );
  const changed = proposal.filter((line) => {
    const old = saved.find((old) => old.id === line.id);
    return !old || lineFields.some((field) => old[field] !== line[field]);
  });
  const removed = saved.filter(
    (old) => !proposal.some((line) => line.id === old.id),
  );
  return { added, changed, removed };
}
export function proposalAmounts(lines: CostLine[], schema: 1 | 2 = 2) {
  try {
    return calculate(parseLines(lines, schema));
  } catch {
    return null;
  }
}
export const amountText = (amount: string | null | undefined) =>
  amount == null ? "Unknown" : amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const money = (amount: string | null | undefined) =>
  amount == null ? "Unknown" : `AUD ${amountText(amount)}`;
export const revisionName = (n: number) => `r${String(n).padStart(2, "0")}`;
export function sellChange(
  saved: string | null | undefined,
  proposed: string | null | undefined,
) {
  if (saved == null || proposed == null) return null;
  const difference = scaled(proposed, 2) - scaled(saved, 2);
  return `${difference > 0n ? "+" : ""}${amountText(decimal(difference))}`;
}
export function allowanceTotal(lines: CostLine[]) {
  // Unknown allowance choices and incomplete lines stay unknown, never zero.
  const totals = proposalAmounts(lines);
  if (!totals || lines.some((line) => line.allowance === undefined))
    return null;
  return decimal(
    totals.items
      .filter((line) => line.allowance)
      .reduce((sum, line) => sum + scaled(line.sell_total, 2), 0n),
  );
}
export function retainedSource(
  line: CostLine,
  saved: CostLine[],
  bindings: SourceBinding[],
) {
  const original = saved.find((old) => old.id === line.id),
    binding = bindings.find((item) => item.line_id === line.id);
  // Display mirrors native inheritance; a free-text match is never a reviewed binding.
  return binding &&
    original &&
    (!binding.landed || original.category === line.category) &&
    (
      ["quantity", "unit", "unit_cost", "source", "effective_date"] as const
    ).every((field) => line[field] === original[field])
    ? binding
    : null;
}

export function scopeDifferenceText(
  change: DiscoveryDifference,
  before?: DiscoveryInput | null,
  after?: DiscoveryInput | null,
) {
  const configurations = [after?.configuration, before?.configuration];
  const entities = configurations.flatMap((c) =>
    c
      ? [
          ...c.areas,
          ...c.systems,
          ...c.facts,
          ...c.evidence,
          ...c.responsibilities,
          ...c.follow_ups,
        ]
      : [],
  );
  const entity = entities.find(
    (e) => e.id === (change.target_id ?? change.entity_id),
  );
  const friendly = (value: unknown): string => {
    if (value == null) return "Not recorded";
    if (typeof value === "string") {
      const reference = entities.find((e) => e.id === value);
      return reference && "name" in reference
        ? reference.name
        : reference && "label" in reference
          ? reference.label
          : value;
    }
    if (Array.isArray(value)) return value.map(friendly).join(", ") || "None";
    if (typeof value === "object")
      return Object.entries(value)
        .filter(([key]) => !["id", "lineage"].includes(key))
        .map(([key, value]) => `${key.replace(/_/g, " ")}: ${friendly(value)}`)
        .join("; ");
    return String(value);
  };
  const name =
    change.entity === "answer"
      ? discoveryDefinition.questions.find((q) => q.id === change.entity_id)
          ?.label
      : entity && "name" in entity
        ? entity.name
        : entity && "label" in entity
          ? entity.label
          : entity && "system_id" in entity
            ? configurations
                .flatMap((c) => c?.systems ?? [])
                .find((s) => s.id === entity.system_id)?.name
            : undefined;
  return {
    label: `${name ?? change.entity.replace(/_/g, " ")} · ${change.field.replace(/_/g, " ")}`,
    detail:
      change.change === "Added"
        ? friendly(change.after)
        : change.change === "Removed"
          ? friendly(change.before)
          : `${friendly(change.before)} → ${friendly(change.after)}`,
  };
}
