import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

// A locator screenshot cannot reveal content clipped by an ancestor's scroll
// port. Retain original viewport frames at overlapping, ordinary scroll positions.
// Do not resize the dialog, alter its CSS, stitch images, or substitute its text.
export async function captureTransferComparison(page: Page, info: TestInfo, comparison: Locator) {
  const scroll = page.getByRole("dialog").locator(".crm-dialog-scroll");
  const width = page.viewportSize()!.width;
  const geometry = () => comparison.evaluate(element => {
    const port = element.closest(".crm-dialog-scroll") as HTMLElement;
    const dialog = element.closest("dialog")!;
    const outer = port.getBoundingClientRect();
    const target = element.getBoundingClientRect();
    const header = dialog.querySelector(".crm-dialog-head")!.getBoundingClientRect();
    const footer = dialog.querySelector(".crm-dialog-footer")!.getBoundingClientRect();
    const top = Math.max(outer.top, header.bottom, 0);
    const bottom = Math.min(outer.bottom, footer.top, innerHeight);
    return {
      scroll_top: port.scrollTop,
      max_scroll: port.scrollHeight - port.clientHeight,
      region_start: target.top - outer.top + port.scrollTop,
      region_end: target.bottom - outer.top + port.scrollTop,
      visible_start: top - outer.top + port.scrollTop,
      visible_end: bottom - outer.top + port.scrollTop,
      usable_height: bottom - top,
    };
  });
  const initial = await geometry();
  await scroll.evaluate((element, top) => { element.scrollTop = Math.max(0, top - 12); }, initial.region_start);
  const frames: Array<Awaited<ReturnType<typeof geometry>> & { file: string; byte_count: number; sha256: string }> = [];
  let coveredUntil = initial.region_start;
  for (let index = 0; index < 20; index++) {
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const current = await geometry();
    expect(current.usable_height).toBeGreaterThan(80);
    expect(current.visible_start).toBeLessThanOrEqual(coveredUntil + 1);
    expect(current.visible_end).toBeGreaterThan(coveredUntil);
    const file = `crm-transfer-scrolled-${width}-${String(index + 1).padStart(2, "0")}.png`;
    const bytes = await page.screenshot({ path: info.outputPath(file), fullPage: false });
    frames.push({ ...current, file, byte_count: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    coveredUntil = current.visible_end;
    if (coveredUntil >= current.region_end - 1) break;
    const next = Math.min(current.max_scroll, current.scroll_top + current.usable_height - 48);
    expect(next).toBeGreaterThan(current.scroll_top);
    await scroll.evaluate((element, top) => { element.scrollTop = top; }, next);
  }
  expect(coveredUntil).toBeGreaterThanOrEqual(initial.region_end - 1);
  await writeFile(info.outputPath(`crm-transfer-scrolled-${width}.json`), JSON.stringify({
    source_head: process.env.PPO_SOURCE_HEAD ?? process.env.GITHUB_SHA ?? null,
    executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim(),
    run_id: process.env.GITHUB_RUN_ID ?? null,
    run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    viewport: page.viewportSize(),
    method: "Original viewport screenshots with overlapping scroll coverage; unchanged layout",
    comparison_text_sha256: createHash("sha256").update(await comparison.innerText()).digest("hex"),
    frames,
  }, null, 2) + "\n");
}
