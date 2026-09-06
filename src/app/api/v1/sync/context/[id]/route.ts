import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  reply,
  failure,
  jsonBody,
} from "../../../../../../platform/http";
import { downloadContext } from "../../../../../../offline/recovery";
export const dynamic = "force-dynamic";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    const result = await downloadContext(p, id, await jsonBody(request));
    return reply(result);
  } catch (e) {
    return failure(e);
  }
}
