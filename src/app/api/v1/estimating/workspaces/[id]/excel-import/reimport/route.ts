import { excelRevisionRoute } from "../../../../../../../../estimating/import/persistence-http";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => excelRevisionRoute(request, context, true);
