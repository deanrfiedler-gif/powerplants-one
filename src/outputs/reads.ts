import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import {
  hasPermission,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { uuid } from "../shared/validation";
import { packContext, issueContext, packAppointmentApplicable } from "../documents/context";
import { reportContext } from "../reports/context";
import { readBundle, type OutputManifest } from "../documents/worker";
import { readReportBundle, type ReportManifest } from "../reports/worker";
import {
  outputKinds,
  outputQuery,
  outputDetailQuery,
  outputMatches,
  visibleOutputLimit,
  type OutputKind,
  type OutputRow,
  type OutputRecipientSummary,
} from "./model";

// Identifiers are internal constants, never interpolated request text.
const sources = {
  JobPack: {
    table: "packs",
    issues: "pack_issues",
    jobs: "pack_render_jobs",
    revisions: "pack_revisions",
    parent: "pack_id",
    cap: "pack.read",
    page: "packs",
  },
  ServiceReport: {
    table: "service_reports",
    issues: "report_issues",
    jobs: "report_render_jobs",
    revisions: "report_revisions",
    parent: "report_id",
    cap: "report.read",
    page: "reports",
  },
} as const;
const hidden = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
const changed = () =>
  new AppError(
    409,
    "OutputReadChanged",
    "Access changed during this read. Refresh the register.",
  );
async function begin(c: QueryClient, p: Principal) {
  // Native writers lock this row exclusively; shared readers make no business writes.
  await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
    p.workspace_id,
  ]);
}
async function context(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  id: string,
) {
  const native =
    kind === "JobPack"
      ? await packContext(c, p, id)
      : await reportContext(c, p, id);
  const record = "pack" in native ? native.pack : native.report;
  const internal =
    kind === "JobPack"
      ? (await hasPermission(
          c,
          p,
          "pack.prepare",
          record.company_id,
          record.site_id,
        )) ||
        (await hasPermission(
          c,
          p,
          "pack.check",
          record.company_id,
          record.site_id,
        )) ||
        (await hasPermission(
          c,
          p,
          "pack.issue",
          record.company_id,
          record.site_id,
        ))
      : await hasPermission(
          c,
          p,
          "service.work_order.edit",
          record.company_id,
          record.site_id,
        );
  return { record, a: native.a, w: native.w, internal };
}
async function projection(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  id: string,
) {
  const ctx = await context(c, p, kind, id),
    { record: r, a, w, internal } = ctx,
    s = sources[kind];
  let issue =
    (
      await c.query(
        `SELECT i.id,i.revision_id,r.revision AS revision_number,i.issued_at,i.output_hash${kind === "JobPack" ? ",i.assignment_version" : ",i.recipient_id"}
         FROM ppo.${s.issues} i JOIN ppo.${s.revisions} r ON (r.workspace_id,r.${s.parent},r.id)=(i.workspace_id,i.${s.parent},i.revision_id)
         WHERE i.workspace_id=$1 AND i.${s.parent}=$2 AND i.id=$3`,
        [p.workspace_id, id, r.current_issue_id],
      )
    ).rows[0] ?? null;
  if (issue && kind === "JobPack" && !internal) {
    try {
      await issueContext(c, p, issue.id);
    } catch (e) {
      if (!hidden(e)) throw e;
      issue = null;
    }
    if (issue?.assignment_version !== a.assignment_version) issue = null;
  }
  const job = internal
    ? ((
        await c.query(
          `SELECT j.id,j.revision_id,r.revision AS revision_number,j.state,j.requested_at
           FROM ppo.${s.jobs} j JOIN ppo.${s.revisions} r ON (r.workspace_id,r.${s.parent},r.id)=(j.workspace_id,j.${s.parent},j.revision_id)
           WHERE j.workspace_id=$1 AND j.${s.parent}=$2 ORDER BY j.requested_at DESC,j.id LIMIT 1`,
          [p.workspace_id, id],
        )
      ).rows[0] ?? null)
    : null;
  const revisionId =
    kind === "JobPack" && !internal
      ? (issue?.revision_id ?? null)
      : r.current_revision_id;
  const revision = revisionId
    ? (
        await c.query(
          `SELECT revision FROM ppo.${s.revisions} WHERE workspace_id=$1 AND ${s.parent}=$2 AND id=$3`,
          [p.workspace_id, id, revisionId],
        )
      ).rows[0]
    : null;
  const recipientSummary: OutputRecipientSummary = {
    visibility: kind === "JobPack" && !internal ? "NotProvided" : "NotIssued",
    recipient_count: null,
    acknowledged_count: null,
    required_recipient_count: null,
    required_acknowledged_count: null,
  };
  if (issue && kind === "ServiceReport") {
    recipientSummary.visibility = "FrozenReportRecipient";
    recipientSummary.recipient_count = issue.recipient_id ? 1 : null;
  } else if (issue) {
    const summary = (
      await c.query(
        `SELECT count(*)::integer AS recipient_count,
       count(*) FILTER (WHERE acknowledged)::integer AS acknowledged_count,
       count(*) FILTER (WHERE required)::integer AS required_recipient_count,
       count(*) FILTER (WHERE required AND acknowledged)::integer AS required_acknowledged_count
       FROM (SELECT r.required,EXISTS(SELECT 1 FROM ppo.pack_acknowledgements a
         WHERE a.workspace_id=r.workspace_id AND a.recipient_id=r.id AND a.actor_id=r.user_id AND a.presented_hash=$5) AS acknowledged
         FROM ppo.pack_recipients r WHERE r.workspace_id=$1 AND r.issue_id=$2 AND ($3 OR r.user_id=$4)) visible`,
        [p.workspace_id, issue.id, internal, p.actor_id, issue.output_hash],
      )
    ).rows[0];
    Object.assign(recipientSummary, summary, {
      visibility: internal ? "AllRecipients" : "OwnRecipient",
    });
  }
  const row: OutputRow = {
    kind,
    id,
    reference: r.display_number,
    version: r.version,
    source_state: r.status,
    updated_at: r.updated_at,
    company_id: r.company_id,
    site_id: r.site_id,
    organisation_id: w.customer_id,
    service_owner_id: w.service_owner_id,
    appointment: { id: a.id, reference: a.display_number },
    work_order: { id: w.id, reference: w.display_number },
    current_revision_id: revisionId,
    current_revision_number: revision?.revision ?? null,
    current_issue: issue
      ? {
          id: issue.id,
          revision_id: issue.revision_id,
          revision_number: issue.revision_number,
          issued_at: issue.issued_at,
          output_hash: issue.output_hash,
        }
      : null,
    recipient_summary: recipientSummary,
    needs_review: kind === "JobPack" ? r.needs_review : null,
    preparation: job,
    availability: issue
      ? "NotChecked"
      : kind === "JobPack" && !internal
        ? "NotProvided"
        : "NotIssued",
    native_href: `/service/${s.page}/${id}`,
    detail_href: `/api/v1/document-outputs/${id}?kind=${kind}`,
  };
  return { ctx, row };
}
type Coverage = "Complete" | "BoundedWindow" | "NotPermitted" | "NotSelected";
export async function listOutputs(p: Principal, input: unknown = {}) {
  const q = outputQuery(input);
  return transaction(async (c) => {
    await begin(c, p);
    const rows: { row: OutputRow; internal: boolean }[] = [];
    const coverage: { kind: OutputKind; state: Coverage }[] = [];
    let permitted = false;
    for (const kind of outputKinds) {
      if (q.kind && q.kind !== kind) {
        coverage.push({ kind, state: "NotSelected" });
        continue;
      }
      const s = sources[kind];
      if (!(await hasPermission(c, p, s.cap))) {
        coverage.push({ kind, state: "NotPermitted" });
        continue;
      }
      permitted = true;
      let offset = 0,
        visible = 0,
        state: Coverage = "Complete";
      while (true) {
        const candidates = (
          await c.query<{ id: string }>(
            `SELECT o.id FROM ppo.${s.table} o WHERE o.workspace_id=$1 AND ${scopeSql("o.company_id", "o.site_id", s.cap)} ORDER BY o.updated_at DESC,o.id LIMIT 100 OFFSET $3`,
            [p.workspace_id, p.actor_id, offset],
          )
        ).rows;
        for (const candidate of candidates) {
          try {
            const { ctx, row } = await projection(c, p, kind, candidate.id);
            if (++visible > visibleOutputLimit) {
              state = "BoundedWindow";
              break;
            }
            rows.push({ row, internal: ctx.internal });
          } catch (e) {
            if (!hidden(e)) throw e;
          }
        }
        if (state === "BoundedWindow" || candidates.length < 100) break;
        offset += 100;
      }
      coverage.push({ kind, state });
    }
    if (!permitted)
      throw new AppError(
        403,
        "Forbidden",
        "No selected output family is permitted.",
      );
    // Expiring grants are checked again before counts, including rows outside the page.
    for (const { row, internal } of rows) {
      try {
        const now = await context(c, p, row.kind, row.id);
        if (now.internal !== internal) throw changed();
        if (row.kind === "JobPack" && row.current_issue)
          await issueContext(c, p, row.current_issue.id);
      } catch (e) {
        if (hidden(e)) throw changed();
        throw e;
      }
    }
    for (const source of coverage)
      if (
        ["Complete", "BoundedWindow"].includes(source.state) &&
        !(await hasPermission(c, p, sources[source.kind].cap))
      )
        throw changed();
    const matching = rows
      .map((x) => x.row)
      .filter((row) => outputMatches(row, q))
      .sort(
        (a, b) =>
          b.updated_at.getTime() - a.updated_at.getTime() ||
          a.kind.localeCompare(b.kind) ||
          a.id.localeCompare(b.id),
      );
    const complete = !coverage.some((x) => x.state === "BoundedWindow");
    return {
      schema_version: 1,
      synthetic: true,
      scope_id: "DK-03",
      as_at: new Date().toISOString(),
      coverage,
      coverage_scope: "Permitted selected families",
      window_limit_per_family: visibleOutputLimit,
      total_matching: complete ? matching.length : null,
      matching_in_window: matching.length,
      offset: q.offset,
      limit: q.limit,
      has_more_in_window: q.offset + q.limit < matching.length,
      items: matching.slice(q.offset, q.offset + q.limit),
    };
  });
}

async function selectedIssue(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  id: string,
  issueId: string,
) {
  if (kind === "JobPack") {
    const { issue } = await issueContext(c, p, issueId);
    if (issue.pack_id !== id) throw unavailable();
    return issue;
  }
  await reportContext(c, p, id);
  const issue = (
    await c.query(
      "SELECT * FROM ppo.report_issues WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
      [p.workspace_id, id, issueId],
    )
  ).rows[0];
  if (!issue) throw unavailable();
  return issue;
}
function exactMetadata(
  kind: OutputKind,
  manifest: OutputManifest | ReportManifest,
) {
  const pack = kind === "JobPack" ? (manifest as OutputManifest) : null;
  const report = kind === "ServiceReport" ? (manifest as ReportManifest) : null;
  return {
    source_hash: pack?.snapshot_hash ?? report!.source_hash,
    customer_hash: report?.customer_hash ?? null,
    template: {
      id: manifest.template.id,
      version: manifest.template.version,
      hash: pack?.template.hash ?? report!.template.content_hash,
      policy_version: manifest.template.policy_version,
    },
    prepared_at: manifest.prepared_at,
    html_hash: manifest.html_hash,
    html_bytes: manifest.html_bytes,
    pdf_hash: manifest.pdf_hash,
    pdf_bytes: manifest.pdf_bytes,
    filename: manifest.filename,
  };
}
async function recipients(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  issueId: string,
  internal: boolean,
) {
  if (kind === "ServiceReport") {
    const responses = (
      await c.query(
        `SELECT r.id,r.presentation_id,r.presented_hash,r.response,r.respondent_name,r.respondent_role,
       r.presented_at,r.captured_at,r.received_at,r.actor_id,
       x.supersedes_response_id,x.correction_reason,x.restrictions,
       EXISTS(SELECT 1 FROM ppo.customer_response_contexts n WHERE n.workspace_id=r.workspace_id AND n.supersedes_response_id=r.id) AS superseded
       FROM ppo.customer_responses r JOIN ppo.report_presentations v ON (v.workspace_id,v.id)=(r.workspace_id,r.presentation_id)
       LEFT JOIN ppo.customer_response_contexts x ON (x.workspace_id,x.response_id)=(r.workspace_id,r.id)
       WHERE r.workspace_id=$1 AND v.issue_id=$2 AND v.kind='IssuedReport' AND r.presented_hash=v.content_hash
       AND COALESCE(x.subject,'ReportContent')='ReportContent' ORDER BY r.received_at,r.id`,
        [p.workspace_id, issueId],
      )
    ).rows;
    return {
      support: "NotRecordedBySource",
      sent_at: null,
      delivered_at: null,
      responses: responses.map((r) => ({ ...r, subject: "ReportContent" })),
      recipients: [],
    };
  }
  const people = (
    await c.query(
      "SELECT id,user_id,required,assignment_id,assignment_version FROM ppo.pack_recipients WHERE workspace_id=$1 AND issue_id=$2 AND ($3 OR user_id=$4) ORDER BY id",
      [p.workspace_id, issueId, internal, p.actor_id],
    )
  ).rows;
  const result = [];
  for (const person of people) {
    const events = (
      await c.query(
        "SELECT id,kind,occurred_at FROM ppo.pack_distribution_events WHERE workspace_id=$1 AND recipient_id=$2 ORDER BY occurred_at,id",
        [p.workspace_id, person.id],
      )
    ).rows;
    const acknowledgements = (
      await c.query(
        "SELECT id,actor_id,presented_hash,captured_at,acknowledged_at FROM ppo.pack_acknowledgements WHERE workspace_id=$1 AND recipient_id=$2 ORDER BY acknowledged_at,id",
        [p.workspace_id, person.id],
      )
    ).rows;
    result.push({
      ...person,
      sent_at: null,
      delivered_at: null,
      events,
      acknowledgements,
    });
  }
  return {
    support: "SimulatedOnly",
    sent_at: null,
    delivered_at: null,
    responses: [],
    recipients: result,
  };
}

export async function readOutput(
  p: Principal,
  idInput: string,
  input: unknown,
) {
  const id = uuid(idInput, "output_id"),
    q = outputDetailQuery(input),
    kind = q.kind,
    s = sources[kind];
  return transaction(async (c) => {
    await begin(c, p);
    let { ctx, row } = await projection(c, p, kind, id);
    const selected = q.issue_id ?? row.current_issue?.id ?? null;
    const issue = selected
      ? await selectedIssue(c, p, kind, id, selected)
      : null;
    const presentation =
      issue && kind === "ServiceReport"
        ? ((
            await c.query(
              "SELECT id,content_hash,html_hash FROM ppo.report_presentations WHERE workspace_id=$1 AND report_id=$2 AND issue_id=$3 AND kind='IssuedReport' ORDER BY created_at,id LIMIT 1",
              [p.workspace_id, id, issue.id],
            )
          ).rows[0] ?? null)
        : null;
    let availability:
      "NotIssued" | "NotProvided" | "Available" | "ExactUnavailable" =
      "NotIssued";
    if (issue) {
      availability = "Available";
      // Only bundle access is converted to availability. Database and authority failures propagate.
      try {
        if (kind === "JobPack") await readBundle(p, issue.manifest);
        else {
          await readReportBundle(p, issue.manifest);
          if (
            !presentation ||
            presentation.content_hash !== issue.manifest.html_hash ||
            presentation.html_hash !== issue.manifest.html_hash
          )
            throw Error("Exact presentation mismatch");
        }
      } catch {
        availability = "ExactUnavailable";
      }
    }
    // Storage can outlive a grant. Rebuild redactions and recheck exact-issue authority afterwards.
    ({ ctx, row } = await projection(c, p, kind, id));
    if (!issue && row.availability === "NotProvided")
      availability = "NotProvided";
    if (issue) await selectedIssue(c, p, kind, id, issue.id);
    const jobs = ctx.internal
      ? (
          await c.query(
            `SELECT j.id,j.revision_id,r.revision AS revision_number,j.state,j.attempts,j.error_code,j.issue_id,j.requested_at,
       j.output_manifest IS NOT NULL AS has_recorded_output,j.output_manifest->>'prepared_at' AS prepared_at
       FROM ppo.${s.jobs} j JOIN ppo.${s.revisions} r ON (r.workspace_id,r.${s.parent},r.id)=(j.workspace_id,j.${s.parent},j.revision_id)
       WHERE j.workspace_id=$1 AND j.${s.parent}=$2 ORDER BY j.requested_at DESC,j.id`,
            [p.workspace_id, id],
          )
        ).rows
      : [];
    const history = (
      await c.query(
        `SELECT i.id,i.revision_id,r.revision AS revision_number,i.issued_at,i.output_hash
         FROM ppo.${s.issues} i JOIN ppo.${s.revisions} r ON (r.workspace_id,r.${s.parent},r.id)=(i.workspace_id,i.${s.parent},i.revision_id)
         WHERE i.workspace_id=$1 AND i.${s.parent}=$2 AND ($3 OR i.id=$4) ORDER BY i.issued_at DESC,i.id`,
        [
          p.workspace_id,
          id,
          kind === "ServiceReport" || ctx.internal,
          issue?.id ?? null,
        ],
      )
    ).rows;
    const revision = issue
      ? (
          await c.query(
            `SELECT id,revision,predecessor_id FROM ppo.${s.revisions} WHERE workspace_id=$1 AND ${s.parent}=$2 AND id=$3`,
            [p.workspace_id, id, issue.revision_id],
          )
        ).rows[0]
      : null;
    const distribution = issue
      ? await recipients(c, p, kind, issue.id, ctx.internal)
      : null;
    const events =
      issue && kind === "JobPack"
        ? (
            await c.query(
              "SELECT id,kind,occurred_at,CASE WHEN $3 THEN reason ELSE NULL END AS reason FROM ppo.pack_issue_events WHERE workspace_id=$1 AND issue_id=$2 ORDER BY occurred_at,id",
              [p.workspace_id, issue.id, ctx.internal],
            )
          ).rows
        : [];
    const final = await context(c, p, kind, id);
    if (final.internal !== ctx.internal) throw changed();
    if (issue) await selectedIssue(c, p, kind, id, issue.id);
    const fileBase = issue
      ? kind === "JobPack"
        ? `/api/v1/pack-issues/${issue.id}`
        : `/api/v1/reports/${id}`
      : null;
    const suffix =
      kind === "ServiceReport" ? `?presentation_id=${presentation?.id}` : "";
    return {
      schema_version: 1,
      synthetic: true,
      scope_id: "DK-03",
      as_at: new Date().toISOString(),
      output: row,
      availability,
      preparation_visibility: ctx.internal ? "Internal" : "NotProvided",
      preparations: jobs,
      history_coverage:
        kind === "ServiceReport" || ctx.internal
          ? "AllIssues"
          : "SelectedIssueOnly",
      issue_history: history,
      selected_issue: issue
        ? {
            id: issue.id,
            revision,
            issued_at: issue.issued_at,
            output_hash: issue.output_hash,
            review_id: kind === "ServiceReport" ? issue.review_id : null,
            recipient_id: kind === "ServiceReport" ? issue.recipient_id : null,
            exact: exactMetadata(kind, issue.manifest),
            is_current_issue: ctx.record.current_issue_id === issue.id,
            is_current_revision:
              ctx.record.current_revision_id === issue.revision_id,
            // Pack applicability mirrors its native exact-issue read. Report facts carry no new approval claim.
            pack_applicable:
              kind === "JobPack"
                ? ctx.record.current_issue_id === issue.id &&
                  !ctx.record.needs_review &&
                  ctx.record.status === "Issued" &&
                  packAppointmentApplicable(ctx.a.status) &&
                  issue.assignment_version === ctx.a.assignment_version &&
                  issue.schedule_version === ctx.a.schedule_version
                : null,
            files:
              kind === "ServiceReport" && !presentation
                ? null
                : {
                    html: `${fileBase}/html${suffix}`,
                    pdf: `${fileBase}/pdf${suffix}`,
                    manifest: `${fileBase}/manifest${suffix}`,
                  },
            events,
            distribution,
          }
        : null,
    };
  });
}
