import assert from "node:assert/strict";
import { test } from "node:test";
import type { QueryClient } from "../../src/platform/permissions";
import type { StoredClaim, StoredSource } from "../../src/assistant/model";
import { readerView } from "../../src/assistant/reader-view";
import { answerFooter, claimLine } from "../../src/assistant/answer";

const sources: StoredSource[] = [
  { number: 1, type: "Activity", record_id: "SYN-hidden", source_version: "1", retrieved_at: "2026-10-20T00:00:00Z" },
  { number: 2, type: "Opportunity", record_id: "SYN-open", source_version: "1", retrieved_at: "2026-10-20T00:00:00Z" },
];
const claims: StoredClaim[] = [
  { ordinal: 1, kind: "Fact", text: "SYN Hidden activity statement", source_numbers: [1, 2] },
  { ordinal: 2, kind: "Fact", text: "SYN Open deal statement", source_numbers: [2] },
  { ordinal: 3, kind: "Gap", text: "SYN No delivery date is recorded.", source_numbers: [] },
];
const queried: string[] = [];
const c = { query: async (sql: string) => {
  queried.push(sql);
  if (sql.includes("FROM ppo.activities")) {
    assert.ok(!sql.includes("summary"), "unreadable labels are never selected");
    return { rows: [] };
  }
  if (sql.includes("display_number")) return { rows: [{ display_number: "SYN-OP-1", title: "SYN Open deal" }] };
  return { rows: [{ id: "SYN-open" }] };
} } as unknown as QueryClient;

test("P1 a fact needs every cited source; hidden claims and chips carry no text or identity", async () => {
  const view = await readerView(c, "SYN-workspace", "SYN-reader", claims, sources);
  assert.deepEqual(view.claims[0], { ...claims[0], text: null, withheld: true });
  assert.deepEqual(view.sources[0], { number: 1, can_open: false });
  assert.ok(!JSON.stringify(view).includes("SYN-hidden"));
  assert.ok(!JSON.stringify(view).includes("SYN Hidden activity statement"));
  assert.ok(view.body.includes("A statement from a record you can't open"));
  assert.ok(view.body.includes("SYN Open deal statement [2]"));
  assert.ok(view.body.includes("Gap: SYN No delivery date is recorded."));
  assert.equal(view.claims[2].withheld, false);
  assert.deepEqual(view.sources[1], {
    number: 2, can_open: true, type: "Opportunity", record_id: "SYN-open",
    label: "SYN-OP-1 · SYN Open deal", route: "/sales/opportunities/SYN-open",
  });
});

test("a missing stored citation fails closed without hiding the gaps", async () => {
  const view = await readerView(c, "SYN-workspace", "SYN-reader", claims, []);
  assert.ok(view.claims.slice(0, 2).every(x => x.withheld && x.text === null));
  assert.equal(view.claims[2].text, claims[2].text);
});

test("an open Activity is labelled by its summary; it has no display_number column", async () => {
  const client = { query: async (sql: string) => {
    if (sql.startsWith("SELECT a.id")) return { rows: [{ id: "SYN-activity" }] };
    assert.ok(!sql.includes("display_number"));
    return { rows: [{ title: "SYN Activity summary" }] };
  } } as unknown as QueryClient;
  const view = await readerView(client, "SYN-workspace", "SYN-reader", [claims[0]], [{ ...sources[0], record_id: "SYN-activity" }]);
  assert.deepEqual(view.sources, [{
    number: 1, can_open: true, type: "Activity", record_id: "SYN-activity",
    label: "SYN Activity summary", route: "/work/SYN-activity",
  }]);
});

test("P1 only server-rendered coverage and left-out footer lines survive a reader redraw", () => {
  const prefix = claims.map(claimLine).join("\n");
  const footer = "\nCoverage: 20 Internal Activities shown (limit 20; more exist).\n2 sources left out because not everyone here can see them.";
  assert.equal(answerFooter(prefix + footer, claims), footer);
  assert.equal(answerFooter(prefix + "\nSYN arbitrary hidden prose", claims), "");
  assert.equal(answerFooter("SYN changed prefix" + footer, claims), "");
  assert.equal(answerFooter(prefix + "\nCoverage: SYN secret", claims), "");
});
