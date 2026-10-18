import assert from "node:assert/strict";
import { test } from "node:test";
import { applyFilter, filterCounts, groupByRecord, preferredThread, rowState } from "../../src/conversations/sidebar-model";
import type { ThreadSummary } from "../../src/conversations/reads";

const deal = { type: "Opportunity" as const, id: "d1", display_number: "OPP-0142", title: "Green Valley Nursery" };
const project = { type: "Project" as const, id: "p1", display_number: "PRJ-0031", title: "Hillside Packhouse" };
const thread = (id: string, over: Partial<ThreadSummary> = {}): ThreadSummary => ({
  id,
  title: `Thread ${id}`,
  anchor: deal,
  is_main: false,
  state: "Open",
  version: 1,
  last_sequence: 1,
  last_message_at: "2026-10-18T00:00:00.000Z",
  participating: true,
  unread: false,
  waiting_on_you: 0,
  mentions_you: false,
  ...over,
});

test("groupByRecord keeps the newest record first and names it", () => {
  const items = [thread("a", { anchor: project }), thread("b"), thread("c", { anchor: project })];
  const groups = groupByRecord(items);
  assert.deepEqual(
    groups.map((g) => [g.heading, g.threads.map((t) => t.id)]),
    [
      ["Project PRJ-0031 · Hillside Packhouse", ["a", "c"]],
      ["Deal OPP-0142 · Green Valley Nursery", ["b"]],
    ],
  );
});

test("filterCounts counts threads waiting on you and threads that mention you", () => {
  const items = [thread("a", { waiting_on_you: 2 }), thread("b", { mentions_you: true }), thread("c", { waiting_on_you: 1, mentions_you: true })];
  assert.deepEqual(filterCounts(items), { waiting: 2, mentions: 2 });
});

test("applyFilter narrows by filter, then by search on title or record number", () => {
  const items = [
    thread("a", { title: "Where is Green Valley at?", waiting_on_you: 1 }),
    thread("b", { title: "Commissioning access", anchor: project }),
    thread("c", { title: "Site survey booking", mentions_you: true }),
  ];
  assert.deepEqual(applyFilter(items, "WaitingOnYou", "").map((t) => t.id), ["a"]);
  assert.deepEqual(applyFilter(items, "Mentions", "").map((t) => t.id), ["c"]);
  assert.deepEqual(applyFilter(items, "All", "prj-0031").map((t) => t.id), ["b"]);
  assert.deepEqual(applyFilter(items, "All", "SURVEY").map((t) => t.id), ["c"]);
});

test("rowState shows Waiting on you, Resolved or Open", () => {
  assert.equal(rowState(thread("a", { waiting_on_you: 1 })), "Waiting on you");
  assert.equal(rowState(thread("b", { state: "Resolved", waiting_on_you: 1 })), "Resolved");
  assert.equal(rowState(thread("c")), "Open");
});

test("preferredThread opens a thread waiting on you first", () => {
  assert.equal(preferredThread([thread("a"), thread("b", { waiting_on_you: 1 })]), "b");
  assert.equal(preferredThread([thread("a"), thread("b")]), "a");
  assert.equal(preferredThread([]), null);
});
