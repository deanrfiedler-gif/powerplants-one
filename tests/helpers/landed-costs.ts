import { randomUUID } from "node:crypto";
import { landedPolicy } from "../../src/estimating/sources/landed";
export function landedCharges(
  lineIds: string[],
  overrides: Record<string, unknown> = {},
) {
  return {
    policy: landedPolicy,
    currency: "AUD",
    exclusive_cost_basis_confirmed: true,
    charges: [
      {
        id: randomUUID(),
        kind: "Freight",
        basis: "Shipment",
        amount: "0.30",
        allocation: "Equal",
        line_ids: lineIds,
        effective_date: "2026-10-14",
        evidence_reference: "SYN-LANDED-01",
        evidence_excerpt:
          "Authored synthetic freight; excluded from supplier unit cost and every other line.",
        ...overrides,
      },
    ],
  };
}
