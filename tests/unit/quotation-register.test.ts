import assert from "node:assert/strict";
import { test } from "node:test";
import {
  quotationQuery,
  quotationHistoryQuery,
  quotationStage,
  type StageFacts,
} from "../../src/estimating/quotations/model";

test("quotation query rejects unsupported filters and noncanonical or unbounded windows", () => {
  assert.equal(quotationQuery({}).limit, 25);
  assert.equal(
    quotationQuery({ q: "  50%_  ", limit: "1", offset: "1000000" }).q,
    "50%_",
  );
  for (const input of [
    { limit: "26" },
    { limit: "0" },
    { offset: "01" },
    { offset: "-1" },
    { offset: "1e2" },
    { offset: "1000001" },
    { limit: 2 },
    { q: "x\n" },
    { q: "x".repeat(101) },
    { owner_id: "bad" },
    { customer_id: "bad" },
    { sort: "updated_at;delete" },
    { stage: "Sent" },
    { view: "team" },
    { unexpected: "1" },
  ]) {
    assert.throws(
      () => quotationQuery(input),
      (e: unknown) => (e as { status: number }).status === 422,
    );
  }
  assert.deepEqual(quotationHistoryQuery({ offset: "25", limit: "5" }), {
    offset: 25,
    limit: 5,
  });
  assert.throws(() => quotationHistoryQuery({ stage: "Draft" }));
});

const facts: StageFacts = {
  prepared: true,
  basis_current: true,
  issued: false,
  approval: null,
  conversion_available: true,
  converted: false,
  distribution: null,
  response: null,
};
test("quotation stages preserve issued facts and expose missing conversion authority", () => {
  assert.equal(quotationStage({ ...facts, prepared: false }), "Draft");
  assert.equal(quotationStage(facts), "AwaitingApproval");
  assert.equal(quotationStage({ ...facts, approval: "Returned" }), "Returned");
  assert.equal(
    quotationStage({ ...facts, approval: "Approved" }),
    "ApprovedNotIssued",
  );
  assert.equal(
    quotationStage({ ...facts, approval: "Approved", basis_current: false }),
    "HeldBasisChanged",
  );
  const issued = { ...facts, issued: true, basis_current: false };
  assert.equal(quotationStage(issued), "IssuedNoResponse");
  assert.equal(
    quotationStage({
      ...issued,
      response: "Accepted",
      distribution: "Unknown",
    }),
    "DeliveryUnknown",
  );
  assert.equal(quotationStage({ ...issued, response: "Accepted" }), "Accepted");
  assert.equal(
    quotationStage({ ...issued, converted: true, distribution: "Unknown" }),
    "Converted",
  );
  assert.equal(
    quotationStage({ ...issued, conversion_available: false, converted: true }),
    null,
  );
});
