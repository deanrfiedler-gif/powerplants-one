import assert from "node:assert/strict";
import { test } from "node:test";
import { breadcrumb, type BreadcrumbInput } from "../../src/shell/breadcrumb";
import { destinations } from "../../src/shell/navigation";

// Shell top bar amendment (16 October 2026), R1–R8. Routes follow the "After" column of the before and
// after table on the Figma page; synthetic references only.
const everything = destinations.map((item) => item.id);
const read = (path: string, extra: Partial<BreadcrumbInput> = {}) => {
  const [pathname, search = ""] = path.split("?");
  return breadcrumb({
    path: pathname,
    query: new URLSearchParams(search),
    record: null,
    signedIn: true,
    permitted: everything,
    hosted: false,
    preference: "estimate",
    ...extra,
  });
};
const labels = (path: string, extra?: Partial<BreadcrumbInput>) => read(path, extra).crumbs.map((crumb) => crumb.label);
const record = (reference: string, title = "SYN Glasshouse 4 fit-out") => ({ record: { reference, title } });
const pkg = "10000000-0000-4000-8000-0000000000e1";

test("R1: a top-level page shows its own name only", () => {
  for (const [path, name] of [
    ["/work", "My Work"],
    ["/sales/leads", "Leads"],
    ["/sales/opportunities", "Deals"],
    ["/estimating", "Intake & workload"],
    ["/estimating/discovery", "Estimation wizard"],
    ["/estimating/cost-sources", "Cost sources"],
    ["/estimating/quotes", "Quotations"],
    ["/estimating/rules", "Rules studio"],
    ["/engineering", "Engineering workload"],
    ["/service/work-orders", "Work orders"],
    ["/service/packs", "Job packs"],
    ["/my-jobs", "My jobs"],
    ["/schedule", "Schedule"],
    ["/search", "Search"],
  ]) assert.deepEqual(labels(path), [name], path);
});

test("R2 and R4: a record shows its owner as a link, then its reference alone", () => {
  for (const [path, reference, owner, href] of [
    ["/sales/leads/l1", "Sales / SYN-PPO-LEAD-000143", "Leads", "/sales/leads"],
    ["/sales/opportunities/o1", "Sales / SYN-PPO-OPP-000326", "Deals", "/sales/opportunities"],
    ["/products/p1", "SYN-PROD-CP40", "Products", "/products"],
    ["/projects/p1", "Projects / SYN-PPO-PRJ-000027", "Projects", "/projects"],
    ["/service/work-orders/w1", "Service / SYN-PPO-WO-000041", "Work orders", "/service/work-orders"],
    ["/service/packs/k1", "SYN-PPO-PACK-000052", "Job packs", "/service/packs"],
    ["/my-jobs/w2", "SYN-PPO-WO-000040", "My jobs", "/my-jobs"],
    ["/engineering/e1", "SYN-PPO-ENG-000003", "Engineering workload", "/engineering"],
  ]) {
    const { crumbs } = read(path, record(reference));
    assert.deepEqual(crumbs.map((crumb) => crumb.label), [owner, reference.split(" / ").at(-1)], path);
    assert.equal(crumbs[0].href, href, path);
    assert.equal(crumbs[1].href, undefined, `${path}: the current item is not a link`);
    assert.equal(crumbs[1].kind, "record");
  }
});

test("R2: a page beneath something names its nearest owner, never a page type", () => {
  assert.deepEqual(labels("/work/actions"), ["My Work", "My actions"]);
  assert.equal(read("/work/actions").crumbs[0].href, "/work");
  assert.deepEqual(labels("/schedule/travel"), ["Schedule", "Travel review"]);
  assert.deepEqual(labels("/estimating/estimates/e1"), ["Intake & workload", "Saved estimate"]);
  // With the record loaded, the page type gives way to the reference beneath the same list.
  assert.deepEqual(labels("/estimating/estimates/e1", record("SYN-PPO-EST-000010")), ["Intake & workload", "SYN-PPO-EST-000010"]);
  const workbench = read("/estimating/configurations/c1/configure", record("SYN-PPO-CFG-000004"));
  assert.deepEqual(workbench.crumbs.map((crumb) => crumb.label), ["Specialist configurations", "Screen Configurator Workbench"]);
  assert.equal(workbench.crumbs[0].href, "/estimating/configurations");
  assert.deepEqual(labels("/estimating/fertigation/f1", record("SYN-PPO-FRT-000001")), ["Scope register", "SYN-PPO-FRT-000001"]);
});

test("R3 and R5: never the department, never more than two, never a register's default view", () => {
  assert.deepEqual(labels("/projects"), ["Projects"]);
  assert.deepEqual(labels("/projects/acceptance"), ["Acceptance & closeout"]);
  assert.deepEqual(labels(`/engineering/${pkg}/materials`), ["Released Materials & Substitutions"]);
  assert.deepEqual(labels(`/engineering/${pkg}/changes`), ["Engineering Change-Impact Review"]);
  assert.deepEqual(labels(`/engineering/${pkg}/drawings`), ["Drawings & controlled documents"]);
  const impact = read(`/engineering/${pkg}/changes/impact`);
  assert.deepEqual(impact.crumbs.map((crumb) => crumb.label), ["Engineering Change-Impact Review", "Impact assessment"]);
  assert.equal(impact.crumbs[0].href, `/engineering/${pkg}/changes`);
  const deliverables = read(`/engineering/${pkg}/drawings/deliverables`);
  assert.deepEqual(deliverables.crumbs.map((crumb) => crumb.label), ["Drawings & controlled documents", "Accountable deliverables"]);
  assert.equal(deliverables.crumbs[0].href, `/engineering/${pkg}/drawings`);
  const basis = read("/engineering/commissioning/basis?package=p1");
  assert.deepEqual(basis.crumbs.map((crumb) => crumb.label), ["Commissioning Basis & As-Built Release", "Test basis & criteria"]);
  assert.equal(basis.crumbs[0].href, "/engineering/commissioning?package=p1");
  const paths = ["/work", "/work/actions", "/sales/leads/l1", "/service/work-orders/w1", "/estimating/estimates/e1", `/engineering/${pkg}/changes/impact`, "/estimating/configurations/c1/configure", "/projects/acceptance/readiness", "/customers/c1/account"];
  for (const path of paths) {
    const { crumbs } = read(path, record("Service / SYN-PPO-WO-000041"));
    assert.ok(crumbs.length >= 1 && crumbs.length <= 2, path);
    // The department is the trail's "root" entry; it is never shown.
    assert.ok(!crumbs.some((crumb) => crumb.key === "root"), path);
  }
});

test("R6 and R8: the full path stays in the trail, and the tab title keeps the department", () => {
  const order = read("/service/work-orders/w1", record("Service / SYN-PPO-WO-000041", "SYN Pump replacement"));
  assert.deepEqual(order.trail.map((crumb) => crumb.label), ["Service", "Work orders", "SYN-PPO-WO-000041 · SYN Pump replacement"]);
  assert.equal(order.trail[0].href, "/service/tickets");
  assert.equal(order.trail.at(-1)!.href, undefined);
  assert.equal(order.title, "SYN-PPO-WO-000041 · SYN Pump replacement · Work orders · Service — Powerplants One");
  assert.equal(order.hierarchy, true);
  const materials = read(`/engineering/${pkg}/materials`);
  assert.deepEqual(materials.trail.map((crumb) => crumb.label), ["Engineering", "Released Materials & Substitutions", "Materials register"]);
  assert.equal(materials.title, "Materials register · Engineering — Powerplants One");
  // Q3: Page hierarchy stays wherever main offered it; the Projects register's design has none.
  assert.equal(read("/work").hierarchy, true);
  assert.equal(read("/projects").hierarchy, false);
  assert.equal(read("/").crumbs.length, 0);
});

test("R2 and R4 on CPQ records: Configure & price and Rules studio own the reference the page publishes", () => {
  // Table 1040:62: "Configure & price / SYN-CPQ-000014" and "Rules studio / INST-SUP-001". A configuration
  // has no reference of its own, so its page publishes its deal's; the rule editor publishes the rule key.
  const configuration = read("/estimating/cpq/w1", record("SYN-PPO-OPP-000326", "SYN Controls upgrade qualification · Option A"));
  assert.deepEqual(configuration.crumbs.map((crumb) => [crumb.label, crumb.href]), [["Configure & price", "/estimating/cpq"], ["SYN-PPO-OPP-000326", undefined]]);
  assert.equal(configuration.title, "SYN-PPO-OPP-000326 · SYN Controls upgrade qualification · Option A · Configure & price · Estimating & quotation — Powerplants One");
  const rule = read("/estimating/rules/r1?rule=INST-SUP-001", record("INST-SUP-001", "Support spacing"));
  assert.deepEqual(rule.crumbs.map((crumb) => [crumb.label, crumb.href]), [["Rules studio", "/estimating/rules"], ["INST-SUP-001", undefined]]);
  assert.equal(rule.title, "INST-SUP-001 · Support spacing · Rules studio · Estimating & quotation — Powerplants One");
  // Nothing published while loading, after a denial or on a new rule set: the destination alone, never the URL's ID.
  for (const [path, name] of [["/estimating/cpq/w1", "Configure & price"], ["/estimating/rules/r1?rule=INST-SUP-001", "Rules studio"], ["/estimating/rules/new", "Rules studio"]])
    assert.deepEqual(labels(path), [name], path);
});

test("an owner the person cannot open is named without a link, and a signed-out view shows no record", () => {
  const limited = read("/service/work-orders/w1", { ...record("SYN-PPO-WO-000041"), permitted: everything.filter((id) => id !== "orders") });
  assert.deepEqual(limited.crumbs.map((crumb) => [crumb.label, crumb.href]), [["Work orders", undefined], ["SYN-PPO-WO-000041", undefined]]);
  assert.deepEqual(labels("/service/work-orders/w1", { ...record("SYN-PPO-WO-000041"), signedIn: false }), ["Work orders"]);
});
