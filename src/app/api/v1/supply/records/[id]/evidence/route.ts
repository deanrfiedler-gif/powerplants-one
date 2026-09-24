import {
  localRequest,
  identity,
  jsonBody,
  reply,
  failure,
} from "../../../../../../../platform/http";
import { uploadEvidence } from "../../../../../../../supply/evidence";
import type { NextRequest } from "next/server";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id } = await context.params;
    const result = await uploadEvidence(
      p,
      id,
      await jsonBody(request, 2800000),
    );
    return reply(result.receipt, result.replayed ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
