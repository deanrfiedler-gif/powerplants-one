import type { NextRequest } from "next/server";
import { readWorkViews, saveWorkViews } from "../../../../../activities/work-views";
import { failure, identity, jsonBody, localRequest, reply } from "../../../../../platform/http";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p) => readWorkViews(p));
// Saved views are personal presentation criteria, not a business operation: like the Customers
// directory views they are versioned as one document and carry no operation receipt.
export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    const p = await identity(request);
    return reply(await saveWorkViews(p, await jsonBody(request, 32768)));
  } catch (e) {
    return failure(e);
  }
}
