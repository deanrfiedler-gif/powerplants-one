import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../../platform/http";
import type { Principal } from "../../platform/identity";
import type { RouteContext } from "../http";
export function previewRoute(
  work: (p: Principal, id: string, body: unknown) => Promise<unknown>,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request, true);
      const p = await identity(request),
        { id } = await context.params;
      return reply(await work(p, id ?? "", await jsonBody(request, 65536)));
    } catch (e) {
      return failure(e);
    }
  };
}
