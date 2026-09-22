import type { Principal } from "../../platform/identity";
import { database, transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../../platform/permissions";
import { object, uuid } from "../../shared/validation";
import {
  workspaceAuthority,
  optionContext,
  revisionAuthority,
} from "../discovery-workspace-context";
import { blankScope } from "./definition";
import {
  requireAvailable,
  scopeRecord,
  savedRevision,
  writable,
  observeBinding,
} from "./context";
import type { FertigationRecord } from "./storage-types";
const denied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);

export async function fertigationAvailability(p: Principal) {
  const c = database();
  await requireCapability(c, p, "estimating.read");
  try {
    await requireAvailable(c);
    return { available: true };
  } catch (e) {
    if (e instanceof AppError && e.code === "FertigationUnavailable")
      return { available: false };
    throw e;
  }
}
export async function listScopes(
  p: Principal,
  query: Record<string, string> = {},
) {
  object(query, [
    "estimating_workspace_id",
    "option_id",
    "state",
    "search",
    "before",
  ]);
  const c = database();
  await requireAvailable(c);
  await requireCapability(c, p, "estimating.read");
  const workspace = query.estimating_workspace_id
    ? uuid(query.estimating_workspace_id, "estimating_workspace_id")
    : null;
  const option = query.option_id ? uuid(query.option_id, "option_id") : null;
  if (workspace) await workspaceAuthority(c, p, workspace);
  const state = query.state ?? "Active";
  if (
    !["Active", "Archived"].includes(state) ||
    (query.search?.length ?? 0) > 200
  )
    throw new AppError(
      422,
      "InvalidData",
      "Choose an available state and a search of at most 200 characters.",
    );
  const before = query.before ? await scopeRecord(c, p, query.before) : null;
  if (before) await savedRevision(c, p, before);
  const candidates = (
    await c.query<FertigationRecord>(
      `SELECT s.* FROM ppo.fertigation_scopes s JOIN ppo.fertigation_revisions r ON (r.workspace_id,r.id)=(s.workspace_id,s.current_revision_id) WHERE s.workspace_id=$1 AND ${scopeSql("s.company_id", "(r.binding->>'site_id')::uuid", "estimating.read")} AND s.state=$3 AND ($4::uuid IS NULL OR s.estimating_workspace_id=$4) AND ($5::uuid IS NULL OR s.option_id=$5) AND ($6::timestamptz IS NULL OR (s.updated_at,s.id)<($6::timestamptz,$7::uuid)) AND s.name ILIKE $8 ORDER BY s.updated_at DESC,s.id DESC LIMIT 500`,
      [
        p.workspace_id,
        p.actor_id,
        state,
        workspace,
        option,
        before?.updated_at ?? null,
        before?.id ?? null,
        `%${(query.search ?? "").replace(/[%_\\]/g, "\\$&")}%`,
      ],
    )
  ).rows;
  const items = [];
  for (const candidate of candidates) {
    try {
      const scope = await scopeRecord(c, p, candidate.id),
        { saved, g, source } = await savedRevision(c, p, scope),
        o = await optionContext(c, g, scope.option_id);
      items.push({
        id: scope.id,
        name: scope.name,
        display_number: scope.display_number,
        version: scope.version,
        state: scope.state,
        revision_id: saved.id,
        revision: saved.version,
        updated_at: scope.updated_at,
        option_label: o.label,
        source_revision: source.version,
        scope_readiness: source.scope_readiness,
        valve_count: saved.proposal.valves.length,
      });
      if (items.length === 51) break;
    } catch (e) {
      if (!denied(e)) throw e;
    }
  }
  return {
    items: items.slice(0, 50),
    next_cursor: items.length > 50 ? items[49].id : null,
    can_create: await hasPermission(c, p, "estimating.edit"),
    synthetic: true,
  };
}
export async function readScope(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, ["revision_id"]);
  return transaction(async (c) => {
    const scope = await scopeRecord(c, p, id),
      { saved, g, source } = await savedRevision(
        c,
        p,
        scope,
        query.revision_id ?? scope.current_revision_id,
      ),
      option = await optionContext(c, g, scope.option_id);
    let can_edit = false,
      edit_blocker: string | null = null;
    if (saved.id !== scope.current_revision_id)
      edit_blocker =
        "This is an exact historical revision. Open the current revision to edit.";
    else
      try {
        await scopeRecord(c, p, id, true);
        await writable(c, p, scope);
        can_edit = true;
      } catch (e) {
        if (e instanceof AppError && [403, 404, 409].includes(e.status))
          edit_blocker =
            e.status === 404
              ? "Editing is unavailable under current access."
              : e.message;
        else throw e;
      }
    const current = await observeBinding(
      c,
      p,
      g.id,
      scope.option_id,
      saved.source_revision_id,
      saved.binding,
      false,
    );
    return {
      scope,
      revision: saved,
      source: {
        workspace_version: g.version,
        option_label: option.label,
        revision: source.version,
        scope_readiness: source.scope_readiness,
        selected: g.selected_option_id === scope.option_id,
        source: source.observed_context,
        current_revision_id: option.current_revision_id,
        context_hash: saved.binding.upstream_context_hash,
        current_context_hash: current.upstream_context_hash,
        changed:
          option.current_revision_id !== saved.source_revision_id ||
          current.upstream_context_hash !== saved.binding.upstream_context_hash,
      },
      calculation: saved.calculation,
      can_edit,
      edit_blocker,
      actor_id: p.actor_id,
      workspace_id: p.workspace_id,
      synthetic: true,
    };
  });
}
export async function scopeHistory(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, ["before"]);
  const c = database(),
    scope = await scopeRecord(c, p, id);
  const before = query.before
    ? (await savedRevision(c, p, scope, query.before)).saved
    : null;
  const rows = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.fertigation_revisions WHERE workspace_id=$1 AND scope_id=$2 AND ($3::integer IS NULL OR version<$3) ORDER BY version DESC LIMIT 51",
      [p.workspace_id, scope.id, before?.version ?? null],
    )
  ).rows;
  const items = [];
  for (const row of rows) {
    try {
      const { saved } = await savedRevision(c, p, scope, row.id);
      items.push({
        id: saved.id,
        version: saved.version,
        created_at: saved.created_at,
        created_by: saved.created_by,
        reason: saved.reason,
        content_hash: saved.content_hash,
        source_revision_id: saved.source_revision_id,
      });
    } catch (e) {
      if (!denied(e)) throw e;
      return {
        items: items.slice(0, 50),
        next_cursor: null,
        history_withheld: true,
      };
    }
  }
  return {
    items: items.slice(0, 50),
    next_cursor: items.length > 50 ? items[49].id : null,
    history_withheld: false,
  };
}
export async function creationOptions(
  p: Principal,
  query: Record<string, string> = {},
) {
  object(query, ["estimating_workspace_id", "option_id"]);
  const c = database();
  await requireAvailable(c);
  await requireCapability(c, p, "estimating.edit");
  const workspace = query.estimating_workspace_id
    ? uuid(query.estimating_workspace_id, "estimating_workspace_id")
    : null;
  const selected = query.option_id ? uuid(query.option_id, "option_id") : null;
  const rows = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND owner_id=$2 AND ($3::uuid IS NULL OR id=$3) ORDER BY updated_at DESC LIMIT 50",
      [p.workspace_id, p.actor_id, workspace],
    )
  ).rows;
  const sources = [];
  for (const row of rows)
    try {
      const g = await workspaceAuthority(c, p, row.id, true);
      const options = (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.estimating_options WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND state='Active' AND ($3::uuid IS NULL OR id=$3) ORDER BY ordinal",
          [p.workspace_id, g.id, selected],
        )
      ).rows;
      for (const item of options) {
        const option = await optionContext(c, g, item.id),
          revision = await revisionAuthority(
            c,
            p,
            g,
            option.current_revision_id,
            true,
          );
        if (revision.kind !== "Discovery" || !revision.input) continue;
        sources.push({
          estimating_workspace_id: g.id,
          expected_workspace_version: g.version,
          option_id: option.id,
          option_label: option.label,
          revision_id: revision.id,
          revision: revision.version,
          scope_readiness: revision.scope_readiness,
          site:
            revision.observed_context?.site?.display_name ??
            "Site not recorded",
          facility_ids: revision.input.scope.facility_ids,
          configuration: revision.input.configuration ?? null,
          proposal: blankScope(),
        });
      }
    } catch (e) {
      if (!denied(e)) throw e;
    }
  return { sources, actor_id: p.actor_id, workspace_id: p.workspace_id };
}
