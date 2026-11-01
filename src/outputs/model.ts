import { choice, invalid, object, optionalId } from "../shared/validation";
import { windowNumber } from "../service/work-order-register-model";

export const outputKinds = ["JobPack", "ServiceReport"] as const;
export type OutputKind = (typeof outputKinds)[number];
export const visibleOutputLimit = 200;

export type OutputRecipientSummary = {
  visibility:
    | "AllRecipients"
    | "OwnRecipient"
    | "FrozenReportRecipient"
    | "NotIssued"
    | "NotProvided";
  recipient_count: number | null;
  acknowledged_count: number | null;
  required_recipient_count: number | null;
  required_acknowledged_count: number | null;
};

export function outputQuery(input: unknown) {
  const q = object(input, [
    "kind",
    "q",
    "company_id",
    "site_id",
    "organisation_id",
    "owner_id",
    "view",
    "offset",
    "limit",
  ]);
  if (
    q.q !== undefined &&
    (typeof q.q !== "string" ||
      q.q.length > 200 ||
      /[\u0000-\u001f\u007f]/.test(q.q))
  )
    invalid("q", "Use at most 200 characters.");
  return {
    kind: q.kind === undefined ? null : choice(q.kind, "kind", outputKinds),
    q: ((q.q as string | undefined) ?? "").trim().toLowerCase(),
    company_id: optionalId(q.company_id, "company_id"),
    site_id: optionalId(q.site_id, "site_id"),
    organisation_id: optionalId(q.organisation_id, "organisation_id"),
    owner_id: optionalId(q.owner_id, "owner_id"),
    view:
      q.view === undefined
        ? ("all" as const)
        : choice(q.view, "view", [
            "all",
            "issued",
            "unissued",
            "preparing",
            "exceptions",
          ] as const),
    offset: windowNumber(q.offset, "offset", 0, 400),
    limit: windowNumber(q.limit, "limit", 25, 50),
  };
}
export function outputDetailQuery(input: unknown) {
  const q = object(input, ["kind", "issue_id"]);
  return {
    kind: choice(q.kind, "kind", outputKinds),
    issue_id: optionalId(q.issue_id, "issue_id"),
  };
}
export type OutputRow = {
  kind: OutputKind;
  id: string;
  reference: string;
  version: number;
  source_state: string;
  updated_at: Date;
  company_id: string;
  site_id: string;
  organisation_id: string;
  service_owner_id: string;
  labels: {
    company: string | null;
    customer: string | null;
    site: string | null;
    service_owner: string | null;
  };
  appointment: { id: string; reference: string };
  work_order: { id: string; reference: string };
  current_revision_id: string | null;
  current_revision_number: number | null;
  current_issue: {
    id: string;
    revision_id: string;
    revision_number: number;
    issued_at: Date;
    output_hash: string;
  } | null;
  recipient_summary: OutputRecipientSummary;
  needs_review: boolean | null;
  preparation: {
    id: string;
    revision_id: string;
    revision_number: number;
    state: string;
    requested_at: Date;
  } | null;
  availability: "NotChecked" | "NotIssued" | "NotProvided";
  native_href: string;
  detail_href: string;
};
export function inOutputView(
  row: OutputRow,
  view: ReturnType<typeof outputQuery>["view"],
) {
  switch (view) {
    case "all":
      return true;
    case "issued":
      return row.current_issue !== null;
    case "unissued":
      return row.availability === "NotIssued";
    case "preparing":
      return ["Queued", "Running", "Durable"].includes(
        row.preparation?.state ?? "",
      );
    case "exceptions":
      return (
        row.needs_review === true ||
        ["Returned", "Withdrawn"].includes(row.source_state) ||
        ["Failed", "StaleSource"].includes(row.preparation?.state ?? "")
      );
  }
}
export function outputMatches(
  row: OutputRow,
  q: ReturnType<typeof outputQuery>,
) {
  return (
    (!q.company_id || row.company_id === q.company_id) &&
    (!q.site_id || row.site_id === q.site_id) &&
    (!q.organisation_id || row.organisation_id === q.organisation_id) &&
    (!q.owner_id || row.service_owner_id === q.owner_id) &&
    (!q.q ||
      [row.reference, row.appointment.reference, row.work_order.reference].some(
        (v) => v.toLowerCase().includes(q.q),
      )) &&
    inOutputView(row, q.view)
  );
}
