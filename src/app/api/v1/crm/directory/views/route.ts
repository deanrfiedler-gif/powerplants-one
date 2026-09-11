import type { NextRequest } from "next/server";
import { readRoute } from "../../../../../../shared/http";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../../../../../../platform/http";
import {
  readDirectoryViews,
  saveDirectoryViews,
} from "../../../../../../crm/directory";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readDirectoryViews(p, q.kind));
export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    const p = await identity(request);
    return reply(await saveDirectoryViews(p, await jsonBody(request, 32768)));
  } catch (e) {
    return failure(e);
  }
}
