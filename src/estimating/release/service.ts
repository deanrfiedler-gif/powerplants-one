import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import type { PoolClient } from "pg";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import { expected } from "../service";
import { draftBytes } from "../worker";
import { guardExistingEstimateMutation } from "../discovery-workspace-context";
import {
  releaseAuthority,
  releasePreview,
  releaseHistory,
  releaseHash,
  releaseConflict,
  releaseReceiptAuthority,
  requireCurrentRelease,
  type ReleaseEvent,
} from "./context";
import {
  prepareInput,
  approvalInput,
  issueInput,
  distributionInput,
} from "./validation";

async function recovered(
  c: PoolClient,
  p: Principal,
  id: string,
  operation: string,
) {
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.quote_release_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
        [p.workspace_id, id, p.actor_id, operation],
      )
    ).rowCount
  )
    return false;
  await releaseReceiptAuthority(c, p, id, operation);
  return true;
}
async function record(
  c: PoolClient,
  p: Principal,
  quoteId: string,
  revisionId: string,
  sequence: number,
  input: { operation_id: string; reason: string },
  fact: Pick<ReleaseEvent, "action" | "outcome"> &
    Partial<
      Pick<
        ReleaseEvent,
        | "approval_id"
        | "issue_id"
        | "attempt_id"
        | "resolves_event_id"
        | "manifest"
        | "output_hash"
      >
    >,
) {
  const id = randomUUID(),
    event = (
      await c.query<{ created_at: Date }>(
        `INSERT INTO ppo.quote_release_events(id,workspace_id,quote_id,revision_id,sequence,action,outcome,approval_id,issue_id,attempt_id,resolves_event_id,output_hash,manifest,reason,created_by,operation_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING created_at`,
        [
          id,
          p.workspace_id,
          quoteId,
          revisionId,
          sequence,
          fact.action,
          fact.outcome,
          fact.approval_id ?? null,
          fact.issue_id ?? null,
          fact.attempt_id ?? null,
          fact.resolves_event_id ?? null,
          fact.output_hash ?? null,
          fact.manifest ?? null,
          input.reason,
          p.actor_id,
          input.operation_id,
        ],
      )
    ).rows[0];
  return {
    id: revisionId,
    version: sequence,
    state: fact.outcome,
    updated_at: event.created_at,
    audit_details: {
      release_event_id: id,
      quote_id: quoteId,
      revision_id: revisionId,
      synthetic_only: true,
    },
  };
}
export async function prepareRelease(p: Principal, id: string, value: unknown) {
  const input = prepareInput(id, value);
  return sharedOperation(
    p,
    input,
    "QuoteRelease:Prepare",
    async (c) => {
      if (await recovered(c, p, input.id, input.operation_id)) return null;
      return releaseAuthority(c, p, id, "Prepare");
    },
    async (c, authorised) => {
      if (!authorised) throw unavailable();
      const preview = await releasePreview(c, p, id),
        history = await releaseHistory(c, p, authorised.q.quote_id);
      await guardExistingEstimateMutation(c, p, preview.e);
      expected(preview.header.version, input.expected_quote_version);
      expected(history.sequence, input.expected_release_sequence);
      if (preview.problems.length) releaseConflict(preview.problems.join(" "));
      if (preview.basis_hash !== input.basis_hash)
        releaseConflict(
          "The observed source, recipient or template changed. Compare the current preparation before saving a successor.",
        );
      const predecessor =
        history.events.filter((e) => e.action === "Issue").at(-1)?.id ?? null;
      if (input.predecessor_issue_id !== predecessor)
        releaseConflict(
          "Confirm the exact preceding issue before preparing its successor.",
        );
      const next = preview.header.version + 1;
      await c.query(
        "UPDATE ppo.draft_quotes SET version=$3,current_revision_id=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, preview.header.id, next, input.id, p.actor_id],
      );
      const t = preview.template;
      await c.query(
        `INSERT INTO ppo.draft_quote_revisions(id,workspace_id,company_id,quote_id,estimate_id,estimate_version_id,version,created_by,updated_by,choices,safe_snapshot,template_version,template_hash,input_html,input_hash,reason,template_definition)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          input.id,
          p.workspace_id,
          preview.e.company_id,
          preview.header.id,
          preview.e.id,
          preview.v.id,
          next,
          p.actor_id,
          JSON.stringify(authorised.q.choices),
          preview.snapshot,
          t.template_version,
          t.template_hash,
          t.html,
          t.input_hash,
          input.reason,
          t.template_definition,
        ],
      );
      await c.query(
        "INSERT INTO ppo.quote_release_bases(revision_id,workspace_id,company_id,quote_id,source_revision_id,predecessor_issue_id,basis,basis_hash,created_by,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          input.id,
          p.workspace_id,
          preview.e.company_id,
          preview.header.id,
          id,
          predecessor,
          preview.source,
          preview.source_hash,
          p.actor_id,
          input.operation_id,
        ],
      );
      await c.query(
        "INSERT INTO ppo.estimate_quote_jobs(id,workspace_id,revision_id,actor_id) VALUES($1,$2,$3,$4)",
        [randomUUID(), p.workspace_id, input.id, p.actor_id],
      );
      const result = await record(
        c,
        p,
        preview.header.id,
        input.id,
        history.sequence + 1,
        input,
        { action: "Prepare", outcome: "Prepared" },
      );
      await releaseAuthority(c, p, input.id, "Prepare");
      return result;
    },
    "DraftQuoteRevision",
    "QuotationReleaseRecorded",
  );
}
export async function approveRelease(p: Principal, id: string, value: unknown) {
  const input = approvalInput(id, value);
  return sharedOperation(
    p,
    input,
    "QuoteRelease:Approval",
    async (c) => {
      if (await recovered(c, p, id, input.operation_id)) return null;
      return releaseAuthority(c, p, id, "Approval");
    },
    async (c, authorised) => {
      if (!authorised) throw unavailable();
      const current = await requireCurrentRelease(c, p, id, "Approval"),
        history = await releaseHistory(c, p, current.q.quote_id);
      expected(current.source.header.version, input.expected_quote_version);
      expected(history.sequence, input.expected_release_sequence);
      if (
        [
          current.base.created_by,
          current.e.owner_id,
          current.q.created_by,
        ].includes(p.actor_id)
      )
        throw new AppError(
          403,
          "IndependentApprovalRequired",
          "The owner, author and preparer cannot approve their own synthetic release.",
        );
      if (
        history.events.some(
          (e) => e.revision_id === id && e.action === "Approval",
        )
      )
        releaseConflict(
          "This approval decision is immutable. Correct it through a new preparation.",
        );
      const output = await draftBytes(p, id),
        hash = releaseHash(output.manifest);
      if (hash !== input.output_hash)
        releaseConflict("Inspect the exact retained output before deciding.");
      const result = await record(
        c,
        p,
        current.q.quote_id,
        id,
        history.sequence + 1,
        input,
        {
          action: "Approval",
          outcome: input.outcome,
          manifest: output.manifest,
          output_hash: hash,
        },
      );
      await releaseAuthority(c, p, id, "Approval");
      return result;
    },
    "DraftQuoteRevision",
    "QuotationReleaseRecorded",
  );
}
export async function issueRelease(p: Principal, id: string, value: unknown) {
  const input = issueInput(id, value);
  return sharedOperation(
    p,
    input,
    "QuoteRelease:Issue",
    async (c) => {
      if (await recovered(c, p, id, input.operation_id)) return null;
      return releaseAuthority(c, p, id, "Issue");
    },
    async (c, authorised) => {
      if (!authorised) throw unavailable();
      const current = await requireCurrentRelease(c, p, id, "Issue"),
        history = await releaseHistory(c, p, current.q.quote_id);
      expected(current.source.header.version, input.expected_quote_version);
      expected(history.sequence, input.expected_release_sequence);
      const approval = history.events.find(
        (e) =>
          e.id === input.approval_id &&
          e.revision_id === id &&
          e.action === "Approval" &&
          e.outcome === "Approved",
      );
      if (!approval)
        releaseConflict(
          "An exact independent approval is required before issue.",
        );
      if (
        [
          current.base.created_by,
          current.e.owner_id,
          approval.created_by,
        ].includes(p.actor_id)
      )
        throw new AppError(
          403,
          "IndependentIssueRequired",
          "A separate synthetic issuer must issue the approved document.",
        );
      if (
        history.events.some((e) => e.revision_id === id && e.action === "Issue")
      )
        releaseConflict(
          "This exact revision has already been issued. Recover the original operation.",
        );
      const predecessor =
        history.events.filter((e) => e.action === "Issue").at(-1)?.id ?? null;
      if (predecessor !== current.base.predecessor_issue_id)
        releaseConflict(
          "The preceding issue changed. Prepare an explicit successor.",
        );
      const output = await draftBytes(p, id),
        hash = releaseHash(output.manifest);
      if (
        hash !== input.output_hash ||
        hash !== approval.output_hash ||
        releaseHash(approval.manifest) !== hash
      )
        releaseConflict("Issue only the exact approved original output.");
      const result = await record(
        c,
        p,
        current.q.quote_id,
        id,
        history.sequence + 1,
        input,
        {
          action: "Issue",
          outcome: "Issued",
          approval_id: approval.id,
          output_hash: hash,
          manifest: output.manifest,
        },
      );
      await releaseAuthority(c, p, id, "Issue");
      return result;
    },
    "DraftQuoteRevision",
    "QuotationReleaseRecorded",
  );
}
export async function recordDistribution(
  p: Principal,
  id: string,
  value: unknown,
) {
  const input = distributionInput(id, value);
  return sharedOperation(
    p,
    input,
    "QuoteRelease:Distribution",
    async (c) => {
      if (await recovered(c, p, id, input.operation_id)) return null;
      return releaseAuthority(c, p, id, "Distribution");
    },
    async (c, authorised) => {
      if (!authorised || !authorised.base) throw unavailable();
      const history = await releaseHistory(c, p, authorised.q.quote_id),
        header = (
          await c.query<{ version: number }>(
            "SELECT version FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, authorised.q.quote_id],
          )
        ).rows[0];
      expected(header.version, input.expected_quote_version);
      expected(history.sequence, input.expected_release_sequence);
      const issue = history.events.find(
        (e) =>
          e.id === input.issue_id &&
          e.revision_id === id &&
          e.action === "Issue",
      );
      if (!issue)
        releaseConflict("Record the simulation against an exact issue.");
      const previous = history.events
        .filter((e) => e.issue_id === issue.id)
        .at(-1);
      if (input.resolves_event_id) {
        if (
          previous?.id !== input.resolves_event_id ||
          previous.attempt_id !== input.attempt_id
        )
          releaseConflict(
            "Resolve the exact most recent attempt, preserving its identity.",
          );
      } else if (
        previous &&
        (previous.outcome !== "SimulatedFailed" ||
          previous.attempt_id === input.attempt_id)
      )
        releaseConflict(
          "Recover or resolve the original distribution before recording a new attempt.",
        );
      if (
        !input.resolves_event_id &&
        history.events.some((e) => e.attempt_id === input.attempt_id)
      )
        releaseConflict(
          "A retained distribution attempt identity cannot be reused as a new attempt.",
        );
      if (releaseHash((await draftBytes(p, id)).manifest) !== issue.output_hash)
        releaseConflict(
          "The original issued output must remain available for exact distribution evidence.",
        );
      const result = await record(
        c,
        p,
        authorised.q.quote_id,
        id,
        history.sequence + 1,
        input,
        {
          action: "Distribution",
          outcome: input.outcome,
          issue_id: issue.id,
          attempt_id: input.attempt_id,
          resolves_event_id: input.resolves_event_id,
        },
      );
      await releaseAuthority(c, p, id, "Distribution");
      return result;
    },
    "DraftQuoteRevision",
    "QuotationReleaseRecorded",
  );
}
