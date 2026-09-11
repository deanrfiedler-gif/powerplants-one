import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { ServerResponse } from "node:http";
import { AppError } from "../platform/errors";

export type LoginState = "ready" | "cancelled" | "denied" | "expired" | "unavailable";
const states = {
  ready: { title: "", message: "", action: "Sign in with Microsoft", tone: "info" },
  cancelled: { title: "Sign-in was cancelled", message: "You haven’t been signed in. You can try again when you’re ready.", action: "Sign in with Microsoft", tone: "info" },
  denied: { title: "This account doesn’t have access", message: "Use an account with access to Powerplants One, or ask your administrator for help.", action: "Use another Microsoft account", tone: "error" },
  expired: { title: "Your session has expired", message: "Sign in again to continue. Any work that was not saved may need your attention.", action: "Sign in with Microsoft", tone: "info" },
  unavailable: { title: "Sign-in is temporarily unavailable", message: "Please try again. If the problem continues, contact your administrator.", action: "Try again with Microsoft", tone: "error" },
} as const;

// Query strings select presentation only. They never establish identity or access.
export function loginState(parameters: URLSearchParams): LoginState {
  const value = parameters.get("status");
  return parameters.getAll("status").length === 1 && value !== null && Object.hasOwn(states, value) ? value as LoginState : "ready";
}
export function loginFailure(error: unknown): LoginState {
  if (error instanceof AppError) {
    if (error.code === "DemoAccessDenied") return "denied";
    if (error.code === "LoginExpired") return "expired";
    if (error.code === "LoginCancelled") return "cancelled";
  }
  return "unavailable";
}

const file = (name: string) => readFileSync(new URL(name, import.meta.url));
const data = (mime: string, name: string) => `data:${mime};base64,${file(name).toString("base64")}`;
const template = file("./login.html").toString("utf8");
const script = file("./login.js").toString("utf8");
const style = `@font-face{font-family:Roboto;src:url('${data("font/woff", "../../public/brand/Roboto-variable.woff")}') format('woff');font-weight:100 900;font-display:swap}\n${file("./login.css").toString("utf8")}`;
const logo = data("image/png", "../../public/brand/powerplants-logo-green-white.png");
const microsoft = data("image/svg+xml", "./microsoft-symbol.svg");
const hash = (text: string) => createHash("sha256").update(text).digest("base64");
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export const loginPolicy = `default-src 'none'; img-src data:; font-src data:; style-src 'sha256-${hash(style)}'; script-src 'sha256-${hash(script)}'; connect-src 'none'; form-action 'self' https://login.microsoftonline.com; frame-ancestors 'none'; base-uri 'none'; object-src 'none'`;

/** Public, record-free entry page. All assets are existing local bytes; no authenticated asset exception is needed. */
export function renderLoginPage(state: LoginState = "ready", local = false, rateLimited = false) {
  const spec = states[state];
  const values: Record<string, string> = {
    STYLE: style, SCRIPT: script, LOGO: logo, MICROSOFT: microsoft,
    ENVIRONMENT: local ? "Local prototype · Fictional records" : "Private prototype · Fictional records",
    INTRO: local ? "Explore Powerplants One with a local demonstration identity." : "Sign in to Powerplants One with your work account.",
    NOTICE_HIDDEN: spec.title ? "" : "hidden", TONE: spec.tone,
    NOTICE_TITLE: escape(spec.title), NOTICE_MESSAGE: escape(rateLimited ? "Please wait 10 minutes before trying again. If the problem continues, contact your administrator." : spec.message),
    ACTION: escape(spec.action), DISABLED: local ? "disabled" : "",
    HANDOFF: local ? "Microsoft sign-in is available in the hosted private prototype." : "You’ll continue to Microsoft to sign in.",
    LOCAL_ENTRY: local ? '<a class="secondary local-entry" href="/work">Open local prototype</a>' : "",
    YEAR: String(new Date().getFullYear()),
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key: string) => {
    if (!Object.hasOwn(values, key)) throw Error("Unknown login template token");
    return values[key];
  });
}

export function sendLoginPage(res: ServerResponse, state: LoginState = "ready", status = 200, local = false) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store",
    "Content-Security-Policy": loginPolicy, "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow",
    ...(status === 429 ? { "Retry-After": "600" } : {}),
  });
  res.end(renderLoginPage(state, local, status === 429));
}
