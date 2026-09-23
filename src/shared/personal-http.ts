import type { NextRequest } from "next/server";
import type { Principal } from "../platform/identity";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../platform/http";
// Personal presentation state uses optimistic versions, not business operation receipts.
export function personalRoute(
  save: (p: Principal, body: unknown) => Promise<unknown>,
) {
  return async (request: NextRequest) => {
    try {
      localRequest(request, true);
      return reply(
        await save(await identity(request), await jsonBody(request, 32768)),
      );
    } catch (e) {
      return failure(e);
    }
  };
}
