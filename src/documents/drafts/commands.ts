import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError } from "../../platform/errors";
import { canonical, sharedOperation } from "../../platform/operations";
import { digest } from "../store";
import { uuid } from "../../shared/validation";
import {
  bindingAuthority,
  captureBase,
  current,
  proposalContext,
  revisionContext,
  scopeAuthority,
  type Base,
  type Proposal,
} from "./context";
import {
  bodyInput,
  createInput,
  reviewInput,
  reviseInput,
  type ProposalBody,
} from "./validation";

async function evidence(
  c: PoolClient,
  p: Principal,
  d: Proposal,
  revision: string,
  input: { operation_id: string; reason: string },
  command: "Create" | "Revise" | "Review",
  payload: unknown,
) {
  const event_id = randomUUID();
  const table =
    command === "Review"
      ? "template_proposal_reviews"
      : "template_proposal_revisions";
  const exact = (
    await c.query(
      `SELECT to_jsonb(r) AS value FROM ppo.${table} r WHERE workspace_id=$1 AND id=$2`,
      [p.workspace_id, (payload as { id: string }).id],
    )
  ).rows[0].value;
  await c.query(
    `INSERT INTO ppo.template_proposal_events(id,workspace_id,proposal_id,revision_id,proposal_version,command,actor_id,operation_id,reason,snapshot,payload,command_hash)
    SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,to_jsonb(d),$10,$11 FROM ppo.template_proposals d WHERE workspace_id=$2 AND id=$3`,
    [
      event_id,
      p.workspace_id,
      d.id,
      revision,
      d.version,
      command,
      p.actor_id,
      input.operation_id,
      input.reason,
      exact,
      digest(canonical({ command: "TemplateDraft:" + command, ...input })),
    ],
  );
  return {
    id: d.id,
    version: d.version,
    state: d.state,
    updated_at: d.updated_at,
    audit_details: { event_id, revision_id: revision },
  };
}
async function addRevision(
  c: PoolClient,
  p: Principal,
  d: Proposal,
  id: string,
  number: number,
  base: Base,
  body: ProposalBody,
  reason: string,
) {
  return (
    await c.query(
      `INSERT INTO ppo.template_proposal_revisions(id,workspace_id,proposal_id,revision,proposal_version,base,body,content_hash,created_by,reason,canonical_content)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        id,
        p.workspace_id,
        d.id,
        number,
        d.version,
        base,
        body,
        digest(canonical({ base, body })),
        p.actor_id,
        reason,
        canonical({ base, body }),
      ],
    )
  ).rows[0];
}
async function bump(
  c: PoolClient,
  p: Principal,
  d: Proposal,
  revision: string,
  state: Proposal["state"],
) {
  return (
    await c.query<Proposal>(
      "UPDATE ppo.template_proposals SET version=version+1,current_revision_id=$3,state=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, d.id, revision, state, p.actor_id],
    )
  ).rows[0];
}
export async function createProposal(p: Principal, value: unknown) {
  const input = createInput(value);
  return sharedOperation(
    p,
    input,
    "TemplateDraft:Create",
    async (c) => {
      await scopeAuthority(c, p, input, "template.propose");
      await bindingAuthority(c, p, input, input.body);
      const existing = (
        await c.query(
          "SELECT id FROM ppo.template_proposals WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.id],
        )
      ).rowCount;
      if (existing) {
        const { d } = await proposalContext(c, p, input.id, "template.propose");
        await revisionContext(c, p, d, input.revision_id);
      }
    },
    async (c) => {
      const base = await captureBase(
        c,
        p,
        input.family,
        input.base_template_id,
        input.base_content_hash,
      );
      const d = (
        await c.query<Proposal>(
          `INSERT INTO ppo.template_proposals(id,workspace_id,company_id,site_id,family,version,current_revision_id,state,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,1,$6,'Draft',$7,$7) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            input.company_id,
            input.site_id,
            input.family,
            input.revision_id,
            p.actor_id,
          ],
        )
      ).rows[0];
      const r = await addRevision(
        c,
        p,
        d,
        input.revision_id,
        1,
        base,
        input.body,
        input.reason,
      );
      await scopeAuthority(c, p, d, "template.propose");
      await bindingAuthority(c, p, d, input.body);
      return evidence(c, p, d, r.id, input, "Create", r);
    },
    "TemplateProposal",
    "SharedRecordUpdated",
  );
}
export async function reviseProposal(p: Principal, id: string, value: unknown) {
  const parsed = reviseInput(value);
  const input = { ...parsed, proposal_id: uuid(id, "proposal_id") };
  return sharedOperation(
    p,
    input,
    "TemplateDraft:Revise",
    async (c) => {
      const ctx = await proposalContext(
        c,
        p,
        input.proposal_id,
        "template.propose",
      );
      await revisionContext(c, p, ctx.d, input.observed_revision_id);
      const body = bodyInput(input.body, ctx.d.family);
      await bindingAuthority(c, p, ctx.d, body);
      return { ...ctx, body };
    },
    async (c, { d, r, body }) => {
      current(d, input.expected_version, input.observed_revision_id);
      const updated = await bump(c, p, d, input.revision_id, "Draft");
      const next = await addRevision(
        c,
        p,
        updated,
        input.revision_id,
        r.revision + 1,
        r.base,
        body,
        input.reason,
      );
      await scopeAuthority(c, p, d, "template.propose");
      await bindingAuthority(c, p, d, body);
      return evidence(c, p, updated, next.id, input, "Revise", next);
    },
    "TemplateProposal",
    "SharedRecordUpdated",
  );
}
export async function reviewProposal(p: Principal, id: string, value: unknown) {
  const input = { ...reviewInput(value), proposal_id: uuid(id, "proposal_id") };
  return sharedOperation(
    p,
    input,
    "TemplateDraft:Review",
    async (c) => {
      const ctx = await proposalContext(
        c,
        p,
        input.proposal_id,
        "template.review",
      );
      await revisionContext(c, p, ctx.d, input.revision_id);
      return ctx;
    },
    async (c, { d, r }) => {
      current(d, input.expected_version, input.revision_id);
      if (r.content_hash !== input.content_hash)
        throw new AppError(
          409,
          "StaleVersion",
          "Review the exact current proposal fingerprint.",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.template_proposal_revisions WHERE workspace_id=$1 AND proposal_id=$2 AND created_by=$3",
            [p.workspace_id, d.id, p.actor_id],
          )
        ).rowCount
      )
        throw new AppError(
          409,
          "IndependentReviewRequired",
          "A contributor cannot review this proposal.",
        );
      const updated = await bump(c, p, d, r.id, input.outcome);
      const review = (
        await c.query(
          `INSERT INTO ppo.template_proposal_reviews(id,workspace_id,proposal_id,revision_id,proposal_version,content_hash,outcome,checks,reviewer_id,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [
            input.review_id,
            p.workspace_id,
            d.id,
            r.id,
            updated.version,
            r.content_hash,
            input.outcome,
            input.checks,
            p.actor_id,
            input.reason,
          ],
        )
      ).rows[0];
      await scopeAuthority(c, p, d, "template.review");
      await bindingAuthority(c, p, d, r.body);
      return evidence(c, p, updated, r.id, input, "Review", review);
    },
    "TemplateProposal",
    "SharedRecordUpdated",
  );
}
