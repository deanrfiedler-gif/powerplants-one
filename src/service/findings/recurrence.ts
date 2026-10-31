import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError } from "../../platform/errors";
import { findingQuery, withinRecurrenceWindow, type Finding } from "./model";
import { candidateWindow } from "./window";
import { authorise, project } from "./sources";

// Only failed inspection checks currently carry an equipment-bound fault key.
// Incident classification is a safety classification, not a fault category.
// Titles, generic classifications and free text must never manufacture a match.
export async function recurrenceFor(
  c: QueryClient,
  p: Principal,
  row: Finding,
): Promise<NonNullable<Finding["recurrence"]>> {
  const empty = {
    basis: "NoStableFaultKey" as const,
    partial: false,
    earlier: [],
  };
  if (row.source !== "inspection" || !row.equipment) return empty;
  const current = (
    await c.query<{
      check_key: string;
      procedure_key: string;
      occurred_at: Date;
      evaluation: string;
    }>(
      `
    SELECT t.procedure_key,t.checks->((pc.ordinality-1)::int)->>'key' AS check_key,a.occurred_at,r.evaluation FROM ppo.inspection_defects d
    JOIN ppo.inspection_defect_attempts dl ON (dl.workspace_id,dl.defect_id)=(d.workspace_id,d.id)
    JOIN ppo.inspection_attempts a ON (a.workspace_id,a.id)=(dl.workspace_id,dl.attempt_id)
    JOIN ppo.service_inspection_bindings b ON (b.workspace_id,b.attempt_id)=(a.workspace_id,a.id)
    JOIN ppo.service_inspection_templates t ON (t.workspace_id,t.id)=(b.workspace_id,b.template_id)
    JOIN LATERAL jsonb_array_elements(a.plan) WITH ORDINALITY pc(definition,ordinality) ON pc.definition->>'key'=d.check_key
    JOIN ppo.inspection_results r ON (r.workspace_id,r.attempt_id,r.check_key)=(a.workspace_id,a.id,d.check_key)
    WHERE d.workspace_id=$1 AND d.id=$2 AND r.evaluation='Fail'
    ORDER BY a.occurred_at DESC,a.id LIMIT 1`,
      [p.workspace_id, row.source_id],
    )
  ).rows[0];
  if (!current || current.evaluation !== "Fail") return empty;
  const at = current.occurred_at.toISOString();
  const candidates = await candidateWindow(
    c,
    p,
    findingQuery({ source: "inspection", view: "all", limit: 50 }),
    {
      equipment: row.equipment.id,
      check: current.check_key,
      procedure: current.procedure_key,
      at,
    },
  );
  const result: NonNullable<Finding["recurrence"]> = {
    basis: "FailedCheck",
    partial: false,
    earlier: [],
  };
  for (const candidate of candidates.slice(0, 50)) {
    try {
      const previous = await project(c, p, candidate);
      const facts = (
        await c.query<{ occurred_at: Date; correction_note: string | null }>(
          `
        SELECT a.occurred_at,d.correction_note FROM ppo.inspection_defects d
        JOIN ppo.inspection_defect_attempts dl ON (dl.workspace_id,dl.defect_id)=(d.workspace_id,d.id)
        JOIN ppo.inspection_attempts a ON (a.workspace_id,a.id)=(dl.workspace_id,dl.attempt_id)
        JOIN ppo.inspection_results r ON (r.workspace_id,r.attempt_id,r.check_key)=(a.workspace_id,a.id,d.check_key)
        WHERE d.workspace_id=$1 AND d.id=$2 AND r.evaluation='Fail'
          AND a.occurred_at < $3::timestamptz AND a.occurred_at >= $3::timestamptz - interval '2160 hours'
        ORDER BY a.occurred_at DESC,a.id LIMIT 51`,
          [p.workspace_id, candidate.id, at],
        )
      ).rows;
      await authorise(c, p, candidate);
      for (const fact of facts.slice(0, 50)) {
        if (withinRecurrenceWindow(fact.occurred_at.toISOString(), at))
          result.earlier.push({
            id: previous.id,
            reference: previous.source_record.reference,
            href: previous.source_record.href,
            occurred_at: fact.occurred_at.toISOString(),
            state: previous.state,
            correction: fact.correction_note,
          });
      }
      if (facts.length > 50) result.partial = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      result.partial = true;
    }
  }
  if (candidates.length > 50) {
    try {
      await authorise(c, p, candidates[50]);
      result.partial = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  result.earlier.sort(
    (a, b) =>
      b.occurred_at.localeCompare(a.occurred_at) || a.id.localeCompare(b.id),
  );
  if (result.earlier.length > 50) {
    result.earlier = result.earlier.slice(0, 50);
    result.partial = true;
  }
  return result;
}
