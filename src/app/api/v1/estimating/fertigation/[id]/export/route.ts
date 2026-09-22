import type { NextRequest } from "next/server";
import {
  localRequest,
  identity,
  failure,
} from "../../../../../../../platform/http";
import { object, choice, uuid } from "../../../../../../../shared/validation";
import type { RouteContext } from "../../../../../../../shared/http";
import { exportScope } from "../../../../../../../estimating/fertigation/artifacts";
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    const q = object(Object.fromEntries(request.nextUrl.searchParams), [
      "revision_id",
      "format",
    ]);
    const p = await identity(request),
      { id } = (await context.params) ?? {},
      result = await exportScope(
        p,
        id ?? "",
        uuid(q.revision_id, "revision_id"),
        choice(q.format, "format", ["json", "valves"] as const),
      );
    return new Response(result.body, {
      headers: {
        "Content-Type": result.mime,
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
