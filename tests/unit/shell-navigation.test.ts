import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canOpen,
  destination,
  menuGroups,
  navigationForCapabilities,
  pageForPath,
  workspacePreference,
  workspaces,
} from "../../src/shell/navigation";

test("read-only navigation does not imply creation or elevate an identity", () => {
  const permitted = navigationForCapabilities(
    new Set(["crm.opportunity.read", "shared.read"]),
    true,
  );
  assert.ok(permitted.includes("deals"));
  assert.ok(permitted.includes("contacts"));
  assert.ok(!permitted.includes("projects"));
  assert.ok(!permitted.includes("settings"));
  assert.equal(canOpen(destination("projects"), permitted, true), false);
  assert.equal(canOpen(destination("settings"), ["settings"], true), false);
  assert.equal(canOpen(destination("supply"), ["supply"], true), false);
  assert.deepEqual(navigationForCapabilities(new Set(), true), ["home"]);
});
test("nested pages resolve to their actual workspace instead of a remembered Sales selection", () => {
  assert.equal(
    pageForPath("/projects/example/schedule")?.workspace,
    "projects",
  );
  assert.equal(pageForPath("/engineering/example")?.workspace, "engineering");
  assert.equal(pageForPath("/estimating/discovery/example")?.id, "wizard");
  assert.equal(pageForPath("/service/appointments/example")?.id, "planner");
  assert.equal(pageForPath("/sales/opportunities-other"), undefined);
  assert.equal(pageForPath("/people")?.workspace, undefined);
});
test("seven workspace preferences validate schema and retain r15 identifiers", () => {
  assert.equal(workspaces.length, 7);
  assert.equal(workspaces[0].label, "Sales");
  for (const w of workspaces)
    assert.equal(
      workspacePreference(
        JSON.stringify({ schema_version: 1, workspace: w.id }),
      ),
      w.id,
    );
  for (const raw of [
    null,
    "{",
    '"projects"',
    '{"schema_version":2,"workspace":"projects"}',
    '{"schema_version":1,"workspace":"administrator"}',
  ])
    assert.equal(workspacePreference(raw), "sales");
});
test("More finds workspace names and existing page names, including former rail destinations", () => {
  assert.deepEqual(
    menuGroups("sales").flatMap((g) => g.items.map((d) => d.id)),
    ["deals", "pulse", "leads", "tasks", "mail", "insights"],
  );
  assert.deepEqual(
    menuGroups("Contact").flatMap((g) => g.items.map((d) => d.id)),
    ["contacts"],
  );
  assert.ok(
    menuGroups("service")
      .flatMap((g) => g.items)
      .some((d) => d.id === "packs"),
  );
  assert.deepEqual(menuGroups("no such page"), []);
});
