import assert from "node:assert/strict";
import { test } from "node:test";
import { peopleOptions } from "../../src/conversations/picker-options";

const people = [
  { id: "person-carl", display_name: "Carl Jensen", role: "Role not recorded" },
];
test("T2c picker uses only server availability and distinguishes Carl from a person named Carl", () => {
  assert.equal(
    peopleOptions({ items: people, agent: null }, false, "Carl").length,
    1,
  );
  const options = peopleOptions(
    { items: people, agent: { name: "Carl", label: "Carl · AI assistant" } },
    false,
    "Carl",
  );
  assert.deepEqual(
    options.map((o) => o.label),
    ["Carl · AI assistant", "Carl Jensen"],
  );
  assert.deepEqual(options[0].mention("tag"), { key: "tag", kind: "Agent" });
  assert.match(options[1].detail!, /Person · Role not recorded/);
  assert.equal(
    peopleOptions(
      { items: people, agent: { name: "Carl", label: "Carl · AI assistant" } },
      true,
      "",
    ).length,
    1,
  );
});
