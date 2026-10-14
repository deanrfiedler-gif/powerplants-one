import { randomUUID } from "node:crypto";
import { discoveryCostSetup } from "./estimating-cost-basis";
import { excelDiscovery, excelUpload, nativeWorkbook } from "./excel-review";
import {
  prepareExcelReview,
  previewExcelWorkbook,
} from "../../src/estimating/import/service";
import { excelConfirmations } from "../../src/estimating/import/commit";
export async function excelImportSetup(
  discovery = excelDiscovery(),
  edit?: (parts: ReturnType<typeof nativeWorkbook>) => void,
) {
  const s = await discoveryCostSetup(discovery);
  const context = await prepareExcelReview(s.p, s.input.id, {
    option_id: s.input.option_id,
    revision_id: s.input.revision_id,
  });
  const parts = nativeWorkbook(context.target);
  edit?.(parts);
  const upload = excelUpload(context.target, context.basis_hash, parts);
  const review = await previewExcelWorkbook(s.p, s.input.id, upload);
  return {
    ...s,
    context,
    upload,
    review,
    command: {
      ...upload,
      schema_version: 1,
      operation_id: randomUUID(),
      reason: "Synthetic reviewed workbook first save",
      review_hash: review.review_hash,
      confirmations: [...excelConfirmations],
    },
  };
}
