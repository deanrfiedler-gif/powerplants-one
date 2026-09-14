import { chromium } from "playwright";

// ADR-0022: keep stable Chrome patches current without silently adopting an
// untested major or falling back to Playwright's older bundled Chromium.
export const browserChannel = "chrome" as const;
export const minimumBrowserVersion = "153.0.8010.36";
export function assertSupportedBrowser(version: string): void {
  const parts = /^([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(version);
  const actual = parts?.slice(1).map(Number);
  const minimum = minimumBrowserVersion.split(".").map(Number);
  const firstDifference = actual?.findIndex((part, i) => part !== minimum[i]);
  if (
    !actual ||
    parts?.[0] !== version ||
    actual.some((part) => !Number.isSafeInteger(part)) ||
    actual[0] !== minimum[0] ||
    (firstDifference !== undefined &&
      firstDifference >= 0 &&
      actual[firstDifference] < minimum[firstDifference])
  ) {
    throw new Error(
      `PPO requires stable Chrome ${minimumBrowserVersion} or later within major 153. Install the reviewed browser with npm run browser:install.`,
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
