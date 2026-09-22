import { createHash } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { canonical } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { object, uuid, invalid } from "../../shared/validation";
import { visible } from "../../shared/reads";
import { projectFacility } from "../../shared/facilities/reads";
import {
  workspaceAuthority,
  revisionAuthority,
  optionContext,
  requireActiveOption,
  requireDraftGroup,
  type DiscoveryWorkspace,
  type DiscoveryRevision,
} from "../discovery-workspace-context";
import { readDiscoveryTargets } from "../discovery-context";
import type {
  Coverage,
  FertigationRecord,
  ScopeRevision,
  SourceBinding,
} from "./storage-types";

export const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export const MAX_BYTES = 2_097_152;
export function bounded(value: unknown, maxBytes = MAX_BYTES) {
  // Bound before canonical recursion as well as after normalisation. Direct service callers
  // receive the same limit as HTTP; no legacy Discovery/ES-08 envelope is enlarged.
  const visit = (item: unknown, depth: number) => {
    if (depth > 16)
      invalid(
        "payload",
        "Fertigation payload nesting exceeds the supported depth.",
      );
    if (item && typeof item === "object")
      for (const v of Object.values(item)) visit(v, depth + 1);
  };
  visit(value, 0);
  const json = JSON.stringify(value);
  if (typeof json !== "string")
    invalid("payload", "A JSON request is required.");
  if (Buffer.byteLength(json, "utf8") > maxBytes)
    invalid(
      "payload",
      `The complete fertigation request exceeds ${maxBytes / 1024 / 1024} MiB.`,
    );
}
export function coverage(value: unknown): Coverage {
  const r = object(value, ["system_id", "area_ids", "facility_ids"]);
  const ids = (v: unknown, field: string, max: number) => {
    if (!Array.isArray(v) || v.length > max)
      invalid(field, `At most ${max} references are supported.`);
    const result = (v as unknown[]).map((item) => uuid(item, field));
    if (new Set(result).size !== result.length)
      invalid(field, "Duplicate references are not accepted.");
    return result.sort();
  };
  return {
    system_id: r.system_id === null ? null : uuid(r.system_id, "system_id"),
    area_ids: ids(r.area_ids, "area_ids", 20),
    facility_ids: ids(r.facility_ids, "facility_ids", 10),
  };
}
export async function requireAvailable(c: QueryClient) {
  if (
    !(await c.query("SELECT to_regclass('ppo.fertigation_scopes') AS relation"))
      .rows[0].relation
  )
    throw new AppError(
      503,
      "FertigationUnavailable",
      "Fertigation requires the compatible database upgrade.",
    );
}
export async function scopeRecord(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  await requireAvailable(c);
  const row = (
    await c.query<FertigationRecord>(
      "SELECT * FROM ppo.fertigation_scopes WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "scope_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const g = await workspaceAuthority(c, p, row.estimating_workspace_id, edit);
  if (g.company_id !== row.company_id || (edit && row.owner_id !== p.actor_id))
    throw unavailable();
  return row;
}
type SavedRevisionAuthority = {
  saved: ScopeRevision;
  g: DiscoveryWorkspace;
  source: DiscoveryRevision;
};
export async function savedRevision(
  c: QueryClient,
  p: Principal,
  scope: FertigationRecord,
  id = scope.current_revision_id,
  edit = false,
  lineageSeen = new Set<string>(),
  verified = new Map<string, SavedRevisionAuthority>(),
): Promise<SavedRevisionAuthority> {
  const lineageKey = `${scope.id}:${id}`;
  if (lineageSeen.has(lineageKey) || lineageSeen.size >= 20)
    throw unavailable();
  const verifiedKey = `${lineageKey}:${edit}`;
  const previous = verified.get(verifiedKey);
  if (previous) return previous;
  lineageSeen.add(lineageKey);
  const saved = (
    await c.query<ScopeRevision>(
      "SELECT * FROM ppo.fertigation_revisions WHERE workspace_id=$1 AND scope_id=$2 AND id=$3",
      [p.workspace_id, scope.id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!saved) throw unavailable();
  const g = await workspaceAuthority(c, p, scope.estimating_workspace_id, edit);
  const source = await revisionAuthority(
    c,
    p,
    g,
    saved.source_revision_id,
    edit,
  );
  if (
    source.option_id !== scope.option_id ||
    hash({
      proposal: saved.proposal,
      calculation_edition: saved.calculation_edition,
    }) !== saved.calculation_input_hash ||
    hash({
      binding: saved.binding,
      proposal: saved.proposal,
      calculation: saved.calculation,
      calculation_edition: saved.calculation_edition,
      source_hash: saved.source_hash,
    }) !== saved.content_hash
  )
    throw new AppError(
      409,
      "FertigationEvidenceMismatch",
      "The exact saved fertigation revision requires review before use.",
    );
  // Historical authority follows every retained source, even if the current revision drops it.
  for (const observation of saved.binding.facility_observations)
    await visible(c, p, "Facility", observation.id);
  const copied = (
    await c.query<{
      source_scope_id: string;
      source_revision_id: string;
      identity_map: Record<string, string>;
      content_hash: string;
    }>(
      "SELECT source_scope_id,source_revision_id,identity_map,content_hash FROM ppo.fertigation_copies WHERE workspace_id=$1 AND scope_id=$2",
      [p.workspace_id, scope.id],
    )
  ).rows[0];
  if (copied) {
    if (
      hash({
        source_scope_id: copied.source_scope_id,
        source_revision_id: copied.source_revision_id,
        identity_map: copied.identity_map,
      }) !== copied.content_hash
    )
      throw unavailable();
    const original = await scopeRecord(c, p, copied.source_scope_id);
    await savedRevision(
      c,
      p,
      original,
      copied.source_revision_id,
      false,
      new Set(lineageSeen),
      verified,
    );
  }
  const preparedSources = new Set<string>();
  for (const evidence of saved.proposal.evidence) {
    if (!evidence.reference.startsWith("ppo-file:")) continue;
    const evidenceId = uuid(evidence.reference.slice(9), "evidence.reference");
    const file = (
      await c.query<{ revision_id: string; sha256: string }>(
        "SELECT revision_id,sha256 FROM ppo.fertigation_evidence WHERE workspace_id=$1 AND scope_id=$2 AND id=$3",
        [p.workspace_id, scope.id, evidenceId],
      )
    ).rows[0];
    if (!file || file.sha256 !== evidence.sha256) throw unavailable();
    preparedSources.add(file.revision_id);
  }
  for (const revisionId of preparedSources)
    await savedRevision(
      c,
      p,
      scope,
      revisionId,
      false,
      new Set(lineageSeen),
      verified,
    );
  const result = { saved, g, source };
  verified.set(verifiedKey, result);
  return result;
}
export async function observeBinding(
  c: QueryClient,
  p: Principal,
  workspaceId: string,
  optionId: string,
  revisionId: string,
  selection: Coverage,
  edit = true,
): Promise<SourceBinding> {
  const g = await workspaceAuthority(c, p, workspaceId, edit);
  const option = await optionContext(c, g, optionId);
  const revision = await revisionAuthority(c, p, g, revisionId, edit);
  if (edit) requireActiveOption(option);
  if (
    revision.kind !== "Discovery" ||
    revision.option_id !== option.id ||
    !revision.input ||
    !revision.scope_snapshot_id ||
    !revision.answer_snapshot_id
  )
    throw unavailable();
  if (
    selection.facility_ids.some(
      (id) => !revision.input!.scope.facility_ids.includes(id),
    )
  )
    throw unavailable();
  if (selection.system_id !== null) {
    const system = revision.input.configuration?.systems.find(
      (s) => s.id === selection.system_id,
    );
    if (
      !system ||
      system.family !== "Fertigation" ||
      selection.area_ids.some((id) => !system.coverage.area_ids.includes(id))
    )
      throw unavailable();
  } else if (selection.area_ids.length)
    invalid(
      "area_ids",
      "Area coverage requires an exact saved Fertigation system.",
    );
  const current = await readDiscoveryTargets(
    c,
    p,
    g.opportunity_id,
    revision.input,
    "estimating.read",
    revision.observed_context?.contact?.id,
  );
  const facility_observations = [];
  for (const id of selection.facility_ids) {
    const row = await visible(c, p, "Facility", id);
    const facility = await projectFacility(c, p, row);
    facility_observations.push({
      id,
      version: facility.version,
      details: facility.details,
    });
  }
  return {
    ...selection,
    schema_version: 1,
    estimating_workspace_id: g.id,
    option_id: option.id,
    revision_id: revision.id,
    scope_snapshot_id: revision.scope_snapshot_id,
    answer_snapshot_id: revision.answer_snapshot_id,
    content_hash: revision.content_hash!,
    context_hash: revision.context_hash!,
    site_id: revision.site_id,
    upstream_context_hash: hash({
      discovery: current.context_hash,
      facilities: facility_observations,
    }),
    captured_discovery: revision.observed_context,
    facility_observations,
  };
}
export async function writable(
  c: QueryClient,
  p: Principal,
  scope: FertigationRecord,
) {
  const current = await savedRevision(
    c,
    p,
    scope,
    scope.current_revision_id,
    true,
  );
  await requireDraftGroup(c, p, current.g);
  requireActiveOption(await optionContext(c, current.g, scope.option_id));
  if (scope.state !== "Active")
    throw new AppError(
      409,
      "FertigationArchived",
      "Archived scopes retain their exact history and cannot accept content.",
    );
  return current;
}
export async function acceptedAuthority(
  c: QueryClient,
  p: Principal,
  scopeId: string,
  operationId: string,
) {
  const row = (
    await c.query<{
      details: {
        revision_id?: string;
        original_receipt?: { operation_id: string; record_id: string } | null;
      };
    }>(
      "SELECT a.details FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id) WHERE a.workspace_id=$1 AND a.actor_id=$2 AND a.operation_id=$3 AND a.object_type='FertigationScope' AND a.object_id=$4",
      [p.workspace_id, p.actor_id, operationId, scopeId],
    )
  ).rows[0];
  if (!row) return null;
  const scope = await scopeRecord(c, p, scopeId, true);
  if (!row.details.revision_id) throw unavailable();
  await savedRevision(c, p, scope, row.details.revision_id, true);
  if (row.details.original_receipt) {
    const original = row.details.original_receipt;
    if (
      original.operation_id === operationId ||
      !(await acceptedAuthority(
        c,
        p,
        original.record_id,
        original.operation_id,
      ))
    )
      throw unavailable();
  }
  return scope;
}
export async function notClosed(
  c: QueryClient,
  p: Principal,
  operationId: string,
) {
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.fertigation_operation_closures WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, operationId],
      )
    ).rowCount
  )
    throw new AppError(
      409,
      "FertigationOriginalClosed",
      "This original operation was permanently closed without acceptance. Start a separately reviewed intent.",
    );
}
export async function commandAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operationId: string,
) {
  await notClosed(c, p, operationId);
  return (
    (await acceptedAuthority(c, p, id, operationId)) ??
    (await scopeRecord(c, p, id, true))
  );
}
