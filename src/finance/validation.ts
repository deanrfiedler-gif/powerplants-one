import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  narrative,
  choice,
  invalid,
} from "../shared/validation";
export const dispositions = [
  "Pending",
  "Billable",
  "NonBillable",
  "WarrantyReview",
  "GoodwillReview",
] as const;
export const scenarios = [
  "Accepted",
  "AcceptedThenTimeout",
  "NotProcessed",
  "Partial",
] as const;
export const basis = (v: unknown, name: string) => {
  const s = narrative(v, name, 4000);
  if (s.length < 10)
    invalid(name, "Give a precise reason of at least 10 characters.");
  return s;
};
// Quantities never pass through floating-point arithmetic or implicit rounding.
export function quantity(v: unknown, name = "quantity"): string {
  if (typeof v !== "string" || !/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(v))
    invalid(
      name,
      "Use a non-negative decimal string with at most six decimal places.",
    );
  return decimal(scaled(v as string));
}
export function scaled(v: string): bigint {
  const [whole, fraction = ""] = v.split(".");
  return BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
}
export function decimal(v: bigint): string {
  return `${v / 1000000n}.${String(v % 1000000n).padStart(6, "0")}`
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}
export function editCommand(id: string | null, input: unknown) {
  const v = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "work_order_id",
    "account_id",
    "mode",
    "reports",
    "lines",
    "treatment_basis",
    "remaining_work_basis",
    "definition_id",
    "definition_version",
    "policy_version",
  ]);
  if (!id && v.expected_version !== undefined)
    invalid(
      "expected_version",
      "A new handoff has no existing record version.",
    );
  if (!Array.isArray(v.reports) || !v.reports.length || v.reports.length > 20)
    invalid("reports", "Choose 1–20 exact issued reports.");
  const reports = (v.reports as unknown[])
    .map((x) => {
      const s = object(x, [
        "report_id",
        "revision_id",
        "review_id",
        "issue_id",
      ]);
      return {
        report_id: uuid(s.report_id, "report_id"),
        revision_id: uuid(s.revision_id, "revision_id"),
        review_id: uuid(s.review_id, "review_id"),
        issue_id: uuid(s.issue_id, "issue_id"),
      };
    })
    .sort((a, b) => a.report_id.localeCompare(b.report_id));
  if (new Set(reports.map((x) => x.report_id)).size !== reports.length)
    invalid("reports", "Do not repeat a report.");
  if (!Array.isArray(v.lines) || !v.lines.length || v.lines.length > 200)
    invalid("lines", "Supply 1–200 source allocations.");
  const lines = (v.lines as unknown[]).map((x) => {
    const l = object(x, [
        "entry_id",
        "quantity",
        "disposition",
        "reason",
        "target_group",
      ]),
      q = quantity(l.quantity),
      disposition = choice(l.disposition, "disposition", dispositions);
    if (scaled(q) <= 0n) invalid("quantity", "Allocate a positive quantity.");
    const target_group =
      l.target_group === null
        ? null
        : narrative(l.target_group, "target_group", 60);
    if ((disposition === "Billable") !== (target_group !== null))
      invalid("target_group", "Only Billable allocations have a target group.");
    return {
      entry_id: uuid(l.entry_id, "entry_id"),
      quantity: q,
      disposition,
      reason: basis(l.reason, "line reason"),
      target_group,
    };
  });
  if (id && v.id !== undefined)
    invalid("id", "The route identifies the existing handoff.");
  return {
    ...common(v),
    id: id ? uuid(id, "handoff_id") : uuid(v.id, "id"),
    expected_version: id ? version(v.expected_version) : null,
    work_order_id: uuid(v.work_order_id, "work_order_id"),
    account_id: uuid(v.account_id, "account_id"),
    mode: choice(v.mode, "mode", ["SyntheticManual", "SyntheticApi"] as const),
    reports,
    lines,
    treatment_basis: basis(v.treatment_basis, "treatment_basis"),
    remaining_work_basis: basis(v.remaining_work_basis, "remaining_work_basis"),
    definition_id: uuid(v.definition_id, "definition_id"),
    definition_version: version(v.definition_version),
    policy_version: version(v.policy_version),
  };
}
export function command(id: string, input: unknown, extra: string[] = []) {
  const v = object(input, [...commonKeys, "expected_version", ...extra]);
  return {
    v,
    cmd: {
      ...common(v),
      id: uuid(id, "handoff_id"),
      expected_version: version(v.expected_version),
      reason: basis(v.reason, "reason"),
    },
  };
}
