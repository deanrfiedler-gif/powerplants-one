import type { NextRequest } from "next/server";
import {
  localRequest,
  identity,
  failure,
} from "../../../../../../../../platform/http";
import { object } from "../../../../../../../../shared/validation";
import { readOutput } from "../../../../../../../../estimating/fertigation/artifacts";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; outputId: string }> },
) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      params = (await context.params) ?? {},
      result = await readOutput(p, params.id ?? "", params.outputId ?? "");
    return new Response(Buffer.from(result.bytes), {
      headers: {
        "Content-Type": result.mime,
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
