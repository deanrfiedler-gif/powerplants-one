import { NextResponse, type NextRequest } from "next/server";
import { failure, identity, localRequest } from "../platform/http";
import type { RouteContext } from "../shared/http";
import { object } from "../shared/validation";
import { downloadDocument } from "./reads";
export async function contentRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request);
    const query = object(Object.fromEntries(request.nextUrl.searchParams), [
      "revision_id",
    ]);
    const p = await identity(request),
      { id } = await context.params;
    const result = await downloadDocument(
      p,
      id ?? "",
      query.revision_id as string,
    );
    return new NextResponse(new Uint8Array(result.bytes), {
      headers: {
        "Content-Type": result.content_type,
        "Content-Disposition": 'attachment; filename="' + result.filename + '"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
