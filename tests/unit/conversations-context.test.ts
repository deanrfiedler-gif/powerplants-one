import assert from "node:assert/strict";
import { test } from "node:test";
import { civilDate, mentionedBy, mergeItems, nameList, recordFacts } from "../../src/conversations/context-model";

// Conversations T1c-3 (PPO-CONV-T1C-DESIGN 11): every context item says why it is there.
test("names read as one line, with others counted beyond three", () => {
  assert.equal(nameList([]), "");
  assert.equal(nameList(["Alex"]), "Alex");
  assert.equal(nameList(["Alex", "Sam"]), "Alex and Sam");
  assert.equal(nameList(["Alex", "Sam", "Priya"]), "Alex, Sam and Priya");
  assert.equal(nameList(["Alex", "Sam", "Priya", "Jordan", "Kim"]), "Alex, Sam and 3 others");
  assert.equal(nameList(["Alex", "Alex", "Sam"]), "Alex and Sam");
  assert.equal(mentionedBy(["Alex"]), "Mentioned by Alex");
});

test("an item found twice keeps one entry with both reasons, in the order found", () => {
  const linked = { key: "Project:1", title: "Project PRJ-1 · Pumps", detail: "Active", why: ["Delivered from the deal"], href: "/projects/1" };
  const mentioned = { ...linked, detail: null, why: ["Mentioned by Alex"] };
  const other = { key: "Project:2", title: "Project PRJ-2", detail: null, why: ["Mentioned by Sam"], href: "/projects/2" };
  const merged = mergeItems([linked, other, mentioned, { ...mentioned }]);
  assert.deepEqual(
    merged.map((x) => [x.key, x.why]),
    [
      ["Project:1", ["Delivered from the deal", "Mentioned by Alex"]],
      ["Project:2", ["Mentioned by Sam"]],
    ],
  );
  assert.equal(merged[0].detail, "Active");
  // The inputs are not changed.
  assert.deepEqual(linked.why, ["Delivered from the deal"]);
});

test("the record card names the stage or state, owner, customer, key dates and the reader's own access", () => {
  assert.equal(civilDate("2026-10-30"), "30 Oct 2026");
  assert.equal(civilDate("2028-03-01T00:00:00.000Z"), "1 Mar 2028");
  assert.deepEqual(
    recordFacts({ type: "Opportunity", state: "Quoting", owner: "Alex", customer: "Green Valley · Gatton", dates: [{ label: "Expected close", value: null }] }),
    [
      { label: "Stage", value: "Quoting" },
      { label: "Owner", value: "Alex" },
      { label: "Customer", value: "Green Valley · Gatton" },
      { label: "Expected close", value: "Not set" },
      { label: "Your access", value: "Can open this deal" },
    ],
  );
  assert.deepEqual(
    recordFacts({ type: "Project", state: "Active", owner: "Priya", customer: "", dates: [{ label: "Target date", value: "2028-03-31" }] }),
    [
      { label: "State", value: "Active" },
      { label: "Coordinator", value: "Priya" },
      { label: "Target date", value: "31 Mar 2028" },
      { label: "Your access", value: "Can open this project" },
    ],
  );
});
