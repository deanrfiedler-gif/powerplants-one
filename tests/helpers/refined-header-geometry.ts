import { expect, type Page } from "@playwright/test";

export async function expectRefinedHeader(page: Page, width: number) {
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
    return {
      bar: { x: bar.x, width: bar.width, height: bar.height },
      start: rect(".ppo-header-start"),
      centre: rect(".ppo-header-centre"),
      end: rect(".ppo-header-end"),
      search: rect(".ppo-global-search"),
      add: rect(".ppo-quick-add"),
      overflow: document.documentElement.scrollWidth > innerWidth,
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
  for (const [i, box] of boxes.controls.entries()) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(48);
    expect(box.right).toBeLessThanOrEqual(width - 16);
    if (i) expect(box.x).toBeGreaterThanOrEqual(boxes.controls[i - 1].right);
  }
}
