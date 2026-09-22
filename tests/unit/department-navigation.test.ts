import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { departmentRails, destination, destinations, navigationForCapabilities, railDestinationForLocation, railDestinations, workspaceForLocation, departmentHref, menuGroups } from "../../src/shell/navigation";
import { NavigationIcon, navigationDrawings, type NavigationIconName } from "../../src/components/navigation-icons";
import { moduleWorkspaceForPath } from "../../src/shell/module-workspaces";

test("seven full ordered compositions retain withheld positions and My Work placement", () => {
  const expected = {
    sales: "Pulse|Leads|Deals|Activities|Tasks|Sales Inbox|Contacts|Products|Insights",
    estimate: "My Work|Intake|Estimation wizard|Estimates|Specialist configurations|Supplier pricing|Quotations|Reviews & approvals",
    engineering: "My Work|Engineering workload|Design basis & interfaces|Drawings|Materials & substitutions|Change review|Technical reviews|Commissioning & as-built",
    projects: "My Work|Projects|Programme|Delivery readiness|Risks & issues|Variations & obligations|Site assurance|Acceptance & closeout",
    service: "My Work|Service requests|Work orders|Schedule|Field team|Job packs|Service review|Equipment",
    supply: "My Work|Material demand|Purchasing|Inbound shipments|Receiving|Stock & reservations|Dispatch & delivery|Returns & claims",
    finance: "My Work|Finance handoffs|Customer accounts|Project performance|Claims & obligations|Cash outlook|Reconciliation|Exceptions",
  };
  for (const [workspace, labels] of Object.entries(expected)) assert.equal(departmentRails[workspace as keyof typeof departmentRails].map(id => destination(id).label).join("|"), labels);
  assert.equal(new Set(destinations.map(d => d.id)).size, destinations.length);
});
test("permission and readiness filters retain relative order and never manufacture links", () => {
  const permitted = navigationForCapabilities(new Set(["activity.read", "crm.opportunity.read", "shared.read", "email.read"]), true);
  assert.deepEqual(railDestinations("sales", permitted, true).map(d => d.id), ["pulse", "deals", "calendar", "tasks", "mail", "contacts"]);
  assert.deepEqual(railDestinations("sales", [], true), []);
  assert.deepEqual(railDestinations("supply", ["work", "supply", "stock"], true).map(d => d.id), ["work"]);
  assert.ok(!navigationForCapabilities(new Set(["activity.read"]), true).includes("tasks"));
  assert.ok(!navigationForCapabilities(new Set(["finance.account.read"]), true).includes("accounts"));
  for (const id of ["products", "insights", "drawings", "exceptions"]) assert.equal(destination(id).href, undefined);
});
test("specific routes, genuine views and shared records select exactly their rail parent", () => {
  const check = (path: string, workspace: keyof typeof departmentRails, expected?: string) => {
    const u = new URL(path, "http://local");
    assert.equal(railDestinationForLocation(u.pathname, u.searchParams, workspace), expected, path);
  };
  check("/sales/opportunities/example?view=forecast#record", "sales", "deals");
  check("/sales/opportunities-other", "sales");
  check("/people/example", "sales", "contacts"); check("/customers/example", "sales", "contacts");
  check("/customers/example/account?account_id=a", "sales"); check("/customers/example/account?account_id=a", "finance", "accounts");
  check("/work/reviews", "engineering"); check("/work/123?salesTask=1", "sales", "tasks");
  check("/engineering/package/materials/mapping", "engineering", "materials");
  check("/engineering/package/changes/reviews", "engineering", "changes");
  check("/engineering/commissioning/results?record=a", "engineering", "commissioning");
  check("/projects/acceptance/closeout", "projects", "acceptance");
  check("/projects/programme", "projects", "programme"); check("/projects/abc?view=programme", "projects", "programme");
  check("/estimating/fertigation/example?view=valves", "estimate", "configurations");
  assert.equal(moduleWorkspaceForPath("/estimating/fertigation/example")?.scope, "ppo-fertigation");
  assert.equal(destination("fertigation").href, "/estimating/fertigation");
});
test("shared context is explicit or remembered, independent of customer route spelling", () => {
  assert.equal(workspaceForLocation("/people", new URLSearchParams(), "engineering", ["work", "engineering", "contacts"]), "engineering");
  assert.equal(workspaceForLocation("/customers/a", new URLSearchParams("department=service"), "sales", ["work", "tickets"]), "service");
  assert.equal(workspaceForLocation("/people", new URLSearchParams("department=invalid"), "engineering", ["engineering"]), "engineering");
  assert.equal(departmentHref("/contacts?view=people", "engineering"), "/contacts?view=people&department=engineering");
  assert.equal(departmentHref("/calendar", "sales"), "/calendar?scope=sales&department=sales");
  const ids = menuGroups("", "estimate").flatMap(g => g.items.map(d => d.id));
  assert.equal(new Set(ids).size, ids.length); assert.ok(ids.includes("fertigation")); assert.ok(ids.includes("work"));
});
test("every primary semantic glyph has a deliberate distinct active drawing on the same grid", () => {
  const keys = new Set(Object.values(departmentRails).flat().map(id => destination(id).icon));
  for (const name of keys) {
    assert.ok(Object.hasOwn(navigationDrawings, name), name);
    const outline = renderToStaticMarkup(createElement(NavigationIcon, { name: name as NavigationIconName }));
    const active = renderToStaticMarkup(createElement(NavigationIcon, { name: name as NavigationIconName, active: true }));
    assert.match(outline, /viewBox="0 0 24 24"/); assert.match(active, /viewBox="0 0 24 24"/);
    assert.notEqual(outline.replace('data-variant="outline"', ''), active.replace('data-variant="active"', ''), name);
    assert.ok(!active.includes('d="undefined"'));
  }
  assert.deepEqual(["tasks", "work", "orders", "approvals", "reports"].map(id => destination(id).icon), ["nav-tasks", "nav-work", "nav-orders", "nav-approval", "nav-service-review"]);
});
