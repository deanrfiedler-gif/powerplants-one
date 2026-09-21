import {
  expect,
  type Page,
  type BrowserContext,
  type TestInfo,
} from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export async function compareEs08Design(
  page: Page,
  context: BrowserContext,
  info: TestInfo,
) {
  const sources = [
      {
        file: "docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html",
        scope: "#ppo-specialist",
        hash: "3cc832c3368f5b7ac9eb3352eee0fc3525e5220984214eb6c459c6ae2fb79881",
      },
      {
        file: "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
        scope: "#ppo-theme-board",
        hash: "a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0",
      },
    ],
    reference = await context.newPage(),
    measurements = [];
  for (const [i, source] of sources.entries()) {
    expect(
      createHash("sha256")
        .update(await readFile(source.file))
        .digest("hex"),
    ).toBe(source.hash);
    await reference.goto(pathToFileURL(resolve(source.file)).href);
    await reference.setViewportSize({ width: 1920, height: 1200 });
    await reference.evaluate(() => document.fonts.ready);
    const geometry = await reference.locator(source.scope).evaluate((e) => {
      const s = getComputedStyle(e),
        r = e.getBoundingClientRect();
      return {
        width: r.width,
        height: r.height,
        font: s.fontFamily,
        tokens: {
          navy: s.getPropertyValue("--navy").trim(),
          line: s.getPropertyValue("--line").trim(),
          focus: s.getPropertyValue("--focus").trim(),
        },
      };
    });
    measurements.push({ ...source, geometry });
    await reference.screenshot({
      path: info.outputPath(`es08-source-${i}.png`),
    });
  }
  await reference.close();
  const actual = await page.locator("#ppo-specialist").evaluate((e) => {
    const s = getComputedStyle(e);
    return {
      font: s.fontFamily,
      navy: s.getPropertyValue("--navy").trim(),
      line: s.getPropertyValue("--line").trim(),
      focus: s.getPropertyValue("--focus").trim(),
    };
  });
  expect(actual.font).toMatch(/Roboto/);
  expect({ navy: actual.navy, line: actual.line, focus: actual.focus }).toEqual(
    measurements[1].geometry.tokens,
  );
  expect(
    await page
      .getByRole("img", { name: "Powerplants Australia", exact: true })
      .getAttribute("src"),
  ).toContain("powerplants-logo-green-white.png");
  const layouts = [];
  for (const width of [1920, 1440, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const collapsed of [false, true]) {
      if (collapsed)
        await page
          .getByRole("button", {
            name: "Collapse Specialist configuration menu",
            exact: true,
          })
          .click();
      const search = (await page.locator(".ppo-global-search").boundingBox())!,
        add = (await page
          .getByRole("button", { name: "Quick add", exact: true })
          .boundingBox())!,
        centre = (search.x + add.x + add.width) / 2;
      expect(Math.abs(centre - width / 2)).toBeLessThanOrEqual(2);
      layouts.push({ width, collapsed, centre });
      if (collapsed) {
        const strip = page.getByRole("button", {
          name: "Expand Specialist configuration menu",
          exact: true,
        });
        expect((await strip.boundingBox())!.width).toBe(24);
        await strip.hover();
        await expect(page.locator("#ppo-specialist")).toHaveAttribute(
          "data-menu",
          "collapsed",
        );
        await strip.focus();
        await page.keyboard.press("Enter");
      }
    }
  }
  // Negative control: a padded/offset app header must fail the independent centring contract.
  const search = page.locator(".ppo-global-search");
  await search.evaluate(
    (e) => ((e as HTMLElement).style.transform = "translateX(20px)"),
  );
  const shifted = (await search.boundingBox())!,
    add = (await page
      .getByRole("button", { name: "Quick add", exact: true })
      .boundingBox())!;
  expect(
    Math.abs((shifted.x + add.x + add.width) / 2 - 1280 / 2),
  ).toBeGreaterThan(2);
  await search.evaluate((e) =>
    (e as HTMLElement).style.removeProperty("transform"),
  );
  await page.setViewportSize({ width: 1920, height: 1200 });
  await writeFile(
    info.outputPath("es08-source-comparison.json"),
    JSON.stringify(
      {
        sources: measurements,
        actual,
        layouts,
        adaptations:
          "ADR-0034 native shared shell; source visual vocabulary retained; source browser storage and pricing authority excluded",
        owner_acceptance: "Pending",
      },
      null,
      2,
    ),
  );
}
