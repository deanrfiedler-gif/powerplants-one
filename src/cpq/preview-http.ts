import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../platform/http";
import type { Principal } from "../platform/identity";
import type { RouteContext } from "../shared/http";
// POST is used for bounded private input, but this handler never writes a receipt.
export function previewRoute(
  work: (p: Principal, id: string, value: unknown) => Promise<unknown>,
  maxBodyBytes = 65536,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request, true);
      const p = await identity(request),
        params = await context.params;
      return reply(
        await work(p, params?.id ?? "", await jsonBody(request, maxBodyBytes)),
      );
    } catch (e) {
      return failure(e);
    }
  };
}
