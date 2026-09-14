import type { NextRequest } from "next/server";
import type { Principal } from "../platform/identity";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../platform/http";
import type { RouteContext } from "../shared/http";

// A comparison is read-only, but still has a bounded JSON body and the same
// current identity/origin boundary as commands. It issues no business receipt.
export function discoveryPreviewRoute(
  work: (p: Principal, id: string, value: unknown) => Promise<unknown>,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request, true);
      const p = await identity(request),
        params = (await context.params) ?? {};
      return reply(
        await work(p, params.id ?? "", await jsonBody(request, 65536)),
      );
    } catch (error) {
      return failure(error);
    }
  };
}
