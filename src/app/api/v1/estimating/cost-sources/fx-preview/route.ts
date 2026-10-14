import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../../../../../../platform/http";
import { previewFxSource } from "../../../../../../estimating/sources/fx-preview";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    return reply(
      await previewFxSource(
        await identity(request),
        await jsonBody(request, 65536),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
