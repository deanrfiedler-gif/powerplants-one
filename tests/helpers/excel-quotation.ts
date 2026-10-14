import { randomUUID } from "node:crypto";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import {
  reviewExcelQuotation,
  excelQuoteConfirmations,
} from "../../src/estimating/import/quotation";
import { readEstimate } from "../../src/estimating/reads";
import { excelImportSetup } from "./excel-import";
import type { QuoteChoice } from "../../src/estimating/math";
export async function importedForQuote() {
  const s = await excelImportSetup();
  const accepted = await commitExcelWorkbook(s.p, s.input.id, s.command);
  const e = await readEstimate(s.p, accepted.receipt.record_id);
  return { ...s, e };
}
export async function excelQuoteProposal(
  s: Awaited<ReturnType<typeof importedForQuote>>,
  choices?: QuoteChoice[],
) {
  const e = await readEstimate(s.p, s.e.id);
  const review = await reviewExcelQuotation(s.p, e.id, {
    estimate_version_id: e.saved.id,
    ...(choices ? { choices } : {}),
  });
  const command = {
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN separately reviewed customer wording and quote reconciliation",
    id: randomUUID(),
    estimate_version_id: e.saved.id,
    expected_version: e.version,
    expected_quote_version: review.expected_quote_version,
    choices: review.choices,
    review_hash: review.review_hash,
    confirmations: [...excelQuoteConfirmations],
  };
  return { review, command };
}
