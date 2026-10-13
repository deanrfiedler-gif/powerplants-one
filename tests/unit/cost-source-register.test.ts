import assert from "node:assert/strict";
import { test } from "node:test";
import { costSourceRegisterQuery } from "../../src/estimating/sources/register";

test("cost source register strictly bounds queries without accepting policy changes", () => {
  assert.deepEqual(costSourceRegisterQuery({}), {
    q: "",
    supplier: "",
    company_id: null,
    state: "all",
    view: "all",
    validity: "all",
    limit: 25,
    offset: 0,
  });
  for (const invalid of [
    { limit: "0" },
    { limit: "101" },
    { offset: "-1" },
    { offset: "01" },
    { offset: "1000001" },
    { limit: "1.5" },
    { state: "Approved" },
    { view: "everyone" },
    { validity: "expiring_soon" },
    { company_id: "wrong" },
    { q: "x".repeat(101) },
    { supplier: "x\u0000" },
    { as_of: "2026-10-12" },
  ])
    assert.throws(() => costSourceRegisterQuery(invalid));
});

test("cost source register keeps literal search, company and independent filters", () => {
  const id = "20000000-0000-4000-8000-000000000001";
  assert.deepEqual(
    costSourceRegisterQuery({
      q: "  %_'  ",
      supplier: " SYN ",
      company_id: id,
      state: "Submitted",
      view: "awaiting_my_review",
      validity: "past",
      limit: "100",
      offset: "100",
    }),
    {
      q: "%_'",
      supplier: "SYN",
      company_id: id,
      state: "Submitted",
      view: "awaiting_my_review",
      validity: "past",
      limit: 100,
      offset: 100,
    },
  );
});
