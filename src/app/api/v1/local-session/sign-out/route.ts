import type {NextRequest} from "next/server";
import {endSession,sessionCookie} from "../../../../../platform/identity";
import {localRequest,reply,failure,jsonBody} from "../../../../../platform/http";
import {object} from "../../../../../shared/validation";
export async function POST(request:NextRequest){try{localRequest(request,true);object(await jsonBody(request),[]);await endSession(request.cookies.get(sessionCookie)?.value);const r=reply({signed_out:true});r.cookies.set(sessionCookie,"",{httpOnly:true,sameSite:"strict",path:"/",maxAge:0});return r;}catch(e){return failure(e);}}
