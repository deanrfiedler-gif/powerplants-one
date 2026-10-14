import { expect, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { expectFlowingShellHeader } from "./shell-header-geometry";

// Independently pinned accepted Figma capture; runtime captures remain evidence,
// never a replacement baseline. Icons in the retained source are placeholders.
export async function compareEs02Design(page: Page, info: TestInfo) {
  const source = {
    file: "docs/reference/ui/estimating/es02-wizard-figma-design-r01/PPO-ES02-Wizard-Figma-01-Desktop-Configuration-r01.png",
    hash: "6085cec95c20855b7ab2665ac078549b58d45586ab155941f65642447c28ecf4",
    viewport: { width: 1440, height: 1000 },
    rail: 240,
    summary: 380,
    header: 64,
    step: 48,
  };
  expect(
    createHash("sha256")
      .update(await readFile(source.file))
      .digest("hex"),
  ).toBe(source.hash);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toContainText("Estimation Wizard");
  const layouts = [];
  for (const width of [1920, 1440, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const collapsed of [false, true]) {
      if (collapsed)
        await page
          .getByRole("button", {
            name: "Collapse primary navigation",
            exact: true,
          })
          .click();
      const header = await expectFlowingShellHeader(page);
      const geometry = await page.evaluate(() => {
        const box = (s: string) =>
          document.querySelector(s)!.getBoundingClientRect().toJSON();
        return {
          rail: box(".ppo-rail"),
          main: box(".es02-main"),
          summary: box(".es02-summary"),
          step: box(".es02-step"),
          footer: box(".es02-bottom"),
          font: getComputedStyle(
            document.querySelector("#ppo-estimate-wizard")!,
          ).fontFamily,
        };
      });
      expect(geometry.rail.width).toBe(collapsed ? 76 : source.rail);
      expect(geometry.main.x).toBe(geometry.rail.right);
      expect(geometry.main.y).toBe(source.header);
      expect(geometry.summary.width).toBe(source.summary);
      expect(geometry.main.right).toBe(geometry.summary.x);
      expect(geometry.step.height).toBe(source.step);
      expect(geometry.footer.bottom).toBe(1000);
      expect(geometry.font).toMatch(/Roboto/);
      await page
        .getByRole("button", { name: "Hide estimate summary", exact: true })
        .click();
      expect((await page.locator(".es02-main").boundingBox())!.width).toBe(
        width - geometry.rail.width,
      );
      await page
        .getByRole("button", { name: "Show estimate summary", exact: true })
        .click();
      layouts.push({ width, collapsed, header, geometry });
      if (collapsed)
        await page
          .getByRole("button", {
            name: "Expand primary navigation",
            exact: true,
          })
          .click();
    }
  }
  await page.setViewportSize(source.viewport);
  await writeFile(
    info.outputPath("es02-source-comparison.json"),
    JSON.stringify(
      {
        source,
        layouts,
        adaptations:
          "Accepted Figma D1–D18; shared current Shell v2 utilities remain. Actual permissions, findings and saved revisions determine state; no example timing or pricing rule becomes operational authority.",
      },
      null,
      2,
    ),
  );
}
