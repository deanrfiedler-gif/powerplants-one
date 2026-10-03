import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { PoolClient } from "pg";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { expected } from "../service";
import { guardExistingEstimateMutation } from "../discovery-workspace-context";
import {
  exactBasis,
  reviewAuthority,
  reviewHistory,
  reviewReceiptAuthority,
} from "./context";
import { latestDecisions, reviewBasisHash } from "./model";
import { submitInput, decideInput } from "./validation";

async function recovered(
  c: PoolClient,
  p: Principal,
  id: string,
  operation: string,
) {
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.estimate_review_events WHERE workspace_id=$1 AND estimate_id=$2 AND created_by=$3 AND operation_id=$4",
        [p.workspace_id, id, p.actor_id, operation],
      )
    ).rowCount
  )
    return false;
  await reviewReceiptAuthority(c, p, id, operation);
  return true;
}
function conflict(message: string): never {
  throw new AppError(409, "ReviewConflict", message);
}
export async function submitEstimateReview(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = submitInput(id, value);
  return sharedOperation(
    p,
    input,
    "EstimateReview:Submit",
    async (c) => {
      if (await recovered(c, p, id, input.operation_id)) return null;
      return reviewAuthority(c, p, id, input.estimate_version_id);
    },
    async (c, authorised) => {
      if (!authorised) throw unavailable();
      const { e, v, basis } = await exactBasis(
        c,
        p,
        id,
        input.estimate_version_id,
      );
      await guardExistingEstimateMutation(c, p, e);
      expected(e.version, input.expected_version);
      if (reviewBasisHash(basis) !== input.basis_hash)
        conflict(
          "The observed review basis changed. Refresh and compare the current evidence before submitting.",
        );
      if (e.current_version_id !== v.id)
        conflict(
          "Submit the current saved estimate revision, never an unsaved proposal or a superseded version.",
        );
      if (!v.lines.length)
        throw new AppError(
          422,
          "IncompleteEstimate",
          "Save complete manual lines before submitting an estimate for review.",
        );
      if (basis.discovery_revision_id !== basis.current_discovery_revision_id)
        conflict(
          "The discovery scope changed. Review and save the current cost basis before submitting.",
        );
      const history = await reviewHistory(c, p, id),
        previous = history.submissions.at(-1);
      expected(history.sequence, input.expected_review_version);
      const statuses = latestDecisions(
        history.submissions,
        history.decisions,
        basis,
      );
      const outstanding = statuses
        .filter((s) => s.decision?.outcome === "Returned")
        .flatMap((s) => s.decision!.findings);
      if (
        outstanding.length !== input.responses.length ||
        outstanding.some(
          (f) => !input.responses.some((r) => r.finding_id === f.id),
        )
      )
        throw new AppError(
          422,
          "FindingResponsesRequired",
          "Respond to every outstanding finding; retain the original finding identity.",
        );
      if (
        previous &&
        previous.estimate_version_id === v.id &&
        !history.decisions.some(
          (d) => d.submission_id === previous.id && d.outcome === "Returned",
        ) &&
        reviewBasisHash(previous.basis) === reviewBasisHash(basis)
      )
        conflict(
          "This exact revision is already submitted. Complete its reviews before creating a new submission.",
        );
      const submissionId = randomUUID(),
        sequence = history.sequence + 1;
      const row = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.estimate_review_events(id,workspace_id,company_id,estimate_id,estimate_version_id,sequence,submission_id,predecessor_id,kind,outcome,basis,responses,reason,created_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$1,$7,'Submission','Submitted',$8,$9,$10,$11,$12) RETURNING created_at`,
          [
            submissionId,
            p.workspace_id,
            e.company_id,
            e.id,
            v.id,
            sequence,
            previous?.id ?? null,
            basis,
            JSON.stringify(input.responses),
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      await reviewAuthority(c, p, id, v.id);
      return {
        id: e.id,
        version: sequence,
        state: "Submitted",
        updated_at: row.created_at,
        audit_details: {
          review_event_id: submissionId,
          submission_id: submissionId,
          saved_version_id: v.id,
          estimate_hash: v.content_hash,
        },
      };
    },
    "Estimate",
    "EstimateReviewRecorded",
  );
}
export async function decideEstimateReview(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = decideInput(id, value);
  return sharedOperation(
    p,
    input,
    "EstimateReview:Decide",
    async (c) => {
      if (await recovered(c, p, id, input.operation_id)) return null;
      const s = (await reviewHistory(c, p, id)).submissions.find(
        (s) => s.id === input.submission_id,
      );
      if (!s) throw unavailable();
      return {
        s,
        ...(await reviewAuthority(c, p, id, s.estimate_version_id, input.kind)),
      };
    },
    async (c, authorised) => {
      if (!authorised) throw unavailable();
      const { s, e, v } = authorised;
      const { basis } = await exactBasis(c, p, id);
      await exactBasis(c, p, id, v.id);
      expected(e.version, input.expected_version);
      const history = await reviewHistory(c, p, id);
      expected(history.sequence, input.expected_review_version);
      if (history.submissions.at(-1)?.id !== s.id)
        conflict(
          "A successor submission exists. Review that exact submission instead.",
        );
      if ([e.owner_id, v.created_by, s.created_by].includes(p.actor_id))
        throw new AppError(
          403,
          "IndependentReviewRequired",
          "The estimate owner, saved-version author and submitter cannot review their own work.",
        );
      if (s.basis.fingerprints[input.kind] !== basis.fingerprints[input.kind])
        conflict(
          "The facts for this review changed. The owner must submit the corrected saved basis; other unchanged reviews remain visible.",
        );
      if (
        history.decisions.some(
          (d) => d.submission_id === s.id && d.kind === input.kind,
        )
      )
        conflict(
          "This review decision is immutable. Record corrections through a successor submission.",
        );
      if (
        input.findings.some(
          (f) => f.line_id && !v.lines.some((l) => l.id === f.line_id),
        )
      )
        throw new AppError(
          422,
          "FindingLineInvalid",
          "Findings must refer to a line in the exact submitted version.",
        );
      const eventId = randomUUID(),
        sequence = history.sequence + 1;
      const row = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.estimate_review_events(id,workspace_id,company_id,estimate_id,estimate_version_id,sequence,submission_id,kind,outcome,findings,reason,created_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING created_at`,
          [
            eventId,
            p.workspace_id,
            e.company_id,
            id,
            v.id,
            sequence,
            s.id,
            input.kind,
            input.outcome,
            JSON.stringify(
              input.findings.map((f) => ({ id: randomUUID(), ...f })),
            ),
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      await reviewAuthority(c, p, id, v.id, input.kind);
      await reviewAuthority(c, p, id, e.current_version_id, input.kind);
      return {
        id: e.id,
        version: sequence,
        state: input.outcome,
        updated_at: row.created_at,
        audit_details: {
          review_event_id: eventId,
          submission_id: s.id,
          saved_version_id: v.id,
          review_kind: input.kind,
        },
      };
    },
    "Estimate",
    "EstimateReviewRecorded",
  );
}
