import { type NextRequest, NextResponse } from "next/server";
import { file } from "../../../../../../../projects/acceptance/reads";
import {
  identity,
  localRequest,
  failure,
} from "../../../../../../../platform/http";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    const value = await file(
      await identity(request),
      (await context.params).id,
      request.nextUrl.searchParams.get("format") ?? "pdf",
    );
    return new NextResponse(new Uint8Array(value.bytes), {
      headers: {
        "Content-Type": value.type,
        "Content-Disposition": `inline; filename="${value.filename}"`,
        "Cache-Control": "private, no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
