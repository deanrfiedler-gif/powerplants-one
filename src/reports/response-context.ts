import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { canonical } from "../platform/operations";
import { visible } from "../shared/reads";
import { incidentHolds } from "../incidents/holds";
import { reportContext, sourceGuard, recipient, fail } from "./context";

type Context = Awaited<ReturnType<typeof reportContext>>;
export async function responseContextsInstalled(c: QueryClient) {
  const x = (
    await c.query(
      "SELECT to_regclass('ppo.customer_response_contexts') AS storage, EXISTS(SELECT 1 FROM public.ppo_migrations WHERE version=57) AS installed",
    )
  ).rows[0];
  if (!x.storage && x.installed)
    throw new AppError(
      503,
      "ResponseSourceUnavailable",
      "Required response context is unavailable. Original facts are retained.",
    );
  return !!x.storage; // Explicit pre-0057 populated-upgrade compatibility.
}

// This projection deliberately contains no incident identity, count, narrative,
// sensitive evidence, review note or private storage key. It grants no clearance.
export async function responseRestrictions(
  c: QueryClient,
  p: Principal,
  ctx: Context,
) {
  const incidents = await incidentHolds(c, p, ctx.a.id);
  const storage = (
    await c.query(
      "SELECT to_regclass('ppo.inspection_defects') AS defects, EXISTS(SELECT 1 FROM public.ppo_migrations WHERE version=31) AS installed",
    )
  ).rows[0];
  if (!storage.defects && storage.installed)
    throw new AppError(
      503,
      "ResponseSourceUnavailable",
      "Required technical context is unavailable. No current clearance can be inferred.",
    );
  const defect =
    storage.defects &&
    (
      await c.query(
        `SELECT 1 FROM ppo.inspection_defects d JOIN ppo.appointments a ON (a.workspace_id,a.id)=(d.workspace_id,d.host_id)
     WHERE d.workspace_id=$1 AND d.host_type='ServiceAppointment' AND a.work_order_id=$2 AND d.state<>'Closed' LIMIT 1`,
        [p.workspace_id, ctx.w.id],
      )
    ).rowCount;
  const controls = (
    await c.query(
      "SELECT outcome FROM ppo.readiness_assessments WHERE workspace_id=$1 AND scope_revision_id=$2 AND (appointment_id IS NULL OR appointment_id=$3)",
      [p.workspace_id, ctx.a.scope_revision_id, ctx.a.id],
    )
  ).rows;
  return {
    incident: incidents.length ? "Held" : "NoHoldObserved",
    inspection: !storage.defects
      ? "Unavailable"
      : defect
        ? "Outstanding"
        : "NoOpenDefectObserved",
    readiness: !controls.length
      ? "Unknown"
      : controls.some((x) => !["Pass", "NotApplicable"].includes(x.outcome))
        ? "ReviewRequired"
        : "NoFailedAssessmentObserved",
    work_authority: "NotGrantedByResponse",
  };
}

export async function currentResponseBinding(
  c: QueryClient,
  p: Principal,
  ctx: Context,
  revisionId: string,
) {
  const review = (
    await c.query(
      "SELECT id,recipient_id,source_guard,customer_snapshot FROM ppo.report_reviews WHERE workspace_id=$1 AND report_id=$2 AND revision_id=$3 AND decision='Approved' ORDER BY reviewed_at DESC LIMIT 1",
      [p.workspace_id, ctx.report.id, revisionId],
    )
  ).rows[0];
  if (!review) throw unavailable();
  const guard = await sourceGuard(c, p, ctx);
  for (const asset of guard.assets) await visible(c, p, "Asset", asset.id);
  const audience = await recipient(c, p, ctx, review.recipient_id);
  const binding = { ...guard, recipient: audience };
  // A changed safety assessment does not prohibit a factual response to retained
  // content. It is an explicit current restriction, not transferable authority.
  const factual = (value: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "controls"),
    );
  if (canonical(factual(binding)) !== canonical(factual(review.source_guard)))
    fail(
      "ResponseSourceChanged",
      "Source or audience changed after review. Retain this response input and obtain a fresh reviewed presentation; no response was saved.",
    );
  return {
    review,
    binding,
    restrictions: await responseRestrictions(c, p, ctx),
  };
}

export async function responseApplicability(
  c: QueryClient,
  p: Principal,
  ctx: Context,
) {
  if (!["Reviewed", "Issued"].includes(ctx.report.status))
    return {
      state: "NoCurrentPresentation",
      message:
        "A current reviewed presentation is required. Historical responses remain exact.",
      restrictions: null,
    };
  try {
    const current = await currentResponseBinding(
      c,
      p,
      ctx,
      ctx.report.current_revision_id,
    );
    return {
      state: "Current",
      message:
        "Source and audience match the reviewed presentation. Original bytes are rechecked when recording; this grants no work or technical clearance.",
      restrictions: current.restrictions,
    };
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    return {
      state: "ReviewRequired",
      message:
        "Current source or audience is changed or unavailable. Historical content is retained; a new response is unavailable until its context is resolved.",
      restrictions: null,
    };
  }
}
