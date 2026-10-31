import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  moduleWorkspaceForPath,
  moduleWorkspaces,
} from "../../src/shell/module-workspaces";

const id = "0f8fad5b-d9cb-469f-a165-70867728950e";

test("the route table has one line per route, sorted by route", () => {
  const routes = moduleWorkspaces.map((w) => w.route);
  assert.deepEqual(
    routes,
    [...routes].sort(),
    "Insert a new route in sorted position, not at the top or the bottom",
  );
  assert.equal(new Set(routes).size, routes.length);
  const lines = readFileSync("src/shell/module-workspaces.ts", "utf8")
    .split("\n")
    .filter((line) => /^\s*\{\s*route:/.test(line));
  assert.equal(lines.length, routes.length, "One entry per line");
});

test("an exact route wins, then a record pattern, then the module rules", () => {
  const baseline = (path: string) => moduleWorkspaceForPath(path)?.baseline;
  assert.equal(baseline("/service/packs/new"), "job-pack-figma-preparation");
  assert.equal(baseline("/service/packs/" + id), "job-pack-figma-record");
  assert.equal(baseline("/service/packs"), "job-pack-figma-register");
  // Both estimate-wizard entries could answer a discovery record; its own pattern does.
  assert.equal(baseline("/estimating/discovery/" + id), "es02-r01");
  assert.equal(
    baseline("/estimating/discovery/" + id + "/costing"),
    "es02-costing-figma",
  );
  assert.equal(baseline("/surveys/" + id), "cs08-native-r01");
  assert.equal(
    baseline("/estimating/fertigation/example"),
    "fertigation-native-r01",
  );
  assert.equal(baseline("/service/packs/not-an-id"), undefined);
});
