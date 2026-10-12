import { choice, invalid, object, optionalId } from "../../shared/validation";

export const quotationStages = [
  "Draft",
  "AwaitingApproval",
  "Returned",
  "ApprovedNotIssued",
  "HeldBasisChanged",
  "IssuedNoResponse",
  "DeliveryUnknown",
  "Clarification",
  "Negotiation",
  "Accepted",
  "Declined",
  "Converted",
] as const;
export type QuotationStage = (typeof quotationStages)[number];
export type StageFacts = {
  prepared: boolean;
  basis_current: boolean | null;
  issued: boolean;
  approval: string | null;
  conversion_available: boolean;
  converted: boolean;
  distribution: string | null;
  response: "Accepted" | "Declined" | "Clarification" | "Negotiation" | null;
};

export function quotationStage(f: StageFacts): QuotationStage | null {
  if (!f.prepared) return "Draft";
  if (!f.issued) {
    if (!f.basis_current) return "HeldBasisChanged";
    if (f.approval === "Returned") return "Returned";
    return f.approval === "Approved" ? "ApprovedNotIssued" : "AwaitingApproval";
  }
  if (!f.conversion_available) return null;
  if (f.converted) return "Converted";
  if (f.distribution === "Unknown") return "DeliveryUnknown";
  return f.response ?? "IssuedNoResponse";
}

function integer(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value))
    invalid(field, "Use a canonical whole-number window.");
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    invalid(field, `Use a value from ${min} to ${max}.`);
  return n;
}
export function quotationWindow(input: Record<string, unknown>) {
  return {
    offset: integer(input.offset, "offset", 0, 0, 1000000),
    limit: integer(input.limit, "limit", 25, 1, 25),
  };
}
export function quotationQuery(value: unknown) {
  const r = object(value, [
    "q",
    "owner_id",
    "customer_id",
    "view",
    "stage",
    "sort",
    "offset",
    "limit",
  ]);
  const q = r.q ?? "";
  if (
    typeof q !== "string" ||
    q.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(q)
  )
    invalid(
      "q",
      "Use at most 100 search characters without control characters.",
    );
  return {
    ...quotationWindow(r),
    q: q.trim(),
    owner_id: optionalId(r.owner_id, "owner_id"),
    customer_id: optionalId(r.customer_id, "customer_id"),
    view: choice(r.view ?? "all", "view", [
      "all",
      "mine",
      "needs_attention",
    ] as const),
    stage: choice(r.stage ?? "all", "stage", [
      "all",
      ...quotationStages,
    ] as const),
    sort: choice(r.sort ?? "updated_desc", "sort", [
      "updated_desc",
      "updated_asc",
      "reference_asc",
    ] as const),
  };
}
export function quotationHistoryQuery(value: unknown) {
  return quotationWindow(object(value, ["offset", "limit"]));
}
