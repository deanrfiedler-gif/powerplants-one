import type { Page, Request, Response, TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// Synthetic CR05 readiness evidence only: never record URLs, headers, bodies,
// identities, record content or exception messages. Keep the assertion intact.
export async function aftercareReadDiagnostics(page: Page, info: TestInfo, path: string) {
  const started = Date.now();
  const events: Record<string, string | number | boolean>[] = [];
  const requests = new Map<Request, number>();
  const matches = (request: Request) => request.method() === "GET" && new URL(request.url()).pathname === path;
  const number = (request: Request) => {
    if (!requests.has(request)) requests.set(request, requests.size + 1);
    return requests.get(request)!;
  };
  const mark = (event: string, request?: Request, status?: number) => {
    if (events.length < 100) events.push({
      event, elapsed_ms: Date.now() - started,
      ...(request ? { request: number(request) } : {}),
      ...(status === undefined ? {} : { status }),
    });
  };
  const requested = (request: Request) => { if (matches(request)) mark("request", request); };
  const responded = (response: Response) => { if (matches(response.request())) mark("response", response.request(), response.status()); };
  const finished = (request: Request) => { if (matches(request)) mark("request-finished", request); };
  const failed = (request: Request) => { if (matches(request)) mark("request-failed", request); };
  const pageError = () => mark("page-error");
  page.on("request", requested);
  page.on("response", responded);
  page.on("requestfinished", finished);
  page.on("requestfailed", failed);
  page.on("pageerror", pageError);
  await page.addInitScript(() => {
    const events: Record<string, string | number | boolean>[] = [];
    let last = "";
    let observing = true;
    const sample = (event: string) => {
      if (!observing) return;
      const main = document.querySelector("main");
      const state = {
        main: !!main,
        loading: [...(main?.querySelectorAll('[role="status"]') ?? [])].some(node => node.textContent === "Loading aftercare review…"),
        customer_review_tab: [...(main?.querySelectorAll('[role="tab"]') ?? [])].some(node => node.textContent === "Customer review"),
        resource_alert: [...(main?.querySelectorAll('[role="alert"]') ?? [])].some(node => !!node.textContent?.trim()),
        visibility: document.visibilityState,
      };
      const next = JSON.stringify(state);
      if (event !== "state" || next !== last) {
        if (events.length < 100) events.push({ event, at_ms: Date.now(), ...state });
        last = next;
      }
    };
    const observer = new MutationObserver(() => sample("state"));
    observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["role", "hidden"] });
    const focus = () => sample("window-focus");
    const visibility = () => sample("visibility");
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    Object.assign(window, { ppoCr05ReadDiagnostics: () => {
      sample("final-state");
      observing = false;
      observer.disconnect();
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visibility);
      return events;
    } });
  });
  return {
    mark,
    async finish() {
      try {
        const browser = await page.evaluate(() => {
          const target = window as typeof window & { ppoCr05ReadDiagnostics?: () => Record<string, string | number | boolean>[] };
          return target.ppoCr05ReadDiagnostics?.() ?? [];
        }).catch(() => { mark("page-state-unavailable"); return []; });
        const file = info.outputPath("cr05-initial-read.json");
        await writeFile(file, JSON.stringify({
          schema_version: 1, source_head: process.env.PPO_SOURCE_HEAD ?? null,
          project: info.project.name, started_at_ms: started,
          events, browser,
        }, null, 2) + "\n");
        await info.attach("CR05 initial read sequencing", { path: file, contentType: "application/json" });
      } finally {
        page.off("request", requested);
        page.off("response", responded);
        page.off("requestfinished", finished);
        page.off("requestfailed", failed);
        page.off("pageerror", pageError);
      }
    },
  };
}
