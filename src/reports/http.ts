import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  failure,
  identity,
  localRequest,
  jsonBody,
  reply,
} from "../platform/http";
import { database } from "../platform/database";
import { object, uuid } from "../shared/validation";
import type { RouteContext } from "../shared/http";
import { unavailable } from "../platform/errors";
import { presentationBytes, recordResponse } from "./service";
import { reportContext, fail } from "./context";
import {
  requestReportIssue,
  retryReportJob,
  readReportJob,
  readReportBundle,
} from "./worker";
import { documentStore, digest } from "../documents/store";
import { inspectPng } from "../field/media";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "Referrer-Policy": "no-referrer",
};
export function reportFile(kind: "html" | "pdf" | "manifest") {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request);
      const p = await identity(request),
        { id } = await context.params,
        q = object(Object.fromEntries(request.nextUrl.searchParams), [
          "presentation_id",
        ]);
      const data = await presentationBytes(
        p,
        id!,
        uuid(q.presentation_id, "presentation_id"),
      );
      if (kind === "manifest") {
        const m = data.manifest;
        return reply({
          synthetic: true,
          presentation_id: q.presentation_id,
          revision_id: m.revision_id,
          ...("pdf_hash" in m
            ? {
                kind: "IssuedReport",
                content_hash: m.html_hash,
                pdf_hash: m.pdf_hash,
                html_hash: m.html_hash,
                filename: m.filename,
                pdf_bytes: m.pdf_bytes,
                html_bytes: m.html_bytes,
                prepared_at: m.prepared_at,
              }
            : { kind: m.kind, content_hash: m.content_hash }),
        });
      }
      if (kind === "pdf" && !data.pdf) throw unavailable();
      return new NextResponse(
        kind === "pdf" ? new Uint8Array(data.pdf!) : data.html,
        {
          headers: {
            ...headers,
            "Content-Type":
              kind === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
          },
        },
      );
    } catch (e) {
      return failure(e);
    }
  };
}
export async function queueReport(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request, true);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params,
      result = await requestReportIssue(p, id!, await jsonBody(request, 65536));
    return reply(result.receipt, 202);
  } catch (e) {
    return failure(e);
  }
}
export async function respondRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request, true);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params,
      result = await recordResponse(
        p,
        id!,
        await jsonBody(request, 6 * 1024 * 1024),
      );
    return reply(result.receipt, result.replayed ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
export async function retryRoute(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request, true);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    object(await jsonBody(request, 4096), []);
    const p = await identity(request),
      { id } = await context.params;
    const job = await retryReportJob(p, id!);
    return reply({
      id: job.id,
      report_id: job.report_id,
      state: job.state,
      attempts: job.attempts,
      error_code: job.error_code,
      issue_id: job.issue_id,
      output_available: Boolean(job.output_manifest),
      attempt_history: job.attempt_history,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function generatedReport(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request);
    const q = object(Object.fromEntries(request.nextUrl.searchParams), [
      "kind",
    ]);
    if (!["html", "pdf"].includes(String(q.kind))) throw unavailable();
    const p = await identity(request),
      { id } = await context.params,
      j = await readReportJob(p, id!);
    if (!j.output_manifest) throw unavailable();
    const b = await readReportBundle(p, j.output_manifest);
    return new NextResponse(q.kind === "pdf" ? new Uint8Array(b.pdf) : b.html, {
      headers: {
        ...headers,
        "Content-Type":
          q.kind === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function signatureRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params,
      r = (
        await database().query(
          "SELECT * FROM ppo.customer_responses WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, uuid(id, "response_id")],
        )
      ).rows[0];
    if (!r) throw unavailable();
    await reportContext(database(), p, r.report_id);
    if (!r.signature_key) throw unavailable();
    const b = JSON.parse(
      Buffer.from(
        await documentStore().read(
          { ...p, operation_id: r.operation_id },
          r.signature_key,
        ),
      ).toString("utf8"),
    );
    const bytes = Buffer.from(b.png_base64, "base64");
    if (
      b.presentation_id !== r.presentation_id ||
      b.presented_hash !== r.presented_hash ||
      digest(bytes) !== r.signature_hash ||
      bytes.length !== r.signature_bytes
    )
      fail(
        "SignatureBytesMismatch",
        "The original response mark is unavailable.",
      );
    inspectPng(bytes);
    return new NextResponse(new Uint8Array(bytes), {
      headers: { ...headers, "Content-Type": "image/png" },
    });
  } catch (e) {
    return failure(e);
  }
}
