import { chromium } from "playwright";

// ADR-0022 and browser-runtime-maintenance: accept only tested Chrome majors,
// with no fallback to Playwright's older bundled Chromium. Each reviewed major
// carries its earliest accepted patch. Stable installation supplied 155 on
// 6 October 2026; earlier reviewed majors remain compatible. A newer major
// requires its own tested maintenance change.
export const browserChannel = "chrome" as const;
export const reviewedBrowserVersions = [
  "153.0.8010.36",
  "154.0.8037.57",
  "155.0.8059.39",
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
      `PPO requires stable Chrome ${supported} or a later patch of that major. Received ${JSON.stringify(version)}. Install the reviewed browser with npm run browser:install.`,
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
