import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { sharedOperation, recordOperation } from "../../platform/operations";
import { scopedOwner } from "../../shared/authority";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { releaseHash } from "../release/context";
import { conversionAuthority, conversionContext } from "../conversion/context";
import { recordCommand } from "../../supply/validation";
import { reviseSupplyRecordInTransaction } from "../../supply/commands";
import {
  dispositionTarget,
  dispositionConflict,
  dispositionHash,
  dispositionHistoryAuthority,
  type DispositionEvent,
} from "./context";
import { dispositionReviewInput, dispositionApplyInput } from "./validation";

type Input =
  | ReturnType<typeof dispositionReviewInput>
  | ReturnType<typeof dispositionApplyInput>;
async function execute(p: Principal, id: string, input: Input) {
  return sharedOperation(
    p,
    input,
    `QuoteDisposition:${input.action}`,
    async (c) => {
      await conversionAuthority(c, p, id, true);
      await dispositionHistoryAuthority(c, p, input.target_id);
    },
    async (c) => {
      const d = await conversionContext(c, p, id),
        t = await dispositionTarget(c, p, d, input.target_id);
      expected(t.sequence, input.expected_sequence);
      if (t.basis.execution_id !== input.execution_id)
        dispositionConflict(
          "Use the exact completed conversion and original target.",
        );
      if (
        releaseHash((await draftBytes(p, id)).manifest) !== t.basis.output_hash
      )
        dispositionConflict(
          "Original issued output is unavailable or changed.",
        );
      const eventId = randomUUID();
      let basis = t.basis,
        basisHash = t.basis_hash,
        cmd: DispositionEvent["command"] = null;
      let reviewId: string | null = null,
        predecessor: string | null = null,
        effectVersion: number | null = null;
      let decision: DispositionEvent["decision"],
        owner: string,
        due: string,
        next: string,
        reviewHash: string;
      if (input.action === "Review") {
        if (input.predecessor_id !== (t.review?.id ?? null))
          dispositionConflict(
            "Name the latest immutable disposition review when replacing or correcting it.",
          );
        if (input.basis_hash !== basisHash)
          dispositionConflict(
            "The observed exception evidence changed. Compare it before recording a decision.",
          );
        if (t.status === "Unchanged")
          dispositionConflict(
            "No completed-conversion exception requires disposition.",
          );
        if (input.decision === "ReviseQuantity" && t.revision_holds.length)
          dispositionConflict(t.revision_holds.join(" "));
        if (
          input.decision === "ReviseQuantity" &&
          input.quantity === t.basis.target.quantity
        )
          dispositionConflict(
            "Quantity is unchanged. Use an explicit Retain decision.",
          );
        decision = input.decision;
        owner = input.owner_id;
        due = input.due_date;
        next = input.next_action;
        predecessor = input.predecessor_id;
        if (decision === "ReviseQuantity") {
          const r = basis.target;
          cmd = recordCommand(
            {
              operation_id: randomUUID(),
              schema_version: 1,
              reason: input.reason,
              id: r.id,
              expected_version: r.version,
              kind: r.kind,
              company_id: r.company_id,
              site_id: r.site_id,
              reference: r.reference,
              title: r.title,
              item: r.item,
              unit: r.unit,
              quantity: input.quantity,
              owner_id: r.owner_id,
              next_action: r.next_action,
              completeness: r.completeness,
              observed_at: new Date(r.observed_at).toISOString(),
              source_reference: r.source_reference,
              external_key: r.external_key,
              data: r.data,
            },
            true,
          );
        }
        reviewHash = dispositionHash({
          basis,
          decision,
          command: cmd,
          owner_id: owner,
          due_date: due,
          next_action: next,
          reason: input.reason,
          evidence: input.evidence,
        });
      } else {
        const r = t.review;
        if (
          !r ||
          r.id !== input.review_id ||
          r.review_hash !== input.review_hash ||
          !t.can_apply
        )
          dispositionConflict(
            t.review_holds.join(" ") ||
              "The exact decision is replaced, already applied or unavailable.",
          );
        reviewId = r.id;
        decision = r.decision;
        owner = r.owner_id;
        due = r.due_date;
        next = r.next_action;
        reviewHash = r.review_hash;
        cmd = r.command;
        if (cmd) {
          const saved = await reviseSupplyRecordInTransaction(c, p, cmd);
          await recordOperation(
            c,
            p,
            cmd,
            {
              id: saved.id,
              version: saved.version,
              state: "Recorded",
              updated_at: new Date(saved.updated_at),
            },
            "SupplyRecord",
            "SupplyRecorded",
            releaseHash({ command: "Supply:Revise", ...cmd }),
            {
              command: "Supply:Revise",
              record_version: saved.version,
              disposition_review_id: r.id,
              disposition_effect_id: eventId,
              conversion_execution_id: input.execution_id,
              source_line_id: basis.line_id,
            },
          );
        }
        const after = await dispositionTarget(c, p, d, input.target_id);
        basis = after.basis;
        basisHash = after.basis_hash;
        effectVersion = basis.target.version;
      }
      await scopedOwner(
        c,
        p,
        owner,
        basis.target.company_id,
        basis.target.site_id ?? undefined,
        "activity.edit",
      );
      const row = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.quote_disposition_events
      (id,workspace_id,revision_id,execution_id,target_id,sequence,action,predecessor_id,review_id,decision,basis,basis_hash,command,review_hash,owner_id,due_date,next_action,reason,evidence,created_by,operation_id,effect_version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING created_at`,
          [
            eventId,
            p.workspace_id,
            id,
            input.execution_id,
            input.target_id,
            t.sequence + 1,
            input.action,
            predecessor,
            reviewId,
            decision,
            basis,
            basisHash,
            cmd,
            reviewHash,
            owner,
            due,
            next,
            input.reason,
            input.evidence,
            p.actor_id,
            input.operation_id,
            effectVersion,
          ],
        )
      ).rows[0];
      await conversionAuthority(c, p, id, true);
      await dispositionHistoryAuthority(c, p, input.target_id);
      return {
        id,
        version: t.sequence + 1,
        state:
          input.action === "Apply"
            ? decision === "Retain"
              ? "Retained"
              : "QuantityRevised"
            : decision === "Hold"
              ? "Held"
              : "DispositionReviewed",
        updated_at: row.created_at,
        audit_details: {
          disposition_event_id: eventId,
          target_id: input.target_id,
          execution_id: input.execution_id,
          review_id: reviewId,
          synthetic_only: true,
        },
      };
    },
    "DraftQuoteRevision",
    "QuotationDispositionRecorded",
  );
}
export const reviewDisposition = (p: Principal, id: string, value: unknown) =>
  execute(p, id, dispositionReviewInput(id, value));
export const applyDisposition = (p: Principal, id: string, value: unknown) =>
  execute(p, id, dispositionApplyInput(id, value));
