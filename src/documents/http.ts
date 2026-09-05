import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { database } from "../platform/database";
import {
  failure,
  identity,
  localRequest,
  jsonBody,
  reply,
} from "../platform/http";
import { hasPermission } from "../platform/permissions";
import { unavailable } from "../platform/errors";
import { object, uuid } from "../shared/validation";
import type { RouteContext } from "../shared/http";
import { issueContext, packContext } from "./context";
import { packHtml, type PackSnapshot } from "./render";
import { readBundle, retryRenderJob, readRenderJob } from "./worker";
import { requestIssue } from "./packs";
const fileHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "Referrer-Policy": "no-referrer",
};
export function issueFile(kind: "pdf" | "html" | "manifest") {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request);
      object(Object.fromEntries(request.nextUrl.searchParams), []);
      const p = await identity(request),
        { id } = await context.params;
      const { issue } = await issueContext(database(), p, uuid(id, "issue_id"));
      if (kind === "manifest") return reply(issue.manifest);
      const b = await readBundle(p, issue.manifest);
      const recipients = (
        await database().query(
          "SELECT id FROM ppo.pack_recipients WHERE workspace_id=$1 AND issue_id=$2 AND user_id=$3",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows;
      // Retrieval is observable but is never treated as a response or delivery.
      for (const r of recipients)
        await database().query(
          "INSERT INTO ppo.pack_distribution_events(id,workspace_id,recipient_id,actor_id,kind,evidence) VALUES($1,$2,$3,$4,$5,$6)",
          [
            randomUUID(),
            p.workspace_id,
            r.id,
            p.actor_id,
            kind === "pdf" ? "Downloaded" : "Opened",
            "Server served exact bytes; receipt by a human is not independently verified.",
          ],
        );
      return new NextResponse(kind === "pdf" ? new Uint8Array(b.pdf) : b.html, {
        headers: {
          ...fileHeaders,
          "Content-Type":
            kind === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
          ...(kind === "pdf"
            ? {
                "Content-Disposition": `attachment; filename="${issue.manifest.filename}"`,
              }
            : {}),
        },
      });
    } catch (e) {
      return failure(e);
    }
  };
}
export async function previewPack(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id } = await context.params;
    const query = object(Object.fromEntries(request.nextUrl.searchParams), [
      "revision_id",
    ]);
    const { pack, a } = await packContext(database(), p, uuid(id, "pack_id"));
    const rid = query.revision_id
      ? uuid(query.revision_id, "revision_id")
      : pack.current_revision_id;
    const r = (
      await database().query(
        "SELECT * FROM ppo.pack_revisions WHERE workspace_id=$1 AND pack_id=$2 AND id=$3",
        [p.workspace_id, id, rid],
      )
    ).rows[0];
    if (!r) throw unavailable();
    if (
      !(await hasPermission(
        database(),
        p,
        "pack.prepare",
        a.company_id,
        a.site_id,
      )) &&
      !(await hasPermission(
        database(),
        p,
        "pack.check",
        a.company_id,
        a.site_id,
      )) &&
      !(await hasPermission(
        database(),
        p,
        "pack.issue",
        a.company_id,
        a.site_id,
      ))
    )
      throw unavailable();
    return new NextResponse(packHtml(r.snapshot as PackSnapshot), {
      headers: { ...fileHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function queueIssue(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    const result = await requestIssue(p, id!, await jsonBody(request, 65536));
    return reply(result.receipt, 202);
  } catch (e) {
    return failure(e);
  }
}
export async function recoverJob(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    object(await jsonBody(request, 4096), []);
    return reply(await retryRenderJob(p, id!));
  } catch (e) {
    return failure(e);
  }
}
export async function issueDetails(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params;
    const { pack, a, issue } = await issueContext(
      database(),
      p,
      uuid(id, "issue_id"),
    );
    return reply({
      pack_id: pack.id,
      issue_id: issue.id,
      issued_at: issue.issued_at,
      status: pack.status,
      applicable:
        pack.current_issue_id === issue.id &&
        !pack.needs_review &&
        pack.status === "Issued" &&
        ["Confirmed", "InProgress"].includes(a.status) &&
        issue.assignment_version === a.assignment_version &&
        issue.schedule_version === a.schedule_version,
      as_at: new Date().toISOString(),
    });
  } catch (e) {
    return failure(e);
  }
}
export function generatedFile(kind: "pdf" | "html") {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request);
      object(Object.fromEntries(request.nextUrl.searchParams), []);
      const p = await identity(request),
        { id } = await context.params;
      const job = await readRenderJob(p, uuid(id, "job_id"));
      if (!job.output_manifest) throw unavailable();
      const bytes = await readBundle(p, job.output_manifest);
      return new NextResponse(
        kind === "pdf" ? new Uint8Array(bytes.pdf) : bytes.html,
        {
          headers: {
            ...fileHeaders,
            "Content-Type":
              kind === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
            ...(kind === "pdf"
              ? {
                  "Content-Disposition": `attachment; filename="${job.output_manifest.filename}"`,
                }
              : {}),
          },
        },
      );
    } catch (e) {
      return failure(e);
    }
  };
}
