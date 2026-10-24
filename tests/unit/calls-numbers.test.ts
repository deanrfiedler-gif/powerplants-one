import assert from "node:assert/strict";
import { test } from "node:test";
import { readPhoneNumber } from "../../src/calls/numbers";

test("reads Australian and international numbers in E.164", () => {
  const cases: [string, string][] = [
    ["0412 345 678", "+61412345678"],
    ["(07) 3123 4567", "+61731234567"],
    ["13 22 65", "+61132265"],
    ["1300 123 456", "+611300123456"],
    ["1800 123 456", "+611800123456"],
    ["+64 21 123 4567", "+64211234567"],
  ];
  for (const [entered, e164] of cases)
    assert.deepEqual(readPhoneNumber(entered, "AU"), { entered, e164, region: "AU" });
});

test("keeps unreadable text exactly and returns no E.164", () => {
  for (const entered of ["SYN phone", "000", "ext 23", "0412 345 678 (mobile) or 0412 999 999"])
    assert.deepEqual(readPhoneNumber(entered, "AU"), { entered, e164: null, region: "AU" });
});

test("trims only surrounding spaces from the entered text", () => {
  assert.equal(readPhoneNumber("  0412 345 678 ", "AU").entered, "0412 345 678");
});

test("reads a local number in the given region, not always Australia", () => {
  assert.equal(readPhoneNumber("021 123 4567", "NZ").e164, "+64211234567");
  assert.equal(readPhoneNumber("021 123 4567", "AU").e164, "+61211234567");
  assert.equal(readPhoneNumber("0412 345 678", "NZ").e164, null);
});

test("refuses empty text, over-long text and malformed regions", () => {
  for (const [entered, region] of [["", "AU"], [" ", "AU"], ["0".repeat(201), "AU"], ["0412 345 678", "au"], ["0412 345 678", "AUS"]])
    assert.throws(() => readPhoneNumber(entered, region), (e: { code?: string }) => e.code === "InvalidData");
});
