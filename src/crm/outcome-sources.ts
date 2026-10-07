import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import {
  object,
  choice,
  narrative,
  uuid,
  version,
  invalid,
} from "../shared/validation";
import { opportunityAuthority, type Opportunity } from "./context";
import { responseContext } from "../estimating/response/context";

export type OutcomeSource =
  | { kind: "Independent"; evidence: string }
  | {
      kind: "Quotation";
      revision_id: string;
      issue_id: string;
      response_event_id: string;
      expected_quote_version: number;
      expected_response_sequence: number;
      output_hash: string;
    };

export function parseOutcomeSource(value: unknown): OutcomeSource {
  const input = object(value, [
    "kind",
    "evidence",
    "revision_id",
    "issue_id",
    "response_event_id",
    "expected_quote_version",
    "expected_response_sequence",
    "output_hash",
  ]);
  const kind = choice(input.kind, "commercial_source.kind", [
    "Independent",
    "Quotation",
  ]);
  if (kind === "Independent") {
    const r = object(value, ["kind", "evidence"]);
    return {
      kind,
      evidence: narrative(r.evidence, "commercial_source.evidence", 2000),
    };
  }
  const r = object(value, [
    "kind",
    "revision_id",
    "issue_id",
    "response_event_id",
    "expected_quote_version",
    "expected_response_sequence",
    "output_hash",
  ]);
  if (
    typeof r.output_hash !== "string" ||
    !/^[a-f0-9]{64}$/.test(r.output_hash)
  )
    invalid(
      "commercial_source.output_hash",
      "Compare the exact issued output.",
    );
  return {
    kind,
    revision_id: uuid(r.revision_id, "commercial_source.revision_id"),
    issue_id: uuid(r.issue_id, "commercial_source.issue_id"),
    response_event_id: uuid(
      r.response_event_id,
      "commercial_source.response_event_id",
    ),
    expected_quote_version: version(r.expected_quote_version),
    expected_response_sequence: version(r.expected_response_sequence),
    output_hash: String(r.output_hash),
  };
}
async function available(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT to_regclass('ppo.opportunity_outcome_sources') relation",
    )
  ).rows[0].relation;
}
function conflict(): never {
  throw new AppError(
    409,
    "OutcomeSourceChanged",
    "The reviewed quotation issue, response or source changed. Review the exact current basis before recording this outcome.",
  );
}
async function currentBasis(
  c: QueryClient,
  p: Principal,
  o: Opportunity,
  revision: string,
) {
  const d = await responseContext(c, p, revision);
  if (d.e.opportunity_id !== o.id || d.e.company_id !== o.company_id)
    throw unavailable();
  // The issued document is the decision source. Ordinary Deal stage/outcome
  // changes must not reinterpret its frozen ES-05 recipient/version hash.
  const header = (
    await c.query<{
      version: number;
      current_revision_id: string;
      display_number: string;
    }>(
      "SELECT version,current_revision_id,display_number FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, d.q.quote_id],
    )
  ).rows[0];
  if (!header || header.current_revision_id !== revision) conflict();
  return { d, header };
}
export async function readOutcomeBasis(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const r = object(query, ["revision_id"]),
    revision = uuid(r.revision_id, "revision_id");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
    const { d, header } = await currentBasis(c, p, o, revision);
    const report = d.state.response;
    const outcomes = d.current
      ? [
          ...(d.state.ready && report?.report?.outcome === "Accepted"
            ? ["Won" as const]
            : []),
          ...(report?.report?.outcome === "Declined" ? ["Lost" as const] : []),
        ]
      : [];
    return {
      opportunity_version: o.version,
      display_number: header.display_number,
      revision: d.q.version,
      reported_outcome: report?.report?.outcome ?? null,
      outcomes,
      holds: d.state.holds,
      source: report
        ? {
            kind: "Quotation" as const,
            revision_id: revision,
            issue_id: d.issue.id,
            response_event_id: report.id,
            expected_quote_version: header.version,
            expected_response_sequence: d.sequence,
            output_hash: d.issue.output_hash!,
          }
        : null,
    };
  });
}
type Reviewed = {
  source: OutcomeSource;
  quote_id: string | null;
  reported_outcome: string | null;
};
export async function reviewOutcomeSource(
  c: QueryClient,
  p: Principal,
  o: Opportunity,
  outcome: "Won" | "Lost",
  source: OutcomeSource,
): Promise<Reviewed> {
  if (!(await available(c)))
    throw new AppError(
      503,
      "OutcomeSourceUnavailable",
      "The outcome evidence upgrade is not available.",
    );
  if (source.kind === "Independent")
    return { source, quote_id: null, reported_outcome: null };
  const { d, header } = await currentBasis(c, p, o, source.revision_id);
  if (
    !d.current ||
    d.issue.id !== source.issue_id ||
    d.issue.output_hash !== source.output_hash ||
    d.state.response?.id !== source.response_event_id ||
    d.sequence !== source.expected_response_sequence ||
    header.version !== source.expected_quote_version
  )
    conflict();
  if (
    outcome === "Won"
      ? !d.state.ready || d.state.response?.report?.outcome !== "Accepted"
      : d.state.response?.report?.outcome !== "Declined"
  )
    conflict();
  return {
    source,
    quote_id: d.q.quote_id,
    reported_outcome: d.state.response!.report!.outcome,
  };
}
export async function retainOutcomeSource(
  c: QueryClient,
  p: Principal,
  o: Opportunity,
  event: string,
  operation: string,
  reviewed: Reviewed,
) {
  const s = reviewed.source,
    native = s.kind === "Quotation" ? s : null;
  await c.query(
    `INSERT INTO ppo.opportunity_outcome_sources(workspace_id,company_id,opportunity_id,event_id,operation_id,recorded_by,source_kind,evidence,quote_id,revision_id,issue_id,response_event_id,quote_version,response_sequence,output_hash,reported_outcome)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      p.workspace_id,
      o.company_id,
      o.id,
      event,
      operation,
      p.actor_id,
      s.kind,
      s.kind === "Independent" ? s.evidence : null,
      reviewed.quote_id,
      native?.revision_id ?? null,
      native?.issue_id ?? null,
      native?.response_event_id ?? null,
      native?.expected_quote_version ?? null,
      native?.expected_response_sequence ?? null,
      native?.output_hash ?? null,
      reviewed.reported_outcome,
    ],
  );
}
type Retained = {
  event_id: string;
  source_kind: "Independent" | "Quotation";
  evidence: string | null;
  opportunity_id: string;
  quote_id: string | null;
  revision_id: string | null;
  issue_id: string | null;
  response_event_id: string | null;
  output_hash: string | null;
  reported_outcome: string | null;
};
async function retainedAuthority(c: QueryClient, p: Principal, s: Retained) {
  const d = await responseContext(c, p, s.revision_id!);
  const original = d.events.find(
    (e) =>
      e.id === s.response_event_id && ["Record", "Correct"].includes(e.action),
  );
  if (
    d.e.opportunity_id !== s.opportunity_id ||
    d.q.quote_id !== s.quote_id ||
    d.issue.id !== s.issue_id ||
    d.issue.output_hash !== s.output_hash ||
    !original ||
    original.report?.outcome !== s.reported_outcome
  )
    throw unavailable();
  return d;
}
export async function outcomeSourceReceiptAuthority(
  c: QueryClient,
  p: Principal,
  event: string,
) {
  if (!(await available(c))) return;
  const s = (
    await c.query<Retained>(
      "SELECT * FROM ppo.opportunity_outcome_sources WHERE workspace_id=$1 AND event_id=$2",
      [p.workspace_id, event],
    )
  ).rows[0];
  if (s?.source_kind === "Quotation") await retainedAuthority(c, p, s);
}
export async function readOutcomeSources(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  if (!(await available(c))) return [];
  const rows = (
    await c.query<Retained>(
      "SELECT * FROM ppo.opportunity_outcome_sources WHERE workspace_id=$1 AND opportunity_id=$2 ORDER BY recorded_at",
      [p.workspace_id, id],
    )
  ).rows;
  const items = [];
  for (const s of rows) {
    if (s.source_kind === "Independent") {
      items.push({
        event_id: s.event_id,
        kind: "Independent" as const,
        evidence: s.evidence!,
      });
      continue;
    }
    try {
      const d = await retainedAuthority(c, p, s);
      items.push({
        event_id: s.event_id,
        kind: "Quotation" as const,
        revision_id: s.revision_id!,
        revision: d.q.version,
        display_number: d.q.safe_snapshot.display_number,
        recorded_response: s.reported_outcome!,
        current_response: d.state.response?.report?.outcome ?? null,
        changed: !d.current || d.state.response?.id !== s.response_event_id,
      });
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      items.push({ event_id: s.event_id, kind: "Restricted" as const });
    }
  }
  return items;
}
