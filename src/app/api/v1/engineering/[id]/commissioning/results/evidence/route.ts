import type { NextRequest } from "next/server";
import { inspectionCommand } from "../../../../../../../../engineering/commissioning/commands";
import { failure, identity, jsonBody, localRequest, reply } from "../../../../../../../../platform/http";
export const dynamic = "force-dynamic";
// The evidence command with room for the file itself (4 MiB of bytes as base64). It is the same command, the same
// duty, the same operation identity and the same receipt as every other inspection command.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    localRequest(request, true);
    const p = await identity(request), { id } = await context.params, result = await inspectionCommand(p, id, await jsonBody(request, 5_700_000));
    return reply(result.receipt, result.replayed ? 200 : 201);
  } catch (error) {
    return failure(error);
  }
}
