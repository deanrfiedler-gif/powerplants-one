import { AppError } from "../../platform/errors";
import type { CostLine } from "../math";
import type { WorkbookComparison } from "./comparison";
export type LineDecision = { line_id: string; action: "Keep" | "Remove" };
export type Projection = {
  line: CostLine;
  line_ref: string | null;
  retained_from: string | null;
};
export function projectComparison(
  comparison: WorkbookComparison,
  decisions: LineDecision[],
): Projection[] {
  if (
    decisions.length !== comparison.omissions.length ||
    comparison.omissions.some(
      (o) => !decisions.some((d) => d.line_id === o.line_id),
    )
  )
    throw new AppError(
      422,
      "ExcelImportDecisionsRequired",
      "Choose Keep or Remove for every removed or PPO-only line, with no extra decisions.",
    );
  return [
    ...comparison.lines.map((l) => ({
      line: l.proposed,
      line_ref: l.line_ref,
      retained_from: null,
    })),
    ...comparison.omissions
      .filter(
        (o) =>
          decisions.find((d) => d.line_id === o.line_id)!.action === "Keep",
      )
      .map((o) => ({
        line: o.before,
        line_ref: null,
        retained_from: o.previous_import_version_id,
      })),
  ];
}
