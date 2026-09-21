import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../../../../../../../../platform/http";
import { endAssetServedFacility } from "../../../../../../../../shared/facilities/commands";
export const dynamic = "force-dynamic";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    localRequest(request, true);
    const p = await identity(request),
      { id, linkId } = await context.params;
    const result = await endAssetServedFacility(
      p,
      id,
      linkId,
      await jsonBody(request, 65536),
    );
    return reply(result.receipt);
  } catch (e) {
    return failure(e);
  }
}
