import type { NextRequest } from 'next/server';
import { AppError } from '../platform/errors';
import type { Principal } from '../platform/identity';
import { localRequest,identity,jsonBody,reply,failure } from '../platform/http';
import type { RouteContext } from '../shared/http';
export function assistantRoute(work:(p:Principal,id:string,input:unknown)=>Promise<unknown>,mutation=false) {
  return async (request:NextRequest,context:RouteContext) => {
    try {
      localRequest(request,mutation);const p=await identity(request),params=await context.params;
      const value=await work(p,params?.id??'',mutation?await jsonBody(request,32768):Object.fromEntries(request.nextUrl.searchParams));
      // Discard the result if this session was signed out/switched while work was in flight.
      const current=await identity(request);if(current.actor_id!==p.actor_id||current.workspace_id!==p.workspace_id)throw new AppError(401,'AuthenticationRequired','Choose the current identity again.');
      return reply(value);
    } catch(e) {return failure(e instanceof AppError?e:new AppError(503,'AssistantUnavailable','The assistant result could not be confirmed. Check saved proposals before retrying a creation.'));}
  };
}
