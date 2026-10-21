import assert from "node:assert/strict";
import { test } from "node:test";
import { lookupIdentifier } from "../../src/equipment/model";

test("equipment lookup keeps synthetic manufacturer serials separate from readable references", () => {
  for (const serial of [
    "SYN-DUPLICATE-45",
    "SYN-PUMP-45",
    "SYN-30000000-0000-4000-8000-000000000001",
    "Pump45",
  ]) {
    assert.deepEqual(lookupIdentifier(serial), {
      value: serial,
      kind: "serial",
    });
  }
});

test("equipment lookup recognises retained and new Asset references without truncating a continuing sequence", () => {
  for (const reference of [
    "SYN-PPO-AST-000001",
    "SYN-AST-000001",
    "SYN-AST-1000000",
  ]) {
    assert.deepEqual(lookupIdentifier(reference), {
      value: reference,
      kind: "reference",
    });
  }
  const id = "30000000-0000-4000-8000-000000000001";
  assert.deepEqual(lookupIdentifier(id), { value: id, kind: "id" });
  assert.deepEqual(lookupIdentifier("/equipment/" + id), {
    value: id,
    kind: "id",
  });
});

test("equipment lookup refuses malformed or other-record references and unsafe scan input", () => {
  for (const value of [
    "SYN-AST-12",
    "SYN-AST-invalid",
    "syn-ast-000001",
    "SYN-WO-000001",
    "SYN-PPO-WO-000001",
    "PPO-AST-000001",
    "https://invalid.example/equipment/1",
    "javascript:alert(1)",
    "data:text/plain,SYN-AST-000001",
    "/equipment/not-an-id",
    "SYN-PUMP\u000045",
    "",
  ]) {
    assert.equal(lookupIdentifier(value), null, value);
  }
});
