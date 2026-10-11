import type { NextRequest } from "next/server";
import {
  failure,
  identity,
  jsonBody,
  localRequest,
  reply,
} from "../../../../platform/http";
import { createSession, sessionCookie } from "../../../../platform/identity";
import { object, label } from "../../../../platform/validation";
import { proofReadPhase, proofReadRequest } from "../../../../platform/proof-diagnostics";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return proofReadRequest("/api/v1/local-session", async () => {
    try {
      proofReadPhase("route-entered");
      localRequest(request);
      const principal = await identity(request);
      proofReadPhase("reply-start");
      const response = reply(principal);
      proofReadPhase("route-complete");
      return response;
    } catch (error) {
      proofReadPhase("route-failed");
      return failure(error);
    }
  });
}
export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    const p = object(await jsonBody(request), ["profile"]);
    const { token, principal } = await createSession(
      label(p.profile, "profile", 50),
      request.cookies.get(sessionCookie)?.value,
    );
    const response = reply(principal);
    response.cookies.set(sessionCookie, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
