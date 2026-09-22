import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../discovery-workspace-context";
import { hash, scopeRecord, savedRevision, observeBinding } from "./context";
import type { Calculation, Scope } from "./types";

export type ReceivedFertigation = {
  id: string;
  scope_id: string;
  reference: string;
  name: string;
  revision_id: string;
  revision: number;
  content_hash: string;
  handover_hash: string;
  source_revision_id: string;
  accepted_at: Date;
  scope_current: boolean;
  source_current: boolean;
  technical_status: "unassessed";
  adopted_for_costing: false;
  production_context: Scope["production_context"];
  quantities: {
    represented_area: Calculation["area_m2"];
    connected_flow: Calculation["connected_flow_m3h"];
    operating_peak: Calculation["operating_peak_m3h"];
  };
  open_findings: Calculation["findings"];
  actions: Scope["actions"];
};
/** Receiving is a separate immutable association, never part of the source hash. */
export async function receivedFertigation(
  c: QueryClient,
  p: Principal,
  workspaceId: string,
  revisionId: string,
): Promise<ReceivedFertigation[]> {
  const g = await workspaceAuthority(c, p, workspaceId),
    source = await revisionAuthority(c, p, g, revisionId);
  // Older-schema upgrade proofs still exercise the unchanged Discovery reader.
  if (
    !(
      await c.query<{ available: boolean }>(
        "SELECT to_regclass('ppo.fertigation_handovers') IS NOT NULL AS available",
      )
    ).rows[0].available
  )
    return [];
  const rows = (
    await c.query<{
      id: string;
      scope_id: string;
      revision_id: string;
      content_hash: string;
      created_at: Date;
      snapshot: {
        basis?: {
          scope_id?: string;
          revision_id?: string;
          content_hash?: string;
          source_revision_id?: string;
        };
        state?: string;
        receiving_revision_id?: string;
        adopted_for_costing?: boolean;
      };
    }>(
      "SELECT id,scope_id,revision_id,content_hash,created_at,snapshot FROM ppo.fertigation_handovers WHERE workspace_id=$1 AND company_id=$2 AND estimating_workspace_id=$3 AND option_id=$4 AND receiving_revision_id=$5 ORDER BY created_at DESC,id DESC LIMIT 50",
      [p.workspace_id, g.company_id, g.id, source.option_id, source.id],
    )
  ).rows;
  const result: ReceivedFertigation[] = [];
  for (const row of rows) {
    try {
      const scope = await scopeRecord(c, p, row.scope_id),
        { saved } = await savedRevision(c, p, scope, row.revision_id),
        basis = row.snapshot.basis;
      if (
        hash(row.snapshot) !== row.content_hash ||
        row.snapshot.state !== "accepted_for_manual_scoping_notes" ||
        row.snapshot.adopted_for_costing !== false ||
        row.snapshot.receiving_revision_id !== source.id ||
        basis?.scope_id !== scope.id ||
        basis.revision_id !== saved.id ||
        basis.content_hash !== saved.content_hash ||
        basis.source_revision_id !== source.id ||
        saved.source_revision_id !== source.id
      )
        throw unavailable();
      const current = (
        await c.query<{ current_revision_id: string }>(
          "SELECT current_revision_id FROM ppo.estimating_options WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, source.option_id],
        )
      ).rows[0];
      const observations = await observeBinding(
        c,
        p,
        g.id,
        source.option_id,
        source.id,
        saved.binding,
        false,
      );
      result.push({
        id: row.id,
        scope_id: scope.id,
        reference: scope.display_number,
        name: saved.proposal.name,
        revision_id: saved.id,
        revision: saved.version,
        content_hash: saved.content_hash,
        handover_hash: row.content_hash,
        source_revision_id: source.id,
        accepted_at: row.created_at,
        scope_current: scope.current_revision_id === saved.id,
        source_current:
          current?.current_revision_id === source.id &&
          observations.upstream_context_hash ===
            saved.binding.upstream_context_hash,
        technical_status: "unassessed",
        adopted_for_costing: false,
        production_context: saved.proposal.production_context,
        quantities: {
          represented_area: saved.calculation.area_m2,
          connected_flow: saved.calculation.connected_flow_m3h,
          operating_peak: saved.calculation.operating_peak_m3h,
        },
        open_findings: saved.calculation.findings,
        actions: saved.proposal.actions,
      });
    } catch (e) {
      if (e instanceof AppError && (e.status === 403 || e.status === 404))
        continue;
      throw e;
    }
  }
  return result;
}
export async function readReceivedFertigation(
  p: Principal,
  id: string,
  revisionId: string,
) {
  return transaction(async (c) => ({
    items: await receivedFertigation(c, p, id, revisionId),
    limit: 50,
  }));
}
