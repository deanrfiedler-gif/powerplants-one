import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { hasPermission } from "../../platform/permissions";
import { AppError } from "../../platform/errors";
import { object } from "../../shared/validation";
import { estimateSite } from "../cost-basis-context";
import { exactBasis, reviewAuthority, reviewHistory } from "./context";
import { latestDecisions, reviewBasisHash } from "./model";
import { reviewCapabilities } from "./validation";

export async function readEstimateReview(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const current = await exactBasis(c, p, id),
      history = await reviewHistory(c, p, id);
    const versions = [];
    for (const versionId of [
      ...new Set(history.submissions.map((s) => s.estimate_version_id)),
    ]) {
      const { v } = await exactBasis(c, p, id, versionId);
      versions.push(v);
    }
    let can_submit = false;
    try {
      await reviewAuthority(c, p, id, current.v.id);
      can_submit = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
    const statuses = [];
    const submission = history.submissions.at(-1) ?? null;
    for (const status of latestDecisions(
      history.submissions,
      history.decisions,
      current.basis,
    )) {
      const can_review =
        !!submission &&
        ![
          current.e.owner_id,
          submission.created_by,
          versions.find((v) => v.id === submission.estimate_version_id)!
            .created_by,
        ].includes(p.actor_id) &&
        submission.basis.fingerprints[status.kind] ===
          current.basis.fingerprints[status.kind] &&
        !history.decisions.some(
          (d) => d.submission_id === submission.id && d.kind === status.kind,
        ) &&
        (await hasPermission(
          c,
          p,
          reviewCapabilities[status.kind],
          current.e.company_id,
          estimateSite(current.e) ?? undefined,
        )) &&
        (await hasPermission(
          c,
          p,
          reviewCapabilities[status.kind],
          current.e.company_id,
          versions.find((v) => v.id === submission.estimate_version_id)
            ?.discovery_basis?.site_id ??
            current.e.site_id ??
            undefined,
        ));
      statuses.push({ ...status, can_review });
    }
    // Do not disclose previously loaded source evidence after an expiring read grant.
    await exactBasis(c, p, id);
    for (const v of versions) await exactBasis(c, p, id, v.id);
    return {
      estimate: {
        id: current.e.id,
        display_number: current.e.display_number,
        version: current.e.version,
      },
      saved: current.v,
      basis: current.basis,
      basis_hash: reviewBasisHash(current.basis),
      ...history,
      versions,
      statuses,
      can_submit,
      outcome:
        submission?.estimate_version_id === current.v.id &&
        statuses.every(
          (s) => s.applicable && s.decision?.outcome === "Reviewed",
        )
          ? "Reviewed"
          : "Review required",
      commercial_approval: "Not configured",
      pricing_exceptions: "Not configured",
      synthetic: true,
    };
  });
}
