import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  reply,
  failure,
} from "../../../../../../platform/http";
import { ownRecovery } from "../../../../../../offline/recovery";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id } = await context.params;
    const result = await ownRecovery(p, id);
    return reply(result);
  } catch (e) {
    return failure(e);
  }
}
