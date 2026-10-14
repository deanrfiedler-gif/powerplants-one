import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import {
  sourceContext,
  sourceRevision,
  sourceHash,
  type SourceEvent,
} from "../estimating/sources/context";
import type { Definition, CostSnapshot } from "./types";
import type { Run } from "./context";

// Current checks belong inside the shared mutation lock. Historical reads and
// original recovery keep exact evidence available under current read authority.
export async function costBindings(
  c: QueryClient,
  p: Principal,
  company: string,
  d: Definition,
  current = false,
): Promise<CostSnapshot[]> {
  if (d.schema_version !== 4) return [];
  const snapshots: CostSnapshot[] = [];
  for (const part of d.parts) {
    const ref = part.cost_source;
    if (!ref) continue;
    const source = await sourceContext(c, p, ref.source_id);
    if (source.company_id !== company) throw unavailable();
    const revision = await sourceRevision(c, p, source, ref.revision_id);
    if (
      revision.content_hash !== ref.content_hash ||
      sourceHash(ref.content) !== revision.content_hash ||
      ref.reference !== source.reference ||
      ref.revision !== revision.revision
    )
      throw new AppError(
        409,
        "CpqCostEvidenceChanged",
        "Bind the exact retained source revision, native reference and content hash.",
      );
    if (revision.content.unit !== part.unit)
      throw new AppError(
        409,
        "SourceUnitMismatch",
        "Component and source units must match exactly. Unit conversion is not configured.",
      );
    const review = (
      await c.query<SourceEvent>(
        "SELECT * FROM ppo.cost_source_events WHERE workspace_id=$1 AND source_id=$2 AND revision_id=$3 AND id=$4 AND action='Reviewed'",
        [p.workspace_id, source.id, revision.id, ref.review_event_id],
      )
    ).rows[0];
    if (
      !review ||
      review.created_by === revision.created_by ||
      ref.source_version < review.source_version
    )
      throw new AppError(
        409,
        "ReviewedSourceRequired",
        "Select an independent review of this exact Cost Source revision.",
      );
    if (current && source.version !== ref.source_version)
      throw new AppError(
        409,
        "CpqCostSourceChanged",
        "The source changed. Review an explicit successor binding and compare a new calculation; no newer price is substituted.",
      );
    snapshots.push({
      ...ref,
      part_key: part.key,
      review: {
        id: review.id,
        source_version: review.source_version,
        reason: review.reason,
        created_by: review.created_by,
        created_at: review.created_at.toISOString(),
      },
    });
  }
  return snapshots;
}

export function costLineEvidence(saved: Pick<Run, "binding" | "result">) {
  return saved.result.lines.flatMap((line) => {
    if (!line.cost_source) return [];
    const source = saved.binding.cost_sources?.find((s) =>
      line.target.endsWith(`:${s.part_key}:${s.content.unit}`),
    );
    if (!source)
      throw new AppError(
        409,
        "CpqEvidenceMismatch",
        "The saved cost line has no exact source snapshot.",
      );
    return [
      {
        line_id: line.line.id,
        target: line.target,
        basis_hash: line.basis_hash,
        source,
        selected: line.cost_source,
      },
    ];
  });
}
