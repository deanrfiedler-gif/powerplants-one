import type { Principal } from "../../platform/identity";
import { hasPermission, type QueryClient } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { object, uuid, version } from "../../shared/validation";
import {
  documentContext,
  revisionContext,
  targetContext,
} from "../../library/context";
import {
  exactBytes,
  sourceAuthority as libraryAuthority,
} from "../../library/sources";
import { authority, entryRow, history, sourceAuthority } from "./context";
import { cents } from "./model";
import {
  claimCommand,
  scheduleTotal,
  type ClaimEvent,
  type Completion,
} from "./claim-model";

const hold = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};
export async function basisContext(
  c: QueryClient,
  p: Principal,
  project: string,
  id: string,
  duty: "read" | "prepare" | "review" = "read",
) {
  const pr = await authority(c, p, project, duty),
    basis = await entryRow(c, p, id);
  if (!basis || basis.kind !== "Basis" || basis.project_id !== pr.id)
    throw unavailable();
  const basisEvent = (await history(c, p, id, undefined, 1))[0];
  if (basisEvent?.state !== "Approved")
    hold(
      "ApprovedBasisRequired",
      "Approve this project's original commercial basis first.",
    );
  const source = await sourceAuthority(c, p, basis);
  return { pr, basis, basisEvent, source };
}
async function latest(c: QueryClient, p: Principal, id: string) {
  return (
    await c.query<ClaimEvent>(
      "SELECT * FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 ORDER BY version DESC LIMIT 1",
      [p.workspace_id, id],
    )
  ).rows[0];
}
export async function evidence(
  c: QueryClient,
  p: Principal,
  project: string,
  e: Completion,
  current: boolean,
) {
  const { d } = await documentContext(c, p, e.document_id);
  await targetContext(c, p, "Project", project, d);
  const revision = await revisionContext(c, p, d, e.revision_id);
  const review = (
    await c.query<{ findings_snapshot: { id: string }[] }>(
      `SELECT findings_snapshot FROM ppo.library_reviews WHERE workspace_id=$1 AND id=$2 AND document_id=$3 AND revision_id=$4
     AND outcome='Reviewed' AND content_hash=$5 AND reviewer_id<>$6 AND reviewer_id<>$7`,
      [
        p.workspace_id,
        e.review_id,
        d.id,
        revision.id,
        revision.source.content_hash,
        revision.created_by,
        revision.source.author_id,
      ],
    )
  ).rows[0];
  if (!review) throw unavailable();
  if (current) {
    if (
      d.state !== "Current" ||
      d.version !== e.document_version ||
      d.current_revision_id !== revision.id ||
      !(await libraryAuthority(c, p, revision.source)).current ||
      (
        await c.query(
          `SELECT 1 FROM ppo.library_findings f WHERE workspace_id=$1 AND revision_id=$2 AND
        (state<>'Closed' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements($3::jsonb) x WHERE x->>'id'=f.id::text))`,
          [
            p.workspace_id,
            revision.id,
            JSON.stringify(review.findings_snapshot),
          ],
        )
      ).rowCount
    )
      hold(
        "ClaimEvidenceChanged",
        "Select current independently reviewed evidence with no unresolved findings.",
      );
    await exactBytes(c, p, d.id, revision.id, revision.source);
  }
  return revision.source.content_hash;
}
export async function variationAmount(
  c: QueryClient,
  p: Principal,
  project: string,
  basis: string,
  e: Completion,
) {
  const entry = await entryRow(c, p, e.target_id);
  if (
    !entry ||
    entry.kind !== "Variation" ||
    entry.project_id !== project ||
    entry.basis_id !== basis
  )
    throw unavailable();
  await sourceAuthority(c, p, entry);
  const v = (await history(c, p, entry.id, undefined, 1))[0];
  if (
    v?.state !== "Approved" ||
    v.version !== e.target_version ||
    v.content.priced_amount === null
  )
    hold(
      "ApprovedVariationRequired",
      "Select the exact independently approved variation amount.",
    );
  // Signed/zero variations are retained commercial facts, but credit/reversal policy is not adopted.
  if (cents(v.content.priced_amount!) <= 0n)
    hold(
      "ClaimCorrectionPolicyRequired",
      "Zero and negative variation amounts need a separate claim correction policy.",
    );
  return v.content.priced_amount!;
}
export async function claimReceiptAuthority(
  c: QueryClient,
  p: Principal,
  basis: string,
  operation: string,
) {
  const entry = await entryRow(c, p, basis);
  if (!entry) throw unavailable();
  const e = (
    await c.query<ClaimEvent>(
      "SELECT * FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, basis, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await basisContext(
    c,
    p,
    entry.project_id,
    basis,
    ["Approve", "Return"].includes(e.command) ? "review" : "prepare",
  );
  if (e.completion) await evidence(c, p, entry.project_id, e.completion, false);
}
export async function commandClaims(
  p: Principal,
  project: string,
  value: unknown,
) {
  const input = claimCommand(project, value),
    reviewing = ["Approve", "Return"].includes(input.action);
  return sharedOperation(
    p,
    input,
    `ProjectClaims:${input.action}`,
    async (c) => {
      const ctx = await basisContext(
        c,
        p,
        input.project_id,
        input.basis_id,
        reviewing ? "review" : "prepare",
      );
      const original = (
        await c.query<ClaimEvent>(
          "SELECT * FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND created_by=$3 AND operation_id=$4",
          [p.workspace_id, input.basis_id, p.actor_id, input.operation_id],
        )
      ).rows[0];
      if (original?.completion)
        await evidence(c, p, project, original.completion, false);
      return ctx;
    },
    async (c, { pr, basis, basisEvent, source }) => {
      const prior = await latest(c, p, basis.id),
        next = (prior?.version ?? 0) + 1;
      if ((prior?.version ?? 0) !== input.expected_version)
        hold(
          "VersionConflict",
          "Reload the current claim schedule and evidence version.",
        );
      if (pr.lifecycle !== "Active")
        hold(
          "ClosedProject",
          "Reopen the project before changing its claim schedule or evidence.",
        );
      if (
        !reviewing &&
        p.actor_id !== pr.coordinator_id &&
        p.actor_id !== basisEvent.content.owner_id
      )
        throw unavailable();
      await sourceAuthority(c, p, basis, true);
      let state: ClaimEvent["state"],
        scheduleVersion = prior?.schedule_version ?? next;
      const milestones = input.milestones ?? prior?.milestones;
      let completion: ClaimEvent["completion"] = null;
      if (input.action === "Save") {
        if (prior?.state === "Submitted")
          hold(
            "ClaimScheduleSubmitted",
            "Return the submitted schedule before changing it.",
          );
        if (
          (
            await c.query(
              "SELECT 1 FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND command='RecordEvidence' LIMIT 1",
              [p.workspace_id, basis.id],
            )
          ).rowCount
        )
          hold(
            "ClaimScheduleInUse",
            "Completion evidence exists. A schedule reconciliation policy is required before replacing its entitlements.",
          );
        if (scheduleTotal(milestones!) !== source.amount)
          hold(
            "ClaimScheduleTotal",
            "Milestone amounts must equal the exact original commercial control value.",
          );
        state = "Draft";
        scheduleVersion = next;
      } else if (
        input.action === "Submit" &&
        prior &&
        ["Draft", "Returned"].includes(prior.state)
      )
        state = "Submitted";
      else if (reviewing && prior?.state === "Submitted") {
        if (
          (
            await c.query(
              "SELECT 1 FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND created_by=$3 AND command IN ('Save','Submit')",
              [p.workspace_id, basis.id, p.actor_id],
            )
          ).rowCount
        )
          hold(
            "IndependentReviewRequired",
            "The schedule reviewer must differ from its author and submitters.",
          );
        state = input.action === "Approve" ? "Approved" : "Returned";
      } else if (
        input.action === "RecordEvidence" &&
        prior?.state === "Approved"
      ) {
        state = "Approved";
        const e = input.completion!;
        if (Date.parse(e.occurred_at) > Date.now())
          hold(
            "FutureClaimEvidence",
            "Completion must have occurred before it is recorded.",
          );
        const milestone = prior.milestones.find((m) => m.id === e.target_id);
        if (
          e.kind === "Milestone" &&
          (!milestone || e.target_version !== scheduleVersion)
        )
          hold(
            "ClaimMilestoneChanged",
            "Select a milestone from the exact approved schedule revision.",
          );
        const amount =
          e.kind === "Milestone"
            ? milestone!.amount
            : await variationAmount(c, p, project, basis.id, e);
        completion = {
          ...e,
          amount,
          content_hash: await evidence(c, p, project, e, true),
        };
      } else
        hold(
          "ClaimScheduleState",
          "This action is unavailable in the current claim schedule state.",
        );
      const row = (
        await c.query<ClaimEvent>(
          `INSERT INTO ppo.project_claim_events(workspace_id,basis_id,version,command,state,schedule_version,milestones,completion,reason,created_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [
            p.workspace_id,
            basis.id,
            next,
            input.action,
            state!,
            scheduleVersion,
            JSON.stringify(milestones),
            completion,
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      return {
        id: basis.id,
        version: row.version,
        state: row.state,
        updated_at: row.created_at,
        audit_details: {
          project_id: project,
          schedule_version: scheduleVersion,
          source_hash: source.hash,
        },
      };
    },
    "ProjectCommercialRecord",
    "SharedRecordUpdated",
  );
}
export async function readClaims(
  p: Principal,
  project: string,
  query: Record<string, string> = {},
) {
  const q = object(query, ["basis_id", "before_version"]),
    basisId = uuid(q.basis_id, "basis_id");
  const beforeVersion =
    q.before_version === undefined ? null : version(Number(q.before_version));
  return transaction(async (c) => {
    // Same workspace lock as writers keeps permission/source decisions and the projection consistent.
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const ctx = await basisContext(c, p, project, basisId),
      current = await latest(c, p, basisId);
    const events = (
      await c.query<ClaimEvent>(
        `SELECT DISTINCT ON (completion->>'kind',completion->>'target_id') *
      FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND command='RecordEvidence'
      ORDER BY completion->>'kind',completion->>'target_id',version DESC`,
        [p.workspace_id, basisId],
      )
    ).rows;
    let sourceCurrent = true;
    try {
      await sourceAuthority(c, p, ctx.basis, true);
    } catch (e) {
      if (!(e instanceof AppError) || e.status !== 409) throw e;
      sourceCurrent = false;
    }
    const eventWindow = (
      await c.query<ClaimEvent>(
        "SELECT * FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND ($3::int IS NULL OR version<$3) ORDER BY version DESC LIMIT 51",
        [p.workspace_id, basisId, beforeVersion],
      )
    ).rows;
    const history = eventWindow.slice(0, 50);
    for (const event of history)
      if (event.completion)
        await evidence(c, p, project, event.completion, false);
    const completions = [];
    for (const event of events) {
      const e = event.completion!;
      // Fail closed if any evidence authority is lost: never emit hidden identities or partial totals.
      await evidence(c, p, project, e, false);
      let evidenceCurrent = true;
      try {
        await evidence(c, p, project, e, true);
      } catch (err) {
        if (!(err instanceof AppError) || ![409, 503].includes(err.status))
          throw err;
        evidenceCurrent = false;
      }
      completions.push({
        ...e,
        event_version: event.version,
        current: evidenceCurrent,
        eligible_for_claim:
          sourceCurrent && evidenceCurrent && current?.state === "Approved",
      });
    }
    return {
      history,
      history_has_more: eventWindow.length > 50,
      next_before_version:
        eventWindow.length > 50 ? history.at(-1)!.version : null,
      basis_id: basisId,
      basis_version: ctx.basisEvent.version,
      version: current?.version ?? 0,
      state: current?.state ?? "NotConfigured",
      schedule_version: current?.schedule_version ?? null,
      milestones: current?.milestones ?? [],
      completions,
      source_current: sourceCurrent,
      original_control_value: ctx.source.amount,
      currency: ctx.source.currency,
      tax_basis: ctx.source.tax_basis,
      synthetic: true,
      finance_processing_available:
        (await hasPermission(
          c,
          p,
          "finance.read",
          ctx.pr.company_id,
          ctx.pr.site_id,
        )) &&
        (await hasPermission(
          c,
          p,
          "finance.prepare",
          ctx.pr.company_id,
          ctx.pr.site_id,
        )) &&
        (await hasPermission(
          c,
          p,
          "shared.finance.read",
          ctx.pr.company_id,
          ctx.pr.site_id,
        )),
    };
  });
}
