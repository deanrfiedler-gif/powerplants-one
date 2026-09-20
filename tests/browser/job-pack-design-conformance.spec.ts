import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Application proof for the Job Pack r03 integration (SC-06). The issued HTML is loaded independently and measured
// beside the running route, so passing means the application matches the accepted source, not merely itself.
// The pack read is a retained synthetic fixture: the proof stays deterministic and books no crew in the shared database.
const design = "docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html";
const viewports = [
  { width: 1440, height: 960 },
  { width: 1024, height: 768 },
  { width: 820, height: 800 },
  { width: 390, height: 844 },
];

async function openPack(page: Page) {
  const read = JSON.parse(
      await readFile("tests/fixtures/job-pack-read.json", "utf8"),
    ),
    id = read.items[0].id as string;
  await page.request.post("/api/v1/local-session", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { profile: "coordinator" },
  });
  await page.route(`**/api/v1/packs/${id}`, (route) =>
    route.fulfill({ status: 200, json: read }),
  );
  await page.goto(`/service/packs/${id}`);
  await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(9);
}
const tokensOf = (page: Page, names: string[]) =>
  page.locator("#ppo-job-pack").evaluate(
    (el, list) =>
      Object.fromEntries(
        list.map((n) => [n, getComputedStyle(el).getPropertyValue(n).trim()]),
      ),
    names,
  );

test("SC-06 the running Job Pack page carries the accepted r03 tokens and geometry", async ({
  page,
  browser,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "Measured at the declared desktop viewport; the phone case follows.",
  );
  const source = await readFile(design, "utf8"),
    block = source.slice(
      source.indexOf("#ppo-job-pack{"),
      source.indexOf("box-sizing:border-box;padding:24px"),
    ),
    names = [...new Set(block.match(/--[a-z0-9-]+(?=:)/g))];
  // The register declares 41 tokens for job-pack-r03. A different count means the source or this parse changed.
  expect(names).toHaveLength(41);

  const reference = await (
    await browser.newContext({ viewport: viewports[0] })
  ).newPage();
  await reference.goto(pathToFileURL(design).href);
  await expect(reference.locator("#ppo-job-pack .paper-section")).toHaveCount(
    18,
  );
  const accepted = await tokensOf(reference, names);
  const measure = (p: Page, layout: string, rail: string) =>
    p.evaluate(
      ([l, r]) => {
        const el = document.querySelector("#ppo-job-pack")!,
          cs = getComputedStyle(el),
          columns = getComputedStyle(
            document.querySelector(l)!,
          ).gridTemplateColumns.split(" "),
          nav = getComputedStyle(document.querySelector(r)!);
        return {
          padding: cs.padding,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          first: columns[0],
          last: columns[columns.length - 1],
          columns: columns.length,
          navPosition: nav.position,
          navTop: nav.top,
        };
      },
      [layout, rail],
    );
  const acceptedGeometry = await measure(
    reference,
    "#panel-pack .layout",
    "#panel-pack .contents",
  );
  await reference.context().close();

  await page.setViewportSize(viewports[0]);
  await openPack(page);
  expect(await tokensOf(page, names)).toEqual(accepted);
  const geometry = await measure(page, ".jp-layout", ".jp-contents");
  expect(geometry).toEqual(acceptedGeometry);
  expect(geometry.padding).toBe("24px");
  expect([geometry.first, geometry.last, geometry.columns]).toEqual([
    "220px",
    "258px",
    3,
  ]);
  // Authorised host adaptation: the module, not the window, owns scrolling.
  expect(
    await page
      .locator("#ppo-job-pack")
      .evaluate((el) => [
        getComputedStyle(el).overflowY,
        el.getAttribute("data-module-layout"),
        document.documentElement.scrollHeight <= innerHeight,
      ]),
  ).toEqual(["auto", "full-bleed", true]);
});

test("SC-06 no horizontal overflow at the four declared viewports, 16 px padding on a phone", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "One project sweeps every declared viewport.",
  );
  await openPack(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const m = await page.locator("#ppo-job-pack").evaluate((el) => ({
      page: document.documentElement.scrollWidth <= innerWidth,
      module: el.scrollWidth <= el.clientWidth,
      padding: getComputedStyle(el).padding,
    }));
    expect(m, `${viewport.width}x${viewport.height}`).toEqual({
      page: true,
      module: true,
      padding: viewport.width <= 760 ? "16px" : "24px",
    });
  }
});

test("SC-06 negative control: the last section is reachable by scrolling (r02 audit U1)", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "The contents rail is a desktop control; a phone uses the jump select.",
  );
  await page.setViewportSize(viewports[0]);
  await openPack(page);
  const current = page.locator('.jp-contents nav a[aria-current="true"]');
  await expect(current).toContainText("Job and visit");
  // In approved r02 the scroll-spy stopped at section 07 because 08 and 09 never crossed its threshold.
  await page
    .locator("#ppo-job-pack")
    .evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await expect(current).toContainText("Completion requirements");
  // A contents jump holds its own selection instead of yielding to the scroll position it causes.
  await page
    .getByRole("navigation", { name: "Job pack sections", exact: true })
    .getByRole("link", { name: /Site controls/ })
    .click();
  await expect(current).toContainText("Site controls");
  await expect(page.locator("#s-8")).toBeFocused();
});
