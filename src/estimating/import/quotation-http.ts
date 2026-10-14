import { EXCEL_CAPACITY } from "./capacity";
import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../../platform/http";
import { object } from "../../shared/validation";
import {
  reviewExcelQuotation,
  prepareExcelQuotation,
  readExcelQuotationEvidence,
} from "./quotation";
type Context = { params: Promise<{ id: string }> };
export async function excelQuotationRoute(
  request: NextRequest,
  context: Context,
  action: "Review" | "Prepare" | "Evidence",
) {
  try {
    localRequest(request, action !== "Evidence");
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params;
    return reply(
      action === "Evidence"
        ? await readExcelQuotationEvidence(p, id)
        : await (
            action === "Review" ? reviewExcelQuotation : prepareExcelQuotation
          )(p, id, await jsonBody(request, EXCEL_CAPACITY.quoteRequestBytes)),
    );
  } catch (error) {
    return failure(error);
  }
}
