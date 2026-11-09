import { expect, type Page } from "@playwright/test";

export async function expectRefinedHeader(page: Page, width: number) {
  await expect(
    page.locator(
      "#header-account .identity-toggle, #header-account .ppo-account-toggle",
    ),
  ).toBeVisible();
  await expect(page.locator("#shell-header .ppo-guide-action")).toBeVisible();
  const boxes = await page.locator("#shell-header").evaluate((header) => {
    const rect = (selector: string) => {
      const r = header.querySelector(selector)!.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        right: r.right,
      };
    };
    const bar = header.getBoundingClientRect();
    const frame = header.closest(".app-frame")!;
    const rail = frame
      .querySelector(".sidebar.ppo-rail")!
      .getBoundingClientRect();
    return {
      bar: { x: bar.x, width: bar.width, height: bar.height },
      start: rect(".ppo-header-start"),
      centre: rect(".ppo-header-centre"),
      end: rect(".ppo-header-end"),
      search: rect(".ppo-global-search"),
      add: rect(".ppo-quick-add"),
      overflow: document.documentElement.scrollWidth > innerWidth,
      framePaddingBottom: getComputedStyle(frame).paddingBottom,
      rail: { top: rail.top, bottom: rail.bottom },
      viewportHeight: innerHeight,
      controls: [
        ...header.querySelectorAll<HTMLElement>(
          ".ppo-header-utilities a,.ppo-header-utilities button,.ppo-account-toggle,.identity-toggle",
        ),
      ]
        .filter((n) => n.getClientRects().length)
        .map((n) => {
          const r = n.getBoundingClientRect();
          return { x: r.x, right: r.right, y: r.y, bottom: r.bottom };
        }),
    };
  });
  expect(boxes.bar).toEqual({ x: 0, width, height: 48 });
  const expected = new Map([
    [834, [272, 262, 300]],
    [1024, [332, 360, 332]],
    [1280, [440, 400, 440]],
    [1440, [496, 448, 496]],
    [1920, [720, 480, 720]],
  ]).get(width);
  if (expected)
    expect([boxes.start.width, boxes.centre.width, boxes.end.width]).toEqual(
      expected,
    );
  expect(boxes.search.width).toBeCloseTo(boxes.centre.width, 0);
  if (width >= 1024)
    expect(boxes.search.x + boxes.search.width / 2).toBeCloseTo(width / 2, 0);
  expect(boxes.add.x - boxes.search.right).toBeCloseTo(16, 0);
  expect(boxes.add.width).toBe(32);
  if (width === 1440) expect(boxes.add.x).toBe(960);
  expect(boxes.overflow).toBe(false);
  expect(boxes.framePaddingBottom).toBe("0px");
  expect(boxes.rail.top).toBe(48);
  expect(boxes.rail.bottom).toBe(boxes.viewportHeight);
  for (const [i, box] of boxes.controls.entries()) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(48);
    expect(box.right).toBeLessThanOrEqual(width - 16);
    if (i) expect(box.x).toBeGreaterThanOrEqual(boxes.controls[i - 1].right);
  }
}
