import { createHash } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { canonical } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { companyContext } from "../../shared/authority";
import { uuid } from "../../shared/validation";
import { sourceContent, type SourceContent } from "./validation";

export type SourceState =
  "Draft" | "Submitted" | "Reviewed" | "Returned" | "Rejected";
export type CostSource = {
  id: string;
  workspace_id: string;
  company_id: string;
  reference: string;
  owner_id: string;
  version: number;
  revision: number;
  current_revision_id: string;
  state: SourceState;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  synthetic: true;
};
export type SourceRevision = {
  id: string;
  workspace_id: string;
  company_id: string;
  source_id: string;
  revision: number;
  predecessor_id: string | null;
  content: SourceContent;
  content_hash: string;
  reason: string;
  created_by: string;
  created_at: Date;
};
export type SourceEvent = {
  id: string;
  workspace_id: string;
  source_id: string;
  revision_id: string;
  source_version: number;
  action: "DraftSaved" | "Submitted" | "Reviewed" | "Returned" | "Rejected";
  reason: string;
  operation_id: string;
  created_by: string;
  created_at: Date;
};
export const sourceHash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export async function sourcesAvailable(c: QueryClient) {
  return Boolean(
    (await c.query("SELECT to_regclass('ppo.cost_sources') AS present")).rows[0]
      .present,
  );
}
export async function sourceContext(
  c: QueryClient,
  p: Principal,
  id: string,
  capability:
    | "estimating.read"
    | "estimating.edit"
    | "estimating.source.review" = "estimating.read",
) {
  const row = (
    await c.query<CostSource>(
      "SELECT * FROM ppo.cost_sources WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "source_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await companyContext(c, p, row.company_id, null, "estimating.read");
  if (capability !== "estimating.read")
    await companyContext(c, p, row.company_id, null, capability);
  if (capability === "estimating.edit" && row.owner_id !== p.actor_id)
    throw new AppError(
      403,
      "SourceOwnerRequired",
      "Only the source owner with current estimating edit authority can revise or submit it.",
    );
  return row;
}
export async function sourceRevision(
  c: QueryClient,
  p: Principal,
  source: CostSource,
  id: string,
) {
  const row = (
    await c.query<SourceRevision>(
      "SELECT * FROM ppo.cost_source_revisions WHERE workspace_id=$1 AND source_id=$2 AND id=$3",
      [p.workspace_id, source.id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const content = sourceContent(row.content);
  if (sourceHash(content) !== row.content_hash)
    throw new AppError(
      409,
      "SourceEvidenceMismatch",
      "The saved source evidence does not match its retained hash.",
    );
  return { ...row, content };
}
export async function sourceReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
) {
  return sourceContext(
    c,
    p,
    id,
    command === "ReviewCostSource"
      ? "estimating.source.review"
      : "estimating.edit",
  );
}
