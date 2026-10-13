import type { QueryClient } from "../../platform/permissions";
import { AppError } from "../../platform/errors";

export type Scope = { company_id: string; site_id: string };
export type Baseline = {
  baseline_template_id: string;
  baseline_policy_version: number;
  baseline_hash: string;
};
export type UsePolicy = Scope &
  Baseline & { workspace_id: string; version: number };
export type Assignment = Scope & {
  id: string;
  workspace_id: string;
  policy_version: number;
  publication_id: string;
  template_id: string;
  definition_hash: string;
  effective_from: Date;
  effective_to: Date | null;
  resolved_effective_to: Date | null;
  predecessor_id: string | null;
  successor_id: string | null;
  actor_id: string;
  operation_id: string;
  reason: string;
  approval_note: string;
  command_hash: string;
  recorded_at: Date;
};
export type SelectedTemplate = {
  id: string;
  version: number;
  definition: string;
  content_hash: string;
  renderer_version: string;
  policy_version: number;
  use_assignment_id?: string;
  selected_at?: Date;
};
export async function legacyTemplate(c: QueryClient, workspace: string) {
  return (
    await c.query<SelectedTemplate>(
      "SELECT t.*,p.version AS policy_version FROM ppo.pack_templates t JOIN ppo.pack_policy p ON (p.workspace_id,p.template_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1",
      [workspace],
    )
  ).rows[0];
}
export async function policy(c: QueryClient, workspace: string, s: Scope) {
  return (
    await c.query<UsePolicy>(
      "SELECT * FROM ppo.template_use_policies WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3",
      [workspace, s.company_id, s.site_id],
    )
  ).rows[0];
}
export const baselineOf = (t: SelectedTemplate): Baseline => ({
  baseline_template_id: t.id,
  baseline_policy_version: t.policy_version,
  baseline_hash: t.content_hash,
});
export async function serverTime(c: QueryClient): Promise<Date> {
  return (await c.query("SELECT clock_timestamp() AS now")).rows[0].now;
}
// Callers cannot supply a selection time. Older populated-upgrade fixtures still
// execute the retained domain commands before migration 0094 is installed.
export async function selectedTemplate(
  c: QueryClient,
  workspace: string,
  s: Scope,
): Promise<SelectedTemplate> {
  if (
    !(await c.query("SELECT to_regclass('ppo.template_use_policies') AS name"))
      .rows[0].name
  )
    return legacyTemplate(c, workspace);
  const h = await policy(c, workspace, s);
  if (!h) return legacyTemplate(c, workspace);
  const at = await serverTime(c);
  const active = (
    await c.query<SelectedTemplate>(
      `SELECT t.*,a.policy_version,a.id AS use_assignment_id FROM ppo.template_use_intervals a
     JOIN ppo.pack_templates t ON (t.workspace_id,t.id)=(a.workspace_id,a.template_id)
     WHERE a.workspace_id=$1 AND a.company_id=$2 AND a.site_id=$3 AND a.effective_from<=$4
     AND (a.resolved_effective_to IS NULL OR $4<a.resolved_effective_to) LIMIT 2`,
      [workspace, s.company_id, s.site_id, at],
    )
  ).rows;
  if (active.length === 1) return { ...active[0], selected_at: at };
  if (active.length > 1)
    throw new AppError(
      409,
      "AmbiguousTemplateUse",
      "Resolve overlapping template assignments.",
    );
  const first = (
    await c.query(
      "SELECT min(effective_from) AS first FROM ppo.template_use_assignments WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3",
      [workspace, s.company_id, s.site_id],
    )
  ).rows[0].first;
  if (first && at < first) {
    const t = await legacyTemplate(c, workspace);
    if (
      t &&
      t.id === h.baseline_template_id &&
      t.policy_version === h.baseline_policy_version &&
      t.content_hash === h.baseline_hash
    )
      return { ...t, selected_at: at };
    throw new AppError(
      409,
      "TemplateBaselineChanged",
      "The retained pre-activation template policy changed; review is required.",
    );
  }
  throw new AppError(
    409,
    "TemplateUseUnavailable",
    "No effective template assignment covers this site now.",
  );
}
