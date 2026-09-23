import { timingSafeEqual } from "node:crypto";
import { localConfig } from "../platform/config";
import { demoConfig } from "../platform/demo-config";
import { database } from "../platform/database";
import { readHostedMembership } from "../platform/demo-roles";
import { readCookie } from "../platform/demo-request";
import type { QueryClient } from "../platform/permissions";

const objectId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A deployment policy for this private design tool, not a business-role grant.
// Membership rechecks session, actor, tenant, invitation and role expiry on every read.
export async function hostedDevelopmentAccess(client: QueryClient, token: string | undefined, tenant: string, owner: string | undefined): Promise<boolean> {
  if (!owner || !objectId.test(owner)) return false;
  try {
    const member = await readHostedMembership(client, token, tenant);
    return member.tenant_id.toLowerCase() === tenant.toLowerCase() && member.object_id.toLowerCase() === owner.toLowerCase();
  } catch { return false; }
}

export function developmentAvailable(
  env: Record<string, string | undefined> = process.env,
): boolean {
  try {
    if (env.PPO_ENV === "azure-demo") {
      demoConfig(env);
      return env.PPO_DEVELOPMENT_WORKSPACE === "on" && objectId.test(env.PPO_DEVELOPMENT_OWNER_OBJECT_ID ?? "");
    }
    localConfig(env);
    return env.PPO_DEVELOPMENT_WORKSPACE !== "off";
  } catch {
    return false;
  }
}
export async function developmentRequest(
  requestHeaders: Pick<Headers, "get">,
  env: Record<string, string | undefined> = process.env,
  client?: QueryClient,
): Promise<boolean> {
  if (!developmentAvailable(env)) return false;
  const expected = env.PPO_LOCAL_GATEWAY,
    actual = requestHeaders.get("x-ppo-local-gateway");
  if (
    !expected ||
    !actual ||
    Buffer.byteLength(expected) !== Buffer.byteLength(actual)
  )
    return false;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) return false;
  if (env.PPO_ENV !== "azure-demo") return true;
  return hostedDevelopmentAccess(client ?? database(), readCookie(requestHeaders.get("cookie") ?? undefined, "__Host-ppo_demo_session"), env.PPO_ENTRA_TENANT_ID!, env.PPO_DEVELOPMENT_OWNER_OBJECT_ID);
}

// Only the independently authorised synthetic renderer can be embedded by this origin.
export function developmentFramePolicy(pathname: string, env: Record<string, string | undefined> = process.env): "SAMEORIGIN" | "DENY" {
  return pathname === "/development/component-preview" && developmentAvailable(env) ? "SAMEORIGIN" : "DENY";
}
