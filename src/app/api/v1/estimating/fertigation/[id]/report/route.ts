import type { NextRequest } from "next/server";
import {
  localRequest,
  identity,
  failure,
} from "../../../../../../../platform/http";
import { database } from "../../../../../../../platform/database";
import { object, choice, uuid } from "../../../../../../../shared/validation";
import type { RouteContext } from "../../../../../../../shared/http";
import { exactOutput } from "../../../../../../../estimating/fertigation/artifacts";
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    const q = object(Object.fromEntries(request.nextUrl.searchParams), [
      "revision_id",
      "audience",
    ]);
    const p = await identity(request),
      { id } = (await context.params) ?? {},
      result = await exactOutput(
        database(),
        p,
        id ?? "",
        uuid(q.revision_id, "revision_id"),
        choice(q.audience, "audience", ["customer", "internal"] as const),
      );
    return new Response(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
