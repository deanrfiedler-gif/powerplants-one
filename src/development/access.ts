import { timingSafeEqual } from "node:crypto";
import { localConfig } from "../platform/config";

export function developmentAvailable(
  env: Record<string, string | undefined> = process.env,
): boolean {
  try {
    localConfig(env);
    return env.PPO_DEVELOPMENT_WORKSPACE !== "off";
  } catch {
    return false;
  }
}
export function developmentRequest(
  requestHeaders: Pick<Headers, "get">,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!developmentAvailable(env)) return false;
  const expected = env.PPO_LOCAL_GATEWAY,
    actual = requestHeaders.get("x-ppo-local-gateway");
  if (
    !expected ||
    !actual ||
    Buffer.byteLength(expected) !== Buffer.byteLength(actual)
  )
    return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

// Only the synthetic catalogue renderer can be embedded by the same local origin.
export function developmentFramePolicy(pathname: string, env: Record<string, string | undefined> = process.env): "SAMEORIGIN" | "DENY" {
  return pathname === "/development/component-preview" && developmentAvailable(env) ? "SAMEORIGIN" : "DENY";
}
