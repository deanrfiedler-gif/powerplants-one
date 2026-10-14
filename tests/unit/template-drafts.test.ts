import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bodyInput,
  reviewInput,
  bindingCatalogue,
} from "../../src/documents/drafts/validation";
import { randomUUID } from "node:crypto";
const body = {
  schema_version: 1,
  title: "SYN proposal",
  audience: "Internal",
  fields: [
    { key: "site", label: "Site", binding: "site.name", required: true },
  ],
};
test("DK06 R2 refuses executable constructs, wrong-family bindings, duplicate keys and oversized proposals", () => {
  for (const bad of [
    { ...body, html: "<script/>" },
    { ...body, conditions: [] },
    { ...body, fields: [{ ...body.fields[0], condition: false }] },
    { ...body, fields: [...body.fields, ...body.fields] },
    { ...body, fields: Array(41).fill(body.fields[0]) },
    { ...body, fields: [{ ...body.fields[0], binding: "__proto__" }] },
    { ...body, fields: [{ ...body.fields[0], binding: "../../private" }] },
    { ...body, audience: "Customer" },
  ])
    assert.throws(() => bodyInput(bad, "OUT-09"), { code: "InvalidData" });
  assert.throws(() => bodyInput(body, "OUT-14"), { code: "InvalidData" });
  assert.deepEqual(bodyInput(body, "OUT-09"), body);
  assert.equal(
    bodyInput({ ...body, audience: "Customer" }, "OUT-10").audience,
    "Customer",
  );
  assert.equal(
    Object.values(bindingCatalogue["OUT-14"]).every(
      (x) => x.audience === "Internal",
    ),
    true,
  );
});
test("DK06 R2 review observations require all explicit results; failing/unknown observations cannot mark Reviewed", () => {
  const cmd = {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "SYN exact review",
    review_id: randomUUID(),
    revision_id: randomUUID(),
    content_hash: "a".repeat(64),
    expected_version: 1,
    outcome: "Reviewed",
    checks: {
      schema: { result: "Pass", note: "Schema inspected." },
      source_bindings: { result: "Pass", note: "Sources inspected." },
      audience: { result: "Pass", note: "Audience inspected." },
    },
  };
  assert.equal(reviewInput(cmd).outcome, "Reviewed");
  for (const result of ["Fail", "Blocked", "NotRun"]) {
    const changed = {
      ...cmd,
      checks: {
        ...cmd.checks,
        audience: { result, note: "SYN needs correction." },
      },
    };
    assert.throws(() => reviewInput(changed), { code: "InvalidData" });
    assert.equal(
      reviewInput({ ...changed, outcome: "ChangesRequested" }).outcome,
      "ChangesRequested",
    );
  }
  assert.throws(
    () => reviewInput({ ...cmd, checks: { schema: cmd.checks.schema } }),
    { code: "InvalidData" },
  );
  assert.throws(() => reviewInput({ ...cmd, publish: true }), {
    code: "InvalidData",
  });
});
