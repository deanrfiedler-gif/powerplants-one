import type { NextRequest } from "next/server";
import { identity, localRequest, jsonBody, reply, failure } from "../../../../../platform/http";
import { syncBatch } from "../../../../../offline/server";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest) {
  try { localRequest(request,true);return reply(await syncBatch(await identity(request),await jsonBody(request,6291456))); }
  catch(e){return failure(e);}
}
