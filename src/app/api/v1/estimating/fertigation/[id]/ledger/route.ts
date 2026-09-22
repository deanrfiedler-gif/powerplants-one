import type { NextRequest } from "next/server";
import {
  localRequest,
  identity,
  failure,
  reply,
} from "../../../../../../../platform/http";
import { object } from "../../../../../../../shared/validation";
import type { RouteContext } from "../../../../../../../shared/http";
import { readReviewLedger } from "../../../../../../../estimating/fertigation/review";
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = (await context.params) ?? {};
    return reply(await readReviewLedger(p, id ?? ""));
  } catch (e) {
    return failure(e);
  }
}
