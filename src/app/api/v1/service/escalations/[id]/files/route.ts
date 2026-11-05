import { NextRequest, NextResponse } from "next/server";
import {
  localRequest,
  identity,
  failure,
} from "../../../../../../../platform/http";
import { retainedFile } from "../../../../../../../service/escalations/reads";
import type { RouteContext } from "../../../../../../../shared/http";
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id } = await context.params;
    const file = await retainedFile(
      p,
      id ?? "",
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.media_type,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'",
        "X-PPO-SHA256": file.hash,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
