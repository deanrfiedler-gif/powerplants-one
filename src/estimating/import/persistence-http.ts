import { NextResponse, type NextRequest } from "next/server";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../../platform/http";
type RouteContext = { params: Promise<{ id?: string; versionId?: string }> };
import { commitExcelWorkbook } from "./commit";
import { readExcelImport, readExcelSource } from "./retained";
import { uploadRequestLimit } from "./service";
export async function excelCommitRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      params = await context.params;
    return reply(
      await commitExcelWorkbook(
        p,
        params?.id ?? "",
        await jsonBody(request, uploadRequestLimit),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function excelImportRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request);
    const p = await identity(request),
      params = await context.params;
    return reply(
      await readExcelImport(p, params?.id ?? "", params?.versionId ?? ""),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function excelSourceRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request);
    const p = await identity(request),
      params = await context.params;
    const file = await readExcelSource(
      p,
      params?.id ?? "",
      params?.versionId ?? "",
    );
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="PPO-workbook.xlsx"; filename*=UTF-8''${encodeURIComponent(file.name.toWellFormed())}`,
        "Content-Length": String(file.bytes.length),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
