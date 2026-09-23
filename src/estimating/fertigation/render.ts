import { launchDocumentBrowser } from "../../platform/browser";
import { reportHtml, type reportModel } from "./output";

/** Existing server renderer, isolated from the pure audience projection. */
export async function renderReportPdf(
  model: ReturnType<typeof reportModel>,
): Promise<Buffer> {
  const browser = await launchDocumentBrowser();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(reportHtml(model), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      outline: true,
      displayHeaderFooter: true,
      margin: { top: "16mm", right: "16mm", bottom: "22mm", left: "16mm" },
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="font:10px Verdana;width:100%;margin:0 16mm;color:#183348">Synthetic draft scoping report - not for construction or commissioning <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Invalid fertigation PDF");
    return pdf;
  } finally {
    await browser.close();
  }
}
