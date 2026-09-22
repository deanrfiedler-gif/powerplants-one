import { chromium } from "playwright";

// ADR-0022 r02: keep stable Chrome patches current without silently adopting an
// untested major or falling back to Playwright's older bundled Chromium. Each
// reviewed major carries the earliest patch accepted for it. Chrome stable
// rolled to 154 on 22 September 2026 and `npm run browser:install` now installs
// it; 153 stays accepted while installed machines still carry it. A newer major
// still requires its own tested maintenance change.
export const browserChannel = "chrome" as const;
export const reviewedBrowserVersions = [
  "153.0.8010.36",
  "154.0.8037.57",
] as const;
export const minimumBrowserVersion = reviewedBrowserVersions[0];
const supported = reviewedBrowserVersions.join(" or ");
export function assertSupportedBrowser(version: string): void {
  const parts = /^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(version);
  const actual = parts?.slice(1).map(Number);
  const reviewed = reviewedBrowserVersions
    .map((value) => value.split(".").map(Number))
    .find((value) => value[0] === actual?.[0]);
  const firstDifference = reviewed
    ? actual?.findIndex((part, i) => part !== reviewed[i])
    : undefined;
  if (
    !actual ||
    parts?.[0] !== version ||
    actual.some((part) => !Number.isSafeInteger(part)) ||
    !reviewed ||
    (firstDifference !== undefined &&
      firstDifference >= 0 &&
      actual[firstDifference] < reviewed[firstDifference])
  ) {
    throw new Error(
      `PPO requires stable Chrome ${supported} or a later patch of that major. Install the reviewed browser with npm run browser:install.`,
    );
  }
}

export async function launchDocumentBrowser() {
  const browser = await chromium.launch({
    channel: browserChannel,
    headless: true,
  });
  try {
    assertSupportedBrowser(browser.version());
    return browser;
  } catch (error) {
    await browser.close();
    throw error;
  }
}
