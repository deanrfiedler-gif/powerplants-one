import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../src/platform/errors";
import { libraryCursor } from "../../src/library/paging";

const position = {
  id: "00000000-0000-4000-8000-000000000001",
  key: "SYN-PPO-DOC-000001",
};
const binding = {
  actor: "reader-a",
  workspace: "synthetic",
  working: "company-a",
  sort: "number",
  direction: "asc",
  q: "",
  limit: 25,
};

test("library continuation retains its exact position only within the original read scope", () => {
  const token = libraryCursor(binding).encode(position);
  assert.deepEqual(libraryCursor(binding).decode(token), position);
  for (const change of [
    { actor: "reader-b" },
    { workspace: "other" },
    { working: "company-b" },
    { sort: "updated" },
    { direction: "desc" },
    { q: "changed" },
    { limit: 50 },
  ]) {
    assert.throws(
      () => libraryCursor({ ...binding, ...change }).decode(token),
      (error: unknown) => error instanceof AppError && error.status === 422 && error.field_errors.some(field => field.field === "cursor" && field.message.includes("continuation expired")),
    );
  }
});

test("library continuation rejects altered positions, signatures and malformed envelopes", () => {
  const token = libraryCursor(binding).encode(position);
  const [body, signature] = token.split(".");
  const altered = Buffer.from(
    JSON.stringify({
      basis: JSON.stringify(binding),
      position: { ...position, key: "changed" },
    }),
  ).toString("base64url");
  for (const invalid of [
    "",
    "bad",
    `${altered}.${signature}`,
    `${body}.${"x".repeat(signature.length)}`,
    `${token}.extra`,
    "x".repeat(6001),
  ]) {
    assert.throws(
      () => libraryCursor(binding).decode(invalid),
      (error: unknown) => error instanceof AppError && error.status === 422 && error.field_errors.some(field => field.field === "cursor" && field.message.includes("continuation expired")),
    );
  }
  assert.equal(libraryCursor(binding).decode(undefined), null);
});
