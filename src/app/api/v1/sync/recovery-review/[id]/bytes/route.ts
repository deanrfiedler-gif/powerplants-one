import { object } from "../../../../../../../shared/validation";
import { NextResponse, type NextRequest } from "next/server";
import {
  identity,
  localRequest,
  failure,
} from "../../../../../../../platform/http";
import { recoveryBytes } from "../../../../../../../offline/recovery";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const { id } = await context.params,
      bytes = await recoveryBytes(await identity(request), id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
