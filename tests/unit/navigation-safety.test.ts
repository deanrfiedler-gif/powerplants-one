import assert from "node:assert/strict";
import { test } from "node:test";
import { availableWorkspaces, workspaceLanding, homeHref, navigationForCapabilities, menuGroups, activitiesHref, departmentHref, pageForPath, railDestinationForLocation } from "../../src/shell/navigation";
import { packReviewerCapabilities } from "../../src/platform/demo-roles";
import { registerNavigationReview, navigateWithReview } from "../../src/components/navigation-intent";
test("N04/N05 permitted landing uses operational ownership without adding grants", () => {
  for (const [caps, workspace, href] of [
    [["crm.lead.read"], "sales", "/sales/leads"], [["field.read.own"], "service", "/my-jobs"],
    [["maintenance.read"], "service", "/maintenance/agreements"], [packReviewerCapabilities, "service", "/service/tickets"],
  ] as const) {
    const grants = new Set(caps), original = [...grants], nav = navigationForCapabilities(grants,true);
    assert.deepEqual(availableWorkspaces(nav,true).map(w => w.id), [workspace]);
    assert.equal(workspaceLanding(workspace,nav,true)?.href,href);
    assert.equal(homeHref(nav,true),href); assert.deepEqual([...grants],original);
  }
  const personal = navigationForCapabilities(new Set(["activity.read"]),true);
  assert.deepEqual(availableWorkspaces(personal,true),[]); assert.equal(homeHref(personal,true),"/work");
  assert.equal(homeHref(navigationForCapabilities(new Set(),true),true),null);
});
test("N06 inspection discovery requires both capabilities; record scope remains separate", () => {
  for (const caps of [[],["report.read"],["service.work_order.edit"]]) assert.ok(!navigationForCapabilities(new Set(caps),true).includes("inspection-review"));
  assert.ok(navigationForCapabilities(new Set(["report.read","service.work_order.edit"]),true).includes("inspection-review"));
});
test("N11/N15 blank More exposes operational entries and vocabulary finds canonical pages", () => {
  for (const [workspace,id] of [["estimate","intake"],["service","inspection-capture"],["service","incidents"],["service","inspection-review"]] as const)
    assert.ok(menuGroups("",workspace).flatMap(g=>g.items).some(d=>d.id===id));
  for(const [query,id] of [["opportunity","deals"],["customer","customers"],["asset","equipment"],["planner","planner"]])
    assert.ok(menuGroups(query).flatMap(g=>g.items).some(d=>d.id===id));
});
test("N12 Sales Activities keeps one day/scope/department policy", () => {
  const day="2026-10-08", expected=activitiesHref(day);
  assert.equal(departmentHref(`/calendar?day=${day}`,"sales"),expected);
  assert.equal(departmentHref("/calendar","sales",day),expected);
  assert.equal(menuGroups("calendar","service").flatMap(g=>g.items).find(d=>d.id==="calendar")?.label,"Personal Calendar");
  assert.equal(new URL(activitiesHref(day,false),"https://ppo.invalid").searchParams.get("scope"),null);
  for(const invalid of ["2026-02-30","2026-99-99","../work"]) assert.equal(activitiesHref(invalid),activitiesHref());
});
test("N14/N22 specific task identity and parent precede generic prefixes", () => {
  const id="10000000-0000-4000-8000-000000000001";
  for(const [path,label] of [[`/estimating/estimates/${id}/review`,"Estimate review"],[`/customers/${id}/account`,"Customer Finance account"],["/products/import","Product import"],["/schedule/changes","Scheduling change follow-up"],["/my-jobs/site-readiness","Field site readiness"]]) assert.equal(pageForPath(path)?.label,label);
  assert.equal(railDestinationForLocation("/engineering/commissioning/basis",new URLSearchParams(),"engineering"),"commissioning");
});
test("N07/N08 leave review cancels all transition side effects and preserves stronger review", () => {
  let pushes=0,preferences=0;
  const generic=registerNavigationReview(run=>run(),10), strong=registerNavigationReview(()=>{},100);
  navigateWithReview(()=>{pushes++;preferences++;}); assert.equal(pushes,0);assert.equal(preferences,0);
  strong(); navigateWithReview(()=>{pushes++;preferences++;}); assert.equal(pushes,1); assert.equal(preferences,1);
  generic(); navigateWithReview(()=>pushes++); assert.equal(pushes,2);
});
