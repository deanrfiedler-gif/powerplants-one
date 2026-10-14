import { invalid } from "../../shared/validation";

export const kinds = ["Basis", "Obligation", "Notice", "Variation"] as const;
export type Kind = (typeof kinds)[number];
export type State =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Returned"
  | "Withdrawn"
  | "Open"
  | "Satisfied"
  | "Waived"
  | "RecordedEvidence"
  | "Requested"
  | "Assessed"
  | "Rejected"
  | "Disputed";
export type Content = {
  title: string;
  detail: string;
  clause: string;
  owner_id: string;
  action_ids: string[];
  due_date: string | null;
  date_needed: boolean;
  evidence: string | null;
  occurred_at: string | null;
  requested_amount: string | null;
  priced_amount: string | null;
  date_impact: string | null;
};
export type Entry = {
  id: string;
  workspace_id: string;
  company_id: string;
  project_id: string;
  kind: Kind;
  basis_id: string | null;
  predecessor_id: string | null;
  created_by: string;
};
export type Event = {
  entry_id: string;
  version: number;
  command: string;
  state: State;
  content: Content;
  note: string;
  disputed: boolean;
  action_snapshot: { id: string; version: number; state: string }[];
  created_by: string;
  created_at: Date;
  operation_id: string;
};
// +/- AUD 999,999,999,999.99 per record; aggregate uses unbounded integer cents.
export function money(
  value: unknown,
  field: string,
  nullable = true,
): string | null {
  if (nullable && value === null) return null;
  if (
    typeof value !== "string" ||
    !/^-?(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(value)
  )
    invalid(
      field,
      "Use an exact decimal string, at most two places and twelve whole digits, or explicit null when unknown.",
    );
  return decimal(cents(value as string));
}
export function cents(value: string): bigint {
  const negative = value.startsWith("-"),
    [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  return (
    (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) *
    (negative ? -1n : 1n)
  );
}
export function decimal(value: bigint): string {
  const abs = value < 0n ? -value : value;
  return `${value < 0n ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
}
export function total(values: (string | null)[]) {
  const known = decimal(
    values.reduce<bigint>((sum, v) => sum + (v === null ? 0n : cents(v)), 0n),
  );
  return {
    value: values.includes(null) ? null : known,
    known_subtotal: known,
    completeness: values.includes(null) ? "Incomplete" : "Complete",
  };
}
export function transition(
  kind: Kind,
  prior: State | undefined,
  action: string,
  outcome: string | null,
  content: Content,
): State {
  if (action === "Create" && !prior)
    return kind === "Basis"
      ? "Draft"
      : kind === "Obligation"
        ? "Open"
        : kind === "Notice"
          ? "RecordedEvidence"
          : content.priced_amount === null
            ? "Requested"
            : "Assessed";
  if (
    action === "Revise" &&
    ((kind === "Basis" && ["Draft", "Returned"].includes(prior!)) ||
      (kind === "Obligation" && prior === "Open") ||
      (kind === "Variation" &&
        ["Requested", "Assessed", "Rejected", "Disputed"].includes(prior!)))
  )
    return kind === "Basis"
      ? "Draft"
      : kind === "Obligation"
        ? "Open"
        : content.priced_amount === null
          ? "Requested"
          : "Assessed";
  if (
    action === "Submit" &&
    ((kind === "Basis" && ["Draft", "Returned"].includes(prior!)) ||
      (kind === "Obligation" && prior === "Open") ||
      (kind === "Variation" && prior === "Assessed"))
  )
    return "Submitted";
  if (action === "Decide" && prior === "Submitted") {
    if (kind === "Basis" && ["Approved", "Returned"].includes(outcome!))
      return outcome as State;
    if (kind === "Obligation" && ["Waived", "Returned"].includes(outcome!))
      return outcome === "Returned" ? "Open" : "Waived";
    if (
      kind === "Variation" &&
      ["Approved", "Rejected", "Disputed"].includes(outcome!)
    )
      return outcome as State;
  }
  if (
    action === "Withdraw" &&
    (kind === "Basis" || kind === "Variation") &&
    prior &&
    !["Approved", "Withdrawn"].includes(prior)
  )
    return "Withdrawn";
  if (kind === "Obligation" && action === "Satisfy" && prior === "Open")
    return "Satisfied";
  if (
    kind === "Obligation" &&
    action === "Reopen" &&
    ["Satisfied", "Waived"].includes(prior!)
  )
    return "Open";
  invalid("action", "This action is unavailable in the exact current state.");
}
