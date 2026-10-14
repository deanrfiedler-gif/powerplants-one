import { randomUUID } from "node:crypto";
import { prepareExcelReview } from "../../src/estimating/import/service";
import { compareExcelWorkbook } from "../../src/estimating/import/comparison";
import { excelConfirmations } from "../../src/estimating/import/commit";
import { excelUpload, nativeWorkbook, setCell } from "./excel-review";
import type { CostSetup } from "./estimating-cost-basis";
export async function revisionUpload(
  s: CostSetup,
  edit?: (parts: ReturnType<typeof nativeWorkbook>) => void,
) {
  const context = await prepareExcelReview(s.p, s.input.id, {
    option_id: s.input.option_id,
    revision_id: s.input.revision_id,
  });
  const parts = nativeWorkbook(context.target);
  edit?.(parts);
  return excelUpload(context.target, context.basis_hash, parts);
}
export async function revisionCommand(
  s: CostSetup,
  edit?: (parts: ReturnType<typeof nativeWorkbook>) => void,
) {
  const upload = await revisionUpload(s, edit),
    comparison = await compareExcelWorkbook(s.p, s.input.id, upload);
  return {
    upload,
    comparison,
    command: {
      ...upload,
      schema_version: 1,
      operation_id: randomUUID(),
      reason: "Synthetic reviewed revised workbook",
      confirmations: [...excelConfirmations],
      review_hash: comparison.proposal.review_hash,
      comparison_hash: comparison.comparison_hash,
      changes_confirmed: true,
      decisions: comparison.omissions.map((o) => ({
        line_id: o.line_id,
        action: "Keep" as "Keep" | "Remove",
      })),
    },
  };
}
export function changedWorkbook(parts: ReturnType<typeof nativeWorkbook>) {
  setCell(parts, 5, "A6", "L-NEW");
  setCell(parts, 5, "C7", "Revised synthetic description");
  setCell(parts, 5, "M8", "No");
  setCell(parts, 2, "B6", "Revised section label");
  setCell(parts, 4, "G6", "Revised internal supplier note");
}
export function reorderWorkbook(parts: ReturnType<typeof nativeWorkbook>) {
  const path = "xl/worksheets/sheet5.xml",
    a = parts[path].match(/<row r="6"[^>]*>[\s\S]*?<\/row>/)![0],
    b = parts[path].match(/<row r="7"[^>]*>[\s\S]*?<\/row>/)![0];
  const move = (s: string, from: number, to: number) =>
    s.replace(new RegExp(`r="([A-Z]*)${from}"`, "g"), `r="$1${to}"`);
  parts[path] = parts[path]
    .replace(a, "SWAPROW")
    .replace(b, move(a, 6, 7))
    .replace("SWAPROW", move(b, 7, 6));
}
