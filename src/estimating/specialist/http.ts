import { proofEvent } from "../../platform/proof-diagnostics";
import type { NextRequest } from "next/server";
import type { Principal } from "../../platform/identity";
import type { OperationReceipt } from "../../platform/operations";
import {
  localRequest,
  identity,
  jsonBody,
  reply,
  failure,
} from "../../platform/http";
import { object } from "../../shared/validation";
import type { RouteContext } from "../../shared/http";
import { MAX_BYTES } from "./validation";
export function specialistPost(
  work: (p: Principal, id: string, value: unknown) => Promise<unknown>,
  mutation = false,
) {
  return async (request: NextRequest, context: RouteContext) => {
    const started = performance.now();
    try {
      localRequest(request, true);
      object(Object.fromEntries(request.nextUrl.searchParams), []);
      const p = await identity(request),
        params = (await context.params) ?? {},
        result = await work(
          p,
          params.id ?? "",
          await jsonBody(request, MAX_BYTES),
        );
      if (mutation) {
        const command = result as {
          receipt: OperationReceipt;
          replayed: boolean;
        };
        const response = reply(command.receipt, command.replayed ? 200 : 201);
        response.headers.set(
          "Server-Timing",
          `specialist;dur=${(performance.now() - started).toFixed(1)}`,
        );
        return response;
      }
      const response = reply(result);
      response.headers.set(
        "Server-Timing",
        `specialist;dur=${(performance.now() - started).toFixed(1)}`,
      );
      return response;
    } catch (error) {
      return failure(error);
    } finally {
      proofEvent("specialist-http", {
        phase: mutation ? "command" : "preview",
        duration_ms: performance.now() - started,
      });
    }
  };
}
