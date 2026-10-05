import {
  allocatedHttpFixture,
  conversionDetail,
  json,
  referral,
  acknowledgement,
  supplyApply,
} from "./quotation-supply-followup-http";
import {
  receiptProposal,
  receiptReceiving,
  receiptReview,
} from "./quotation-receipt-correction";
import {
  shortfallProposal,
  shortfallReceiving,
  shortfallReview,
} from "./quotation-allocation-shortfall";
export {
  conversionDetail,
  json,
  request,
  session,
  supplyApply,
} from "./quotation-supply-followup-http";
export {
  shortfallProposal,
  shortfallReceiving,
  shortfallReview,
} from "./quotation-allocation-shortfall";
export async function shortfallHttpFixture(reviewed = false) {
  const f = await allocatedHttpFixture("Shipment");
  const current = async () =>
    (await conversionDetail(f.owner, f.id)).followups[0];
  await json(f.owner, f.path + "/supply-refer", referral(await current()));
  await json(
    f.owner,
    f.path + "/supply-receive",
    acknowledgement(await current()),
  );
  await json(
    f.owner,
    f.path + "/receipt-propose",
    receiptProposal(await current()),
  );
  for (const r of (await current()).receipt_correction.required)
    await json(
      f.owner,
      f.path + "/receipt-receive",
      receiptReceiving(await current(), r.demand.id),
    );
  await json(
    f.owner,
    f.path + "/supply-review",
    receiptReview(await current()),
  );
  await json(f.owner, f.path + "/supply-apply", supplyApply(await current()));
  if (reviewed) {
    await json(
      f.owner,
      f.path + "/shortfall-propose",
      shortfallProposal(await current()),
    );
    for (const r of (await current()).allocation_shortfall.required)
      await json(
        f.owner,
        f.path + "/shortfall-receive",
        shortfallReceiving(await current(), r.demand.id),
      );
    await json(
      f.owner,
      f.path + "/supply-review",
      shortfallReview(await current()),
    );
  }
  return { ...f, current };
}
