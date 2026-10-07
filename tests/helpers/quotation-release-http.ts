import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { crmCreate, crmDiscovery, crmBase } from "./crm";
import { estimateInput, quoteCommand } from "./estimating";
import type { readRelease } from "../../src/estimating/release/reads";
type Detail = Awaited<ReturnType<typeof readRelease>>;
export const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
export async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
export function request(cookie: string, path: string, body?: unknown) {
  return fetch(origin + "/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
export async function json(cookie: string, path: string, body?: unknown) {
  const r = await request(cookie, path, body);
  assert.ok(r.ok, await r.clone().text());
  return r.json();
}
export async function httpFixture(closingDeal = false) {
  const owner = await session("coordinator"),
    reviewer = await session("estimating-source-reviewer"),
    approver = await session("quotation-approver"),
    issuer = await session("quotation-issuer"),
    o = closingDeal ? crmDiscovery() : crmCreate();
  await json(owner, "crm/opportunities", o);
  if (closingDeal) for (const [i, stage_id] of ["Scoping", "Quoting"].entries())
    await json(owner, `crm/opportunities/${o.id}/stage`, { ...crmBase(), expected_version: i + 1, stage_id, qualification_note: null, identification_activity_id: null });
  const input = estimateInput(o.id);
  await json(owner, "estimating/estimates", input);
  const reviewPath = `estimating/estimates/${input.id}/review`,
    before = await json(owner, reviewPath);
  await json(owner, reviewPath, {
    ...crmBase(),
    estimate_version_id: before.saved.id,
    basis_hash: before.basis_hash,
    expected_version: 1,
    expected_review_version: 0,
    responses: [],
  });
  for (const kind of ["Completeness", "SourcePrice", "Technical"]) {
    const d = await json(reviewer, reviewPath);
    await json(reviewer, reviewPath + "/decision", {
      ...crmBase(),
      submission_id: d.submissions.at(-1).id,
      expected_version: 1,
      expected_review_version: d.sequence,
      kind,
      outcome: "Reviewed",
      findings: [],
    });
  }
  const d = await json(owner, `estimating/estimates/${input.id}`),
    draft = quoteCommand(d.saved);
  await json(owner, `estimating/estimates/${input.id}/quotes`, draft);
  return { owner, reviewer, approver, issuer, input, draft };
}
export const releasePath = (id: string) => `estimating/quotes/${id}/release`;
export const detail = async (cookie: string, id: string): Promise<Detail> =>
  json(cookie, releasePath(id));
export const envelope = (d: Detail) => ({
  ...crmBase(),
  synthetic_only: true,
  expected_quote_version: d.quote_version,
  expected_release_sequence: d.sequence,
});
export const prepare = (d: Detail) => ({
  ...envelope(d),
  id: randomUUID(),
  basis_hash: d.preview.basis_hash,
  predecessor_issue_id: d.preview.predecessor_issue_id,
});
export const approve = (d: Detail) => ({
  ...envelope(d),
  outcome: "Approved",
  output_hash: d.job.output_hash,
});
export const issue = (d: Detail) => ({
  ...envelope(d),
  approval_id: d.approval!.id,
  output_hash: d.job.output_hash,
});
