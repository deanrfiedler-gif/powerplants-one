import type { NextRequest } from "next/server";
import {
  localRequest,
  identity,
  failure,
  reply,
} from "../../../../../../../platform/http";
import { runtimeConfig } from "../../../../../../../platform/config";
import { AppError } from "../../../../../../../platform/errors";
import { object } from "../../../../../../../shared/validation";
import type { RouteContext } from "../../../../../../../shared/http";
import {
  attachEvidence,
  listEvidence,
  evidenceLimit,
} from "../../../../../../../estimating/fertigation/evidence";
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = (await context.params) ?? {};
    return reply(await listEvidence(p, id ?? ""));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    if (request.headers.get("origin") !== runtimeConfig().origin)
      throw new AppError(
        403,
        "OriginRejected",
        "Use this application to attach evidence.",
      );
    if (request.headers.get("content-type") !== "image/png")
      throw new AppError(
        422,
        "UnsupportedEvidence",
        "Only the validated PNG evidence format is supported.",
      );
    const p = await identity(request),
      { id } = (await context.params) ?? {},
      header = request.headers.get("x-ppo-evidence");
    if (!header || Buffer.byteLength(header) > 8192)
      throw new AppError(
        422,
        "InvalidEvidenceMetadata",
        "Provide bounded evidence metadata.",
      );
    let metadata: unknown;
    try {
      metadata = JSON.parse(decodeURIComponent(header));
    } catch {
      throw new AppError(
        422,
        "InvalidEvidenceMetadata",
        "Provide valid evidence metadata.",
      );
    }
    const reader = request.body?.getReader();
    if (!reader)
      throw new AppError(422, "EmptyEvidence", "Choose a valid PNG.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.length;
      if (size > evidenceLimit) {
        await reader.cancel();
        throw new AppError(
          422,
          "EvidenceTooLarge",
          "PNG evidence is limited to 4 MiB.",
        );
      }
      chunks.push(item.value);
    }
    const result = await attachEvidence(
      p,
      id ?? "",
      metadata,
      Buffer.concat(chunks),
    );
    return reply(result.receipt, result.replayed ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
