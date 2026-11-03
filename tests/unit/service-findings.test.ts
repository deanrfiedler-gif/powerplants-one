import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dueThisWeek,
  withinRecurrenceWindow,
  findingKey,
  findingQuery,
  followUpState,
  inView,
  isOverdue,
  type Finding,
} from "../../src/service/findings/model";

test("Findings query accepts only bounded filters and exact source identities", () => {
  assert.equal(findingQuery({}).view, "open");
  assert.equal(
    findingQuery({ q: "  Pump  ", limit: "50", offset: "2" }).q,
    "pump",
  );
  for (const value of [
    { limit: 51 },
    { limit: 0 },
    { offset: -1 },
    { offset: "1e2" },
    { source: "sql" },
    { view: "ready_to_close" },
    { q: "\u0000" },
    { q: "x".repeat(201) },
    { owner_id: "bad" },
    { sort: "other" },
  ])
    assert.throws(() => findingQuery(value));
  const id = "90000000-0000-4000-8000-000000000001";
  assert.deepEqual(findingKey(`inspection:${id}`), {
    source: "inspection",
    id,
  });
  for (const key of [
    id,
    `unknown:${id}`,
    `schedule:${id}:more`,
    `schedule:bad`,
  ])
    assert.throws(() => findingKey(key));
});

test("Follow-up completion and cancellation do not assert source closure", () => {
  assert.equal(followUpState("Completed"), "FollowUpCompleted");
  assert.equal(followUpState("Cancelled"), "NeedsOwner");
  assert.equal(followUpState(undefined), "NeedsOwner");
  assert.equal(followUpState("InProgress"), "Open");
  const row = {
    state: "FollowUpCompleted",
    action: { status: "Completed" },
    overdue: false,
  } as Finding;
  assert.ok(inView(row, "open"));
  assert.ok(inView(row, "follow_up_completed"));
  assert.ok(!inView(row, "closed"));
  assert.ok(!inView({ ...row, state: "Superseded" }, "open"));
});

test("Overdue compares the retained deadline instant and never active-looking closed work", () => {
  const row = {
    state: "Open",
    action: { status: "Open", due_at: "2026-10-20T13:59:59.999Z" },
  } as Finding;
  assert.equal(isOverdue(row, new Date("2026-10-20T13:59:59.999Z")), false);
  assert.equal(isOverdue(row, new Date("2026-10-21T00:00:00+10:00")), true);
  for (const state of ["Closed", "Superseded"] as const)
    assert.equal(
      isOverdue({ ...row, state }, new Date("2026-10-21T00:00:00Z")),
      false,
    );
  assert.equal(
    isOverdue(
      { ...row, action: { ...row.action!, status: "Cancelled" } },
      new Date("2026-10-21T00:00:00Z"),
    ),
    false,
  );
});


test("SV07 recurring means strictly earlier within an inclusive 90 elapsed days, not a similar title", () => {
 const at="2026-10-31T12:00:00Z",start=new Date(Date.parse(at)-90*86400000).toISOString();
 assert.equal(withinRecurrenceWindow(start,at),true);
 assert.equal(withinRecurrenceWindow(new Date(Date.parse(start)-1).toISOString(),at),false);
 assert.equal(withinRecurrenceWindow(at,at),false);
 assert.equal(withinRecurrenceWindow("2026-11-01T12:00:00Z",at),false);
 const row={state:"Open",recurrence:{earlier:[]}} as unknown as Finding;
 assert.equal(inView(row,"recurring"),false);
 assert.equal(inView({...row,recurrence:{basis:"FailedCheck",partial:false,earlier:[{id:"inspection:prior"} as never]}},"recurring"),true);
 assert.equal(inView({...row,state:"Closed",recurrence:{basis:"FailedCheck",partial:false,earlier:[{id:"inspection:prior"} as never]}},"recurring"),false);
});
test("SV07 site week crosses UTC midnight and DST without changing strict overdue or closing a source",()=>{
 const row={state:"Open",site:{timezone:"Australia/Sydney"},action:{status:"Open",due_at:"2026-10-04T13:00:00Z"}} as Finding;
 const now=new Date("2026-10-04T13:00:00Z"); // Monday midnight after Sydney DST begins.
 assert.equal(dueThisWeek(row,now),true);
 assert.equal(isOverdue(row,now),false);
 assert.equal(dueThisWeek({...row,action:{...row.action!,due_at:"2026-10-04T12:59:59.999Z"}},now),false);
 assert.equal(dueThisWeek({...row,action:{...row.action!,due_at:"2026-10-11T12:59:59.999Z"}},now),true);
 assert.equal(dueThisWeek({...row,action:{...row.action!,due_at:"2026-10-11T13:00:00Z"}},now),false);
 for(const status of ["Completed","Cancelled"])assert.equal(dueThisWeek({...row,action:{...row.action!,status}},now),false);
 for(const state of ["Closed","Superseded"] as const)assert.equal(dueThisWeek({...row,state},now),false);
 assert.equal(inView({...row,due_this_week:true},"due_this_week"),true);
});

// Review 5722367067: filters retain their identity independently of row results.
import {
  findingFacetOptions,
  findingFacetPath,
  findingViewHref,
} from "../../src/service/findings/presentation";

test("SV07 owner and site facets omit only their own filter in the authorised window", () => {
  const query = new URLSearchParams({ view: "open", q: "pump", offset: "25", limit: "25", owner_id: "owner-a", site_id: "site-a", source: "inspection" });
  for (const facet of ["owner_id", "site_id"] as const) {
    const params = new URL(findingFacetPath(query, facet), "https://synthetic.invalid/").searchParams;
    assert.equal(params.has(facet), false);
    for (const [key, value] of query) if (key !== facet) assert.equal(params.get(key), value);
  }
  assert.equal(query.get("owner_id"), "owner-a", "the register's filter must remain applied");
  assert.equal(query.get("site_id"), "site-a");
});

test("SV07 changing owners directly retains other choices and labels through empty and reload states", () => {
  const a = { id: "owner-a", label: "SYN Alex" }, b = { id: "owner-b", label: "SYN Blake" };
  assert.deepEqual(findingFacetOptions([a, b], a), [a, b]);
  assert.deepEqual(findingFacetOptions([a, b], b), [a, b]);
  assert.deepEqual(findingFacetOptions([], b), [b], "empty or pending responses retain the applied label");
  assert.deepEqual(findingFacetOptions([a], b), [a, b]);
  assert.deepEqual(findingFacetOptions([], { id: "", label: "Anyone" }), []);
  const site = { id: "site-a", label: "SYN North" };
  assert.deepEqual(findingFacetOptions([], site), [site]);
  assert.deepEqual(findingFacetOptions([{ ...site, label: "SYN renamed" }], site), [{ ...site, label: "SYN renamed" }]);
});

test("SV07 view links replace the entry view while preserving shell query parameters", () => {
  const href = findingViewHref("department=service&view=overdue", "open");
  const url = new URL(href, "https://synthetic.invalid");
  assert.equal(url.pathname, "/service/findings");
  assert.equal(url.searchParams.get("view"), "open");
  assert.equal(url.searchParams.get("department"), "service");
  assert.equal(url.searchParams.getAll("view").length, 1);
});
