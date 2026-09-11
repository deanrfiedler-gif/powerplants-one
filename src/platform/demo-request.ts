import type { IncomingHttpHeaders } from "node:http";

export function demoRequestAllowed(headers: IncomingHttpHeaders, method: string, path: string, origin: string) {
  const expected = new URL(origin);
  // Forwarded headers never identify a user or construct a redirect.
  if (headers.host !== expected.host || headers["x-ppo-local-gateway"] || headers["x-forwarded-proto"] !== "https") return false;
  if (!["GET", "HEAD", "POST"].includes(method)) return false;
  if (path === "/auth/callback" && method === "GET") return true;
  if (headers.origin && headers.origin !== origin) return false;
  const navigation = method === "GET" && headers["sec-fetch-mode"] === "navigate" && headers["sec-fetch-dest"] === "document";
  if (!navigation && headers["sec-fetch-site"] && !["same-origin", "none"].includes(String(headers["sec-fetch-site"]))) return false;
  return method !== "POST" || headers.origin === origin;
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  const values = (header ?? "").split(";").map(s => s.trim()).filter(s => s.startsWith(`${name}=`));
  return values.length === 1 ? values[0]!.slice(name.length + 1) : undefined;
}

export const secureCookie = (name: string, value: string, seconds: number, lax = false) =>
  `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=${lax ? "Lax" : "Strict"}; Max-Age=${seconds}`;
