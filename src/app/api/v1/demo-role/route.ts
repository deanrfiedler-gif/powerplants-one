import type { NextRequest } from "next/server";
import { database, transaction } from "../../../../platform/database";
import { demoConfig, isHostedDemo } from "../../../../platform/demo-config";
import { readHostedRoles, hostedRoleKeys, switchHostedRole } from "../../../../platform/demo-roles";
import { sessionCookie } from "../../../../platform/identity";
import { AppError } from "../../../../platform/errors";
import { failure, jsonBody, localRequest, reply } from "../../../../platform/http";
import { choice, object } from "../../../../shared/validation";

function hosted() {
  if (!isHostedDemo())
    throw new AppError(403, "HostedOnly", "Hosted demonstration roles are unavailable locally.");
  return demoConfig();
}

export async function GET(request: NextRequest) {
  try {
    localRequest(request);
    const config = hosted();
    return reply(await readHostedRoles(database(), request.cookies.get(sessionCookie)?.value, config.tenant_id));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    localRequest(request, true);
    const config = hosted(), body = object(await jsonBody(request), ["role"]);
    const role = choice(body.role, "role", hostedRoleKeys);
    return reply(await transaction((client) => switchHostedRole(
      client,
      request.cookies.get(sessionCookie)?.value,
      config.tenant_id,
      role,
    )));
  } catch (error) {
    return failure(error);
  }
}
