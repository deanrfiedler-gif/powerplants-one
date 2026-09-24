import { visible } from "../shared/reads";
import type { QueryClient } from "../platform/permissions";
import { hasPermission } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { canonical } from "../platform/operations";
import { scopeDetail, type WorkOrder } from "../service/work-orders";
import { digest } from "./store";
import type { PackSnapshot } from "./render";
import type { SectionView } from "./section-readers";
import type { ScopeItem } from "./section-text";

// The saved revision and current record permissions jointly bound this optional display projection.
// A denied dependency is null; no current source is substituted for unavailable frozen content.
export async function sectionView(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  revision: { id: string; snapshot: PackSnapshot } | undefined,
  staff: boolean,
): Promise<SectionView | null> {
  if (!revision) return null;
  const s = revision.snapshot;
  if (s.schema_version !== 1 || ![1, 2].includes(s.template.version))
    return null;
  const result: SectionView = {
    revision_id: revision.id,
    scope: null,
    history: null,
  };
  try {
    if (
      await hasPermission(
        c,
        p,
        "service.work_order.read",
        w.company_id,
        w.site_id,
      )
    ) {
      const r = await scopeDetail(c, p, w, s.work.scope_id);
      if (
        r.approved_at &&
        r.content_hash === s.work.scope_hash &&
        Array.isArray(r.approved_snapshot?.items) &&
        r.approved_snapshot.items.every((item: { assets?: unknown }) =>
          Array.isArray(item.assets),
        )
      ) {
        result.scope = {
          verified: true,
          revision: r.revision,
          summary: r.summary,
          exclusions: r.exclusions,
          diagnostic_limit: r.diagnostic_limit,
          items: (r.items as ScopeItem[]).map((i) => ({
            sequence: i.sequence,
            task_kind: i.task_kind,
            task_description: i.task_description,
            completion_requirements: i.completion_requirements,
            shutdown_condition: i.shutdown_condition,
            assets: i.assets.map((a) => ({
              asset_id: staff ? a.asset_id : null,
              display_number: a.display_number,
              description: a.description,
              identity_status: a.identity_status,
              serial: a.serial,
              configuration_description: a.configuration_description,
              method: a.method,
              limits: a.limits,
            })),
          })),
        };
        for (const item of result.scope.items)
          for (const asset of item.assets)
            if (asset.asset_id) {
              try {
                await visible(c, p, "Asset", asset.asset_id);
              } catch (e) {
                if (!(e instanceof AppError) || ![403, 404].includes(e.status))
                  throw e;
                asset.asset_id = null;
              }
            }
      }
    }
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
  }
  if (await hasPermission(c, p, "shared.read", w.company_id, w.site_id)) {
    const history: NonNullable<SectionView["history"]> = [];
    // Query exactly snapshot()'s five-column basis, including the Date-valued occurrence.
    const records = s.history.length
      ? (
          await c.query(
            "SELECT id,kind,summary,confidence,occurred_at,author_label,source_system,source_id,verification_status FROM ppo.history_records WHERE workspace_id=$1 AND id=ANY($2::uuid[]) AND company_id=$3 AND site_id=$4 AND access_class IN ('RestrictedService','CustomerApproved')",
            [
              p.workspace_id,
              s.history.map((h) => h.id),
              w.company_id,
              w.site_id,
            ],
          )
        ).rows
      : [];
    for (const selected of s.history) {
      const h = records.find((row) => row.id === selected.id);
      if (!h) {
        result.history = null;
        return result;
      }
      const basis = {
        id: h.id,
        kind: h.kind,
        summary: h.summary,
        confidence: h.confidence,
        occurred_at: h.occurred_at,
      };
      history.push({
        ...basis,
        occurred_at: h.occurred_at.toISOString(),
        matches_snapshot: digest(canonical(basis)) === selected.hash,
        ...(staff
          ? {
              author_label: h.author_label,
              verification_status: h.verification_status,
              source:
                h.source_system && h.source_id
                  ? { system: h.source_system, id: h.source_id }
                  : null,
            }
          : {}),
      });
    }
    result.history = history;
  }
  return result;
}
