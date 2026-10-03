import { test, expect, type APIRequestContext } from "@playwright/test";
import { closeDatabase } from "../../src/platform/database";
import { setupPolicy, proposed } from "../helpers/policy-commands";
const root = "/schedule/policy-impact";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function login(request: APIRequestContext, profile: string) {
  const r = await request.post("/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
}
test.beforeEach(setupPolicy);
test.afterAll(closeDatabase);
test("successor editing focuses the mounted form after a delayed publication-head read", async ({
  page,
}, info) => {
  const fixture = await proposed();
  await login(page.request, "scheduling-policy-reviewer");
  let releaseHead!: () => void, headRequested!: () => void;
  const heldHead = new Promise<void>((resolve) => {
    releaseHead = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    headRequested = resolve;
  });
  await page.route("**/api/v1/schedule/policy-family", async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy();
    headRequested();
    await heldHead;
    await route.fulfill({ response });
  });
  try {
    await page.goto(`${root}?proposal=${fixture.command.id}`);
    await requested;
    const edit = page.getByRole("button", {
      name: "Edit as immutable successor",
      exact: true,
    });
    await edit.click();
    const heading = page.getByRole("heading", {
      name: "Unsaved successor edits",
      exact: true,
    });
    // The saved proposal can arrive before the separate current-head read.
    // Keep that read pending across browser paints, without changing its contents.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(heading).toHaveCount(0);
    releaseHead();
    await expect(heading).toBeFocused();
    await page.screenshot({ path: info.outputPath("successor-focus.png") });
    const minutes = page.getByLabel("Maximum visit duration (minutes)", {
      exact: true,
    });
    await minutes.fill("75");
    await expect(minutes).toBeFocused();
    await edit.click();
    await expect(heading).toBeFocused();
  } finally {
    releaseHead();
    await page.unrouteAll({ behavior: "wait" });
  }
});
