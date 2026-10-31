import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { unavailable } from "../../platform/errors";
import { choice, object, uuid } from "../../shared/validation";
import { estimateReviewInTransaction } from "./reads";
import { releaseInTransaction } from "../release/reads";
import { queuePerson, queueSite } from "./queue-context";
import { latestDecisions } from "./model";
import { reviewKinds } from "./validation";

export type ReviewSnapshot = {
  title: string;
  reference: string;
  revision: number;
  estimate_version_id: string;
  submitted_at: string;
  submitted_by: string;
  site: string | null;
  superseded: boolean;
  source_current: boolean;
  source_message: string;
  can_decide: boolean;
  href: string;
  estimate_href: string;
  reviews: { kind: string; state: string; carried_forward: boolean }[];
  findings: {
    id: string;
    detail: string;
    response: string | null;
    prior: boolean;
  }[];
  history: {
    id: string;
    label: string;
    at: string;
    actor: string;
    reason: string;
  }[];
  files: { label: string; href: string }[];
};

export async function readReviewSnapshot(
  p: Principal,
  input: Record<string, string>,
) {
  const q = object(input, ["source", "id", "submission_id", "kind"]);
  const source = choice(q.source, "source", [
    "EstimateReview",
    "QuotationApproval",
  ] as const);
  const id = uuid(q.id, "id"),
    submissionId = uuid(q.submission_id, "submission_id");
  const kind = choice(q.kind, "kind", [
    ...reviewKinds,
    "QuotationApproval",
  ] as const);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    if (source === "EstimateReview") {
      if (kind === "QuotationApproval") throw unavailable();
      const d = await estimateReviewInTransaction(c, p, id);
      const s = d.submissions.find((s) => s.id === submissionId);
      if (!s) throw unavailable();
      const saved = d.versions.find((v) => v.id === s.estimate_version_id)!;
      const superseded = d.submissions.at(-1)?.id !== s.id;
      const current = s.basis.fingerprints[kind] === d.basis.fingerprints[kind];
      const nextSequence =
        d.submissions.find((e) => e.sequence > s.sequence)?.sequence ??
        Infinity;
      const decisions = d.decisions.filter((e) => e.sequence < nextSequence);
      const selectedStatuses = latestDecisions(
        d.submissions.filter((e) => e.sequence <= s.sequence),
        decisions,
        s.basis,
      );
      const findings = decisions
        .filter((e) => e.kind === kind && e.outcome === "Returned")
        .flatMap((e) =>
          e.findings.map((f) => ({
            id: f.id,
            detail: f.detail,
            response:
              d.submissions
                .filter((x) => x.sequence <= s.sequence)
                .flatMap((x) => x.responses)
                .find((r) => r.finding_id === f.id)?.response ?? null,
            prior: e.submission_id !== s.id,
          })),
        );
      const history = await recordedHistory(
        c,
        p,
        [
          ...d.submissions.map((e) => ({
            ...e,
            label: `Submitted for review · v${d.versions.find((v) => v.id === e.estimate_version_id)?.version ?? "not recorded"}`,
          })),
          ...d.decisions.map((e) => ({
            ...e,
            label: `${e.kind === "SourcePrice" ? "Source & price" : e.kind}: ${e.outcome} · submission ${d.submissions.find((s) => s.id === e.submission_id)?.sequence ?? "not recorded"}`,
          })),
        ].sort((a, b) => b.sequence - a.sequence),
      );
      const result: ReviewSnapshot = {
        title: saved.title,
        reference: d.estimate.display_number,
        revision: saved.version,
        estimate_version_id: saved.id,
        submitted_at: s.created_at.toISOString(),
        submitted_by: await queuePerson(c, p, s.created_by),
        site: (await queueSite(c, p, s.basis.context.site_id))?.name ?? null,
        superseded,
        source_current: current,
        source_message: current
          ? "The recorded basis still matches the current source for this review kind."
          : "The saved estimate, discovery or source facts have changed. The native review checks applicability and requires a deliberate successor where necessary.",
        can_decide:
          !superseded &&
          current &&
          !!d.statuses.find((x) => x.kind === kind)?.can_review &&
          !selectedStatuses.some(
            (x) =>
              x.kind === kind &&
              x.applicable &&
              x.decision?.outcome === "Reviewed",
          ),
        href: `/estimating/estimates/${id}/review?submission_id=${s.id}&kind=${kind}`,
        estimate_href: `/estimating/estimates/${id}?version_id=${saved.id}`,
        reviews: selectedStatuses.map((x) => ({
          kind: x.kind,
          state: x.applicable
            ? (x.decision?.outcome ?? "Pending")
            : x.decision
              ? "Changed basis"
              : "Pending",
          carried_forward:
            !!x.decision && x.applicable && x.decision.submission_id !== s.id,
        })),
        findings,
        history,
        files: [],
      };
      // Recheck exact current and historical authority after metadata reads.
      await estimateReviewInTransaction(c, p, id);
      return result;
    }
    if (kind !== "QuotationApproval") throw unavailable();
    const d = await releaseInTransaction(c, p, submissionId);
    if (d.revision.quote_id !== id || !d.base) throw unavailable();
    const result: ReviewSnapshot = {
      title: d.revision.snapshot.title,
      reference: d.revision.snapshot.display_number,
      revision: d.revision.version,
      estimate_version_id: d.revision.estimate_version_id,
      submitted_at: d.base.created_at.toISOString(),
      submitted_by: await queuePerson(c, p, d.base.created_by),
      site: d.base.basis.recipient.site,
      superseded: d.revisions.some((r) => r.version > d.revision.version),
      source_current: d.current,
      source_message:
        d.hold ??
        "The retained quotation basis matches its current sources. Approval checks the exact rendered output again.",
      can_decide: d.can.approve,
      href: `/estimating/quotes/${submissionId}/release`,
      estimate_href: `/estimating/estimates/${d.revision.estimate_id}?version_id=${d.revision.estimate_version_id}`,
      reviews: [
        {
          kind: "QuotationApproval",
          state: d.issue
            ? "Issued"
            : (d.approval?.outcome ??
              (d.job.state === "Ready" ? "Pending" : "Output pending")),
          carried_forward: false,
        },
      ],
      findings:
        d.approval?.outcome === "Returned"
          ? [
              {
                id: d.approval.id,
                detail: d.approval.reason,
                response: null,
                prior: false,
              },
            ]
          : [],
      history: await recordedHistory(
        c,
        p,
        [...d.events].reverse().map((e) => ({
          ...e,
          label: `r${d.revisions.find((r) => r.id === e.revision_id)?.version ?? "not recorded"} · ${e.action}${e.outcome ? `: ${e.outcome}` : ""}`,
        })),
      ),
      files: [
        {
          label: "Inspect exact rendered quotation files",
          href: `/estimating/quotes/${submissionId}/release`,
        },
      ],
    };
    await releaseInTransaction(c, p, submissionId);
    return result;
  });
}

// One lookup on the transaction client: do not enqueue parallel queries on pg.
async function recordedHistory(
  c: QueryClient,
  p: Principal,
  events: {
    id: string;
    label: string;
    created_at: Date;
    created_by: string;
    reason: string;
  }[],
) {
  const people = await c.query<{ id: string; display_name: string }>(
    "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[])",
    [p.workspace_id, [...new Set(events.map((e) => e.created_by))]],
  );
  const names = new Map(people.rows.map((u) => [u.id, u.display_name]));
  return events.map((e) => ({
    id: e.id,
    label: e.label,
    at: e.created_at.toISOString(),
    actor: names.get(e.created_by) ?? "Recorded user",
    reason: e.reason,
  }));
}
