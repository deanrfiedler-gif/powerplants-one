import assert from "node:assert/strict";
import { test } from "node:test";
import { discoveryFixture } from "../helpers/discovery-register";
import {
  costLabel,
  discoveryViews,
  matchesDiscoveryView,
  readiness,
  selectedOption,
} from "../../src/estimating/discovery-register-model";
test("ES-02 views overlap over workspaces and include archived alternatives", () => {
  const { items } = discoveryFixture();
  assert.deepEqual(
    discoveryViews.map(
      (v) =>
        items.filter((r) => matchesDiscoveryView(r, v.id, "Dean Fiedler"))
          .length,
    ),
    [8, 3, 1, 2, 4, 1, 1, 3, 3],
  );
  items[5].options[1].state = "Archived";
  assert.equal(
    matchesDiscoveryView(items[5], "Alternatives", "Dean Fiedler"),
    true,
  );
  assert.equal(readiness(selectedOption(items[6])), "Legacy manual");
});
test("ES-02 unknown cost access cannot become a ready or not-costed claim", () => {
  const row = discoveryFixture().items[3];
  row.cost = { status: "Unavailable" };
  assert.equal(matchesDiscoveryView(row, "Ready", "Dean Fiedler"), false);
  assert.equal(matchesDiscoveryView(row, "NotCosted", "Dean Fiedler"), false);
  assert.equal(costLabel(row), "Cost basis unavailable");
  row.cost = { status: "NoEstimate" };
  assert.equal(matchesDiscoveryView(row, "Ready", "Dean Fiedler"), true);
});
test("ES-02 saved estimates retain their exact older basis and never sum alternatives", () => {
  const row = discoveryFixture().items[7];
  assert.equal(costLabel(row), "v4 on r02 · r03 not costed");
  if (row.cost.status !== "Available") throw Error("fixture");
  row.cost.latest_costed = true;
  assert.equal(matchesDiscoveryView(row, "NotCosted", "Dean Fiedler"), false);
  assert.equal(matchesDiscoveryView(row, "Ready", "Dean Fiedler"), false);
});
