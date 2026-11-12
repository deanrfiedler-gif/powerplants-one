import type {
  Dialog,
  Frame,
  Page,
  Request,
  Response,
  TestInfo,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";

// The retained failure had a focused return link but no Deal navigation. Record
// click cancellation, layout movement and exact fixture request outcomes without
// retaining URLs, query strings, headers, bodies, record text or exception text.
export async function crmReturnDiagnostics(
  page: Page,
  info: TestInfo,
  activityId: string,
  opportunityId: string,
) {
  const started = Date.now();
  const events: Record<string, string | number | boolean>[] = [];
  const requests = new Map<Request, number>();
  const number = (request: Request) => {
    if (!requests.has(request)) requests.set(request, requests.size + 1);
    return requests.get(request)!;
  };
  const paths = new Map([
    [`/api/v1/activities/${activityId}`, "activity"],
    [`/api/v1/activities/${activityId}/sales-followup`, "sales-followup"],
    [`/api/v1/crm/opportunities/${opportunityId}`, "opportunity"],
    [`/sales/opportunities/${opportunityId}`, "opportunity-page"],
  ]);
  const mark = (
    event: string,
    detail: Record<string, string | number | boolean> = {},
  ) => {
    if (events.length < 100)
      events.push({ event, at_ms: Date.now(), ...detail });
  };
  const requested = (request: Request) => {
    const route = paths.get(new URL(request.url()).pathname);
    if (route && request.method() === "GET")
      mark("request", { route, request: number(request) });
  };
  const responded = (response: Response) => {
    const route = paths.get(new URL(response.url()).pathname);
    if (route && response.request().method() === "GET")
      mark("response", {
        route,
        request: number(response.request()),
        status: response.status(),
      });
  };
  const failed = (request: Request) => {
    const route = paths.get(new URL(request.url()).pathname);
    if (route && request.method() === "GET")
      mark("request-failed", { route, request: number(request) });
  };
  const finished = (request: Request) => {
    const route = paths.get(new URL(request.url()).pathname);
    if (route && request.method() === "GET")
      mark("request-finished", { route, request: number(request) });
  };
  const navigated = (frame: Frame) => {
    if (frame === page.mainFrame())
      mark("navigation", {
        destination: paths.get(new URL(frame.url()).pathname) ?? "other",
      });
  };
  const pageError = () => mark("page-error");
  const dialog = async (dialog: Dialog) => {
    mark("dialog", { type: dialog.type() });
    // Match Playwright's default dismissal; never accept or bypass a guard.
    await dialog.dismiss();
  };
  page.on("request", requested);
  page.on("response", responded);
  page.on("requestfailed", failed);
  page.on("requestfinished", finished);
  page.on("framenavigated", navigated);
  page.on("pageerror", pageError);
  page.on("dialog", dialog);
  await page.addInitScript((activityId: string) => {
    if (location.pathname !== `/work/${activityId}`) return;
    const events: Record<string, string | number | boolean>[] = [];
    const link = () =>
      [...document.querySelectorAll("a")].find(
        (a) => a.textContent === "Return to opportunity and plan follow-up",
      );
    const state = () => {
      const a = link(),
        box = a?.getBoundingClientRect();
      return {
        return_link: !!a,
        return_focused: !!a && document.activeElement === a,
        link_top: box?.top ?? -1,
        link_left: box?.left ?? -1,
        link_width: box?.width ?? -1,
        link_height: box?.height ?? -1,
        scroll_y: window.scrollY,
        activities_tab: [...document.querySelectorAll('[role="tab"]')].some(
          (n) => n.textContent === "Activities",
        ),
      };
    };
    let last = "";
    const record = (
      event: string,
      detail: Record<string, string | number | boolean> = {},
    ) => {
      if (events.length < 100)
        events.push({ event, at_ms: Date.now(), ...state(), ...detail });
    };
    const changed = () => {
      const next = JSON.stringify(state());
      if (next !== last) {
        last = next;
        record("layout-state");
      }
    };
    const observer = new MutationObserver(changed);
    observer.observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const capture = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest("a") : null;
      record(`${event.type}-capture`, {
        return_target: !!target && target === link(),
        x: event.clientX,
        y: event.clientY,
        prevented: event.defaultPrevented,
      });
      setTimeout(
        () =>
          record(`${event.type}-settled`, {
            prevented: event.defaultPrevented,
          }),
        0,
      );
    };
    for (const name of [
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "click",
    ] as const)
      document.addEventListener(name, capture, true);
    Object.assign(window, {
      ppoCrmReturnDiagnostics: () => {
        record("final-state");
        observer.disconnect();
        for (const name of [
          "pointerdown",
          "mousedown",
          "pointerup",
          "mouseup",
          "click",
        ] as const)
          document.removeEventListener(name, capture, true);
        return events;
      },
    });
  }, activityId);
  return {
    mark,
    async finish() {
      try {
        const browser = await page
          .evaluate(() => {
            const target = window as typeof window & {
              ppoCrmReturnDiagnostics?: () => Record<
                string,
                string | number | boolean
              >[];
            };
            return target.ppoCrmReturnDiagnostics?.() ?? [];
          })
          .catch(() => {
            mark("page-state-unavailable");
            return [];
          });
        const file = info.outputPath("crm-return-navigation.json");
        await writeFile(
          file,
          JSON.stringify(
            {
              schema_version: 1,
              source_head: process.env.PPO_SOURCE_HEAD ?? null,
              project: info.project.name,
              started_at_ms: started,
              events,
              browser,
            },
            null,
            2,
          ) + "\n",
        );
        await info.attach("CRM return navigation", {
          path: file,
          contentType: "application/json",
        });
      } finally {
        page.off("request", requested);
        page.off("response", responded);
        page.off("requestfailed", failed);
        page.off("requestfinished", finished);
        page.off("framenavigated", navigated);
        page.off("pageerror", pageError);
        page.off("dialog", dialog);
      }
    },
  };
}
