import assert from "node:assert/strict";
import { test } from "node:test";
import {
  customerDeliveryCommand,
  dispatchNoticeDetails,
  dispatchQuantities,
  laterCustomerEta,
} from "../../src/supply/customer-delivery-model";
import { factCommand } from "../../src/supply/validation";
import { supplyFact } from "../helpers/supply";
import { base } from "../helpers/customer-communications";

test("S3 requires typed fictional catalogue references and a consignment number, never arbitrary URLs or text", () => {
  const details = {
    carrier_code: "SYN-CAR-000001",
    platform_code: "SYN-PLT-000001",
    tracking_number: "SYN-123/45",
  };
  assert.deepEqual(dispatchNoticeDetails(details), details);
  for (const change of [
    { carrier_code: "real-carrier" },
    { platform_code: "https://carrier.example" },
    { tracking_number: "https://carrier.example/a" },
    { tracking_number: "A\nB" },
    { internal_note: "private" },
  ])
    assert.throws(() => dispatchNoticeDetails({ ...details, ...change }));
  assert.throws(() =>
    dispatchNoticeDetails({ ...details, tracking_number: "x".repeat(121) }),
  );
});

test("dispatch totals use exact decimals, retain partial quantities and refuse impossible totals", () => {
  assert.deepEqual(dispatchQuantities("0.3", ["0.1", "0.1"], "0.1"), {
    movement: "0.1",
    dispatched: "0.2",
    outstanding: "0.1",
  });
  assert.deepEqual(dispatchQuantities("10", ["4", "6"], "6"), {
    movement: "6",
    dispatched: "10",
    outstanding: "0",
  });
  assert.throws(() => dispatchQuantities("10", ["11"], "11"));
  assert.throws(() => dispatchQuantities("10", ["4"], "5"));
});

test("only a strictly later explicit customer ETA than a sent baseline qualifies", () => {
  assert.equal(laterCustomerEta("2026-11-04", "2026-11-03"), true);
  for (const [current, sent] of [
    [null, "2026-11-03"],
    ["2026-11-04", null],
    ["2026-11-03", "2026-11-03"],
    ["2026-11-02", "2026-11-03"],
  ])
    assert.equal(laterCustomerEta(current, sent), false);
  assert.throws(() =>
    customerDeliveryCommand("10000000-0000-4000-8000-000000000001", {
      ...base(),
      expected_version: 1,
      customer_eta: "2026-02-30",
    }),
  );
});

test("S3 leaves historical fact payload normalization unchanged and admits details only for Dispatch", () => {
  const original = supplyFact("Dispatch", 1);
  const normalized = factCommand(original);
  assert.equal(Object.hasOwn(normalized, "dispatch_notice"), false);
  const details = {
    carrier_code: "SYN-CAR-000001",
    platform_code: "SYN-PLT-000001",
    tracking_number: "SYN-123",
  };
  assert.deepEqual(
    factCommand({ ...original, dispatch_notice: details }).dispatch_notice,
    details,
  );
  assert.throws(() =>
    factCommand({ ...supplyFact("Promise", 1), dispatch_notice: details }),
  );
});
