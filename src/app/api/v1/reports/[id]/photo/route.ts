import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  failure,
  identity,
  localRequest,
} from "../../../../../../platform/http";
import type { RouteContext } from "../../../../../../shared/http";
import { reportPhotoBytes } from "../../../../../../reports/photos";

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id } = await context.params;
    const { bytes, filename } = await reportPhotoBytes(
      p,
      id ?? "",
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="${filename}"`,
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
