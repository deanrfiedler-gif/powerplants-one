import { NextResponse, type NextRequest } from "next/server";
import { failure, identity, localRequest, jsonBody, reply } from "../platform/http";
import type { RouteContext } from "../shared/http";
import { object, choice } from "../shared/validation";
import { draftBytes, retryQuote } from "./worker";
import { readQuote } from "./reads";
export async function renderRoute(request:NextRequest,context:RouteContext) {
  try {
    localRequest(request,true);object(Object.fromEntries(request.nextUrl.searchParams),[]);object(await jsonBody(request,4096),[]);
    const p=await identity(request),{id}=await context.params;
    await retryQuote(p,id!);
    return reply(await readQuote(p,id!));
  } catch(e) {return failure(e);}
}
export async function fileRoute(request:NextRequest,context:RouteContext) {
  try {
    localRequest(request);const q=object(Object.fromEntries(request.nextUrl.searchParams),["kind"]),kind=choice(q.kind,"kind",["html","pdf"] as const);
    const p=await identity(request),{id}=await context.params,b=await draftBytes(p,id!);
    return new NextResponse(kind==="pdf"?new Uint8Array(b.pdf):b.html,{headers:{
      "Content-Type":kind==="pdf"?"application/pdf":"text/html; charset=utf-8",
      "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
      "Content-Security-Policy":"default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
    }});
  } catch(e) {return failure(e);}
}
