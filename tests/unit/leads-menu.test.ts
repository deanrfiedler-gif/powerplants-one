import assert from "node:assert/strict";
import { test } from "node:test";
import {
  currentLeadView,
  leadCountQuery,
  leadMenuViews,
  leadViewCount,
  leadViewQuery,
  type LeadCounts,
} from "../../src/components/leads-menu";
import { leadFollowUps, leadViews } from "../../src/crm/leads/register";

const at = (query: string) => new URLSearchParams(query);
const view = (id: string) => leadMenuViews.find((v) => v.id === id)!;
const counts = (over: Partial<LeadCounts["counts"]> = {}, partial = false): LeadCounts => ({
  counts: { Active: 8, MyLeads: 3, New: 3, Contacting: 3, Nurturing: 2, Overdue: 2, NextActionNeeded: 2, Archived: 1, Disqualified: 1, Converted: 4, FollowUpUnavailable: 0, ...over },
  observed_at: "2031-10-01T00:00:00.000Z",
  source: "Synthetic",
  completeness: "Complete",
  count_scope: "AllAuthorisedMatches",
  follow_up_completeness: partial ? "Partial" : "Complete",
  filters: { q: "", status: null, source: null, owner_id: null },
});

test("the menu draws the accepted Figma views in order, in their groups", () => {
  assert.deepEqual(
    leadMenuViews.map((v) => `${v.group ?? "-"}:${v.label}`),
    ["-:Inbox", "-:My leads", "Status:New", "Status:Contacting", "Status:Nurturing", "Follow-up:Overdue", "Follow-up:Next action needed", "Other views:Archived", "Other views:Disqualified", "Other views:Converted"],
  );
});

test("every view is an existing read and count of the Leads backend, never a new rule", () => {
  const countKeys = Object.keys(counts().counts);
  for (const v of leadMenuViews) {
    assert.ok(countKeys.includes(v.count), `${v.id} counts ${v.count}`);
    if (v.params.view) assert.ok((leadViews as readonly string[]).includes(v.params.view), `${v.id} view`);
    if (v.params.follow_up) assert.ok((leadFollowUps as readonly string[]).includes(v.params.follow_up), `${v.id} follow-up`);
    if (v.params.status) assert.ok(["New", "Contacting", "Nurturing"].includes(v.params.status), `${v.id} status`);
    // The backend refuses a follow-up filter on a terminal lifecycle; the menu never asks for one.
    if (v.params.follow_up) assert.equal(v.lifecycle, "Active");
  }
});

test("the address names the open view, and older status links land on their view", () => {
  assert.equal(currentLeadView(at("")).id, "inbox");
  assert.equal(currentLeadView(at("view=Active")).id, "inbox");
  assert.equal(currentLeadView(at("view=MyLeads")).id, "mine");
  assert.equal(currentLeadView(at("status=Contacting&q=SYN")).id, "contacting");
  assert.equal(currentLeadView(at("follow_up=Overdue")).id, "overdue");
  assert.equal(currentLeadView(at("follow_up=NextActionNeeded&status=New")).id, "next-action");
  assert.equal(currentLeadView(at("view=Archived&status=New")).id, "archived");
  assert.equal(currentLeadView(at("view=Converted")).id, "converted");
  assert.equal(currentLeadView(at("view=List")).id, "inbox");
});

test("choosing a view replaces only the menu's parameters and drops the signed cursor", () => {
  const from = "view=Archived&q=SYN&owner_id=u1&source=Email&sort=Name&cursor=abc&status=New";
  assert.equal(leadViewQuery(view("inbox"), from), "q=SYN&owner_id=u1&source=Email&sort=Name");
  assert.equal(leadViewQuery(view("overdue"), from), "q=SYN&owner_id=u1&source=Email&sort=Name&follow_up=Overdue");
  assert.equal(leadViewQuery(view("nurturing"), "follow_up=Overdue"), "status=Nurturing");
  assert.equal(leadViewQuery(view("mine"), ""), "view=MyLeads");
  for (const v of leadMenuViews) assert.equal(currentLeadView(at(leadViewQuery(v, from))).id, v.id);
});

test("counts take the toolbar's filters only, so one open status never zeroes the others", () => {
  assert.equal(leadCountQuery(at("status=New&view=Archived&follow_up=Overdue&sort=Name&cursor=x")), "");
  assert.equal(leadCountQuery(at("q=SYN&source=Email&owner_id=u1&status=New")), "q=SYN&source=Email&owner_id=u1");
});

test("a count is shown only once read, and follow-up counts say when hidden activities make them a floor", () => {
  assert.equal(leadViewCount(view("inbox"), null), null);
  assert.deepEqual(leadViewCount(view("inbox"), counts()), { text: "8", label: "8 leads" });
  assert.deepEqual(leadViewCount(view("archived"), counts()), { text: "1", label: "1 lead" });
  assert.deepEqual(leadViewCount(view("new"), counts({ New: 0 })), { text: "0", label: "0 leads" });
  const partial = counts({ Overdue: 2, FollowUpUnavailable: 1 }, true);
  assert.deepEqual(leadViewCount(view("overdue"), partial), {
    text: "2+",
    label: "At least 2 leads; 1 lead has a next activity you cannot see",
  });
  assert.deepEqual(leadViewCount(view("inbox"), partial), { text: "8", label: "8 leads" });
});
