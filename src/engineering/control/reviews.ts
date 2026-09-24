import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import {
  choice,
  label,
  narrative,
  optionalId,
  uuid,
} from "../../shared/validation";
import {
  authority,
  expected,
  hash,
  person,
  requireSources,
  row,
  refuse,
  type Access,
} from "./context";
import {
  basisBlockers,
  purposes,
  sourceIds,
  type ControlRecord,
  type Purpose,
} from "./model";
import {
  confirmations,
  nativeSourceIds,
  documentRevision,
  insert,
  publishSource,
  state,
} from "./records";
import { date, ids } from "./validation";

export async function submitReview(
  c: PoolClient,
  p: Principal,
  a: Access,
  r: Record<string, unknown>,
  basis?: ControlRecord<"basis">,
) {
  const reviewerId = uuid(r.reviewer_id, "reviewer_id"),
    purpose = basis?.content.purpose ?? choice(r.purpose, "purpose", purposes);
  const reviewer = await person(c, p, a, reviewerId, "review");
  authority(
    { ...a, can: { ...a.can, review: true } },
    reviewer,
    "review",
    purpose,
  );
  const basisRecord =
    basis ??
    (r.basis_id
      ? await row(c, p, a, "basis", uuid(r.basis_id, "basis_id"))
      : null);
  if (basisRecord && !basis && basisRecord.state !== "Reviewed")
    throw refuse(
      "BasisNotReviewed",
      "Select a reviewed basis, or submit its draft from Review & handover.",
    );
  const documentIds = ids(
      r.document_revision_ids ?? [],
      "document_revision_ids",
    ),
    submittalIds = ids(r.submittal_ids ?? [], "submittal_ids");
  const documents = [];
  for (const id of documentIds)
    documents.push(await documentRevision(c, p, a, id));
  if (new Set(documents.map((d) => d.document_id)).size !== documents.length)
    throw refuse(
      "MixedDocumentRevision",
      "Select one exact revision per controlled document.",
    );
  for (const document of documents)
    authority(
      {
        ...a,
        pkg: { ...a.pkg, discipline: document.discipline },
        can: { ...a.can, review: true },
      },
      reviewer,
      "review",
      purpose,
    );
  const submittals = [];
  for (const id of submittalIds)
    submittals.push(await row(c, p, a, "submittal", id));
  const selectedSources = [
    ...new Set([
      ...ids(r.source_ids ?? [], "source_ids"),
      ...(basisRecord
        ? [
            ...sourceIds(basisRecord.content),
            ...(await nativeSourceIds(c, p, a, "basis", basisRecord.id)),
          ]
        : []),
      ...documents.map((d) => d.source_id),
      ...submittals.flatMap((s) => sourceIds(s.content)),
    ]),
  ].sort();
  if (!selectedSources.length)
    throw refuse("EvidenceNeeded", "A review must bind exact source evidence.");
  const sourceRecords = await requireSources(c, p, a, selectedSources, true);
  const contributors = [
    ...new Set([
      p.actor_id,
      ...(basisRecord ? [basisRecord.created_by, basisRecord.updated_by] : []),
      ...documents.map((d) => d.created_by),
      ...submittals.map((s) => s.created_by),
      ...(basisRecord
        ? (
            await c.query<{ recorded_by: string }>(
              "SELECT DISTINCT recorded_by FROM ppo.engineering_control_events WHERE workspace_id=$1 AND subject_id=$2 AND action='save'",
              [p.workspace_id, basisRecord.id],
            )
          ).rows.map((e) => e.recorded_by)
        : []),
    ]),
  ];
  if (a.policy?.independent_review && contributors.includes(reviewerId))
    throw refuse(
      "IndependentReviewerRequired",
      "Assign a reviewer who did not author this content.",
      403,
    );
  const priorBasisReview = basis?.predecessor_id
    ? (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.engineering_reviews WHERE workspace_id=$1 AND package_id=$2 AND content->>'basis_id'=$3 AND state='Returned' ORDER BY created_at DESC LIMIT 1",
          [p.workspace_id, a.pkg.id, basis.predecessor_id],
        )
      ).rows[0]?.id
    : null;
  const predecessorId = optionalId(
    r.predecessor_id ?? priorBasisReview,
    "predecessor_id",
  );
  const predecessor = predecessorId
    ? await row(c, p, a, "review", predecessorId)
    : null;
  if (predecessor && predecessor.state !== "Returned")
    throw refuse("InvalidState", "Only a returned review can be resubmitted.");
  const submission = {
    schema_version: 1,
    package_id: a.pkg.id,
    purpose,
    basis: basisRecord,
    documents,
    submittals,
    sources: sourceRecords,
    policy_id: a.policy!.id,
  };
  const review = await insert(c, p, a, "review", {
    id: basis ? randomUUID() : uuid(r.id, "id"),
    reference: basis
      ? `SYN-REV-${randomUUID().slice(0, 8)}`
      : label(r.reference, "reference", 80),
    title: basis
      ? `Basis review: ${basis.title}`
      : label(r.title, "title", 200),
    owner_id: reviewerId,
    due_date: basis?.due_date ?? date(r.due_date, "due_date"),
    state: "Submitted",
    predecessor_id: predecessorId,
    revision: predecessor ? predecessor.revision + 1 : 1,
    content: {
      schema_version: 1,
      purpose,
      source_ids: selectedSources,
      basis_id: basisRecord?.id ?? null,
      document_revision_ids: documentIds,
      submittal_ids: submittalIds,
      submission,
      submission_hash: hash(submission),
      policy_id: a.policy!.id,
      contributors,
    },
  });
  for (const source of sourceRecords)
    await c.query(
      "INSERT INTO ppo.engineering_review_items(workspace_id,package_id,review_id,source_id,basis_id,document_revision_id) VALUES($1,$2,$3,$4,$5,$6)",
      [
        p.workspace_id,
        a.pkg.id,
        review.id,
        source.id,
        basisRecord?.id ?? null,
        documents.find((d) => d.source_id === source.id)?.id ?? null,
      ],
    );
  if (basis) await state(c, p, "basis", basis.id, "Submitted");
  return review;
}
export async function currentReview(
  c: PoolClient,
  p: Principal,
  a: Access,
  review: ControlRecord<"review">,
) {
  await requireSources(c, p, a, review.content.source_ids, true);
  const snapshot = review.content.submission as {
    basis: ControlRecord<"basis"> | null;
    submittals: ControlRecord<"submittal">[];
  };
  if (snapshot.basis) {
    const basis = await row(c, p, a, "basis", snapshot.basis.id);
    if (
      !["Submitted", "Reviewed"].includes(basis.state) ||
      hash(basis.content) !== hash(snapshot.basis.content)
    )
      throw refuse(
        "SourceChanged",
        "The basis needs reassessment against a new exact submission.",
        409,
      );
    await nativeSourceIds(c, p, a, "basis", basis.id);
    const blockers = basisBlockers(
      basis.content,
      await confirmations(c, p, basis),
    );
    if (blockers.length) throw refuse("BasisIncomplete", blockers.join(" "));
  }
  for (const item of snapshot.submittals) {
    const current = await row(c, p, a, "submittal", item.id);
    if (current.state !== "Accepted")
      throw refuse(
        "SubmittalNotAccepted",
        "Every selected supplier submittal needs its technical disposition.",
      );
  }
  const outstanding = await c.query(
    "WITH RECURSIVE chain AS (SELECT id,predecessor_id FROM ppo.engineering_reviews WHERE workspace_id=$1 AND id=$2 UNION SELECT r.id,r.predecessor_id FROM ppo.engineering_reviews r JOIN chain c ON r.id=c.predecessor_id WHERE r.workspace_id=$1) SELECT 1 FROM ppo.engineering_findings WHERE workspace_id=$1 AND review_id IN (SELECT id FROM chain) AND state<>'Accepted'",
    [p.workspace_id, review.id],
  );
  if (outstanding.rowCount)
    throw refuse(
      "FindingsOpen",
      "Respond to all findings and obtain reviewer acceptance before completing the review.",
    );
}
export async function decideReview(
  c: PoolClient,
  p: Principal,
  a: Access,
  id: string,
  version: number | null,
  r: Record<string, unknown>,
) {
  const review = await row(c, p, a, "review", id);
  expected(review.version, version);
  authority(a, p, "review", review.content.purpose);
  for (const document of (
    review.content.submission as { documents: { discipline: string }[] }
  ).documents)
    authority(
      { ...a, pkg: { ...a.pkg, discipline: document.discipline } },
      p,
      "review",
      review.content.purpose,
    );
  if (review.owner_id !== p.actor_id)
    throw refuse(
      "Forbidden",
      "Only the assigned reviewer may decide this submission.",
      403,
    );
  if (
    a.policy?.independent_review &&
    review.content.contributors.includes(p.actor_id)
  )
    throw refuse(
      "IndependentReviewerRequired",
      "Contributors cannot review their own submitted content.",
      403,
    );
  if (review.state !== "Submitted")
    throw refuse(
      "InvalidState",
      "This exact submission already has a decision.",
    );
  const outcome = choice(r.outcome, "outcome", [
      "Reviewed",
      "Returned",
    ] as const),
    rationale = narrative(r.rationale, "rationale");
  if (outcome === "Reviewed") await currentReview(c, p, a, review);
  const result = await state(c, p, "review", id, outcome);
  if (review.content.basis_id) {
    const basis = await row(c, p, a, "basis", review.content.basis_id);
    if (basis.state === "Submitted") {
      await state(c, p, "basis", basis.id, outcome);
      if (outcome === "Reviewed") {
        const previous = basis.predecessor_id
          ? (
              await c.query<{ source_id: string }>(
                "SELECT source_id FROM ppo.engineering_source_lineage WHERE workspace_id=$1 AND basis_id=$2",
                [p.workspace_id, basis.predecessor_id],
              )
            ).rows[0]?.source_id
          : null;
        await publishSource(
          c,
          p,
          a,
          {
            operation_id: uuid(r.operation_id, "operation_id"),
            reason: label(r.reason, "reason", 1000),
          },
          {
            kind: "DesignBasis",
            reference: basis.reference,
            title: basis.title,
            revision: String(basis.revision),
            file_version: String(basis.version),
            purpose: review.content.purpose,
            content: {
              basis: basis.content,
              review_id: review.id,
              submission_hash: review.content.submission_hash,
              rationale,
            },
            basis_id: basis.id,
            predecessor_id: previous,
            dependencies: sourceIds(basis.content),
            restricted: (
              await requireSources(c, p, a, sourceIds(basis.content))
            ).some((s) => s.restricted),
          },
        );
      }
    }
  }
  return {
    record: result,
    evidence: {
      rationale,
      outcome,
      submission_hash: review.content.submission_hash,
    },
  };
}
export async function createIssue(
  c: PoolClient,
  p: Principal,
  a: Access,
  r: Record<string, unknown>,
  version: number | null,
) {
  const review = await row(c, p, a, "review", uuid(r.review_id, "review_id"));
  expected(review.version, version);
  authority(a, p, "issue", review.content.purpose);
  for (const document of (
    review.content.submission as { documents: { discipline: string }[] }
  ).documents)
    authority(
      { ...a, pkg: { ...a.pkg, discipline: document.discipline } },
      p,
      "issue",
      review.content.purpose,
    );
  if (review.state !== "Reviewed")
    throw refuse(
      "ReviewRequired",
      "A completed exact technical review is required.",
    );
  if (
    a.policy?.independent_issue &&
    [...review.content.contributors, review.owner_id].includes(p.actor_id)
  )
    throw refuse(
      "IndependentIssuerRequired",
      "The issuer must be separate from the authors and reviewer.",
      403,
    );
  await currentReview(c, p, a, review);
  const recipientIds = ids(r.recipient_ids, "recipient_ids");
  if (
    !recipientIds.length ||
    new Set(recipientIds).size !== recipientIds.length
  )
    throw refuse(
      "RecipientRequired",
      "Choose distinct permitted synthetic recipients.",
    );
  for (const id of recipientIds) await person(c, p, a, id);
  const existing = await c.query(
    "SELECT 1 FROM ppo.engineering_issues WHERE workspace_id=$1 AND package_id=$2 AND content->>'review_id'=$3",
    [p.workspace_id, a.pkg.id, review.id],
  );
  if (existing.rowCount)
    throw refuse(
      "AlreadyIssued",
      "This exact review already has an issue; changed content needs a new review and issue.",
      409,
    );
  const manifest = {
    schema_version: 1,
    review_id: review.id,
    purpose: review.content.purpose,
    submission_hash: review.content.submission_hash,
    exact_content: review.content.submission,
    recipient_ids: recipientIds,
  };
  const issue = await insert(c, p, a, "issue", {
    id: uuid(r.id, "id"),
    reference: label(r.reference, "reference", 80),
    title: label(r.title, "title", 200),
    owner_id: p.actor_id,
    due_date: null,
    state: "Issued",
    content: {
      schema_version: 1,
      purpose: review.content.purpose,
      source_ids: review.content.source_ids,
      review_id: review.id,
      manifest,
      manifest_hash: hash(manifest),
      policy_id: a.policy!.id,
    },
  });
  for (const id of recipientIds)
    await c.query(
      "INSERT INTO ppo.engineering_transmittals(id,workspace_id,package_id,issue_id,recipient_id,created_by) VALUES($1,$2,$3,$4,$5,$6)",
      [randomUUID(), p.workspace_id, a.pkg.id, issue.id, id, p.actor_id],
    );
  await publishSource(
    c,
    p,
    a,
    {
      operation_id: uuid(r.operation_id, "operation_id"),
      reason: label(r.reason, "reason", 1000),
    },
    {
      kind: "DrawingIssue",
      reference: issue.reference,
      title: issue.title,
      revision: "1",
      file_version: "1",
      purpose: review.content.purpose,
      content: manifest,
      issue_id: issue.id,
      dependencies: [
        ...review.content.source_ids,
        ...(review.content.basis_id
          ? await nativeSourceIds(c, p, a, "basis", review.content.basis_id)
          : []),
      ],
      restricted: (
        await requireSources(c, p, a, review.content.source_ids)
      ).some((s) => s.restricted),
    },
  );
  return issue;
}
export function reviewPurpose(record: ControlRecord<"review">): Purpose {
  return record.content.purpose;
}
