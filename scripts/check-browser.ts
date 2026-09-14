import { launchDocumentBrowser } from "../src/platform/browser";

export default async function checkBrowser() {
  const browser = await launchDocumentBrowser();
  try {
    console.log(
      JSON.stringify({
        node: process.version,
        playwright: "1.63.0",
        channel: "chrome",
        browser: browser.version(),
      }),
    );
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(
      "<!doctype html><html lang='en-AU'><title>PPO renderer check</title><h1>Synthetic renderer check</h1></html>",
    );
    const pdf = await page.pdf({ format: "A4", tagged: true });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Browser PDF check failed");
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/check-browser.ts"))
  await checkBrowser();
