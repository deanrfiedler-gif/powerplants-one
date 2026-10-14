import { excelQuotationRoute } from "../../../../../../../estimating/import/quotation-http";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => excelQuotationRoute(request, context, "Prepare");
