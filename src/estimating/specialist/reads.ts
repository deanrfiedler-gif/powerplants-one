import { createResolutionAuthority } from "./recovery";
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
  configuration,
  draft,
  run,
  resolved,
  writable,
  requireAvailable,
  acceptedAuthority,
} from "./context";
import { raw } from "./validation";
import { definition, initialProposal } from "./definition";
import {
  receivingPolicy,
  receivingPolicyHash,
  fixtureIds,
  fixtureProposal,
} from "./fixture-policy";
import {
  workspaceAuthority,
  optionContext,
  revisionAuthority,
} from "../discovery-workspace-context";
import { estimateContext, versionContext } from "../context";
import { readLineage } from "./lineage";
import type { Configuration } from "./types";
const isDenied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
export async function specialistAvailability(p: Principal) {
  const c = database();
  await requireCapability(c, p, "estimating.read");
  try {
    await requireAvailable(c);
    return { available: true };
  } catch (e) {
    if (e instanceof AppError && e.code === "SpecialistUnavailable")
      return { available: false };
    throw e;
  }
}
export async function listConfigurations(
  p: Principal,
  query: Record<string, string>,
) {
  object(query, ["estimating_workspace_id", "state", "search", "before"]);
  const c = database();
  await requireAvailable(c);
  await requireCapability(c, p, "estimating.read");
  const state = query.state ?? "Active";
  if (!["Active", "Archived"].includes(state))
    throw new AppError(422, "InvalidData", "Choose Active or Archived.");
  const workspace = query.estimating_workspace_id
    ? uuid(query.estimating_workspace_id, "estimating_workspace_id")
    : null;
  if (workspace) await workspaceAuthority(c, p, workspace);
  // Cursor is an actual permitted row, bound to actor scope by reauthorization; no hidden ordinal/count.
  const before = query.before ? await configuration(c, p, query.before) : null;
  if (before) await draft(c, p, before);
  const candidates = (
    await c.query<Configuration>(
      `SELECT c.* FROM ppo.specialist_configurations c JOIN ppo.specialist_drafts d ON (d.workspace_id,d.id)=(c.workspace_id,c.current_draft_id) WHERE c.workspace_id=$1 AND ${scopeSql("c.company_id", "(d.binding->>'site_id')::uuid", "estimating.read")} AND c.state=$3 AND ($4::uuid IS NULL OR c.estimating_workspace_id=$4) AND ($5::timestamptz IS NULL OR (c.updated_at,c.id)<($5::timestamptz,$6::uuid)) AND c.name ILIKE $7 ORDER BY c.updated_at DESC,c.id DESC LIMIT 500`,
      [
        p.workspace_id,
        p.actor_id,
        state,
        workspace,
        before?.updated_at ?? null,
        before?.id ?? null,
        `%${raw(query.search ?? "", "search", 200).replace(/[%_\\]/g, "\\$&")}%`,
      ],
    )
  ).rows;
  const items = [];
  for (const candidate of candidates) {
    try {
      const cfg = await configuration(c, p, candidate.id),
        source = await draft(c, p, cfg),
        option = await optionContext(c, source.g, cfg.option_id);
      items.push({
        id: cfg.id,
        name: cfg.name,
        version: cfg.version,
        state: cfg.state,
        owner_id: cfg.owner_id,
        updated_at: cfg.updated_at,
        option_label: option.label,
        source_revision: source.r.version,
        scope_readiness: source.r.scope_readiness,
        coverage: source.d.binding,
        current_run_id: cfg.current_run_id,
        current_resolved_id: cfg.current_resolved_id,
      });
      if (items.length === 51) break;
    } catch (e) {
      if (!isDenied(e)) throw e;
    }
  }
  return {
    items: items.slice(0, 50),
    next_cursor: items.length > 50 ? items[49].id : null,
    can_create: await hasPermission(c, p, "estimating.edit"),
    synthetic: true,
  };
}
export async function readConfiguration(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (c) => {
    const cfg = await configuration(c, p, id),
      { d, g, r } = await draft(c, p, cfg),
      option = await optionContext(c, g, cfg.option_id);
    let can_edit = false,
      edit_blocker: string | null = null;
    try {
      await configuration(c, p, id, true);
      await writable(c, p, cfg);
      can_edit = true;
    } catch (e) {
      if (e instanceof AppError && [403, 404, 409].includes(e.status))
        edit_blocker =
          e.status === 404
            ? "Editing is unavailable under current access."
            : e.message;
      else throw e;
    }
    const currentRun = cfg.current_run_id
        ? await run(c, p, cfg, cfg.current_run_id)
        : null,
      currentResolved = cfg.current_resolved_id
        ? await resolved(c, p, cfg, cfg.current_resolved_id)
        : null;
    const target = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.estimates WHERE workspace_id=$1 AND option_id=$2",
        [p.workspace_id, cfg.option_id],
      )
    ).rows[0];
    let estimate: null | {
      id: string;
      version: number;
      version_id: string;
      basis_revision_id: string | null;
      cost: string | null;
      sell: string | null;
    } = null;
    if (target)
      try {
        const e = await estimateContext(c, p, target.id),
          v = await versionContext(c, p, e, e.current_version_id);
        await readLineage(c, p, v);
        estimate = {
          id: e.id,
          version: e.version,
          version_id: v.id,
          basis_revision_id: e.discovery_basis?.revision_id ?? null,
          cost: v.cost_total,
          sell: v.sell_total,
        };
      } catch (e) {
        if (!isDenied(e)) throw e;
      }
    const adoptions = (
      await c.query(
        "SELECT id,estimate_id,estimate_version_id,run_id,resolved_set_id,created_at FROM ppo.specialist_adoptions WHERE workspace_id=$1 AND configuration_id=$2 ORDER BY created_at DESC,id DESC LIMIT 50",
        [p.workspace_id, id],
      )
    ).rows;
    for (const adoption of adoptions)
      await estimateContext(
        c,
        p,
        adoption.estimate_id,
        "estimating.read",
        adoption.estimate_version_id,
      );
    const reviews = (
      await c.query(
        "SELECT finding_id,note,owner_id,next_action,disposition,created_at FROM ppo.specialist_reviews WHERE workspace_id=$1 AND configuration_id=$2 ORDER BY created_at DESC LIMIT 50",
        [p.workspace_id, id],
      )
    ).rows;
    return {
      configuration: cfg,
      draft: d,
      source: {
        workspace_version: g.version,
        option_label: option.label,
        revision: r.version,
        scope_readiness: r.scope_readiness,
        selected: g.selected_option_id === cfg.option_id,
        source: r.observed_context,
      },
      current_run: currentRun,
      current_resolved: currentResolved,
      estimate,
      adoptions,
      reviews,
      can_edit,
      edit_blocker,
      actor_id: p.actor_id,
      workspace_id: p.workspace_id,
      definition,
      receiving_policy: { id: receivingPolicy.id, hash: receivingPolicyHash },
      synthetic: true,
    };
  });
}
export async function readHistory(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  object(query, ["before", "run_id", "export"]);
  const c = database(),
    cfg = await configuration(c, p, id);
  if (query.run_id) {
    const saved = await run(c, p, cfg, query.run_id);
    return {
      snapshot: saved,
      export_label:
        "Internal synthetic review evidence; not an engineering release, ERP import or customer document",
      schema_version: 1,
      synthetic: true,
      operational_approval: false,
      review_status: "Review required",
      receiving_policy: {
        id: receivingPolicy.id,
        hash: receivingPolicyHash,
        scope: "Eligibility must be rechecked for any new adoption",
      },
    };
  }
  const before = query.before ? await run(c, p, cfg, query.before) : null,
    rows = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.specialist_runs WHERE workspace_id=$1 AND configuration_id=$2 AND ($3::integer IS NULL OR sequence<$3) ORDER BY sequence DESC LIMIT 51",
        [p.workspace_id, id, before?.sequence ?? null],
      )
    ).rows,
    items = [];
  for (const row of rows) {
    try {
      const saved = await run(c, p, cfg, row.id);
      items.push({
        id: saved.id,
        sequence: saved.sequence,
        draft_id: saved.draft_id,
        evidence_hash: saved.evidence_hash,
        created_at: saved.created_at,
        created_by: saved.created_by,
        source_revision_id: saved.snapshot.binding.revision_id,
        definition_bundle_hash: saved.snapshot.definition_bundle_hash,
        predecessor_id: saved.snapshot.predecessor_id,
      });
    } catch (e) {
      if (!isDenied(e)) throw e;
    }
  }
  return {
    items: items.slice(0, 50),
    next_cursor: items.length > 50 ? items[49].id : null,
  };
}
export async function creationOptions(
  p: Principal,
  query: Record<string, string>,
) {
  object(query, ["estimating_workspace_id"]);
  const c = database();
  await requireAvailable(c);
  await requireCapability(c, p, "estimating.edit");
  const rows = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND owner_id=$2 AND ($3::uuid IS NULL OR id=$3) ORDER BY updated_at DESC LIMIT 50",
      [
        p.workspace_id,
        p.actor_id,
        query.estimating_workspace_id
          ? uuid(query.estimating_workspace_id, "estimating_workspace_id")
          : null,
      ],
    )
  ).rows;
  const sources = [];
  for (const row of rows)
    try {
      const g = await workspaceAuthority(c, p, row.id, true),
        options = (
          await c.query<{ id: string }>(
            "SELECT id FROM ppo.estimating_options WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND state='Active' ORDER BY ordinal",
            [p.workspace_id, g.id],
          )
        ).rows;
      for (const option of options) {
        const o = await optionContext(c, g, option.id),
          r = await revisionAuthority(c, p, g, o.current_revision_id, true);
        if (r.kind !== "Discovery" || !r.input) continue;
        sources.push({
          estimating_workspace_id: g.id,
          expected_workspace_version: g.version,
          option_id: o.id,
          option_label: o.label,
          revision_id: r.id,
          revision: r.version,
          scope_readiness: r.scope_readiness,
          site: r.observed_context?.site?.display_name ?? "No site",
          facility_ids: r.input.scope.facility_ids,
          configuration: r.input.configuration ?? null,
          proposal:
            g.id === fixtureIds.estimating_workspace
              ? fixtureProposal()
              : initialProposal(),
        });
      }
    } catch (e) {
      if (!isDenied(e)) throw e;
    }
  return { sources, actor_id: p.actor_id, workspace_id: p.workspace_id };
}
export async function recoveryResult(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  object(query, ["operation_id"]);
  const c = database();
  uuid(query.operation_id, "operation_id");
  const r = (
    await c.query(
      "SELECT details,object_id FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND details->>'configuration_id'=$4 AND details->>'command' IN ('ResolveSpecialistOperation','ResolveSpecialistCreate')",
      [p.workspace_id, p.actor_id, query.operation_id, id],
    )
  ).rows[0];
  if (!r)
    throw new AppError(
      404,
      "RecordUnavailable",
      "This outcome is unavailable.",
    );
  if (r.details.command === "ResolveSpecialistCreate")
    await createResolutionAuthority(c, p, r.object_id, query.operation_id);
  else if (!(await acceptedAuthority(c, p, id, query.operation_id)))
    throw new AppError(
      404,
      "RecordUnavailable",
      "This outcome is unavailable.",
    );
  return {
    outcome: r.details.outcome,
    original_receipt: r.details.original_receipt ?? null,
  };
}
