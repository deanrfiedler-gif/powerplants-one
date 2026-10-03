import {
  httpFixture,
  json,
  detail,
  releasePath,
  prepare,
  approve,
  issue,
} from "./quotation-release-http";
import type { readResponse } from "../../src/estimating/response/reads";
export { json, request, session } from "./quotation-release-http";
export { response, responseCommand } from "./quotation-response";
export const responsePath = (id: string) => `estimating/quotes/${id}/response`;
export const responseDetail = async (
  cookie: string,
  id: string,
): Promise<Awaited<ReturnType<typeof readResponse>>> =>
  json(cookie, responsePath(id));
export async function responseHttpFixture() {
  const f = await httpFixture(),
    p = prepare(await detail(f.owner, f.draft.id));
  await json(f.owner, releasePath(f.draft.id) + "/prepare", p);
  await json(f.owner, `estimating/quotes/${p.id}/render`, {});
  await json(
    f.approver,
    releasePath(p.id) + "/approval",
    approve(await detail(f.approver, p.id)),
  );
  await json(
    f.issuer,
    releasePath(p.id) + "/issue",
    issue(await detail(f.issuer, p.id)),
  );
  return { ...f, id: p.id, d: await responseDetail(f.owner, p.id) };
}
