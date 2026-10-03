import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { sharedOperation } from "../../platform/operations";
import { invalid } from "../../shared/validation";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { releaseHash } from "../release/context";
import {
  responseAuthority,
  responseContext,
  responseReceiptAuthority,
  responseConflict,
} from "./context";
import { responseInput, clarificationInput, handoverInput } from "./validation";
import type { ResponseEvent } from "./model";
type Input =
  | ReturnType<typeof responseInput>
  | ReturnType<typeof clarificationInput>
  | ReturnType<typeof handoverInput>;
async function execute(p: Principal, id: string, input: Input) {
  return sharedOperation(
    p,
    input,
    `QuoteResponse:${input.action}`,
    async (c) => {
      // Replays authorise the exact original before sharedOperation discloses its receipt.
      const found = await c.query(
        "SELECT 1 FROM ppo.quote_response_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
        [p.workspace_id, id, p.actor_id, input.operation_id],
      );
      if (found.rowCount)
        await responseReceiptAuthority(c, p, id, input.operation_id);
      else await responseAuthority(c, p, id, true);
    },
    async (c) => {
      const d = await responseContext(c, p, id);
      expected(d.sequence, input.expected_response_sequence);
      if (
        input.issue_id !== d.issue.id ||
        input.output_hash !== d.issue.output_hash
      )
        responseConflict(
          "Use the exact issued quotation and original output fingerprint.",
        );
      const now = (
        await c.query<{ now: Date }>("SELECT clock_timestamp() AS now")
      ).rows[0].now;
      const report = "report" in input ? input.report : null;
      const detail: ResponseEvent["detail"] =
        "detail" in input ? input.detail : {};
      const responseTime = report?.responded_at ?? detail.responded_at;
      if (
        responseTime &&
        (Date.parse(responseTime) > now.getTime() ||
          Date.parse(responseTime) < d.issue.created_at.getTime())
      )
        invalid(
          "responded_at",
          "The reported response must be after this issue and no later than recording time.",
        );
      if (report) {
        if (input.response_id !== (d.state.response?.id ?? null))
          responseConflict(
            "Name the exact preceding response; refresh before recording a successor or correction.",
          );
        if (input.action === "Correct" && !d.state.response)
          responseConflict("A correction requires an existing response.");
        if (
          input.action === "Record" &&
          report.outcome === "Accepted" &&
          (!d.current || d.state.material || d.state.unresolved.length)
        )
          responseConflict(
            "Acceptance is held: resolve information-only clarification or return changed content through ES-05.",
          );
      } else if (input.action === "Answer" || input.action === "Confirm") {
        const question = d.state.unresolved.find(
          (e) => e.id === input.response_id,
        );
        if (!question || d.state.material || !d.current)
          responseConflict(
            "Use an unresolved information-only question on the current issue.",
          );
        const answer = d.events.find(
          (e) => e.action === "Answer" && e.response_id === question.id,
        );
        if (input.action === "Answer" && answer)
          responseConflict(
            "The answer is retained; correct the response or record respondent confirmation.",
          );
        if (input.action === "Confirm" && !answer)
          responseConflict(
            "Record an information-only answer before respondent confirmation.",
          );
        if (
          input.action === "Confirm" &&
          Date.parse(detail.responded_at!) < answer!.created_at.getTime()
        )
          invalid(
            "responded_at",
            "Confirmation must follow the recorded information-only answer.",
          );
      } else if (input.action === "Prepare") {
        if (!d.state.ready || input.response_id !== d.state.response?.id)
          responseConflict(
            d.state.holds.join(" ") ||
              "Use the exact current accepted response.",
          );
        if (d.state.preparation?.response_id === input.response_id)
          responseConflict(
            "This response already has its original prepared handover; recover that command.",
          );
        if (detail.owner_id !== d.e.owner_id)
          invalid(
            "owner_id",
            "The current estimator owns this synthetic preparation; receiving is separate.",
          );
      }
      // Retained output is verified without generating or changing it. Recovery of a committed original
      // remains possible if storage later becomes unavailable, because no mutation runs on replay.
      if (releaseHash((await draftBytes(p, id)).manifest) !== input.output_hash)
        responseConflict("Original issued output is unavailable or changed.");
      const eventId = randomUUID(),
        sequence = d.sequence + 1;
      const row = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_response_events
      (id,workspace_id,quote_id,revision_id,issue_id,sequence,action,response_id,output_hash,report,detail,evidence,reason,created_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING created_at`,
          [
            eventId,
            p.workspace_id,
            d.q.quote_id,
            id,
            input.issue_id,
            sequence,
            input.action,
            input.response_id,
            input.output_hash,
            report,
            detail,
            input.evidence,
            input.reason,
            p.actor_id,
            input.operation_id,
          ],
        )
      ).rows[0];
      await responseAuthority(c, p, id, true);
      return {
        id,
        version: sequence,
        state: report?.outcome ?? input.action,
        updated_at: row.created_at,
        audit_details: {
          response_event_id: eventId,
          issue_id: input.issue_id,
          synthetic_only: true,
        },
      };
    },
    "DraftQuoteRevision",
    "QuotationResponseRecorded",
  );
}
export const recordResponse = (p: Principal, id: string, value: unknown) =>
  execute(p, id, responseInput(id, value));
export const recordClarification = (p: Principal, id: string, value: unknown) =>
  execute(p, id, clarificationInput(id, value));
export const prepareResponseHandover = (
  p: Principal,
  id: string,
  value: unknown,
) => execute(p, id, handoverInput(id, value));
