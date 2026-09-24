import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { sharedOperation } from "../../platform/operations";
import { AppError } from "../../platform/errors";
import { companyContext } from "../../shared/authority";
import { expected } from "../service";
import {
  sourceContext,
  sourceHash,
  sourceRevision,
  type CostSource,
  type SourceEvent,
} from "./context";
import {
  sourceCreate,
  sourceDecision,
  sourceRevise,
  type SourceContent,
} from "./validation";

async function insertRevision(
  c: PoolClient,
  p: Principal,
  s: CostSource,
  content: SourceContent,
  predecessor: string | null,
  reason: string,
) {
  await c.query(
    `INSERT INTO ppo.cost_source_revisions(id,workspace_id,company_id,source_id,revision,predecessor_id,content,content_hash,reason,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      s.current_revision_id,
      p.workspace_id,
      s.company_id,
      s.id,
      s.revision,
      predecessor,
      content,
      sourceHash(content),
      reason,
      p.actor_id,
    ],
  );
}
async function event(
  c: PoolClient,
  p: Principal,
  s: CostSource,
  input: { operation_id: string; reason: string },
  action: SourceEvent["action"],
) {
  const id = randomUUID();
  await c.query(
    `INSERT INTO ppo.cost_source_events(id,workspace_id,source_id,revision_id,source_version,action,reason,operation_id,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      p.workspace_id,
      s.id,
      s.current_revision_id,
      s.version,
      action,
      input.reason,
      input.operation_id,
      p.actor_id,
    ],
  );
  return {
    ...s,
    audit_details: {
      source_revision_id: s.current_revision_id,
      source_revision: s.revision,
      event_id: id,
    },
  };
}
export async function createCostSource(p: Principal, value: unknown) {
  const input = sourceCreate(value);
  return sharedOperation(
    p,
    input,
    "CreateCostSource",
    async (c) => {
      await companyContext(c, p, input.company_id, null, "estimating.edit");
      await companyContext(c, p, input.company_id, null, "estimating.read");
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.cost_sources WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, input.id],
          )
        ).rowCount
      )
        await sourceContext(c, p, input.id, "estimating.edit");
    },
    async (c) => {
      const id = randomUUID();
      const s = (
        await c.query<CostSource>(
          `INSERT INTO ppo.cost_sources(id,workspace_id,company_id,reference,owner_id,current_revision_id,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,$6,$5,$5) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            input.company_id,
            input.reference,
            p.actor_id,
            id,
          ],
        )
      ).rows[0];
      await insertRevision(c, p, s, input.content, null, input.reason);
      return event(c, p, s, input, "DraftSaved");
    },
    "CostSource",
    "CostSourceSaved",
  );
}
export async function reviseCostSource(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = sourceRevise(id, value);
  return sharedOperation(
    p,
    input,
    "ReviseCostSource",
    (c) => sourceContext(c, p, input.id, "estimating.edit"),
    async (c, s) => {
      expected(s.version, input.expected_version);
      if (s.state === "Submitted")
        throw new AppError(
          409,
          "SourceInReview",
          "Submitted evidence is frozen. Record its independent review before preparing a correction.",
        );
      const prior = await sourceRevision(c, p, s, s.current_revision_id);
      for (const key of [
        "supplier_entity_key",
        "supplier_label",
        "item_reference",
        "unit",
      ] as const)
        if (prior.content[key] !== input.content[key])
          throw new AppError(
            422,
            "SourceIdentityChanged",
            "A different supplier, item or unit requires a separate source identity.",
          );
      if (sourceHash(input.content) === prior.content_hash)
        throw new AppError(
          422,
          "SourceUnchanged",
          "There is no content change to save as a source successor.",
        );
      const updated = (
        await c.query<CostSource>(
          `UPDATE ppo.cost_sources SET version=version+1,revision=revision+1,current_revision_id=$3,state='Draft',updated_by=$4,updated_at=clock_timestamp()
      WHERE workspace_id=$1 AND id=$2 RETURNING *`,
          [p.workspace_id, s.id, randomUUID(), p.actor_id],
        )
      ).rows[0];
      await insertRevision(
        c,
        p,
        updated,
        input.content,
        prior.id,
        input.reason,
      );
      return event(c, p, updated, input, "DraftSaved");
    },
    "CostSource",
    "CostSourceSaved",
  );
}
export async function decideCostSource(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = sourceDecision(id, value),
    submit = input.action === "Submit";
  return sharedOperation(
    p,
    input,
    submit ? "SubmitCostSource" : "ReviewCostSource",
    (c) =>
      sourceContext(
        c,
        p,
        input.id,
        submit ? "estimating.edit" : "estimating.source.review",
      ),
    async (c, s) => {
      expected(s.version, input.expected_version);
      if (s.current_revision_id !== input.revision_id)
        throw new AppError(
          409,
          "SourceRevisionChanged",
          "Review the exact current source revision before deciding.",
        );
      const revision = await sourceRevision(c, p, s, input.revision_id);
      if (s.state !== (submit ? "Draft" : "Submitted"))
        throw new AppError(
          409,
          "SourceStateChanged",
          "The source is no longer in the required draft or submitted state.",
        );
      if (!submit && revision.created_by === p.actor_id)
        throw new AppError(
          403,
          "IndependentSourceReviewerRequired",
          "The author cannot review their own source evidence.",
        );
      const action = submit
        ? "Submitted"
        : (input.action as "Reviewed" | "Returned" | "Rejected");
      const updated = (
        await c.query<CostSource>(
          "UPDATE ppo.cost_sources SET version=version+1,state=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, s.id, action, p.actor_id],
        )
      ).rows[0];
      return event(c, p, updated, input, action);
    },
    "CostSource",
    submit ? "CostSourceSubmitted" : "CostSourceReviewed",
  );
}
