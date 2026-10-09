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
  assert.equal(canOpen(destination("supply"), permitted, true), false);
  assert.equal(canOpen(destination("supply"), navigationForCapabilities(new Set(["supply.read"]),true), true), true);
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
    ["deals", "pulse", "leads", "tasks", "mail", "sales-estimating", "sales-won", "sales-aftercare", "insights"],
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
test("AU-08 the Service rail is grouped without reordering, and other rails stay flat", async () => {
  const { groupedRail, departmentRails, railGroups } = await import("../../src/shell/navigation");
  const items = departmentRails.service.map((id) => ({ id }));
  const sections = groupedRail("service", items);
  assert.deepEqual(sections.flatMap((s) => s.items.map((i) => i.id)), [...departmentRails.service]);
  assert.deepEqual(sections.map((s) => s.label), [undefined, "Requests and scheduling", "Field and inspections", "Assets and aftercare"]);
  for (const group of railGroups.service!) for (const id of group.ids) assert.ok(departmentRails.service.includes(id), id);
  const technician = groupedRail("service", items.filter((i) => ["jobs", "inspection-capture"].includes(i.id)));
  assert.deepEqual(technician, [{ label: "Field and inspections", items: [{ id: "jobs" }, { id: "inspection-capture" }] }]);
  assert.deepEqual(groupedRail("sales", [{ id: "pulse" }]), [{ label: undefined, items: [{ id: "pulse" }] }]);
});
test("NR-18 a working company narrows scoped checks for its own actor only, and only inside a request", async () => {
  const { scopeSql } = await import("../../src/platform/permissions");
  const { withWorkingCompany, workingCompanyFor } = await import("../../src/platform/working-company");
  const actor = "30000000-0000-4000-8000-000000000009", company = "20000000-0000-4000-8000-000000000002";
  assert.doesNotMatch(scopeSql("o.company_id"), /working|AND \(g\.user_id<>/);
  withWorkingCompany(actor, company, () => {
    const sql = scopeSql("o.company_id", "o.site_id", "crm.opportunity.read");
    assert.match(sql, /g\.scope_type='Workspace' OR \(g\.company_id=o\.company_id/);
    assert.ok(sql.includes(`AND (g.user_id<>'${actor}'::uuid OR o.company_id IS NULL OR o.company_id='${company}'::uuid)`));
    assert.equal(workingCompanyFor(actor), company);
    assert.equal(workingCompanyFor("30000000-0000-4000-8000-000000000001"), null);
  });
  // Anything that is not a UUID is ignored rather than written into SQL.
  withWorkingCompany(actor, "x' OR true --", () => assert.doesNotMatch(scopeSql("o.company_id"), /OR true/));
});

test("NR-18 a choice entered while resolving the identity reaches the rest of that request only", async () => {
  const { enterWorkingCompany, withRequestScope, workingCompanyFor } = await import("../../src/platform/working-company");
  const actor = "30000000-0000-4000-8000-000000000009", company = "20000000-0000-4000-8000-000000000002";
  const resolve = async () => {
    await new Promise((done) => setTimeout(done, 1));
    enterWorkingCompany(actor, company);
  };
  const seen = await withRequestScope(async () => {
    await resolve();
    await Promise.resolve();
    return workingCompanyFor(actor);
  });
  assert.equal(seen, company);
  assert.equal(await withRequestScope(async () => workingCompanyFor(actor)), null);
  // Outside any request there is nothing to enter into.
  enterWorkingCompany(actor, company);
  assert.equal(workingCompanyFor(actor), null);
});
