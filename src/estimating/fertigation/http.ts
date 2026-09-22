import type { NextRequest } from "next/server";
import type { Principal } from "../../platform/identity";
import type { OperationReceipt } from "../../platform/operations";
import { localRequest, identity, reply, failure } from "../../platform/http";
import { object } from "../../shared/validation";
import type { RouteContext } from "../../shared/http";
import { MAX_BYTES } from "./context";
import { readFertigationJson } from "./request-limit";
export function fertigationPost(
  work: (p: Principal, id: string, value: unknown) => Promise<unknown>,
  mutation = false,
  maxBytes = MAX_BYTES,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request, true);
      object(Object.fromEntries(request.nextUrl.searchParams), []);
      const p = await identity(request);
      const params = (await context.params) ?? {},
        result = await work(
          p,
          params.id ?? "",
          await readFertigationJson(request, maxBytes),
        );
      if (mutation) {
        const accepted = result as {
          receipt: OperationReceipt;
          replayed: boolean;
        };
        return reply(accepted.receipt, accepted.replayed ? 200 : 201);
      }
      return reply(result);
    } catch (error) {
      const response = failure(error),
        body = await response.text();
      response.headers.set("content-length", String(Buffer.byteLength(body)));
      return new Response(body, {
        status: response.status,
        headers: response.headers,
      });
    }
  };
}
