import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  reply,
  failure,
  jsonBody,
} from "../../../../../platform/http";
import { preserveRecovery } from "../../../../../offline/recovery";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    const p = await identity(request);
    const result = await preserveRecovery(p, await jsonBody(request, 6291456));
    return reply(result);
  } catch (e) {
    return failure(e);
  }
}
