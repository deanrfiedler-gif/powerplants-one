import { transaction } from "../platform/database";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError } from "../platform/errors";
import {
  choice,
  invalid,
  label,
  object,
  optionalId,
  uuid,
} from "../shared/validation";
import { documentContext, revisionContext, targetContext } from "./context";
import { exactBytes, sourceAuthority } from "./sources";
import type { DocumentRow, Revision } from "./types";
async function readTransaction<T>(
  p: Principal,
  read: (c: PoolClient) => Promise<T>,
) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    return read(c);
  });
}
const hidden = (e: unknown) =>
  e instanceof AppError && (e.status === 403 || e.status === 404);
function publicRevision(r: Revision) {
  return {
    id: r.id,
    revision: r.revision,
    title: r.title,
    document_type: r.document_type,
    applicability: r.applicability,
    audience: r.audience,
    owner_id: r.owner_id,
    created_by: r.created_by,
    created_at: r.created_at,
    reason: r.reason,
    source: {
      kind: r.source.kind,
      issue_id: r.source.issue_id,
      content_hash: r.source.content_hash,
      byte_count: r.source.byte_count,
      content_type: r.source.content_type,
    },
  };
}
async function status(
  c: QueryClient,
  p: Principal,
  d: DocumentRow,
  r: Revision,
) {
  const source = await sourceAuthority(c, p, r.source);
  let availability = "Available";
  try {
    await exactBytes(c, p, d.id, r.id, r.source);
  } catch (e) {
    if (e instanceof AppError && e.code === "ExactDocumentUnavailable")
      availability = "ExactUnavailable";
    else throw e;
  }
  const review =
    (
      await c.query(
        "SELECT * FROM ppo.library_reviews WHERE workspace_id=$1 AND revision_id=$2",
        [p.workspace_id, r.id],
      )
    ).rows[0] ?? null;
  const findings = (
    await c.query(
      "SELECT id,state FROM ppo.library_findings WHERE workspace_id=$1 AND revision_id=$2",
      [p.workspace_id, r.id],
    )
  ).rows;
  const finding = {
    unresolved: findings.filter((f) => f.state !== "Closed").length,
    later:
      !!review &&
      findings.some(
        (f) =>
          !review.findings_snapshot.some(
            (prior: { id: string }) => prior.id === f.id,
          ),
      ),
  };
  const review_state = !review
    ? "Unreviewed"
    : review.outcome === "Returned"
      ? "Returned"
      : finding.later
        ? "ReviewOutdated"
        : "Reviewed";
  return {
    availability,
    source_current: source.current,
    library_current: d.current_revision_id === r.id,
    review_state,
    unresolved_findings: finding.unresolved,
    eligible_for_current_use:
      d.state === "Current" &&
      d.current_revision_id === r.id &&
      source.current &&
      availability === "Available" &&
      review_state === "Reviewed" &&
      finding.unresolved === 0,
    review: review
      ? {
          id: review.id,
          outcome: review.outcome,
          purpose: review.purpose,
          rationale: review.rationale,
          reviewer_id: review.reviewer_id,
          created_at: review.created_at,
          content_hash: review.content_hash,
        }
      : null,
  };
}
export async function readDocument(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, ["revision_id"]);
  return readTransaction(p, async (c) => {
    const { d, r: current } = await documentContext(c, p, id),
      r = query.revision_id
        ? await revisionContext(c, p, d, query.revision_id)
        : current;
    const findings = (
      await c.query(
        "SELECT id,text,owner_id,due_date::text AS due_date,state,response,response_by,response_at,acceptance,accepted_by,accepted_at,created_by,created_at FROM ppo.library_findings WHERE workspace_id=$1 AND revision_id=$2 ORDER BY created_at,id",
        [p.workspace_id, r.id],
      )
    ).rows;
    return {
      document: d,
      revision: publicRevision(r),
      ...(await status(c, p, d, r)),
      findings,
      synthetic: true,
    };
  });
}
export async function listDocuments(
  p: Principal,
  query: Record<string, string> = {},
) {
  object(query, [
    "q",
    "state",
    "document_type",
    "company_id",
    "organisation_id",
    "site_id",
    "owner_id",
    "availability",
    "review_state",
    "after",
    "limit",
  ]);
  const q =
    query.q === undefined ? null : label(query.q, "q", 200).toLocaleLowerCase();
  const state =
    query.state === undefined
      ? "Current"
      : choice(query.state, "state", ["Current", "Withdrawn", "All"] as const);
  const availability =
    query.availability === undefined
      ? null
      : choice(query.availability, "availability", [
          "Available",
          "ExactUnavailable",
        ] as const);
  const review_state =
    query.review_state === undefined
      ? null
      : choice(query.review_state, "review_state", [
          "Unreviewed",
          "Reviewed",
          "Returned",
          "ReviewOutdated",
        ] as const);
  const owner = optionalId(query.owner_id, "owner_id");
  const type =
    query.document_type === undefined
      ? null
      : label(query.document_type, "document_type", 80);
  const company = optionalId(query.company_id, "company_id"),
    organisation = optionalId(query.organisation_id, "organisation_id"),
    site = optionalId(query.site_id, "site_id");
  let after = optionalId(query.after, "after");
  const limit = query.limit === undefined ? 25 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    invalid("limit", "Choose 1–50 records.");
  return readTransaction(p, async (c) => {
    const items = [];
    // Scan in bounded batches; current authority precedes filtering and public pagination.
    for (;;) {
      const candidates = (
        await c.query(
          `SELECT id FROM ppo.library_documents WHERE workspace_id=$1 AND ($2::uuid IS NULL OR id>$2)
      AND ($3='All' OR state=$3) AND ($4::uuid IS NULL OR company_id=$4) AND ($5::uuid IS NULL OR organisation_id=$5)
      AND ($6::uuid IS NULL OR site_id=$6) ORDER BY id LIMIT 100`,
          [p.workspace_id, after, state, company, organisation, site],
        )
      ).rows;
      if (!candidates.length)
        return { items, next_after: null, synthetic: true };
      for (const candidate of candidates) {
        after = candidate.id;
        try {
          const { d, r } = await documentContext(c, p, candidate.id);
          if (
            (type && r.document_type !== type) ||
            (owner && r.owner_id !== owner)
          )
            continue;
          if (
            q &&
            ![r.title, d.display_number, r.applicability, r.document_type]
              .join(" ")
              .toLocaleLowerCase()
              .includes(q)
          )
            continue;
          const observed = await status(c, p, d, r);
          if (
            (availability && observed.availability !== availability) ||
            (review_state && observed.review_state !== review_state)
          )
            continue;
          if (items.length === limit)
            return {
              items,
              next_after: items.at(-1)!.document.id,
              synthetic: true,
            };
          items.push({ document: d, revision: publicRevision(r), ...observed });
        } catch (e) {
          if (!hidden(e)) throw e;
        }
      }
    }
  });
}
export async function documentUsage(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, ["after", "limit"]);
  const after = optionalId(query.after, "after"),
    limit = query.limit === undefined ? 25 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    invalid("limit", "Choose 1–50 references.");
  return readTransaction(p, async (c) => {
    const { d } = await documentContext(c, p, id),
      items = [];
    let coverage: "VisibleReferences" | "Partial" = "VisibleReferences",
      scan = after;
    for (;;) {
      const links = (
        await c.query(
          "SELECT * FROM ppo.library_links WHERE workspace_id=$1 AND document_id=$2 AND ($3::uuid IS NULL OR id>$3) ORDER BY id LIMIT 100",
          [p.workspace_id, d.id, scan],
        )
      ).rows;
      if (!links.length)
        return {
          items,
          next_after: null,
          coverage,
          authority:
            "Declared library references; receiving workflows retain their own authority.",
          synthetic: true,
        };
      for (const link of links) {
        scan = link.id;
        try {
          await revisionContext(c, p, d, link.revision_id);
          await targetContext(c, p, link.target_kind, link.target_id, d);
          if (items.length === limit)
            return {
              items,
              next_after: items.at(-1)!.id,
              coverage,
              synthetic: true,
            };
          items.push({
            id: link.id,
            revision_id: link.revision_id,
            target_kind: link.target_kind,
            target_id: link.target_id,
            purpose: link.purpose,
            created_at: link.created_at,
            created_by: link.created_by,
            retired_at: link.retired_at,
            retired_by: link.retired_by,
            needs_revision_assessment:
              !link.retired_at &&
              (link.revision_id !== d.current_revision_id ||
                d.state === "Withdrawn"),
          });
        } catch (e) {
          if (!hidden(e)) throw e;
          coverage = "Partial";
        }
      }
    }
  });
}
export async function documentHistory(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, ["before", "limit"]);
  const before = query.before === undefined ? 2147483647 : Number(query.before),
    limit = query.limit === undefined ? 25 : Number(query.limit);
  if (!Number.isSafeInteger(before) || before < 1 || before > 2147483647)
    invalid("before", "Use a positive event version.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    invalid("limit", "Choose 1–50 history records.");
  return readTransaction(p, async (c) => {
    const { d } = await documentContext(c, p, id),
      items = [];
    let scan = before,
      coverage: "VisibleHistory" | "Partial" = "VisibleHistory";
    for (;;) {
      const events = (
        await c.query(
          "SELECT * FROM ppo.library_events WHERE workspace_id=$1 AND document_id=$2 AND document_version<$3 ORDER BY document_version DESC LIMIT 100",
          [p.workspace_id, d.id, scan],
        )
      ).rows;
      if (!events.length)
        return { items, next_before: null, coverage, synthetic: true };
      for (const e of events) {
        scan = e.document_version;
        try {
          const r = await revisionContext(c, p, d, e.revision_id);
          if (e.command.startsWith("Link:"))
            await targetContext(
              c,
              p,
              e.payload.target_kind,
              e.payload.target_id,
              d,
            );
          if (items.length === limit)
            return {
              items,
              next_before: items.at(-1)!.version,
              coverage,
              synthetic: true,
            };
          // No raw provider/storage keys or hidden linked records in event snapshots.
          items.push({
            id: e.id,
            version: e.document_version,
            command: e.command,
            revision: publicRevision(r),
            actor_id: e.actor_id,
            created_at: e.created_at,
            reason: e.reason,
            evidence:
              e.command === "Create" || e.command === "Revise"
                ? null
                : e.payload,
          });
        } catch (e) {
          if (!hidden(e)) throw e;
          coverage = "Partial";
        }
      }
    }
  });
}
export async function downloadDocument(
  p: Principal,
  id: string,
  revision_id: string,
) {
  return readTransaction(p, async (c) => {
    const { d } = await documentContext(c, p, id),
      r = await revisionContext(c, p, d, uuid(revision_id, "revision_id"));
    const bytes = await exactBytes(c, p, d.id, r.id, r.source);
    await documentContext(c, p, id);
    await revisionContext(c, p, d, r.id);
    return {
      bytes,
      content_type: r.source.content_type,
      filename:
        d.display_number +
        "-revision-" +
        r.revision +
        (r.source.kind === "SyntheticText" ? ".txt" : ".pdf"),
    };
  });
}
