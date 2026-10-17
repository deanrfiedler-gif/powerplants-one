import type { QueryClient } from "../platform/permissions";
import {
  decimal,
  latestFact,
  quantity,
  readiness as supplyReadiness,
  type Allocation,
  type Fact,
  type SupplyRecord,
} from "../supply/model";
import { todayInZone } from "../projects/model";
import { sourceValidity } from "../supply/validity";

// The Dispatch-stage PartsReadiness criterion of SYN-PPO-P04 v2 (field readiness gate P1, R1, Q7).
// A narrow service projection of Supply Chain readiness: technicians and pack readers need no
// supply.read and see item, quantity, state and dates only, never costs, suppliers or sources.
export const PARTS_CRITERION = "PartsReadiness";
export const PARTS_READY = "Ready for the stated material scope";
export type PartsOutcome =
  "Pass" | "Blocked" | "Unknown" | "NotApplicable" | "PermittedException";
export type PartsLine = {
  id: string;
  reference: string;
  title: string;
  item: string;
  quantity: string;
  unit: string;
  state: string;
  shortage: string | null;
  required_on: string | null;
  promised_on: string | null;
};
export type PartsReadiness = {
  outcome: PartsOutcome;
  summary: string;
  lines: PartsLine[];
  // Demands raised on the work order but not linked to this visit (Q7).
  unlinked: { id: string; reference: string; title: string }[];
  statement: "NotApplicable" | "PermittedException" | null;
};

const short = (state: string) => state === "Blocked" || state === "At risk";
// Outcome mapping of proposal P1. A recorded permitted exception holds whatever the lines say (Q1);
// "No parts needed" counts only while nothing is linked, and never by inference (R1).
export function partsOutcome(
  lines: Pick<PartsLine, "state">[],
  unlinked: number,
  statement: PartsReadiness["statement"],
): PartsOutcome {
  if (statement === "PermittedException") return "PermittedException";
  if (unlinked) return "Unknown";
  if (!lines.length)
    return statement === "NotApplicable" ? "NotApplicable" : "Unknown";
  if (lines.some((l) => short(l.state))) return "Blocked";
  if (lines.some((l) => l.state !== PARTS_READY)) return "Unknown";
  return "Pass";
}
const lineWords = (l: PartsLine) =>
  `${l.title}: ${l.state}${l.promised_on ? ` · promised ${l.promised_on}` : ""}${l.shortage && l.shortage !== "0" && short(l.state) ? ` · ${l.shortage} ${l.unit} short` : ""}`;
export function partsSummary(
  r: Pick<PartsReadiness, "outcome" | "lines" | "unlinked" | "statement">,
) {
  const ready = r.lines.filter((l) => l.state === PARTS_READY).length,
    count = `${ready} of ${r.lines.length} line${r.lines.length === 1 ? "" : "s"} ready for the stated scope`;
  if (r.outcome === "PermittedException")
    return `Permitted exception recorded at the appointment${r.lines.length ? ` · ${count}` : ""}`;
  if (r.unlinked.length)
    return `${r.unlinked.length} demand${r.unlinked.length === 1 ? " is" : "s are"} on the work order but not linked to this visit: ${r.unlinked.map((d) => d.title).join("; ")}`;
  if (!r.lines.length)
    return r.outcome === "NotApplicable"
      ? "No parts needed for this visit, recorded by the preparer"
      : "No parts demand is linked to this visit, and no “No parts needed” statement is recorded";
  const attention = r.lines.filter((l) => l.state !== PARTS_READY);
  return attention.length
    ? `${attention.map(lineWords).join("; ")} · ${count}`
    : count;
}
// The dispatch reason for an outcome that does not satisfy the criterion.
export const partsReason = (r: PartsReadiness) =>
  `Parts ready for the stated material scope: ${r.outcome === "Blocked" ? "Blocked" : "Unknown"}. ${r.summary}.`;

async function line(
  c: QueryClient,
  workspace_id: string,
  d: SupplyRecord,
): Promise<PartsLine> {
  const allocations = (
    await c.query<Allocation>(
      "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=$2 ORDER BY id",
      [workspace_id, d.id],
    )
  ).rows;
  // Unlike Supply's own register (SUP-1), no allocation here is missing evidence: the field gate
  // holds dispatch as Unknown until a linked demand has been allocated (tested in readiness-gate).
  let usable = 0n,
    complete = allocations.length > 0;
  for (const a of allocations) {
    const s = (
      await c.query<SupplyRecord>(
        "SELECT * FROM ppo.supply_records WHERE workspace_id=$1 AND id=$2",
        [workspace_id, a.supply_id],
      )
    ).rows[0];
    if (!s) {
      complete = false;
      continue;
    }
    if (!(await sourceValidity(c, workspace_id, s)).valid) complete = false;
    else if (a.basis === "Usable") usable += decimal(a.quantity);
  }
  // Credit facts are Finance-restricted and never enter this projection.
  const facts = (
    await c.query<Fact>(
      "SELECT id,record_id,kind,version,predecessor_id,data,evidence,observed_at,completeness,attachment_id,activity_id FROM ppo.supply_facts WHERE workspace_id=$1 AND record_id=$2 AND kind<>'Credit' ORDER BY version,created_at,id",
      [workspace_id, d.id],
    )
  ).rows;
  const state = supplyReadiness(
    d,
    quantity(usable),
    complete,
    facts,
    todayInZone(d.data.timezone ?? "UTC"),
  );
  return {
    id: d.id,
    reference: d.reference,
    title: d.title,
    item: d.item,
    quantity: d.quantity,
    unit: d.unit,
    state: state.state,
    shortage: state.shortage,
    required_on: d.data.required_on ?? null,
    promised_on: latestFact(facts, "Promise")?.data.promised_on ?? null,
  };
}

// The current recorded statement, if it still applies: the latest assessment at this appointment
// for the current scope version and not expired.
export async function partsStatement(
  c: QueryClient,
  workspace_id: string,
  a: { id: string; scope_revision_id: string; scope_version: number },
): Promise<PartsReadiness["statement"]> {
  const x = (
    await c.query(
      "SELECT outcome,scope_version,valid_until FROM ppo.readiness_assessments WHERE workspace_id=$1 AND scope_revision_id=$2 AND appointment_id=$3 AND criterion_code=$4 ORDER BY assessment_version DESC LIMIT 1",
      [workspace_id, a.scope_revision_id, a.id, PARTS_CRITERION],
    )
  ).rows[0];
  if (
    !x ||
    x.scope_version !== a.scope_version ||
    (x.valid_until && x.valid_until.getTime() <= Date.now())
  )
    return null;
  return x.outcome === "NotApplicable" || x.outcome === "PermittedException"
    ? x.outcome
    : null;
}
// Whether the appointment's readiness policy carries the criterion. SYN-PPO-P04 v1 does not.
export async function partsApply(
  c: QueryClient,
  workspace_id: string,
  policy_version_id: string,
) {
  return !!(
    await c.query(
      "SELECT 1 FROM ppo.policy_criteria WHERE workspace_id=$1 AND policy_version_id=$2 AND criterion_code=$3",
      [workspace_id, policy_version_id, PARTS_CRITERION],
    )
  ).rowCount;
}
export async function appointmentParts(
  c: QueryClient,
  workspace_id: string,
  a: { id: string; work_order_id: string },
  statement: PartsReadiness["statement"],
): Promise<PartsReadiness> {
  const demands = (
    await c.query<SupplyRecord>(
      "SELECT * FROM ppo.supply_records WHERE workspace_id=$1 AND kind='Demand' AND data->>'appointment_id'=$2 ORDER BY reference,id",
      [workspace_id, a.id],
    )
  ).rows;
  const unlinked = (
    await c.query<{ id: string; reference: string; title: string }>(
      "SELECT id,reference,title FROM ppo.supply_records WHERE workspace_id=$1 AND kind='Demand' AND data->>'origin_kind'='WorkOrder' AND data->>'origin_id'=$2 AND nullif(data->>'appointment_id','') IS NULL ORDER BY reference,id",
      [workspace_id, a.work_order_id],
    )
  ).rows;
  const lines: PartsLine[] = [];
  for (const d of demands) lines.push(await line(c, workspace_id, d));
  const outcome = partsOutcome(lines, unlinked.length, statement);
  return {
    outcome,
    lines,
    unlinked,
    statement,
    summary: partsSummary({ outcome, lines, unlinked, statement }),
  };
}
// The criterion for an appointment, or null when its policy does not carry it.
export async function partsCriterion(
  c: QueryClient,
  workspace_id: string,
  a: {
    id: string;
    work_order_id: string;
    policy_version_id: string;
    scope_revision_id: string;
    scope_version: number;
  },
) {
  if (!(await partsApply(c, workspace_id, a.policy_version_id))) return null;
  return appointmentParts(
    c,
    workspace_id,
    a,
    await partsStatement(c, workspace_id, a),
  );
}
