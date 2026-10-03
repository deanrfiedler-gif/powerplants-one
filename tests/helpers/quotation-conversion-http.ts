import {
  responseHttpFixture,
  responseDetail,
  responsePath,
  response,
  responseCommand,
  json,
} from "./quotation-response-http";
import type { ConversionDetail } from "./quotation-conversion";
export { json, request, session } from "./quotation-release-http";
export {
  receiving,
  resolution,
  plan,
  conversion,
  conversionCommand,
} from "./quotation-conversion";
export const conversionPath = (id: string) =>
  `estimating/quotes/${id}/conversion`;
export const conversionDetail = async (
  cookie: string,
  id: string,
): Promise<ConversionDetail> => json(cookie, conversionPath(id));
export async function conversionHttpFixture() {
  const f = await responseHttpFixture();
  await json(f.owner, responsePath(f.id) + "/record", response(f.d));
  const d = await responseDetail(f.owner, f.id);
  await json(f.owner, responsePath(f.id) + "/prepare", {
    ...responseCommand(d),
    owner_id: d.owner_id,
    due_date: "2026-10-12",
    note: "SYN exact receiving preparation",
  });
  return { ...f, d: await conversionDetail(f.owner, f.id) };
}
