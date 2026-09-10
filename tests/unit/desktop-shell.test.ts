import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../src/platform/errors";
import { actionsForCapabilities, contextualActions } from "../../src/shell/model";
import { collectSearch, searchQuery, type SearchSource } from "../../src/shell/search";

test("global search omits denied domains, strips unrelated fields and bounds each result type", async () => {
  const calls: unknown[] = [];
  const sources: SearchSource[] = [
    { kind: "Denied", path: "/private", label: "title", read: async () => { throw new AppError(403, "Forbidden", "No access"); } },
    { kind: "Customer", path: "/customers", label: "display_name", read: async query => {
      calls.push(query);
      return { items: Array.from({ length: 6 }, (_, i) => ({ id: String(i), display_name: "SYN " + "A".repeat(120), private_note: "Never return", email: "synthetic@example.invalid" })), next_cursor: "opaque" };
    } },
  ];
  const result = await collectSearch("SYN", sources);
  assert.deepEqual(calls, [{ q: "SYN", limit: "5" }]);
  assert.equal(result.items.length, 5); assert.equal(result.has_more, true);
  assert.equal(result.items[0].label.length, 124);
  assert.deepEqual(Object.keys(result.items[0]).sort(), ["href", "id", "kind", "label", "reference"]);
  assert.equal(result.items[0].href, "/customers/0");
});
test("a dependency failure or unavailable record does not become an empty successful search", async () => {
  for (const status of [404, 500, 503]) {
    await assert.rejects(collectSearch("SYN", [{ kind: "Customer", path: "/customers", label: "display_name", read: async () => { throw new AppError(status, "Unavailable", "Unavailable"); } }]), (error: unknown) => error instanceof AppError && error.status === status);
  }
});
test("search rejects unknown inputs, control characters and unbounded queries before reading data", () => {
  assert.equal(searchQuery({ q: "  SYN  " }), "SYN");
  for (const value of [{ q: "a" }, { q: "\nSYN" }, { q: "x".repeat(201) }, { q: 2 }, { q: "SYN", company_id: "untrusted" }]) assert.throws(() => searchQuery(value));
});
test("quick add requires both read and create permission and orders the current module first", () => {
  assert.deepEqual(actionsForCapabilities(new Set(["crm.opportunity.read"])), []);
  assert.deepEqual(actionsForCapabilities(new Set(["crm.opportunity.create"])), []);
  const actions = actionsForCapabilities(new Set(["crm.opportunity.read", "crm.opportunity.create", "activity.read", "activity.edit", "shared.read", "shared.create"]));
  assert.equal(contextualActions(actions, "My Work")[0].id, "activity");
  assert.equal(actions[0].id, "opportunity", "context ordering must not mutate the server list");
  assert.equal(actions.find(action => action.id === "contact")?.href, "/customers/new?kind=person");
  assert.ok(!actions.some(action => ["project", "lead", "estimate"].includes(action.id)));
});

test("Lead quick add requires lead read and create grants", () => {
  assert.deepEqual(actionsForCapabilities(new Set(["crm.lead.read"])), []);
  assert.deepEqual(actionsForCapabilities(new Set(["crm.lead.create"])), []);
  assert.equal(actionsForCapabilities(new Set(["crm.lead.read", "crm.lead.create"]))[0].href, "/crm/leads?create=1");
});
