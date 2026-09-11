import type { IncomingMessage, ServerResponse } from "node:http";
import { demoRequestAllowed, readCookie, secureCookie } from "./demo-request";
import { AppError } from "./errors";
import { loginFailure, loginState, sendLoginPage } from "../login/login-page";

type Gateway = {
  origin: string;
  gatewayKey: string;
  sessionCookie: string;
  loginCookie: string;
  beginLogin: () => Promise<{ token: string; url: string }>;
  finishLogin: (url: URL, loginToken: string | undefined, previousToken?: string) => Promise<string>;
  endSession: (token: string | undefined) => Promise<void>;
  resolveIdentity: (token: string | undefined) => Promise<unknown>;
  handleApplication: (req: IncomingMessage, res: ServerResponse) => Promise<unknown>;
};

/** Same hosted boundary as the demo server; dependencies let tests exercise real HTTP decisions without a tenant. */
export function demoGateway(config: Gateway) {
  let loginWindow = Date.now(), logins = 0;
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    const url = new URL(req.url ?? "/", config.origin), method = req.method ?? "GET";
    if (url.pathname === "/healthz" && method === "GET") { res.end("ok"); return; }
    if (url.origin !== config.origin || !demoRequestAllowed(req.headers, method, url.pathname, config.origin)) {
      res.writeHead(403); res.end("Request rejected."); return;
    }
    const token = readCookie(req.headers.cookie, config.sessionCookie);
    if (url.pathname === "/login" && method === "GET") {
      sendLoginPage(res, loginState(url.searchParams)); return;
    }
    if (url.pathname === "/auth/login" && method === "GET") {
      if (Date.now() - loginWindow > 600_000) { loginWindow = Date.now(); logins = 0; }
      if (++logins > 30) { sendLoginPage(res, "unavailable", 429); return; }
      try {
        const login = await config.beginLogin();
        res.writeHead(302, { Location: login.url, "Set-Cookie": secureCookie(config.loginCookie, login.token, 600, true) }); res.end();
      } catch {
        res.setHeader("Set-Cookie", secureCookie(config.loginCookie, "", 0, true));
        sendLoginPage(res, "unavailable", 503);
      }
      return;
    }
    if (url.pathname === "/auth/callback" && method === "GET") {
      res.setHeader("Set-Cookie", secureCookie(config.loginCookie, "", 0, true));
      try {
        const session = await config.finishLogin(url, readCookie(req.headers.cookie, config.loginCookie), token);
        res.writeHead(303, { Location: `${config.origin}/crm/opportunities`, "Set-Cookie": [secureCookie(config.loginCookie, "", 0, true), secureCookie(config.sessionCookie, session, 3600, true)] });
      } catch (error) {
        // Never reflect OAuth descriptions/codes/tokens or accept a return URL from a caller.
        res.writeHead(303, { Location: `${config.origin}/login?status=${loginFailure(error)}` });
      }
      res.end(); return;
    }
    if (url.pathname === "/auth/logout" && method === "POST") {
      await config.endSession(token);
      res.writeHead(303, { Location: `${config.origin}/login`, "Set-Cookie": secureCookie(config.sessionCookie, "", 0, true) }); res.end(); return;
    }
    try { await config.resolveIdentity(token); }
    catch (error) {
      if (!(error instanceof AppError) || error.status !== 401) {
        if (!url.pathname.startsWith("/api/") && method === "GET") { sendLoginPage(res, "unavailable", 503); return; }
        throw error;
      }
      if (url.pathname.startsWith("/api/")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: "AuthenticationRequired", message: "Sign in to the private demo.", retryable: false }));
      } else {
        sendLoginPage(res, token ? "expired" : "ready", 401);
      }
      return;
    }
    if (url.pathname.startsWith("/offline") || url.pathname === "/sw.js" ||
        (url.pathname === "/api/v1/local-session" && method === "POST")) {
      res.writeHead(403); res.end("This feature is unavailable in the hosted demo."); return;
    }
    req.headers["x-ppo-local-gateway"] = config.gatewayKey;
    await config.handleApplication(req, res);
  };
}
