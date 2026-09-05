import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { localRequest,identity,jsonBody,reply,failure } from '../platform/http';
import type { RouteContext } from '../shared/http';
import { uploadAttachment,attachmentBytes } from './attachments';
import { object } from '../shared/validation';
export async function uploadRoute(request:NextRequest,context:RouteContext){try{localRequest(request,true);const p=await identity(request),{id}=await context.params;const result=await uploadAttachment(p,id??'',await jsonBody(request,5_600_000));return reply(result.receipt,result.replayed?200:201);}catch(e){return failure(e);}}
export async function photoRoute(request:NextRequest,context:RouteContext){try{localRequest(request);object(Object.fromEntries(request.nextUrl.searchParams),[]);const p=await identity(request),{id}=await context.params,{bytes,filename}=await attachmentBytes(p,id??'');return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'image/png','Content-Length':String(bytes.length),'Content-Disposition':`inline; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}catch(e){return failure(e);}}
