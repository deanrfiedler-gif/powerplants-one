import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExcelDraftReviewSummary } from "../../src/components/excel-import-continuation";

test("Excel Draft review names reconciliation figures and formats customer amounts", () => {
  const reconciliation = {
    estimate_sell: "1234.50",
    workbook_included_sell: "1234.50",
    reviewed_workbook_sell: "1234.50",
    retained_lines_sell: "0.00",
    quote_total: "1234.50",
    future_reviewed_amount: "12.00",
  };
  const review: ComponentProps<typeof ExcelDraftReviewSummary>["review"] = {
    reconciliation,
    choice_changes: [],
    unresolved_line_ids: [],
    can_prepare: true,
    customer_content: {
      synthetic: true,
      state: "Draft",
      title: "Synthetic irrigation quotation",
      customer: "Synthetic customer",
      site: "Synthetic site",
      contact: "Synthetic contact",
      scope: {
        included: "Synthetic installation",
        excluded: "None",
        assumptions: "Synthetic fixture",
      },
      items: [
        {
          description: "Synthetic equipment",
          quantity: "1",
          unit: "each",
          amount: "1234.50",
        },
      ],
      total: "1234.50",
      currency: "AUD",
      tax_basis: "ExcludingTax",
      tax_calculated: false,
    },
  };
  const markup = renderToStaticMarkup(
    createElement(ExcelDraftReviewSummary, { review }),
  );
  for (const label of [
    "Estimate sell",
    "Workbook included sell",
    "Reviewed workbook sell",
    "Your choices",
    "Draft total",
    "Future reviewed amount",
  ]) {
    assert.ok(markup.includes(`>${label}<`), label);
  }
  for (const key of Object.keys(reconciliation))
    assert.ok(!markup.includes(key), key);
  assert.match(markup, /<th>Amount<\/th>/);
  assert.match(markup, /<td>AUD 1,234\.50<\/td>/);
  assert.doesNotMatch(markup, /<th>AUD<\/th>|<td>1234\.50<\/td>/);
});
