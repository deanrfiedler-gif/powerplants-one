import {
  localRequest,
  identity,
  failure,
} from "../../../../../../platform/http";
import { evidenceBytes } from "../../../../../../supply/evidence";
import type { NextRequest } from "next/server";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    const bytes = await evidenceBytes(
      await identity(request),
      (await context.params).id,
    );
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline; filename=synthetic-evidence.png",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
