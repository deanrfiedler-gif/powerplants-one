import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../../platform/http";
import {
  previewExcelSourcePricing,
  applyExcelSourcePricing,
  readExcelSourcePricing,
  excelPricingRequestLimit,
} from "./pricing";
type Context = { params: Promise<{ id: string; versionId?: string }> };
export async function excelPricingRoute(
  request: NextRequest,
  context: Context,
  save: boolean,
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    const body = await jsonBody(request, excelPricingRequestLimit);
    return reply(
      await (save ? applyExcelSourcePricing : previewExcelSourcePricing)(
        p,
        id,
        body,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function excelPricingEvidenceRoute(
  request: NextRequest,
  context: Context,
) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id, versionId } = await context.params;
    return reply(await readExcelSourcePricing(p, id, versionId ?? ""));
  } catch (error) {
    return failure(error);
  }
}
