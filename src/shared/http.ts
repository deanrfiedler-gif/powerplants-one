import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../platform/http";
import type { Principal } from "../platform/identity";
import type { OperationReceipt } from "../platform/operations";
import { proofReadPhase, proofReadRequest } from "../platform/proof-diagnostics";
import { proofDatabaseState } from "../platform/database";
export type RouteContext = { params: Promise<{ id?: string }> };
export function readRoute(
  work: (
    p: Principal,
    id: string,
    query: Record<string, string>,
  ) => Promise<unknown>,
) {
  return async (request: NextRequest, context: RouteContext) => proofReadRequest(request.nextUrl.pathname, async () => {
    try {
      proofReadPhase("route-entered");
      localRequest(request);
      proofReadPhase("identity-start", proofDatabaseState());
      const p = await identity(request),
        params = (await context.params) ?? {};
      proofReadPhase("service-start");
      const value = await work(
          p,
          params.id ?? "",
          Object.fromEntries(request.nextUrl.searchParams),
        );
      proofReadPhase("reply-start");
      const response = reply(value);
      proofReadPhase("route-complete");
      return response;
    } catch (error) {
      proofReadPhase("route-failed");
      return failure(error);
    }
  });
}
export function commandRoute(
  work: (
    p: Principal,
    id: string,
    input: unknown,
  ) => Promise<{ receipt: OperationReceipt; replayed: boolean }>,
  create = true,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request, true);
      const p = await identity(request),
        params = (await context.params) ?? {};
      const result = await work(
        p,
        params.id ?? "",
        await jsonBody(request, 65536),
      );
      return reply(result.receipt, create && !result.replayed ? 201 : 200);
    } catch (error) {
      return failure(error);
    }
  };
}
