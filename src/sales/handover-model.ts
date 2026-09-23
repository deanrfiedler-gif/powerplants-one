import {
  choice,
  dateOnly,
  invalid,
  narrative,
  object,
  optionalId,
  uuid,
} from "../shared/validation";
export const handoverKinds = ["Estimating", "Won"] as const;
export type HandoverKind = (typeof handoverKinds)[number];
export const destinations = [
  "Undecided",
  "Projects",
  "Service",
  "Parts",
] as const;
export type Evidence = {
  kind: "DraftQuote" | "ServiceDocument";
  id: string;
  revision: string;
  purpose: string;
};
export type HandoverContent = {
  problem: string;
  outcome: string;
  included_scope: string;
  exclusions: string;
  assumptions: string;
  unknowns: string;
  requested_date: string | null;
  date_reason: string;
  facility_ids: string[];
  asset_ids: string[];
  evidence: Evidence[];
  next_activity_id: string | null;
  destination: (typeof destinations)[number];
  routing_basis: string;
  delivery_items: string;
  release_prerequisites: string;
};
export const emptyHandover = (): HandoverContent => ({
  problem: "",
  outcome: "",
  included_scope: "",
  exclusions: "",
  assumptions: "",
  unknowns: "",
  requested_date: null,
  date_reason: "",
  facility_ids: [],
  asset_ids: [],
  evidence: [],
  next_activity_id: null,
  destination: "Undecided",
  routing_basis: "",
  delivery_items: "",
  release_prerequisites: "",
});
export function boundedText(value: unknown, field: string, max = 4000) {
  return value === "" ? "" : narrative(value, field, max);
}
export function array<T>(
  value: unknown,
  field: string,
  read: (x: unknown) => T,
  max = 30,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    invalid(field, `Provide at most ${max} entries.`);
  return value.map(read);
}
export function ids(value: unknown, field: string) {
  const result = array(value, field, (x) => uuid(x, field));
  if (new Set(result).size !== result.length)
    invalid(field, "Do not repeat a reference.");
  return result;
}
export function parseHandover(value: unknown): HandoverContent {
  const r = object(value, Object.keys(emptyHandover()));
  return {
    problem: boundedText(r.problem, "problem"),
    outcome: boundedText(r.outcome, "outcome"),
    included_scope: boundedText(r.included_scope, "included_scope"),
    exclusions: boundedText(r.exclusions, "exclusions"),
    assumptions: boundedText(r.assumptions, "assumptions"),
    unknowns: boundedText(r.unknowns, "unknowns"),
    requested_date:
      r.requested_date === null
        ? null
        : dateOnly(r.requested_date, "requested_date"),
    date_reason: boundedText(r.date_reason, "date_reason"),
    facility_ids: ids(r.facility_ids, "facility_ids"),
    asset_ids: ids(r.asset_ids, "asset_ids"),
    next_activity_id: optionalId(r.next_activity_id, "next_activity_id"),
    evidence: array(r.evidence, "evidence", (value) => {
      const e = object(value, ["kind", "id", "revision", "purpose"]);
      return {
        kind: choice(e.kind, "kind", ["DraftQuote", "ServiceDocument"]),
        id: uuid(e.id, "evidence.id"),
        revision: narrative(String(e.revision ?? ""), "evidence.revision", 100),
        purpose: narrative(e.purpose, "purpose", 1000),
      };
    }),
    destination: choice(r.destination, "destination", destinations),
    routing_basis: boundedText(r.routing_basis, "routing_basis"),
    delivery_items: boundedText(r.delivery_items, "delivery_items"),
    release_prerequisites: boundedText(
      r.release_prerequisites,
      "release_prerequisites",
    ),
  };
}
export function handoverReadiness(kind: HandoverKind, x: HandoverContent) {
  const missing = (
    [
      "problem",
      "outcome",
      "included_scope",
      "exclusions",
      "assumptions",
      "unknowns",
    ] as const
  ).filter((k) => !x[k].trim()) as string[];
  if (!x.requested_date && !x.date_reason.trim()) missing.push("date_reason");
  if (!x.next_activity_id) missing.push("next_activity_id");
  if (kind === "Won") {
    if (x.destination === "Undecided" || x.destination === "Parts")
      missing.push(
        "destination: routing decision required; native Projects or Service receiver",
      );
    if (!x.delivery_items.trim()) missing.push("delivery_items");
    if (!x.release_prerequisites.trim()) missing.push("release_prerequisites");
    if (x.destination !== "Undecided" && !x.routing_basis.trim())
      missing.push("routing_basis");
  }
  return missing;
}
