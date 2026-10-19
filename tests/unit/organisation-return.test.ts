import { test } from "node:test";
import assert from "node:assert/strict";
import { organisationReturn } from "../../src/shared/organisation-register-model";
test("CS01 return retains register filters without accepting another destination or a selection", () => {
  assert.equal(organisationReturn(null), "/customers");
  assert.equal(
    organisationReturn(
      "q=SYN&view=NoSite&sort=owner&selected=secret&next=https%3A%2F%2Foutside.example",
    ),
    "/customers?q=SYN&view=NoSite&sort=owner",
  );
  assert.equal(organisationReturn("https://outside.example"), "/customers");
});
