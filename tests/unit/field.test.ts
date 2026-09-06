import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectPng } from "../../src/field/media";
import { payload, decimal } from "../../src/field/validation";
import { png } from "../helpers/field";
test("P07 strict media inspects exact PNG chunks, dimensions, CRC and decompressed content", () => {
  const p = png();
  assert.deepEqual(inspectPng(p), {
    width: 96,
    height: 64,
    media_type: "image/png",
  });
  for (const b of [
    p.subarray(0, 30),
    Buffer.concat([p, Buffer.from("extra")]),
    Buffer.from("<svg/>"),
  ])
    assert.throws(() => inspectPng(b));
  const changed = Buffer.from(p);
  changed[50] ^= 1;
  assert.throws(() => inspectPng(changed));
  assert.throws(() => inspectPng(png(4097, 1)));
});
test("P07 exact decimal and discriminated payload validators reject finance fields and ambiguous values", () => {
  assert.equal(decimal("2.000000", "quantity", true), "2");
  assert.equal(decimal("-0.000001", "reading"), "-0.000001");
  for (const v of [2, "1e2", "NaN", "0.0000001"])
    assert.throws(() => decimal(v, "quantity"));
  assert.throws(() =>
    payload("Reading", {
      name: "SYN",
      numeric_value: "1",
      text_value: "both",
      unit: "°C",
      context: "SYN",
    }),
  );
  assert.throws(() =>
    payload("Material", {
      movement_kind: "Consumed",
      description: "SYN",
      quantity: "2",
      uom: "EA",
      stock_status: "Unknown",
      billable: true,
    }),
  );
});
