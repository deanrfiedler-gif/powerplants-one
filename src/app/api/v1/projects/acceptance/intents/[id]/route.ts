import type { NextRequest } from "next/server";
import { readRoute, type RouteContext } from "../../../../../../../shared/http";
import {
  localRequest,
  identity,
  jsonBody,
  reply,
  failure,
} from "../../../../../../../platform/http";
import {
  recoverIntent,
  acknowledgeIntent,
} from "../../../../../../../projects/acceptance/intents";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => recoverIntent(p, id));
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    return reply(await acknowledgeIntent(p, id!, await jsonBody(request)));
  } catch (e) {
    return failure(e);
  }
}
