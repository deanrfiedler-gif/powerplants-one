import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { localConfig } from "./config";
import { AppError } from "./errors";
import { resolveIdentity, sessionCookie } from "./identity";
import { proofDatabaseState } from "./database";
import { proofDependencyFailure } from "./proof-diagnostics";
export function localRequest(request: NextRequest, mutation = false) {
  const config = localConfig(),
    expected = process.env.PPO_LOCAL_GATEWAY,
    actual = request.headers.get("x-ppo-local-gateway");
  if (
    !expected ||
    !actual ||
    expected.length !== actual.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  )
    throw new AppError(
      403,
      "LocalOnly",
      "Use the loopback-only local application launcher.",
    );
  if (mutation && request.headers.get("origin") !== config.origin)
    throw new AppError(
      403,
      "OriginRejected",
      "This action must come from the local application.",
    );
  if (
    mutation &&
    request.headers.get("content-type")?.split(";")[0] !== "application/json"
  )
    throw new AppError(422, "InvalidContentType", "JSON content is required.");
}
export const identity = (request: NextRequest) =>
  resolveIdentity(request.cookies.get(sessionCookie)?.value);
export async function jsonBody(request: NextRequest, maxBytes = 16384): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(422, "InvalidJson", "A JSON object is required.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new AppError(
        422,
        "PayloadTooLarge",
        "The request exceeds the local proof limit.",
      );
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(422, "InvalidJson", "Enter valid JSON.");
  }
}
export function reply(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function failure(error: unknown) {
  const correlation_id = randomUUID();
  const e =
    error instanceof AppError
      ? error
      : new AppError(
          503,
          "DependencyUnavailable",
          "The local database is unavailable. Check setup and try again.",
        );
  // No connection strings, payloads, SQL or stack traces in client errors/log evidence.
  if (!(error instanceof AppError)) {
    proofDependencyFailure(error, proofDatabaseState());
    console.error(JSON.stringify({ correlation_id, code: e.code }));
  }
  return reply(
    {
      code: e.code,
      message: e.message,
      field_errors: e.field_errors,
      correlation_id,
      retryable: e.status === 503,
    },
    e.status,
  );
}
