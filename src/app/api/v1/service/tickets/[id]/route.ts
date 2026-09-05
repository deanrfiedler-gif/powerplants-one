import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  localRequest,
  reply,
} from "../../../../../../platform/http";
import { readTicket } from "../../../../../../service/tickets";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    localRequest(request);
    const p = await identity(request),
      { id } = await context.params;
    return reply({
      items: [await readTicket(p, id)],
      next_cursor: null,
      observed_at: new Date().toISOString(),
      completeness: "Complete",
      source: "Synthetic",
    });
  } catch (error) {
    return failure(error);
  }
}
