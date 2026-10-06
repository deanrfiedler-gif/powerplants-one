import { crmBase } from "./crm";
import { releaseFixture, prepared, issued } from "./quotation-release";
import { readResponse } from "../../src/estimating/response/reads";
export type ResponseDetail = Awaited<ReturnType<typeof readResponse>>;
export const responseCommand = (d: ResponseDetail) => ({
  ...crmBase(),
  synthetic_only: true,
  issue_id: d.issue.id,
  output_hash: d.issue.output_hash,
  expected_response_sequence: d.sequence,
  response_id: d.state.response?.id ?? null,
  evidence: "SYN recorded fictional conversation",
});
export const response = (d: ResponseDetail, outcome = "Accepted") => ({
  ...responseCommand(d),
  action: "Record",
  report: {
    outcome,
    respondent: "Fictional Pat",
    claimed_role: "Reported purchasing contact",
    responded_at: new Date().toISOString(),
    conditions: null as string | null,
  },
});
export async function responseFixture(extraProducts = 0) {
  const f = await releaseFixture(extraProducts),
    r = await prepared(f);
  await issued(f, r.id);
  return { ...f, id: r.id, d: await readResponse(f.owner, r.id) };
}
