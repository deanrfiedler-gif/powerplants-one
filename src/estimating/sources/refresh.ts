import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { uuid } from "../../shared/validation";
import {
  acceptedEstimateContext,
  estimateContext,
  versionContext,
  type Estimate,
} from "../context";
import { expected, insertVersion, versionHash } from "../service";
import { parseLines, policy } from "../validation";
import { calculate, decimal, scaled } from "../math";
import { costBasisAvailable } from "../cost-basis-context";
import {
  guardExistingEstimateMutation,
  workspaceAuthority,
  optionContext,
  revisionAuthority,
} from "../discovery-workspace-context";
import { prepareDiscoveryTargets } from "../discovery-context";
import { writeLineage } from "../specialist/lineage";
import {
  sourceContext,
  sourceRevision,
  sourceHash,
  type SourceEvent,
} from "./context";
import { sourcePrice } from "./price";
import { refreshProposal, refreshCommand } from "./validation";
import { insertSourceBinding, type SourceBinding } from "./bindings";

async function compare(
  c: QueryClient,
  p: Principal,
  id: string,
  input: ReturnType<typeof refreshProposal>,
) {
  const e = await estimateContext(c, p, id, "estimating.edit");
  await guardExistingEstimateMutation(c, p, e);
  if (e.current_version_id !== input.estimate_version_id)
    throw new AppError(
      409,
      "EstimateVersionChanged",
      "Compare the current saved estimate before refreshing costs.",
    );
  const v = await versionContext(c, p, e, input.estimate_version_id);
  if (versionHash(v) !== v.content_hash)
    throw new AppError(
      409,
      "EstimateEvidenceMismatch",
      "Retained estimate content does not match its hash.",
    );
  let scopeContextHash: string | null = null;
  if (e.discovery_basis) {
    const b = e.discovery_basis,
      g = await workspaceAuthority(c, p, b.estimating_workspace_id, true),
      o = await optionContext(c, g, b.option_id);
    if (
      g.selected_option_id !== o.id ||
      o.current_revision_id !== b.revision_id
    )
      throw new AppError(
        409,
        "DiscoveryRevisionChanged",
        "Adopt and review the current selected discovery revision before refreshing this saved cost basis.",
      );
    const r = await revisionAuthority(c, p, g, b.revision_id, true),
      targets = await prepareDiscoveryTargets(c, p, g.opportunity_id, r.input);
    if (
      r.scope_readiness !== "Complete" ||
      targets.compiled.scope_readiness !== "Complete"
    )
      throw new AppError(
        409,
        "DiscoveryScopeIncomplete",
        "Complete selected scope is required for a cost refresh.",
      );
    scopeContextHash = targets.context_hash;
  }
  const lines = v.lines.map((l) => ({ ...l })),
    bindings: SourceBinding[] = [],
    changes = [];
  for (const choice of input.selections) {
    const line = lines.find((l) => l.id === choice.line_id);
    if (!line)
      throw new AppError(
        422,
        "EstimateLineUnavailable",
        "Select lines from the exact saved estimate.",
      );
    const source = await sourceContext(c, p, choice.source_id);
    if (source.company_id !== e.company_id) throw unavailable();
    expected(source.version, choice.expected_source_version);
    const revision = await sourceRevision(c, p, source, choice.revision_id);
    const review = (
      await c.query<SourceEvent>(
        "SELECT * FROM ppo.cost_source_events WHERE workspace_id=$1 AND revision_id=$2 AND action='Reviewed' ORDER BY source_version DESC LIMIT 1",
        [p.workspace_id, revision.id],
      )
    ).rows[0];
    if (!review)
      throw new AppError(
        409,
        "ReviewedSourceRequired",
        "An independent review of this exact source revision is required.",
      );
    const price = sourcePrice(
        revision.content,
        line.quantity,
        line.unit,
        input.pricing_date,
      ),
      old = { ...line };
    line.unit_cost = price.unit_cost;
    line.source = `${source.reference} / r${revision.revision} / ${revision.content.evidence_reference}`;
    line.effective_date = revision.content.source_date;
    const b: SourceBinding = {
      line_id: line.id,
      source_id: source.id,
      source_revision_id: revision.id,
      review_event_id: review.id,
      pricing_date: input.pricing_date,
      tier_minimum_quantity: price.minimum_quantity,
      unit_cost: price.unit_cost,
    };
    bindings.push(b);
    changes.push({
      line_id: line.id,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      old,
      new: { ...line },
      source_reference: source.reference,
      source_revision: revision.revision,
      source_hash: revision.content_hash,
      source_version: source.version,
      review_event_id: review.id,
      prior_binding:
        v.source_bindings?.find((b) => b.line_id === line.id) ?? null,
      valid_until: price.validity_end,
      warning: price.validity_warning,
    });
  }
  const parsed = parseLines(lines, v.cost_schema_version ?? 1),
    before = calculate(v.lines),
    after = calculate(parsed);
  const snapshot = {
    estimate_id: e.id,
    estimate_version_id: v.id,
    estimate_hash: v.content_hash,
    expected_version: e.version,
    option_id: e.option_id,
    discovery_basis: v.discovery_basis ?? null,
    scope_context_hash: scopeContextHash,
    pricing_date: input.pricing_date,
    changes,
    lines: parsed,
    bindings,
    before,
    after,
    cost_change: decimal(scaled(after.cost!, 2) - scaled(before.cost!, 2), 2),
    sell_change: "0.00",
    synthetic: true,
  };
  const unchanged =
    changes.every(
      (change) => sourceHash(change.old) === sourceHash(change.new),
    ) &&
    bindings.every((b) => {
      const old = v.source_bindings?.find((x) => x.line_id === b.line_id);
      return old && sourceHash(old) === sourceHash(b);
    });
  if (unchanged)
    throw new AppError(
      422,
      "SourceRefreshUnchanged",
      "These exact source bindings and costs are already saved.",
    );
  return {
    e,
    v,
    comparison: { ...snapshot, comparison_hash: sourceHash(snapshot) },
  };
}
export async function previewSourceRefresh(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = refreshProposal(value);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    return (await compare(c, p, uuid(id, "estimate_id"), input)).comparison;
  });
}
export async function applySourceRefresh(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = refreshCommand(id, value);
  return sharedOperation(
    p,
    input,
    "RefreshEstimateSources",
    async (c) => {
      const e =
        (await acceptedEstimateContext(c, p, input.id, input.operation_id)) ??
        (await estimateContext(c, p, input.id, "estimating.edit"));
      for (const choice of input.proposal.selections) {
        const s = await sourceContext(c, p, choice.source_id);
        if (s.company_id !== e.company_id) throw unavailable();
        await sourceRevision(c, p, s, choice.revision_id);
      }
      return e;
    },
    async (c) => {
      const { e, v, comparison } = await compare(
        c,
        p,
        input.id,
        input.proposal,
      );
      expected(e.version, input.expected_version);
      if (comparison.comparison_hash !== input.comparison_hash)
        throw new AppError(
          409,
          "SourceComparisonChanged",
          "The reviewed comparison changed. Compare again before saving.",
        );
      const next = randomUUID(),
        updated = (
          await c.query<Estimate>(
            "UPDATE ppo.estimates SET version=version+1,current_version_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
            [p.workspace_id, e.id, next, p.actor_id],
          )
        ).rows[0];
      await insertVersion(
        c,
        p,
        updated,
        {
          title: v.title,
          scope: v.scope,
          policy: policy(v.policy),
          lines: comparison.lines,
          schema_version: v.cost_schema_version ?? 1,
          reason: input.reason,
        },
        next,
        v.id,
        input.proposal.selections.map((s) => s.line_id),
      );
      if (await costBasisAvailable(c))
        await c.query(
          `INSERT INTO ppo.estimate_discovery_bases(workspace_id,company_id,estimate_id,estimate_version_id,revision_id)
      SELECT workspace_id,company_id,estimate_id,$3,revision_id FROM ppo.estimate_discovery_bases WHERE workspace_id=$1 AND estimate_version_id=$2`,
          [p.workspace_id, v.id, next],
        );
      for (const b of comparison.bindings)
        await insertSourceBinding(c, p, e.company_id, next, b);
      await writeLineage(c, p, next, v.id);
      return {
        ...updated,
        audit_details: {
          saved_version_id: next,
          predecessor_id: v.id,
          comparison_hash: comparison.comparison_hash,
          source_bindings: comparison.bindings,
          reviewed_scope_context_hash: comparison.scope_context_hash,
          arithmetic_policy: v.policy,
        },
      };
    },
    "Estimate",
    "EstimateVersionSaved",
  );
}
