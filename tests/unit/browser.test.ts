import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSupportedBrowser } from "../../src/platform/browser";

test("rendering refuses the affected Chromium build and unreviewed browser majors", () => {
  for (const version of [
    "153.0.8010.12",
    "153.0.8010.35",
    "152.9.9999.9999",
    // Each reviewed major keeps its own earliest accepted patch.
    "154.0.8037.0",
    "154.0.8036.99",
    "154.0.8037.56",
    "155.0.8059.0",
    "155.0.8058.999",
    "155.0.8059.38",
    // A major beyond the reviewed set stays refused until it is reviewed.
    "156.0.0.0",
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
    "154.0.8037.57",
    "154.0.8037.58",
    "154.0.8038.0",
    "154.1.0.0",
    "155.0.8059.39",
    "155.0.8059.40",
    "155.0.8060.0",
    "155.1.0.0",
  ]) {
    assert.doesNotThrow(() => assertSupportedBrowser(version));
  }
});

test("unsupported browser diagnostics identify the actual installed version", () => {
  assert.throws(
    () => assertSupportedBrowser("156.0.0.0"),
    /Received "156\.0\.0\.0"/,
  );
});
