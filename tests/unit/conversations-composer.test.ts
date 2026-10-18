import assert from "node:assert/strict";
import { test } from "node:test";
import { composerMode } from "../../src/conversations/composer-mode";

test("composerMode is resolved for a resolved thread", () => {
  assert.equal(composerMode("Resolved", null), "resolved");
  assert.equal(composerMode("Resolved", { status: 403 }), "resolved");
});

test("composerMode turns read-only after a send is refused for lack of access", () => {
  assert.equal(composerMode("Open", { status: 403 }), "read-only");
});

test("composerMode stays postable otherwise", () => {
  assert.equal(composerMode("Open", null), "post");
  assert.equal(composerMode("Open", { status: 409 }), "post");
  assert.equal(composerMode("Open", { status: 503 }), "post");
});
