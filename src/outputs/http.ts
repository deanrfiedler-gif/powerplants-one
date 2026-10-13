import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../platform/http";
import type { RouteContext } from "../shared/http";
import { object } from "../shared/validation";
import { runOutputAction } from "./actions";
export async function outputActionRoute(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    localRequest(request, true);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params;
    const result = await runOutputAction(
      p,
      id!,
      await jsonBody(request, 65536),
    );
    return result.type === "job"
      ? reply(result.job)
      : reply(
          result.receipt,
          result.replayed ? 200 : result.receipt.state === "Queued" ? 202 : 201,
        );
  } catch (e) {
    return failure(e);
  }
}
