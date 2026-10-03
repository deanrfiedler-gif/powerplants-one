import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { object } from "../../shared/validation";
import {
  releaseAuthority,
  releasePreview,
  releaseHistory,
  releaseHash,
  requireCurrentRelease,
  type ReleaseEvent,
} from "./context";
import { releasePolicy } from "./policy";

export async function readRelease(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const { q, e, base } = await releaseAuthority(c, p, id),
      preview = await releasePreview(c, p, id),
      history = await releaseHistory(c, p, q.quote_id);
    const revisions = [];
    for (const revisionId of [
      ...new Set(history.events.map((e) => e.revision_id)),
    ]) {
      const old = await releaseAuthority(c, p, revisionId);
      revisions.push({
        id: old.q.id,
        version: old.q.version,
        estimate_version_id: old.q.estimate_version_id,
        created_at: old.q.created_at,
        predecessor_issue_id: old.base!.predecessor_issue_id,
      });
    }
    const job = (
      await c.query<{
        state: string;
        attempts: number;
        error_code: string | null;
        manifest: ReleaseEvent["manifest"];
      }>(
        "SELECT state,attempts,error_code,manifest FROM ppo.estimate_quote_jobs WHERE workspace_id=$1 AND revision_id=$2",
        [p.workspace_id, id],
      )
    ).rows[0];
    let current = true,
      hold: string | null = null;
    if (base)
      try {
        await requireCurrentRelease(c, p, id);
      } catch (error) {
        if (error instanceof AppError && error.status === 409) {
          current = false;
          hold = error.message;
        } else throw error;
      }
    if (
      base &&
      (preview.source_hash !== base.basis_hash ||
        preview.problems.length ||
        preview.header.current_revision_id !== id)
    ) {
      current = false;
      hold =
        preview.problems[0] ??
        "The source, recipient or current quotation revision changed; prepare a deliberate successor.";
    }
    const approval =
        history.events.find(
          (x) => x.revision_id === id && x.action === "Approval",
        ) ?? null,
      issue =
        history.events.find(
          (x) => x.revision_id === id && x.action === "Issue",
        ) ?? null;
    const can: {
      prepare: boolean;
      render: boolean;
      approve: boolean;
      issue: boolean;
      distribute: boolean;
    } = {
      render: false,
      prepare: false,
      approve: false,
      issue: false,
      distribute: false,
    };
    for (const [key, action] of [
      ["prepare", "Prepare"],
      ["approve", "Approval"],
      ["issue", "Issue"],
      ["distribute", "Distribution"],
    ] as const)
      try {
        await releaseAuthority(c, p, id, action);
        can[key] = true;
      } catch (error) {
        if (!(error instanceof AppError && [403, 404].includes(error.status)))
          throw error;
      }
    can.render = can.prepare;
    can.prepare =
      can.prepare &&
      !preview.problems.length &&
      preview.header.current_revision_id === id;
    can.approve =
      can.approve &&
      !!base &&
      current &&
      !approval &&
      job.state === "Ready" &&
      ![base.created_by, e.owner_id, q.created_by].includes(p.actor_id);
    can.issue =
      can.issue &&
      !!base &&
      current &&
      approval?.outcome === "Approved" &&
      !issue &&
      ![base.created_by, e.owner_id, approval.created_by].includes(p.actor_id);
    can.distribute = can.distribute && !!issue;
    await releaseAuthority(c, p, id);
    for (const v of revisions) await releaseAuthority(c, p, v.id);
    const safeEvent = (event: ReleaseEvent) => {
      const { manifest, ...rest } = event;
      return {
        ...rest,
        hashes: manifest
          ? { html: manifest.html_hash, pdf: manifest.pdf_hash }
          : null,
      };
    };
    return {
      revision: {
        id: q.id,
        quote_id: q.quote_id,
        version: q.version,
        estimate_id: q.estimate_id,
        estimate_version_id: q.estimate_version_id,
        snapshot: q.safe_snapshot,
        template_version: q.template_version,
      },
      policy: releasePolicy,
      base,
      sequence: history.sequence,
      quote_version: preview.header.version,
      preview: {
        basis_hash: preview.basis_hash,
        source: preview.source,
        problems: preview.problems,
        predecessor_issue_id:
          history.events.filter((e) => e.action === "Issue").at(-1)?.id ?? null,
      },
      job: {
        state: job.state,
        attempts: job.attempts,
        error_code: job.error_code,
        output_hash: job.manifest ? releaseHash(job.manifest) : null,
        hashes: job.manifest
          ? { html: job.manifest.html_hash, pdf: job.manifest.pdf_hash }
          : null,
      },
      current,
      hold,
      can,
      approval: approval ? safeEvent(approval) : null,
      issue: issue ? safeEvent(issue) : null,
      events: history.events.map(safeEvent),
      revisions,
      synthetic: true,
    };
  });
}
