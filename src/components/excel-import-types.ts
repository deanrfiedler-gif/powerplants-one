import { calculate } from "../estimating/math";
import { projectComparison } from "../estimating/import/projection";
import type { prepareExcelReview } from "../estimating/import/service";
import type {
  WorkbookReview,
  WorkbookComparison,
} from "../estimating/import/comparison";
import type { readExcelImport } from "../estimating/import/retained";
import type {
  previewExcelSourcePricing,
  readExcelSourcePricing,
} from "../estimating/import/pricing";
import type { reviewExcelQuotation } from "../estimating/import/quotation";
import type { readEstimate } from "../estimating/reads";
import type { readDiscoveryWorkspace } from "../estimating/discovery-workspaces";
export type { WorkbookReview, WorkbookComparison };
export type ImportContext = Awaited<ReturnType<typeof prepareExcelReview>>;
export type ImportEvidence = Awaited<ReturnType<typeof readExcelImport>>;
export type PricingReview = Awaited<
  ReturnType<typeof previewExcelSourcePricing>
>;
export type PricingEvidence = Awaited<
  ReturnType<typeof readExcelSourcePricing>
>;
export type QuoteReview = Awaited<ReturnType<typeof reviewExcelQuotation>>;
export type Estimate = Awaited<ReturnType<typeof readEstimate>>;
export type Workspace = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
export type Upload = { name: string; base64: string };
export const money = (value: string | null | undefined) =>
  value == null
    ? "Unknown"
    : `AUD ${value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
export const importHref = (
  workspace: string,
  option: string,
  revision: string,
) =>
  `/estimating/import?${new URLSearchParams({ workspace, option, revision })}`;
export const estimateImportHref = (
  estimate: string,
  version: string,
  mode = "saved",
) => `/estimating/import?${new URLSearchParams({ estimate, version, mode })}`;

export type ReviewSummary = {
  label: string;
  values: [string, string | null][];
};

// Use the native projection and decimal arithmetic; do not guess unresolved choices.
export function proposedTotals(
  comparison: WorkbookComparison,
  decisions: Record<string, "Keep" | "Remove">,
) {
  if (comparison.omissions.some((l) => !decisions[l.line_id])) return null;
  return calculate(
    projectComparison(
      comparison,
      Object.entries(decisions).map(([line_id, action]) => ({
        line_id,
        action,
      })),
    ).map((p) => p.line),
  );
}
