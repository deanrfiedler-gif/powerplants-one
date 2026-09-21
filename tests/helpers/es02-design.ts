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

// Independently load the issued sources. Host geometry is governed by the r04
// refinement; original localStorage examples and commercial rules are not used.
export async function compareEs02Design(
  page: Page,
  context: BrowserContext,
  info: TestInfo,
) {
  const sources = [
    {
      file: "docs/reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html",
      scope: "#ppo-estimate-wizard",
      hash: "7ce47597beb1f16e161bac1381c7cfaaabaf4eff357dcbf65ef558f0c02252b2",
    },
    {
      file: "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
      scope: "#ppo-theme-board",
      hash: "a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0",
    },
  ];
  const reference = await context.newPage(),
    measurements = [];
  for (const [index, source] of sources.entries()) {
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
        fontSize: s.fontSize,
        background: s.backgroundColor,
        tokens: {
          navy: s.getPropertyValue("--navy").trim(),
          line: s.getPropertyValue("--line").trim(),
          focus: s.getPropertyValue("--focus").trim(),
        },
      };
    });
    await reference.screenshot({
      path: info.outputPath(`es02-source-${index}.png`),
    });
    measurements.push({ ...source, geometry });
  }
  await reference.close();
  const actual = await page.locator("#ppo-estimate-wizard").evaluate((e) => {
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
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toContainText("Estimation Wizard");
  const layouts = [];
  for (const width of [1920, 1440, 1280]) {
    await page.setViewportSize({ width, height: 1200 });
    for (const menu of ["docked", "collapsed"]) {
      if (menu === "collapsed")
        await page
          .getByRole("button", {
            name: "Collapse Estimating menu",
            exact: true,
          })
          .click();
      for (const summary of [true, false]) {
        if (!summary)
          await page
            .getByRole("button", { name: "Hide estimate summary", exact: true })
            .click();
        const search = (await page
            .locator(".ppo-global-search")
            .boundingBox())!,
          add = (await page
            .getByRole("button", { name: "Quick add", exact: true })
            .boundingBox())!;
        const centre = (search.x + add.x + add.width) / 2;
        expect(Math.abs(centre - width / 2)).toBeLessThanOrEqual(2);
        layouts.push({ width, menu, summary, searchCentre: centre });
        if (!summary)
          await page
            .getByRole("button", { name: "Show estimate summary", exact: true })
            .click();
      }
      const before = await page.locator(".es02-main").boundingBox();
      await page.getByRole("button", { name: "More", exact: true }).click();
      expect(
        Math.abs(
          (await page.locator("#desktop-more-panel").boundingBox())!.x +
            (await page.locator("#desktop-more-panel").boundingBox())!.width -
            316,
        ),
      ).toBeLessThanOrEqual(1);
      expect(await page.locator(".es02-main").boundingBox()).toEqual(before);
      await page.keyboard.press("Escape");
      if (menu === "collapsed") {
        const strip = page.getByRole("button", {
          name: "Expand Estimating menu",
          exact: true,
        });
        expect((await strip.boundingBox())!.width).toBe(24);
        await strip.hover();
        await expect(page.locator("#ppo-estimate-wizard")).toHaveAttribute(
          "data-menu",
          "collapsed",
        );
        await strip.focus();
        await page.keyboard.press("Enter");
      }
    }
  }
  await page.setViewportSize({ width: 1920, height: 1200 });
  await writeFile(
    info.outputPath("es02-source-comparison.json"),
    JSON.stringify(
      {
        sources: measurements,
        actual,
        layouts,
        adaptations:
          "ADR-0033: r04 native five-step workspace, r22 shared shell, versioned persistence and exact saved costs; source preview storage/pricing rules excluded",
      },
      null,
      2,
    ),
  );
}
