import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../../../../../../../platform/http";
import { saveDraft } from "../../../../../../../service/tickets";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    return reply(await saveDraft(p, id, await jsonBody(request)));
  } catch (error) {
    return failure(error);
  }
}
