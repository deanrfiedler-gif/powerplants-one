import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSupportedBrowser } from "../../src/platform/browser";

test("rendering refuses the affected Chromium build and unreviewed browser majors", () => {
  for (const version of [
    "153.0.8010.12",
    "153.0.8010.35",
    "152.9.9999.9999",
    "154.0.8037.0",
    "153.0.8010",
    "Chrome/153.0.8010.36",
    "153.0.8010.36\n",
    "153.0.8010.999999999999999999999",
  ]) {
    assert.throws(() => assertSupportedBrowser(version));
  }
  for (const version of [
    "153.0.8010.36",
    "153.0.8010.37",
    "153.0.8010.100",
    "153.0.8011.0",
  ]) {
    assert.doesNotThrow(() => assertSupportedBrowser(version));
  }
});
