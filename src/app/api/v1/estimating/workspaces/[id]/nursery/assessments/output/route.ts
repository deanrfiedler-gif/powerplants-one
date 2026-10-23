import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  localRequest,
} from "../../../../../../../../../platform/http";
import { readAssessmentOutput } from "../../../../../../../../../estimating/nursery-automation/assessment-service";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id } = await context.params;
    const output = await readAssessmentOutput(
      p,
      id,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return new Response(output.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + output.filename + '"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "sandbox; default-src 'none'; style-src 'unsafe-inline'",
        "X-Content-SHA256": output.hash,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
