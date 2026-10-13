import type { NextRequest } from "next/server";
import {
  recordActuals,
  readActuals,
} from "../../../../../../../../projects/programme";
import { commandRoute, readRoute } from "../../../../../../../../shared/http";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; taskId: string }> };
export async function GET(request: NextRequest, context: Context) {
  const { taskId } = await context.params;
  return readRoute((p, id, q) => readActuals(p, id, taskId, q))(
    request,
    context,
  );
}
export async function POST(request: NextRequest, context: Context) {
  const { taskId } = await context.params;
  return commandRoute((p, id, input) => recordActuals(p, id, taskId, input))(
    request,
    context,
  );
}
