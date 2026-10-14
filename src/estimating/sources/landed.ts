import { AppError } from "../../platform/errors";
import {
  choice,
  dateOnly,
  invalid,
  label,
  narrative,
  object,
  uuid,
} from "../../shared/validation";
import { amount } from "../validation";
import { decimal, extended, halfUp, scaled, type CostLine } from "../math";

export const landedPolicy = "SYN-EST-LANDED-01";
export function landedProposal(value: unknown) {
  const r = object(value, [
    "policy",
    "currency",
    "exclusive_cost_basis_confirmed",
    "charges",
  ]);
  if (r.exclusive_cost_basis_confirmed !== true)
    invalid(
      "exclusive_cost_basis_confirmed",
      "Confirm these charges are excluded from supplier prices and every other estimate line.",
    );
  if (!Array.isArray(r.charges) || !r.charges.length || r.charges.length > 20)
    invalid("charges", "Declare one to twenty freight or duty charges.");
  let memberships = 0;
  const charges = r.charges
    .map((value) => {
      const c = object(value, [
        "id",
        "kind",
        "basis",
        "amount",
        "allocation",
        "line_ids",
        "effective_date",
        "evidence_reference",
        "evidence_excerpt",
      ]);
      const basis = choice(c.basis, "basis", [
        "Unit",
        "Line",
        "Shipment",
      ] as const);
      if (
        !Array.isArray(c.line_ids) ||
        !c.line_ids.length ||
        c.line_ids.length > 500
      )
        invalid("line_ids", "Select one to 500 exact product lines.");
      const line_ids = c.line_ids.map((id) => uuid(id, "line_id")).sort();
      memberships += line_ids.length;
      if (
        new Set(line_ids).size !== line_ids.length ||
        (basis === "Line" && line_ids.length !== 1)
      )
        invalid(
          "line_ids",
          "Targets must be distinct; Line basis has exactly one target.",
        );
      if (
        basis !== "Shipment" &&
        c.allocation !== undefined &&
        c.allocation !== null
      )
        invalid(
          "allocation",
          "Allocation weights apply only to Shipment charges.",
        );
      return {
        id: uuid(c.id, "charge_id"),
        kind: choice(c.kind, "kind", ["Freight", "Duty"] as const),
        basis,
        amount: amount(c.amount, "amount"),
        allocation:
          basis === "Shipment"
            ? choice(c.allocation, "allocation", [
                "Equal",
                "Quantity",
                "BaseCost",
              ] as const)
            : null,
        line_ids,
        effective_date: dateOnly(c.effective_date, "effective_date"),
        evidence_reference: label(
          c.evidence_reference,
          "evidence_reference",
          200,
        ),
        evidence_excerpt: narrative(
          c.evidence_excerpt,
          "evidence_excerpt",
          1000,
        ),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  if (
    memberships > 2000 ||
    new Set(charges.map((c) => c.id)).size !== charges.length ||
    new Set(
      charges.map((c) => c.kind + ":" + c.evidence_reference.toLowerCase()),
    ).size !== charges.length
  )
    invalid(
      "charges",
      "Use unique charge IDs and kind/evidence references, with at most 2,000 line memberships.",
    );
  return {
    policy: choice(r.policy, "policy", [landedPolicy] as const),
    currency: choice(r.currency, "currency", ["AUD"] as const),
    exclusive_cost_basis_confirmed: true as const,
    charges,
  };
}
export type LandedProposal = ReturnType<typeof landedProposal>;
export type LandedBinding = {
  policy: typeof landedPolicy;
  base_unit_cost: string;
  base_cost: string;
  allocated_cost: string;
  landed_cost: string;
  charges: { id: string; amount: string }[];
};

// Pure exact allocation. The caller supplies freshly reviewed supplier prices.
export function allocateLanded(
  lines: CostLine[],
  selected: string[],
  proposal: LandedProposal,
  pricingDate: string,
) {
  if (
    lines.some((l) => l.category === "Freight" && scaled(l.unit_cost, 2) > 0n)
  )
    throw new AppError(
      422,
      "StandaloneFreightConflict",
      "Resolve positive standalone Freight lines before allocating landed charges.",
    );
  const bases = new Map(lines.map((l) => [l.id, l]));
  const allocations = new Map<string, { id: string; amount: string }[]>();
  const charges = proposal.charges.map((c) => {
    if (c.effective_date > pricingDate)
      invalid(
        "effective_date",
        "Charge evidence cannot be later than the selected pricing date.",
      );
    const targets = c.line_ids.map((id) => {
      const l = bases.get(id);
      if (!l || !selected.includes(id) || l.category !== "Product")
        return invalid(
          "line_ids",
          "Landed charges require exact selected Product lines.",
        );
      return l;
    });
    if (
      (c.basis === "Unit" || c.allocation === "Quantity") &&
      new Set(targets.map((l) => l.unit)).size !== 1
    )
      invalid(
        "line_ids",
        "Unit and quantity allocation require identical units; no unit conversion is inferred.",
      );
    let amounts: bigint[];
    if (c.basis === "Unit")
      amounts = targets.map((l) => extended(l.quantity, c.amount));
    else if (c.basis === "Line") amounts = [scaled(c.amount, 2)];
    else {
      const total = scaled(c.amount, 2);
      const weights = targets.map((l) =>
        c.allocation === "Quantity"
          ? scaled(l.quantity, 3)
          : c.allocation === "BaseCost"
            ? extended(l.quantity, l.unit_cost)
            : 1n,
      );
      const sum = weights.reduce((a, b) => a + b, 0n);
      if (sum === 0n)
        invalid(
          "allocation",
          "BaseCost allocation requires a positive selected base cost.",
        );
      amounts = weights.map((w) => (total * w) / sum);
      const remainder = Number(total - amounts.reduce((a, b) => a + b, 0n));
      const order = weights
        .map((w, i) => ({ i, r: (total * w) % sum }))
        .sort((a, b) =>
          a.r === b.r
            ? targets[a.i].id.localeCompare(targets[b.i].id)
            : a.r > b.r
              ? -1
              : 1,
        );
      for (const entry of order.slice(0, remainder)) amounts[entry.i]++;
    }
    const rows = targets.map((l, i) => {
      const amount = decimal(amounts[i]);
      allocations.set(l.id, [
        ...(allocations.get(l.id) ?? []),
        { id: c.id, amount },
      ]);
      return { line_id: l.id, amount };
    });
    return {
      charge_id: c.id,
      total: decimal(amounts.reduce((a, b) => a + b, 0n)),
      allocations: rows,
    };
  });
  const bindings = [...allocations]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([line_id, charges]) => {
      const line = bases.get(line_id)!;
      const base = extended(line.quantity, line.unit_cost),
        addition = charges.reduce((n, c) => n + scaled(c.amount, 2), 0n);
      const target = base + addition;
      const unitCost = decimal(
        halfUp(target * 1000n, scaled(line.quantity, 3)),
      );
      if (extended(line.quantity, unitCost) !== target)
        throw new AppError(
          422,
          "LandedPrecisionUnsupported",
          "This allocation cannot reconcile exactly using two-place unit costs. Revise the charge allocation or quantity basis; no residual cents were saved.",
        );
      const landed: LandedBinding = {
        policy: landedPolicy,
        base_unit_cost: line.unit_cost,
        base_cost: decimal(base),
        allocated_cost: decimal(addition),
        landed_cost: decimal(target),
        charges,
      };
      return { line_id, unit_cost: unitCost, landed };
    });
  return {
    proposal,
    charges,
    total: decimal(charges.reduce((n, c) => n + scaled(c.total, 2), 0n)),
    bindings,
  };
}
