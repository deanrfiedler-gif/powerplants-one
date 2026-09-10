import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseLeadCreate,
  parseLeadConversion,
  parseLeadChange,
  parseLeadPlan,
} from "../../src/crm/leads/validation";
import { leadCreate, leadConvert } from "../helpers/leads";
import { crmBase, crmAction } from "../helpers/crm";
test("Leads accept incomplete manual enquiries without invented shared records", () => {
  const input = {
    ...leadCreate(),
    organisation_id: null,
    site_id: null,
    primary_person_id: null,
    need_summary: null,
    organisation_text: "SYN unverified business",
    contact_text: null,
  };
  const result = parseLeadCreate(input);
  assert.equal(result.organisation_id, null);
  assert.equal(result.need_summary, null);
  assert.throws(() =>
    parseLeadCreate({
      ...input,
      primary_person_id: leadCreate().primary_person_id,
    }),
  );
});
test("conversion rejects owner reassignment, false qualification and ambiguous next actions", () => {
  const id = leadCreate().id,
    input = leadConvert(1);
  assert.equal(parseLeadConversion(id, input).expected_version, 1);
  for (const patch of [
    { owner_id: leadCreate().owner_id },
    { qualification_note: " " },
    { need_summary: "" },
    { expected_version: 0 },
    { stage_id: "Won" },
    { site_id: null, site_unknown_reason: null },
    { activity_id: leadCreate().id },
  ])
    assert.throws(() => parseLeadConversion(id, { ...input, ...patch }));
});
test("lead changes retain explicit lifecycle commands, reasons and strict versions", () => {
  const id = leadCreate().id;
  assert.throws(() =>
    parseLeadChange(id, {
      ...crmBase(),
      expected_version: 1,
      action: "convert",
    }),
  );
  assert.throws(() =>
    parseLeadChange(id, {
      ...crmBase(),
      expected_version: 1,
      action: "note",
      note: "",
    }),
  );
  assert.throws(() =>
    parseLeadPlan(id, {
      ...crmBase(),
      expected_version: 1,
      activity_id: null,
      new_action: { ...crmAction(), due_at: null, due_needed: false },
    }),
  );
});
