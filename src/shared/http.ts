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
export type RouteContext = { params: Promise<{ id?: string }> };
export function readRoute(
  work: (
    p: Principal,
    id: string,
    query: Record<string, string>,
  ) => Promise<unknown>,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request);
      const p = await identity(request),
        params = (await context.params) ?? {};
      return reply(
        await work(
          p,
          params.id ?? "",
          Object.fromEntries(request.nextUrl.searchParams),
        ),
      );
    } catch (error) {
      return failure(error);
    }
  };
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
      const result = await work(p, params.id ?? "", await jsonBody(request));
      return reply(result.receipt, create && !result.replayed ? 201 : 200);
    } catch (error) {
      return failure(error);
    }
  };
}
