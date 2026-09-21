import { acceptedEstimateContext } from "../context";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { uuid, object, choice, invalid } from "../../shared/validation";
import {
  workspaceAuthority,
  revisionAuthority,
  optionContext,
  requireActiveOption,
  requireDraftGroup,
  type DiscoveryRevision,
} from "../discovery-workspace-context";
import { bundleId, bundleHash } from "./definition";
import { hash } from "./hash";
import { list } from "./validation";
import type {
  Binding,
  Configuration,
  SavedDraft,
  SavedRun,
  SavedResolved,
} from "./types";
export async function available(c: QueryClient) {
  return Boolean(
    (
      await c.query(
        "SELECT to_regclass('ppo.specialist_configurations') AS relation",
      )
    ).rows[0].relation,
  );
}
export async function requireAvailable(c: QueryClient) {
  if (!(await available(c)))
    throw new AppError(
      503,
      "SpecialistUnavailable",
      "Specialist configuration requires the compatible database contract.",
    );
  const d = (
    await c.query(
      "SELECT bundle_hash FROM ppo.specialist_definitions WHERE id=$1",
      [bundleId],
    )
  ).rows[0];
  if (d?.bundle_hash !== bundleHash)
    throw new AppError(
      503,
      "SpecialistUnavailable",
      "The exact specialist definition is not installed.",
    );
}
export function mismatch(): never {
  throw new AppError(
    409,
    "SpecialistEvidenceMismatch",
    "The saved specialist evidence does not match its immutable source. Review the record before reuse.",
  );
}
export async function configuration(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  await requireAvailable(c);
  const row = (
    await c.query<Configuration>(
      "SELECT * FROM ppo.specialist_configurations WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "configuration_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const g = await workspaceAuthority(c, p, row.estimating_workspace_id, edit);
  if (g.company_id !== row.company_id) throw unavailable();
  if (edit && row.owner_id !== p.actor_id) throw unavailable();
  return row;
}
export async function draft(
  c: QueryClient,
  p: Principal,
  cfg: Configuration,
  id = cfg.current_draft_id,
  edit = false,
) {
  const d = (
    await c.query<SavedDraft>(
      "SELECT * FROM ppo.specialist_drafts WHERE workspace_id=$1 AND configuration_id=$2 AND id=$3",
      [p.workspace_id, cfg.id, id],
    )
  ).rows[0];
  if (!d) throw unavailable();
  const g = await workspaceAuthority(c, p, cfg.estimating_workspace_id, edit),
    r = await revisionAuthority(c, p, g, d.binding.revision_id, edit);
  if (
    r.option_id !== cfg.option_id ||
    hash({ binding: d.binding, proposal: d.proposal }) !== d.content_hash
  )
    mismatch();
  validateInherited(d.proposal, r);
  return { d, g, r };
}
export async function run(
  c: QueryClient,
  p: Principal,
  cfg: Configuration,
  id: string,
  edit = false,
) {
  const r = (
    await c.query<SavedRun>(
      "SELECT * FROM ppo.specialist_runs WHERE workspace_id=$1 AND configuration_id=$2 AND id=$3",
      [p.workspace_id, cfg.id, uuid(id, "run_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await draft(c, p, cfg, r.draft_id, edit);
  if (hash(r.snapshot) !== r.evidence_hash) mismatch();
  return r;
}
export async function resolved(
  c: QueryClient,
  p: Principal,
  cfg: Configuration,
  id: string,
  edit = false,
) {
  const s = (
    await c.query<SavedResolved>(
      "SELECT * FROM ppo.specialist_resolved_sets WHERE workspace_id=$1 AND configuration_id=$2 AND id=$3",
      [p.workspace_id, cfg.id, uuid(id, "resolved_set_id")],
    )
  ).rows[0];
  if (!s) throw unavailable();
  await run(c, p, cfg, s.run_id, edit);
  if (hash(s.snapshot) !== s.content_hash) mismatch();
  return s;
}
export async function writable(
  c: QueryClient,
  p: Principal,
  cfg: Configuration,
) {
  const { g } = await draft(c, p, cfg, cfg.current_draft_id, true);
  await requireDraftGroup(c, p, g);
  requireActiveOption(await optionContext(c, g, cfg.option_id));
  if (cfg.state !== "Active")
    throw new AppError(
      409,
      "SpecialistArchived",
      "Archived configurations retain history and cannot accept new content.",
    );
  return g;
}
export function coverage(value: unknown) {
  const r = object(value, ["kind", "system_id", "area_ids", "facility_ids"]);
  const ids = (v: unknown, f: string, max: number) => {
    const a = list(v, f, max).map((v) => uuid(v, f));
    if (new Set(a).size !== a.length)
      invalid(f, "Duplicate coverage identities are not accepted.");
    return a.sort();
  };
  return {
    kind: choice(r.kind, "kind", [
      "StructuredSystem",
      "FacilityScope",
    ] as const),
    system_id: r.system_id === null ? null : uuid(r.system_id, "system_id"),
    area_ids: ids(r.area_ids, "area_ids", 20),
    facility_ids: ids(r.facility_ids, "facility_ids", 10),
  };
}
export async function binding(
  c: QueryClient,
  p: Principal,
  workspaceId: string,
  optionId: string,
  revisionId: string,
  selection: ReturnType<typeof coverage>,
  edit = true,
): Promise<Binding> {
  const g = await workspaceAuthority(c, p, workspaceId, edit),
    o = await optionContext(c, g, optionId),
    r = await revisionAuthority(c, p, g, revisionId, edit);
  if (edit) requireActiveOption(o);
  if (
    r.kind !== "Discovery" ||
    r.option_id !== o.id ||
    !r.input ||
    !r.scope_snapshot_id ||
    !r.answer_snapshot_id
  )
    throw unavailable();
  const facilities = r.input.scope.facility_ids;
  if (selection.facility_ids.some((id) => !facilities.includes(id)))
    throw unavailable();
  if (selection.kind === "StructuredSystem") {
    const system = r.input.configuration?.systems.find(
      (s) => s.id === selection.system_id,
    );
    if (
      !system ||
      selection.area_ids.some((id) => !system.coverage.area_ids.includes(id))
    )
      throw unavailable();
    if (system.coverage.mode !== "Defined" || selection.area_ids.length === 0)
      throw new AppError(
        422,
        "SpecialistCoverageRequired",
        "Select explicit saved system coverage for this configuration.",
      );
  } else if (
    selection.system_id !== null ||
    selection.area_ids.length ||
    !selection.facility_ids.length
  )
    throw new AppError(
      422,
      "SpecialistCoverageRequired",
      "Select at least one permitted saved Facility or structured system.",
    );
  return {
    ...selection,
    estimating_workspace_id: g.id,
    option_id: o.id,
    revision_id: r.id,
    scope_snapshot_id: r.scope_snapshot_id,
    answer_snapshot_id: r.answer_snapshot_id,
    content_hash: r.content_hash!,
    context_hash: r.context_hash!,
    site_id: r.site_id,
  };
}
export function validateInherited(
  proposal: SavedDraft["proposal"],
  revision: DiscoveryRevision,
) {
  for (const [key, value] of Object.entries(proposal.inputs)) {
    if (value.attribution.kind === "inherited") {
      // ES-02's current fact contract contains text and zone/capacity counts,
      // not Screen Systems geometry. Equality of numeric text is not a
      // semantic or unit mapping. Source context is inherited through binding;
      // numeric inheritance requires a separately versioned compatible mapping.
      const fact = revision.input?.configuration?.facts.find(
        (f) => f.id === value.attribution.source_field,
      );
      throw new AppError(
        422,
        "SpecialistSourceChanged",
        fact
          ? `Saved source fact ${fact.field} has no compatible Screen Systems mapping for ${key}. Enter the value with explicit attribution.`
          : `Inherited ${key} must identify a compatible saved source fact.`,
      );
    } else if (value.attribution.source_field !== null)
      throw new AppError(
        422,
        "SpecialistSourceChanged",
        "Only inherited values may claim a saved source field.",
      );
  }
}
export async function acceptedAuthority(
  c: QueryClient,
  p: Principal,
  configurationId: string,
  operationId: string,
) {
  const a = (
    await c.query<{
      details: {
        configuration_id?: string;
        draft_id?: string;
        run_id?: string;
        resolved_set_id?: string;
        source_configuration_id?: string;
        source_draft_id?: string;
        original_configuration_id?: string;
        original_estimate_id?: string;
        original_operation_id?: string;
      };
    }>(
      `SELECT a.details FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id) WHERE a.workspace_id=$1 AND a.actor_id=$2 AND a.operation_id=$3 AND (a.object_id=$4 OR a.details->>'configuration_id'=$4::text)`,
      [p.workspace_id, p.actor_id, operationId, configurationId],
    )
  ).rows[0];
  if (!a) return null;
  const cfg = await configuration(c, p, configurationId, true);
  if (!a.details.draft_id) throw unavailable();
  await draft(c, p, cfg, a.details.draft_id, true);
  if (a.details.run_id) await run(c, p, cfg, a.details.run_id, true);
  if (a.details.resolved_set_id)
    await resolved(c, p, cfg, a.details.resolved_set_id, true);
  if (a.details.source_configuration_id) {
    const source = await configuration(c, p, a.details.source_configuration_id);
    await draft(c, p, source, a.details.source_draft_id);
  }
  if (a.details.original_configuration_id && a.details.original_operation_id) {
    if (
      !(await acceptedAuthority(
        c,
        p,
        a.details.original_configuration_id,
        a.details.original_operation_id,
      ))
    )
      throw unavailable();
  }
  if (
    a.details.original_estimate_id &&
    a.details.original_operation_id &&
    !(await acceptedEstimateContext(
      c,
      p,
      a.details.original_estimate_id,
      a.details.original_operation_id,
    ))
  )
    throw unavailable();
  return cfg;
}
export async function notClosed(c: QueryClient, p: Principal, id: string) {
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.specialist_operation_closures WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, id],
      )
    ).rowCount
  )
    throw new AppError(
      409,
      "SpecialistOriginalClosed",
      "This original operation was terminally closed without acceptance. Start a new reviewed intent.",
    );
}
