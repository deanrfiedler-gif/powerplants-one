import { expect, type Locator, type Page, type Request, type Response } from "@playwright/test";
import { keyActivate } from "./quality-keyboard";

type Listing = { items: { id: string }[]; next_cursor: string | null };

// CS-04 re-reads the Owned follow-up page every 15 s and on window focus, and
// keeps the rows and focus while it does (PPO-SITE-FOLLOW-UP-FOCUS-DEC). Decide
// each page from the exact scoped response the UI itself requested. Every page
// turn stays a native Tab walk and Enter.
export async function revealOwnedFollowUp(page: Page, first: Response, target: string): Promise<Locator> {
  const scope = new URL(first.url()).searchParams;
  const scoped = (request: Request) => {
    const url = new URL(request.url());
    return url.pathname === "/api/v1/activities" && request.method() === "GET" &&
      url.searchParams.get("object_type") === scope.get("object_type") &&
      url.searchParams.get("object_id") === scope.get("object_id");
  };
  const owned = page.locator(".detail-section").filter({ has: page.getByRole("heading", { name: "Owned follow-up", exact: true }) });
  const next = owned.getByRole("button", { name: "Next linked activities", exact: true });
  let cursor = cursorOf(first.request());
  let listing: Listing = await first.json();
  for (let pageNumber = 1; !listing.items.some(item => item.id === target); pageNumber++) {
    expect(listing.next_cursor, `${target} is on none of the ${pageNumber} permitted pages`).toBeTruthy();
    expect(pageNumber, "permitted linked activity pages").toBeLessThan(30);
    const turn = await activateNext(page, next, scoped, cursor);
    const response = await turn.response();
    expect(response, "the next linked activity page answered").not.toBeNull();
    expect(response!.status(), await response!.text()).toBe(200);
    expect(response!.headers()["cache-control"]).toBe("private, no-store");
    cursor = cursorOf(turn);
    listing = await response!.json();
  }
  return owned;
}

const cursorOf = (request: Request) => new URL(request.url()).searchParams.get("cursor");

async function activateNext(page: Page, next: Locator, scoped: (request: Request) => boolean, current: string | null) {
  // A read of the current cursor is a refresh; a read of any other cursor is
  // the page the UI turned to.
  let turned: Request | undefined;
  const observe = (request: Request) => {
    if (scoped(request) && cursorOf(request) !== current) turned ??= request;
  };
  page.on("request", observe);
  try {
    await keyActivate(page, next);
    await expect.poll(() => turned, { message: "Next linked activities requested another page" }).toBeDefined();
    return turned!;
  } finally {
    page.off("request", observe);
  }
}
