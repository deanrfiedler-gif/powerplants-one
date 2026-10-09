import assert from "node:assert/strict";
import { test } from "node:test";
import { documentTitle, productTitle, recordTitle } from "../../src/shell/page-title";

test("a page title names the page, then its department, then the product", () => {
  assert.equal(documentTitle({ page: "Service requests", department: "Service" }), "Service requests · Service — Powerplants One");
});

test("a record comes first so a truncated tab still identifies it", () => {
  assert.equal(
    documentTitle({ record: "SYN-PRJ-0031 · Glasshouse 4 fit-out", page: "Projects", department: "Projects" }),
    "SYN-PRJ-0031 · Glasshouse 4 fit-out · Projects — Powerplants One",
  );
});

test("repeated, blank and spaced names are not repeated in the title", () => {
  assert.equal(documentTitle({ page: "Finance  handoffs ", department: "Finance" }), "Finance handoffs · Finance — Powerplants One");
  assert.equal(documentTitle({ page: "finance", department: "Finance" }), "finance — Powerplants One");
  assert.equal(documentTitle({ page: "", department: undefined }), productTitle);
});

test("a record header's department prefix is left to the end of the title", () => {
  assert.equal(recordTitle("Service / SYN-PPO-WO-000001", "SYN Ready for scope review"), "SYN-PPO-WO-000001 · SYN Ready for scope review");
  assert.equal(recordTitle("SYN-PPO-RPT-000004 · Revision 2", "Service report"), "SYN-PPO-RPT-000004 · Revision 2 · Service report");
});
