import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../../platform/http";
import type { RouteContext } from "../../shared/http";
import { previewExcelWorkbook, uploadRequestLimit } from "./service";

export async function excelPreviewRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      params = await context.params;
    return reply(
      await previewExcelWorkbook(
        p,
        params?.id ?? "",
        await jsonBody(request, uploadRequestLimit),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
