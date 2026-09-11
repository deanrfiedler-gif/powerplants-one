import type { NextRequest } from "next/server";
import type { Principal } from "../platform/identity";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../platform/http";
import { AppError } from "../platform/errors";
type Context = { params: Promise<{ id?: string }> };
export function financeRoute(
  work: (p: Principal, id: string, input: unknown) => Promise<unknown>,
  command = false,
  bytes = false,
) {
  return async (request: NextRequest, ctx: Context) => {
    try {
      localRequest(request, command);
      const p = await identity(request),
        params = (await ctx.params) ?? {},
        query = request.nextUrl.searchParams;
      if (command && query.size)
        throw new AppError(
          422,
          "UnknownField",
          "Finance commands do not accept query fields.",
        );
      if (new Set(query.keys()).size !== query.size)
        throw new AppError(
          422,
          "DuplicateField",
          "Repeated query fields are not accepted.",
        );
      const result = await work(
        p,
        params.id ?? "",
        command ? await jsonBody(request, 65536) : Object.fromEntries(query),
      );
      if (bytes) {
        const b = result as {
          bytes: Buffer;
          content_type: string;
          filename: string;
          sha256: string;
        };
        return new Response(new Uint8Array(b.bytes), {
          headers: {
            "Content-Type": b.content_type,
            "Cache-Control": "no-store, private",
            "Content-Disposition": `inline; filename="${b.filename}"`,
            "Content-Security-Policy":
              "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
            "X-Content-Type-Options": "nosniff",
            "X-Content-SHA256": b.sha256,
          },
        });
      }
      if (result && typeof result === "object" && "receipt" in result)
        return reply(
          result.receipt,
          "replayed" in result && !result.replayed ? 201 : 200,
        );
      return reply(result);
    } catch (error) {
      return failure(error);
    }
  };
}
