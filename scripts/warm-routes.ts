// Warm every Next.js route once so first-request Turbopack compilation happens
// before any browser assertion window opens. The CI browser suite runs against
// `npm run dev` with a cold compiler cache, so the first request to each route
// otherwise pays its compile cost inside whichever test reaches it first.
//
// Library: enumerateRoutes() and warmRoutes(). CLI:
//   npx tsx scripts/warm-routes.ts [--base http://127.0.0.1:3000] [--out file.json]
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

export type RouteKind = "api" | "page";
export type Route = { path: string; kind: RouteKind; source: string };
export type WarmResult = {
  path: string;
  kind: RouteKind;
  status: number | null;
  elapsed_ms: number;
  error: string | null;
};
export type WarmSummary = {
  base_url: string;
  started_at: string;
  total_ms: number;
  routes: number;
  unreachable: number;
  results: WarmResult[];
};

// A well-formed UUID satisfies identifier validation so the handler itself runs
// (returning 401/404) rather than a shared 400 path that may skip module work.
export const PLACEHOLDER_ID = "00000000-0000-4000-8000-000000000000";

export function routePathFromFile(appDir: string, file: string): string {
  const rel = relative(appDir, file).split(sep);
  rel.pop(); // route.ts / page.tsx
  const segments = rel
    .filter((s) => !/^\(.*\)$/.test(s)) // route groups add no URL segment
    .filter((s) => !/^@/.test(s)) // parallel-route slots
    .map((s) => (/^\[\[?\.\.\..*\]\]?$/.test(s) || /^\[.*\]$/.test(s) ? PLACEHOLDER_ID : s));
  return "/" + segments.join("/");
}

export function enumerateRoutes(appDir = join(process.cwd(), "src", "app")): Route[] {
  const found: Route[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      const kind: RouteKind | null =
        name === "route.ts" || name === "route.tsx" ? "api" : name === "page.tsx" ? "page" : null;
      if (kind) found.push({ path: routePathFromFile(appDir, full), kind, source: relative(process.cwd(), full) });
    }
  };
  walk(appDir);
  // Root page first, then pages, then API routes; stable order keeps timings comparable between runs.
  return found.sort((a, b) => (a.kind === b.kind ? a.path.localeCompare(b.path) : a.kind === "page" ? -1 : 1));
}

export async function warmRoutes(
  baseUrl: string,
  routes: Route[],
  options: { requestTimeoutMs?: number; log?: (line: string) => void } = {},
): Promise<WarmSummary> {
  const timeout = options.requestTimeoutMs ?? 90_000;
  const startedAt = new Date();
  const runStart = performance.now();
  const results: WarmResult[] = [];
  for (const route of routes) {
    const t0 = performance.now();
    let status: number | null = null;
    let error: string | null = null;
    try {
      // Unauthenticated GET; any response proves the module compiled. Redirects
      // are not followed so a page's own compile is what is measured.
      const response = await fetch(baseUrl + route.path, {
        method: "GET",
        redirect: "manual",
        headers: { accept: "text/html,application/json" },
        signal: AbortSignal.timeout(timeout),
      });
      status = response.status;
      await response.arrayBuffer(); // drain so the server finishes the request
    } catch (e) {
      error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
    const elapsed_ms = Math.round(performance.now() - t0);
    results.push({ path: route.path, kind: route.kind, status, elapsed_ms, error });
    options.log?.(`${String(elapsed_ms).padStart(6)} ms  ${status ?? "ERR"}  ${route.path}${error ? `  ${error}` : ""}`);
  }
  return {
    base_url: baseUrl,
    started_at: startedAt.toISOString(),
    total_ms: Math.round(performance.now() - runStart),
    routes: results.length,
    unreachable: results.filter((r) => r.error !== null).length,
    results,
  };
}

export function slowest(summary: WarmSummary, n = 10): WarmResult[] {
  return [...summary.results].sort((a, b) => b.elapsed_ms - a.elapsed_ms).slice(0, n);
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (flag: string, fallback: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const base = arg("--base", "http://127.0.0.1:3000");
  const out = arg("--out", "");
  const routes = enumerateRoutes();
  console.log(`Warming ${routes.length} routes at ${base}`);
  const summary = await warmRoutes(base, routes, { log: (l) => console.log(l) });
  console.log(`\nTotal ${summary.total_ms} ms · ${summary.unreachable} unreachable · slowest:`);
  for (const r of slowest(summary)) console.log(`${String(r.elapsed_ms).padStart(6)} ms  ${r.path}`);
  if (out) writeFileSync(out, JSON.stringify(summary, null, 2));
  process.exitCode = summary.unreachable === routes.length && routes.length > 0 ? 1 : 0;
}

if (process.argv[1] && /warm-routes\.(ts|js)$/.test(process.argv[1])) void main();
