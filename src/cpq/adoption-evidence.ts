import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError } from "../platform/errors";
import type { CostLine } from "../estimating/math";
import type { AdoptionResolution } from "./adoption-resolution";
import { run } from "./context";
import { hash } from "./hash";

export type Adoption = {
  id: string;
  run_id: string;
  estimate_id: string;
  estimate_version_id: string;
  result_hash: string;
  lines: CostLine[];
};
export async function resolutionEvidence(
  c: QueryClient,
  p: Principal,
  a: Adoption,
) {
  const row = (
    await c.query<{ resolution: AdoptionResolution | null }>(
      `SELECT details->'cpq_resolution' AS resolution FROM ppo.audit_events
     WHERE workspace_id=$1 AND object_id=$2 AND details->>'saved_version_id'=$3 AND details->>'cpq_run_id'=$4`,
      [p.workspace_id, a.estimate_id, a.estimate_version_id, a.run_id],
    )
  ).rows[0];
  return row?.resolution ?? null;
}
export async function verifyAdoption(
  c: QueryClient,
  p: Principal,
  a: Adoption,
  lines: CostLine[],
) {
  const saved = await run(c, p, a.run_id);
  const resolution = await resolutionEvidence(c, p, a);
  const mismatch = () => {
    throw new AppError(
      409,
      "CpqEvidenceMismatch",
      "The exact estimate adoption does not match its retained calculation and decisions.",
    );
  };
  if (
    a.result_hash !== saved.result.result_hash ||
    a.lines.some(
      (line) =>
        hash(lines.find((l) => l.id === line.id) ?? null) !== hash(line),
    )
  )
    mismatch();
  if (!resolution) {
    if (hash(a.lines) !== hash(saved.result.lines.map((l) => l.line)))
      mismatch();
  } else {
    if (
      resolution.schema_version !== 1 ||
      resolution.generated_lines_hash !== hash(a.lines) ||
      resolution.received_lines_hash !== hash(lines) ||
      a.lines.some(
        (line) =>
          hash(
            saved.result.lines.find((l) => l.line.id === line.id)?.line ?? null,
          ) !== hash(line),
      )
    )
      mismatch();
    for (const retained of resolution.retained_cpq_lines) {
      const origin = await run(c, p, retained.origin_run_id);
      if (
        origin.option_id !== saved.option_id ||
        hash(
          origin.result.lines.find((l) => l.line.id === retained.line_id)
            ?.line ?? null,
        ) !== hash(retained.original_line) ||
        hash(lines.find((l) => l.id === retained.line_id) ?? null) !==
          hash(retained.retained_line)
      )
        mismatch();
    }
  }
  return { saved, resolution };
}
