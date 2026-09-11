import assert from "node:assert/strict";
import { test } from "node:test";
import {
  opportunityAmount,
  parseDealInformation,
  parseDealScope,
  parseDealStage,
} from "../../src/crm/refinement-validation";
import { parseDirectory } from "../../src/crm/directory";
import { CRM, crmBase } from "../helpers/crm";
test("deal value preserves zero, cents and unknown; rejects malformed and out-of-range money", () => {
  for (const [input, output] of [
    [null, null],
    ["", null],
    ["0", "0.00"],
    ["1,234.5", "1234.50"],
    ["999999999.99", "999999999.99"],
  ])
    assert.equal(opportunityAmount(input), output);
  for (const value of [
    undefined,
    NaN,
    12,
    "NaN",
    "Infinity",
    "-1",
    "1e4",
    "1,2",
    "1.001",
    "1000000000",
    "0x12",
  ])
    assert.throws(() => opportunityAmount(value));
});
test("core deal editor enforces identity or explained unknown and a real date", () => {
  const input = {
    ...crmBase(),
    expected_version: 1,
    title: "SYN Deal",
    primary_person_id: CRM.person,
    contact_unknown_reason: null,
    value_amount: "0",
    expected_close_date: "2028-02-29",
  };
  assert.equal(
    parseDealInformation(CRM.org, input).expected_close_date,
    "2028-02-29",
  );
  assert.throws(() =>
    parseDealInformation(CRM.org, {
      ...input,
      expected_close_date: "2026-02-29",
    }),
  );
  assert.throws(() =>
    parseDealInformation(CRM.org, { ...input, primary_person_id: null }),
  );
  assert.throws(() =>
    parseDealInformation(CRM.org, { ...input, owner_id: CRM.owner }),
  );
  assert.equal(
    parseDealInformation(CRM.org, {
      ...input,
      primary_person_id: null,
      contact_unknown_reason: "Awaiting introduction",
    }).primary_person_id,
    null,
  );
});
test("scope is explicit; qualification still requires an outcome; arbitrary stage IDs are rejected", () => {
  assert.throws(() =>
    parseDealScope(CRM.org, {
      ...crmBase(),
      expected_version: 1,
      need_summary: "Need",
      scope_details: { unexpected: "x" },
    }),
  );
  const scope = parseDealScope(CRM.org, {
    ...crmBase(),
    expected_version: 1,
    need_summary: "Need",
    scope_details: { inclusions: "Controls" },
  });
  assert.equal(scope.scope_details.inclusions, "Controls");
  assert.equal(scope.scope_details.exclusions, null);
  for (const stage_id of ["Won", "Lead", "Qualified"])
    assert.throws(() =>
      parseDealStage(CRM.org, { ...crmBase(), expected_version: 1, stage_id }),
    );
  assert.equal(
    parseDealStage(CRM.org, {
      ...crmBase(),
      expected_version: 1,
      stage_id: "Enquiry",
    }).qualification_note,
    null,
  );
});
test("directory restricts query keys, sorts, paging and person owner ambiguity", () => {
  assert.equal(parseDirectory({ kind: "people" }).sort, "name");
  for (const input of [
    { kind: "people", mine: "true" },
    { kind: "organisations", mine: true },
    { kind: "people", sort: "owner" },
    { kind: "organisations", sort: "name;DROP TABLE" },
    { kind: "people", page: "0" },
    { kind: "people", limit: "1000" },
    { kind: "people", status: "Prospect" },
    { kind: "people", q: "x\u0000" },
    { kind: "people", company_id: CRM.company },
  ])
    assert.throws(() => parseDirectory(input));
});
