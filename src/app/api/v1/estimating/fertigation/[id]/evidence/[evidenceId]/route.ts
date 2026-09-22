import type { NextRequest } from "next/server";
import {
  localRequest,
  identity,
  failure,
} from "../../../../../../../../platform/http";
import { object } from "../../../../../../../../shared/validation";
import { readEvidence } from "../../../../../../../../estimating/fertigation/evidence";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; evidenceId: string }> },
) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      params = await context.params,
      result = await readEvidence(p, params.id, params.evidenceId);
    return new Response(Buffer.from(result.bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
