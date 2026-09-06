import {readFile} from "node:fs/promises";
import {NextResponse,type NextRequest} from "next/server";
import {localRequest,failure} from "../../platform/http";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){try{localRequest(request);return new NextResponse(await readFile("public/offline/index.html","utf8"),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store"}});}catch(e){return failure(e);}}
