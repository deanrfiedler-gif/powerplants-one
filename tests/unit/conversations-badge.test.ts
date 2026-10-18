import assert from "node:assert/strict";
import { test } from "node:test";
import { conversationBadgeLabel } from "../../src/conversations/badge";

// D7 (PPO-CONV-T1C-DESIGN 10.1): nothing at zero, the count up to nine, "9+" above nine.
test("the Conversations badge shows the count, 9+ above nine and nothing at zero", () => {
  assert.equal(conversationBadgeLabel(undefined), null);
  assert.equal(conversationBadgeLabel(0), null);
  assert.equal(conversationBadgeLabel(1), "1");
  assert.equal(conversationBadgeLabel(9), "9");
  assert.equal(conversationBadgeLabel(10), "9+");
  assert.equal(conversationBadgeLabel(250), "9+");
});
