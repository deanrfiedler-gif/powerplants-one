import type { NextRequest } from "next/server";
import { exportCsv } from "../../../../../../../engineering/changes/reads";
import { failure, identity, localRequest } from "../../../../../../../platform/http";
export const dynamic = "force-dynamic";
// A file, not JSON: the same local-request, identity and scope checks as every other read, then bytes.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    localRequest(request);
    const p = await identity(request), { id } = await context.params,
      file = await exportCsv(p, id, Object.fromEntries(request.nextUrl.searchParams));
    return new Response(file.body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file.name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return failure(error);
  }
}
