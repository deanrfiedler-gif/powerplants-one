import {
  conversionHttpFixture,
  conversionDetail,
  conversionPath,
  receiving,
  resolution,
  plan,
  conversion,
  json,
} from "./quotation-conversion-http";
export {
  conversionDetail,
  conversionPath,
  json,
  request,
  session,
} from "./quotation-conversion-http";
export { dispositionReview, dispositionApply } from "./quotation-disposition";
export async function completedHttpFixture() {
  const f = await conversionHttpFixture(),
    path = conversionPath(f.id);
  await json(
    f.owner,
    path + "/receive",
    receiving(f.d, f.d.preparation!.detail.owner_id!),
  );
  let d = await conversionDetail(f.owner, f.id);
  await json(f.owner, path + "/resolve", resolution(d));
  d = await conversionDetail(f.owner, f.id);
  await json(f.owner, path + "/plan", plan(d));
  d = await conversionDetail(f.owner, f.id);
  const original = conversion(d),
    receipt = await json(f.owner, path + "/execute", original);
  d = await conversionDetail(f.owner, f.id);
  await json(f.owner, path + "/receive", {
    ...receiving(d, d.preparation!.detail.owner_id!),
    decision: "Held",
    reason: "SYN corrected evidence after conversion",
  });
  return {
    ...f,
    path,
    original,
    receipt,
    d: await conversionDetail(f.owner, f.id),
  };
}
