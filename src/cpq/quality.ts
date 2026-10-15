import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
} from "../shared/validation";
import { expected } from "../estimating/service";
import { release, revision, type Release } from "./context";
import { digest } from "./validation";
import { hash } from "./hash";
import {
  qualityReport,
  qualitySources,
  type QualityReport,
} from "./quality-report";

type Assessment = {
  id: string;
  actor_id: string;
  operation_id: string;
  details: {
    record_version: number;
    revision_id: string;
    report_hash: string;
    report: QualityReport;
  };
};
type Review = {
  id: string;
  actor_id: string;
  details: {
    record_version: number;
    assessment_id: string;
    report_hash: string;
    outcome: "Approved" | "Rejected";
  };
};
const stale = () =>
  new AppError(
    409,
    "CpqQualityChanged",
    "The release impact changed. Read, assess and independently review the exact current report.",
  );

async function latestId(c: QueryClient, p: Principal, id: string) {
  return (
    (
      await c.query<{ id: string }>(
        `SELECT id FROM ppo.audit_events WHERE workspace_id=$1 AND object_type='CpqRelease' AND object_id=$2
     AND details->>'command'='Cpq:AssessQuality' ORDER BY (details->>'record_version')::integer DESC LIMIT 1`,
        [p.workspace_id, id],
      )
    ).rows[0]?.id ?? null
  );
}
async function assessment(
  c: QueryClient,
  p: Principal,
  root: Release,
  id: string,
) {
  const row = (
    await c.query<Assessment>(
      `SELECT a.id,a.actor_id,a.operation_id,a.details FROM ppo.audit_events a
     JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
     WHERE a.workspace_id=$1 AND a.object_type='CpqRelease' AND a.object_id=$2 AND a.id=$3
     AND a.details->>'command'='Cpq:AssessQuality'`,
      [p.workspace_id, root.id, id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const d = row.details;
  if (
    d.report?.schema_version !== 1 ||
    d.report.release_id !== root.id ||
    d.report.company_id !== root.company_id ||
    d.report.candidate.revision_id !== d.revision_id ||
    hash(d.report) !== d.report_hash
  )
    throw new AppError(
      409,
      "CpqEvidenceMismatch",
      "The retained impact report does not match its hash.",
    );
  await qualitySources(c, p, d.report);
  return row;
}
async function latestReview(
  c: QueryClient,
  p: Principal,
  root: Release,
  assessmentId: string,
) {
  return (
    (
      await c.query<Review>(
        `SELECT id,actor_id,details FROM ppo.audit_events WHERE workspace_id=$1 AND object_type='CpqRelease' AND object_id=$2
     AND details->>'command'='Cpq:ReviewQuality' AND details->>'assessment_id'=$3
     ORDER BY (details->>'record_version')::integer DESC LIMIT 1`,
        [p.workspace_id, root.id, assessmentId],
      )
    ).rows[0] ?? null
  );
}
export async function readQuality(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const q = object(query, ["assessment_id"]);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const root = await release(c, p, id);
    if (q.assessment_id !== undefined) {
      const saved = await assessment(
        c,
        p,
        root,
        uuid(q.assessment_id, "assessment_id"),
      );
      return {
        assessment: saved,
        review: await latestReview(c, p, root, saved.id),
        synthetic: true,
      };
    }
    const latest = await latestId(c, p, root.id);
    const saved = latest ? await assessment(c, p, root, latest) : null;
    return {
      expected_version: root.version,
      enrolled: latest !== null,
      latest_assessment: saved
        ? {
            id: saved.id,
            actor_id: saved.actor_id,
            revision_id: saved.details.revision_id,
            report_hash: saved.details.report_hash,
            review: await latestReview(c, p, root, saved.id),
          }
        : null,
      ...(await qualityReport(c, p, root)),
    };
  });
}

async function advance(c: QueryClient, p: Principal, root: Release) {
  return (
    await c.query<Release>(
      "UPDATE ppo.cpq_releases SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, root.id, p.actor_id],
    )
  ).rows[0];
}

// Also used before original receipt lookup by shared receipts and command replay.
export async function qualityReceiptAuthority(
  c: QueryClient,
  p: Principal,
  root: Release,
  operationId: string,
) {
  const row = (
    await c.query<{
      id: string;
      details: {
        command: string;
        assessment_id?: string;
        quality_assessment_id?: string;
      };
    }>(
      "SELECT id,details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND object_type='CpqRelease' AND object_id=$4",
      [p.workspace_id, p.actor_id, operationId, root.id],
    )
  ).rows[0];
  if (!row) return;
  if (row.details.command === "Cpq:AssessQuality")
    await assessment(c, p, root, row.id);
  else if (row.details.assessment_id)
    await assessment(c, p, root, row.details.assessment_id);
  else if (row.details.quality_assessment_id)
    await assessment(c, p, root, row.details.quality_assessment_id);
}

export async function assessQuality(p: Principal, id: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version", "report_hash"]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    report_hash: digest(r.report_hash, "report_hash"),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:AssessQuality",
    async (c) => {
      const root = await release(c, p, input.id, "cpq.author");
      await qualityReceiptAuthority(c, p, root, input.operation_id);
      return root;
    },
    async (c, root) => {
      expected(root.version, input.expected_version);
      const current = await qualityReport(c, p, root);
      if (current.report_hash !== input.report_hash) throw stale();
      return {
        ...(await advance(c, p, root)),
        audit_event_id: randomUUID(),
        audit_details: {
          revision_id: current.report.candidate.revision_id,
          ...current,
        },
      };
    },
    "CpqRelease",
    "CpqChanged",
  );
}
export async function reviewQuality(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "assessment_id",
    "report_hash",
    "outcome",
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    assessment_id: uuid(r.assessment_id, "assessment_id"),
    report_hash: digest(r.report_hash, "report_hash"),
    outcome: choice(r.outcome, "outcome", ["Approved", "Rejected"] as const),
  };
  return sharedOperation(
    p,
    input,
    "Cpq:ReviewQuality",
    async (c) => {
      const root = await release(c, p, input.id, "cpq.review");
      const saved = await assessment(c, p, root, input.assessment_id);
      return { root, saved };
    },
    async (c, { root, saved }) => {
      expected(root.version, input.expected_version);
      if (
        (await latestId(c, p, root.id)) !== saved.id ||
        saved.details.revision_id !== root.current_revision_id ||
        saved.details.report_hash !== input.report_hash
      )
        throw stale();
      if (await latestReview(c, p, root, saved.id))
        throw new AppError(
          409,
          "CpqQualityAlreadyReviewed",
          "This assessment already has a decision. Create a new assessment for another review.",
        );
      const candidate = await revision(c, p, saved.details.revision_id);
      if ([candidate.created_by, saved.actor_id].includes(p.actor_id))
        throw new AppError(
          403,
          "CpqIndependentQualityReview",
          "An authorised person independent of the revision and assessment authors must review the impact.",
        );
      if (input.outcome === "Approved") {
        const current = await qualityReport(c, p, root);
        if (current.report_hash !== input.report_hash) throw stale();
        if (!current.report.approval_eligible)
          throw new AppError(
            409,
            "CpqQualityFailed",
            "Candidate fixtures and complete table coverage must pass before impact approval.",
          );
      }
      return {
        ...(await advance(c, p, root)),
        audit_details: {
          revision_id: saved.details.revision_id,
          assessment_id: saved.id,
          report_hash: input.report_hash,
          outcome: input.outcome,
        },
      };
    },
    "CpqRelease",
    "CpqChanged",
  );
}

export async function publicationQuality(
  c: QueryClient,
  p: Principal,
  root: Release,
) {
  const id = await latestId(c, p, root.id);
  if (!id) return {}; // Explicit legacy compatibility; enrollment has no disable path.
  const saved = await assessment(c, p, root, id);
  const review = await latestReview(c, p, root, id);
  if (
    saved.details.revision_id !== root.current_revision_id ||
    !review ||
    review.details.outcome !== "Approved" ||
    review.details.report_hash !== saved.details.report_hash ||
    !saved.details.report.approval_eligible
  )
    throw new AppError(
      409,
      "CpqQualityReviewRequired",
      "This enrolled release requires independent approval of its latest exact impact assessment.",
    );
  if ([saved.actor_id, review.actor_id].includes(p.actor_id))
    throw new AppError(
      403,
      "CpqIndependentQualityPublication",
      "Publish independently of the impact author and reviewer.",
    );
  const reviewer = { ...p, actor_id: review.actor_id };
  await release(c, reviewer, root.id, "cpq.review");
  await assessment(c, reviewer, root, id);
  if (
    (await qualityReport(c, p, root)).report_hash !== saved.details.report_hash
  )
    throw stale();
  return {
    quality_assessment_id: saved.id,
    quality_review_id: review.id,
    quality_report_hash: saved.details.report_hash,
  };
}
