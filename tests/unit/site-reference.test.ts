import assert from "node:assert/strict";
import { test } from "node:test";
import {
  siteReference,
  siteReferenceSearch,
} from "../../src/shared/site-reference";

test("Site references preserve numeric identity and both search spellings", () => {
  for (const suffix of ["000001", "000012", "1000000"]) {
    const legacy = `SYN-PPO-SITE-${suffix}`;
    const current = `SYN-SITE-${suffix}`;
    assert.equal(siteReference(legacy), current);
    assert.equal(siteReference(current), current);
    assert.equal(siteReferenceSearch(current), legacy);
    assert.equal(siteReferenceSearch(current.toLowerCase()), legacy);
    assert.equal(siteReferenceSearch(legacy), legacy);
  }
  assert.equal(siteReferenceSearch("SYN-SITE-000"), "SYN-PPO-SITE-000");
  for (const value of [
    "SYN-PPO-WO-000012",
    "MYOB-SITE-000012",
    "SYN-PPO-SITE-12",
    "SYN-SITE-Growers",
    "Hillview",
    "SYN-SITE-000012 annex",
  ]) {
    assert.equal(siteReference(value), value);
    assert.equal(siteReferenceSearch(value), value);
  }
});
