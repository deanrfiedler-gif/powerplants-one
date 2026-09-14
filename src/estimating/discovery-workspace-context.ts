import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import { uuid } from "../shared/validation";
import { visibleOpportunity, relationshipContext } from "../crm/context";
import { visible } from "../shared/reads";
import { estimateContext, type Estimate } from "./context";
import { readDiscoveryTargets } from "./discovery-context";
import type { Answer, DiscoveryInput } from "./discovery";

export type DiscoveryWorkspace = {
  id: string;
  workspace_id: string;
  company_id: string;
  opportunity_id: string;
  owner_id: string;
  selected_option_id: string;
  legacy_estimate_id: string | null;
  version: number;
  state: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
};
export type DiscoveryOption = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimating_workspace_id: string;
  ordinal: number;
  label: string;
  state: "Active" | "Archived";
  version: number;
  workspace_version: number;
  predecessor_option_id: string | null;
  current_revision_id: string;
  created_at: Date;
  created_by: string;
};
export type AnswerAttribution = {
  actor_id: string;
  recorded_at: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
};
export type DiscoveryRevision = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimating_workspace_id: string;
  option_id: string;
  version: number;
  kind: "LegacyManual" | "Discovery";
  predecessor_id: string | null;
  copied_from_id: string | null;
  legacy_estimate_id: string | null;
  legacy_source_created_at: Date | null;
  site_id: string | null;
  scope_snapshot_id: string | null;
  answer_snapshot_id: string | null;
  input: DiscoveryInput | null;
  observed_context:
    Awaited<ReturnType<typeof readDiscoveryTargets>>["references"] | null;
  content_hash: string | null;
  context_hash: string | null;
  scope_readiness: "NotRecorded" | "Incomplete" | "Complete";
  comparison: Record<string, unknown>;
  retained_hidden_answers: Answer[];
  answer_attribution: Record<string, AnswerAttribution>;
  reason: string;
  created_at: Date;
  created_by: string;
};
export async function discoveryAvailable(c: QueryClient) {
  return Boolean(
    (
      await c.query(
        "SELECT to_regclass('ppo.estimating_workspaces') AS relation",
      )
    ).rows[0].relation,
  );
}
export async function workspaceAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const g = (
    await c.query<DiscoveryWorkspace>(
      "SELECT * FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "workspace_id")],
    )
  ).rows[0];
  if (!g) throw unavailable();
  const o = await visibleOpportunity(c, p, g.opportunity_id);
  if (o.company_id !== g.company_id) throw unavailable();
  await relationshipContext(c, p, o, "estimating.read");
  if (edit) {
    await relationshipContext(c, p, o, "estimating.edit");
    if (g.owner_id !== p.actor_id)
      throw new AppError(
        403,
        "EstimatingOwnerRequired",
        "Only the current estimating owner can change this workspace.",
      );
  }
  return g;
}
export async function optionContext(
  c: QueryClient,
  g: DiscoveryWorkspace,
  id: string,
) {
  const o = (
    await c.query<DiscoveryOption>(
      "SELECT * FROM ppo.estimating_options WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND id=$3",
      [g.workspace_id, g.id, uuid(id, "option_id")],
    )
  ).rows[0];
  if (!o) throw unavailable();
  return o;
}
export async function revisionAuthority(
  c: QueryClient,
  p: Principal,
  g: DiscoveryWorkspace,
  id: string,
  edit = false,
) {
  const r = (
    await c.query<DiscoveryRevision>(
      "SELECT * FROM ppo.estimation_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND id=$3",
      [p.workspace_id, g.id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  if (r.kind === "LegacyManual") {
    const e = await estimateContext(
      c,
      p,
      r.legacy_estimate_id!,
      edit ? "estimating.edit" : "estimating.read",
    );
    if (
      e.opportunity_id !== g.opportunity_id ||
      e.option_id !== r.option_id ||
      e.estimation_revision_id !== r.id
    )
      throw unavailable();
  } else if (r.kind === "Discovery") {
    // The Opportunity may now name a different contact. Current access to the
    // captured contact still governs its historical label and receipt content.
    if (r.observed_context?.contact)
      await visible(c, p, "Person", r.observed_context.contact.id);
    const current = await readDiscoveryTargets(c, p, g.opportunity_id, r.input);
    if (edit) {
      const opportunity = await visibleOpportunity(c, p, g.opportunity_id);
      await relationshipContext(
        c,
        p,
        { ...opportunity, site_id: current.compiled.input.scope.site_id },
        "estimating.edit",
      );
    }
    if (
      !r.observed_context ||
      current.compiled.content_hash !== r.content_hash ||
      digest(
        canonical({
          input_hash: r.content_hash,
          references: r.observed_context,
        }),
      ) !== r.context_hash
    )
      throw new AppError(
        409,
        "DiscoveryEvidenceMismatch",
        "The retained discovery source requires review before use.",
      );
  } else throw unavailable();
  return r;
}
export async function currentGroup(
  c: QueryClient,
  p: Principal,
  g: DiscoveryWorkspace,
) {
  const options = (
    await c.query<DiscoveryOption>(
      "SELECT * FROM ppo.estimating_options WHERE workspace_id=$1 AND estimating_workspace_id=$2 ORDER BY ordinal",
      [p.workspace_id, g.id],
    )
  ).rows;
  if (
    !options.length ||
    options.length > 10 ||
    !options.some((o) => o.id === g.selected_option_id && o.state === "Active")
  )
    throw unavailable();
  const result = [];
  for (const option of options) {
    if (!["Active", "Archived"].includes(option.state)) throw unavailable();
    const revision = await revisionAuthority(
      c,
      p,
      g,
      option.current_revision_id,
    );
    if (revision.option_id !== option.id) throw unavailable();
    result.push({ option, revision });
  }
  return result;
}
export async function requireDraftGroup(
  c: QueryClient,
  p: Principal,
  g: DiscoveryWorkspace,
) {
  await c.query(
    "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
    [p.workspace_id, g.id],
  );
  const options = await currentGroup(c, p, g);
  const estimates = (
    await c.query<{ id: string; state: string }>(
      "SELECT id,state FROM ppo.estimates WHERE workspace_id=$1 AND opportunity_id=$2",
      [p.workspace_id, g.opportunity_id],
    )
  ).rows;
  for (const e of estimates) await estimateContext(c, p, e.id);
  const quotes = (
    await c.query<{ state: string }>(
      `SELECT q.state FROM ppo.draft_quotes q JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id)
    WHERE e.workspace_id=$1 AND e.opportunity_id=$2 UNION ALL SELECT q.state FROM ppo.draft_quote_revisions q JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id)
    WHERE e.workspace_id=$1 AND e.opportunity_id=$2`,
      [p.workspace_id, g.opportunity_id],
    )
  ).rows;
  if (
    g.state !== "Draft" ||
    [...estimates, ...quotes].some((r) => r.state !== "Draft")
  )
    throw new AppError(
      409,
      "EstimatingGroupHeld",
      "This commercial group cannot accept new content in its current state.",
    );
  return options;
}
export function requireActiveOption(o: DiscoveryOption) {
  if (o.state !== "Active")
    throw new AppError(
      409,
      "OptionArchived",
      "Reopen this option before creating new content.",
    );
}

// Mutate callbacks call these after original receipt recovery, so an archived
// option cannot author new content but an authorised accepted E1 receipt remains exact.
export async function guardLegacyEstimateCreate(
  c: QueryClient,
  p: Principal,
  opportunityId: string,
) {
  if (!(await discoveryAvailable(c))) return; // Explicit pre-0026 E1 upgrade surface.
  const existing = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND opportunity_id=$2",
      [p.workspace_id, opportunityId],
    )
  ).rows[0];
  if (existing) {
    await workspaceAuthority(c, p, existing.id, true);
    throw new AppError(
      409,
      "RelationshipConflict",
      "An estimating workspace already exists for this opportunity.",
    );
  }
}
export async function guardExistingEstimateMutation(
  c: QueryClient,
  p: Principal,
  e: Estimate,
) {
  if (!(await discoveryAvailable(c))) return;
  const row = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND opportunity_id=$2",
      [p.workspace_id, e.opportunity_id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const g = await workspaceAuthority(c, p, row.id, true);
  await requireDraftGroup(c, p, g);
  requireActiveOption(await optionContext(c, g, e.option_id));
}

export async function discoveryReceiptAuthority(
  c: QueryClient,
  p: Principal,
  groupId: string,
  operationId: string,
) {
  const g = await workspaceAuthority(c, p, groupId, true);
  const event = (
    await c.query<{
      details: { revision_id?: string; source_revision_id?: string };
    }>(
      "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND object_type='EstimatingWorkspace' AND object_id=$4",
      [p.workspace_id, p.actor_id, operationId, g.id],
    )
  ).rows[0];
  if (!event) throw unavailable();
  for (const id of new Set(
    [event.details.revision_id, event.details.source_revision_id].filter(
      (id): id is string => Boolean(id),
    ),
  ))
    await revisionAuthority(c, p, g, id, true);
  return g;
}
