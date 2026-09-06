import { object } from "../../../../../../shared/validation";
import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  reply,
  failure,
} from "../../../../../../platform/http";
import { reviewRecovery } from "../../../../../../offline/recovery";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    object(Object.fromEntries(request.nextUrl.searchParams), []);
    const p = await identity(request),
      { id } = await context.params;
    const result = await reviewRecovery(p, id);
    return reply(result);
  } catch (e) {
    return failure(e);
  }
}
