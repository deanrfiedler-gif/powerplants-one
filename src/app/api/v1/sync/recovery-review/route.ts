import type { NextRequest } from "next/server";
import { identity, localRequest, reply, failure } from "../../../../../platform/http";
import { listRecovery } from "../../../../../offline/recovery";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest) {
  try { localRequest(request);const p=await identity(request);const result=await listRecovery(p);return reply(result); } catch(e){return failure(e);}
}
