import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../../platform/permissions";
import {
  object,
  optionalId,
  optionalText,
  choice,
} from "../../shared/validation";
import { estimateContext } from "../context";
import { sourceContext, sourceRevision, type SourceEvent } from "./context";

export async function listCostSources(
  p: Principal,
  query: Record<string, string> = {},
) {
  const input = object(query, ["q", "state"]),
    q = optionalText(input.q, "q", 100) ?? "",
    state = input.state
      ? choice(input.state, "state", [
          "Draft",
          "Submitted",
          "Reviewed",
          "Returned",
          "Rejected",
        ] as const)
      : null;
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireCapability(c, p, "estimating.read");
    const rows = (
      await c.query<{ id: string }>(
        `SELECT s.id FROM ppo.cost_sources s JOIN ppo.cost_source_revisions r ON (r.workspace_id,r.id)=(s.workspace_id,s.current_revision_id)
      WHERE s.workspace_id=$1 AND ${scopeSql("s.company_id", "NULL", "estimating.read")} AND ${scopeSql("s.company_id", "NULL", "shared.read")}
      AND ($3='' OR strpos(lower(s.reference||' '||(r.content->>'title')||' '||(r.content->>'supplier_label')||' '||(r.content->>'item_reference')),lower($3))>0)
      AND ($4::text IS NULL OR s.state=$4) ORDER BY s.updated_at DESC,s.id LIMIT 100`,
        [p.workspace_id, p.actor_id, q, state],
      )
    ).rows;
    const items = [];
    for (const row of rows) {
      const source = await sourceContext(c, p, row.id),
        revision = await sourceRevision(
          c,
          p,
          source,
          source.current_revision_id,
        );
      const reviewed_revisions = (
        await c.query<{ id: string; revision: number }>(
          `SELECT r.id,r.revision FROM ppo.cost_source_revisions r WHERE r.workspace_id=$1 AND r.source_id=$2 AND EXISTS(SELECT 1 FROM ppo.cost_source_events e WHERE e.workspace_id=r.workspace_id AND e.revision_id=r.id AND e.action='Reviewed') ORDER BY r.revision DESC LIMIT 50`,
          [p.workspace_id, source.id],
        )
      ).rows;
      items.push({
        id: source.id,
        reference: source.reference,
        company_id: source.company_id,
        state: source.state,
        version: source.version,
        revision: revision.revision,
        revision_id: revision.id,
        title: revision.content.title,
        supplier: revision.content.supplier_label,
        item: revision.content.item_reference,
        unit: revision.content.unit,
        effective_from: revision.content.effective_from,
        valid_until: revision.content.valid_until,
        updated_at: source.updated_at,
        reviewed_revisions,
      });
    }
    const companies = (
      await c.query<{ id: string; display_name: string }>(
        `SELECT c.id,c.display_name FROM ppo.companies c WHERE c.workspace_id=$1 AND ${scopeSql("c.id", "NULL", "estimating.read")} AND ${scopeSql("c.id", "NULL", "estimating.edit")} AND ${scopeSql("c.id", "NULL", "shared.read")} ORDER BY c.display_name,c.id`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    return {
      items,
      companies,
      owner_id: p.actor_id,
      limit: 100,
      filters: { q, state },
      synthetic: true,
    };
  });
}
export async function readCostSource(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const input = object(query, ["revision_id"]);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const source = await sourceContext(c, p, id),
      revision = await sourceRevision(
        c,
        p,
        source,
        optionalId(input.revision_id, "revision_id") ??
          source.current_revision_id,
      );
    const history = (
      await c.query<SourceEvent>(
        "SELECT * FROM ppo.cost_source_events WHERE workspace_id=$1 AND source_id=$2 ORDER BY source_version DESC",
        [p.workspace_id, source.id],
      )
    ).rows;
    const revisions = (
      await c.query<{
        id: string;
        revision: number;
        content_hash: string;
        reason: string;
        created_by: string;
        created_at: Date;
      }>(
        "SELECT id,revision,content_hash,reason,created_by,created_at FROM ppo.cost_source_revisions WHERE workspace_id=$1 AND source_id=$2 ORDER BY revision DESC",
        [p.workspace_id, source.id],
      )
    ).rows;
    const candidates = (
      await c.query<{
        estimate_id: string;
        estimate_version_id: string;
        version: number;
        display_number: string;
        line_id: string;
        is_current: boolean;
      }>(
        `SELECT e.id AS estimate_id,v.id AS estimate_version_id,v.version,e.display_number,b.line_id,v.id=e.current_version_id AS is_current
      FROM ppo.estimate_cost_source_bindings b JOIN ppo.cost_source_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.source_revision_id)
      JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(b.workspace_id,b.estimate_version_id) JOIN ppo.estimates e ON (e.workspace_id,e.id)=(v.workspace_id,v.estimate_id)
      WHERE b.workspace_id=$1 AND r.source_id=$2 ORDER BY v.created_at DESC,b.line_id LIMIT 100`,
        [p.workspace_id, source.id],
      )
    ).rows;
    const affected = [];
    for (const row of candidates)
      try {
        await estimateContext(
          c,
          p,
          row.estimate_id,
          "estimating.read",
          row.estimate_version_id,
        );
        affected.push(row);
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
      }
    const current = revision.id === source.current_revision_id,
      own = source.owner_id === p.actor_id;
    const edit =
      own && (await hasPermission(c, p, "estimating.edit", source.company_id));
    return {
      source,
      revision,
      previous_revision: revision.predecessor_id
        ? await sourceRevision(c, p, source, revision.predecessor_id)
        : null,
      revisions,
      history,
      affected,
      affected_limit: 100,
      can_revise: current && edit && source.state !== "Submitted",
      can_submit: current && edit && source.state === "Draft",
      can_review:
        current &&
        !own &&
        source.state === "Submitted" &&
        (await hasPermission(
          c,
          p,
          "estimating.source.review",
          source.company_id,
        )),
      synthetic: true,
    };
  });
}
