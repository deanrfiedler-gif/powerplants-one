import { object, uuid, version, invalid } from "../shared/validation";

export type SalesBriefSelection = {
  handover_id: string;
  acceptance_event_id: string;
  expected_version: number;
  source_hash: string;
};
export type CreationReview = {
  owner_id: string;
  sales_brief: SalesBriefSelection | null;
};

export function parseCreationReview(value: unknown): CreationReview {
  const r = object(value, ["owner_id", "sales_brief"]);
  if (!Object.hasOwn(r, "sales_brief"))
    invalid("creation.sales_brief", "Review the accepted Sales brief or explicitly record no accepted brief.");
  let sales_brief: SalesBriefSelection | null = null;
  if (r.sales_brief !== null) {
    const b = object(r.sales_brief, ["handover_id", "acceptance_event_id", "expected_version", "source_hash"]);
    if (typeof b.source_hash !== "string" || !/^[a-f0-9]{64}$/.test(b.source_hash))
      invalid("creation.sales_brief.source_hash", "Review the exact accepted Sales source.");
    sales_brief = {
      handover_id: uuid(b.handover_id, "creation.sales_brief.handover_id"),
      acceptance_event_id: uuid(b.acceptance_event_id, "creation.sales_brief.acceptance_event_id"),
      expected_version: version(b.expected_version),
      source_hash: b.source_hash,
    };
  }
  return { owner_id: uuid(r.owner_id, "creation.owner_id"), sales_brief };
}
