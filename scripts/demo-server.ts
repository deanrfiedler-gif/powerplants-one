import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { demoConfig } from "../src/platform/demo-config";
import { demoRequestAllowed, readCookie, secureCookie } from "../src/platform/demo-request";
import { beginDemoLogin, finishDemoLogin, loginCookie } from "../src/platform/demo-auth";
import { endSession, resolveIdentity, sessionCookie } from "../src/platform/identity";
import { closeDatabase } from "../src/platform/database";
import { AppError } from "../src/platform/errors";

const config = demoConfig();
process.env.PPO_LOCAL_GATEWAY = randomBytes(32).toString("hex");
const { default: next } = await import("next");
const app = next({ dev: false, hostname: "0.0.0.0", port: config.port });
await app.prepare();
const handler = app.getRequestHandler();
let loginWindow = Date.now(), logins = 0;
const server = createServer((req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  const run = async () => {
    const url = new URL(req.url ?? "/", config.origin), method = req.method ?? "GET";
    if (url.pathname === "/healthz" && method === "GET") { res.end("ok"); return; }
    if (url.origin !== config.origin || !demoRequestAllowed(req.headers, method, url.pathname, config.origin)) {
      res.writeHead(403); res.end("Request rejected."); return;
    }
    const token = readCookie(req.headers.cookie, sessionCookie);
    if (url.pathname === "/auth/login" && method === "GET") {
      if (Date.now() - loginWindow > 600_000) { loginWindow = Date.now(); logins = 0; }
      if (++logins > 30) { res.writeHead(429, { "Retry-After": "600" }); res.end("Please try signing in later."); return; }
      const login = await beginDemoLogin();
      res.writeHead(302, { Location: login.url, "Set-Cookie": secureCookie(loginCookie, login.token, 600, true) }); res.end(); return;
    }
    if (url.pathname === "/auth/callback" && method === "GET") {
      res.setHeader("Set-Cookie", secureCookie(loginCookie, "", 0, true));
      const session = await finishDemoLogin(url, readCookie(req.headers.cookie, loginCookie), token);
      res.writeHead(303, { Location: `${config.origin}/crm/opportunities`, "Set-Cookie": [secureCookie(loginCookie, "", 0, true), secureCookie(sessionCookie, session, 3600, true)] }); res.end(); return;
    }
    if (url.pathname === "/auth/logout" && method === "POST") {
      await endSession(token);
      res.writeHead(303, { Location: config.origin, "Set-Cookie": secureCookie(sessionCookie, "", 0, true) }); res.end(); return;
    }
    try { await resolveIdentity(token); }
    catch (e) {
      if (!(e instanceof AppError) || e.status !== 401) throw e;
      res.statusCode = 401;
      if (url.pathname.startsWith("/api/")) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ code: "AuthenticationRequired", message: "Sign in to the private demo.", retryable: false }));
      } else {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end('<!doctype html><html lang="en-AU"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Powerplants One — private demo</title><body style="font:18px Verdana,sans-serif;background:#f3f5f6;color:#183848;margin:8vh auto;max-width:540px;padding:24px"><h1>Powerplants One</h1><p>Private prototype · Fictional records</p><p>Sign in with your invited Microsoft account to explore the demo.</p><p><a href="/auth/login" style="display:inline-block;background:#183848;color:white;padding:14px 20px;border-radius:6px">Sign in with Microsoft</a></p></body></html>');
      }
      return;
    }
    if (url.pathname.startsWith("/offline") || url.pathname === "/sw.js" ||
        (url.pathname === "/api/v1/local-session" && method === "POST")) {
      res.writeHead(403); res.end("This feature is unavailable in the hosted demo."); return;
    }
    req.headers["x-ppo-local-gateway"] = process.env.PPO_LOCAL_GATEWAY;
    await handler(req, res);
  };
  void run().catch(error => {
    if (!res.headersSent) res.writeHead(error instanceof AppError ? error.status : 503, { "Content-Type": "text/plain" });
    res.end("Unable to complete this request. Return to the demo and try again, or contact its owner.");
    // OAuth URLs, tokens, SQL, connection strings and error objects never enter logs.
    console.error("PPO demo request could not complete.");
  });
});
server.requestTimeout = 15000;
server.listen(config.port, "0.0.0.0", () => console.log("Powerplants One private demo listening."));
for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => {
  server.close(() => { void app.close().then(closeDatabase).then(() => process.exit(0)); });
});
